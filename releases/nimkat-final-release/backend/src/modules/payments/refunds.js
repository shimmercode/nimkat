const crypto=require('node:crypto');
const fail=(m,s=400)=>{throw Object.assign(new Error(m),{status:s});};
function refundsModule(app,{db,auth,settings,finance,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS booking_refunds(id TEXT PRIMARY KEY,booking_id INTEGER NOT NULL,user_id INTEGER NOT NULL,amount_toman INTEGER NOT NULL,status TEXT NOT NULL,request_key TEXT NOT NULL,reason TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',reviewed_by INTEGER,created_at INTEGER NOT NULL,reviewed_at INTEGER,UNIQUE(user_id,request_key));
 CREATE UNIQUE INDEX IF NOT EXISTS refund_one_pending ON booking_refunds(booking_id) WHERE status='pending';`);
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}},admin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'دسترسی مدیر لازم است.'});
 const paidBack=id=>db.prepare("SELECT COALESCE(SUM(amount_toman),0) n FROM booking_refunds WHERE booking_id=? AND status='credited'").get(id).n;
 function eligible(b){if(!b||b.schema_version!==2)fail('رزرو پیدا نشد.',404);if(b.status!=='confirmed')fail('فقط رزرو قطعی قابل درخواست بازپرداخت است.',409);
  if(!db.prepare("SELECT 1 FROM ledger_journals WHERE reference=? OR reference=?").get(`booking:${b.id}`,`payment:${b.payment_id}`))fail('سند پرداخت واقعی پیدا نشد.',409);
  const started=db.prepare('SELECT 1 FROM booking_occurrences bo JOIN class_occurrences o ON o.id=bo.occurrence_id WHERE bo.booking_id=? AND o.starts_at<=?').get(b.id,now());if(started)fail('برای رزرو دارای جلسهٔ شروع‌شده، بررسی مصرف خدمات و تسویهٔ مستقل لازم است.',409);
 }
 app.post('/api/bookings/:id/refunds',auth,safe((req,res)=>{
  const {amountToman,key,reason}=req.body||{};if(!Number.isSafeInteger(amountToman)||amountToman<1||!/^[a-zA-Z0-9_-]{16,100}$/.test(key||'')||typeof reason!=='string'||reason.trim().length<10||reason.length>1000)fail('مبلغ، شناسهٔ یکتا و دلیل حداقل ۱۰ نویسه لازم است.');
  const result=db.transaction(()=>{const old=db.prepare('SELECT * FROM booking_refunds WHERE user_id=? AND request_key=?').get(req.user.id,key);if(old){if(old.booking_id!==Number(req.params.id)||old.amount_toman!==amountToman||old.reason!==reason.trim())fail('شناسهٔ درخواست تکراری با محتوای متفاوت.',409);return old;}
   const b=db.prepare('SELECT * FROM bookings WHERE id=? AND user_id=?').get(req.params.id,req.user.id);eligible(b);if(amountToman>b.total-paidBack(b.id))fail('مبلغ بیش از ماندهٔ پرداخت واقعی است.');if(db.prepare("SELECT 1 FROM booking_refunds WHERE booking_id=? AND status='pending'").get(b.id))fail('این رزرو درخواست باز دارد.',409);
   const id=crypto.randomUUID();db.prepare("INSERT INTO booking_refunds(id,booking_id,user_id,amount_toman,status,request_key,reason,created_at) VALUES(?,?,?,?,'pending',?,?,?)").run(id,b.id,req.user.id,amountToman,key,reason.trim(),now());settings.audit(req.user.id,'refund.requested',id,{bookingId:b.id,amountToman});return db.prepare('SELECT * FROM booking_refunds WHERE id=?').get(id);
  })();res.json({refund:result});
 }));
 app.get('/api/finance/mine',auth,safe((req,res)=>{
  const bookings=db.prepare("SELECT b.id,b.status,b.total,c.title FROM bookings b JOIN classes c ON c.id=b.class_id WHERE b.user_id=? AND b.schema_version=2 AND b.booking_origin!='friendly_hold' ORDER BY b.id DESC LIMIT 100").all(req.user.id).map(b=>({...b,refundedToman:paidBack(b.id),canRequestRefund:b.status==='confirmed'&&!db.prepare("SELECT 1 FROM booking_occurrences bo JOIN class_occurrences o ON o.id=bo.occurrence_id WHERE bo.booking_id=? AND o.starts_at<=?").get(b.id,now())&&!db.prepare("SELECT 1 FROM booking_refunds WHERE booking_id=? AND status='pending'").get(b.id)}));
  const pCfg=settings?settings.get('payment'):{config:{},secrets:{},version:0};
  const gatewayConfigured=Boolean(pCfg?.config?.enabled&&pCfg?.secrets?.merchantId);
  const gatewayStatus={
   configured:gatewayConfigured,
   sandbox:Boolean(pCfg?.config?.sandbox),
   mode:gatewayConfigured?(pCfg.config.sandbox?'sandbox':'live'):(process.env.NODE_ENV!=='production'&&(pCfg?.version||0)===0?'local_dev':'unconfigured')
  };
  const payments=db.prepare('SELECT id,purpose,booking_id,amount_rial,status,redirect_url,reference,authority,created_at,verified_at FROM payment_intents WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id).map(p=>({
   id:p.id,
   purpose:p.purpose,
   bookingId:p.booking_id,
   amount:Math.floor(p.amount_rial/10),
   status:p.status,
   redirectUrl:p.redirect_url,
   reference:p.reference,
   createdAt:p.created_at,
   verifiedAt:p.verified_at,
   isLocalDev:Boolean(p.authority&&String(p.authority).startsWith('LOCALDEV_'))
  }));
  res.json({
   bookings,
   wallet:{
    balance:finance.walletBalance(req.user.id)/10,
    transactions:db.prepare('SELECT e.amount_rial,j.kind,j.created_at,j.reference FROM ledger_entries e JOIN ledger_journals j ON j.id=e.journal_id WHERE e.account=? ORDER BY e.id DESC LIMIT 100').all(`user:${req.user.id}`)
   },
   refunds:db.prepare('SELECT * FROM booking_refunds WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id),
   payments,
   gatewayStatus
  });
 }));
 app.get('/api/refunds/mine',auth,safe((req,res)=>res.json({refunds:db.prepare('SELECT * FROM booking_refunds WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id)})));
 app.get('/api/admin/refunds',auth,admin,safe((req,res)=>{const offset=Number(req.query.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('صفحه نامعتبر است.');const rows=db.prepare('SELECT * FROM booking_refunds ORDER BY created_at DESC,id LIMIT 101 OFFSET ?').all(offset);res.json({refunds:rows.slice(0,100),hasMore:rows.length>100});}));
 app.post('/api/admin/refunds/:id/review',auth,admin,safe((req,res)=>{
  const {decision,note}=req.body||{};if(!['credited','rejected'].includes(decision)||typeof note!=='string'||note.trim().length<10||note.length>1000)fail('تصمیم و توضیح حداقل ۱۰ نویسه لازم است.');
  const result=db.transaction(()=>{const r=db.prepare('SELECT * FROM booking_refunds WHERE id=?').get(req.params.id);if(!r)fail('درخواست پیدا نشد.',404);if(r.status!=='pending'){if(r.status===decision&&r.note===note.trim())return r;fail('درخواست قبلاً بررسی شده است.',409);}
   if(decision==='credited'){
    const b=db.prepare('SELECT * FROM bookings WHERE id=?').get(r.booking_id);eligible(b);const previous=paidBack(b.id);if(previous+r.amount_toman>b.total)fail('مبلغ از مانده بیشتر است.',409);
    finance.journal(`refund:${r.id}`,'refund',[{account:'platform:escrow',amount:-r.amount_toman*10},{account:`user:${r.user_id}`,amount:r.amount_toman*10}]);
    if(previous+r.amount_toman===b.total){const discount=db.prepare("SELECT * FROM club_discount_reservations WHERE booking_id=? AND state='consumed'").get(b.id);if(discount){finance.journal(`refund-discount:${b.id}`,'club_discount_reversal',[{account:'platform:escrow',amount:-discount.discount_toman*10},{account:'platform:club-expense',amount:discount.discount_toman*10}]);db.prepare("UPDATE club_discount_reservations SET state='released',updated_at=? WHERE booking_id=?").run(now(),b.id);}
     db.prepare("UPDATE bookings SET status='refunded' WHERE id=?").run(b.id);db.prepare('DELETE FROM booking_seats WHERE booking_id=?').run(b.id);
     const active=db.prepare("SELECT 1 FROM bookings WHERE class_id=? AND user_id=? AND status='confirmed' AND id!=?").get(b.class_id,b.user_id,b.id);if(!active)db.prepare("DELETE FROM chat_members WHERE user_id=? AND role='member' AND room_id IN (SELECT id FROM chat_rooms WHERE source_key=?)").run(b.user_id,`class:${b.class_id}`);
    }
   }
   db.prepare('UPDATE booking_refunds SET status=?,note=?,reviewed_by=?,reviewed_at=? WHERE id=?').run(decision,note.trim(),req.user.id,now(),r.id);settings.audit(req.user.id,'refund.reviewed',r.id,{decision,amountToman:r.amount_toman});return db.prepare('SELECT * FROM booking_refunds WHERE id=?').get(r.id);
  })();res.json({refund:result});
 }));
}
module.exports={refundsModule};
