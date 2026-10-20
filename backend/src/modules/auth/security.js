const crypto = require('node:crypto');
const ACCESS = 'nk_access';
const REFRESH = 'nk_refresh';
const CSRF = 'nk_csrf';
const random = () => crypto.randomBytes(32).toString('base64url');
const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map((part) => {
    const i = part.indexOf('=');
    if (i < 0) return ['', ''];
    try { return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))]; } catch { return ['', '']; }
  }));
}
function config(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const secret = env.NIMKAT_SECRET || (production ? '' : 'nimkat-development-only-change-before-production');
  if (secret.length < 32) throw new Error('NIMKAT_SECRET must contain at least 32 characters.');
  if (production && env.COOKIE_SECURE === 'false') throw new Error('Production auth requires Secure cookies.');
  return {
    production, secret, secure: production || env.COOKIE_SECURE === 'true',
    accessMs: 15 * 60 * 1000, refreshMs: 7 * 24 * 60 * 60 * 1000,
    otpMs: 120000, cooldownMs: 60000,
    origins: (env.APP_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  };
}
function otpHash(secret, mobile, code) {
  return crypto.createHmac('sha256', secret).update(`${mobile}:${code}`).digest('hex');
}
function setCookies(res, cfg, values) {
  const common = { secure: cfg.secure, sameSite: 'lax' };
  res.cookie(ACCESS, values.access, { ...common, httpOnly: true, path: '/api', maxAge: cfg.accessMs });
  res.cookie(REFRESH, values.refresh, { ...common, httpOnly: true, path: '/api/auth', maxAge: cfg.refreshMs });
  res.cookie(CSRF, values.csrf, { ...common, httpOnly: false, path: '/', maxAge: cfg.refreshMs });
}
function clearCookies(res, cfg) {
  for (const [name, path] of [[ACCESS, '/api'], [REFRESH, '/api/auth'], [CSRF, '/']]) {
    res.clearCookie(name, { path, httpOnly: name !== CSRF, secure: cfg.secure, sameSite: 'lax' });
  }
}
function sameOrigin(req, cfg) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  // Non-browser API clients need the session-bound CSRF token for protected writes too.
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (cfg.origins.length) return cfg.origins.includes(parsed.origin);
    const hosts = [req.headers.host, req.headers['x-forwarded-host']].filter(Boolean);
    return hosts.includes(parsed.host);
  } catch { return false; }
}
module.exports = { ACCESS, REFRESH, CSRF, random, hash, equal, cookies, config, otpHash, setCookies, clearCookies, sameOrigin };
