const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
function schedulingModule(app,{db,auth,requireRole,settings,now=Date.now,onTeacherApproved}){
 db.exec(`CREATE TABLE IF NOT EXISTS teacher_accounts(user_id INTEGER PRIMARY KEY,teacher_id INTEGER UNIQUE,status TEXT NOT NULL DEFAULT 'pending',bio TEXT NOT NULL,subject TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,review_note TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS class_occurrences(id INTEGER PRIMARY KEY AUTOINCREMENT,class_id INTEGER NOT NULL,teacher_id INTEGER NOT NULL,starts_at INTEGER NOT NULL,ends_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'scheduled',created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS occurrence_teacher_time ON class_occurrences(teacher_id,starts_at,ends_at);
 CREATE TABLE IF NOT EXISTS booking_occurrences(booking_id INTEGER NOT NULL,occurrence_id INTEGER NOT NULL,PRIMARY KEY(booking_id,occurrence_id));`);
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}};
 app.get('/api/teacher/application',auth,requireRole('teacher'),(req,res)=>res.json({application:db.prepare('SELECT * FROM teacher_accounts WHERE user_id=?').get(req.user.id)||null}));
 const lifecycle=require('./lifecycle').lifecycleModule(app,{db,auth,requireRole,settings,now});
 const onboarding=require('./onboarding').onboardingModule(app,{db,auth,requireRole,settings,now});
 app.post('/api/teacher/application',auth,requireRole('teacher'),(req,res)=>res.status(422).json({error:'برای ارسال پرونده از فرم دوازده‌مرحله‌ای تدریس استفاده کنید.'}));
 app.get('/api/admin/teaching',auth,requireRole('admin'),(req,res)=>res.json({applicationSteps:onboarding.steps,agreement:onboarding.agreement(),applications:db.prepare('SELECT a.*,u.name,u.mobile FROM teacher_accounts a JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC').all().map(a=>({...a,submission:a.submission_id?onboarding.submission(a.submission_id):null})),teachers:db.prepare('SELECT id,name FROM teachers').all(),classes:db.prepare('SELECT id,title,teacher_id FROM classes').all(),occurrences:db.prepare('SELECT o.*,c.title FROM class_occurrences o JOIN classes c ON c.id=o.class_id ORDER BY starts_at DESC LIMIT 500').all()}));
 app.post('/api/admin/teaching/applications/:id/review',auth,requireRole('admin'),safe((req,res)=>{
  const {status,teacherId,version,note=''}=req.body||{};
  if(!['approved','rejected'].includes(status)||!Number.isInteger(version)||typeof note!=='string'||note.length>1000)fail('وضعیت یا نسخه پرونده نامعتبر است.');
  db.transaction(()=>{
   const row=db.prepare('SELECT * FROM teacher_accounts WHERE user_id=?').get(req.params.id);
   if(!row)fail('پرونده پیدا نشد.',404);
   if(row.version!==version)fail('پرونده تغییر کرده؛ دوباره دریافت کنید.',409);
   if(row.status==='approved')fail('تأیید قبلی را نمی‌توان از این مسیر تغییر داد؛ تعلیق نیاز به بررسی رزروهای فعال دارد.',409);
   if(status==='approved'){
    onboarding.validateReview(row);
    if(req.body?.profileVerified!==true)fail('تأیید بررسی همهٔ مراحل پرونده لازم است.');
    if(!Number.isInteger(teacherId)||!db.prepare('SELECT id FROM teachers WHERE id=?').get(teacherId))fail('یک پروفایل مدرس موجود را انتخاب کنید.');
    db.prepare('UPDATE teacher_accounts SET teacher_id=NULL WHERE teacher_id=? AND user_id!=? AND submission_id IS NULL').run(teacherId,row.user_id);
    if(db.prepare('SELECT user_id FROM teacher_accounts WHERE teacher_id=? AND user_id!=?').get(teacherId,row.user_id))fail('این پروفایل به حساب دیگری متصل است.',409);
   }
   if(status==='rejected'&&note.trim().length<10)fail('برای اصلاح پرونده توضیح حداقل ۱۰ نویسه لازم است.');
   db.prepare('UPDATE teacher_accounts SET status=?,teacher_id=?,review_note=?,version=version+1 WHERE user_id=?').run(status,status==='approved'?teacherId:null,note,row.user_id);
   if(status==='approved'&&onTeacherApproved)onTeacherApproved(row.user_id,{videoVerified:req.body?.videoVerified===true,actorId:req.user.id});
   settings.audit(req.user.id,'teacher.review',String(row.user_id),{status,teacherId:status==='approved'?teacherId:null});
  })();res.json({ok:true});
 }));
 app.get('/api/classes/:id/schedule',safe((req,res)=>{
  if(!db.prepare('SELECT id FROM classes WHERE id=?').get(req.params.id))fail('کلاس پیدا نشد.',404);
  res.json({timezone:'UTC',occurrences:db.prepare("SELECT o.id,o.starts_at,o.ends_at FROM class_occurrences o JOIN teacher_accounts a ON a.teacher_id=o.teacher_id AND a.status='approved' WHERE o.class_id=? AND o.status='scheduled' AND o.starts_at>? ORDER BY o.starts_at LIMIT 100").all(req.params.id,now())});
 }));
 app.post('/api/admin/teaching/occurrences',auth,requireRole('admin'),safe((req,res)=>{
  const {classId,startsAt,endsAt}=req.body||{};
  if(!Number.isSafeInteger(classId)||!Number.isSafeInteger(startsAt)||!Number.isSafeInteger(endsAt)||startsAt<=now()||startsAt>now()+366*86400000||endsAt-startsAt<15*60000||endsAt-startsAt>6*3600000)fail('زمان شروع باید در آینده و مدت جلسه بین ۱۵ دقیقه تا ۶ ساعت باشد.');
  const id=db.transaction(()=>{
   const cls=db.prepare('SELECT * FROM classes WHERE id=?').get(classId);if(!cls)fail('کلاس پیدا نشد.',404);
   if(!db.prepare("SELECT user_id FROM teacher_accounts WHERE teacher_id=? AND status='approved'").get(cls.teacher_id))fail('ابتدا حساب مدرس این کلاس باید توسط مدیر تأیید و متصل شود.',422);
   lifecycle.checkSlot(cls,startsAt,endsAt);
   const result=db.prepare('INSERT INTO class_occurrences(class_id,teacher_id,starts_at,ends_at,created_at) VALUES(?,?,?,?,?)').run(classId,cls.teacher_id,startsAt,endsAt,now());
   lifecycle.syncChat(classId);settings.audit(req.user.id,'schedule.create',String(result.lastInsertRowid),{classId,startsAt,endsAt});return Number(result.lastInsertRowid);
  })();res.json({id});
 }));
 app.post('/api/admin/teaching/occurrences/:id/cancel',auth,requireRole('admin'),safe((req,res)=>{
  db.transaction(()=>{
   const row=db.prepare('SELECT * FROM class_occurrences WHERE id=?').get(req.params.id);if(!row)fail('جلسه پیدا نشد.',404);
   if(db.prepare("SELECT b.id FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=? AND (b.status='confirmed' OR (b.status='held' AND b.hold_until>?))").get(row.id,now()))fail('این جلسه رزرو فعال دارد؛ لغو نیازمند روند بازپرداخت است و از این مسیر مجاز نیست.',409);
   db.prepare("UPDATE class_occurrences SET status='cancelled' WHERE id=?").run(row.id);lifecycle.syncChat(row.class_id);settings.audit(req.user.id,'schedule.cancel',String(row.id));
  })();res.json({ok:true});
 }));
 app.get('/api/teacher/schedule/classes',auth,requireRole('teacher'),safe((req,res)=>{
  const account=db.prepare('SELECT * FROM teacher_accounts WHERE user_id=?').get(req.user.id)||null;
  const classes=(account&&account.status==='approved'&&account.teacher_id)?db.prepare('SELECT id,title,mode,capacity,price FROM classes WHERE teacher_id=? ORDER BY id').all(account.teacher_id):[];
  res.json({account,classes});
 }));
 app.post('/api/teacher/schedule/occurrences',auth,requireRole('teacher'),safe((req,res)=>{
  const {classId,startsAt,endsAt}=req.body||{};
  if(!Number.isSafeInteger(classId)||!Number.isSafeInteger(startsAt)||!Number.isSafeInteger(endsAt)||startsAt<=now()||startsAt>now()+366*86400000||endsAt-startsAt<15*60000||endsAt-startsAt>6*3600000)fail('زمان شروع باید در آینده و مدت جلسه بین ۱۵ دقیقه تا ۶ ساعت باشد.');
  const id=db.transaction(()=>{
   const account=db.prepare("SELECT * FROM teacher_accounts WHERE user_id=? AND status='approved'").get(req.user.id);
   if(!account||!account.teacher_id)fail('حساب مدرس شما هنوز تأیید و به پروفایل متصل نشده است.',422);
   const cls=db.prepare('SELECT * FROM classes WHERE id=? AND teacher_id=?').get(classId,account.teacher_id);
   if(!cls)fail('کلاس متعلق به پروفایل شما پیدا نشد.',404);
   lifecycle.checkSlot(cls,startsAt,endsAt);
   const result=db.prepare('INSERT INTO class_occurrences(class_id,teacher_id,starts_at,ends_at,created_at) VALUES(?,?,?,?,?)').run(classId,cls.teacher_id,startsAt,endsAt,now());
   lifecycle.syncChat(classId);settings.audit(req.user.id,'teacher.schedule.create',String(result.lastInsertRowid),{classId,startsAt,endsAt});return Number(result.lastInsertRowid);
  })();res.json({id});
 }));
 app.post('/api/teacher/schedule/occurrences/:id/cancel',auth,requireRole('teacher'),safe((req,res)=>{
  db.transaction(()=>{
   const account=db.prepare("SELECT * FROM teacher_accounts WHERE user_id=? AND status='approved'").get(req.user.id);
   if(!account||!account.teacher_id)fail('حساب مدرس شما هنوز تأیید نشده است.',422);
   const row=db.prepare('SELECT * FROM class_occurrences WHERE id=? AND teacher_id=?').get(req.params.id,account.teacher_id);
   if(!row)fail('جلسه پیدا نشد.',404);
   if(db.prepare("SELECT b.id FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=? AND (b.status='confirmed' OR (b.status='held' AND b.hold_until>?))").get(row.id,now()))fail('این جلسه رزرو فعال دارد؛ لغو نیازمند روند بازپرداخت یا تغییر زمان توافقی است.',409);
   db.prepare("UPDATE class_occurrences SET status='cancelled' WHERE id=?").run(row.id);lifecycle.syncChat(row.class_id);settings.audit(req.user.id,'teacher.schedule.cancel',String(row.id));
  })();res.json({ok:true});
 }));
 app.get('/api/schedule/mine',auth,(req,res)=>{
  res.json({occurrences:db.prepare(`SELECT o.*,c.title,b.id booking_id FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id JOIN class_occurrences o ON o.id=bo.occurrence_id JOIN classes c ON c.id=o.class_id WHERE b.user_id=? AND b.status='confirmed' ORDER BY o.starts_at LIMIT 200`).all(req.user.id)});
 });
 return {
  validate(body,cls,userId){
   const ids=body.occurrenceIds;
   if(!Array.isArray(ids)||ids.length!==(body.sessions||1)||ids.some(id=>!Number.isSafeInteger(id))||new Set(ids).size!==ids.length)fail('به تعداد جلسات رزرو، زمان معتبر انتخاب کنید.');
   if(!db.prepare("SELECT user_id FROM teacher_accounts WHERE teacher_id=? AND status='approved'").get(cls.teacher_id))fail('حساب مدرس هنوز تأیید نشده است.',422);
   for(const id of ids){const o=db.prepare("SELECT * FROM class_occurrences WHERE id=? AND class_id=? AND status='scheduled' AND starts_at>?").get(id,cls.id,now());if(!o)fail('یکی از زمان‌ها دیگر قابل رزرو نیست؛ برنامه را تازه کنید.',409);if(db.prepare("SELECT 1 FROM schedule_proposals WHERE occurrence_id=? AND status='pending' AND expires_at>?").get(id,now()))fail('این جلسه در انتظار توافق تغییر زمان است؛ فعلاً قابل رزرو نیست.',409);
    if(userId)lifecycle.checkStudentSlot(userId,o.starts_at,o.ends_at,cls.mode);}
   return ids;
  },
  attach(bookingId,ids){for(const id of ids)db.prepare('INSERT INTO booking_occurrences(booking_id,occurrence_id) VALUES(?,?)').run(bookingId,id);},
  teacherIdFor(user){return db.prepare("SELECT teacher_id FROM teacher_accounts WHERE user_id=? AND status='approved'").get(user.id)?.teacher_id||null;},
 };
}
module.exports={schedulingModule};
