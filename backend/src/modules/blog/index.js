const crypto=require('node:crypto');
const slugOK=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)&&s.length<=120;
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}};
function validate(b){
 if(!b||!slugOK(b.slug))fail('شناسهٔ انگلیسی مقاله نامعتبر است.');
 for(const [key,min,max] of [['title',5,160],['excerpt',20,400],['category',2,80],['author',2,100],['seoTitle',0,70],['seoDescription',0,180],['coverAlt',0,200]])if(typeof b[key]!=='string'||b[key].trim().length<min||b[key].length>max)fail(`فیلد ${key} نامعتبر است.`);
 if(!['study','learning','parents','planning'].includes(b.cover))fail('طرح جلد نامعتبر است.');
 if(!Array.isArray(b.tags)||b.tags.length>8||b.tags.some(t=>typeof t!=='string'||t.length<2||t.length>40))fail('برچسب‌ها نامعتبرند.');
 if(!Array.isArray(b.sections)||!b.sections.length||b.sections.length>40)fail('مقاله باید بین ۱ تا ۴۰ بخش داشته باشد.');
 for(const x of b.sections)if(!x||typeof x.heading!=='string'||x.heading.length<2||x.heading.length>160||typeof x.text!=='string'||x.text.length<20||x.text.length>12000||!['text','tip','quote'].includes(x.type))fail('عنوان یا متن بخش نامعتبر است.');
 if(!Array.isArray(b.faq)||b.faq.length>10||b.faq.some(x=>typeof x.question!=='string'||x.question.length<5||x.question.length>200||typeof x.answer!=='string'||x.answer.length<10||x.answer.length>2000))fail('پرسش‌های متداول نامعتبرند.');
 return Object.fromEntries(['slug','title','excerpt','category','author','seoTitle','seoDescription','cover','coverAlt','tags','sections','faq'].map(k=>[k,typeof b[k]==='string'?b[k].trim():b[k]]));
}
function blogModule(app,{db,auth,requireRole,settings}){
 db.exec(`CREATE TABLE IF NOT EXISTS blog_posts(id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,draft_json TEXT NOT NULL,live_json TEXT,version INTEGER NOT NULL DEFAULT 1,published_at INTEGER,updated_at INTEGER NOT NULL);`);
 const publicPost=row=>row?.live_json?{...JSON.parse(row.live_json),id:row.id,publishedAt:row.published_at,updatedAt:JSON.parse(row.live_json).updatedAt}:null;
 app.get('/api/blog',(req,res)=>{
  const q=String(req.query.q||'').trim().slice(0,100),category=String(req.query.category||'').slice(0,80),page=Math.max(1,Math.min(10000,Math.floor(Number(req.query.page))||1));
  const all=db.prepare('SELECT * FROM blog_posts WHERE live_json IS NOT NULL ORDER BY published_at DESC,id').all().map(publicPost);
  const categories=[...new Set(all.map(p=>p.category))];
  const found=all.filter(p=>(!category||p.category===category)&&(!q||`${p.title} ${p.excerpt} ${p.tags.join(' ')}`.includes(q)));
  res.json({posts:found.slice((page-1)*9,page*9).map(({sections,faq,...p})=>({...p,readingMinutes:Math.max(1,Math.ceil(sections.map(s=>s.text).join(' ').split(/\s+/).length/180))})),total:found.length,page,pages:Math.ceil(found.length/9),categories});
 });
 app.get('/api/blog/feed',(req,res)=>res.json({posts:db.prepare('SELECT * FROM blog_posts WHERE live_json IS NOT NULL ORDER BY published_at DESC,id LIMIT 1000').all().map(publicPost)}));
 app.get('/api/blog/:slug',(req,res)=>{const p=publicPost(db.prepare('SELECT * FROM blog_posts WHERE slug=? AND live_json IS NOT NULL').get(req.params.slug));if(!p)return res.status(404).json({error:'مقاله پیدا نشد.'});res.json({post:p});});
 app.get('/api/admin/blog',auth,requireRole('admin'),(req,res)=>res.json({posts:db.prepare('SELECT * FROM blog_posts ORDER BY updated_at DESC').all().map(r=>({id:r.id,...JSON.parse(r.draft_json),version:r.version,status:r.live_json?'published':'draft',publishedAt:r.published_at}))}));
 app.post('/api/admin/blog',auth,requireRole('admin'),safe((req,res)=>{
  const data=validate(req.body),id=crypto.randomUUID();if(db.prepare('SELECT id FROM blog_posts WHERE slug=?').get(data.slug))fail('این شناسه قبلاً ثبت شده است.',409);
  db.prepare('INSERT INTO blog_posts(id,slug,draft_json,updated_at) VALUES(?,?,?,?)').run(id,data.slug,JSON.stringify(data),Date.now());settings.audit(req.user.id,'blog.create',id);res.status(201).json({id});
 }));
 app.put('/api/admin/blog/:id',auth,requireRole('admin'),safe((req,res)=>{
  const data=validate(req.body),row=db.prepare('SELECT * FROM blog_posts WHERE id=?').get(req.params.id);if(!row)fail('مقاله پیدا نشد.',404);
  if(row.version!==req.body.version)fail('نسخه تغییر کرده؛ مقاله را دوباره دریافت کنید.',409);
  // Published slugs remain stable: changing a permalink requires a redirect migration, not a silent 404.
  if(row.published_at&&row.slug!==data.slug)fail('شناسهٔ مقاله منتشرشده را نمی‌توان تغییر داد.',409);
  if(db.prepare('SELECT id FROM blog_posts WHERE slug=? AND id!=?').get(data.slug,row.id))fail('شناسه تکراری است.',409);
  db.prepare('UPDATE blog_posts SET slug=?,draft_json=?,version=version+1,updated_at=? WHERE id=?').run(data.slug,JSON.stringify(data),Date.now(),row.id);settings.audit(req.user.id,'blog.save',row.id);res.json({ok:true});
 }));
 for(const action of ['publish','unpublish'])app.post(`/api/admin/blog/:id/${action}`,auth,requireRole('admin'),safe((req,res)=>{
  db.transaction(()=>{const row=db.prepare('SELECT * FROM blog_posts WHERE id=?').get(req.params.id);if(!row)fail('مقاله پیدا نشد.',404);if(req.body?.version!==row.version)fail('نسخه تغییر کرده؛ مقاله را تازه کنید.',409);
   const data=validate(JSON.parse(row.draft_json));db.prepare('UPDATE blog_posts SET live_json=?,published_at=?,version=version+1 WHERE id=?').run(action==='publish'?JSON.stringify({...data,updatedAt:Date.now()}):null,row.published_at||(action==='publish'?Date.now():null),row.id);settings.audit(req.user.id,`blog.${action}`,row.id);
  })();res.json({ok:true});
 }));
}
module.exports={blogModule,validate,slugOK};
