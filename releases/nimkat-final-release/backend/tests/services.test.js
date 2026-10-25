const {onboard}=require('./helpers/onboarding');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const express = require('express');
const { settingsStore } = require('../src/modules/settings/store');
const { paymentModule } = require('../src/modules/payments');
const { chatModule } = require('../src/modules/chat');
async function fixture(t, options = {}) {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT,role TEXT); INSERT INTO users VALUES(1,'یک','student'),(2,'دو','student'),(3,'مدیر','admin');
    CREATE TABLE classes(id INTEGER PRIMARY KEY,title TEXT,capacity INTEGER,taken INTEGER,price INTEGER); INSERT INTO classes VALUES(1,'کلاس',2,0,10000);
    CREATE TABLE coupons(code TEXT,percent INTEGER);
    CREATE TABLE bookings(id INTEGER PRIMARY KEY,user_id INTEGER,class_id INTEGER,sessions INTEGER,people INTEGER,seats TEXT,friends TEXT,gross INTEGER,discount INTEGER,total INTEGER,per_person INTEGER,coupon TEXT,status TEXT);`);
  db.exec("ALTER TABLE users ADD COLUMN mobile TEXT; CREATE TABLE teachers(id INTEGER PRIMARY KEY,name TEXT); INSERT INTO teachers VALUES(1,'مدرس'),(2,'مدرس دوم'); ALTER TABLE classes ADD COLUMN mode TEXT; ALTER TABLE classes ADD COLUMN teacher_id INTEGER; UPDATE classes SET teacher_id=1; INSERT INTO users(id,name,role) VALUES(4,'مدرس','teacher');");
  const settings = settingsStore(db, Buffer.alloc(32, 1));
  let time = Date.now();
  const app = express(); app.use(express.json());
  const auth = (req,res,next) => { req.user = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.get('test-user') || 1)); next(); };
  const requireRole = role => (req,res,next) => req.user.role === role ? next() : res.status(403).json({error:'forbidden'});
  const emitted=[];const events = { emit(...args) {emitted.push(args);}, isOnline: () => false };
  require('../src/modules/blog').blogModule(app,{db,auth,requireRole,settings});
  const chat = chatModule(app, { db, auth, requireRole, settings, events, now: () => time });
  const providers = { paymentConfig: () => ({ sandbox: false, merchantId: 'secret', publicUrl: 'https://site.test' }), requestPayment: async (config,{id}) => ({ authority: `authority_${id}`, url: `https://sandbox.zarinpal.com/pg/StartPay/${id}` }), verifyPayment: async (config,{authority}) => ({ reference: authority }) };
  require('../src/modules/support').supportModule(app, {db,auth,requireRole,settings,events,now:()=>time});
  const scheduling = options.scheduling ? require('../src/modules/scheduling').schedulingModule(app, {db,auth,requireRole,settings,now:()=>time}) : undefined;
  const classroomCalls=[];
  const classroom=options.classroom?require('../src/modules/classroom').classroomModule(app,{db,auth,requireRole,settings,now:()=>time,fetcher:async(url,init)=>{const data=JSON.parse(init.body);classroomCalls.push(data);return {ok:true,json:async()=>({ok:true,result:data.action==='getLoginUrl'?(options.joinUrl||'https://www.skyroom.online/ch/test/join-token'):{id:81}})};}}):undefined;
  let earnings,friendly;
  const finance = paymentModule(app, {db,auth,settings,providers,scheduling,onConfirmed:chat.ensureClassRoom,onCreated:id=>earnings?.capture(id),now: () => time});
  if(options.refunds)require('../src/modules/payments/refunds').refundsModule(app,{db,auth,settings,finance,now:()=>time});
  const club=options.club?require('../src/modules/club').clubModule(app,{db,auth,requireRole,settings,finance,now:()=>time}):undefined;
  if(options.commerce){earnings=require('../src/modules/commerce/earnings').earningsModule(app,{db,auth,requireRole,settings,finance,commissionBenefit:club.commissionBenefit,now:()=>time});require('../src/modules/commerce/shop').shopModule(app,{db,auth,requireRole,settings,finance,now:()=>time});db.exec("ALTER TABLE classes ADD COLUMN kind TEXT DEFAULT 'friendly'");friendly=require('../src/modules/commerce/friendly').friendlyModule(app,{db,auth,requireRole,settings,finance,scheduling,capture:earnings.capture,onConfirmed:chat.ensureClassRoom,now:()=>time});}
  if(options.education){require('../src/modules/education/availability').availabilityModule(app,{db,now:()=>time});require('../src/modules/education/reviews').reviewsModule(app,{db,auth,requireRole,settings,now:()=>time});const education=require('../src/modules/education').educationModule(app,{db,auth,requireRole,settings,now:()=>time});require('../src/modules/education/materials').materialsModule(app,{db,auth,requireRole,settings,education,now:()=>time,scanner:options.scanner||(async()=>{})});require('../src/modules/panel/analytics').analyticsModule(app,{db,auth,requireRole,now:()=>time});}
  if(options.panel)require('../src/modules/panel').panelModule(app,{db,auth,finance,club,now:()=>time});
  app.use((e,req,res,next) => res.status(e.status || 500).json({ error:e.message }));
  const server = app.listen(0,'127.0.0.1'); await new Promise(r => server.once('listening',r));
  t.after(async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); db.close(); });
  const request = async (path, body, uid=1, method=body?'POST':'GET', headers={}) => { const r = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {method,redirect:'manual',headers:{'Content-Type':'application/json','test-user':String(uid),...headers},body:body?(Buffer.isBuffer(body)?body:JSON.stringify(body)):undefined}); return {status:r.status,data:r.status===303?null:r.headers.get('content-type')?.includes('application/json')?await r.json():Buffer.from(await r.arrayBuffer())}; };
  const book = (key='booking_key_0000001') => request('/bookings',{classId:1,sessions:1,people:1,idempotencyKey:key});
  const verify = async id => { const row=db.prepare('SELECT * FROM payment_intents WHERE id=?').get(id); return request(`/payments/callback/${id}?Status=OK&Authority=${row.authority}`); };
  return {earnings,friendly,classroom,classroomCalls,db,settings,finance,providers,request,book,verify,scheduling,club,emitted,advance: ms => time+=ms};
}
test('settings encrypt secrets, redact output, reject stale updates and tampering', async t => {
  const f=await fixture(t);
  const result=f.settings.update('payment',{version:0,config:{enabled:true},secrets:{merchantId:'merchant_secret_123'}},3);
  assert.equal(result.secrets.merchantId.configured,true);
  assert.ok(!JSON.stringify(result).includes('merchant_secret_123'));
  assert.ok(!f.db.prepare('SELECT secrets_enc FROM service_settings').get().secrets_enc.includes('merchant_secret_123'));
  assert.throws(()=>f.settings.update('payment',{version:0},3),{status:409});
  const sealed=f.settings.seal({value:'hidden'},'one'); assert.throws(()=>f.settings.open(sealed,'two'));
});
test('verified payment confirms once, idempotency protects retries and capacity', async t => {
  const f=await fixture(t), a=await f.book(); assert.equal(a.status,200); assert.equal(a.data.status,'held');
  const retry=await f.book(); assert.equal(retry.data.bookingId,a.data.bookingId);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM payment_intents').get().n,1);
  assert.equal((await f.verify(a.data.payment.id)).status,303); await f.verify(a.data.payment.id);
  assert.equal(f.db.prepare('SELECT status FROM bookings').get().status,'confirmed');
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM ledger_journals').get().n,1);
  assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);
  assert.equal(f.finance.walletBalance(1),0);
  await f.book('booking_key_0000002'); assert.equal((await f.book('booking_key_0000003')).status,409);
  assert.throws(()=>f.db.prepare('DELETE FROM ledger_entries').run(),/append-only/);
});
test('late verified payment credits wallet without allocating seats', async t => {
  const f=await fixture(t),a=await f.book(); f.advance(16*60000); await f.verify(a.data.payment.id);
  assert.equal(f.finance.walletBalance(1),100000);
  assert.equal(f.db.prepare('SELECT status FROM payment_intents').get().status,'paid_unallocated');
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM booking_seats').get().n,0);
  const wallet=await f.request('/bookings',{classId:1,sessions:1,people:1,method:'wallet',idempotencyKey:'wallet_booking_00001'});
  assert.equal(wallet.data.status,'confirmed'); assert.equal(f.finance.walletBalance(1),0);
});
test('unconfigured and unverified gateways never create spendable money', async t => {
  const f=await fixture(t);
  f.providers.paymentConfig=()=>{throw Object.assign(new Error('not configured'),{status:503});};
  assert.equal((await f.book()).status,503); assert.equal(f.finance.walletBalance(1),0);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM bookings').get().n,0);
});
test('chat enforces membership, idempotent messages, moderation and 72h expiry', async t => {
  const f=await fixture(t);
  assert.equal((await f.request('/chats/community')).status,404);
  await f.request('/chats/community/join',{});
  const body={text:'سلام',clientId:'message_unique_00001'};
  assert.equal((await f.request('/chats/community/messages',body)).status,200);
  await f.request('/chats/community/messages',body);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM chat_posts').get().n,1);
  assert.equal((await f.request('/chats/community',undefined,2)).status,404);
  const room=await f.request('/admin/chat/rooms',{title:'خصوصی',kind:'private',classEndsAt:Date.now(),userIds:[1]},3);
  assert.equal(room.status,200); f.advance(73*3600000);
  assert.equal((await f.request(`/chats/${room.data.id}/messages`,{...body,clientId:'message_unique_00002'})).status,403);
});

test('sandbox payment never credits real wallet or confirms a real reservation', async t => {
  const f=await fixture(t); f.providers.paymentConfig=()=>({sandbox:true,merchantId:'sandbox_secret',publicUrl:'https://site.test'});
  const a=await f.book(); await f.verify(a.data.payment.id);
  assert.equal(f.finance.walletBalance(1),0);
  assert.equal(f.db.prepare('SELECT status FROM bookings').get().status,'sandbox_complete');
  assert.equal(f.db.prepare('SELECT status FROM payment_intents').get().status,'sandbox_paid');
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM booking_seats').get().n,0);
});

test('support threads stay private, use published knowledge and allow human escalation', async t => {
  const f=await fixture(t);
  const created=await f.request('/support/threads',{}), id=created.data.thread.id;
  assert.equal((await f.request(`/support/threads/${id}`,undefined,2)).status,404);
  await f.request('/admin/support/articles',{title:'راهنما',keywords:'ثبت نام',text:'برای ثبت نام شماره موبایل لازم است.'},3);
  assert.equal((await f.request(`/support/threads/${id}/messages`,{text:'ثبت نام چگونه است؟'})).status,200);
  const detail=await f.request(`/support/threads/${id}`); assert.equal(detail.data.messages.length,2);
  assert.match(detail.data.messages[1].text,/شماره موبایل/);
  await f.request(`/support/threads/${id}/escalate`,{});
  await f.request(`/admin/support/${id}/reply`,{text:'پاسخ کارشناس',close:true},3);
  assert.equal((await f.request(`/support/threads/${id}`)).data.thread.status,'closed');
});

test('support inbox restricts admins, filters and rejects missing requests', async t => {
  const f=await fixture(t);
  assert.equal((await f.request('/admin/support')).status,403);
  const created=await f.request('/support/threads',{}), id=created.data.thread.id;
  await f.request(`/support/threads/${id}/escalate`,{});
  const inbox=await f.request('/admin/support?status=waiting',undefined,3);
  assert.equal(inbox.status,200); assert.equal(inbox.data.threads[0].id,id);
  assert.equal((await f.request('/admin/support?status=invalid',undefined,3)).status,400);
  assert.equal((await f.request('/admin/support/missing',undefined,3)).status,404);
});
test('support guide publication and versioning protect knowledge, messages retry safely', async t => {
  const f=await fixture(t);
  const article=await f.request('/admin/support/articles',{title:'ورود',keywords:'ورود',text:'از شماره موبایل استفاده کنید.'},3), aid=article.data.id;
  let publicArticles=await f.request('/support/articles'); assert.ok(publicArticles.data.articles.some(a=>a.id===aid));
  const edit={title:'ورود',keywords:'ورود',text:'اطلاعات داخلی',published:false,version:1};
  assert.equal((await f.request(`/admin/support/articles/${aid}`,edit,3,'PUT')).status,200);
  assert.equal((await f.request(`/admin/support/articles/${aid}`,edit,3,'PUT')).status,409);
  publicArticles=await f.request('/support/articles');assert.ok(!publicArticles.data.articles.some(a=>a.id===aid));
  const created=await f.request('/support/threads',{}),id=created.data.thread.id;
  const message={text:'ورود چگونه است؟',clientId:'support_client_000001'};
  await f.request(`/support/threads/${id}/messages`,message);
  await f.request(`/support/threads/${id}/messages`,message);
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM support_posts WHERE kind='user'").get().n,1);
  assert.ok(!(await f.request(`/support/threads/${id}`)).data.messages[1].text.includes('اطلاعات داخلی'));
  assert.equal((await f.request(`/support/threads/${id}/messages`,{...message,text:'متن متفاوت'})).status,409);
});
test('closed support requests require explicit reopen and messages are paginated', async t=>{
  const f=await fixture(t), created=await f.request('/support/threads',{}),id=created.data.thread.id;
  for(let i=0;i<55;i++) f.db.prepare("INSERT INTO support_posts(thread_id,kind,text,created_at) VALUES (?,'user',?,?)").run(id,`پیام ${i}`,Date.now());
  const page=await f.request(`/support/threads/${id}`);assert.equal(page.data.messages.length,50);assert.equal(page.data.hasMore,true);
  const older=await f.request(`/support/threads/${id}?before=${page.data.messages[0].id}`);assert.equal(older.data.messages.length,5);
  await f.request(`/admin/support/${id}/reply`,{text:'پیگیری شد',close:true,clientId:'support_reply_000001'},3);
  assert.equal((await f.request(`/admin/support/${id}/reply`,{text:'پاسخ دیگر'},3)).status,409);
  assert.equal((await f.request(`/admin/support/${id}/reopen`,{},3)).status,200);
  assert.equal((await f.request(`/support/threads/${id}`)).data.thread.status,'human');
  // Repeated escalation must not move a human conversation back into the waiting queue.
  await f.request(`/support/threads/${id}/escalate`,{});
  assert.equal((await f.request(`/support/threads/${id}`)).data.thread.status,'human');
});

test('teacher approval requires admin review, unique profile and optimistic version',async t=>{
 const f=await fixture(t,{scheduling:true});
 const body={bio:'سوابق تدریس معتبر برای بررسی توسط مدیر سامانه',subject:'فیزیک'};
 assert.equal((await f.request('/teacher/application',body)).status,403);
 assert.equal((await f.request('/teacher/application',body,4)).status,422);
 await onboard(f);
 assert.equal((await f.request('/admin/teaching',undefined,4)).status,403);
 assert.equal((await f.request('/admin/teaching/applications/4/review',{status:'approved',teacherId:1,version:1,profileVerified:true},3)).status,200);
 assert.equal(f.scheduling.teacherIdFor({id:4}),1);
 assert.equal((await f.request('/admin/teaching/applications/4/review',{status:'approved',teacherId:2,version:1},3)).status,409);
 assert.equal((await f.request('/teacher/application',body,4)).status,422);
});
test('approved schedule prevents teacher collisions and blocks unscheduled bookings',async t=>{
 const f=await fixture(t,{scheduling:true});
 const start=Date.now()+86400000;
 const slot={classId:1,startsAt:start,endsAt:start+3600000};
 assert.equal((await f.request('/admin/teaching/occurrences',slot,3)).status,422);
 await onboard(f);
 await f.request('/admin/teaching/applications/4/review',{status:'approved',teacherId:1,version:1,profileVerified:true},3);
 const result=await f.request('/admin/teaching/occurrences',slot,3);assert.equal(result.status,200);
 assert.equal((await f.request('/admin/teaching/occurrences',{...slot,startsAt:start+1800000},3)).status,409);
 assert.equal((await f.book()).status,400);
 const b=await f.request('/bookings',{classId:1,sessions:1,people:1,idempotencyKey:'scheduled_booking_001',occurrenceIds:[result.data.id]});assert.equal(b.status,200);
 assert.equal((await f.request(`/admin/teaching/occurrences/${result.data.id}/cancel`,{},3)).status,409);
 await f.verify(b.data.payment.id);
 assert.equal((await f.request('/bookings',{classId:1,sessions:1,people:1,idempotencyKey:'overlap_booking_00001',occurrenceIds:[result.data.id]})).status,409);
 assert.equal((await f.request('/schedule/mine')).data.occurrences.length,1);
 assert.equal((await f.request('/schedule/mine',undefined,2)).data.occurrences.length,0);
 assert.equal((await f.request(`/admin/teaching/occurrences/${result.data.id}/cancel`,{},3)).status,409);
});
test('cancelled schedules cannot be booked; expired holds no longer block cancellation',async t=>{
 const f=await fixture(t,{scheduling:true});const start=Date.now()+86400000;
 await onboard(f);
 await f.request('/admin/teaching/applications/4/review',{status:'approved',teacherId:1,version:1,profileVerified:true},3);
 const result=await f.request('/admin/teaching/occurrences',{classId:1,startsAt:start,endsAt:start+3600000},3);
 const payload={classId:1,sessions:1,people:1,idempotencyKey:'scheduled_expire_001',occurrenceIds:[result.data.id]};
 assert.equal((await f.request('/bookings',payload)).status,200);f.advance(16*60000);
 assert.equal((await f.request(`/admin/teaching/occurrences/${result.data.id}/cancel`,{},3)).status,200);
 assert.equal((await f.request('/classes/1/schedule')).data.occurrences.length,0);
 assert.equal((await f.request('/bookings',{...payload,idempotencyKey:'scheduled_expire_002'})).status,409);
});

test('blog drafts, publication snapshots and RSS data exclude unpublished content',async t=>{
 const f=await fixture(t);const draft={slug:'safe-article',title:'عنوان مقاله کاربردی',excerpt:'این خلاصهٔ یک یادداشت آموزشی برای آزمون انتشار و نسخه‌بندی است.',category:'یادگیری',author:'تحریریه نیمکت',seoTitle:'',seoDescription:'',cover:'study',coverAlt:'تصویر کتاب',tags:['یادگیری'],sections:[{type:'text',heading:'عنوان بخش',text:'متن کاربردی مقاله که از بیست نویسه بیشتر است و به صورت متن امن نمایش داده می‌شود.'}],faq:[]};
 assert.equal((await f.request('/admin/blog',draft)).status,403);
 const created=await f.request('/admin/blog',draft,3);assert.equal(created.status,201);const id=created.data.id;
 assert.equal((await f.request('/blog/safe-article')).status,404);assert.equal((await f.request('/blog/feed')).data.posts.length,0);
 assert.equal((await f.request(`/admin/blog/${id}/publish`,{version:1},3)).status,200);
 assert.equal((await f.request('/blog/safe-article')).data.post.title,draft.title);
 assert.equal((await f.request(`/admin/blog/${id}`,{...draft,title:'عنوان پیش نویس متفاوت',version:2},3,'PUT')).status,200);
 assert.equal((await f.request('/blog/safe-article')).data.post.title,draft.title);
 assert.equal((await f.request(`/admin/blog/${id}/publish`,{version:2},3)).status,409);
 assert.equal((await f.request(`/admin/blog/${id}/unpublish`,{version:3},3)).status,200);
 assert.equal((await f.request('/blog/feed')).data.posts.length,0);
});
test('phone-first guest support is capability-scoped, retry-safe and never an account login',async t=>{
 const f=await fixture(t);
 assert.equal((await f.request('/support/guest/start',{phone:'09121112222',consent:false})).status,400);
 const r=await f.request('/support/guest/start',{name:'مهمان',phone:'۰۹۱۲۱۱۱۲۲۲۲',consent:true});assert.equal(r.status,201);
 const {token,thread}=r.data,headers={'X-Support-Token':token};
 assert.ok(!f.db.prepare('SELECT token_hash FROM support_guests').get().token_hash.includes(token));
 assert.equal((await f.request(`/support/guest/threads/${thread.id}`)).status,401);
 const msg={text:'انتخاب کلاس مناسب',clientId:'guest_message_0000001'};
 assert.equal((await f.request(`/support/guest/threads/${thread.id}/messages`,msg,1,'POST',headers)).status,200);
 await f.request(`/support/guest/threads/${thread.id}/messages`,msg,1,'POST',headers);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM support_posts WHERE kind='user'").get().n,1);
 const detail=await f.request(`/support/guest/threads/${thread.id}`,undefined,1,'GET',headers);assert.equal(detail.data.thread.guest,true);assert.match(detail.data.messages.at(-1).text,/کلاس/);
 assert.equal((await f.request('/admin/support/guests')).status,403);
 assert.equal((await f.request('/admin/support/guests',undefined,3)).data.threads[0].phone,'09121112222');
 await f.request(`/support/guest/threads/${thread.id}/escalate`,{},1,'POST',headers);
 const reply={text:'پاسخ انسانی ثبت شد',clientId:'guest_reply_00000001',close:true};
 assert.equal((await f.request(`/admin/support/guests/${thread.id}/reply`,reply,3)).status,200);
 assert.equal((await f.request(`/support/guest/threads/${thread.id}`,undefined,1,'GET',headers)).data.thread.status,'closed');
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM users').get().n,4);
});
async function discountFixture(t,extra={}){
 const f=await fixture(t,{club:true});f.club.ingest(1,'profile.completed','profile:test');const cfg=f.club.configuration();cfg.budgetToman=10000;Object.assign(cfg.rewards.find(r=>r.id==='s-discount-5'),{cost:5,percent:50,valueToman:1000,stock:5,enabled:true,...extra});f.club.save(cfg.version,cfg,3);const claim=await f.request('/club/rewards/s-discount-5/claim',{idempotencyKey:'discount_claim_key_00001'});assert.equal(claim.status,200);return {...f,claim:claim.data.claim,voucher:f.finance.voucherForClaim(1,claim.data.claim.id)};
}
test('club discount issuance is owned, capped, immutable and idempotent; it never reduces points',async t=>{
 const f=await discountFixture(t);assert.match(f.voucher.code,/^NKCLUB_[A-F0-9]{32}$/);assert.equal(f.claim.status,'fulfilled');assert.equal(f.club.account(1).coins,5);assert.equal(f.club.account(1).points,50);await f.request('/club/rewards/s-discount-5/claim',{idempotencyKey:'discount_claim_key_00001'});assert.equal(f.db.prepare('SELECT COUNT(*) n FROM club_discount_vouchers').get().n,1);assert.throws(()=>f.db.prepare('UPDATE club_discount_vouchers SET cap_toman=999999').run(),/append-only/);const quote=await f.request('/bookings/quote',{classId:1,coupon:f.voucher.code});assert.equal(quote.data.coupon_off,1000);assert.equal(quote.data.total,9000);assert.equal((await f.request('/bookings/quote',{classId:1,coupon:f.voucher.code},2)).status,400);assert.ok(!JSON.stringify((await f.request('/club',undefined,2)).data).includes(f.voucher.code));
});
test('wallet booking consumes a club discount atomically once and journals the actual subsidy, not the reserved cap twice',async t=>{
 const f=await discountFixture(t);f.finance.journal('voucher-test-funds','test',[{account:'test:funding',amount:-500000},{account:'user:1',amount:500000}]);const body={classId:1,method:'wallet',coupon:f.voucher.code,idempotencyKey:'voucher_wallet_booking_001'};const booked=await f.request('/bookings',body);assert.equal(booked.status,200);assert.equal(booked.data.total,9000);assert.equal((await f.request('/bookings',body)).data.bookingId,booked.data.bookingId);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'consumed');assert.equal(f.finance.walletBalance(1),410000);assert.equal(f.db.prepare("SELECT SUM(amount_rial) n FROM ledger_entries WHERE account='platform:escrow'").get().n,100000);assert.equal(f.db.prepare("SELECT SUM(amount_rial) n FROM ledger_entries WHERE account='platform:club-expense'").get().n,-10000);assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);assert.equal((await f.request('/bookings',{...body,idempotencyKey:'voucher_wallet_booking_002'})).status,409);assert.equal(f.club.account(1).points,50);
});
test('gateway holds lock the voucher; late payment after expiry releases it and credits only actual money',async t=>{
 const f=await discountFixture(t);const body={classId:1,coupon:f.voucher.code,idempotencyKey:'voucher_gateway_booking_001'};const booked=await f.request('/bookings',body);assert.equal(booked.status,200);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'reserved');assert.equal((await f.request('/bookings',{...body,idempotencyKey:'voucher_gateway_booking_002'})).status,409);f.advance(16*60000);await f.verify(booked.data.payment.id);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'available');assert.equal(f.finance.walletBalance(1),90000);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM ledger_journals WHERE kind='club_discount'").get().n,0);assert.equal((await f.request('/bookings',{...body,method:'wallet',idempotencyKey:'voucher_gateway_booking_003'})).status,200);assert.equal(f.finance.walletBalance(1),0);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'consumed');
});
test('failed gateway creation and sandbox payment release vouchers without real subsidy or spendable sandbox money',async t=>{
 const f=await discountFixture(t),provider=f.providers.requestPayment;f.providers.requestPayment=async()=>{throw Error('provider down');};const body={classId:1,coupon:f.voucher.code,idempotencyKey:'voucher_failure_booking_001'};assert.equal((await f.request('/bookings',body)).status,503);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'available');f.providers.requestPayment=provider;f.providers.paymentConfig=()=>({sandbox:true,merchantId:'test',publicUrl:'https://example.test'});const sandbox=await f.request('/bookings',{...body,idempotencyKey:'voucher_sandbox_booking_001'});assert.equal(sandbox.status,200);await f.verify(sandbox.data.payment.id);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'available');assert.equal(f.finance.walletBalance(1),0);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM ledger_journals WHERE kind='club_discount'").get().n,0);
});
test('voucher expiry and insufficient funds do not create reservations or debit the wallet',async t=>{
 const f=await discountFixture(t,{expiresAt:Date.now()+5000});assert.equal((await f.request('/bookings',{classId:1,coupon:f.voucher.code,method:'wallet',idempotencyKey:'voucher_no_money_booking_001'})).status,402);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM club_discount_reservations').get().n,0);f.advance(6000);assert.equal((await f.request('/bookings/quote',{classId:1,coupon:f.voucher.code})).status,409);assert.equal(f.finance.voucherForClaim(1,f.claim.id).status,'expired');assert.equal(f.finance.walletBalance(1),0);
});
test('failed voucher issuance rolls the whole club redemption back',async t=>{
 const f=await fixture(t,{club:true});f.club.ingest(1,'profile.completed','profile');const cfg=f.club.configuration();cfg.budgetToman=10000;Object.assign(cfg.rewards.find(r=>r.id==='s-discount-5'),{cost:5,stock:2,enabled:true,valueToman:1000});f.club.save(cfg.version,cfg,3);f.finance.issueVoucher=()=>{throw Error('issuance failed');};assert.equal((await f.request('/club/rewards/s-discount-5/claim',{idempotencyKey:'voucher_failed_claim_001'})).status,500);assert.equal(f.club.account(1).coins,10);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM loyalty_claims').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM club_discount_vouchers').get().n,0);
});
test('moderation normalizes Persian/Arabic letters and hidden characters, respects roles and does not replay-send old messages',async t=>{
 const f=await fixture(t);await f.request('/chats/community/join',{});const body={text:'این یک كتاب آموزشی است',clientId:'moderation_message_0001'};assert.equal((await f.request('/chats/community/messages',body)).status,200);assert.equal((await f.request('/admin/chat/moderation',{version:0,enabled:true,words:['كتاب']},1,'PUT')).status,403);assert.equal((await f.request('/admin/chat/moderation',{version:0,enabled:true,words:['كتاب']},3,'PUT')).status,200);assert.equal((await f.request('/chats/community/messages',body)).status,200);assert.equal((await f.request('/chats/community/messages',{text:'یک کِت\u200cاب جدید',clientId:'moderation_message_0002'})).status,422);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM chat_posts').get().n,1);assert.equal((await f.request('/admin/chat/moderation',{version:0,enabled:false,words:[]},3,'PUT')).status,409);assert.equal((await f.request('/admin/chat/moderation',{version:1,enabled:true,words:['كتاب','کتاب']},3,'PUT')).status,400);
});
test('chat invitations are private and do not grant membership before explicit acceptance',async t=>{
 const f=await fixture(t);const room=(await f.request('/admin/chat/rooms',{title:'گروه دعوت‌محور آزمون',userIds:[1]},3)).data.id;assert.equal((await f.request(`/chats/${room}`,undefined,2)).status,404);assert.equal((await f.request(`/admin/chat/rooms/${room}/invitations`,{userId:2},1)).status,403);await f.request(`/admin/chat/rooms/${room}/invitations`,{userId:2},3);assert.equal((await f.request('/chats',undefined,2)).data.invitations.length,1);assert.equal((await f.request(`/chats/${room}`,undefined,2)).status,404);assert.equal((await f.request(`/chats/${room}/invitation`,{accept:true},4)).status,404);assert.equal((await f.request(`/chats/${room}/invitation`,{accept:true},2)).status,200);assert.equal((await f.request(`/chats/${room}/invitation`,{accept:true},2)).status,200);assert.equal((await f.request(`/chats/${room}`,undefined,2)).status,200);await f.request(`/admin/chat/rooms/${room}/invitations`,{userId:4},3);assert.equal((await f.request(`/chats/${room}/invitation`,{accept:false},4)).status,200);assert.equal((await f.request(`/chats/${room}`,undefined,4)).status,404);assert.equal((await f.request(`/chats/${room}/invitation`,{accept:true},4)).status,409);
});
test('reported-message review is admin-only, audited, idempotent and hides removed text from members',async t=>{
 const f=await fixture(t);await f.request('/chats/community/join',{});await f.request('/chats/community/join',{},2);const post=(await f.request('/chats/community/messages',{text:'محتوای گزارش‌شونده برای بررسی انسانی',clientId:'reported_message_0001'})).data.message;await f.request(`/chats/community/messages/${post.id}/report`,{reason:'نیازمند بررسی قوانین گفتگو'},2);const report=(await f.request('/admin/chat/reports',undefined,3)).data.reports[0];const decision={status:'removed',note:'محتوای پیام بررسی و حذف آن مطابق قواعد تأیید شد.'};assert.equal((await f.request(`/admin/chat/reports/${report.id}/resolve`,decision,2)).status,403);assert.equal((await f.request(`/admin/chat/reports/${report.id}/resolve`,decision,3)).status,200);assert.equal((await f.request(`/admin/chat/reports/${report.id}/resolve`,decision,3)).status,200);assert.equal((await f.request('/chats/community')).data.messages[0].text,'این پیام حذف شده است.');assert.equal((await f.request('/admin/chat/reports?status=removed',undefined,3)).data.total,1);assert.equal((await f.request('/admin/chat/reports',undefined,1)).status,403);
});
test('chat history cursor pages without duplicates and repeated read markers cannot trigger SSE read loops',async t=>{
 const f=await fixture(t);await f.request('/chats/community/join',{});await f.request('/chats/community/join',{},2);for(let i=0;i<55;i++)await f.request('/chats/community/messages',{text:`پیام شماره ${i}`,clientId:`history_message_${String(i).padStart(4,'0')}`});const latest=(await f.request('/chats/community',undefined,2)).data;assert.equal(latest.messages.length,50);const older=(await f.request(`/chats/community?before=${latest.messages[0].id}`,undefined,2)).data;assert.equal(older.messages.length,5);assert.equal(new Set([...older.messages,...latest.messages].map(m=>m.id)).size,55);const before=f.emitted.filter(e=>e[1]==='chat.read').length;await f.request('/chats/community/read',{messageId:55},2);await f.request('/chats/community/read',{messageId:55},2);assert.equal(f.emitted.filter(e=>e[1]==='chat.read').length,before+1);
});

async function scheduledFixture(t,options={}){
 const f=await fixture(t,{scheduling:true,...options});await onboard(f);const reviewed=await f.request('/admin/teaching/applications/4/review',{status:'approved',teacherId:1,version:1,profileVerified:true},3);assert.equal(reviewed.status,200);const start=Date.now()+2*3600000,end=start+3600000;
 const created=await f.request('/admin/schedule/batches',{classId:1,occurrences:[{startsAt:start,endsAt:end}],key:'schedule_batch_00001'},3);assert.equal(created.status,200,JSON.stringify(created.data));return {...f,start,end,oid:created.data.ids[0]};
}
test('recurring batch creation is atomic/idempotent and travel buffer protects physical classes',async t=>{
 const f=await scheduledFixture(t);const count=f.db.prepare('SELECT COUNT(*) n FROM class_occurrences').get().n;
 const body={classId:1,occurrences:[{startsAt:f.start+7*86400000,endsAt:f.end+7*86400000},{startsAt:f.start+7*86400000,endsAt:f.end+7*86400000}],key:'schedule_batch_00002'};
 assert.equal((await f.request('/admin/schedule/batches',body,3)).status,409);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM class_occurrences').get().n,count);
 f.db.prepare("UPDATE classes SET mode='حضوری'").run();assert.equal((await f.request('/admin/schedule/batches',{...body,occurrences:[{startsAt:f.end+10*60000,endsAt:f.end+70*60000}]},3)).status,409);
 body.occurrences=[{startsAt:f.start+7*86400000,endsAt:f.end+7*86400000}];const a=await f.request('/admin/schedule/batches',body,3),b=await f.request('/admin/schedule/batches',body,3);assert.deepEqual(a.data,b.data);assert.equal(a.status,200);assert.equal((await f.request('/admin/schedule/batches',body,1)).status,403);
});
test('calendar is owner-scoped, includes approved teachers, and validates query ranges',async t=>{
 const f=await scheduledFixture(t);assert.equal((await f.request('/calendar')).data.occurrences.length,0);assert.equal((await f.request('/calendar',undefined,4)).data.occurrences.length,1);assert.equal((await f.request('/calendar?offset=-1')).status,400);
 const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'calendar_booking_key1'});assert.equal(b.status,200);await f.verify(b.data.payment.id);assert.equal((await f.request('/calendar')).data.occurrences.length,1);assert.equal((await f.request('/calendar',undefined,2)).data.occurrences.length,0);
});
test('rescheduling requires every booked student and teacher, then updates chat expiry atomically',async t=>{
 const f=await scheduledFixture(t);const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'reschedule_booking1'});await f.verify(b.data.payment.id);
 const proposal=await f.request(`/admin/schedule/${f.oid}/proposals`,{startsAt:f.start+86400000,endsAt:f.end+86400000,reason:'جابجایی زمان با رضایت تمام اعضای جلسه'},3);assert.equal(proposal.status,200);const id=proposal.data.id;
 assert.equal((await f.request(`/schedule/proposals/${id}/respond`,{decision:'accepted'},2)).status,404);
 assert.equal((await f.request(`/schedule/proposals/${id}/respond`,{decision:'accepted'},1)).data.status,'pending');assert.equal(f.db.prepare('SELECT starts_at FROM class_occurrences').get().starts_at,f.start);
 assert.equal((await f.request(`/schedule/proposals/${id}/respond`,{decision:'accepted'},4)).data.status,'applied');assert.equal(f.db.prepare('SELECT starts_at FROM class_occurrences').get().starts_at,f.start+86400000);assert.equal(f.db.prepare("SELECT closes_at FROM chat_rooms WHERE kind='class'").get().closes_at,f.end+86400000+72*3600000);
 assert.equal((await f.request(`/schedule/proposals/${id}/respond`,{decision:'accepted'},4)).data.status,'applied');
});
test('rejected or expired schedule changes never move a class, and pending proposals stop new bookings',async t=>{
 const f=await scheduledFixture(t);const p=await f.request(`/admin/schedule/${f.oid}/proposals`,{startsAt:f.start+86400000,endsAt:f.end+86400000,reason:'درخواست تغییر آزمایشی زمان کلاس'},3),id=p.data.id;
 assert.equal((await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'pending_schedule_book'})).status,409);
 assert.equal((await f.request(`/schedule/proposals/${id}/respond`,{decision:'rejected'},4)).data.status,'rejected');assert.equal(f.db.prepare('SELECT starts_at FROM class_occurrences').get().starts_at,f.start);
 const q=await f.request(`/admin/schedule/${f.oid}/proposals`,{startsAt:f.start+86400000,endsAt:f.end+86400000,reason:'درخواست تغییر دوباره زمان کلاس'},3);f.advance(3*3600000);assert.equal((await f.request(`/schedule/proposals/${q.data.id}/respond`,{decision:'accepted'},4)).status,409);
});
function classroomConfig(f){f.settings.update('classroom',{version:0,config:{enabled:true,domain:'test-account'},secrets:{apiKey:'provider_api_key_test',webhookSecret:'a'.repeat(32)}},3);}
test('classroom fails closed before configuration and only admits eligible participants within the join window',async t=>{
 const f=await scheduledFixture(t,{classroom:true});assert.equal((await f.request(`/classroom/${f.oid}/join`,{},2)).status,403);assert.equal((await f.request(`/classroom/${f.oid}/join`,{},4)).status,409);f.advance(110*60000);assert.equal((await f.request(`/classroom/${f.oid}/join`,{},4)).status,503);
 classroomConfig(f);const joined=await f.request(`/classroom/${f.oid}/join`,{},4);assert.equal(joined.status,200);assert.ok(joined.data.url.startsWith('https://www.skyroom.online/'));const retry=await f.request(`/classroom/${f.oid}/join`,{},4);assert.equal(retry.status,200);assert.equal(f.classroomCalls.filter(c=>c.action==='getRoom').length,1);assert.equal(f.classroomCalls.find(c=>c.action==='getLoginUrl').params.operator,true);
});
test('provider join URL cannot redirect outside the allowlisted HTTPS host',async t=>{
 const f=await scheduledFixture(t,{classroom:true,joinUrl:'https://skyroom.online.evil.test/steal'});classroomConfig(f);f.advance(110*60000);assert.equal((await f.request(`/classroom/${f.oid}/join`,{},4)).status,502);
});
test('signed provider attendance rejects tampering/replay mutation and unions overlapping intervals privately',async t=>{
 const f=await scheduledFixture(t,{classroom:true});classroomConfig(f);const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'attendance_booking1'});await f.verify(b.data.payment.id);f.advance(4*3600000);
 const body={eventId:'attendance_event_0001',occurrenceId:f.oid,userId:1,joinedAt:f.start,leftAt:f.end},crypto=require('node:crypto');
 const timestamp=String(Date.now()+4*3600000);const headers={'x-nimkat-timestamp':timestamp,'x-nimkat-signature':'sha256='+crypto.createHmac('sha256','a'.repeat(32)).update(timestamp+'.'+JSON.stringify(body)).digest('hex')};
 assert.equal((await f.request('/classroom/attendance/events',body,1)).status,401);assert.equal((await f.request('/classroom/attendance/events',body,1,'POST',headers)).status,200);assert.equal((await f.request('/classroom/attendance/events',body,1,'POST',headers)).status,200);assert.equal((await f.request('/classroom/attendance/events',{...body,leftAt:f.end-60000},1,'POST',headers)).status,401);
 const second={...body,eventId:'attendance_event_0002',joinedAt:f.start+60000};headers['x-nimkat-signature']='sha256='+crypto.createHmac('sha256','a'.repeat(32)).update(timestamp+'.'+JSON.stringify(second)).digest('hex');assert.equal((await f.request('/classroom/attendance/events',second,1,'POST',headers)).status,200);
 assert.equal((await f.request(`/classroom/${f.oid}/attendance`)).data.attendance[0].minutes,60);assert.equal((await f.request(`/classroom/${f.oid}/attendance`,undefined,2)).status,403);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM classroom_attendance').get().n,2);
});
test('partial then full future-service refunds credit only real paid money exactly once and release capacity',async t=>{
 const f=await scheduledFixture(t,{refunds:true});const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'refund_booking_key1'});await f.verify(b.data.payment.id);const id=b.data.bookingId;
 assert.equal((await f.request(`/bookings/${id}/refunds`,{amountToman:10000,key:'refund_request_other1',reason:'درخواست بازپرداخت برای حساب دیگر'},2)).status,404);
 const first=await f.request(`/bookings/${id}/refunds`,{amountToman:4000,key:'refund_request_key01',reason:'بازپرداخت جزئی با بررسی مدیر سامانه'});assert.equal(first.status,200);
 assert.equal((await f.request(`/admin/refunds/${first.data.refund.id}/review`,{decision:'credited',note:'بازپرداخت جزئی به کیف پول تأیید شد'},1)).status,403);
 const review={decision:'credited',note:'بازپرداخت جزئی به کیف پول تأیید شد'};assert.equal((await f.request(`/admin/refunds/${first.data.refund.id}/review`,review,3)).status,200);await f.request(`/admin/refunds/${first.data.refund.id}/review`,review,3);assert.equal(f.finance.walletBalance(1),40000);assert.equal(f.db.prepare('SELECT status FROM bookings').get().status,'confirmed');
 const rest=await f.request(`/bookings/${id}/refunds`,{amountToman:6000,key:'refund_request_key02',reason:'بازپرداخت باقی‌مانده و لغو کل رزرو'});assert.equal(rest.status,200);await f.request(`/admin/refunds/${rest.data.refund.id}/review`,{decision:'credited',note:'بازپرداخت کامل باقی‌مانده با لغو کلاس'},3);assert.equal(f.finance.walletBalance(1),100000);assert.equal(f.db.prepare('SELECT status FROM bookings').get().status,'refunded');assert.equal(f.db.prepare('SELECT COUNT(*) n FROM booking_seats').get().n,0);assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);assert.equal((await f.request('/calendar')).data.occurrences.length,0);
});
test('refund rejects overpayment, concurrent requests and service already started',async t=>{
 const f=await scheduledFixture(t,{refunds:true});const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'refund_booking_key2'});await f.verify(b.data.payment.id);const path=`/bookings/${b.data.bookingId}/refunds`,body={amountToman:10001,key:'refund_request_key03',reason:'درخواست بازپرداخت بیش از پرداخت واقعی'};assert.equal((await f.request(path,body)).status,400);body.amountToman=10000;const r=await f.request(path,body);assert.equal(r.status,200);assert.equal((await f.request(path,{...body,key:'refund_request_key04'})).status,409);f.advance(3*3600000);assert.equal((await f.request(`/admin/refunds/${r.data.refund.id}/review`,{decision:'credited',note:'نباید پس از شروع کلاس خودکار تأیید شود'},3)).status,409);assert.equal(f.finance.walletBalance(1),0);
});
test('real dashboard never exposes another users calendar, notifications or sample financial figures',async t=>{
 const f=await scheduledFixture(t,{club:true,panel:true});const a=(await f.request('/panel/overview')).data;assert.equal(a.wallet,0);assert.deepEqual(a.upcoming,[]);assert.equal(a.stats.verifiedSessions,0);assert.equal(a.filesStatus,'private_materials_route');assert.equal(a.filesPreviewIncluded,false);assert.equal(a.filesUrl,'/panel/files');assert.equal((await f.request('/panel/overview',undefined,4)).data.upcoming.length,1);
 f.club.notify(1,'private-dashboard','اعلان خصوصی شاگرد');assert.equal((await f.request('/panel/overview')).data.notifications.length,1);assert.equal((await f.request('/panel/overview',undefined,2)).data.notifications.length,0);
});
test('full cancellation reverses only the actual club subsidy and restores the owned voucher without inventing coins',async t=>{
 const f=await scheduledFixture(t,{club:true,refunds:true});f.club.ingest(1,'profile.completed','profile:refund-test');const cfg=f.club.configuration();cfg.budgetToman=10000;Object.assign(cfg.rewards.find(r=>r.id==='s-discount-5'),{cost:5,percent:50,valueToman:1000,stock:5,enabled:true});f.club.save(cfg.version,cfg,3);const claim=(await f.request('/club/rewards/s-discount-5/claim',{idempotencyKey:'refund_discount_claim1'})).data.claim,v=f.finance.voucherForClaim(1,claim.id);
 const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],coupon:v.code,idempotencyKey:'refund_voucher_book1'});await f.verify(b.data.payment.id);const r=await f.request(`/bookings/${b.data.bookingId}/refunds`,{amountToman:9000,key:'refund_voucher_key01',reason:'لغو قبل از شروع خدمت با تخفیف اختصاصی'});assert.equal(r.status,200);assert.equal((await f.request(`/admin/refunds/${r.data.refund.id}/review`,{decision:'credited',note:'تأیید بازپرداخت واقعی و برگشت یارانه تخفیف'},3)).status,200);
 assert.equal(f.finance.walletBalance(1),90000);assert.equal(f.finance.voucherForClaim(1,claim.id).status,'available');assert.equal(f.club.account(1).coins,5);assert.equal(f.db.prepare("SELECT SUM(amount_rial) n FROM ledger_entries WHERE account='platform:club-expense'").get().n,0);assert.equal(f.db.prepare("SELECT SUM(amount_rial) n FROM ledger_entries WHERE account='platform:escrow'").get().n,0);
});
test('invitation revocation blocks later acceptance and group removal immediately revokes message access',async t=>{
 const f=await fixture(t),room=(await f.request('/admin/chat/rooms',{title:'آزمون لغو عضویت',userIds:[1]},3)).data.id;
 await f.request(`/admin/chat/rooms/${room}/invitations`,{userId:2},3);assert.equal((await f.request(`/admin/chat/rooms/${room}/invitations/2/revoke`,{},1)).status,403);assert.equal((await f.request(`/admin/chat/rooms/${room}/invitations/2/revoke`,{},3)).status,200);assert.equal((await f.request(`/chats/${room}/invitation`,{accept:true},2)).status,409);
 assert.equal((await f.request(`/admin/chat/rooms/${room}/members/3/remove`,{},3)).status,409);assert.equal((await f.request(`/admin/chat/rooms/${room}/members/1/remove`,{},3)).status,200);assert.equal((await f.request(`/chats/${room}`)).status,404);assert.equal((await f.request(`/chats/${room}/messages`,{text:'نباید قابل ارسال باشد',clientId:'revoked_access_test1'})).status,404);
});
test('member can leave a non-owned conversation but cannot remove another user',async t=>{
 const f=await fixture(t),room=(await f.request('/admin/chat/rooms',{title:'آزمون خروج عضو',userIds:[1,2]},3)).data.id;assert.equal((await f.request(`/admin/chat/rooms/${room}/members/2/remove`,{})).status,403);assert.equal((await f.request(`/chats/${room}/leave`,{})).status,200);assert.equal((await f.request(`/chats/${room}`)).status,404);assert.equal((await f.request(`/chats/${room}`,undefined,2)).status,200);
});
test('support assignments are admin-only, versioned, audited and distinguish real recent operator activity',async t=>{
 const f=await fixture(t),id=(await f.request('/support/threads',{})).data.thread.id;
 assert.equal((await f.request(`/admin/support/workflow/member/${id}`)).status,403);assert.equal((await f.request(`/admin/support/workflow/member/${id}`,undefined,3)).data.workflow.version,0);
 const body={assigneeId:3,version:0,note:'ارجاع درخواست به کارشناس مسئول برای پیگیری'};assert.equal((await f.request(`/admin/support/workflow/member/${id}/assign`,body,3)).status,200);assert.equal((await f.request(`/admin/support/workflow/member/${id}/assign`,body,3)).status,409);await f.request('/admin/support/heartbeat',{},3);let data=(await f.request(`/admin/support/workflow/member/${id}`,undefined,3)).data;assert.equal(data.agents[0].recentlyActive,true);f.advance(71000);data=(await f.request(`/admin/support/workflow/member/${id}`,undefined,3)).data;assert.equal(data.agents[0].recentlyActive,false);assert.equal((await f.request(`/admin/support/workflow/guest/${id}`,undefined,3)).status,404);
});
test('support SLA measures unanswered human-queue messages, not simulated online presence',async t=>{
 const f=await fixture(t),id=(await f.request('/support/threads',{})).data.thread.id;await f.request(`/support/threads/${id}/messages`,{text:'برای رسیدگی مالی نیاز به کارشناس دارم',clientId:'workflow_sla_message1'});await f.request(`/support/threads/${id}/escalate`,{});let r=(await f.request(`/admin/support/workflow/member/${id}`,undefined,3)).data;assert.equal(r.workflow.overdue,false);f.advance(61*60000);r=(await f.request(`/admin/support/workflow/member/${id}`,undefined,3)).data;assert.equal(r.workflow.overdue,true);await f.request(`/admin/support/${id}/reply`,{text:'پاسخ انسانی با پیگیری درخواست شما ثبت شد.',clientId:'workflow_sla_reply01'},3);r=(await f.request(`/admin/support/workflow/member/${id}`,undefined,3)).data;assert.equal(r.workflow.waitingSince,null);
});
test('learner travel buffer is enforced across different teachers, not only overlapping lesson times',async t=>{
 const f=await scheduledFixture(t);f.db.prepare("UPDATE classes SET mode='حضوری'").run();const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'travel_student_book1'});await f.verify(b.data.payment.id);
 f.db.exec("INSERT INTO users(id,name,role) VALUES(5,'مدرس دوم','teacher'); INSERT INTO teacher_accounts(user_id,teacher_id,status,bio,subject,created_at) VALUES(5,2,'approved','مدرس تأییدشده','ریاضی',0)");f.db.prepare("INSERT INTO classes(id,title,capacity,taken,price,teacher_id,mode) VALUES(2,'کلاس دوم',5,0,10000,2,'آنلاین')").run();const o=await f.request('/admin/teaching/occurrences',{classId:2,startsAt:f.end+10*60000,endsAt:f.end+70*60000},3);assert.equal(o.status,200);assert.equal((await f.request('/bookings',{classId:2,occurrenceIds:[o.data.id],idempotencyKey:'travel_student_book2'})).status,409);assert.equal((await f.request('/bookings',{classId:2,occurrenceIds:[o.data.id],idempotencyKey:'travel_student_book3'},2)).status,200);
});

async function familyFixture(t,options={}){const f=await scheduledFixture(t,{club:true,refunds:true,education:true,...options});f.db.prepare("INSERT INTO users(id,name,role) VALUES(5,'والد','parent'),(6,'والد دیگر','parent')").run();return f;}
const makeInvite=f=>f.request('/family/invitations',{scopes:['schedule','reports','files'],consent:true});
test('family access is opt-in, hashed, single-use, scoped and immediately revocable by either party',async t=>{
 const f=await familyFixture(t);assert.equal((await f.request('/family/accept',{token:'x'.repeat(32)},5)).status,409);assert.equal((await f.request('/family/invitations',{scopes:['finance'],consent:true})).status,400);assert.equal((await f.request('/family/invitations',{scopes:['schedule'],consent:false})).status,400);
 const i=await makeInvite(f);assert.equal(i.status,201);assert.ok(!JSON.stringify(f.db.prepare('SELECT * FROM parent_invitations').get()).includes(i.data.token));assert.equal((await f.request('/family/accept',{token:i.data.token},2)).status,403);
 const accepted=await f.request('/family/accept',{token:i.data.token},5);assert.equal(accepted.status,201);assert.equal((await f.request('/family/accept',{token:i.data.token},6)).status,409);assert.equal((await f.request('/parent/students/1',undefined,6)).status,404);assert.equal((await f.request('/parent/students/nope',undefined,5)).status,404);
 const d=await f.request('/parent/students/1',undefined,5);assert.equal(d.status,200);assert.deepEqual(Object.keys(d.data).sort(),['occurrences','reports','scopes','student']);assert.deepEqual(Object.keys(d.data.student).sort(),['id','name']);
 assert.equal((await f.request(`/family/links/${accepted.data.id}/revoke`,{version:1},2)).status,404);assert.equal((await f.request(`/family/links/${accepted.data.id}/revoke`,{version:2})).status,409);assert.equal((await f.request(`/family/links/${accepted.data.id}/revoke`,{version:1})).status,200);assert.equal((await f.request('/parent/students/1',undefined,5)).status,404);
});
test('family invitation replacement, explicit revocation and expiry never grant access',async t=>{
 const f=await familyFixture(t);const a=await makeInvite(f),b=await makeInvite(f);assert.equal((await f.request('/family/accept',{token:a.data.token},5)).status,409);assert.equal((await f.request(`/family/invitations/${b.data.id}/revoke`,{})).status,200);assert.equal((await f.request('/family/accept',{token:b.data.token},5)).status,409);const c=await makeInvite(f);f.advance(31*60000);assert.equal((await f.request('/family/accept',{token:c.data.token},5)).status,409);assert.equal((await f.request('/family/invitations',{scopes:['schedule','schedule'],consent:true})).status,400);
});
test('reports-only family permission never discloses schedule, chat, payment or another child reports',async t=>{
 const f=await familyFixture(t);const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'family_booking_0001'});await f.verify(b.data.payment.id);
 const add=f.db.prepare('INSERT INTO loyalty_academic(occurrence_id,student_id,teacher_id,scores,average,created_at) VALUES(?,?,?,?,?,?)');add.run(f.oid,1,4,JSON.stringify(Array(8).fill(80)),80,f.end);add.run(f.oid,2,4,JSON.stringify(Array(8).fill(25)),25,f.end);
 const i=await f.request('/family/invitations',{scopes:['reports'],consent:true});await f.request('/family/accept',{token:i.data.token},5);const d=(await f.request('/parent/students/1',undefined,5)).data;assert.deepEqual(d.occurrences,[]);assert.equal(d.reports.length,1);assert.deepEqual(d.reports[0].scores,Array(8).fill(80));assert.equal((await f.request('/materials/sessions',undefined,5)).data.sessions.length,0);assert.equal((await f.request('/family',undefined,4)).status,403);
});
const pdf=Buffer.from('%PDF-1.7\nprivate lesson material\n');
const fileHeaders={'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent('جزوه.pdf')};
test('materials scan before publication, check file content, deduplicate and reauthorize every download',async t=>{
 let scans=0;const f=await familyFixture(t,{scanner:async()=>{scans++;}});const url=`/materials/${f.oid}`;
 assert.equal((await f.request(url,pdf,1,'POST',fileHeaders)).status,403);assert.equal((await f.request(url,Buffer.from('<svg/>'),4,'POST',fileHeaders)).status,415);assert.equal(scans,0);
 const upload=await f.request(url,pdf,4,'POST',fileHeaders);assert.equal(upload.status,201);assert.equal(scans,1);const retry=await f.request(url,pdf,4,'POST',fileHeaders);assert.equal(retry.data.id,upload.data.id);const path=`/materials/${upload.data.id}/download`;
 assert.equal((await f.request(path)).status,404);assert.equal((await f.request('/materials?occurrenceId='+f.oid)).status,404);const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'file_booking_00001'});await f.verify(b.data.payment.id);assert.deepEqual((await f.request(path)).data,pdf);assert.equal((await f.request(path,undefined,2)).status,404);
 assert.equal((await f.request('/materials/sessions')).data.sessions.length,1);assert.equal((await f.request('/materials?occurrenceId='+f.oid)).data.materials.length,1);
 const i=await makeInvite(f),l=await f.request('/family/accept',{token:i.data.token},5);assert.deepEqual((await f.request(path,undefined,5)).data,pdf);await f.request(`/family/links/${l.data.id}/revoke`,{version:1},5);assert.equal((await f.request(path,undefined,5)).status,404);
 assert.equal((await f.request(`/materials/${upload.data.id}/revoke`,{},2)).status,404);await f.request(`/materials/${upload.data.id}/revoke`,{},4);assert.equal((await f.request(path)).status,404);
});
test('an unavailable or rejecting scanner publishes nothing; signature and names are checked before scanning',async t=>{
 const f=await familyFixture(t,{scanner:async()=>{throw Object.assign(new Error('scan unavailable'),{status:503});}});assert.equal((await f.request(`/materials/${f.oid}`,pdf,4,'POST',fileHeaders)).status,503);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM learning_materials').get().n,0);assert.equal((await f.request(`/materials/${f.oid}`,pdf,4,'POST',{...fileHeaders,'X-File-Name':'..%2Fsecret.pdf'})).status,400);assert.equal((await f.request('/materials?occurrenceId=bad')).status,404);
});
test('analytics exclude sandbox/top-ups/unfunded data and use only mature cohorts as denominators',async t=>{
 const f=await familyFixture(t);assert.equal((await f.request('/admin/analytics')).status,403);assert.equal((await f.request('/admin/analytics?from=-1',undefined,3)).status,400);
 const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'analytics_booking1'});await f.verify(b.data.payment.id);f.advance(1);let d=(await f.request('/admin/analytics',undefined,3)).data;assert.equal(d.purchases.bookings,1);assert.equal(d.purchases.amountToman,10000);assert.equal(d.cohorts[0].matureBuyers,0);assert.equal(d.cohorts[0].rebooking30dPercent,null);
 // A standalone second paid purchase, not a second session inside the same booking.
 f.db.prepare("INSERT INTO bookings(id,user_id,class_id,sessions,people,total,status,schema_version) VALUES(99,1,1,1,1,20000,'confirmed',2)").run();f.finance.journal('booking:99','booking',[{account:'user:1',amount:-200000},{account:'platform:escrow',amount:200000}]);f.advance(31*86400000);d=(await f.request('/admin/analytics',undefined,3)).data;assert.equal(d.purchases.bookings,2);assert.equal(d.cohorts[0].matureBuyers,1);assert.equal(d.cohorts[0].rebooked30d,1);assert.equal(d.cohorts[0].rebooking30dPercent,100);assert.equal(d.purchases.amountToman,30000);assert.equal(d.refunds.amountToman,0);
});
async function surveyedFixture(t){const f=await familyFixture(t);f.db.exec("ALTER TABLE classes ADD COLUMN kind TEXT DEFAULT 'private'");const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'review_booking_0001'});await f.verify(b.data.payment.id);f.advance(4*3600000);assert.equal((await f.request(`/admin/club/sessions/${f.oid}/verify`,{presentUserIds:[1],attendedMinutes:60,note:'حضور کامل جلسه برای ثبت بازخورد بررسی و تأیید شد.'},3)).status,200);assert.equal((await f.request('/club/surveys',{occurrenceId:f.oid,toUserId:4,stars:5,positive:['patient','punctual']})).status,200);return {...f,surveyId:f.db.prepare('SELECT id FROM loyalty_surveys').get().id};}
test('positive reviews require author consent AND current admin review; withdrawal is immediate and never rewards publicity',async t=>{
 const f=await surveyedFixture(t),path=`/club/publications/${f.surveyId}/consent`;const before=f.club.account(1).coins;
 assert.equal((await f.request('/teachers/1/reviews')).data.summary.count,0);assert.equal((await f.request(path,{consent:true,version:0,alias:'شاگرد مستقل'},2)).status,404);assert.equal((await f.request(path,{consent:true,version:0,alias:'شاگرد مستقل'})).status,200);assert.equal((await f.request('/teachers/1/reviews')).data.reviews.length,0);
 assert.equal((await f.request(`/admin/reviews/${f.surveyId}/review`,{version:1,decision:'published',note:'نظر و اجازهٔ انتشار بررسی و تأیید شدند.'})).status,403);
 const review={version:1,decision:'published',note:'نظر و اجازهٔ انتشار بررسی و تأیید شدند.'};assert.equal((await f.request(`/admin/reviews/${f.surveyId}/review`,review,3)).status,200);assert.equal((await f.request(`/admin/reviews/${f.surveyId}/review`,review,3)).status,409);
 const d=(await f.request('/teachers/1/reviews')).data;assert.equal(d.summary.count,1);assert.equal(d.summary.average,5);assert.equal(d.summary.verifiedStudents,1);assert.equal(d.summary.verifiedSessions,1);assert.equal(d.reviews[0].alias,'شاگرد مستقل');assert.deepEqual(Object.keys(d.reviews[0]).sort(),['alias','ends_at','id','positive','stars']);assert.equal((await f.request('/teachers/1/reviews?offset=-1')).status,400);
 assert.equal((await f.request(path,{consent:false,version:1})).status,409);assert.equal((await f.request(path,{consent:false,version:2})).status,200);assert.equal((await f.request('/teachers/1/reviews')).data.reviews.length,0);assert.equal(f.club.account(1).coins,before);
 assert.equal((await f.request(path,{consent:true,version:3})).status,200);assert.equal((await f.request('/teachers/1/reviews')).data.reviews.length,0);
});
test('negative surveys cannot be published and no author can publish someone else feedback',async t=>{
 const f=await familyFixture(t);f.db.prepare("INSERT INTO loyalty_surveys(id,occurrence_id,from_uid,to_uid,stars,positive,negative,created_at) VALUES(1,?,1,4,3,'[\"patient\"]','[\"mastery\"]',0)").run(f.oid);
 assert.equal((await f.request('/club/publications/1/consent',{consent:true,version:0})).status,422);assert.equal((await f.request('/club/publications')).data.surveys[0].eligible,false);assert.equal((await f.request('/teachers/1/reviews')).data.summary.average,null);assert.equal((await f.request('/teachers/nope/reviews')).status,404);
});
test('file budgets are enforced atomically and deduplication does not consume more space',async t=>{
 const f=await familyFixture(t);f.settings.update('materials',{version:0,config:{budgetMb:1,perOwnerMb:1}},3);const data=Buffer.concat([Buffer.from('%PDF-'),Buffer.alloc(512*1024-5,32)]),url=`/materials/${f.oid}`;
 const a=await f.request(url,data,4,'POST',fileHeaders);assert.equal(a.status,201);assert.equal((await f.request(url,data,4,'POST',fileHeaders)).data.id,a.data.id);data[100]=65;assert.equal((await f.request(url,data,4,'POST',fileHeaders)).status,201);data[100]=66;assert.equal((await f.request(url,data,4,'POST',fileHeaders)).status,409);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM learning_materials').get().n,2);
});
test('M1 retention uses a complete following month, and sandbox/legacy purchases cannot inflate analytics',async t=>{
 const f=await familyFixture(t);const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'analytics_m1_booking1'});await f.verify(b.data.payment.id);const first=f.db.prepare('SELECT created_at FROM ledger_journals WHERE reference=?').get('payment:'+b.data.payment.id).created_at,next=new Date(first);next.setUTCMonth(next.getUTCMonth()+1,1);next.setUTCHours(12,0,0,0);f.advance(next.getTime()-first);
 f.db.prepare("INSERT INTO bookings(id,user_id,class_id,sessions,people,total,status,schema_version) VALUES(99,1,1,1,1,20000,'confirmed',2),(100,2,1,1,1,99999,'sandbox_complete',2),(101,2,1,1,1,99999,'confirmed',1)").run();for(const id of [99,100,101])f.finance.journal(`booking:${id}`,'booking',[{account:'user:1',amount:-200000},{account:'platform:escrow',amount:200000}]);f.advance(1);
 let d=(await f.request('/admin/analytics',undefined,3)).data;assert.equal(d.purchases.bookings,2);assert.equal(d.cohorts.length,1);assert.equal(d.cohorts[0].retentionM1Percent,null);
 const end=new Date(next);end.setUTCMonth(end.getUTCMonth()+1,2);f.advance(end-next);d=(await f.request('/admin/analytics',undefined,3)).data;assert.equal(d.cohorts[0].matureM1Buyers,1);assert.equal(d.cohorts[0].retainedM1,1);assert.equal(d.cohorts[0].retentionM1Percent,100);
});
test('public teacher schedule is real, approved-only, Jalali-ready and ignores expired holds',async t=>{
 const f=await familyFixture(t);let a=(await f.request('/teachers/1/availability')).data;assert.equal(a.timezone,'Asia/Tehran');assert.equal(a.occurrences.length,1);assert.equal(a.occurrences[0].seatsLeft,2);assert.equal(a.occurrences[0].id,f.oid);assert.equal((await f.request('/teachers/2/availability')).data.occurrences.length,0);assert.equal((await f.request('/teachers/1/availability?week=-1')).status,400);assert.equal((await f.request('/teachers/1/availability?offset=abc')).status,400);
 const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'availability_hold1'});assert.equal(b.status,200);assert.equal((await f.request('/teachers/1/availability')).data.occurrences[0].seatsLeft,1);f.advance(16*60000);assert.equal((await f.request('/teachers/1/availability')).data.occurrences[0].seatsLeft,2);
 f.db.prepare("UPDATE teacher_accounts SET status='pending' WHERE user_id=4").run();assert.equal((await f.request('/teachers/1/availability')).data.occurrences.length,0);f.db.prepare("UPDATE teacher_accounts SET status='approved' WHERE user_id=4").run();assert.equal((await f.request(`/admin/teaching/occurrences/${f.oid}/cancel`,{},3)).status,200);assert.equal((await f.request('/teachers/1/availability')).data.occurrences.length,0);
});
test('family links paginate without leaking identities and invitation creation respects a durable per-account limit',async t=>{
 const f=await familyFixture(t);for(let i=0;i<60;i++)f.db.prepare("INSERT INTO parent_links(id,parent_id,student_id,scopes,status,created_at) VALUES(?,5,1,'[\"reports\"]','revoked',?)").run('history-'+i,i);
 const a=(await f.request('/family')).data,b=(await f.request('/family?offset=50')).data;assert.equal(a.links.length,50);assert.equal(a.hasMore,true);assert.equal(b.links.length,10);assert.equal(b.hasMore,false);assert.equal(new Set([...a.links,...b.links].map(x=>x.id)).size,60);assert.equal((await f.request('/family?offset=-1')).status,400);for(let i=0;i<10;i++)assert.equal((await makeInvite(f)).status,201);assert.equal((await makeInvite(f)).status,429);f.advance(3600001);assert.equal((await makeInvite(f)).status,201);
});
test('a full refund withdraws learner and delegated parent file access, not only calendar membership',async t=>{
 const f=await familyFixture(t);const material=await f.request(`/materials/${f.oid}`,pdf,4,'POST',fileHeaders),b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],idempotencyKey:'refund_file_book1'});await f.verify(b.data.payment.id);const invite=await makeInvite(f);await f.request('/family/accept',{token:invite.data.token},5);const url=`/materials/${material.data.id}/download`;assert.equal((await f.request(url,undefined,5)).status,200);const r=await f.request(`/bookings/${b.data.bookingId}/refunds`,{amountToman:10000,reason:'انصراف کامل پیش از شروع جلسه',key:'refund_file_key_0001'});assert.equal(r.status,200);assert.equal((await f.request(`/admin/refunds/${r.data.refund.id}/review`,{decision:'credited',note:'سند پرداخت و انصراف قبل از کلاس بررسی و تأیید شد.'},3)).status,200);assert.equal((await f.request(url)).status,404);assert.equal((await f.request(url,undefined,5)).status,404);assert.deepEqual((await f.request('/materials/sessions',undefined,5)).data.sessions,[]);
});

async function commerceFixture(t){const f=await scheduledFixture(t,{club:true,refunds:true,commerce:true});f.settings.update('shop',{version:0,config:{enabled:true,shippingToman:1000}},3);f.settings.update('friendly',{version:0,config:{enabled:true}},3);for(const uid of [1,2])f.finance.journal(`test-fund:${uid}`,'test_funding',[{account:'test:bank',amount:-1000000},{account:`user:${uid}`,amount:1000000}]);return f;}
async function makeProduct(f,stock=2){const p=await f.request('/admin/shop/products',{title:'کتاب آموزشی واقعی',description:'توضیح کامل کالای فیزیکی برای آزمون سفارش.',priceToman:10000,stock,active:true,version:0},3);assert.equal(p.status,200,JSON.stringify(p.data));return {productId:p.data.id,qty:1,version:1};}
const shippingAddress={recipient:'گیرنده آزمون',phone:'09123456789',postalCode:'1234567890',address:'تهران خیابان آزمایشی کوچه شماره یک پلاک دوازده'};
test('commerce shop reserves stock and money atomically; replay and another customer cannot cancel it',async t=>{const f=await commerceFixture(t),line=await makeProduct(f,1),body={key:'shop_order_test_0001',lines:[line],address:shippingAddress,expectedTotalToman:11000};const o=await f.request('/shop/orders',body);assert.equal(o.status,201,JSON.stringify(o.data));assert.equal(f.finance.walletBalance(1),890000);assert.equal((await f.request('/shop/orders',body)).data.order.id,o.data.order.id);assert.equal((await f.request('/shop/orders',{...body,expectedTotalToman:12000})).status,409);assert.equal((await f.request('/shop/orders',{...body,key:'shop_order_test_0002'},2)).status,409);assert.equal((await f.request(`/shop/orders/${o.data.order.id}/cancel`,{},2)).status,404);assert.equal(JSON.stringify(o.data).includes('تهران'),false);await f.request(`/shop/orders/${o.data.order.id}/cancel`,{});await f.request(`/shop/orders/${o.data.order.id}/cancel`,{});assert.equal(f.finance.walletBalance(1),1000000);assert.equal(f.db.prepare('SELECT stock FROM shop_products').get().stock,1);});
test('delivered shop returns refund the merchandise exactly once from sales and restore optional inventory',async t=>{const f=await commerceFixture(t),line=await makeProduct(f);const o=await f.request('/shop/orders',{key:'shop_delivered_00001',lines:[line],address:shippingAddress,expectedTotalToman:11000}),id=o.data.order.id;const review=b=>f.request(`/admin/shop/orders/${id}/review`,{note:'سند فیزیکی و وضعیت سفارش بررسی و تأیید شد.',...b},3);assert.equal((await review({version:1,decision:'shipped',tracking:'tracking-real-123'})).status,200);assert.equal((await review({version:2,decision:'delivered',deliveryVerified:true})).status,200);assert.equal((await f.request(`/shop/orders/${id}/return`,{reason:'درخواست بررسی و مرجوعی کالای تحویل‌شده'})).status,200);assert.equal((await review({version:4,decision:'returned',received:false})).status,400);assert.equal((await review({version:4,decision:'returned',received:true,restock:true})).status,200);assert.equal((await review({version:4,decision:'returned',received:true,restock:true})).status,409);assert.equal(f.finance.walletBalance(1),990000);assert.equal(f.db.prepare('SELECT stock FROM shop_products').get().stock,2);assert.equal(f.earnings.balance('shop:sales'),0);assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);});
async function makeFriendly(f){const r=await f.request('/friendly',{classId:1,size:2,occurrenceIds:[f.oid],key:'friendly_create_0001'});assert.equal(r.status,201,JSON.stringify(r.data));return r.data.group;}
async function joinFriendly(f,g){const i=await f.request(`/friendly/${g.id}/invitations`,{});assert.equal(i.status,201,JSON.stringify(i.data));assert.equal((await f.request('/friendly/invitations/accept',{token:i.data.token},2)).status,200);return i;}
const payFriendly=(f,g,uid=1)=>f.request(`/friendly/${g.id}/pay`,{key:'friendly_payment_0001',expectedShareToman:g.share_toman},uid);
test('friendly members pay independently; complete funding creates separate funded bookings and snapshots',async t=>{const f=await commerceFixture(t),g=await makeFriendly(f);assert.equal(g.share_toman,8000);assert.equal((await f.request('/bookings/mine')).data.bookings.length,0);const i=await joinFriendly(f,g);assert.equal((await f.request('/friendly/invitations/accept',{token:i.data.token},2)).status,409);assert.equal((await payFriendly(f,g)).status,200);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM bookings WHERE status='confirmed'").get().n,0);const done=await payFriendly(f,g,2);assert.equal(done.status,200,JSON.stringify(done.data));assert.equal(done.data.group.status,'active');assert.equal((await payFriendly(f,g,2)).status,200);for(const uid of [1,2]){assert.equal(f.finance.walletBalance(uid),920000);assert.equal((await f.request('/bookings/mine',undefined,uid)).data.bookings.length,1);}assert.equal(f.db.prepare('SELECT COUNT(*) n FROM earning_snapshots').get().n,2);assert.equal(f.earnings.balance(`friendly:${g.id}`),0);assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);});
test('friendly expiry releases each own wallet once and never finalizes an expired group',async t=>{const f=await commerceFixture(t),g=await makeFriendly(f);await payFriendly(f,g);f.advance(16*60000);f.finance.expire();f.friendly.expire();f.friendly.expire();assert.equal(f.finance.walletBalance(1),1000000);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM booking_seats').get().n,0);assert.equal((await payFriendly(f,g)).status,409);});
test('friendly paid member can leave and rejoin without reusing an old debit even within the same millisecond',async t=>{const f=await commerceFixture(t),g=await makeFriendly(f);await joinFriendly(f,g);await payFriendly(f,g,2);await f.request(`/friendly/${g.id}/leave`,{},2);assert.equal(f.finance.walletBalance(2),1000000);await joinFriendly(f,g);assert.equal((await payFriendly(f,g,2)).status,200);assert.equal(f.finance.walletBalance(2),920000);await f.request(`/friendly/${g.id}/leave`,{});assert.equal(f.finance.walletBalance(2),1000000);assert.equal((await f.request('/friendly',undefined,2)).data.groups[0].members.length,1);});
test('teacher settlement requires accepted contract, real funding, ended attendance; reruns cannot pay twice',async t=>{const f=await commerceFixture(t);assert.equal((await f.request('/admin/earnings/terms',{teacherId:1,bps:8000,version:0,note:'قرارداد صرفاً آزمایشی سهم هشتاد درصدی مدرس برای تست.'},3)).status,200);assert.equal((await f.request('/earnings/terms/accept',{version:1,consent:true},4)).status,200);const b=await f.request('/bookings',{classId:1,occurrenceIds:[f.oid],method:'wallet',idempotencyKey:'teacher_income_book1'});assert.equal(b.status,200,JSON.stringify(b.data));assert.equal(f.earnings.settle().settled,0);f.advance(4*3600000);assert.equal((await f.request(`/admin/club/sessions/${f.oid}/verify`,{presentUserIds:[1],attendedMinutes:60,note:'حضور کامل جلسه برای دفتر درآمد بررسی و تأیید شد.'},3)).status,200);assert.equal(f.earnings.settle().settled,1);assert.equal(f.earnings.balance('teacher:4'),80000);assert.equal(f.earnings.settle().settled,0);assert.equal(f.earnings.balance('platform:escrow'),0);assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);});
test('withdrawal reserves only earned income, encrypts IBAN and releases a rejected request once',async t=>{const f=await commerceFixture(t),iban='IR062960000000100324200001';f.finance.journal('test_teacher_income','test',[{account:'test:bank',amount:-200000},{account:'teacher:4',amount:200000}]);const b={source:'teacher',amountToman:10000,iban,key:'teacher_withdraw_001'};const w=await f.request('/withdrawals',b,4);assert.equal(w.status,201,JSON.stringify(w.data));assert.equal((await f.request('/withdrawals',b,4)).data.id,w.data.id);assert.equal(f.earnings.balance('teacher:4'),100000);assert.equal(f.db.prepare('SELECT iban_enc FROM withdrawal_requests').get().iban_enc.includes(iban),false);assert.equal((await f.request(`/admin/withdrawals/${w.data.id}/bank-details`,{},1)).status,403);const reject={decision:'rejected',version:1,note:'شماره حساب و مستند درخواست بررسی و درخواست رد شد.'};assert.equal((await f.request(`/admin/withdrawals/${w.data.id}/review`,reject,3)).status,200);assert.equal((await f.request(`/admin/withdrawals/${w.data.id}/review`,reject,3)).status,409);assert.equal(f.earnings.balance('teacher:4'),200000);});
test('club commission requires a bounded budget and can cover actual fees only once per teacher/session',async t=>{const f=await commerceFixture(t),cfg=f.club.configuration(),r=cfg.rewards.find(r=>r.id==='t-commission2');Object.assign(r,{enabled:true,stock:1,cost:0,valueToman:3000});cfg.budgetToman=3000;f.club.save(cfg.version,cfg,3);const c=f.club.claim(4,r.id,'commission_claim_001');assert.equal(c.status,'fulfilled');assert.equal(f.club.spent(),3000);assert.equal(f.club.commissionBenefit(4,f.oid,2000),2000);assert.equal(f.club.commissionBenefit(4,f.oid,2000),0);assert.equal(f.club.commissionBenefit(4,f.oid+1,2000),1000);assert.equal(f.club.commissionBenefit(4,f.oid+2,2000),0);assert.equal(f.db.prepare('SELECT remaining_toman FROM loyalty_commission_entitlements').get().remaining_toman,0);const bad=f.club.configuration();bad.rewards.find(x=>x.id==='t-commission2').valueToman=0;assert.throws(()=>f.club.save(bad.version,bad,3),{status:422});});
test('affiliate pays five percent of cash for exactly the first three verified sessions, independently of club referrals',async t=>{const f=await commerceFixture(t);assert.equal((await f.request('/affiliate/apply',{consent:true},2)).status,200);let a=(await f.request('/affiliate',undefined,2)).data.account;assert.equal((await f.request(`/admin/affiliates/2/review`,{status:'active',version:a.version,note:'حساب همکاری واقعی برای آزمون تأیید و فعال شد.'},3)).status,200);assert.equal((await f.request('/affiliate/attribute',{code:a.code})).status,200);await f.request('/admin/earnings/terms',{teacherId:1,bps:8000,version:0,note:'شرایط سهم هشتاد درصدی مدرس صرفاً برای آزمون همکاری مالی.'},3);await f.request('/earnings/terms/accept',{version:1,consent:true},4);const ids=[f.oid];for(let n=1;n<4;n++){const o=await f.request('/admin/schedule/batches',{classId:1,occurrences:[{startsAt:f.start+n*86400000,endsAt:f.end+n*86400000}],key:`affiliate_schedule_000${n}`},3);assert.equal(o.status,200);ids.push(o.data.ids[0]);}const b=await f.request('/bookings',{classId:1,sessions:4,occurrenceIds:ids,method:'wallet',idempotencyKey:'affiliate_first_three'});assert.equal(b.status,200,JSON.stringify(b.data));f.advance(5*86400000);for(const id of ids){assert.equal((await f.request(`/admin/club/sessions/${id}/verify`,{presentUserIds:[1],attendedMinutes:60,note:'حضور کامل مدرس و شاگرد جلسه برای همکاری مالی تأیید شد.'},3)).status,200);}assert.equal(f.earnings.settle().settled,4);assert.equal(f.earnings.balance('affiliate:2'),14250);assert.equal(f.earnings.settle().settled,0);const view=(await f.request('/earnings',undefined,2)).data;assert.equal(view.earnings.every(e=>e.teacher_rial===undefined),true);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM loyalty_referrals').get().n,0);assert.equal(f.db.prepare('SELECT SUM(amount_rial) n FROM ledger_entries').get().n,0);});
test('club customization delivers a brand-only private profile frame and expires without refunding spent coins',async t=>{const f=await commerceFixture(t),cfg=f.club.configuration(),r=cfg.rewards.find(x=>x.id==='t-profile');Object.assign(r,{enabled:true,stock:1,cost:0});f.club.save(cfg.version,cfg,3);f.club.claim(4,r.id,'profile_style_000001');assert.equal(f.club.snapshot(4).customization.style,'fresh');assert.equal(f.club.snapshot(1).customization,null);f.advance(4*86400000);assert.equal(f.club.snapshot(4).customization,null);const bad=f.club.configuration();bad.rewards.find(x=>x.id===r.id).style='url(evil)';assert.throws(()=>f.club.save(bad.version,bad,3),{status:422});});
