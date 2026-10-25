const {test}=require('node:test');
const assert=require('node:assert/strict');
const Database=require('better-sqlite3');
const express=require('express');
const {settingsStore}=require('../src/modules/settings/store');
const {paymentModule}=require('../src/modules/payments');
const {clubModule}=require('../src/modules/club');
const {period}=require('../src/modules/club/engine');
async function fixture(t){
 const db=new Database(':memory:');let time=Date.UTC(2026,9,20,12);
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT,role TEXT,mobile TEXT,created_at TEXT);
 INSERT INTO users VALUES(1,'شاگرد یک','student','09120000001','2026-10-20 11:00:00'),(2,'شاگرد دو','student','09120000002','2026-10-20 11:00:00'),(3,'مدیر','admin','09120000000','2026-10-20 11:00:00'),(4,'مدرس','teacher','09120000004','2026-10-20 11:00:00'),(5,'شاگرد سه','student','09120000005','2026-10-20 11:00:00');
 CREATE TABLE classes(id INTEGER PRIMARY KEY,title TEXT,kind TEXT,teacher_id INTEGER,capacity INTEGER,taken INTEGER,price INTEGER);INSERT INTO classes VALUES(1,'درس','private',1,5,0,10000);
 CREATE TABLE bookings(id INTEGER PRIMARY KEY,user_id INTEGER,class_id INTEGER,sessions INTEGER,people INTEGER,status TEXT);INSERT INTO bookings VALUES(1,1,1,1,1,'confirmed'),(2,2,1,1,1,'confirmed');
 CREATE TABLE coupons(code TEXT,percent INTEGER);
 CREATE TABLE class_occurrences(id INTEGER PRIMARY KEY,class_id INTEGER,teacher_id INTEGER,starts_at INTEGER,ends_at INTEGER,status TEXT);CREATE TABLE booking_occurrences(booking_id INTEGER,occurrence_id INTEGER);
 CREATE TABLE teacher_accounts(user_id INTEGER,teacher_id INTEGER,status TEXT);INSERT INTO teacher_accounts VALUES(4,1,'approved');
 CREATE TABLE chat_posts(id INTEGER PRIMARY KEY,room_id TEXT,sender_id INTEGER,text TEXT,created_at INTEGER,deleted_at INTEGER);CREATE TABLE chat_members(room_id TEXT,user_id INTEGER);
 `);
 const settings=settingsStore(db,Buffer.alloc(32,1)),app=express();app.use(express.json());const auth=(req,res,next)=>{req.user=db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.get('test-user')||1));if(!req.user)return res.status(401).json({error:'unauthorized'});next();};const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({error:'forbidden'});
 const finance=paymentModule(app,{db,auth,settings,providers:{},now:()=>time}),club=clubModule(app,{db,auth,requireRole,settings,finance,now:()=>time});
 app.use((req,res)=>res.status(404).json({error:'not found'}));app.use((e,req,res,next)=>res.status(e.status||500).json({error:e.message}));
 db.prepare('UPDATE bookings SET schema_version=2').run();
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));db.close();});
 const req=async(path,body,uid=1,method=body?'POST':'GET')=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api${path}`,{method,headers:{'Content-Type':'application/json','test-user':String(uid)},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 const update=fn=>{const c=club.configuration();fn(c);return club.save(c.version,c,3);};
 const occurrence=(id=1,uid=1,at=time-1800000)=>{db.prepare("INSERT INTO class_occurrences VALUES(?,1,1,?,?,'scheduled')").run(id,at-1800000,at);db.prepare('INSERT INTO booking_occurrences VALUES(?,?)').run(uid===1?1:2,id);};
 return {db,club,finance,req,update,occurrence,now:()=>time,advance:ms=>time+=ms};
}
const profile={alias:'نام مستعار',city:'تهران',province:'تهران',country:'IR',goal:'یادگیری پیوسته و درست',leagueOptIn:false};
test('club separates spendable coins from monotone points; real profile reward is once and client cannot forge events',async t=>{
 const f=await fixture(t);let d=await f.req('/club');assert.equal(d.data.account.points,0);assert.equal(d.data.levels.length,5);assert.equal(d.data.levels[4].minPoints,10000);
 assert.equal((await f.req('/club/profile',profile,1,'PUT')).status,200);await f.req('/club/profile',profile,1,'PUT');d=await f.req('/club');assert.equal(d.data.account.coins,10);assert.equal(d.data.account.points,50);
 assert.equal((await f.req('/club/events',{kind:'class.completed',points:999999})).status,404);assert.equal((await f.req('/admin/club/activities',{userId:1,kind:'webinar.completed',source:'fake-ref',note:'متن جعلی برای دسترسی غیرمجاز'})).status,403);
 assert.throws(()=>f.db.prepare("UPDATE loyalty_ledger SET coins=999").run(),/append-only/);
});
test('club event idempotency, weekly useful-message cap and configurable version checks persist',async t=>{
 const f=await fixture(t);for(let i=0;i<4;i++)f.club.ingest(1,'chat.helpful',`message:${i}`);
 const a=f.club.account(1);assert.equal(a.coins,15);assert.equal(a.points,60);f.club.ingest(1,'chat.helpful','message:0');assert.equal(f.club.account(1).coins,15);
 const c=f.club.configuration();f.update(x=>{x.studentLikes=4;});assert.throws(()=>f.club.save(c.version,c,3),{status:409});f.advance(7*86400000);f.club.ingest(1,'chat.helpful','next-week');assert.equal(f.club.account(1).coins,20);
});
test('wallet redemption is atomic, budget/stock checked and idempotent without reducing level points',async t=>{
 const f=await fixture(t);f.club.ingest(1,'profile.completed','profile');f.club.ingest(2,'profile.completed','profile');f.update(c=>{c.budgetToman=10000;const r=c.rewards.find(r=>r.id==='s-wallet-100000');Object.assign(r,{cost:5,valueToman:10000,stock:1,enabled:true});});
 const body={idempotencyKey:'reward_key_000000001'},a=await f.req('/club/rewards/s-wallet-100000/claim',body);assert.equal(a.status,200);const retry=await f.req('/club/rewards/s-wallet-100000/claim',body);assert.equal(retry.data.claim.id,a.data.claim.id);assert.equal(f.finance.walletBalance(1),100000);assert.equal(f.club.account(1).points,50);assert.equal(f.club.account(1).coins,5);
 assert.equal((await f.req('/club/rewards/s-wallet-100000/claim',{idempotencyKey:'reward_key_000000002'},2)).status,409);assert.equal(f.club.account(2).coins,10);
 assert.equal(f.db.prepare('SELECT SUM(amount_rial) s FROM ledger_entries').get().s,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM loyalty_claims').get().n,1);
 assert.throws(()=>f.update(c=>{c.budgetToman=9999;}));
});
test('failed finance credit rolls back coins, stock, budget and claim records',async t=>{
 const f=await fixture(t);f.club.ingest(1,'profile.completed','profile');f.update(c=>{c.budgetToman=10000;Object.assign(c.rewards.find(r=>r.id==='s-wallet-100000'),{cost:5,valueToman:10000,stock:1,enabled:true});});f.finance.journal=()=>{throw Error('provider unavailable');};
 assert.equal((await f.req('/club/rewards/s-wallet-100000/claim',{idempotencyKey:'failed_reward_key_0001'})).status,500);assert.equal(f.club.account(1).coins,10);assert.equal(f.club.spent(),0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM loyalty_claims').get().n,0);
});
test('verified attendance, not booking/payment, drives student and teacher rewards once',async t=>{
 const f=await fixture(t);f.occurrence();const body={presentUserIds:[1],attendedMinutes:30,note:'مدرک حضور کامل مدرس و شاگرد بررسی و تأیید شد.'};
 assert.equal(f.club.account(1).points,0);assert.equal((await f.req('/admin/club/sessions/1/verify',{...body,attendedMinutes:10},3)).status,400);assert.equal((await f.req('/admin/club/sessions/1/verify',{...body,presentUserIds:[5]},3)).status,400);
 assert.equal((await f.req('/admin/club/sessions/1/verify',body,3)).status,200);const before=f.club.account(1).points;assert.equal(before,150);assert.equal(f.club.account(4).points,50);await f.req('/admin/club/sessions/1/verify',body,3);assert.equal(f.club.account(1).points,before);
 assert.equal((await f.req('/admin/club/sessions/1/verify',{...body,presentUserIds:[2]},3)).status,409);
});
test('surveys require actual attendance; negative tags stay admin-only; replay cannot pay twice',async t=>{
 const f=await fixture(t);f.occurrence();await f.req('/admin/club/sessions/1/verify',{presentUserIds:[1],attendedMinutes:30,note:'حضور کامل مدرس و شاگرد در مدرک بررسی شده است.'},3);
 const survey={occurrenceId:1,toUserId:4,stars:5,positive:['mastery'],negative:['punctual']};assert.equal((await f.req('/club/surveys',survey,2)).status,400);assert.equal((await f.req('/club/surveys',survey)).status,200);const pts=f.club.account(1).points;await f.req('/club/surveys',survey);assert.equal(f.club.account(1).points,pts);
 const view=await f.req('/club',undefined,4);assert.ok(!JSON.stringify(view.data).includes('"negative"'));const admin=await f.req('/admin/club',undefined,3);assert.ok(admin.data.surveys[0].negative.includes('punctual'));assert.equal((await f.req('/club/surveys',{...survey,stars:1})).status,409);
});
test('leaderboard is disabled by default, opt-in, pseudonymous and location/period filtered',async t=>{
 const f=await fixture(t);assert.equal((await f.req('/club/league')).data.enabled,false);await f.req('/club/profile',profile,1,'PUT');await f.req('/club/profile',{...profile,alias:'عضو داوطلب',leagueOptIn:true},2,'PUT');f.update(c=>{c.leaderboardEnabled=true;});
 const r=await f.req('/club/league?city=تهران');assert.equal(r.data.rows.length,1);assert.equal(r.data.rows[0].alias,'عضو داوطلب');assert.equal(r.data.current,null);assert.ok(!JSON.stringify(r.data).includes('0912'));
});
test('golden chance checks real streak, stock and monthly replay; prizes come from reward catalog',async t=>{
 const f=await fixture(t);for(let i=0;i<4;i++)f.club.ingest(1,'chat.helpful',`week:${i}`,{at:f.now()-i*7*86400000});f.update(c=>{c.spinEnabled=true;Object.assign(c.rewards.find(r=>r.id==='s-advice'),{cost:500,stock:5,enabled:true,spinWeight:1});});assert.equal(f.club.streak(1).weeks,4);
 const a=await f.req('/club/spin',{idempotencyKey:'golden_chance_key_00001'});assert.equal(a.status,200);assert.equal(a.data.claim.cost,0);const b=await f.req('/club/spin',{idempotencyKey:'golden_chance_key_00002'});assert.equal(b.data.claim.id,a.data.claim.id);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM loyalty_claims').get().n,1);
});
test('unsupported financial benefits cannot be enabled and expiry/budget block redemptions',async t=>{
 const f=await fixture(t);assert.throws(()=>f.update(c=>{c.rewards.find(r=>r.type==='commission').enabled=true;}),{status:422});f.club.ingest(1,'profile.completed','profile');f.update(c=>{Object.assign(c.rewards.find(r=>r.id==='s-advice'),{enabled:true,cost:1,stock:2,expiresAt:f.now()-1});});assert.equal((await f.req('/club/rewards/s-advice/claim',{idempotencyKey:'expired_reward_key_00001'})).status,409);
});
test('academic report is teacher-authorized and has eight private, immutable indicators',async t=>{
 const f=await fixture(t);f.occurrence();await f.req('/admin/club/sessions/1/verify',{presentUserIds:[1],attendedMinutes:30,note:'گزارش حضور کامل بررسی و تأیید انسانی شده است.'},3);const body={occurrenceId:1,studentId:1,scores:[70,80,90,80,70,90,80,80]};assert.equal((await f.req('/club/academic',body)).status,403);assert.equal((await f.req('/club/academic',body,4)).status,200);assert.equal((await f.req('/club/academic',{...body,scores:Array(8).fill(100)},4)).status,409);assert.equal((await f.req('/club/academic')).data.reports.length,1);assert.equal((await f.req('/club/academic',undefined,2)).data.reports.length,0);
});
test('calendar periods use Tehran, Saturday weeks and Persian months',()=>{assert.equal(period(Date.UTC(2026,9,20,12),'weekly'),'2026-10-17');assert.equal(period(Date.UTC(2026,9,20,12),'monthly'),'1405-07');});
test('zero-cost/manual rewards enforce per-member cap; free spins share the same lifetime limit',async t=>{
 const f=await fixture(t);f.update(c=>{Object.assign(c.rewards.find(r=>r.id==='s-advice'),{cost:0,stock:10,enabled:true,spinWeight:1});c.spinEnabled=true;c.studentSpinWeeks=1;});f.club.ingest(1,'chat.helpful','activity');const key={idempotencyKey:'zero_cost_reward_key_001'};assert.equal((await f.req('/club/rewards/s-advice/claim',key)).status,200);assert.equal((await f.req('/club/rewards/s-advice/claim',key)).status,200);assert.equal((await f.req('/club/rewards/s-advice/claim',{idempotencyKey:'zero_cost_reward_key_002'})).status,409);assert.equal(f.club.spinStatus(1,f.club.configuration()).eligible,false);assert.equal((await f.req('/club')).data.rewards.find(r=>r.id==='s-advice').eligible,false);
});
test('teacher content medal requires three items in one Persian month; commitment requires reviewed non-cancelled sessions',async t=>{
 const f=await fixture(t);f.club.ingest(4,'content.published','old-item',{at:f.now()-35*86400000});f.club.ingest(4,'content.published','this-item-1');f.club.ingest(4,'content.published','this-item-2');assert.equal(f.db.prepare("SELECT COUNT(*) n FROM loyalty_medals WHERE medal_id='t-content'").get().n,0);f.club.ingest(4,'content.published','this-item-3');assert.equal(f.db.prepare("SELECT COUNT(*) n FROM loyalty_medals WHERE medal_id='t-content'").get().n,1);
 f.update(c=>{c.committedClasses=2;});f.occurrence(1);f.occurrence(2);const body={presentUserIds:[1],attendedMinutes:30,note:'شواهد حضور کامل مدرس و شاگرد در هر جلسه تأیید شد.'};await f.req('/admin/club/sessions/1/verify',body,3);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM loyalty_medals WHERE medal_id='t-committed'").get().n,0);await f.req('/admin/club/sessions/2/verify',body,3);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM loyalty_medals WHERE medal_id='t-committed'").get().n,1);
});
test('referral requires fresh non-self registration, binds once and pays first/third attended sessions only once',async t=>{
 const f=await fixture(t);const code=f.club.account(1).referral_code;assert.equal((await f.req('/club/referrals/accept',{code},1)).status,400);assert.equal((await f.req('/club/referrals/accept',{code},2)).status,200);assert.equal((await f.req('/club/referrals/accept',{code},2)).status,200);assert.equal(f.club.account(1).coins,30);for(let i=1;i<=3;i++){f.occurrence(i,2);assert.equal((await f.req(`/admin/club/sessions/${i}/verify`,{presentUserIds:[2],attendedMinutes:30,note:'مدرک حضور کامل دوست دعوت‌شده در جلسه بررسی شد.'},3)).status,200);}assert.equal(f.db.prepare("SELECT COUNT(*) n FROM loyalty_events WHERE user_id=1 AND kind IN ('referral.first','referral.three')").get().n,2);assert.equal(f.club.account(1).coins,190);f.advance(25*3600000);assert.equal((await f.req('/club/referrals/accept',{code},5)).status,409);f.db.prepare("UPDATE users SET created_at='not-a-date' WHERE id=5").run();assert.equal((await f.req('/club/referrals/accept',{code},5)).status,409);
});
test('club alias form is not professional teacher onboarding; profile reward needs explicit staff evidence',async t=>{
 const f=await fixture(t);assert.equal((await f.req('/club/profile',profile,4,'PUT')).status,200);assert.equal(f.club.account(4).coins,0);const body={userId:4,kind:'profile.completed',source:'teacher-profile-checked',note:'تمام مدارک و اجزای پروندهٔ حرفه‌ای استاد توسط مدیر بررسی شد.'};assert.equal((await f.req('/admin/club/activities',body,3)).status,200);assert.equal(f.club.account(4).coins,20);assert.equal(f.club.account(4).points,50);
});
test('likes are member-only, non-self, unique and disallowed when the 72-hour room is closed',async t=>{
 const f=await fixture(t);f.db.exec("CREATE TABLE chat_rooms(id TEXT PRIMARY KEY,closes_at INTEGER);INSERT INTO chat_rooms VALUES('room',NULL);INSERT INTO chat_members VALUES('room',1),('room',2);INSERT INTO chat_posts VALUES(1,'room',1,'محتوای آموزشی معتبر',1,NULL)");assert.equal((await f.req('/chats/room/messages/1/like',{},5)).status,404);assert.equal((await f.req('/chats/room/messages/1/like',{},1)).status,400);assert.equal((await f.req('/chats/room/messages/1/like',{},2)).data.likes,1);assert.equal((await f.req('/chats/room/messages/1/like',{},2)).data.likes,1);f.db.prepare('UPDATE chat_rooms SET closes_at=?').run(f.now()-1);assert.equal((await f.req('/chats/room/messages/1/like',{liked:false},2)).status,403);
});
test('scheduled rules use actual activity date; teacher descriptive >4 means five and referral medal counts valid signups',async t=>{
 const f=await fixture(t);f.update(c=>{const r=c.rules.find(r=>r.id==='s-profile');r.startsAt=f.now()+1000;r.endsAt=f.now()+10000;});f.club.ingest(1,'profile.completed','too-early');assert.equal(f.club.account(1).coins,0);f.advance(2000);f.club.ingest(1,'profile.completed','in-window');assert.equal(f.club.account(1).coins,10);
 for(let i=0;i<4;i++)f.club.ingest(4,'feedback.positive',`positive:${i}`);assert.equal(f.club.account(4).coins,0);f.club.ingest(4,'feedback.positive','positive:4');assert.equal(f.club.account(4).coins,10);for(let i=0;i<5;i++)f.club.ingest(4,'referral.registered',`signup:${i}`);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM loyalty_medals WHERE medal_id='t-ref'").get().n,1);
 assert.throws(()=>f.update(c=>{c.rules[0].startsAt=f.now()+100;c.rules[0].endsAt=f.now();}));
});
