const crypto = require('node:crypto');
const S = require('./security');
const migrate = require('./schema');

module.exports = function registerAuth(app, { db, config = S.config(), sendOtp, now = Date.now }) {
  const cfg = config;
  migrate(db);
  const fail = (res, status, error, code) => res.status(status).json({ error, code });
  const limit = (key, max, windowMs) => {
    const time = now();
    return db.transaction(() => {
      db.prepare('DELETE FROM auth_limits WHERE reset_at <= ?').run(time);
      const row = db.prepare('SELECT * FROM auth_limits WHERE key=?').get(key);
      if (row && row.count >= max) return Math.ceil((row.reset_at - time) / 1000);
      db.prepare('INSERT INTO auth_limits (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, time + windowMs);
      return 0;
    })();
  };
  const rateError = (res, seconds) => {
    res.set('Retry-After', String(Math.max(1, seconds)));
    return fail(res, 429, 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.', 'RATE_LIMITED');
  };
  const originGuard = (req, res, next) => S.sameOrigin(req, cfg) ? next() : fail(res, 403, 'مبدأ درخواست مجاز نیست.', 'ORIGIN_REJECTED');
  app.use('/api/auth', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  // All state-changing API calls reject cross-site origins, not just authentication.
  app.use('/api', (req, res, next) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? next() : originGuard(req, res, next));

  const accessSession = (req) => {
    const token = S.cookies(req)[S.ACCESS];
    if (!token) return null;
    return db.prepare('SELECT * FROM auth_sessions WHERE access_hash=? AND revoked_at IS NULL AND access_expires>? AND refresh_expires>?').get(S.hash(token), now(), now()) || null;
  };
  const csrfValid = (req, session) => {
    const csrf = req.headers['x-csrf-token'];
    return typeof csrf === 'string' && S.equal(S.hash(csrf), session.csrf_hash);
  };
  const requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : fail(res, 403, 'دسترسی برای این نقش مجاز نیست.', 'FORBIDDEN');
  const auth = (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const session = accessSession(req);
    if (!session) return fail(res, 401, 'نیاز به ورود دارید.', 'UNAUTHENTICATED');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !csrfValid(req, session)) return fail(res, 403, 'اعتبار درخواست منقضی شده است.', 'CSRF_REJECTED');
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);
    if (!user) return fail(res, 401, 'کاربر پیدا نشد.', 'UNAUTHENTICATED');
    req.user = user;
    req.authSession = session;
    next();
  };

  app.post('/api/auth/otp/request', async (req, res) => {
    const mobile = String(req.body?.mobile || '');
    if (!/^09\d{9}$/.test(mobile)) return fail(res, 400, 'شماره موبایل ۱۱ رقم است.', 'INVALID_MOBILE');
    db.prepare('DELETE FROM otp WHERE expires_at<=?').run(now());
    // Forwarded IPs are used only when trust proxy is explicitly configured.
    const ipKey = S.hash(req.ip || req.socket.remoteAddress || 'unknown');
    const retry = limit(`otp-ip:${ipKey}`, 30, 15 * 60000) || limit(`otp-mobile:${mobile}`, 5, 15 * 60000);
    if (retry) return rateError(res, retry);
    const existing = db.prepare('SELECT requested_at FROM otp WHERE mobile=?').get(mobile);
    if (existing && now() - existing.requested_at < cfg.cooldownMs) return rateError(res, Math.ceil((cfg.cooldownMs - (now() - existing.requested_at)) / 1000));
    if (cfg.production && !sendOtp) return fail(res, 503, 'سرویس ارسال پیامک هنوز پیکربندی نشده است.', 'SMS_UNAVAILABLE');
    const code = String(crypto.randomInt(10000, 100000));
    const digest = S.otpHash(cfg.secret, mobile, code);
    db.prepare('INSERT INTO otp (mobile,code,expires_at,attempts,requested_at) VALUES (?,?,?,0,?) ON CONFLICT(mobile) DO UPDATE SET code=excluded.code,expires_at=excluded.expires_at,attempts=0,requested_at=excluded.requested_at').run(mobile, digest, now() + cfg.otpMs, now());
    try {
      if (sendOtp) await sendOtp(mobile, code);
    } catch {
      db.prepare('DELETE FROM otp WHERE mobile=? AND code=?').run(mobile, digest);
      return fail(res, 503, 'ارسال پیامک موفق نبود؛ بعداً تلاش کنید.', 'SMS_UNAVAILABLE');
    }
    res.json({ ok: true, ...(!cfg.production ? { devCode: code } : {}), expires_in: cfg.otpMs / 1000, retry_after: cfg.cooldownMs / 1000, max_attempts: 5 });
  });

  app.post('/api/auth/otp/verify', (req, res) => {
    const { mobile, code, role } = req.body || {};
    if (!/^09\d{9}$/.test(String(mobile)) || !/^\d{5}$/.test(String(code))) return fail(res, 400, 'شماره یا کد نامعتبر است.', 'INVALID_OTP');
    const retry = limit(`verify-ip:${S.hash(req.ip || 'unknown')}`, 60, 15 * 60000);
    if (retry) return rateError(res, retry);
    const result = db.transaction(() => {
      const row = db.prepare('SELECT * FROM otp WHERE mobile=?').get(mobile);
      if (!row || row.expires_at <= now()) return { error: 'کد منقضی شده؛ دوباره درخواست کنید.' };
      if (row.attempts >= 5) return { error: 'حداکثر ۵ بار می‌توانید کد را وارد کنید.' };
      if (!S.equal(row.code, S.otpHash(cfg.secret, mobile, String(code)))) {
        db.prepare('UPDATE otp SET attempts=attempts+1 WHERE mobile=?').run(mobile);
        return { error: 'کد تأیید درست نیست.' };
      }
      db.prepare('DELETE FROM otp WHERE mobile=?').run(mobile);
      let user = db.prepare('SELECT * FROM users WHERE mobile=?').get(mobile);
      if (!user) {
        const chosen = ['student', 'teacher', 'parent'].includes(role) ? role : 'student';
        const info = db.prepare('INSERT INTO users (mobile,name,role,subtitle,letter) VALUES (?,?,?,?,?)').run(mobile, 'کاربر نیمکت', chosen, 'پروفایل کامل نشده', 'ک');
        user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
      }
      const values = { access: S.random(), refresh: S.random(), csrf: S.random() };
      db.prepare('INSERT INTO auth_sessions (id,user_id,access_hash,access_expires,refresh_hash,csrf_hash,refresh_expires,created_at) VALUES (?,?,?,?,?,?,?,?)').run(S.random(), user.id, S.hash(values.access), now() + cfg.accessMs, S.hash(values.refresh), S.hash(values.csrf), now() + cfg.refreshMs, now());
      // Opportunistic cleanup; durable counters and revocations survive restarts.
      db.prepare('DELETE FROM auth_refresh_used WHERE expires_at<=?').run(now());
      db.prepare('DELETE FROM auth_sessions WHERE refresh_expires<=?').run(now());
      return { user, values };
    })();
    if (result.error) return fail(res, 400, result.error, 'INVALID_OTP');
    S.setCookies(res, cfg, result.values);
    res.json({ ok: true, user: result.user });
  });

  app.post('/api/auth/refresh', (req, res) => {
    const token = S.cookies(req)[S.REFRESH];
    if (!token) return fail(res, 401, 'نشست منقضی شده؛ دوباره وارد شوید.', 'UNAUTHENTICATED');
    const digest = S.hash(token);
    const result = db.transaction(() => {
      const session = db.prepare('SELECT * FROM auth_sessions WHERE refresh_hash=? AND revoked_at IS NULL AND refresh_expires>?').get(digest, now());
      if (!session) {
        const used = db.prepare('SELECT * FROM auth_refresh_used WHERE token_hash=? AND expires_at>?').get(digest, now());
        if (used) {
          const original = db.prepare('SELECT * FROM auth_sessions WHERE id=?').get(used.session_id);
          // A stolen refresh token without the independent CSRF secret must not revoke another session.
          if (original && csrfValid(req, original)) db.prepare('UPDATE auth_sessions SET revoked_at=? WHERE id=?').run(now(), used.session_id);
        }
        return { status: 401 };
      }
      if (!csrfValid(req, session)) return { status: 403 };
      const values = { access: S.random(), refresh: S.random(), csrf: S.cookies(req)[S.CSRF] };
      if (!values.csrf || !S.equal(S.hash(values.csrf), session.csrf_hash)) return { status: 403 };
      db.prepare('INSERT INTO auth_refresh_used (token_hash,session_id,expires_at) VALUES (?,?,?)').run(digest, session.id, session.refresh_expires);
      db.prepare('UPDATE auth_sessions SET access_hash=?,access_expires=?,refresh_hash=? WHERE id=?').run(S.hash(values.access), now() + cfg.accessMs, S.hash(values.refresh), session.id);
      return { values };
    })();
    if (!result.values) {
      if (result.status === 401) S.clearCookies(res, cfg);
      return fail(res, result.status, 'تمدید نشست موفق نبود؛ دوباره وارد شوید.', result.status === 403 ? 'CSRF_REJECTED' : 'UNAUTHENTICATED');
    }
    S.setCookies(res, cfg, result.values);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const session = accessSession(req);
    if (!session) {
      if (S.cookies(req)[S.REFRESH]) return fail(res, 401, 'نشست نیاز به تمدید دارد.', 'ACCESS_EXPIRED');
      return res.json({ user: null });
    }
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);
    res.json({ user: user || null });
  });

  app.post('/api/auth/logout', (req, res) => {
    const jar = S.cookies(req);
    const session = accessSession(req) || (jar[S.REFRESH] && db.prepare('SELECT * FROM auth_sessions WHERE refresh_hash=? AND revoked_at IS NULL').get(S.hash(jar[S.REFRESH])));
    if (session && !csrfValid(req, session)) return fail(res, 403, 'اعتبار درخواست نامعتبر است.', 'CSRF_REJECTED');
    if (session) db.prepare('UPDATE auth_sessions SET revoked_at=? WHERE id=?').run(now(), session.id);
    S.clearCookies(res, cfg);
    res.json({ ok: true });
  });
  app.post('/api/auth/logout-all', auth, (req, res) => {
    db.prepare('UPDATE auth_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').run(now(), req.user.id);
    S.clearCookies(res, cfg);
    res.json({ ok: true });
  });
  return { auth, requireRole };
};
