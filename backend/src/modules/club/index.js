const {clubEngine,period,fail}=require('./engine');
const tags={teacher:['punctual','mastery','kind','followup','patient','value','innovative'],student:['focus','polite','active','prepared','order']};
const indicators=['آمادگی','وقت‌شناسی','تعامل','تمرکز','تکلیف','درک مفاهیم','حل مسئله','استمرار'];
function clubModule(app,dependencies){
 const {db,auth,requireRole,settings,now=Date.now}=dependencies,e=clubEngine(dependencies);
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(err){next(err);}};
 const admin=[auth,requireRole('admin')];
 const table=name=>!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);
 const audit=(actor,action,id,data={})=>settings.audit(actor,action,String(id),data);
 const evidence=value=>{if(typeof value!=='string'||value.trim().length<20||value.length>2000)fail('شرح مدرک و تأیید حداقل ۲۰ نویسه لازم است.');return value.trim();};
 app.get('/api/club/catalog',(req,res)=>{const c=e.configuration(),role=req.query.role==='teacher'?'teacher':'student';res.json({levels:c.levels,rules:c.rules.filter(x=>x.enabled&&(x.role===role||x.role==='all')),medals:c.medals.filter(x=>x.role===role||x.role==='all'),rewards:c.rewards.filter(x=>x.role===role||x.role==='all'),missions:c.missions.filter(x=>x.role===role||x.role==='all')});});
 app.get('/api/club',auth,safe((req,res)=>res.json(e.snapshot(req.user.id))));
 app.post('/api/club/rewards/:id/claim',auth,safe((req,res)=>res.json({claim:e.claim(req.user.id,req.params.id,req.body?.idempotencyKey)})));
 app.post('/api/club/spin',auth,safe((req,res)=>res.json({claim:e.spin(req.user.id,req.body?.idempotencyKey)})));
 app.post('/api/club/notifications/read',auth,safe((req,res)=>{db.prepare('UPDATE loyalty_notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').run(now(),req.user.id);res.json({ok:true});}));
 app.put('/api/club/profile',auth,safe((req,res)=>{
  const p=req.body||{},str=(k,min,max)=>{if(typeof p[k]!=='string'||p[k].trim().length<min||p[k].length>max)fail('نام نمایشی، شهر، استان و هدف یادگیری معتبر لازم است.');return p[k].trim();};
  const clean={alias:str('alias',2,60),city:str('city',2,80),province:str('province',2,80),goal:str('goal',10,500),country:String(p.country||'IR').toUpperCase()};
  if(!/^[A-Z]{2}$/.test(clean.country)||typeof p.leagueOptIn!=='boolean')fail('کشور یا رضایت رتبه‌بندی معتبر نیست.');
  db.transaction(()=>{e.account(req.user.id);db.prepare('UPDATE loyalty_accounts SET profile=?,league_opt_in=? WHERE user_id=?').run(JSON.stringify(clean),p.leagueOptIn?1:0,req.user.id);if(req.user.role==='student')e.ingest(req.user.id,'profile.completed','profile:v1');audit(req.user.id,'club.profile',req.user.id,{leagueOptIn:p.leagueOptIn});})();res.json({ok:true});
 }));
 app.post('/api/club/referrals/accept',auth,safe((req,res)=>{
  const code=String(req.body?.code||'').toUpperCase();
  if(!/^[A-F0-9]{16}$/.test(code))fail('کد معرف معتبر نیست.');
  const row=db.prepare('SELECT user_id FROM loyalty_accounts WHERE referral_code=?').get(code);
  const created=db.prepare('SELECT created_at FROM users WHERE id=?').get(req.user.id)?.created_at;
  if(!row||row.user_id===req.user.id)fail('کد معرف معتبر نیست.');
  const createdAt=Date.parse(String(created||'').includes('T')?String(created):String(created||'').replace(' ','T')+'Z');
  if(!Number.isFinite(createdAt)||createdAt>now()||now()-createdAt>e.configuration().referralWindowHours*3600000)fail('مهلت ثبت معرف پایان یافته است.',409);
  db.transaction(()=>{const old=db.prepare('SELECT * FROM loyalty_referrals WHERE invitee_id=?').get(req.user.id);if(old){if(old.inviter_id!==row.user_id)fail('معرف قبلاً ثبت شده است.',409);return;}db.prepare('INSERT INTO loyalty_referrals VALUES(?,?,?)').run(req.user.id,row.user_id,now());e.ingest(row.user_id,'referral.registered',`invitee:${req.user.id}`);e.notify(row.user_id,`referral:${req.user.id}`,'دعوت موفق','ثبت‌نام معتبر دوستتان تأیید شد.');})();res.json({ok:true});
 }));
 app.get('/api/club/league',auth,safe((req,res)=>{
  const c=e.configuration();if(!c.leaderboardEnabled)return res.json({enabled:false,rows:[],rank:null});
  const kind=['weekly','monthly','yearly','all'].includes(req.query.period)?req.query.period:'monthly',pk=period(now(),kind);
  const location={};for(const k of ['country','province','city'])if(req.query[k]){if(typeof req.query[k]!=='string'||req.query[k].length>80)fail('فیلتر مکان نامعتبر است.');location[k]=req.query[k];}
  const users=db.prepare('SELECT a.*,u.role FROM loyalty_accounts a JOIN users u ON u.id=a.user_id WHERE a.league_opt_in=1 AND u.role!=\'admin\'').all();
  const scores=users.map(a=>{const p=JSON.parse(a.profile);const points=db.prepare('SELECT points,created_at FROM loyalty_ledger WHERE user_id=? AND points>0').all(a.user_id).filter(x=>period(x.created_at,kind)===pk).reduce((s,x)=>s+x.points,0);return {uid:a.user_id,alias:p.alias||'عضو نیمکت',points,profile:p};}).filter(a=>Object.entries(location).every(([k,v])=>a.profile[k]===v)).sort((a,b)=>b.points-a.points||a.uid-b.uid);
  const at=scores.findIndex(a=>a.uid===req.user.id),current=at<0?null:{rank:at+1,toNext:at>0?scores[at-1].points-scores[at].points+1:0};
  res.json({enabled:true,period:kind,total:scores.length,current,rows:scores.slice(0,50).map((x,i)=>({rank:i+1,alias:x.alias,points:x.points,isMe:x.uid===req.user.id}))});
 }));
 function sessionsFor(uid){
  if(!table('class_occurrences'))return [];
  const teacher=e.roleFor(uid)==='teacher';
  const checks=db.prepare('SELECT s.*,o.class_id,o.ends_at,c.title FROM loyalty_session_checks s JOIN class_occurrences o ON o.id=s.occurrence_id JOIN classes c ON c.id=o.class_id ORDER BY o.ends_at DESC LIMIT 500').all();
  return checks.filter(x=>teacher?x.teacher_uid===uid:JSON.parse(x.present_json).includes(uid)).map(x=>({...x,present:JSON.parse(x.present_json).map(id=>({id,name:db.prepare('SELECT name FROM users WHERE id=?').get(id)?.name||'شاگرد'})),note:undefined,actor_id:undefined,present_json:undefined}));
 }
 app.get('/api/club/sessions',auth,safe((req,res)=>res.json({sessions:sessionsFor(req.user.id),indicators,tags:e.roleFor(req.user.id)==='teacher'?tags.student:tags.teacher})));
 app.post('/api/club/surveys',auth,safe((req,res)=>{
  const {occurrenceId,toUserId,stars,positive=[],negative=[]}=req.body||{},s=sessionsFor(req.user.id).find(x=>x.occurrence_id===occurrenceId);
  if(!s||!Number.isInteger(stars)||stars<1||stars>5||!Number.isInteger(toUserId)||toUserId===req.user.id)fail('جلسه یا امتیاز نظرسنجی معتبر نیست.');
  const teacher=e.roleFor(req.user.id)==='teacher';if(teacher?!s.present.some(x=>x.id===toUserId):s.teacher_uid!==toUserId)fail('نظرسنجی این شخص مجاز نیست.',403);
  const allowed=teacher?tags.student:tags.teacher;
  if(!Array.isArray(positive)||!Array.isArray(negative)||positive.length>8||negative.length>8||new Set(positive).size!==positive.length||new Set(negative).size!==negative.length||positive.some(x=>!allowed.includes(x))||negative.some(x=>!allowed.includes(x)||positive.includes(x)))fail('شاخص‌های نظرسنجی نامعتبرند.');
  db.transaction(()=>{
   const old=db.prepare('SELECT * FROM loyalty_surveys WHERE occurrence_id=? AND from_uid=? AND to_uid=?').get(occurrenceId,req.user.id,toUserId);
   if(old){if(old.stars!==stars||old.positive!==JSON.stringify(positive)||old.negative!==JSON.stringify(negative))fail('نظرسنجی قبلاً ثبت شده و قابل بازنویسی نیست.',409);return;}
   const id=Number(db.prepare('INSERT INTO loyalty_surveys(occurrence_id,from_uid,to_uid,stars,positive,negative,created_at) VALUES(?,?,?,?,?,?,?)').run(occurrenceId,req.user.id,toUserId,stars,JSON.stringify(positive),JSON.stringify(negative),now()).lastInsertRowid);
   const source=`survey:${id}`;e.ingest(req.user.id,'survey.submitted',source);e.ingest(toUserId,'survey.received',source);
   for(const tag of positive)e.ingest(toUserId,`feedback.${tag}`,source);
   if(positive.length)e.ingest(toUserId,'feedback.positive',source);
   if(stars===5)e.ingest(toUserId,'feedback.five',source);
   const ratings=db.prepare('SELECT stars,created_at FROM loyalty_surveys WHERE to_uid=?').all(toUserId).filter(x=>period(x.created_at,'monthly')===period(now(),'monthly'));
   const cfg=e.configuration();if(ratings.length>=cfg.minRatings&&ratings.reduce((a,b)=>a+b.stars,0)/ratings.length>cfg.positiveRating)e.ingest(toUserId,'rating.positive',period(now(),'monthly'));
   e.sync(toUserId);audit(req.user.id,'club.survey',id);
  })();res.json({ok:true});
 }));
 app.post('/api/club/academic',auth,requireRole('teacher'),safe((req,res)=>{
  const {occurrenceId,studentId,scores}=req.body||{},s=sessionsFor(req.user.id).find(x=>x.occurrence_id===occurrenceId);
  if(!s||!s.present.some(x=>x.id===studentId)||!Array.isArray(scores)||scores.length!==8||scores.some(x=>!Number.isInteger(x)||x<0||x>100))fail('گزارش باید هشت شاخص ۰ تا ۱۰۰ برای شاگرد حاضر در جلسه داشته باشد.');
  db.transaction(()=>{const old=db.prepare('SELECT * FROM loyalty_academic WHERE occurrence_id=? AND student_id=?').get(occurrenceId,studentId);if(old){if(old.scores!==JSON.stringify(scores))fail('گزارش قبلاً ثبت شده است.',409);return;}
   const avg=scores.reduce((a,b)=>a+b,0)/8;db.prepare('INSERT INTO loyalty_academic(occurrence_id,student_id,teacher_id,scores,average,created_at) VALUES(?,?,?,?,?,?)').run(occurrenceId,studentId,req.user.id,JSON.stringify(scores),avg,s.ends_at);
   const rows=db.prepare('SELECT average,created_at FROM loyalty_academic WHERE student_id=? ORDER BY created_at').all(studentId),groups={};for(const row of rows)(groups[period(row.created_at,'monthly')]??=[]).push(row.average);
   const months=Object.keys(groups).sort(),last=months.at(-1),previous=months.at(-2),mean=key=>groups[key].reduce((a,b)=>a+b,0)/groups[key].length;
   if(previous&&last===period(now(),'monthly')&&mean(previous)>0&&(mean(last)-mean(previous))/mean(previous)*100>=e.configuration().progressPercent){e.ingest(studentId,'academic.progress',last);e.notify(studentId,`progress:${last}`,'پیشرفت تحصیلی جدید','پیشرفت بر اساس گزارش‌های ثبت‌شدهٔ مدرس محاسبه شد.');}
   audit(req.user.id,'club.academic',`${occurrenceId}:${studentId}`);
  })();res.json({ok:true});
 }));
 app.get('/api/club/academic',auth,safe((req,res)=>res.json({indicators,reports:db.prepare('SELECT scores,average,created_at,occurrence_id FROM loyalty_academic WHERE student_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id).map(x=>({...x,scores:JSON.parse(x.scores)}))})));
 // Likes are member-scoped, non-self and unique. Rewards require a separate moderator review.
 app.post('/api/chats/:room/messages/:id/like',auth,safe((req,res)=>{
  if(!table('chat_posts')||!db.prepare('SELECT 1 FROM chat_members WHERE room_id=? AND user_id=?').get(req.params.room,req.user.id))fail('گفتگو در دسترس نیست.',404);
  const p=db.prepare('SELECT * FROM chat_posts WHERE id=? AND room_id=? AND deleted_at IS NULL').get(req.params.id,req.params.room);
  const room=table('chat_rooms')&&db.prepare('SELECT closes_at FROM chat_rooms WHERE id=?').get(req.params.room);
  if(room?.closes_at&&room.closes_at<=now())fail('مهلت فعالیت این گفتگو تمام شده است.',403);
  if(!p||p.sender_id===req.user.id)fail('لایک این پیام مجاز نیست.');
  if(req.body?.liked===false)db.prepare('DELETE FROM chat_reactions WHERE message_id=? AND user_id=?').run(p.id,req.user.id);else db.prepare('INSERT OR IGNORE INTO chat_reactions VALUES(?,?,?)').run(p.id,req.user.id,now());
  if(dependencies.events)dependencies.events.emit(db.prepare('SELECT user_id FROM chat_members WHERE room_id=?').all(req.params.room).map(x=>x.user_id),'chat.message',{roomId:req.params.room});
  res.json({likes:db.prepare('SELECT COUNT(*) n FROM chat_reactions WHERE message_id=?').get(p.id).n});
 }));
 app.get('/api/admin/club',...admin,safe((req,res)=>{
  const accounts=db.prepare("SELECT a.*,u.name,u.role FROM loyalty_accounts a JOIN users u ON u.id=a.user_id WHERE u.role!='admin'").all(),ledger=db.prepare('SELECT * FROM loyalty_ledger').all(),cfg=e.configuration(),claims=db.prepare('SELECT c.*,u.name FROM loyalty_claims c JOIN users u ON u.id=c.user_id ORDER BY created_at DESC LIMIT 200').all();
  const active=new Set(db.prepare('SELECT user_id FROM loyalty_events WHERE verified_at>?').all(now()-30*86400000).map(x=>x.user_id));
  const participants=new Set(db.prepare('SELECT user_id FROM loyalty_mission_awards').all().map(x=>x.user_id));
  const total=db.prepare("SELECT COUNT(*) n FROM users WHERE role!='admin'").get().n;
  const stats={members:accounts.length,active:accounts.filter(a=>active.has(a.user_id)).length,totalUsers:total,activePercent:total?Math.round(accounts.filter(a=>active.has(a.user_id)).length/total*100):0,missionPercent:accounts.length?Math.round([...participants].filter(id=>accounts.some(a=>a.user_id===id)).length/accounts.length*100):0,coinsEarned:ledger.filter(x=>x.coins>0).reduce((s,x)=>s+x.coins,0),coinsSpent:-ledger.filter(x=>x.coins<0).reduce((s,x)=>s+x.coins,0),budgetSpent:e.spent(),budget:cfg.budgetToman,levels:cfg.levels.map((l,i)=>({name:l.name,members:accounts.filter(a=>a.points>=l.minPoints&&(!cfg.levels[i+1]||a.points<cfg.levels[i+1].minPoints)).length})),missions:cfg.missions.map(m=>({title:m.title,completed:db.prepare('SELECT COUNT(*) n FROM loyalty_mission_awards WHERE mission_id=?').get(m.id).n})),rewards:cfg.rewards.map(r=>({title:r.title,claimed:db.prepare('SELECT COUNT(*) n FROM loyalty_claims WHERE reward_id=?').get(r.id).n})),referrals:db.prepare('SELECT COUNT(*) n FROM loyalty_referrals').get().n,successfulReferrals:db.prepare("SELECT COUNT(*) n FROM loyalty_events WHERE kind='referral.first'").get().n};
  stats.discountActualCost=table('club_discount_reservations')?db.prepare("SELECT COALESCE(SUM(discount_toman),0) n FROM club_discount_reservations WHERE state='consumed'").get().n:0;
  stats.recordedExpense=table('ledger_entries')?-db.prepare("SELECT COALESCE(SUM(amount_rial),0) n FROM ledger_entries WHERE account='platform:club-expense'").get().n/10:0;
  res.json({config:cfg,stats,claims,members:accounts.slice(0,200).map(a=>({id:a.user_id,name:a.name,role:a.role,coins:a.coins,points:a.points})),surveys:db.prepare('SELECT * FROM loyalty_surveys ORDER BY id DESC LIMIT 100').all(),effectiveness:{status:'insufficient_observation',note:'اثربخشی و بازگشت cohortها نیازمند بازهٔ مشاهده و رویدادهای غیرکلاب است؛ عدد ساختگی نمایش داده نمی‌شود.'}});
 }));
 app.put('/api/admin/club/config',...admin,safe((req,res)=>res.json({config:e.save(req.body?.version,req.body?.config,req.user.id)})));
 app.get('/api/admin/club/sessions',...admin,safe((req,res)=>{
  if(!table('class_occurrences'))return res.json({sessions:[]});
  const rows=db.prepare("SELECT o.*,c.title,a.user_id teacher_uid FROM class_occurrences o JOIN classes c ON c.id=o.class_id JOIN teacher_accounts a ON a.teacher_id=o.teacher_id AND a.status='approved' WHERE o.ends_at<=? AND o.status='scheduled' ORDER BY o.ends_at DESC LIMIT 200").all(now());
  res.json({sessions:rows.map(o=>({...o,verified:!!db.prepare('SELECT 1 FROM loyalty_session_checks WHERE occurrence_id=?').get(o.id),students:db.prepare("SELECT DISTINCT u.id,u.name FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id JOIN users u ON u.id=b.user_id WHERE bo.occurrence_id=? AND b.status='confirmed' AND b.schema_version=2").all(o.id)}))});
 }));
 app.post('/api/admin/club/sessions/:id/verify',...admin,safe((req,res)=>{
  const {presentUserIds,attendedMinutes}=req.body||{},note=evidence(req.body?.note);
  if(!Number.isInteger(attendedMinutes)||!Array.isArray(presentUserIds)||!presentUserIds.length||presentUserIds.length>100||presentUserIds.some(x=>!Number.isSafeInteger(x))||new Set(presentUserIds).size!==presentUserIds.length)fail('حضور و مدت کامل جلسه لازم است.');
  db.transaction(()=>{
   const o=db.prepare("SELECT o.*,c.kind,a.user_id teacher_uid FROM class_occurrences o JOIN classes c ON c.id=o.class_id JOIN teacher_accounts a ON a.teacher_id=o.teacher_id AND a.status='approved' WHERE o.id=? AND o.status='scheduled'").get(req.params.id);
   if(!o||o.ends_at>now()||attendedMinutes*60000<o.ends_at-o.starts_at||attendedMinutes>360)fail('جلسه باید پایان یافته و حضور کامل مدرس و شاگرد تأیید شده باشد.');
   const present=[...presentUserIds].sort((a,b)=>a-b),old=db.prepare('SELECT * FROM loyalty_session_checks WHERE occurrence_id=?').get(o.id);
   if(old){if(old.present_json!==JSON.stringify(present))fail('حضور قبلاً تأیید شده؛ تغییر نیازمند ممیزی است.',409);return;}
   for(const uid of present)if(!db.prepare("SELECT b.id FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=? AND b.user_id=? AND b.status='confirmed' AND b.schema_version=2").get(o.id,uid))fail('فقط شاگرد با رزرو قطعی این جلسه قابل تأیید است.');
   db.prepare('INSERT INTO loyalty_session_checks VALUES(?,?,?,?,?,?)').run(o.id,o.teacher_uid,JSON.stringify(present),note,req.user.id,now());
   e.ingest(o.teacher_uid,'class.completed',`session:${o.id}`,{at:o.ends_at,actor:req.user.id});
   const committed=e.configuration().committedClasses,recent=db.prepare('SELECT id,status FROM class_occurrences WHERE teacher_id=? AND ends_at<=? ORDER BY ends_at DESC LIMIT ?').all(o.teacher_id,now(),committed);
   if(recent.length===committed&&recent.every(x=>x.status!=='cancelled'&&db.prepare('SELECT 1 FROM loyalty_session_checks WHERE occurrence_id=? AND teacher_uid=?').get(x.id,o.teacher_uid)))e.ingest(o.teacher_uid,'commitment.verified','ten-consecutive-sessions');
   for(const uid of present){e.ingest(uid,'class.completed',`session:${o.id}`,{at:o.ends_at,actor:req.user.id,group:['group','گروهی'].includes(o.kind)});if(['group','گروهی'].includes(o.kind))e.ingest(uid,'class.group',`session:${o.id}`,{at:o.ends_at,actor:req.user.id});
    const referral=db.prepare('SELECT inviter_id FROM loyalty_referrals WHERE invitee_id=?').get(uid);
    if(referral){const count=db.prepare("SELECT COUNT(*) n FROM loyalty_events WHERE user_id=? AND kind='class.completed'").get(uid).n;if(count>=1&&e.ingest(referral.inviter_id,'referral.first',`invitee:${uid}`))e.notify(referral.inviter_id,`referral-first:${uid}`,'اولین کلاس موفق دوست','حضور کامل دوست شما تأیید و قواعد فعال دعوت اعمال شد.');if(count>=3&&e.ingest(referral.inviter_id,'referral.three',`invitee:${uid}`))e.notify(referral.inviter_id,`referral-third:${uid}`,'سومین کلاس موفق دوست','سه کلاس دوست شما با حضور کامل تأیید شد.');}
   }
   audit(req.user.id,'club.session-verified',o.id,{present,attendedMinutes});
  })();res.json({ok:true});
 }));
 app.post('/api/admin/club/activities',...admin,safe((req,res)=>{
  const {userId,kind,source}=req.body||{},note=evidence(req.body?.note);
  if(!Number.isSafeInteger(userId)||!['profile.completed','profile.video','webinar.completed','challenge.completed','seasonal.completed','question.validated','content.published','teacher.referred'].includes(kind)||typeof source!=='string'||source.length<5||source.length>120)fail('فعالیت یا مرجع معتبر لازم است.');
  if(kind==='profile.completed'&&e.roleFor(userId)!=='teacher')fail('تأیید دستی پرونده برای استاد است.');
  db.transaction(()=>{e.ingest(userId,kind,`review:${source}`,{actor:req.user.id});audit(req.user.id,'club.activity-reviewed',source,{userId,kind,note});})();res.json({ok:true});
 }));
 app.post('/api/admin/club/chat/:id/approve',...admin,safe((req,res)=>{
  const note=evidence(req.body?.note),p=table('chat_posts')&&db.prepare('SELECT * FROM chat_posts WHERE id=? AND deleted_at IS NULL').get(req.params.id);
  if(!p)fail('پیام معتبر پیدا نشد.',404);
  const cfg=e.configuration(),min=e.roleFor(p.sender_id)==='teacher'?cfg.teacherLikes:cfg.studentLikes;
  if(db.prepare('SELECT COUNT(*) n FROM chat_reactions WHERE message_id=? AND user_id!=?').get(p.id,p.sender_id).n<min)fail(`حداقل ${min} لایک مستقل و تأیید محتوای مفید لازم است.`);
  db.transaction(()=>{db.prepare('INSERT OR IGNORE INTO loyalty_chat_reviews VALUES(?,?,?,?)').run(p.id,req.user.id,note,now());e.ingest(p.sender_id,'chat.helpful',`post:${p.id}`,{at:p.created_at,actor:req.user.id});audit(req.user.id,'club.chat-approved',p.id,{note});})();res.json({ok:true});
 }));
 app.post('/api/admin/club/claims/:id/fulfill',...admin,safe((req,res)=>{
  const note=evidence(req.body?.note);db.transaction(()=>{const c=db.prepare('SELECT * FROM loyalty_claims WHERE id=?').get(req.params.id);if(!c)fail('دریافت پیدا نشد.',404);if(c.status==='fulfilled')return;db.prepare("UPDATE loyalty_claims SET status='fulfilled',note=? WHERE id=?").run(note,c.id);audit(req.user.id,'club.fulfill',c.id,{note});e.notify(c.user_id,`fulfill:${c.id}`,'تحویل جایزه تأیید شد',c.title);})();res.json({ok:true});
 }));
 return e;
}
module.exports={clubModule};
