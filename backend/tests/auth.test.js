const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const express = require('express');
const register = require('../src/modules/auth');
const S = require('../src/modules/auth/security');

async function fixture(t, options = {}) {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, mobile TEXT UNIQUE, name TEXT, role TEXT, subtitle TEXT, letter TEXT);
    CREATE TABLE otp (mobile TEXT PRIMARY KEY, code TEXT, expires_at INTEGER, attempts INTEGER);`);
  let time = 1000000;
  const cfg = { ...S.config({}), ...options.config };
  const app = express(); app.use(express.json());
  const { auth } = register(app, { db, config: cfg, now: () => time, sendOtp: options.sendOtp });
  app.get('/api/private', auth, (req, res) => res.json({ user: req.user }));
  app.post('/api/private', auth, (req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); db.close(); });
  const request = async (path, { method = 'GET', jar = {}, csrf = false, headers = {}, body } = {}) => {
    const response = await fetch(origin + '/api' + path, { method, headers: {
      'Content-Type': 'application/json', Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '),
      ...(csrf ? { 'X-CSRF-Token': jar[S.CSRF] } : {}), ...headers,
    }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = response.headers.getSetCookie();
    const next = { ...jar };
    for (const cookie of set) { const [pair] = cookie.split(';'); const at = pair.indexOf('='); next[pair.slice(0, at)] = pair.slice(at + 1); }
    return { status: response.status, data: await response.json(), cookies: set, jar: next, headers: response.headers };
  };
  const login = async (mobile = '09121112222', role = 'student') => {
    const otp = await request('/auth/otp/request', { method: 'POST', body: { mobile } });
    assert.equal(otp.status, 200);
    return request('/auth/otp/verify', { method: 'POST', body: { mobile, code: otp.data.devCode, role } });
  };
  return { db, cfg, request, login, advance: (ms) => { time += ms; }, origin };
}

test('login uses HttpOnly cookies; token and OTP secrets are not stored plaintext', async (t) => {
  const f = await fixture(t);
  const login = await f.login();
  assert.equal(login.status, 200);
  assert.equal(login.data.token, undefined);
  assert.match(login.cookies.find((c) => c.startsWith('nk_access=')), /HttpOnly/);
  assert.match(login.cookies.find((c) => c.startsWith('nk_refresh=')), /HttpOnly/);
  assert.match(login.cookies[0], /SameSite=Lax/);
  const session = f.db.prepare('SELECT * FROM auth_sessions').get();
  assert.equal(session.access_hash, S.hash(login.jar.nk_access));
  assert.notEqual(session.access_hash, login.jar.nk_access);
  const otp = await f.request('/auth/otp/request', { method: 'POST', body: { mobile: '09123334444' } });
  assert.notEqual(f.db.prepare('SELECT code FROM otp').get().code, otp.data.devCode);
  assert.equal((await f.request('/auth/me', { jar: login.jar })).data.user.role, 'student');
  assert.equal((await f.request('/private', { headers: { Authorization: `Bearer ${login.jar.nk_access}` } })).status, 401);
});

test('OTP is single-use, expires in two minutes and has five attempts', async (t) => {
  const f = await fixture(t); const mobile = '09121112222';
  const otp = await f.request('/auth/otp/request', { method: 'POST', body: { mobile } });
  const wrong = otp.data.devCode === '11111' ? '22222' : '11111';
  for (let i = 0; i < 5; i++) assert.equal((await f.request('/auth/otp/verify', { method: 'POST', body: { mobile, code: wrong } })).status, 400);
  assert.equal((await f.request('/auth/otp/verify', { method: 'POST', body: { mobile, code: otp.data.devCode } })).status, 400);
  f.advance(60001);
  const newer = await f.request('/auth/otp/request', { method: 'POST', body: { mobile } });
  f.advance(120001);
  assert.equal((await f.request('/auth/otp/verify', { method: 'POST', body: { mobile, code: newer.data.devCode } })).status, 400);
  const fresh = await f.request('/auth/otp/request', { method: 'POST', body: { mobile: '09123334444' } });
  const proof = { mobile: '09123334444', code: fresh.data.devCode, role: 'admin' };
  const success = await f.request('/auth/otp/verify', { method: 'POST', body: proof });
  assert.equal(success.data.user.role, 'student', 'request body cannot assign admin role');
  assert.equal((await f.request('/auth/otp/verify', { method: 'POST', body: proof })).status, 400);
});

test('OTP cooldown and persistent mobile limits return Retry-After', async (t) => {
  const f = await fixture(t); const body = { mobile: '09121112222' };
  assert.equal((await f.request('/auth/otp/request', { method: 'POST', body })).status, 200);
  const denied = await f.request('/auth/otp/request', { method: 'POST', body });
  assert.equal(denied.status, 429); assert.ok(Number(denied.headers.get('retry-after')) > 0);
  for (let i = 0; i < 3; i++) { f.advance(60001); await f.request('/auth/otp/request', { method: 'POST', body }); }
  f.advance(60001);
  assert.equal((await f.request('/auth/otp/request', { method: 'POST', body })).status, 429);
  assert.ok(f.db.prepare('SELECT count(*) n FROM auth_limits').get().n > 0);
});

test('CSRF and Origin checks protect writes, refresh and login', async (t) => {
  const f = await fixture(t); const login = await f.login(); const jar = login.jar;
  assert.equal((await f.request('/private', { method: 'POST', jar })).status, 403);
  assert.equal((await f.request('/private', { method: 'POST', jar, csrf: true, headers: { Origin: 'https://attacker.invalid' } })).status, 403);
  assert.equal((await f.request('/private', { method: 'POST', jar, csrf: true, headers: { Origin: f.origin } })).status, 200);
  assert.equal((await f.request('/auth/refresh', { method: 'POST', jar })).status, 403);
  assert.equal((await f.request('/auth/otp/request', { method: 'POST', body: { mobile: '09123334444' }, headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
});

test('refresh rotates credentials; reusing retired refresh revokes its session', async (t) => {
  const f = await fixture(t); const login = await f.login();
  f.advance(f.cfg.accessMs + 1);
  assert.equal((await f.request('/auth/me', { jar: login.jar })).data.code, 'ACCESS_EXPIRED');
  const refreshed = await f.request('/auth/refresh', { method: 'POST', jar: login.jar, csrf: true });
  assert.equal(refreshed.status, 200);
  assert.notEqual(refreshed.jar.nk_refresh, login.jar.nk_refresh);
  assert.equal((await f.request('/private', { jar: refreshed.jar })).status, 200);
  assert.equal((await f.request('/private', { jar: login.jar })).status, 401);
  assert.equal((await f.request('/auth/refresh', { method: 'POST', jar: login.jar, csrf: true })).status, 401);
  assert.equal((await f.request('/private', { jar: refreshed.jar })).status, 401);
});

test('logout revokes server credentials; logout-all revokes every session', async (t) => {
  const f = await fixture(t); const first = await f.login(); const second = await f.login();
  const logout = await f.request('/auth/logout', { method: 'POST', jar: first.jar, csrf: true });
  assert.equal(logout.status, 200); assert.match(logout.cookies[0], /Expires=/);
  assert.equal((await f.request('/private', { jar: first.jar })).status, 401);
  assert.equal((await f.request('/auth/refresh', { method: 'POST', jar: first.jar, csrf: true })).status, 401);
  assert.equal((await f.request('/private', { jar: second.jar })).status, 200);
  const third = await f.login();
  assert.equal((await f.request('/auth/logout-all', { method: 'POST', jar: second.jar, csrf: true })).status, 200);
  assert.equal((await f.request('/private', { jar: third.jar })).status, 401);
});

test('refresh lifetime is absolute, not extended by rotation', async (t) => {
  const f = await fixture(t); const login = await f.login(); f.advance(f.cfg.refreshMs + 1);
  assert.equal((await f.request('/auth/refresh', { method: 'POST', jar: login.jar, csrf: true })).status, 401);
});

test('production fails closed without a strong secret, Secure cookies and SMS provider', async (t) => {
  assert.throws(() => S.config({ NODE_ENV: 'production' }), /NIMKAT_SECRET/);
  assert.throws(() => S.config({ NODE_ENV: 'production', NIMKAT_SECRET: 'x'.repeat(40), COOKIE_SECURE: 'false' }), /Secure/);
  const f = await fixture(t, { config: { production: true, secure: true } });
  const response = await f.request('/auth/otp/request', { method: 'POST', body: { mobile: '09121112222' } });
  assert.equal(response.status, 503); assert.equal(response.data.devCode, undefined);
});

test('production SMS adapter never returns devCode and sets Secure cookies', async (t) => {
  let delivered;
  const f = await fixture(t, { config: { production: true, secure: true }, sendOtp: async (_mobile, code) => { delivered = code; } });
  const otp = await f.request('/auth/otp/request', { method: 'POST', body: { mobile: '09121112222' } });
  assert.equal(otp.status, 200); assert.equal(otp.data.devCode, undefined); assert.match(delivered, /^\d{5}$/);
  const login = await f.request('/auth/otp/verify', { method: 'POST', body: { mobile: '09121112222', code: delivered } });
  assert.equal(login.status, 200); assert.match(login.cookies[0], /Secure/);
});

test('auth migration invalidates old plaintext OTP and is idempotent', () => {
  const db = new Database(':memory:');
  db.exec("CREATE TABLE otp (mobile TEXT PRIMARY KEY, code TEXT, expires_at INTEGER, attempts INTEGER); INSERT INTO otp VALUES ('09121112222','12345',9999999,0)");
  const migrate = require('../src/modules/auth/schema');
  migrate(db); migrate(db);
  assert.equal(db.prepare('SELECT count(*) n FROM otp').get().n, 0);
  assert.ok(db.prepare('PRAGMA table_info(otp)').all().some((c) => c.name === 'requested_at'));
  db.close();
});
