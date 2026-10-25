const crypto=require('node:crypto');
const {defaults}=require('./defaults');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const dayMs=86400000;
function dateKey(ts){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(ts);}
function period(ts,kind){
 const day=dateKey(ts),d=new Date(`${day}T12:00:00Z`);
 if(kind==='daily')return day;
 if(kind==='weekly'){d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+1)%7);return d.toISOString().slice(0,10);}
 if(kind==='monthly'||kind==='yearly'){const p=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit'}).formatToParts(ts);const get=t=>p.find(x=>x.type===t).value;return kind==='yearly'?get('year'):`${get('year')}-${get('month')}`;}
 return 'all';
}
const number=(v,min=0,max=1e7)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail('عدد تنظیمات خارج از محدوده است.');return v;};
const text=(v,max=300)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('متن تنظیمات معتبر نیست.');return v.trim();};
const id=v=>{if(!/^[a-z0-9_-]{1,64}$/.test(v||''))fail('شناسه انگلیسی کوتاه و یکتا لازم است.');return v;};
const event=v=>{if(!/^[a-z]+\.[a-z0-9_-]{1,40}$/.test(v||''))fail('نام رویداد نامعتبر است.');return v;};
const bool=v=>{if(typeof v!=='boolean')fail('مقدار فعال/غیرفعال نامعتبر است.');return v;};
const periodType=v=>{if(!['all','daily','weekly','monthly','special'].includes(v))fail('تناوب نامعتبر است.');return v;};
const role=v=>{if(!['student','teacher','all'].includes(v))fail('گروه هدف نامعتبر است.');return v;};
const timestamp=v=>v===null?null:number(v,0,1e14);
function validateConfig(v){
 const lists={};for(const key of ['levels','rules','medals','rewards','missions']){if(!Array.isArray(v[key])||v[key].length>150||new Set(v[key].map(x=>x.id)).size!==v[key].length)fail('فهرست تنظیمات یا شناسه تکراری است.');}
 if(v.levels.length!==5||v.levels[0].minPoints!==0||v.levels.some((x,i)=>i&&x.minPoints<=v.levels[i-1].minPoints))fail('پنج سطح با آستانه صعودی از صفر لازم است.');
 lists.levels=v.levels.map(x=>({id:id(x.id),name:text(x.name,80),minPoints:number(x.minPoints),giftCoins:number(x.giftCoins),benefits:(()=>{if(!Array.isArray(x.benefits)||x.benefits.length>20)fail('مزایا نامعتبرند.');return x.benefits.map(s=>text(s,200));})()}));
 lists.rules=v.rules.map(x=>({id:id(x.id),title:text(x.title),role:role(x.role),event:event(x.event),coins:number(x.coins),points:number(x.points),every:number(x.every,1,100000),period:periodType(x.period),cap:number(x.cap,0,100000),enabled:bool(x.enabled),startsAt:timestamp(x.startsAt??null),endsAt:timestamp(x.endsAt??null)}));
 if(lists.rules.some(r=>r.startsAt&&r.endsAt&&r.startsAt>=r.endsAt))fail('بازهٔ اعتبار قاعده نامعتبر است.');
 lists.medals=v.medals.map(x=>({id:id(x.id),title:text(x.title),role:role(x.role),event:event(x.event),target:number(x.target,1,100000),period:periodType(x.period||'all'),minAverage:(()=>{if(typeof x.minAverage!=='number'||x.minAverage<0||x.minAverage>5)fail('میانگین نامعتبر است.');return x.minAverage;})()}));
 lists.rewards=v.rewards.map(x=>{
  if(!['wallet','manual','discount','commission','customization','coming'].includes(x.type))fail('نوع جایزه نامعتبر است.');
  if(x.enabled&&['coming'].includes(x.type))fail('این نوع جایزه هنوز اتصال تحویل قابل اتکا ندارد؛ فعال‌سازی مجاز نیست.',422);
  if(x.enabled&&x.type==='customization'&&(!['primary','fresh','orange'].includes(x.style)||!Number.isInteger(x.durationDays)||x.durationDays<1||x.durationDays>365))fail('سفارشی‌سازی نیازمند رنگ مجاز برند و مدت ۱ تا ۳۶۵ روز است.',422);
  if(x.enabled&&x.type==='commission'&&(x.role!=='teacher'||!Number.isSafeInteger(x.valueToman)||x.valueToman<1||!Number.isSafeInteger(x.percent)||x.percent<1||x.percent>100||!Number.isSafeInteger(x.sessionLimit)||x.sessionLimit<1||x.sessionLimit>100))fail('معافیت کمیسیون فقط برای مدرس، با سقف مالی مثبت، درصد و تعداد جلسات محدود مجاز است.',422);
  if(x.type==='discount'&&(!Number.isSafeInteger(x.percent)||x.percent<1||x.percent>50||!Number.isSafeInteger(x.valueToman)||x.valueToman<1))fail('درصد تخفیف ۱ تا ۵۰ و سقف مالی مثبت لازم است.');
  if(!/^\/images\/[a-zA-Z0-9/_-]+\.(png|jpg|webp)$/.test(x.image||'')||x.image.includes('..'))fail('تصویر محلی معتبر لازم است.');
  return {id:id(x.id),title:text(x.title),role:role(x.role),cost:number(x.cost),type:x.type,valueToman:number(x.valueToman,0,1e9),stock:number(x.stock,0,1000000),perUserLimit:number(x.perUserLimit??1,1,10000),enabled:bool(x.enabled),minPoints:number(x.minPoints),expiresAt:timestamp(x.expiresAt),image:x.image,description:text(x.description,2000),conditions:text(x.conditions,1000),spinWeight:number(x.spinWeight,0,100),...(x.percent?{percent:number(x.percent,1,100)}:{}),...(x.type==='commission'?{sessionLimit:number(x.sessionLimit??1,1,100)}:{}),...(x.type==='customization'?{durationDays:number(x.durationDays??3,1,365),style:['primary','fresh','orange'].includes(x.style)?x.style:'fresh'}:{})};
 });
 lists.missions=v.missions.map(x=>{if(!Array.isArray(x.requirements)||!x.requirements.length||x.requirements.length>8)fail('شرط مأموریت لازم است.');const startsAt=timestamp(x.startsAt),endsAt=timestamp(x.endsAt);if(startsAt&&endsAt&&startsAt>=endsAt)fail('بازهٔ مأموریت نامعتبر است.');return {id:id(x.id),title:text(x.title),role:role(x.role),period:periodType(x.period),requirements:x.requirements.map(y=>({event:event(y.event),target:number(y.target,1,100000)})),coins:number(x.coins),points:number(x.points),enabled:bool(x.enabled),startsAt,endsAt};});
 return {...lists,budgetToman:number(v.budgetToman,0,1e12),leaderboardEnabled:bool(v.leaderboardEnabled),spinEnabled:bool(v.spinEnabled),studentLikes:number(v.studentLikes,1,100),teacherLikes:number(v.teacherLikes,1,100),progressPercent:number(v.progressPercent,1,100),studentSpinWeeks:number(v.studentSpinWeeks,1,104),teacherSpinClasses:number(v.teacherSpinClasses,1,1000),positiveRating:number(v.positiveRating,1,5),minRatings:number(v.minRatings,1,1000),committedClasses:number(v.committedClasses??10,1,100),referralWindowHours:number(v.referralWindowHours??24,1,168),nearLevelPercent:number(v.nearLevelPercent??10,1,100),nearMissionPercent:number(v.nearMissionPercent??80,1,99)};
}
function clubEngine({db,settings,finance,events,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS loyalty_customization_entitlements(claim_id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,style TEXT NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS loyalty_commission_entitlements(claim_id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,remaining_toman INTEGER NOT NULL CHECK(remaining_toman>=0),remaining_sessions INTEGER NOT NULL CHECK(remaining_sessions>=0),percent INTEGER NOT NULL,expires_at INTEGER);
 CREATE TABLE IF NOT EXISTS loyalty_commission_consumptions(user_id INTEGER NOT NULL,occurrence_id INTEGER NOT NULL,claim_id TEXT NOT NULL,amount_toman INTEGER NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(user_id,occurrence_id));
 CREATE TABLE IF NOT EXISTS loyalty_config(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL,body TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS loyalty_accounts(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL DEFAULT 0 CHECK(coins>=0),points INTEGER NOT NULL DEFAULT 0 CHECK(points>=0),created_at INTEGER NOT NULL,league_opt_in INTEGER NOT NULL DEFAULT 0,profile TEXT NOT NULL DEFAULT '{}',referral_code TEXT UNIQUE);
 CREATE TABLE IF NOT EXISTS loyalty_events(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,kind TEXT NOT NULL,source TEXT NOT NULL,occurred_at INTEGER NOT NULL,verified_at INTEGER NOT NULL,actor_id INTEGER,UNIQUE(user_id,kind,source));
 CREATE INDEX IF NOT EXISTS loyalty_events_user ON loyalty_events(user_id,occurred_at);
 CREATE TABLE IF NOT EXISTS loyalty_ledger(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,source TEXT NOT NULL,reason TEXT NOT NULL,coins INTEGER NOT NULL,points INTEGER NOT NULL CHECK(points>=0),balance_after INTEGER NOT NULL CHECK(balance_after>=0),created_at INTEGER NOT NULL,UNIQUE(user_id,source));
 CREATE TABLE IF NOT EXISTS loyalty_awards(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,rule_id TEXT NOT NULL,event_id INTEGER,period_key TEXT NOT NULL,coins INTEGER NOT NULL,points INTEGER NOT NULL,config_version INTEGER NOT NULL,created_at INTEGER NOT NULL,UNIQUE(user_id,rule_id,event_id));
 CREATE TABLE IF NOT EXISTS loyalty_medals(user_id INTEGER NOT NULL,medal_id TEXT NOT NULL,title TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(user_id,medal_id));
 CREATE TABLE IF NOT EXISTS loyalty_mission_awards(user_id INTEGER NOT NULL,mission_id TEXT NOT NULL,period_key TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(user_id,mission_id,period_key));
 CREATE TABLE IF NOT EXISTS loyalty_claims(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,reward_id TEXT NOT NULL,title TEXT NOT NULL,type TEXT NOT NULL,cost INTEGER NOT NULL,value_toman INTEGER NOT NULL,status TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,idempotency_key TEXT NOT NULL,UNIQUE(user_id,idempotency_key));
 CREATE TABLE IF NOT EXISTS loyalty_spins(user_id INTEGER NOT NULL,period_key TEXT NOT NULL,claim_id TEXT NOT NULL,PRIMARY KEY(user_id,period_key));
 CREATE TABLE IF NOT EXISTS loyalty_notifications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,source TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL,read_at INTEGER,UNIQUE(user_id,source));
 CREATE TABLE IF NOT EXISTS loyalty_referrals(invitee_id INTEGER PRIMARY KEY,inviter_id INTEGER NOT NULL,created_at INTEGER NOT NULL,CHECK(invitee_id!=inviter_id));
 CREATE TABLE IF NOT EXISTS loyalty_session_checks(occurrence_id INTEGER PRIMARY KEY,teacher_uid INTEGER NOT NULL,present_json TEXT NOT NULL,note TEXT NOT NULL,actor_id INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS loyalty_surveys(id INTEGER PRIMARY KEY,occurrence_id INTEGER NOT NULL,from_uid INTEGER NOT NULL,to_uid INTEGER NOT NULL,stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),positive TEXT NOT NULL,negative TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(occurrence_id,from_uid,to_uid));
 CREATE TABLE IF NOT EXISTS loyalty_academic(id INTEGER PRIMARY KEY,occurrence_id INTEGER NOT NULL,student_id INTEGER NOT NULL,teacher_id INTEGER NOT NULL,scores TEXT NOT NULL,average REAL NOT NULL,created_at INTEGER NOT NULL,UNIQUE(occurrence_id,student_id));
 CREATE TABLE IF NOT EXISTS loyalty_chat_reviews(message_id INTEGER PRIMARY KEY,actor_id INTEGER NOT NULL,note TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS chat_reactions(message_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(message_id,user_id));
 `);
 for(const table of ['loyalty_ledger','loyalty_events','loyalty_awards','loyalty_medals','loyalty_session_checks','loyalty_surveys','loyalty_academic'])for(const op of ['UPDATE','DELETE'])db.exec(`CREATE TRIGGER IF NOT EXISTS ${table}_no_${op.toLowerCase()} BEFORE ${op} ON ${table} BEGIN SELECT RAISE(ABORT,'append-only loyalty record'); END;`);
 db.prepare('INSERT OR IGNORE INTO loyalty_config VALUES(1,1,?)').run(JSON.stringify(defaults));
 const configuration=()=>{const r=db.prepare('SELECT * FROM loyalty_config WHERE id=1').get();const c={...defaults,version:r.version,...JSON.parse(r.body)};c.rewards=c.rewards.map(x=>({...x,...(x.type==='commission'?{percent:x.percent??100,sessionLimit:x.sessionLimit??defaults.rewards.find(d=>d.id===x.id)?.sessionLimit??1}:x.type==='customization'?{durationDays:x.durationDays??3,style:x.style??'fresh'}:{})}));return c;};
 const roleFor=uid=>db.prepare('SELECT role FROM users WHERE id=?').get(uid)?.role==='teacher'?'teacher':'student';
 function account(uid){if(!db.prepare('SELECT id FROM users WHERE id=?').get(uid))fail('کاربر پیدا نشد.',404);db.prepare('INSERT OR IGNORE INTO loyalty_accounts(user_id,created_at,referral_code) VALUES(?,?,?)').run(uid,now(),crypto.randomBytes(8).toString('hex').toUpperCase());return db.prepare('SELECT * FROM loyalty_accounts WHERE user_id=?').get(uid);}
 function notify(uid,source,title,body=''){const inserted=db.prepare('INSERT OR IGNORE INTO loyalty_notifications(user_id,source,title,body,created_at) VALUES(?,?,?,?,?)').run(uid,source,title,body,now());if(inserted.changes&&events)setImmediate(()=>events.emit([uid],'club.changed',{}));}
 function post(uid,source,reason,coins,points){
  if(db.prepare('SELECT id FROM loyalty_ledger WHERE user_id=? AND source=?').get(uid,source))return false;
  const a=account(uid);if(a.coins+coins<0)fail('سکه کافی نیست.',409);
  if(!Number.isSafeInteger(a.coins+coins)||!Number.isSafeInteger(a.points+points)||points<0)fail('سرریز موجودی.',422);
  db.prepare('UPDATE loyalty_accounts SET coins=coins+?,points=points+? WHERE user_id=?').run(coins,points,uid);
  db.prepare('INSERT INTO loyalty_ledger(user_id,source,reason,coins,points,balance_after,created_at) VALUES(?,?,?,?,?,?,?)').run(uid,source,reason,coins,points,a.coins+coins,now());return true;
 }
 const userEvents=uid=>db.prepare('SELECT * FROM loyalty_events WHERE user_id=? ORDER BY occurred_at').all(uid);
 function streak(uid){
  const rows=userEvents(uid).filter(e=>['class.completed','chat.helpful','survey.submitted','question.validated','profile.completed','academic.progress','content.published','webinar.completed','challenge.completed','seasonal.completed','profile.video'].includes(e.kind));
  const count=(kind,step)=>{const keys=new Set(rows.map(e=>period(e.occurred_at,kind)));let d=new Date(`${period(now(),kind)}T12:00Z`),n=0;if(!keys.has(d.toISOString().slice(0,10)))d.setUTCDate(d.getUTCDate()-step);while(keys.has(d.toISOString().slice(0,10))){n++;d.setUTCDate(d.getUTCDate()-step);}return n;};
  return {days:count('daily',1),weeks:count('weekly',7),calendar:[...new Set(rows.map(e=>dateKey(e.occurred_at)))].slice(-90)};
 }
 function missionView(uid,cfg){const role=roleFor(uid),rows=userEvents(uid);return cfg.missions.filter(m=>m.role==='all'||m.role===role).map(m=>{
  const pk=period(now(),m.period),active=m.enabled&&(!m.startsAt||m.startsAt<=now())&&(!m.endsAt||m.endsAt>now());
  const requirements=m.requirements.map(r=>({...r,done:rows.filter(e=>e.kind===r.event&&period(e.occurred_at,m.period)===pk&&(!m.startsAt||e.occurred_at>=m.startsAt)&&(!m.endsAt||e.occurred_at<m.endsAt)).length}));
  const completed=!!db.prepare('SELECT 1 FROM loyalty_mission_awards WHERE user_id=? AND mission_id=? AND period_key=?').get(uid,m.id,pk);
  const progress=Math.floor(Math.min(...requirements.map(r=>Math.min(1,r.done/r.target)))*100);
  return {...m,requirements,progress,status:completed?'completed':!active?'expired':progress?'progress':'active',periodKey:pk};
 });}
 function sync(uid){
  let cfg=configuration(),a=account(uid);
  for(const l of cfg.levels)if(a.points>=l.minPoints){if(post(uid,`level:${l.id}`,`هدیه ارتقا به ${l.name}`,l.giftCoins,0)&&l.minPoints)notify(uid,`level:${l.id}`,'ارتقای سطح',`به ${l.name} رسیدید؛ ${l.giftCoins} سکه هدیه.`);}
  for(const m of missionView(uid,cfg)){
   if(m.status!=='expired'&&m.status!=='completed'&&m.progress>=100){db.prepare('INSERT INTO loyalty_mission_awards VALUES(?,?,?,?)').run(uid,m.id,m.periodKey,now());post(uid,`mission:${m.id}:${m.periodKey}`,m.title,m.coins,m.points);notify(uid,`mission:${m.id}:${m.periodKey}`,'مأموریت تکمیل شد',m.title);}
   else if(m.status!=='completed'&&m.status!=='expired')notify(uid,`mission-new:${m.id}:${m.periodKey}`,'مأموریت جدید',m.title);
   if(m.progress>=cfg.nearMissionPercent&&m.progress<100&&m.status!=='expired')notify(uid,`mission-near:${m.id}:${m.periodKey}`,'یک قدم تا تکمیل مأموریت',m.title);
  }
  const rows=userEvents(uid),s=streak(uid),r=roleFor(uid);
  for(const m of cfg.medals.filter(m=>m.role===r||m.role==='all')){
   const n=m.event==='streak.weeks'?s.weeks:rows.filter(e=>e.kind===m.event&&period(e.occurred_at,m.period||'all')===period(now(),m.period||'all')).length;
   const avg=db.prepare('SELECT AVG(stars) v FROM loyalty_surveys WHERE to_uid=?').get(uid).v||0;
   if(n>=m.target&&avg>=m.minAverage&&!db.prepare('SELECT 1 FROM loyalty_medals WHERE user_id=? AND medal_id=?').get(uid,m.id)){
    db.prepare('INSERT INTO loyalty_medals VALUES(?,?,?,?,?)').run(uid,m.id,m.title,`${m.title}؛ ${n} فعالیت معتبر با حدنصاب ${m.target}${m.period==='monthly'?` در ماه ${period(now(),'monthly')}`:''}${m.minAverage?`؛ میانگین ${avg.toFixed(2)}`:''}`,now());notify(uid,`medal:${m.id}`,'مدال جدید',m.title);
    ingest(uid,'medal.earned',m.id,{sync:false});
   }
  }
  // Awards may themselves cross several levels. Gifts are each posted at most once.
  a=account(uid);for(const l of cfg.levels)if(a.points>=l.minPoints&&post(uid,`level:${l.id}`,`هدیه ارتقا به ${l.name}`,l.giftCoins,0)&&l.minPoints)notify(uid,`level:${l.id}`,'ارتقای سطح',l.name);
  const next=cfg.levels.find(l=>l.minPoints>a.points),cur=[...cfg.levels].reverse().find(l=>l.minPoints<=a.points);
  if(next&&next.minPoints-a.points<=Math.max(1,Math.floor((next.minPoints-cur.minPoints)*cfg.nearLevelPercent/100)))notify(uid,`near-level:${next.id}`,'نزدیک سطح بعد',`${next.minPoints-a.points} امتیاز تا ${next.name}`);
  for(const r of rewardView(uid,cfg))if(r.eligible)notify(uid,`reward-ready:${r.id}`,'جایزه آمادهٔ دریافت',r.title);
  if(spinStatus(uid,cfg).eligible)notify(uid,`spin-ready:${period(now(),'monthly')}`,'شانس طلایی فعال شد','شرایط ماهانهٔ شما کامل شده است.');
  if(s.weeks)notify(uid,`streak:${period(now(),'weekly')}`,'زنجیره فعالیت',`${s.weeks} هفته در مسیر یادگیری`);
 }
 function ingest(uid,kind,source,options={}){
  const at=options.at??now(),actor=options.actor??null;account(uid);
  if(!Number.isSafeInteger(at)||at>now()||typeof source!=='string'||source.length>200)fail('رویداد نامعتبر است.');
  const inserted=db.prepare('INSERT OR IGNORE INTO loyalty_events(user_id,kind,source,occurred_at,verified_at,actor_id) VALUES(?,?,?,?,?,?)').run(uid,kind,source,at,now(),actor);
  if(!inserted.changes)return false;
  const cfg=configuration(),r=roleFor(uid),evId=Number(inserted.lastInsertRowid),rows=userEvents(uid);
  for(const rule of cfg.rules.filter(x=>x.enabled&&x.event===kind&&(x.role===r||x.role==='all'))){
   if(options.group&&rule.id==='s-class'||rule.startsAt&&at<rule.startsAt||rule.endsAt&&at>=rule.endsAt)continue;
   const pk=period(at,rule.period),n=rows.filter(e=>e.kind===kind&&period(e.occurred_at,rule.period)===pk&&(!rule.startsAt||e.occurred_at>=rule.startsAt)&&(!rule.endsAt||e.occurred_at<rule.endsAt)).length;
   const issued=db.prepare('SELECT COUNT(*) n FROM loyalty_awards WHERE user_id=? AND rule_id=? AND period_key=?').get(uid,rule.id,pk).n;
   if(n%rule.every||rule.cap&&issued>=rule.cap)continue;
   post(uid,`event:${evId}:${rule.id}`,rule.title,rule.coins,rule.points);
   db.prepare('INSERT INTO loyalty_awards(user_id,rule_id,event_id,period_key,coins,points,config_version,created_at) VALUES(?,?,?,?,?,?,?,?)').run(uid,rule.id,evId,pk,rule.coins,rule.points,cfg.version,now());
  }
  if(options.sync!==false)sync(uid);return true;
 }
 const spent=()=>db.prepare("SELECT COALESCE(SUM(value_toman),0) v FROM loyalty_claims").get().v;
 const userClaimed=(uid,id)=>db.prepare('SELECT COUNT(*) n FROM loyalty_claims WHERE user_id=? AND reward_id=?').get(uid,id).n;
 const claimedCount=id=>db.prepare('SELECT COUNT(*) n FROM loyalty_claims WHERE reward_id=?').get(id).n;
 function rewardView(uid,cfg){const a=account(uid),r=roleFor(uid);return cfg.rewards.filter(x=>x.role===r||x.role==='all').map(x=>({...x,remaining:Math.max(0,x.stock-claimedCount(x.id)),eligible:userClaimed(uid,x.id)<(x.perUserLimit??1)&&x.enabled&&x.stock>claimedCount(x.id)&&(!x.expiresAt||x.expiresAt>now())&&a.points>=x.minPoints&&a.coins>=x.cost&&spent()+x.valueToman<=cfg.budgetToman}));}
 function claim(uid,rewardId,key,free=false){
  if(!/^[a-zA-Z0-9_-]{16,100}$/.test(key||''))fail('شناسهٔ غیرتکراری دریافت لازم است.');
  const old=db.prepare('SELECT * FROM loyalty_claims WHERE user_id=? AND idempotency_key=?').get(uid,key);if(old){if(old.reward_id!==rewardId)fail('این شناسه متعلق به دریافت دیگری است.',409);return old;}
  const cfg=configuration(),a=account(uid),reward=cfg.rewards.find(r=>r.id===rewardId&&(r.role==='all'||r.role===roleFor(uid)));
  if(!reward||!reward.enabled||!['wallet','manual','discount','commission','customization'].includes(reward.type))fail('جایزه فعلاً قابل دریافت نیست.',422);
  if(userClaimed(uid,reward.id)>=(reward.perUserLimit??1))fail('سقف دریافت این جایزه برای شما تکمیل شده است.',409);
  if(reward.stock<=claimedCount(reward.id)||reward.expiresAt&&reward.expiresAt<=now())fail('موجودی یا مهلت جایزه تمام شده است.',409);
  if(a.points<reward.minPoints)fail('امتیاز لازم برای این جایزه را ندارید.',409);
  if(!free&&a.coins<reward.cost)fail('سکه کافی نیست.',409);
  if(spent()+reward.valueToman>cfg.budgetToman)fail('بودجهٔ جوایز کافی نیست؛ دریافت متوقف است.',409);
  const cid=crypto.randomUUID();post(uid,`claim:${cid}`,`دریافت ${reward.title}`,free?0:-reward.cost,0);
  if(reward.type==='wallet'){
   if(!finance||reward.valueToman<1)fail('سرویس مالی آماده نیست.',503);
   finance.journal(`club:${cid}`,'club_reward',[{account:'platform:club-expense',amount:-reward.valueToman*10},{account:`user:${uid}`,amount:reward.valueToman*10}]);
  }
  db.prepare('INSERT INTO loyalty_claims(id,user_id,reward_id,title,type,cost,value_toman,status,created_at,idempotency_key) VALUES(?,?,?,?,?,?,?,?,?,?)').run(cid,uid,reward.id,reward.title,reward.type,free?0:reward.cost,reward.valueToman,['wallet','discount','commission','customization'].includes(reward.type)?'fulfilled':'pending',now(),key);
  if(reward.type==='customization'){if(!['primary','fresh','orange'].includes(reward.style)||!reward.durationDays)fail('ظاهر معتبر و مدت لازم است.',422);db.prepare('INSERT INTO loyalty_customization_entitlements VALUES(?,?,?,?)').run(cid,uid,reward.style,now()+reward.durationDays*dayMs);}
  if(reward.type==='commission'){if(roleFor(uid)!=='teacher'||reward.valueToman<1||!reward.percent||!reward.sessionLimit)fail('شرایط محدود معافیت آماده نیست.',422);db.prepare('INSERT INTO loyalty_commission_entitlements VALUES(?,?,?,?,?,?)').run(cid,uid,reward.valueToman,reward.sessionLimit,reward.percent,reward.expiresAt);}
  if(reward.type==='discount'){if(!finance?.issueVoucher)fail('سرویس تخفیف آماده نیست.',503);finance.issueVoucher({claimId:cid,userId:uid,percent:reward.percent,capToman:reward.valueToman,expiresAt:reward.expiresAt});}
  settings.audit(uid,'club.claim',cid,{rewardId,free});notify(uid,`claim:${cid}`,'دریافت جایزه ثبت شد',reward.title);
  return db.prepare('SELECT * FROM loyalty_claims WHERE id=?').get(cid);
 }
 function spinStatus(uid,cfg){const a=account(uid),s=streak(uid),r=roleFor(uid),pk=period(now(),'monthly'),n=userEvents(uid).filter(e=>e.kind==='class.completed'&&period(e.occurred_at,'monthly')===pk).length;
  const pool=cfg.rewards.filter(x=>userClaimed(uid,x.id)<(x.perUserLimit??1)&&x.spinWeight&&x.enabled&&(x.role===r||x.role==='all')&&x.stock>claimedCount(x.id)&&a.points>=x.minPoints&&(!x.expiresAt||x.expiresAt>now())&&spent()+x.valueToman<=cfg.budgetToman);
  return {eligible:cfg.spinEnabled&&!db.prepare('SELECT 1 FROM loyalty_spins WHERE user_id=? AND period_key=?').get(uid,pk)&&(r==='teacher'?n>=cfg.teacherSpinClasses:s.weeks>=cfg.studentSpinWeeks)&&pool.length>0,periodKey:pk,requirement:r==='teacher'?`${cfg.teacherSpinClasses} کلاس موفق در ماه`:`${cfg.studentSpinWeeks} هفته استمرار`,pool};
 }
 function snapshot(uid){return db.transaction(()=>{account(uid);sync(uid);const a=account(uid),cfg=configuration(),idx=cfg.levels.findLastIndex(l=>a.points>=l.minPoints),next=cfg.levels[idx+1],cur=cfg.levels[idx];return {customization:db.prepare('SELECT style,expires_at FROM loyalty_customization_entitlements WHERE user_id=? AND expires_at>? ORDER BY rowid DESC LIMIT 1').get(uid,now())||null,commissionEntitlements:db.prepare('SELECT * FROM loyalty_commission_entitlements WHERE user_id=? ORDER BY rowid DESC LIMIT 50').all(uid),account:{...a,profile:JSON.parse(a.profile)},role:roleFor(uid),levels:cfg.levels,level:cur,next:next||null,toNext:next?next.minPoints-a.points:0,progress:next?Math.floor((a.points-cur.minPoints)/(next.minPoints-cur.minPoints)*100):100,missions:missionView(uid,cfg),medals:cfg.medals.filter(m=>m.role===roleFor(uid)||m.role==='all').map(m=>({...m,earned:db.prepare('SELECT created_at,reason FROM loyalty_medals WHERE user_id=? AND medal_id=?').get(uid,m.id)||null})),rewards:rewardView(uid,cfg),rules:cfg.rules.filter(x=>x.enabled&&(x.role===roleFor(uid)||x.role==='all')),streak:streak(uid),history:db.prepare('SELECT * FROM loyalty_ledger WHERE user_id=? ORDER BY id DESC LIMIT 200').all(uid),claims:db.prepare('SELECT * FROM loyalty_claims WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(uid).map(c=>({...c,voucher:finance?.voucherForClaim?.(uid,c.id)||null})),notifications:db.prepare('SELECT * FROM loyalty_notifications WHERE user_id=? ORDER BY id DESC LIMIT 100').all(uid),spin:(()=>{const {pool,...v}=spinStatus(uid,cfg);return {...v,prizes:pool.map(x=>x.title)};})(),leaderboardEnabled:cfg.leaderboardEnabled,referralWindowHours:cfg.referralWindowHours};})();}
 function commissionBenefit(uid,occurrenceId,feeToman){if(!Number.isSafeInteger(feeToman)||feeToman<=0)return 0;return db.transaction(()=>{if(db.prepare('SELECT 1 FROM loyalty_commission_consumptions WHERE user_id=? AND occurrence_id=?').get(uid,occurrenceId))return 0;const entitlement=db.prepare('SELECT e.* FROM loyalty_commission_entitlements e JOIN loyalty_claims c ON c.id=e.claim_id WHERE e.user_id=? AND e.remaining_toman>0 AND e.remaining_sessions>0 AND (e.expires_at IS NULL OR e.expires_at>?) ORDER BY c.created_at,c.id LIMIT 1').get(uid,now());if(!entitlement)return 0;const amount=Math.min(entitlement.remaining_toman,Math.floor(feeToman*entitlement.percent/100));if(amount<1)return 0;db.prepare('UPDATE loyalty_commission_entitlements SET remaining_toman=remaining_toman-?,remaining_sessions=remaining_sessions-1 WHERE claim_id=?').run(amount,entitlement.claim_id);db.prepare('INSERT INTO loyalty_commission_consumptions VALUES(?,?,?,?,?)').run(uid,occurrenceId,entitlement.claim_id,amount,now());settings.audit(uid,'club.commission-consumed',entitlement.claim_id,{occurrenceId,amountToman:amount});return amount;})();}
 return {commissionBenefit,configuration,account,ingest:db.transaction(ingest),sync,snapshot,post,notify,claim:db.transaction(claim),spinStatus,streak,roleFor,spent,
  save(version,body,actor){return db.transaction(()=>{const cfg=configuration();if(version!==cfg.version)fail('تنظیمات تغییر کرده؛ دوباره دریافت کنید.',409);const clean=validateConfig(body);if(clean.budgetToman<spent())fail('بودجه نمی‌تواند کمتر از هزینهٔ ثبت‌شده باشد.');db.prepare('UPDATE loyalty_config SET body=?,version=version+1 WHERE id=1').run(JSON.stringify(clean));settings.audit(actor,'club.config','1',{version:cfg.version+1});return configuration();})();},
  spin(uid,key){return db.transaction(()=>{const cfg=configuration(),pk=period(now(),'monthly'),old=db.prepare('SELECT claim_id FROM loyalty_spins WHERE user_id=? AND period_key=?').get(uid,pk);if(old)return db.prepare('SELECT * FROM loyalty_claims WHERE id=?').get(old.claim_id);const state=spinStatus(uid,cfg);if(!state.eligible)fail('شرایط شانس طلایی کامل نیست یا ماه جاری استفاده شده است.',409);let n=crypto.randomInt(state.pool.reduce((s,x)=>s+x.spinWeight,0));let prize;for(const p of state.pool){n-=p.spinWeight;if(n<0){prize=p;break;}}if(db.prepare('SELECT 1 FROM loyalty_claims WHERE user_id=? AND idempotency_key=?').get(uid,key))fail('برای شانس ماه جدید شناسهٔ تازه لازم است.',409);const c=claim(uid,prize.id,key,true);db.prepare('INSERT INTO loyalty_spins VALUES(?,?,?)').run(uid,pk,c.id);return c;})();},
 };
}
module.exports={clubEngine,period,dateKey,fail};
