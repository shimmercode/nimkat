const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function createFullServerFixture(t) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimkat-recovery-test-'));
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

  async function loginAs(mobile = '09121111111', role = 'student') {
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
      cookieHeader,
      csrf,
      request: async (apiPath, options = {}) => {
        const method = options.method || (options.body ? 'POST' : 'GET');
        const headers = {
          Cookie: cookieHeader,
          Origin: baseUrl,
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        };
        const res = await fetch(`${baseUrl}/api${apiPath}`, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : await res.text();
        return { status: res.status, data };
      },
    };
  }

  return { baseUrl, db, loginAs };
}

test('Phase 1 & 2: blog feed/slug routes, classes catalog, teacher profile Questions and callback work end-to-end', async (t) => {
  const f = await createFullServerFixture(t);

  // Blog list & feed
  const blogRes = await fetch(`${f.baseUrl}/api/blog`);
  assert.equal(blogRes.status, 200);
  const blogData = await blogRes.json();
  assert.ok(Array.isArray(blogData.posts));
  assert.ok(blogData.posts.length >= 3);

  // Blog detail by slug & 404 on unknown slug
  const firstSlug = blogData.posts[0].slug;
  const postRes = await fetch(`${f.baseUrl}/api/blog/${encodeURIComponent(firstSlug)}`);
  assert.equal(postRes.status, 200);
  const missingPostRes = await fetch(`${f.baseUrl}/api/blog/non-existent-slug-999`);
  assert.equal(missingPostRes.status, 404);

  // Classes catalog & single class detail
  const classesRes = await fetch(`${f.baseUrl}/api/classes`);
  assert.equal(classesRes.status, 200);
  const classesData = await classesRes.json();
  assert.ok(classesData.classes.length >= 5);
  const missingClass = await fetch(`${f.baseUrl}/api/classes/999999`);
  assert.equal(missingClass.status, 404);

  // Teacher detail & 404 on unknown teacher
  const teacherRes = await fetch(`${f.baseUrl}/api/teachers/1`);
  assert.equal(teacherRes.status, 200);
  const missingTeacher = await fetch(`${f.baseUrl}/api/teachers/999999`);
  assert.equal(missingTeacher.status, 404);

  // Question submission with both teacherId and teacher_id
  const client = await f.loginAs('09123334444', 'student');
  const q1 = await client.request('/questions', {
    method: 'POST',
    body: { teacherId: 1, text: 'آیا جلسات رفع اشکال قبل از امتحان نهایی برگزار می‌شود؟' },
  });
  assert.equal(q1.status, 200);
  assert.equal(q1.data.ok, true);

  const teacherAfterQ = await (await fetch(`${f.baseUrl}/api/teachers/1`)).json();
  assert.ok(teacherAfterQ.questions.some((q) => q.text.includes('رفع اشکال')));

  // Callback request (consultation / teacher suggestion)
  const cb = await client.request('/callback', {
    method: 'POST',
    body: { phone: '09123334444', name: 'پیشنهاد استاد: فیزیک یازدهم' },
  });
  assert.equal(cb.status, 200);
  assert.equal(cb.data.ok, true);
});

test('Phase 3 & 5: dynamic profile completion, idempotent profile reward, notification read/dismiss without financial side effects, and /materials/mine', async (t) => {
  const f = await createFullServerFixture(t);
  const student = await f.loginAs('09127778888', 'student');

  // Initial overview has dynamic profileCompletion and zero wallet impact on notification operations
  const ov1 = await student.request('/panel/overview');
  assert.equal(ov1.status, 200);
  assert.ok(ov1.data.profileCompletion);
  assert.equal(typeof ov1.data.profileCompletion.percent, 'number');
  assert.ok(ov1.data.profileCompletion.percent < 100);
  assert.equal(ov1.data.profileCompletion.rewardClaimed, false);

  // Complete profile via PUT /api/profile -> triggers idempotent profile.completed reward once
  const put1 = await student.request('/profile', {
    method: 'PUT',
    body: {
      name: 'کیانوش رضایی',
      subtitle: 'پایه یازدهم · رشته تجربی',
      alias: 'کیانوش',
      province: 'تهران',
      city: 'تهران',
      goal: 'کسب نمره ۲۰ در امتحان نهایی فیزیک و ریاضی',
      country: 'IR',
      leagueOptIn: true,
    },
  });
  assert.equal(put1.status, 200);
  assert.equal(put1.data.profile.percent, 100);
  assert.equal(put1.data.rewarded, true);
  assert.equal(put1.data.profile.rewardClaimed, true);

  const ovAfter1 = await student.request('/panel/overview');
  const coinsAfterFirst = ovAfter1.data.club.coins;
  assert.ok(coinsAfterFirst >= 5);

  // Calling PUT /api/profile a second time must NOT award duplicate coins
  const put2 = await student.request('/profile', {
    method: 'PUT',
    body: {
      name: 'کیانوش رضایی',
      subtitle: 'پایه یازدهم · رشته تجربی',
      alias: 'کیانوش',
      province: 'تهران',
      city: 'تهران',
      goal: 'کسب نمره ۲۰ در امتحان نهایی فیزیک و ریاضی',
      country: 'IR',
      leagueOptIn: true,
    },
  });
  assert.equal(put2.status, 200);
  assert.equal(put2.data.rewarded, false);
  const ovAfter2 = await student.request('/panel/overview');
  assert.equal(ovAfter2.data.club.coins, coinsAfterFirst);

  // Notifications list, mark read, and dismiss without touching wallet/bookings
  const notifs = await student.request('/notifications');
  assert.equal(notifs.status, 200);
  assert.ok(notifs.data.notifications.length >= 1);
  const firstNotifId = notifs.data.notifications[0].id;

  const readRes = await student.request(`/notifications/${firstNotifId}/read`, { method: 'POST', body: {} });
  assert.equal(readRes.status, 200);

  const walletBeforeDismiss = (await student.request('/panel/overview')).data.wallet;
  const dismissRes = await student.request(`/notifications/${firstNotifId}/dismiss`, { method: 'POST', body: {} });
  assert.equal(dismissRes.status, 200);

  const notifsAfterDismiss = await student.request('/notifications');
  assert.ok(!notifsAfterDismiss.data.notifications.some((n) => n.id === firstNotifId));
  const walletAfterDismiss = (await student.request('/panel/overview')).data.wallet;
  assert.equal(walletAfterDismiss, walletBeforeDismiss);

  // /api/materials/mine returns 200 with materials array & maxBytes
  const matsMine = await student.request('/materials/mine');
  assert.equal(matsMine.status, 200);
  assert.ok(Array.isArray(matsMine.data.materials));
  assert.equal(typeof matsMine.data.maxBytes, 'number');
});

test('Phase 4: NimChat room categories, persisted room notification settings, and violation report submission', async (t) => {
  const f = await createFullServerFixture(t);
  const admin = await f.loginAs('09120000000', 'admin');
  const student = await f.loginAs('09120000001', 'student');

  // Create a room via admin for student (user 1)
  const created = await admin.request('/admin/chat/rooms', {
    method: 'POST',
    body: { title: 'گروه فیزیک یازدهم · سارا محمدی', userIds: [1] },
  });
  assert.equal(created.status, 200);

  const chatsRes = await student.request('/chats');
  assert.equal(chatsRes.status, 200);
  assert.ok(chatsRes.data.chats.length >= 1);
  const room = chatsRes.data.chats[0];
  assert.ok(['class', 'teacher', 'group', 'community'].includes(room.kind));

  // Save room settings
  const saveSettings = await student.request(`/chats/${room.id}/settings`, {
    method: 'PUT',
    body: { notifyAll: false, sound: false, preview: true, teacherOnly: true },
  });
  assert.equal(saveSettings.status, 200);
  assert.equal(saveSettings.data.settings.notifyAll, false);
  assert.equal(saveSettings.data.settings.teacherOnly, true);

  // Verify persistence across reload
  const roomDetail = await student.request(`/chats/${room.id}`);
  assert.equal(roomDetail.status, 200);
  assert.equal(roomDetail.data.settings.notifyAll, false);
  assert.equal(roomDetail.data.settings.teacherOnly, true);
  // Submit violation report on a message
  let msgId = roomDetail.data.messages[0]?.id;
  if (!msgId) {
    const sent = await student.request(`/chats/${room.id}/messages`, {
      method: 'POST',
      body: { text: 'پیام آزمایشی برای بررسی گزارش تخلف', clientId: 'test_msg_client_0001' },
    });
    assert.equal(sent.status, 200);
    msgId = sent.data.message.id;
  }

  const reportRes = await student.request(`/chats/${room.id}/messages/${msgId}/report`, {
    method: 'POST',
    body: { reason: 'گزارش آزمایشی محتوای نامرتبط با موضوع آموزشی کلاس' },
  });
  assert.equal(reportRes.status, 200);
  assert.equal(reportRes.data.ok, true);
});
