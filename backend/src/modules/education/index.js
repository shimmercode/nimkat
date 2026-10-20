const crypto=require('node:crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const scopesAllowed=['schedule','reports','files'];
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const safe=fn=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
function educationModule(app,{db,auth,requireRole,settings,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS parent_invitations(id TEXT PRIMARY KEY,student_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,scopes TEXT NOT NULL,expires_at INTEGER NOT NULL,used_at INTEGER,revoked_at INTEGER,created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS parent_invites_student ON parent_invitations(student_id,created_at);
 CREATE TABLE IF NOT EXISTS parent_links(id TEXT PRIMARY KEY,parent_id INTEGER NOT NULL,student_id INTEGER NOT NULL,scopes TEXT NOT NULL,status TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,revoked_at INTEGER);
 CREATE UNIQUE INDEX IF NOT EXISTS parent_link_active ON parent_links(parent_id,student_id) WHERE status='active';
 CREATE INDEX IF NOT EXISTS parent_link_student ON parent_links(student_id,status);`);
 function canRead(parentId,studentId,scope){const link=db.prepare("SELECT scopes FROM parent_links WHERE parent_id=? AND student_id=? AND status='active'").get(parentId,studentId);return !!link&&JSON.parse(link.scopes).includes(scope);}
 function reports(uid){return db.prepare('SELECT a.occurrence_id,a.scores,a.average,a.created_at,c.title,u.name teacher_name FROM loyalty_academic a JOIN class_occurrences o ON o.id=a.occurrence_id JOIN classes c ON c.id=o.class_id JOIN users u ON u.id=a.teacher_id WHERE a.student_id=? ORDER BY a.created_at DESC,a.occurrence_id DESC LIMIT 100').all(uid).map(r=>({...r,scores:JSON.parse(r.scores)}));}
 app.get('/api/family',auth,safe((req,res)=>{
  if(!['student','parent'].includes(req.user.role))fail('این بخش مخصوص شاگرد و والد است.',403);
  const parent=req.user.role==='parent',offset=Number(req.query.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('صفحه نامعتبر است.');
  const links=db.prepare(`SELECT l.id,l.scopes,l.status,l.version,l.created_at,u.name,${parent?'l.student_id':'l.parent_id'} user_id FROM parent_links l JOIN users u ON u.id=${parent?'l.student_id':'l.parent_id'} WHERE ${parent?'l.parent_id':'l.student_id'}=? ORDER BY CASE l.status WHEN 'active' THEN 0 ELSE 1 END,l.created_at DESC,l.id LIMIT 51 OFFSET ?`).all(req.user.id,offset);
  res.json({links:links.slice(0,50).map(l=>({...l,scopes:JSON.parse(l.scopes)})),hasMore:links.length>50,invitations:parent?[]:db.prepare('SELECT id,scopes,expires_at,used_at,revoked_at FROM parent_invitations WHERE student_id=? ORDER BY created_at DESC,id LIMIT 30').all(req.user.id).map(l=>({...l,scopes:JSON.parse(l.scopes)}))});
 }));
 app.post('/api/family/invitations',auth,requireRole('student'),safe((req,res)=>{
  const {scopes,consent}=req.body||{};if(consent!==true||!Array.isArray(scopes)||!scopes.length||scopes.length>3||new Set(scopes).size!==scopes.length||scopes.some(s=>!scopesAllowed.includes(s)))fail('اجازهٔ صریح و حداقل یک دسترسی معتبر لازم است.');
  const token=crypto.randomBytes(24).toString('base64url'),id=crypto.randomUUID(),expiresAt=now()+30*60000;
  db.transaction(()=>{if(db.prepare('SELECT COUNT(*) n FROM parent_invitations WHERE student_id=? AND created_at>?').get(req.user.id,now()-3600000).n>=10)fail('در هر ساعت حداکثر ۱۰ دعوت خانواده قابل ساخت است؛ بعداً تلاش کنید.',429);db.prepare('UPDATE parent_invitations SET revoked_at=? WHERE student_id=? AND used_at IS NULL AND revoked_at IS NULL').run(now(),req.user.id);db.prepare('INSERT INTO parent_invitations(id,student_id,token_hash,scopes,expires_at,created_at) VALUES(?,?,?,?,?,?)').run(id,req.user.id,digest(token),JSON.stringify(scopes),expiresAt,now());settings.audit(req.user.id,'family.invitation',id,{scopes});})();res.status(201).json({id,token,expiresAt});
 }));
 app.post('/api/family/invitations/:id/revoke',auth,requireRole('student'),safe((req,res)=>{const r=db.prepare('UPDATE parent_invitations SET revoked_at=COALESCE(revoked_at,?) WHERE id=? AND student_id=?').run(now(),req.params.id,req.user.id);if(!r.changes)fail('دعوت پیدا نشد.',404);settings.audit(req.user.id,'family.invitation.revoked',req.params.id);res.json({ok:true});}));
 app.post('/api/family/accept',auth,requireRole('parent'),safe((req,res)=>{
  const token=req.body?.token;if(typeof token!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(token))fail('کد دعوت معتبر نیست.');
  const id=db.transaction(()=>{const i=db.prepare('SELECT * FROM parent_invitations WHERE token_hash=? AND used_at IS NULL AND revoked_at IS NULL AND expires_at>?').get(digest(token),now());if(!i)fail('دعوت معتبر نیست یا مصرف/منقضی شده است.',409);
   if(db.prepare("SELECT id FROM parent_links WHERE parent_id=? AND student_id=? AND status='active'").get(req.user.id,i.student_id))fail('دسترسی فعال وجود دارد؛ برای تغییر اجازه، ابتدا آن را لغو کنید.',409);
   const id=crypto.randomUUID();db.prepare("INSERT INTO parent_links(id,parent_id,student_id,scopes,status,created_at) VALUES(?,?,?,?,'active',?)").run(id,req.user.id,i.student_id,i.scopes,now());db.prepare('UPDATE parent_invitations SET used_at=? WHERE id=?').run(now(),i.id);settings.audit(req.user.id,'family.accepted',id,{studentId:i.student_id});return id;
  })();res.status(201).json({id});
 }));
 app.post('/api/family/links/:id/revoke',auth,safe((req,res)=>{const {version}=req.body||{};if(!Number.isSafeInteger(version))fail('نسخهٔ دسترسی لازم است.');db.transaction(()=>{const l=db.prepare('SELECT * FROM parent_links WHERE id=? AND (student_id=? OR parent_id=?)').get(req.params.id,req.user.id,req.user.id);if(!l)fail('دسترسی پیدا نشد.',404);if(l.version!==version||l.status!=='active')fail('دسترسی تغییر کرده؛ صفحه را تازه کنید.',409);db.prepare("UPDATE parent_links SET status='revoked',version=version+1,revoked_at=? WHERE id=?").run(now(),l.id);settings.audit(req.user.id,'family.revoked',l.id);})();res.json({ok:true});}));
 app.get('/api/parent/students/:id',auth,requireRole('parent'),safe((req,res)=>{
  const uid=Number(req.params.id);if(!Number.isSafeInteger(uid)||uid<1)fail('شاگرد پیدا نشد.',404);const l=db.prepare("SELECT scopes FROM parent_links WHERE parent_id=? AND student_id=? AND status='active'").get(req.user.id,uid);if(!l)fail('دسترسی به این شاگرد وجود ندارد.',404);const scopes=JSON.parse(l.scopes);
  const occurrences=scopes.includes('schedule')?db.prepare("SELECT DISTINCT o.id,o.starts_at,o.ends_at,o.status,c.title,c.mode,t.name teacher_name FROM class_occurrences o JOIN booking_occurrences bo ON bo.occurrence_id=o.id JOIN bookings b ON b.id=bo.booking_id JOIN classes c ON c.id=o.class_id JOIN teachers t ON t.id=o.teacher_id WHERE b.user_id=? AND b.status='confirmed' AND b.schema_version=2 ORDER BY o.starts_at DESC LIMIT 100").all(uid):[];
  res.json({student:db.prepare('SELECT id,name FROM users WHERE id=?').get(uid),scopes,occurrences,reports:scopes.includes('reports')?reports(uid):[]});
 }));
 return {canRead,reports};
}
module.exports={educationModule};
