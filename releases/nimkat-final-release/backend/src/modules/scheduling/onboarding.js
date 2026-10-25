const crypto=require('node:crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const field=(key,label,type='text',extra={})=>({key,label,type,required:true,minLength:2,maxLength:500,...extra});
const steps=[
 {title:'هویت حرفه‌ای',fields:[field('fullName','نام و نام خانوادگی'),field('displayName','نام نمایشی عمومی')]},
 {title:'اطلاعات تماس',fields:[field('province','استان'),field('city','شهر'),field('email','ایمیل تماس','email',{required:false,maxLength:254})]},
 {title:'تحصیلات',fields:[field('degree','آخرین مقطع تحصیلی'),field('university','دانشگاه یا مؤسسه'),field('educationField','رشته تحصیلی')]},
 {title:'تخصص تدریس',fields:[field('subject','درس تخصصی','text',{maxLength:100}),field('grades','پایه‌ها و سطح‌های قابل تدریس'),field('languages','زبان‌های تدریس')]},
 {title:'سوابق',fields:[field('experienceYears','سال تجربه تدریس','number',{min:0,max:70}),field('bio','معرفی و سوابق تدریس','textarea',{minLength:20,maxLength:5000})]},
 {title:'شیوه برگزاری',fields:[field('modes','شیوه تدریس','multiselect',{options:[['online','آنلاین'],['onsite','حضوری']]}),field('classKinds','ماهیت کلاس','multiselect',{options:[['private','خصوصی'],['group','گروهی'],['friends','دوستانه']]})]},
 {title:'برنامه همکاری',fields:[field('timezone','منطقه زمانی','text',{maxLength:100}),field('availability','روزها و ساعت‌های پیشنهادی','textarea',{minLength:10,maxLength:2000})]},
 {title:'امکانات آموزشی',fields:[field('equipment','تجهیزات و ابزار آموزشی','textarea',{minLength:10,maxLength:2000}),field('connection','شرایط اینترنت و فضای تدریس','textarea',{minLength:10,maxLength:2000})]},
 {title:'ویدئوی معرفی',fields:[field('videoUrl','لینک ویدئوی معرفی آپارات','url',{maxLength:500})]},
 {title:'روش تدریس و ارزیابی',fields:[field('teachingApproach','روش تدریس و تعامل','textarea',{minLength:20,maxLength:3000}),field('assessmentApproach','روش ارزیابی و پیگیری یادگیری','textarea',{minLength:20,maxLength:3000})]},
 {title:'شرح مدارک و صلاحیت‌ها',fields:[field('qualifications','شرح مدارک و صلاحیت‌های قابل بررسی','textarea',{minLength:20,maxLength:3000})]},
 {title:'بازبینی و توافق‌نامه',fields:[]},
];
function cleanProfile(value,complete=false){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('اطلاعات فرم معتبر نیست.');
 const fields=steps.flatMap(s=>s.fields),known=new Set(fields.map(f=>f.key));
 if(Object.keys(value).some(k=>!known.has(k)))fail('فیلد ناشناخته در پرونده است.');
 const clean={};
 for(const f of fields){let v=value[f.key];
  if(v===undefined||v===''||(Array.isArray(v)&&!v.length)){if(complete&&f.required)fail(`«${f.label}» باید تکمیل شود.`);continue;}
  if(f.type==='multiselect'){if(!Array.isArray(v)||v.length>f.options.length||new Set(v).size!==v.length||v.some(x=>!f.options.some(([k])=>k===x)))fail(`«${f.label}» معتبر نیست.`);clean[f.key]=[...v].sort();continue;}
  if(f.type==='number'){if(!Number.isSafeInteger(v)||v<f.min||v>f.max)fail(`«${f.label}» خارج از محدوده است.`);clean[f.key]=v;continue;}
  if(typeof v!=='string'||v.length>f.maxLength)fail(`«${f.label}» طول یا نوع معتبر ندارد.`);v=v.trim();
  if(complete&&v.length<f.minLength)fail(`«${f.label}» کوتاه است.`);
  if(f.type==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))fail('ایمیل معتبر نیست.');
  if(f.key==='videoUrl'&&v){let u;try{u=new URL(v);}catch{fail('لینک ویدئو معتبر نیست.');}if(u.protocol!=='https:'||!['aparat.com','www.aparat.com'].includes(u.hostname)||u.port||u.username||u.password||!/^\/v\/[a-zA-Z0-9_-]{3,100}\/?$/.test(u.pathname)||u.search||u.hash)fail('لینک مستقیم HTTPS ویدئو آپارات بدون پارامتر لازم است.');v=u.href;}
  if(f.key==='timezone'&&v){try{new Intl.DateTimeFormat('en',{timeZone:v});}catch{fail('منطقه زمانی معتبر نیست.');}}
  clean[f.key]=v;
 }
 return clean;
}
function onboardingModule(app,{db,auth,requireRole,settings,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS teacher_agreement_versions(version INTEGER PRIMARY KEY,title TEXT NOT NULL,clauses TEXT NOT NULL,published INTEGER NOT NULL,actor_id INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS teacher_onboarding_drafts(user_id INTEGER PRIMARY KEY,version INTEGER NOT NULL,step INTEGER NOT NULL,body_enc TEXT NOT NULL,updated_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS teacher_application_submissions(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,draft_version INTEGER NOT NULL,agreement_version INTEGER NOT NULL,body_enc TEXT NOT NULL,checksum TEXT NOT NULL,accepted_at INTEGER NOT NULL,submission_key TEXT NOT NULL,UNIQUE(user_id,submission_key));
 CREATE TRIGGER IF NOT EXISTS teacher_agreement_no_update BEFORE UPDATE ON teacher_agreement_versions BEGIN SELECT RAISE(ABORT,'append-only agreement'); END;
 CREATE TRIGGER IF NOT EXISTS teacher_agreement_no_delete BEFORE DELETE ON teacher_agreement_versions BEGIN SELECT RAISE(ABORT,'append-only agreement'); END;
 CREATE TRIGGER IF NOT EXISTS teacher_submission_no_update BEFORE UPDATE ON teacher_application_submissions BEGIN SELECT RAISE(ABORT,'append-only submission'); END;
 CREATE TRIGGER IF NOT EXISTS teacher_submission_no_delete BEFORE DELETE ON teacher_application_submissions BEGIN SELECT RAISE(ABORT,'append-only submission'); END;`);
 if(!db.prepare('PRAGMA table_info(teacher_accounts)').all().some(c=>c.name==='submission_id'))db.exec('ALTER TABLE teacher_accounts ADD COLUMN submission_id INTEGER');
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}};
 function agreement(){const row=db.prepare('SELECT * FROM teacher_agreement_versions ORDER BY version DESC LIMIT 1').get();return row?{version:row.version,title:row.title,clauses:JSON.parse(row.clauses),published:!!row.published,createdAt:row.created_at}:{version:0,title:'توافق‌نامه همکاری استاد',clauses:Array(7).fill(''),published:false};}
 const application=uid=>db.prepare('SELECT * FROM teacher_accounts WHERE user_id=?').get(uid)||null;
 function draft(uid){const r=db.prepare('SELECT * FROM teacher_onboarding_drafts WHERE user_id=?').get(uid);return r?{version:r.version,step:r.step,profile:settings.open(r.body_enc,`teacher-draft:${uid}`),updatedAt:r.updated_at}:{version:0,step:0,profile:{}};}
 function submission(id){const row=db.prepare('SELECT * FROM teacher_application_submissions WHERE id=?').get(id);if(!row)return null;const {body_enc,...rest}=row;const legal=db.prepare('SELECT version,title,clauses FROM teacher_agreement_versions WHERE version=?').get(row.agreement_version);return {...rest,agreement:legal?{...legal,clauses:JSON.parse(legal.clauses)}:null,profile:settings.open(body_enc,`teacher-submission:${row.user_id}:${row.submission_key}`)};}
 function unlocked(uid){const a=application(uid);if(a?.status==='approved')fail('پرونده تأییدشده قفل است؛ اصلاح آن به بررسی مدیر نیاز دارد.',409);if(a?.status==='pending'&&a.submission_id)fail('پرونده در صف بررسی است؛ ابتدا مدیر باید نتیجه بررسی را ثبت کند.',409);}
 app.get('/api/teacher/onboarding',auth,requireRole('teacher'),safe((req,res)=>{const a=application(req.user.id),g=agreement();res.json({draft:draft(req.user.id),application:a,submission:a?.submission_id?submission(a.submission_id):null,agreement:g.published?g:{...g,title:'توافق‌نامه همکاری استاد',clauses:[]},steps});}));
 app.put('/api/teacher/onboarding',auth,requireRole('teacher'),safe((req,res)=>{
  const {version,step,profile}=req.body||{};if(!Number.isSafeInteger(version)||!Number.isInteger(step)||step<0||step>11)fail('نسخه یا مرحله فرم معتبر نیست.');const clean=cleanProfile(profile);
  db.transaction(()=>{unlocked(req.user.id);const old=draft(req.user.id);if(old.version!==version)fail('فرم در تب دیگری تغییر کرده؛ دوباره دریافت کنید.',409);db.prepare('INSERT INTO teacher_onboarding_drafts VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET version=excluded.version,step=excluded.step,body_enc=excluded.body_enc,updated_at=excluded.updated_at').run(req.user.id,version+1,step,settings.seal(clean,`teacher-draft:${req.user.id}`),now());settings.audit(req.user.id,'teacher.draft',String(req.user.id),{version:version+1,step});})();res.json({draft:draft(req.user.id)});
 }));
 app.post('/api/teacher/onboarding/submit',auth,requireRole('teacher'),safe((req,res)=>{
  const {version,agreementVersion,acceptedClauses,attested,submissionKey}=req.body||{};
  if(!Number.isSafeInteger(version)||!Number.isSafeInteger(agreementVersion)||attested!==true||!Array.isArray(acceptedClauses)||acceptedClauses.length!==7||new Set(acceptedClauses).size!==7||acceptedClauses.some(x=>!Number.isInteger(x)||x<0||x>6)||!/^[a-zA-Z0-9_-]{16,100}$/.test(submissionKey||''))fail('تأیید هر هفت بند، صحت اطلاعات و شناسه یکتا لازم است.');
  const result=db.transaction(()=>{
   const old=db.prepare('SELECT id,draft_version,agreement_version FROM teacher_application_submissions WHERE user_id=? AND submission_key=?').get(req.user.id,submissionKey);
   if(old){if(old.draft_version!==version||old.agreement_version!==agreementVersion)fail('شناسه ارسال متعلق به درخواست دیگری است.',409);return old.id;}
   unlocked(req.user.id);const d=draft(req.user.id),a=agreement();if(d.version!==version)fail('نسخه فرم تغییر کرده است.',409);if(!a.published)fail('متن رسمی توافق‌نامه هنوز توسط مدیر منتشر نشده است.',422);if(a.version!==agreementVersion)fail('توافق‌نامه تغییر کرده؛ متن جدید را بخوانید و دوباره تأیید کنید.',409);
   const profile=cleanProfile(d.profile,true),checksum=crypto.createHash('sha256').update(JSON.stringify({profile,agreementVersion:a.version,acceptedClauses:[0,1,2,3,4,5,6],attested:true})).digest('hex');
   const row=db.prepare('INSERT INTO teacher_application_submissions(user_id,draft_version,agreement_version,body_enc,checksum,accepted_at,submission_key) VALUES(?,?,?,?,?,?,?)').run(req.user.id,d.version,a.version,settings.seal(profile,`teacher-submission:${req.user.id}:${submissionKey}`),checksum,now(),submissionKey);const sid=Number(row.lastInsertRowid);
   db.prepare("INSERT INTO teacher_accounts(user_id,bio,subject,created_at,submission_id) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio,subject=excluded.subject,status='pending',version=version+1,review_note='',submission_id=excluded.submission_id").run(req.user.id,profile.bio,profile.subject,now(),sid);
   settings.audit(req.user.id,'teacher.submit',String(req.user.id),{submissionId:sid,agreementVersion:a.version,checksum});return sid;
  })();res.json({application:application(req.user.id),submission:submission(result)});
 }));
 app.put('/api/admin/teaching/agreement',auth,requireRole('admin'),safe((req,res)=>{
  const {version,title,clauses,published}=req.body||{};if(!Number.isSafeInteger(version)||typeof title!=='string'||title.trim().length<5||title.length>200||typeof published!=='boolean'||!Array.isArray(clauses)||clauses.length!==7||clauses.some(x=>typeof x!=='string'||x.length>4000||published&&x.trim().length<20)||published&&new Set(clauses.map(x=>x.trim())).size!==7)fail('عنوان معتبر و دقیقاً هفت بند متمایز لازم است؛ برای انتشار هر بند حداقل ۲۰ نویسه داشته باشد.');
  db.transaction(()=>{if(agreement().version!==version)fail('توافق‌نامه هم‌زمان تغییر کرده است.',409);db.prepare('INSERT INTO teacher_agreement_versions VALUES(?,?,?,?,?,?)').run(version+1,title.trim(),JSON.stringify(clauses.map(x=>x.trim())),published?1:0,req.user.id,now());settings.audit(req.user.id,'teacher.agreement',String(version+1),{published});})();res.json({agreement:agreement()});
 }));
 return {agreement,submission,steps,validateReview(row){if(!row.submission_id)fail('پرونده قدیمی ناقص است؛ استاد باید فرم دوازده‌مرحله‌ای و توافق‌نامه را ارسال کند.',422);const s=submission(row.submission_id);if(!s||s.user_id!==row.user_id)fail('رسید معتبر پرونده پیدا نشد.',422);cleanProfile(s.profile,true);return s;}};
}
module.exports={onboardingModule,steps,cleanProfile};
