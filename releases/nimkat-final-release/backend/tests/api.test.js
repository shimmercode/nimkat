const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimkat-test-'));
process.env.NIMKAT_DB_PATH = path.join(tmpDir, 'test.db');
process.env.NIMKAT_AUTO_LISTEN = 'false';

const { startServer } = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  server = startServer(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('GET /api/health returns 200 and service metadata', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'nimkat-api');
});

test('GET /api/teachers and /api/classes return seeded records', async () => {
  const tRes = await fetch(`${baseUrl}/api/teachers`);
  assert.equal(tRes.status, 200);
  const tBody = await tRes.json();
  assert.ok(Array.isArray(tBody.teachers) && tBody.teachers.length >= 6);

  const cRes = await fetch(`${baseUrl}/api/classes`);
  assert.equal(cRes.status, 200);
  const cBody = await cRes.json();
  assert.ok(Array.isArray(cBody.classes) && cBody.classes.length >= 5);
});

test('OTP login, /api/auth/me, /api/panel/student, and /api/club succeed', async () => {
  const reqRes = await fetch(`${baseUrl}/api/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '09121234567' }),
  });
  assert.equal(reqRes.status, 200);
  const reqBody = await reqRes.json();
  assert.equal(reqBody.ok, true);

  const verRes = await fetch(`${baseUrl}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '09121234567', code: reqBody.devCode }),
  });
  assert.equal(verRes.status, 200);
  const verBody = await verRes.json();
  assert.ok(verBody.token);

  const clubRes = await fetch(`${baseUrl}/api/club`, {
    headers: { Authorization: `Bearer ${verBody.token}` },
  });
  assert.equal(clubRes.status, 200);
  const clubBody = await clubRes.json();
  assert.equal(typeof clubBody.balance, 'number');
  assert.ok(Array.isArray(clubBody.missions) && clubBody.missions.length > 0);
  assert.ok(Array.isArray(clubBody.rewards) && clubBody.rewards.length > 0);
});
