import { test, expect } from '@playwright/test';

// Run against a development/test database, never production.
const cases = [
  { slug: 'classes', href: '/classes', key: 'title', text: 'جستجوی قابل ویرایش نیمکت' },
  { slug: 'teacher-profile', href: '/teachers/1', key: 'aboutTitle', text: 'معرفی قابل ویرایش استاد' },
  { slug: 'class-detail', href: '/classes/5', key: 'descriptionTitle', text: 'توضیحات قابل ویرایش کلاس' },
  { slug: 'club', href: '/club', key: 'title', text: 'باشگاه قابل ویرایش نیمکت' },
];
let sessionCookies: Awaited<ReturnType<import('@playwright/test').APIRequestContext['storageState']>>['cookies'];
let authHeaders: Record<string, string>;
const originals = new Map<string, any>();

test.beforeAll(async ({ request }) => {
  const otp = await (await request.post('/api/auth/otp/request', { data: { mobile: '09120000000' } })).json();
  if (!otp.devCode) throw new Error('E2E tests require development OTP mode.');
  const login = await (await request.post('/api/auth/otp/verify', { data: { mobile: '09120000000', code: otp.devCode } })).json();
  expect(login.token).toBeUndefined();
  sessionCookies = (await request.storageState()).cookies;
  authHeaders = {
    Cookie: sessionCookies.map((c) => `${c.name}=${c.value}`).join('; '),
    'X-CSRF-Token': sessionCookies.find((c) => c.name === 'nk_csrf')!.value,
  };
  for (const row of cases) {
    const res = await request.get(`/api/pages/${row.slug}?preview=1`, { headers: authHeaders });
    originals.set(row.slug, (await res.json()).page);
  }
});
test.afterAll(async ({ request }) => {
  // Restore content/status of existing pages. Test-created drafts remain unpublished.
  for (const row of cases) {
    const old = originals.get(row.slug);
    const headers = authHeaders;
    if (old) await request.put(`/api/pages/${row.slug}`, { headers, data: { schema: old.schema, title: old.title } });
    await request.post(`/api/pages/${row.slug}/${old?.status === 'published' ? 'publish' : 'unpublish'}`, { headers, data: {} });
  }
});

for (const row of cases) {
  test(`${row.slug}: live edit → draft → publish → SSR and browser`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.context().addCookies(sessionCookies);
    await page.goto(`/editor/${row.slug}`);
    await expect(page.locator('.layer-row').first()).toBeVisible();
    await page.locator('.layer-row').first().click();
    const fieldLabel: Record<string, string> = {
      title: row.slug === 'club' ? 'عنوان باشگاه' : 'عنوان جستجو',
      aboutTitle: 'عنوان معرفی', descriptionTitle: 'عنوان توضیحات',
    };
    await page.getByLabel(fieldLabel[row.key], { exact: true }).fill(row.text);
    await expect(page.frameLocator('iframe[title="بوم زنده ویرایشگر"]').locator('body')).toContainText(row.text);
    await page.locator('.ed-topbar').getByRole('button', { name: 'ذخیره', exact: true }).click();
    await expect(page.locator('.nimkat-toast').last()).toContainText('ذخیره شد');
    await page.getByRole('button', { name: 'انتشار', exact: true }).click();
    await expect(page.locator('.ed-status')).toContainText('منتشرشده');
    // Server HTML must contain the published text, not only an empty SPA root.
    const response = await request.get(row.href);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(row.text);
    await page.goto(row.href);
    await expect(page.locator('main')).toContainText(row.text);
    expect(errors).toEqual([]);
    if (row.slug === 'class-detail') await expect(page.getByRole('heading', { name: 'رزرو کلاس', exact: true })).toBeVisible();
    if (row.slug === 'classes') {
      await page.getByRole('button', { name: 'حضوری', exact: true }).first().click();
      await expect(page.getByRole('button', { name: 'حضوری', exact: true }).first()).toHaveClass(/is-active/);
    }
  });
}

test('public pages have real SSR content and RTL, without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/teachers/2');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('امیر رضایی');
  await context.close();
});

test('student cannot use the page editor', async ({ page, request }) => {
  const otp = await (await request.post('/api/auth/otp/request', { data: { mobile: '09123334455' } })).json();
  const login = await (await request.post('/api/auth/otp/verify', { data: { mobile: '09123334455', code: otp.devCode } })).json();
  await page.context().addCookies((await request.storageState()).cookies);
  await page.goto('/editor/classes');
  await expect(page.locator('.container[role=alert]')).toContainText('فقط برای مدیر');
  await expect(page.getByRole('button', { name: 'انتشار', exact: true })).toHaveCount(0);
});

test('saving and restoring drafts never leaks changes to the published page', async ({ request }) => {
  const slug = 'e2e-publication';
  const headers = authHeaders;
  const schema = (text: string) => ({ root: { id: 'root', type: 'page', props: {}, style: {}, children: [
    { id: 'heading', type: 'heading', props: { title: text }, style: {}, children: [] },
  ] } });
  try {
    await request.put(`/api/pages/${slug}`, { headers, data: { schema: schema('نسخه زنده'), title: 'عنوان زنده' } });
    await request.post(`/api/pages/${slug}/publish`, { headers, data: {} });
    const versions = (await (await request.get(`/api/pages/${slug}/versions`, { headers })).json()).versions;
    await request.put(`/api/pages/${slug}`, { headers, data: { schema: schema('فقط پیش نویس'), title: 'عنوان پیش نویس' } });
    const live = (await (await request.get(`/api/pages/${slug}`)).json()).page;
    const draft = (await (await request.get(`/api/pages/${slug}?preview=1`, { headers })).json()).page;
    expect(live.title).toBe('عنوان زنده');
    expect(live.schema.root.children[0].props.title).toBe('نسخه زنده');
    expect(draft.schema.root.children[0].props.title).toBe('فقط پیش نویس');
    await request.post(`/api/pages/${slug}/publish`, { headers, data: {} });
    await request.post(`/api/pages/${slug}/versions/${versions[0].id}/restore`, { headers, data: {} });
    const afterRestore = (await (await request.get(`/api/pages/${slug}`)).json()).page;
    expect(afterRestore.schema.root.children[0].props.title).toBe('فقط پیش نویس');
    const malformed = await request.put(`/api/pages/${slug}`, { headers, data: { schema: { root: {} } } });
    expect(malformed.status()).toBe(400);
  } finally {
    await request.post(`/api/pages/${slug}/unpublish`, { headers, data: {} });
  }
});

test('five public pages stay within mobile, tablet and desktop widths', async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/', '/classes', '/teachers/1', '/classes/5', '/club']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scroll, `${path} overflows viewport ${width}`).toBeLessThanOrEqual(width + 1);
    }
  }
});

test('OTP form uses cookies, survives reload and logout revokes the session', async ({ page, request }) => {
  await page.goto('/login?next=/panel');
  await page.getByLabel('شماره موبایل', { exact: true }).fill('۰۹۱۲۵۵۵۰۱۲۳');
  const otpResult = page.waitForResponse((r) => r.url().endsWith('/api/auth/otp/request') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'ارسال کد تأیید', exact: true }).click();
  const otp = await (await otpResult).json();
  expect(otp.devCode).toMatch(/^\d{5}$/);
  const inputs = page.locator('.otp-boxes input');
  for (let i = 0; i < 5; i++) await inputs.nth(i).fill('۰۱۲۳۴۵۶۷۸۹'[Number(otp.devCode[i])]);
  await page.getByRole('button', { name: 'تأیید و ورود', exact: true }).click();
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByRole('button', { name: 'خروج از حساب', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'خروج از حساب', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nimkat_token'))).toBeNull();
  const documentCookie = await page.evaluate(() => document.cookie);
  expect(documentCookie).not.toContain('nk_access=');
  expect(documentCookie).not.toContain('nk_refresh=');
  const session = (await page.context().cookies()).filter((c) => ['nk_access', 'nk_refresh'].includes(c.name));
  expect(session).toHaveLength(2);
  expect(session.every((c) => c.httpOnly)).toBeTruthy();
  const capturedCookie = session.map((c) => `${c.name}=${c.value}`).join('; ');
  await page.getByRole('button', { name: 'خروج از حساب', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  const replay = await request.get('/api/panel/student', { headers: { Cookie: capturedCookie } });
  expect(replay.status()).toBe(401);
});
