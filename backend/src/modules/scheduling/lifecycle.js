const crypto=require('node:crypto');
const fail=(m,s=400)=>{throw Object.assign(new Error(m),{status:s});};
function lifecycleModule(app,{db,auth,requireRole,settings,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS schedule_batches(key TEXT PRIMARY KEY,request_hash TEXT NOT NULL,ids_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS schedule_proposals(id TEXT PRIMARY KEY,occurrence_id INTEGER NOT NULL,old_start INTEGER NOT NULL,old_end INTEGER NOT NULL,starts_at INTEGER NOT NULL,ends_at INTEGER NOT NULL,status TEXT NOT NULL,reason TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS schedule_one_pending ON schedule_proposals(occurrence_id) WHERE status='pending';
 CREATE TABLE IF NOT EXISTS schedule_votes(proposal_id TEXT NOT NULL,user_id INTEGER NOT NULL,decision TEXT NOT NULL DEFAULT 'pending',PRIMARY KEY(proposal_id,user_id));`);
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}},admin=[auth,requireRole('admin')];
 function times(start,end){if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<=now()||start>now()+366*86400000||end-start<900000||end-start>21600000)fail('زمان آینده و مدت ۱۵ دقیقه تا شش ساعت لازم است.');}
 function checkSlot(cls,start,end,except=-1){
  const buffer=settings.get('scheduling').config.travelBufferMinutes*60000;
  const rows=db.prepare("SELECT o.*,c.mode FROM class_occurrences o JOIN classes c ON c.id=o.class_id WHERE o.teacher_id=? AND o.status='scheduled' AND o.id!=?").all(cls.teacher_id,except);
  for(const o of rows){const b=(['حضوری','in-person'].includes(cls.mode)||['حضوری','in-person'].includes(o.mode))?buffer:0;if(o.starts_at<end+b&&o.ends_at>start-b)fail('زمان با برنامه یا فاصلهٔ رفت‌وآمد مدرس تداخل دارد.',409);}
 }
 function checkStudentSlot(uid,start,end,mode,except=-1){
  const buffer=settings.get('scheduling').config.travelBufferMinutes*60000;
  const rows=db.prepare("SELECT o.starts_at,o.ends_at,c.mode FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id JOIN class_occurrences o ON o.id=bo.occurrence_id JOIN classes c ON c.id=o.class_id WHERE b.user_id=? AND o.id!=? AND o.status='scheduled' AND (b.status='confirmed' OR (b.status='held' AND b.hold_until>?))").all(uid,except,now());
  for(const o of rows){const b=(['حضوری','in-person'].includes(mode)||['حضوری','in-person'].includes(o.mode))?buffer:0;if(o.starts_at<end+b&&o.ends_at>start-b)fail('زمان با رزرو یا فاصلهٔ رفت‌وآمد شاگرد تداخل دارد.',409);}
 }
 function syncChat(classId){
  if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='chat_rooms'").get())return;
  const end=db.prepare("SELECT MAX(ends_at) t FROM class_occurrences WHERE class_id=? AND status='scheduled'").get(classId).t;
  db.prepare("UPDATE chat_rooms SET closes_at=? WHERE source_key=?").run(end?end+72*3600000:now(),`class:${classId}`);
 }
 function expire(){db.prepare("UPDATE schedule_proposals SET status='expired' WHERE status='pending' AND expires_at<=?").run(now());}
 app.get('/api/calendar',auth,safe((req,res)=>{
  expire();const from=Number(req.query.from||now()-30*86400000),to=Number(req.query.to||now()+90*86400000),offset=Number(req.query.offset||0);
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||to<=from||to-from>366*86400000||!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('بازهٔ تقویم حداکثر یک سال است.');
  const rows=db.prepare(`SELECT DISTINCT o.*,c.title,c.mode,t.name teacher_name FROM class_occurrences o JOIN classes c ON c.id=o.class_id JOIN teachers t ON t.id=o.teacher_id WHERE o.starts_at>=? AND o.starts_at<? AND (?='admin' OR EXISTS(SELECT 1 FROM teacher_accounts a WHERE a.teacher_id=o.teacher_id AND a.user_id=? AND a.status='approved') OR EXISTS(SELECT 1 FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=o.id AND b.user_id=? AND b.status='confirmed' AND b.schema_version=2)) ORDER BY o.starts_at,o.id LIMIT 101 OFFSET ?`).all(from,to,req.user.role,req.user.id,req.user.id,offset);
  const changes=db.prepare("SELECT p.*,v.decision FROM schedule_proposals p JOIN schedule_votes v ON v.proposal_id=p.id WHERE v.user_id=? AND p.status='pending' ORDER BY p.created_at").all(req.user.id);
  res.json({timezone:'Asia/Tehran',occurrences:rows.slice(0,100),hasMore:rows.length>100,changes});
 }));
 app.post('/api/admin/schedule/batches',...admin,safe((req,res)=>{
  const {classId,occurrences,key}=req.body||{};
  if(!Number.isSafeInteger(classId)||!Array.isArray(occurrences)||!occurrences.length||occurrences.length>52||!/^[a-zA-Z0-9_-]{16,100}$/.test(key||''))fail('کلاس، حداکثر ۵۲ جلسه و شناسهٔ یکتا لازم است.');
  const hash=crypto.createHash('sha256').update(JSON.stringify({classId,occurrences})).digest('hex');
  const ids=db.transaction(()=>{const old=db.prepare('SELECT * FROM schedule_batches WHERE key=?').get(key);if(old){if(old.request_hash!==hash)fail('شناسهٔ تکراری برای برنامهٔ متفاوت.',409);return JSON.parse(old.ids_json);}
   const cls=db.prepare('SELECT * FROM classes WHERE id=?').get(classId);if(!cls)fail('کلاس پیدا نشد.',404);
   if(!db.prepare("SELECT 1 FROM teacher_accounts WHERE teacher_id=? AND status='approved'").get(cls.teacher_id))fail('مدرس باید تأیید شده باشد.',422);
   const created=[];for(const o of occurrences){times(o.startsAt,o.endsAt);checkSlot(cls,o.startsAt,o.endsAt);created.push(Number(db.prepare('INSERT INTO class_occurrences(class_id,teacher_id,starts_at,ends_at,created_at) VALUES(?,?,?,?,?)').run(cls.id,cls.teacher_id,o.startsAt,o.endsAt,now()).lastInsertRowid));}
   db.prepare('INSERT INTO schedule_batches VALUES(?,?,?)').run(key,hash,JSON.stringify(created));syncChat(cls.id);settings.audit(req.user.id,'schedule.batch',String(cls.id),{ids:created});return created;
  })();res.json({ids});
 }));
 app.post('/api/admin/schedule/:id/proposals',...admin,safe((req,res)=>{
  const {startsAt,endsAt,reason}=req.body||{};times(startsAt,endsAt);if(typeof reason!=='string'||reason.trim().length<10||reason.length>1000)fail('دلیل تغییر حداقل ۱۰ نویسه لازم است.');
  const result=db.transaction(()=>{expire();const o=db.prepare("SELECT * FROM class_occurrences WHERE id=? AND status='scheduled'").get(req.params.id);if(!o)fail('جلسه پیدا نشد.',404);if(o.starts_at<=now())fail('جلسهٔ شروع‌شده قابل جابه‌جایی نیست.',409);
   if(db.prepare("SELECT 1 FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=? AND b.status='held' AND b.hold_until>?").get(o.id,now()))fail('پرداخت در جریان است؛ پس از پایان مهلت دوباره تلاش کنید.',409);
   if(db.prepare("SELECT 1 FROM schedule_proposals WHERE occurrence_id=? AND status='pending'").get(o.id))fail('پیشنهاد باز برای این جلسه وجود دارد.',409);
   const cls=db.prepare('SELECT * FROM classes WHERE id=?').get(o.class_id);checkSlot(cls,startsAt,endsAt,o.id);
   const users=db.prepare("SELECT DISTINCT b.user_id FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=? AND b.status='confirmed'").all(o.id).map(u=>u.user_id);
   const teacher=db.prepare("SELECT user_id FROM teacher_accounts WHERE teacher_id=? AND status='approved'").get(o.teacher_id);if(!teacher)fail('مدرس تأییدشده پیدا نشد.',422);users.push(teacher.user_id);
   const id=crypto.randomUUID();db.prepare("INSERT INTO schedule_proposals VALUES(?,?,?,?,?,?,'pending',?,?,?)").run(id,o.id,o.starts_at,o.ends_at,startsAt,endsAt,reason.trim(),Math.min(now()+48*3600000,o.starts_at,startsAt),now());for(const uid of new Set(users))db.prepare('INSERT INTO schedule_votes(proposal_id,user_id) VALUES(?,?)').run(id,uid);settings.audit(req.user.id,'schedule.proposed',id,{occurrenceId:o.id});return {id};
  })();res.json(result);
 }));
 app.post('/api/schedule/proposals/:id/respond',auth,safe((req,res)=>{
  const decision=req.body?.decision;if(!['accepted','rejected'].includes(decision))fail('پذیرش یا رد لازم است.');
  const status=db.transaction(()=>{expire();const p=db.prepare('SELECT p.*,v.decision FROM schedule_proposals p JOIN schedule_votes v ON v.proposal_id=p.id WHERE p.id=? AND v.user_id=?').get(req.params.id,req.user.id);if(!p)fail('پیشنهاد پیدا نشد.',404);if(p.decision===decision)return p.status;if(p.status!=='pending'||p.decision!=='pending')fail('پیشنهاد بسته شده است.',409);
   db.prepare('UPDATE schedule_votes SET decision=? WHERE proposal_id=? AND user_id=?').run(decision,p.id,req.user.id);
   let next='pending';if(decision==='rejected')next='rejected';else if(!db.prepare("SELECT 1 FROM schedule_votes WHERE proposal_id=? AND decision!='accepted'").get(p.id)){
    const o=db.prepare('SELECT * FROM class_occurrences WHERE id=?').get(p.occurrence_id);if(o.status!=='scheduled'||o.starts_at!==p.old_start||o.ends_at!==p.old_end)fail('برنامه تغییر کرده است.',409);times(p.starts_at,p.ends_at);const cls=db.prepare('SELECT * FROM classes WHERE id=?').get(o.class_id);checkSlot(cls,p.starts_at,p.ends_at,o.id);
    for(const v of db.prepare('SELECT user_id FROM schedule_votes WHERE proposal_id=?').all(p.id))checkStudentSlot(v.user_id,p.starts_at,p.ends_at,cls.mode,o.id);
    db.prepare('UPDATE class_occurrences SET starts_at=?,ends_at=? WHERE id=?').run(p.starts_at,p.ends_at,o.id);syncChat(o.class_id);next='applied';
   }
   db.prepare('UPDATE schedule_proposals SET status=? WHERE id=?').run(next,p.id);settings.audit(req.user.id,'schedule.response',p.id,{decision,status:next});return next;
  })();res.json({status});
 }));
 return {checkSlot,checkStudentSlot,syncChat};
}
module.exports={lifecycleModule};
