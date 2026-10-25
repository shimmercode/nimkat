const crypto=require('node:crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const isClubCode=code=>typeof code==='string'&&code.trim().toUpperCase().startsWith('NKCLUB_');
function voucherStore({db,settings,journal,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS club_discount_vouchers(claim_id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,code TEXT UNIQUE NOT NULL,percent INTEGER NOT NULL CHECK(percent BETWEEN 1 AND 50),cap_toman INTEGER NOT NULL CHECK(cap_toman>0),expires_at INTEGER,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS club_discount_reservations(id TEXT PRIMARY KEY,claim_id TEXT NOT NULL,booking_id INTEGER UNIQUE NOT NULL,discount_toman INTEGER NOT NULL CHECK(discount_toman>0),state TEXT NOT NULL CHECK(state IN ('reserved','consumed','released')),created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS club_discount_one_active ON club_discount_reservations(claim_id) WHERE state IN ('reserved','consumed');
 CREATE TRIGGER IF NOT EXISTS club_voucher_no_update BEFORE UPDATE ON club_discount_vouchers BEGIN SELECT RAISE(ABORT,'append-only voucher'); END;
 CREATE TRIGGER IF NOT EXISTS club_voucher_no_delete BEFORE DELETE ON club_discount_vouchers BEGIN SELECT RAISE(ABORT,'append-only voucher'); END;`);
 function issue({claimId,userId,percent,capToman,expiresAt}){
  if(typeof claimId!=='string'||!Number.isSafeInteger(userId)||!Number.isInteger(percent)||percent<1||percent>50||!Number.isSafeInteger(capToman)||capToman<1||expiresAt!==null&&(!Number.isSafeInteger(expiresAt)||expiresAt<=now()))fail('شرایط صدور تخفیف معتبر نیست.');
  const old=db.prepare('SELECT * FROM club_discount_vouchers WHERE claim_id=?').get(claimId);if(old)return old;
  const code=`NKCLUB_${crypto.randomBytes(16).toString('hex').toUpperCase()}`;db.prepare('INSERT INTO club_discount_vouchers VALUES(?,?,?,?,?,?,?)').run(claimId,userId,code,percent,capToman,expiresAt,now());return db.prepare('SELECT * FROM club_discount_vouchers WHERE claim_id=?').get(claimId);
 }
 function state(v){const use=db.prepare("SELECT r.*,b.status,b.hold_until FROM club_discount_reservations r JOIN bookings b ON b.id=r.booking_id WHERE r.claim_id=? AND r.state IN ('reserved','consumed')").get(v.claim_id);return {status:use?.state==='consumed'?'consumed':v.expires_at&&v.expires_at<=now()?'expired':use?.state==='reserved'&&use.status==='held'&&use.hold_until>now()?'reserved':'available',bookingId:use?.booking_id||null};}
 function lookup(code,uid){const v=db.prepare('SELECT * FROM club_discount_vouchers WHERE code=? AND user_id=?').get(String(code).trim().toUpperCase(),uid||-1);if(!v)fail('کد تخفیف متعلق به این حساب نیست یا معتبر نیست.');const s=state(v);if(s.status!=='available')fail(s.status==='expired'?'مهلت تخفیف تمام شده است.':'تخفیف قبلاً مصرف یا برای پرداخت دیگری نگه داشته شده است.',409);return v;}
 function reserve(v,bookingId,discount){if(!Number.isSafeInteger(discount)||discount<1||discount>v.cap_toman)fail('مبلغ تخفیف معتبر نیست.');db.prepare("INSERT INTO club_discount_reservations VALUES(?,?,?,?,'reserved',?,?)").run(crypto.randomUUID(),v.claim_id,bookingId,discount,now(),now());settings.audit(v.user_id,'club.discount-reserved',String(bookingId),{claimId:v.claim_id,discountToman:discount});}
 function consume(bookingId){const r=db.prepare('SELECT * FROM club_discount_reservations WHERE booking_id=?').get(bookingId);if(!r||r.state==='consumed')return;if(r.state!=='reserved')fail('نگهداری تخفیف معتبر نیست.',409);journal(`club-discount:${bookingId}`,'club_discount',[{account:'platform:club-expense',amount:-r.discount_toman*10},{account:'platform:escrow',amount:r.discount_toman*10}]);db.prepare("UPDATE club_discount_reservations SET state='consumed',updated_at=? WHERE id=?").run(now(),r.id);settings.audit(null,'club.discount-consumed',String(bookingId),{discountToman:r.discount_toman,claimId:r.claim_id});}
 function release(bookingId){const result=db.prepare("UPDATE club_discount_reservations SET state='released',updated_at=? WHERE booking_id=? AND state='reserved'").run(now(),bookingId);if(result.changes)settings.audit(null,'club.discount-released',String(bookingId));}
 function releaseExpired(){for(const r of db.prepare("SELECT r.booking_id FROM club_discount_reservations r JOIN bookings b ON b.id=r.booking_id WHERE r.state='reserved' AND (b.status IN ('expired','failed','sandbox_complete') OR (b.status='held' AND b.hold_until<=?))").all(now()))release(r.booking_id);}
 function forClaim(uid,claimId){const v=db.prepare('SELECT * FROM club_discount_vouchers WHERE claim_id=? AND user_id=?').get(claimId,uid);return v?{...v,...state(v)}:null;}
 return {issue,lookup,reserve,consume,release,releaseExpired,forClaim};
}
module.exports={voucherStore,isClubCode};
