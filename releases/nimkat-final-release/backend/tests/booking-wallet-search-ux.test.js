const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function createServerFixture(t) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimkat-bwsu-test-'));
  process.env.NIMKAT_AUTO_LISTEN = 'false';
  process.env.NIMKAT_DATA_DIR = tmpDir;

  delete require.cache[require.resolve('../src/db')];
  delete require.cache[require.resolve('../src/server')];
  const { app, db } = require('../src/server');

  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    try {
      db.close();
    } catch {}
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function loginAs(mobile = '09127771122', role = 'student') {
    const reqOtp = await fetch(`${baseUrl}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: baseUrl },
      body: JSON.stringify({ mobile }),
    });
    assert.equal(reqOtp.status, 200);
    const otpData = await reqOtp.json();
    const verifyRes = await fetch(`${baseUrl}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: baseUrl },
      body: JSON.stringify({ mobile, code: otpData.devCode, role }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();
    const setCookies = verifyRes.headers.getSetCookie ? verifyRes.headers.getSetCookie() : [verifyRes.headers.get('set-cookie')];
    const cookieMap = {};
    for (const raw of setCookies) {
      const pair = String(raw || '').split(';')[0];
      const eq = pair.indexOf('=');
      if (eq > 0) {
        const k = pair.slice(0, eq).trim();
        const v = pair.slice(eq + 1).trim();
        if (v) cookieMap[k] = v;
      }
    }
    const cookieHeader = Object.entries(cookieMap)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    const csrf = cookieMap.nk_csrf ? decodeURIComponent(cookieMap.nk_csrf) : '';
    return {
      user: verifyJson.user,
      cookieHeader,
      csrf,
      request: async (apiPath, options = {}) => {
        const method = options.method || (options.body ? 'POST' : 'GET');
        const headers = {
          Cookie: cookieHeader,
          Origin: baseUrl,
          ...(method !== 'GET' ? { 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        };
        const res = await fetch(`${baseUrl}${apiPath}`, {
          method,
          headers,
          redirect: 'manual',
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        let data = null;
        try {
          data = await res.json();
        } catch {}
        return { status: res.status, data, headers: res.headers };
      },
    };
  }

  return { baseUrl, db, loginAs };
}

test('0.4 & Phase 2.2: Complete 10-step Wallet Charge Proof (Mock gateway, ledger reconciliation, idempotency, invalid amounts, unauth, user isolation)', async (t) => {
  const { baseUrl, db, loginAs } = await createServerFixture(t);
  const studentA = await loginAs('09127771122', 'student');
  const studentB = await loginAs('09127771123', 'student');

  // Unauthenticated request rejected with 401
  const unauthRes = await fetch(`${baseUrl}/api/wallet/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ amount: 100000, idempotencyKey: 'unauth-wallet-charge-key-1' }),
  });
  assert.equal(unauthRes.status, 401);

  // Step 1: Record initial balance (0)
  const w0 = await studentA.request('/api/wallet');
  assert.equal(w0.status, 200);
  assert.equal(w0.data.balance, 0);

  // Invalid amounts: 0, negative, <1000, >100,000,000, non-numeric
  for (const invalidAmount of [0, -5000, 500, 100000001, 'abc']) {
    const bad = await studentA.request('/api/wallet/charge', {
      method: 'POST',
      body: { amount: invalidAmount, idempotencyKey: `invalid-amt-${String(invalidAmount).padStart(12, '0')}` },
    });
    assert.equal(bad.status, 400);
  }

  // Step 2: Create valid charge request with Persian digits ('۱۵۰٬۰۰۰' = 150,000 Toman = 1,500,000 Rial)
  const chargeRes = await studentA.request('/api/wallet/charge', {
    method: 'POST',
    body: { amount: '۱۵۰٬۰۰۰', idempotencyKey: 'wallet-topup-test-1' },
  });
  assert.equal(chargeRes.status, 200);
  assert.equal(chargeRes.data.payment.amount, 150000);
  assert.equal(chargeRes.data.payment.amountRial, 1500000);
  assert.equal(chargeRes.data.payment.status, 'pending');
  assert.ok(chargeRes.data.payment.redirectUrl);
  assert.ok(chargeRes.data.payment.authority);

  // User isolation: Student B cannot view Student A's payment intent
  const crossView = await studentB.request(`/api/payments/${chargeRes.data.payment.id}`);
  assert.equal(crossView.status, 404);

  // Duplicate charge request with same idempotencyKey returns exact same intent
  const chargeRepeat = await studentA.request('/api/wallet/charge', {
    method: 'POST',
    body: { amount: 150000, idempotencyKey: 'wallet-topup-test-1' },
  });
  assert.equal(chargeRepeat.status, 200);
  assert.equal(chargeRepeat.data.payment.id, chargeRes.data.payment.id);

  // Duplicate idempotencyKey with different amount fails with 409
  const chargeConflict = await studentA.request('/api/wallet/charge', {
    method: 'POST',
    body: { amount: 200000, idempotencyKey: 'wallet-topup-test-1' },
  });
  assert.equal(chargeConflict.status, 409);

  // Callback with invalid Authority is rejected with 400 and does NOT credit wallet
  const paymentId = chargeRes.data.payment.id;
  const authority = chargeRes.data.payment.authority;
  const badAuthCb = await studentA.request(
    `/api/payments/callback/${paymentId}?Authority=WRONG_AUTH&Status=OK&format=json`
  );
  assert.equal(badAuthCb.status, 400);
  const wBeforeVerify = await studentA.request('/api/wallet');
  assert.equal(wBeforeVerify.data.balance, 0);

  // Step 3-8: Verify callback (Status=OK) and reconcile DB ledger & wallet balance
  const cb1 = await studentA.request(
    `/api/payments/callback/${paymentId}?Authority=${encodeURIComponent(authority)}&Status=OK&format=json`
  );
  assert.equal(cb1.status, 200);
  assert.equal(cb1.data.payment.status, 'paid');
  assert.equal(cb1.data.walletBalance, 150000);

  // Verify ledger journal & double-entry balance in SQLite
  const journalRow = db.prepare('SELECT * FROM ledger_journals WHERE reference=?').get(`payment:${paymentId}`);
  assert.ok(journalRow);
  const entries = db.prepare('SELECT * FROM ledger_entries WHERE journal_id=?').all(journalRow.id);
  assert.equal(entries.length, 2);
  assert.equal(entries.reduce((s, e) => s + e.amount_rial, 0), 0);

  // Step 9: Replay callback (Idempotency check — balance must stay 150,000)
  const cb2 = await studentA.request(
    `/api/payments/callback/${paymentId}?Authority=${encodeURIComponent(authority)}&Status=OK&format=json`
  );
  assert.equal(cb2.status, 200);
  assert.equal(cb2.data.idempotent, true);
  assert.equal(cb2.data.walletBalance, 150000);

  // Step 10: Failed / cancelled payment scenario (Status=NOK) — balance must remain 150,000
  const cancelCharge = await studentA.request('/api/wallet/charge', {
    method: 'POST',
    body: { amount: 50000, idempotencyKey: 'wallet-topup-cancel-1' },
  });
  assert.equal(cancelCharge.status, 200);
  const cancelCb = await studentA.request(
    `/api/payments/callback/${cancelCharge.data.payment.id}?Authority=${encodeURIComponent(cancelCharge.data.payment.authority)}&Status=NOK&format=json`
  );
  assert.equal(cancelCb.status, 200);
  assert.equal(cancelCb.data.payment.status, 'cancelled');

  const fin = await studentA.request('/api/finance/mine');
  assert.equal(fin.status, 200);
  assert.equal(fin.data.wallet.balance, 150000);
  assert.equal((await studentB.request('/api/wallet')).data.balance, 0);
});

test('0.5 & Phase 3/4/5/8/9: Complete Booking Proof (1-session, multi-session, /classes/1, teacher profile, calendar sync, race/duplicate prevention, promo eligibility)', async (t) => {
  const { db, loginAs } = await createServerFixture(t);
  const student = await loginAs('09127773344', 'student');
  const student2 = await loginAs('09127773345', 'student');
  const teacher1 = await loginAs('09120000002', 'teacher');

  // Before any booking, student is eligible for first-registration discount
  const promoBefore = await student.request('/api/promotions/home');
  assert.equal(promoBefore.status, 200);
  assert.equal(promoBefore.data.firstRegistrationDiscount.code, 'MEHR05');
  assert.equal(promoBefore.data.firstRegistrationDiscount.percent, 5);
  assert.equal(promoBefore.data.firstRegistrationDiscount.eligibleForFirstRegistration, true);

  // Verify all 7 teachers have activeClasses and bookable occurrences
  for (const teacherId of [1, 2, 3, 4, 5, 6, 7]) {
    const tRes = await student.request(`/api/teachers/${teacherId}`);
    assert.equal(tRes.status, 200);
    assert.ok(tRes.data.activeClasses.length > 0, `Teacher ${teacherId} must have activeClasses`);
    const availRes = await student.request(`/api/teachers/${teacherId}/availability`);
    assert.equal(availRes.status, 200);
    assert.ok(availRes.data.occurrences.length > 0, `Teacher ${teacherId} must have bookable occurrences`);
  }

  // Fund both students' wallets
  for (const [idx, s] of [student, student2].entries()) {
    const topup = await s.request('/api/wallet/charge', {
      method: 'POST',
      body: { amount: 5000000, idempotencyKey: `booking-wallet-fund-${idx + 1}` },
    });
    await s.request(
      `/api/payments/callback/${topup.data.payment.id}?Authority=${encodeURIComponent(topup.data.payment.authority)}&Status=OK&format=json`
    );
  }

  // Step 1-4: Single-session booking on /classes/1 with real coupon MEHR05
  const sched1 = await student.request('/api/classes/1/schedule');
  assert.equal(sched1.status, 200);
  assert.ok(sched1.data.occurrences.length >= 8);

  const occ1Id = sched1.data.occurrences[0].id;
  const b1 = await student.request('/api/bookings', {
    method: 'POST',
    body: {
      classId: 1,
      sessions: 1,
      people: 1,
      coupon: 'MEHR05',
      occurrenceIds: [occ1Id],
      method: 'wallet',
      idempotencyKey: 'single-session-class1-booking',
    },
  });
  assert.equal(b1.status, 200);
  assert.equal(b1.data.status, 'confirmed');
  assert.equal(b1.data.sessions, 1);

  // After first confirmed booking, student is no longer eligible for first-registration promo
  const promoAfter = await student.request('/api/promotions/home');
  assert.equal(promoAfter.data.firstRegistrationDiscount.eligibleForFirstRegistration, false);

  // Step 5: Verify booking appears in both student and teacher calendars
  const fromMs = Date.now() - 86400000;
  const toMs = Date.now() + 30 * 86400000;
  const studentCal = await student.request(`/api/calendar?from=${fromMs}&to=${toMs}`);
  assert.equal(studentCal.status, 200);
  assert.ok(studentCal.data.occurrences.some((o) => o.id === occ1Id));

  const teacherCal = await teacher1.request(`/api/calendar?from=${fromMs}&to=${toMs}`);
  assert.equal(teacherCal.status, 200);
  assert.ok(teacherCal.data.occurrences.some((o) => o.id === occ1Id));

  // Step 6: Prevent duplicate booking of the exact same occurrence by the same student
  const dupAttempt = await student.request('/api/bookings', {
    method: 'POST',
    body: {
      classId: 1,
      sessions: 1,
      people: 1,
      occurrenceIds: [occ1Id],
      method: 'wallet',
      idempotencyKey: 'duplicate-occurrence-attempt-1',
    },
  });
  assert.equal(dupAttempt.status, 409);

  // Learner overlap conflict check: booking another class at the exact same time (sched6[0]) is rejected with 409
  const sched6 = await student.request('/api/classes/6/schedule');
  const overlapAttempt = await student.request('/api/bookings', {
    method: 'POST',
    body: {
      classId: 6,
      sessions: 1,
      people: 1,
      occurrenceIds: [sched6.data.occurrences[0].id],
      method: 'wallet',
      idempotencyKey: 'learner-overlap-attempt-1',
    },
  });
  assert.equal(overlapAttempt.status, 409);

  // Multi-session booking (4 non-overlapping sessions) on class 6 succeeds
  const multiOcc = sched6.data.occurrences.slice(1, 5).map((o) => o.id);
  const b4 = await student.request('/api/bookings', {
    method: 'POST',
    body: {
      classId: 6,
      sessions: 4,
      people: 1,
      occurrenceIds: multiOcc,
      method: 'wallet',
      idempotencyKey: 'multi-session-booking-4',
    },
  });
  assert.equal(b4.status, 200);
  assert.equal(b4.data.status, 'confirmed');
  assert.equal(b4.data.sessions, 4);

  // Step 7: Full class (class 2 has capacity=10, taken=10) rejects booking with 409
  const sched2 = db.prepare("SELECT id FROM class_occurrences WHERE class_id=2 AND status='scheduled' LIMIT 1").get();
  if (sched2) {
    const fullAttempt = await student2.request('/api/bookings', {
      method: 'POST',
      body: {
        classId: 2,
        sessions: 1,
        people: 1,
        occurrenceIds: [sched2.id],
        method: 'wallet',
        idempotencyKey: 'full-class-booking-attempt-1',
      },
    });
    assert.equal(fullAttempt.status, 409);
  }

  // Step 8 (NIM-009): Repeat buyer attempting to reuse first-registration coupon MEHR05 is rejected with 409
  const repeatMehr05 = await student.request('/api/bookings', {
    method: 'POST',
    body: {
      classId: 6,
      sessions: 1,
      people: 1,
      coupon: 'MEHR05',
      occurrenceIds: [sched6.data.occurrences[5].id],
      method: 'wallet',
      idempotencyKey: 'repeat-mehr05-booking-attempt',
    },
  });
  assert.equal(repeatMehr05.status, 409);

  // Step 9 (NIM-008): Numeric grade queries (فیزیک ۱۱, فیزیک ١١, فیزیک 11) match word grade (فیزیک یازدهم)
  const qWord = await student.request(`/api/search/suggestions?q=${encodeURIComponent('فیزیک یازدهم')}`);
  const qFaNum = await student.request(`/api/search/suggestions?q=${encodeURIComponent('فیزیک ۱۱')}`);
  const qArNum = await student.request(`/api/search/suggestions?q=${encodeURIComponent('فیزیک ١١')}`);
  const qEnNum = await student.request(`/api/search/suggestions?q=${encodeURIComponent('فیزیک 11')}`);
  assert.ok(qWord.data.classes.length > 0);
  assert.equal(qFaNum.data.classes.length, qWord.data.classes.length);
  assert.equal(qArNum.data.classes.length, qWord.data.classes.length);
  assert.equal(qEnNum.data.classes.length, qWord.data.classes.length);
});
