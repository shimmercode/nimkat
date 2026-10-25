const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
// Only live, allocated booking journal entries. Wallet top-ups and sandbox money
// are not purchases. A refunded booking still counts as a historical purchase.
const funded=`WITH funded AS (
 SELECT DISTINCT b.id,b.user_id,b.total,j.created_at paid_at FROM bookings b
 JOIN ledger_journals j ON j.reference=CASE WHEN b.payment_id IS NULL THEN 'booking:'||b.id ELSE 'payment:'||b.payment_id END
 JOIN ledger_entries e ON e.journal_id=j.id AND e.account='platform:escrow' AND e.amount_rial>0
 WHERE b.schema_version=2 AND b.status IN ('confirmed','refunded') AND j.created_at<=?
), ranked AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY paid_at,id) seq FROM funded), firsts AS (SELECT * FROM ranked WHERE seq=1)`;
function analyticsModule(app,{db,auth,requireRole,now=Date.now}){
 app.get('/api/admin/analytics',auth,requireRole('admin'),(req,res,next)=>{try{
  const to=req.query.to===undefined?now():Number(req.query.to),from=req.query.from===undefined?to-365*86400000:Number(req.query.from);
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<=from||to>now()||to-from>366*86400000)fail('بازهٔ معتبر تا ۳۶۶ روز و بدون تاریخ آینده لازم است.');
  const cohorts=db.prepare(`${funded} SELECT strftime('%Y-%m',f.paid_at/1000,'unixepoch') month,COUNT(*) buyers,
   SUM(CASE WHEN f.paid_at<=?-2592000000 THEN 1 ELSE 0 END) matureBuyers,
   SUM(CASE WHEN f.paid_at<=?-2592000000 AND EXISTS(SELECT 1 FROM funded r WHERE r.user_id=f.user_id AND r.id!=f.id AND r.paid_at>=f.paid_at AND r.paid_at<f.paid_at+2592000000) THEN 1 ELSE 0 END) rebooked30d,
   SUM(CASE WHEN datetime(f.paid_at/1000,'unixepoch','start of month','+2 months')<=datetime(?/1000,'unixepoch') THEN 1 ELSE 0 END) matureM1Buyers,
   SUM(CASE WHEN datetime(f.paid_at/1000,'unixepoch','start of month','+2 months')<=datetime(?/1000,'unixepoch') AND EXISTS(SELECT 1 FROM funded r WHERE r.user_id=f.user_id AND strftime('%Y-%m',r.paid_at/1000,'unixepoch')=strftime('%Y-%m',f.paid_at/1000,'unixepoch','start of month','+1 month')) THEN 1 ELSE 0 END) retainedM1
   FROM firsts f WHERE f.paid_at>=? AND f.paid_at<? GROUP BY month ORDER BY month`).all(now(),now(),now(),now(),now(),from,to).map(r=>({...r,rebooking30dPercent:r.matureBuyers?Math.round(10000*r.rebooked30d/r.matureBuyers)/100:null,retentionM1Percent:r.matureM1Buyers?Math.round(10000*r.retainedM1/r.matureM1Buyers)/100:null}));
  const purchases=db.prepare(`${funded} SELECT COUNT(*) bookings,COUNT(DISTINCT user_id) buyers,COALESCE(SUM(total),0) amountToman FROM funded WHERE paid_at>=? AND paid_at<?`).get(now(),from,to);
  const refunds=db.prepare("SELECT COUNT(*) requests,COALESCE(SUM(amount_toman),0) amountToman FROM booking_refunds WHERE status='credited' AND reviewed_at>=? AND reviewed_at<?").get(from,to);
  res.json({from,to,timezone:'UTC',cohorts,purchases,refunds,definitions:{cohort:'ماه میلادی UTC اولین رزرو دارای سند پرداخت واقعی و تخصیص قطعی؛ رزرو بعداً بازپرداخت‌شده نیز خرید تاریخی است.',rebooking30d:'یک رزرو مستقل دیگر ظرف [زمان خرید اول، ۳۰ روز بعد). مخرج فقط خریدارانی است که ۳۰ روز کامل از خریدشان گذشته؛ چند جلسه در یک رزرو، تکرار خرید نیست.',retentionM1:'خرید مستقل در ماه میلادی بعد از ماه اولین خرید. فقط cohortهایی که ماه بعدشان کامل شده در مخرج‌اند.',purchases:'تعداد و مبلغ کل رزروهای پرداخت‌شده در بازهٔ نیمه‌باز [از، تا)، قبل از refund؛ شارژ کیف پول، پرداخت تخصیص‌نیافته، sandbox و رزرو قدیمی فاقد سند معتبر حذف‌اند.',refunds:'اعتبارهای بازپرداخت ثبت‌شده در همین بازه، مستقل از تاریخ خرید؛ این مبلغ درآمد یا تسویهٔ بانکی نیست.'}});
 }catch(e){next(e);}});
}
module.exports={analyticsModule};
