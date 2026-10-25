const crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const safe=fn=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
function guestSupport(app,{db,auth,requireRole,settings}){
 db.exec(`CREATE TABLE IF NOT EXISTS support_guests(id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL,token_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'bot',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS support_guest_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until_at INTEGER NOT NULL);`);
 const rate=(key,max,ms)=>db.transaction(()=>{db.prepare('DELETE FROM support_guest_limits WHERE until_at<?').run(Date.now());const r=db.prepare('SELECT * FROM support_guest_limits WHERE key=?').get(key);if(r&&r.count>=max)fail('درخواست‌ها زیاد است؛ چند دقیقه بعد تلاش کنید.',429);db.prepare('INSERT INTO support_guest_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,Date.now()+ms);})();
 const events=id=>db.prepare('SELECT id,kind,text,created_at FROM support_posts WHERE thread_id=? ORDER BY id DESC LIMIT 50').all(id).reverse();
 const view=r=>({id:r.id,name:r.name,status:r.status,created_at:r.created_at,guest:true});
 function guest(req){const row=db.prepare('SELECT * FROM support_guests WHERE id=?').get(req.params.id),token=req.get('X-Support-Token')||'';if(!row||row.expires_at<Date.now()||token.length!==43||!crypto.timingSafeEqual(Buffer.from(hash(token)),Buffer.from(row.token_hash)))fail('دسترسی گفتگو منقضی شده؛ گفتگوی تازه شروع کنید.',401);return row;}
 function post(id,kind,text,clientId,author=null){db.prepare('INSERT INTO support_posts(thread_id,kind,text,created_at,client_id,author_id) VALUES(?,?,?,?,?,?)').run(id,kind,text,Date.now(),clientId||null,author);}
 app.use('/api/support/guest',(req,res,next)=>{res.set('Cache-Control','no-store');next();});
 app.post('/api/support/guest/start',safe((req,res)=>{
  if(!settings.get('support').config.enabled)fail('گفتگو فعلاً غیرفعال است.',503);
  db.transaction(()=>{const cutoff=Date.now()-30*86400000;db.prepare('DELETE FROM support_posts WHERE thread_id IN(SELECT id FROM support_guests WHERE created_at<?)').run(cutoff);db.prepare('DELETE FROM support_guests WHERE created_at<?').run(cutoff);})();
  rate(`start:${hash(req.ip||'unknown')}`,10,3600000);
  const phone=String(req.body?.phone||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s-]/g,''),name=String(req.body?.name||'مهمان نیمکت').trim();
  if(!/^09\d{9}$/.test(phone)||name.length<2||name.length>80||req.body?.consent!==true)fail('شماره معتبر و موافقت با ثبت مکالمه لازم است.');
  const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('base64url');db.prepare('INSERT INTO support_guests(id,name,phone,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?)').run(id,name,phone,hash(token),Date.now()+86400000,Date.now());
  post(id,'bot',`سلام ${name}! من دستیار هوشمند نیمکت هستم. برای پیدا کردن کلاس، راهنمای ورود یا پیگیری درخواست کمکتان می‌کنم. شمارهٔ ثبت‌شده فقط برای تماس است و احراز هویت نشده؛ اطلاعات حساب را در این گفتگو منتشر نمی‌کنیم.`);
  settings.audit(null,'support.guest_start',id);res.status(201).json({thread:{id,status:'bot',guest:true},token,expiresIn:86400});
 }));
 app.get('/api/support/guest/threads/:id',safe((req,res)=>{const row=guest(req);res.json({thread:view(row),messages:events(row.id),hasMore:false});}));
 const busy=new Set();
 app.post('/api/support/guest/threads/:id/messages',safe(async(req,res)=>{
  const row=guest(req),text=String(req.body?.text||'').trim(),clientId=req.body?.clientId;
  if(!text||text.length>2000||!/^[a-zA-Z0-9_-]{16,100}$/.test(clientId||''))fail('پیام یا شناسهٔ ارسال نامعتبر است.');
  const old=db.prepare('SELECT * FROM support_posts WHERE thread_id=? AND client_id=?').get(row.id,clientId);if(old){if(old.kind!=='user'||old.text!==text)fail('شناسهٔ ارسال تکراری است.',409);return res.json({ok:true});}
  if(row.status==='closed')fail('گفتگو بسته شده است.',409);if(!settings.get('support').config.enabled)fail('پشتیبانی فعلاً غیرفعال است.',503);
  rate(`message-ip:${hash(req.ip||'unknown')}`,60,60000);rate(`message:${row.id}`,10,60000);if(busy.has(row.id))fail('منتظر پاسخ قبلی بمانید.',429);busy.add(row.id);
  try{post(row.id,'user',text,clientId);if(row.status==='bot'){const textAnswer=await require('./answer')({db,settings,text});if(db.prepare('SELECT status FROM support_guests WHERE id=?').get(row.id).status==='bot')post(row.id,'bot',textAnswer);}res.json({ok:true});}finally{busy.delete(row.id);}
 }));
 app.post('/api/support/guest/threads/:id/escalate',safe((req,res)=>{const row=guest(req);if(row.status==='closed')fail('گفتگو بسته شده است.',409);if(row.status==='bot')db.prepare("UPDATE support_guests SET status='waiting' WHERE id=?").run(row.id);res.json({ok:true,message:'پیام شما در صف بررسی کارشناس قرار گرفت. پاسخ فوری تضمین نمی‌شود.'});}));
 app.get('/api/admin/support/guests',auth,requireRole('admin'),(req,res)=>res.json({threads:db.prepare("SELECT id,name,phone,status,created_at,1 guest,(SELECT text FROM support_posts p WHERE p.thread_id=g.id ORDER BY p.id DESC LIMIT 1) preview FROM support_guests g ORDER BY created_at DESC LIMIT 100").all()}));
 app.get('/api/admin/support/guests/:id',auth,requireRole('admin'),safe((req,res)=>{const row=db.prepare('SELECT * FROM support_guests WHERE id=?').get(req.params.id);if(!row)fail('گفتگو پیدا نشد.',404);res.json({thread:{...view(row),phone:row.phone},messages:events(row.id),hasMore:false});}));
 app.post('/api/admin/support/guests/:id/reply',auth,requireRole('admin'),safe((req,res)=>{
  const row=db.prepare('SELECT * FROM support_guests WHERE id=?').get(req.params.id),text=String(req.body?.text||'').trim(),clientId=req.body?.clientId;
  if(!row)fail('گفتگو پیدا نشد.',404);if(!text||text.length>4000||!/^[a-zA-Z0-9_-]{16,100}$/.test(clientId||''))fail('پاسخ نامعتبر است.');
  const old=db.prepare('SELECT * FROM support_posts WHERE thread_id=? AND client_id=?').get(row.id,clientId);if(old){if(old.kind!=='agent'||old.author_id!==req.user.id||old.text!==text)fail('شناسه تکراری است.',409);return res.json({ok:true});}
  if(row.status==='closed')fail('گفتگو بسته شده است.',409);
  db.transaction(()=>{post(row.id,'agent',text,clientId,req.user.id);db.prepare('UPDATE support_guests SET status=? WHERE id=?').run(req.body.close===true?'closed':'human',row.id);settings.audit(req.user.id,'support.guest_reply',row.id);})();res.json({ok:true});
 }));
}
module.exports={guestSupport};
