const {voucherStore,isClubCode}=require('./vouchers');
const crypto = require('node:crypto');
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const keyPattern = /^[a-zA-Z0-9_-]{16,100}$/;
function paymentModule(app, { db, auth, settings, providers, scheduling, onConfirmed = () => {}, onCreated=()=>{}, now = Date.now }) {
  const columns = db.prepare('PRAGMA table_info(bookings)').all();
  const additions = {booking_origin:"TEXT NOT NULL DEFAULT 'standard'",  idempotency_key: 'TEXT', request_hash: 'TEXT', hold_until: 'INTEGER', payment_id: 'TEXT', schema_version: 'INTEGER NOT NULL DEFAULT 1' };
  db.transaction(() => { for (const [name, type] of Object.entries(additions)) if (!columns.some((c) => c.name === name)) db.exec(`ALTER TABLE bookings ADD COLUMN ${name} ${type}`); })();
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS bookings_idempotency ON bookings(user_id,idempotency_key);
    CREATE TABLE IF NOT EXISTS booking_seats (class_id INTEGER NOT NULL, seat INTEGER NOT NULL, booking_id INTEGER NOT NULL, PRIMARY KEY(class_id,seat));
    CREATE TABLE IF NOT EXISTS payment_intents (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, booking_id INTEGER, purpose TEXT NOT NULL,
      amount_rial INTEGER NOT NULL CHECK(amount_rial>0), status TEXT NOT NULL, authority TEXT UNIQUE,
      redirect_url TEXT, reference TEXT, config_enc TEXT NOT NULL, idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL, verified_at INTEGER, UNIQUE(user_id,idempotency_key)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS payment_reference_unique ON payment_intents(reference) WHERE reference IS NOT NULL;
    CREATE TABLE IF NOT EXISTS ledger_journals (id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL, kind TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS ledger_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, journal_id TEXT NOT NULL, account TEXT NOT NULL, amount_rial INTEGER NOT NULL CHECK(amount_rial!=0));
    CREATE INDEX IF NOT EXISTS ledger_account ON ledger_entries(account);
    CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger_entries BEGIN SELECT RAISE(ABORT,'append-only ledger'); END;
    CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger_entries BEGIN SELECT RAISE(ABORT,'append-only ledger'); END;
    CREATE TRIGGER IF NOT EXISTS journal_no_update BEFORE UPDATE ON ledger_journals BEGIN SELECT RAISE(ABORT,'append-only journal'); END;
    CREATE TRIGGER IF NOT EXISTS journal_no_delete BEFORE DELETE ON ledger_journals BEGIN SELECT RAISE(ABORT,'append-only journal'); END;
  `);
  const walletBalance = (uid) => db.prepare('SELECT COALESCE(SUM(amount_rial),0) balance FROM ledger_entries WHERE account=?').get(`user:${uid}`).balance;
  function journal(reference, kind, lines) {
    if (!lines.length || lines.some((line) => !Number.isSafeInteger(line.amount) || !line.amount) || lines.reduce((sum, line) => sum + line.amount, 0) !== 0) throw error('سند مالی نامتوازن است.', 500);
    const existing = db.prepare('SELECT id FROM ledger_journals WHERE reference=?').get(reference);
    if (existing) return existing.id;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO ledger_journals (id,reference,kind,created_at) VALUES (?,?,?,?)').run(id, reference, kind, now());
    for (const line of lines) db.prepare('INSERT INTO ledger_entries (journal_id,account,amount_rial) VALUES (?,?,?)').run(id, line.account, line.amount);
    return id;
  }
  const vouchers=voucherStore({db,settings,journal,now});
  function quote(body,userId) {
    const { classId, sessions = 1, people = 1, coupon } = body;
    if (!Number.isInteger(classId) || !Number.isInteger(sessions) || sessions < 1 || sessions > 32 || !Number.isInteger(people) || people < 1 || people > 5) throw error('کلاس، تعداد جلسات یا تعداد نفرات نامعتبر است.');
    const cls = db.prepare('SELECT * FROM classes WHERE id=?').get(classId);
    if (!cls) throw error('کلاس پیدا نشد.', 404);
    const gross = cls.price * sessions * people;
    if (!Number.isSafeInteger(gross) || gross < 1 || gross > 1000000000) throw error('مبلغ رزرو خارج از محدوده است.');
    const tierPercent = sessions >= 16 ? 15 : sessions >= 8 ? 10 : sessions >= 4 ? 5 : 0;
    const tierOff = Math.floor(gross * tierPercent / 100);
    const friendOff = people >= 2 ? Math.floor((gross - tierOff) * .2) : 0;
    let couponPercent = 0,voucher=null;
    if (coupon) {
      const upperCoupon = String(coupon).toUpperCase();
      const item = isClubCode(coupon)?(voucher=vouchers.lookup(coupon,userId)):db.prepare('SELECT percent FROM coupons WHERE code=?').get(upperCoupon);
      if (!item || !Number.isInteger(item.percent) || item.percent < 0 || item.percent > 100) throw error('کد تخفیف معتبر نیست.');
      if (!voucher && upperCoupon === 'MEHR05' && userId) {
        const priorBooking = db.prepare("SELECT 1 FROM bookings WHERE user_id=? AND schema_version=2 AND status IN ('confirmed','held','paid') LIMIT 1").get(userId);
        if (priorBooking) throw error('کد تخفیف ثبت‌نام اول فقط برای اولین رزرو کلاس قابل استفاده است.', 409);
      }
      couponPercent = item.percent;
    }
    const couponOff = Math.min(Math.floor((gross - tierOff - friendOff) * couponPercent / 100),voucher?voucher.cap_toman:Infinity);
    if(voucher&&couponOff<1)throw error('مبلغ این رزرو برای استفاده از تخفیف کافی نیست.');
    const total = gross - tierOff - friendOff - couponOff;
    if (total <= 0) throw error('رزرو بدون مبلغ نیاز به روند جداگانه دارد.');
    return { cls, voucher, coupon_kind:voucher?'club':'general',coupon_cap:voucher?.cap_toman||null, gross, tier_percent: tierPercent, tier_off: tierOff, friend_percent: people >= 2 ? 20 : 0, friend_off: friendOff, coupon_percent: couponPercent, coupon_off: couponOff, total, per_person: Math.ceil(total / people), amount_rial: total * 10, currency: 'IRR' };
  }
  function expire() {
    db.prepare("DELETE FROM booking_seats WHERE booking_id IN (SELECT id FROM bookings WHERE schema_version=2 AND status='held' AND hold_until<=?)").run(now());
    db.prepare("UPDATE bookings SET status='expired' WHERE schema_version=2 AND status='held' AND hold_until<=?").run(now());
    vouchers.releaseExpired();
  }
  const paymentView = (row) => {
    const isLocalDev = Boolean(row.authority && String(row.authority).startsWith('LOCALDEV_'));
    return {
      id: row.id,
      bookingId: row.booking_id,
      purpose: row.purpose,
      amountRial: row.amount_rial,
      amount: row.amount_rial / 10,
      status: row.status,
      redirectUrl: row.redirect_url,
      paymentUrl: row.redirect_url,
      reference: row.reference,
      createdAt: row.created_at,
      verifiedAt: row.verified_at || null,
      mode: isLocalDev ? 'local_dev' : undefined,
      authority: isLocalDev && process.env.NODE_ENV !== 'production' ? row.authority : undefined,
    };
  };
  async function initiate(intent, config, user) {
    if (intent.status !== 'creating') return paymentView(intent);
    try {
      const result = await providers.requestPayment(config, { id: intent.id, amount: intent.amount_rial, description: intent.booking_id ? `رزرو نیمکت ${intent.booking_id}` : 'شارژ کیف پول نیمکت', mobile: user.mobile });
      db.prepare("UPDATE payment_intents SET status='pending',authority=?,redirect_url=? WHERE id=? AND status='creating'").run(result.authority, result.url, intent.id);
    } catch (e) {
      db.transaction(() => {
        db.prepare("UPDATE payment_intents SET status='failed' WHERE id=? AND status='creating'").run(intent.id);
        if (intent.booking_id) {
          db.prepare("UPDATE bookings SET status='failed' WHERE id=? AND status='held'").run(intent.booking_id);
          db.prepare('DELETE FROM booking_seats WHERE booking_id=?').run(intent.booking_id);
          vouchers.release(intent.booking_id);
        }
        settings.audit(user.id, 'payment.request_failed', intent.id);
      })();
      throw error('ایجاد پرداخت موفق نبود؛ وجهی به کیف پول اضافه نشد. با شناسهٔ جدید دوباره تلاش کنید.', 503);
    }
    return paymentView(db.prepare('SELECT * FROM payment_intents WHERE id=?').get(intent.id));
  }
  const safe = (handler) => (req, res, next) => Promise.resolve().then(() => handler(req, res)).catch(next);
  const S = require('../auth/security');
  const optionalUserId = (req) => {
    if (req.user?.id) return req.user.id;
    const token = S.cookies(req)[S.ACCESS];
    if (!token) return undefined;
    const session = db.prepare('SELECT user_id FROM auth_sessions WHERE access_hash=? AND revoked_at IS NULL AND access_expires>?').get(S.hash(token), Date.now());
    return session?.user_id;
  };
  app.post('/api/bookings/quote', (req,res,next)=>isClubCode(req.body?.coupon)?auth(req,res,next):next(), safe((req, res) => { const { cls, voucher, ...result } = quote(req.body || {},optionalUserId(req)); res.json(result); }));
  app.post('/api/bookings', auth, safe(async (req, res) => {
    const body = req.body || {}, key = body.idempotencyKey;
    if (!keyPattern.test(key || '')) throw error('شناسهٔ یکتای درخواست رزرو لازم است.');
    let q;
    const method = body.method || 'gateway';
    if (!['gateway', 'wallet'].includes(method)) throw error('روش پرداخت نامعتبر است.');
    const seats = body.seats || [];
    if (!Array.isArray(seats) || (seats.length && seats.length !== (body.people || 1)) || seats.some((n) => !Number.isInteger(n)) || new Set(seats).size !== seats.length) throw error('صندلی‌های انتخابی نامعتبرند.');
    const hash = crypto.createHash('sha256').update(JSON.stringify({ classId: body.classId, sessions: body.sessions || 1, people: body.people || 1, coupon: body.coupon || '', seats, method, occurrenceIds: body.occurrenceIds || [] })).digest('hex');
    const previous = db.prepare('SELECT * FROM bookings WHERE user_id=? AND idempotency_key=?').get(req.user.id, key);
    if (previous) {
      if (previous.request_hash !== hash) throw error('این شناسه قبلاً برای درخواست متفاوت استفاده شده است.', 409);
      const payment = previous.payment_id && db.prepare('SELECT * FROM payment_intents WHERE id=?').get(previous.payment_id);
      return res.json({ ok: true, bookingId: previous.id, status: previous.status, total: previous.total, payment: payment ? paymentView(payment) : null });
    }
    const config = method === 'gateway' ? providers.paymentConfig() : null;
    const result = db.transaction(() => {
      expire();
      q=quote(body,req.user.id);
      const occurrenceIds = scheduling ? scheduling.validate(body, q.cls, req.user.id) : [];
      if (method === 'wallet' && walletBalance(req.user.id) < q.amount_rial) throw error('موجودی واقعی کیف پول کافی نیست.', 402);
      const occupied = new Set(db.prepare('SELECT seat FROM booking_seats WHERE class_id=?').all(q.cls.id).map((r) => r.seat));
      const available = Array.from({ length: q.cls.capacity }, (_, i) => i + 1).filter((n) => n > q.cls.taken && !occupied.has(n));
      const people = body.people || 1, chosen = seats.length ? seats : available.slice(0, people);
      if (chosen.length !== people || chosen.some((seat) => !available.includes(seat))) throw error('ظرفیت یا صندلی انتخابی تکمیل شده است؛ گزینهٔ دیگری انتخاب کنید.', 409);
      const paymentId = method === 'gateway' ? crypto.randomUUID() : null;
      const info = db.prepare('INSERT INTO bookings (user_id,class_id,sessions,people,seats,friends,gross,discount,total,per_person,coupon,status,idempotency_key,request_hash,hold_until,payment_id,schema_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,2)')
        .run(req.user.id, q.cls.id, body.sessions || 1, people, JSON.stringify(chosen), '[]', q.gross, q.gross - q.total, q.total, q.per_person, body.coupon || null, method === 'wallet' ? 'confirmed' : 'held', key, hash, method === 'wallet' ? null : now() + 15 * 60000, paymentId);
      const id = Number(info.lastInsertRowid);
      onCreated(id);
      if (scheduling) scheduling.attach(id, occurrenceIds);
      if(q.voucher)vouchers.reserve(q.voucher,id,q.coupon_off);
      for (const seat of chosen) db.prepare('INSERT INTO booking_seats (class_id,seat,booking_id) VALUES (?,?,?)').run(q.cls.id, seat, id);
      if (paymentId) db.prepare('INSERT INTO payment_intents (id,user_id,booking_id,purpose,amount_rial,status,config_enc,idempotency_key,request_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(paymentId, req.user.id, id, 'booking', q.amount_rial, 'creating', settings.seal(config, `payment:${paymentId}`), key, hash, now());
      else journal(`booking:${id}`, 'booking', [{ account: `user:${req.user.id}`, amount: -q.amount_rial }, { account: 'platform:escrow', amount: q.amount_rial }]);
      if(method==='wallet')vouchers.consume(id);
      settings.audit(req.user.id, 'booking.created', String(id), { method, amountRial: q.amount_rial });
      return { id, paymentId };
    })();
    if (method === 'wallet') { onConfirmed(result.id); return res.json({ ok: true, bookingId: result.id, status: 'confirmed', sessions: Number(body.sessions) || 1, total: q.total }); }
    const intent = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(result.paymentId);
    res.json({ ok: true, bookingId: result.id, status: 'held', total: q.total, payment: await initiate(intent, config, req.user) });
  }));
  app.post('/api/wallet/charge', auth, safe(async (req, res) => {
    const { amount: rawAmount, idempotencyKey: key } = req.body || {};
    const normalized = typeof rawAmount === 'string'
      ? rawAmount.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632)).replace(/[,٬\s]/g, '')
      : rawAmount;
    const amount = typeof normalized === 'string' && /^\d+$/.test(normalized) ? Number(normalized) : normalized;
    if (!Number.isSafeInteger(amount) || amount < 1000 || amount > 100000000 || !keyPattern.test(key || '')) {
      throw error('مبلغ شارژ باید عدد صحیح بین ۱٬۰۰۰ تا ۱۰۰٬۰۰۰٬۰۰۰ تومان و همراه با شناسهٔ معتبر باشد.');
    }
    const hash = crypto.createHash('sha256').update(`wallet:${amount}`).digest('hex');
    const existing = db.prepare('SELECT * FROM payment_intents WHERE user_id=? AND idempotency_key=?').get(req.user.id, key);
    if (existing) {
      if (existing.request_hash !== hash) throw error('شناسهٔ تکراری با مبلغ متفاوت.', 409);
      return res.json({ payment: paymentView(existing) });
    }
    const config = providers.paymentConfig(), id = crypto.randomUUID();
    db.prepare('INSERT INTO payment_intents (id,user_id,purpose,amount_rial,status,config_enc,idempotency_key,request_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, req.user.id, 'wallet', amount * 10, 'creating', settings.seal(config, `payment:${id}`), key, hash, now());
    res.json({ payment: await initiate(db.prepare('SELECT * FROM payment_intents WHERE id=?').get(id), config, req.user) });
  }));
  app.get('/api/wallet', auth, (req, res) => res.json({ balanceRial: walletBalance(req.user.id), balance: walletBalance(req.user.id) / 10,
    transactions: db.prepare('SELECT e.amount_rial,j.kind,j.created_at,j.reference FROM ledger_entries e JOIN ledger_journals j ON j.id=e.journal_id WHERE e.account=? ORDER BY e.id DESC LIMIT 100').all(`user:${req.user.id}`) }));
  app.get('/api/bookings/mine', auth, safe((req, res) => {
    db.transaction(expire)();
    res.json({ bookings: db.prepare("SELECT b.id,b.class_id,b.status,b.sessions,b.people,b.seats,b.total,b.payment_id,b.hold_until,c.title FROM bookings b JOIN classes c ON c.id=b.class_id WHERE b.user_id=? AND b.booking_origin!='friendly_hold' AND b.schema_version=2 ORDER BY b.id DESC LIMIT 100").all(req.user.id) });
  }));
  app.get('/api/payments/:id', auth, (req, res) => {
    const row = db.prepare('SELECT * FROM payment_intents WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'پرداخت پیدا نشد.' });
    res.json({ payment: paymentView(row) });
  });
  app.get('/api/payments/callback/:id', safe(async (req, res) => {
    const payment = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(req.params.id);
    if (!payment) throw error('پرداخت پیدا نشد.', 404);
    const resultUrl = `/payment/result?id=${encodeURIComponent(payment.id)}`;
    const wantsJson = req.query.format === 'json';
    if (['paid', 'paid_unallocated', 'sandbox_paid'].includes(payment.status)) {
      if (wantsJson) return res.json({ ok: true, idempotent: true, idempotentReplay: true, walletBalance: Math.floor(walletBalance(payment.user_id) / 10), payment: paymentView(payment) });
      return res.redirect(303, resultUrl);
    }
    if (!payment.authority || req.query.Authority !== payment.authority) throw error('شناسهٔ بازگشت با درخواست درگاه مطابقت ندارد.');
    if (req.query.Status !== 'OK') {
      db.transaction(() => {
        const fresh = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(payment.id);
        if (fresh && fresh.status === 'pending') {
          db.prepare("UPDATE payment_intents SET status='cancelled' WHERE id=?").run(payment.id);
          if (payment.booking_id) {
            db.prepare("UPDATE bookings SET status='cancelled',hold_until=NULL WHERE id=? AND status='held'").run(payment.booking_id);
            db.prepare('DELETE FROM booking_seats WHERE booking_id=?').run(payment.booking_id);
            vouchers.release(payment.booking_id);
          }
          settings.audit(payment.user_id, 'payment.cancelled', payment.id);
        }
      })();
      if (wantsJson) {
        const updated = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(payment.id);
        return res.json({ ok: false, cancelled: true, payment: paymentView(updated) });
      }
      return res.redirect(303, `${resultUrl}&cancelled=1`);
    }
    const config = settings.open(payment.config_enc, `payment:${payment.id}`);
    let verified;
    try { verified = await providers.verifyPayment(config, { authority: payment.authority, amount: payment.amount_rial }); }
    catch {
      db.transaction(() => {
        const fresh = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(payment.id);
        if (fresh && fresh.status === 'pending') {
          db.prepare("UPDATE payment_intents SET status='failed' WHERE id=?").run(payment.id);
          if (payment.booking_id) {
            db.prepare("UPDATE bookings SET status='failed',hold_until=NULL WHERE id=? AND status='held'").run(payment.booking_id);
            db.prepare('DELETE FROM booking_seats WHERE booking_id=?').run(payment.booking_id);
            vouchers.release(payment.booking_id);
          }
        }
        settings.audit(null, 'payment.verify_failed', payment.id);
      })();
      if (wantsJson) {
        const updated = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(payment.id);
        return res.status(502).json({ ok: false, verifyFailed: true, error: 'تأیید تراکنش از درگاه ناموفق بود.', payment: paymentView(updated) });
      }
      return res.redirect(303, `${resultUrl}&verifyFailed=1`);
    }
    let confirmed = false;
    db.transaction(() => {
      expire();
      const fresh = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(payment.id);
      if (['paid', 'paid_unallocated', 'sandbox_paid'].includes(fresh.status)) return;
      const booking = payment.booking_id && db.prepare('SELECT * FROM bookings WHERE id=?').get(payment.booking_id);
      const allocated = !config.sandbox && booking && booking.status === 'held' && booking.hold_until > now();
      const reference = `${config.sandbox ? 'sandbox' : config.localDev ? 'dev' : 'live'}:${config.localDev ? 'local_dev' : 'zarinpal'}:${verified.reference}`;
      const duplicate = db.prepare('SELECT id FROM payment_intents WHERE reference=? AND id!=?').get(reference, payment.id);
      if (duplicate) throw error('این رسید قبلاً برای پرداخت دیگری ثبت شده است.', 409);
      journal(`payment:${payment.id}`, payment.purpose, [{ account: config.sandbox ? 'sandbox:clearing' : 'gateway:clearing', amount: -payment.amount_rial }, { account: config.sandbox ? `sandbox:user:${payment.user_id}` : allocated ? 'platform:escrow' : `user:${payment.user_id}`, amount: payment.amount_rial }]);
      if (config.sandbox && booking) { vouchers.release(booking.id);db.prepare("UPDATE bookings SET status='sandbox_complete',hold_until=NULL WHERE id=?").run(booking.id); db.prepare('DELETE FROM booking_seats WHERE booking_id=?').run(booking.id); }
      const status = config.sandbox ? 'sandbox_paid' : payment.purpose === 'booking' && !allocated ? 'paid_unallocated' : 'paid';
      db.prepare('UPDATE payment_intents SET status=?,reference=?,verified_at=? WHERE id=?').run(status, reference, now(), payment.id);
      if (allocated) { vouchers.consume(booking.id);db.prepare("UPDATE bookings SET status='confirmed',hold_until=NULL WHERE id=?").run(booking.id); confirmed = true; }
      if(booking&&!allocated)vouchers.release(booking.id);
      settings.audit(null, 'payment.verified', payment.id, { amountRial: payment.amount_rial, status });
    })();
    if (confirmed) onConfirmed(payment.booking_id);
    if (wantsJson) {
      const updated = db.prepare('SELECT * FROM payment_intents WHERE id=?').get(payment.id);
      return res.json({ ok: true, walletBalance: Math.floor(walletBalance(payment.user_id) / 10), payment: paymentView(updated) });
    }
    res.redirect(303, resultUrl);
  }));
  app.get('/api/admin/payments', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'دسترسی مجاز نیست.' });
    res.json({ payments: db.prepare('SELECT * FROM payment_intents ORDER BY created_at DESC LIMIT 200').all().map(paymentView) });
  });
  return { walletBalance, quote, journal, expire,issueVoucher:vouchers.issue,voucherForClaim:vouchers.forClaim };
}
module.exports = { paymentModule };
