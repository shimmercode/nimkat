import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = '/tmp/nimkat-independent-audit/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function loginViaRealBrowserUI(page, mobile: string) {
  await page.goto('/login');
  await page.getByLabel('شماره موبایل', { exact: true }).fill(mobile);
  const otpResponsePromise = page.waitForResponse((r) => r.url().includes('/api/auth/otp/request') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'ارسال کد تأیید' }).click();
  const otpResponse = await otpResponsePromise;
  expect(otpResponse.ok()).toBeTruthy();
  const { devCode } = await otpResponse.json();
  expect(devCode).toBeTruthy();

  await page.locator('.otp-boxes input').first().fill(String(devCode));
  await page.getByRole('button', { name: 'تأیید و ورود' }).click();
  await expect(page).toHaveURL(/\/(panel|teacher|admin|parent)/);
}

test.describe('Final QA Gate — Real Chromium 153 Playwright E2E Verification (B1–B7)', () => {
  test('B1 & B2: Real UI Login, Header Wallet Access, Controlled Mock Charge, Ledger Reconciliation, Duplicate Callback Replay & Cancelled Payment', async ({ page }) => {
    const pageErrors: string[] = [];
    const failedApiRequests: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('response', (res) => {
      if (res.url().includes('/api/') && res.status() >= 500) {
        failedApiRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.setViewportSize({ width: 1440, height: 1000 });
    const mobile = `0935${Date.now().toString().slice(-7)}`;
    await loginViaRealBrowserUI(page, mobile);

    // Navigate to Home and verify header wallet pill is visible & opens quick wallet menu
    await page.goto('/');
    const closePromoBtn = page.getByRole('button', { name: 'بستن پنجره تخفیف ثبت‌نام اول' });
    if (await closePromoBtn.isVisible()) {
      await closePromoBtn.click();
    }

    const walletPill = page.getByTestId('header-wallet-balance');
    await expect(walletPill).toBeVisible();
    await expect(walletPill).toContainText('۰');
    await walletPill.click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b1-header-wallet-dropdown.png') });

    await page.getByRole('link', { name: '+ افزایش موجودی (شارژ کیف پول)' }).click();
    await expect(page).toHaveURL(/\/panel\/finance/);

    // Check initial wallet balance via API from browser session
    const wInitial = await page.evaluate(async () => (await fetch('/api/wallet')).json());
    expect(wInitial.balance).toBe(0);

    // B2: Charge 2,500,000 Toman (25,000,000 Rial) via UI
    await page.locator('#wallet-charge input[name="amount"]').fill('2500000');
    await page.getByRole('button', { name: 'انتقال به درگاه' }).click();
    await expect(page).toHaveURL(/\/payment\/result\?id=/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b2-payment-result-pending.png') });

    // Confirm payment via controlled Mock callback button in UI
    await page.getByRole('button', { name: /تأیید تراکنش آزمایشی و ثبت در دفتر کل/ }).click();
    await expect(page.getByRole('button', { name: /ارسال مجدد Callback/ })).toBeVisible();

    // Verify balance after payment
    const wAfter = await page.evaluate(async () => (await fetch('/api/wallet')).json());
    expect(wAfter.balance).toBe(2500000);
    expect(wAfter.balanceRial).toBe(25000000);

    // Replay callback via UI button and verify idempotency (balance must remain 2,500,000)
    await page.getByRole('button', { name: /ارسال مجدد Callback/ }).click();
    const wAfterReplay = await page.evaluate(async () => (await fetch('/api/wallet')).json());
    expect(wAfterReplay.balance).toBe(2500000);

    // Forged callback / invalid payment intent ID must be rejected (404) without changing balance
    const forgedStatus = await page.evaluate(async () => {
      const r = await fetch('/api/payments/callback/00000000-0000-0000-0000-000000000000?Status=OK&Authority=FORGED&format=json');
      return r.status;
    });
    expect(forgedStatus).toBe(404);
    const wAfterForged = await page.evaluate(async () => (await fetch('/api/wallet')).json());
    expect(wAfterForged.balance).toBe(2500000);

    // Verify transaction history in /panel/finance#wallet-history and persistence across reload
    await page.goto('/panel/finance');
    await expect(page.locator('#wallet-history')).toContainText('۲٬۵۰۰٬۰۰۰');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b2-wallet-charged-history.png') });
    await page.reload();
    await expect(page.locator('#wallet-history')).toContainText('۲٬۵۰۰٬۰۰۰');

    // Test cancelled payment (Status=NOK) from UI and verify balance does not increase
    await page.locator('#wallet-charge input[name="amount"]').fill('100000');
    await page.getByRole('button', { name: 'انتقال به درگاه' }).click();
    await expect(page).toHaveURL(/\/payment\/result\?id=/);
    await page.getByRole('button', { name: /لغو پرداخت توسط کاربر/ }).click();
    const wAfterCancel = await page.evaluate(async () => (await fetch('/api/wallet')).json());
    expect(wAfterCancel.balance).toBe(2500000);

    expect(pageErrors).toEqual([]);
    expect(failedApiRequests).toEqual([]);
  });

  test('B3 & B4: Single-Session (/classes/1) & Multi-Session (/classes/6) Booking via Real Browser UI, Calendar Verification & Refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const mobile = `0936${Date.now().toString().slice(-7)}`;
    await loginViaRealBrowserUI(page, mobile);

    // Fund wallet via UI
    await page.goto('/panel/finance');
    await page.locator('#wallet-charge input[name="amount"]').fill('3000000');
    await page.getByRole('button', { name: 'انتقال به درگاه' }).click();
    await page.getByRole('button', { name: /تأیید تراکنش آزمایشی و ثبت در دفتر کل/ }).click();
    await expect(page.getByRole('button', { name: /ارسال مجدد Callback/ })).toBeVisible();

    // Check promo eligibility BEFORE first booking
    const promoBefore = await page.evaluate(async () => (await fetch('/api/promotions/home')).json());
    expect(promoBefore.firstRegistrationDiscount.code).toBe('MEHR05');
    expect(promoBefore.firstRegistrationDiscount.eligibleForFirstRegistration).toBe(true);

    // B3: Single-session booking on /classes/1
    await page.goto('/classes/1');
    const picker1 = page.locator('fieldset.schedule-picker').first();
    await expect(picker1).toContainText('انتخاب زمان جلسات');
    await page.getByRole('button', { name: /۱ جلسه/ }).first().click();
    await expect(page.getByText('کلاسی برای رزرو انتخاب نشده')).toHaveCount(0);

    // Wait until schedule checkboxes load inside first schedule-picker
    await expect(picker1.locator('input[type="checkbox"]').first()).toBeVisible();

    // Select wallet payment method and submit booking in UI
    await page.getByRole('button', { name: 'کیف پول', exact: true }).click();
    const bookResPromise = page.waitForResponse((r) => r.url().includes('/api/bookings') && r.request().method() === 'POST');
    await page.getByTestId('pay-btn').click();
    const bookRes = await bookResPromise;
    expect(bookRes.status()).toBe(200);
    const bookData = await bookRes.json();
    expect(bookData.status).toBe('confirmed');
    expect(bookData.sessions).toBe(1);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b3-single-session-booked.png') });

    // Check promo eligibility AFTER first booking (must be false on server!)
    const promoAfter = await page.evaluate(async () => (await fetch('/api/promotions/home')).json());
    expect(promoAfter.firstRegistrationDiscount.eligibleForFirstRegistration).toBe(false);

    // Refresh /classes/1 and verify schedule & state remain consistent
    await page.reload();
    await expect(page.locator('fieldset.schedule-picker').first()).toContainText('انتخاب زمان جلسات');

    // B4: Multi-session booking (4 sessions) on /classes/6
    await page.goto('/classes/6');
    const picker6 = page.locator('fieldset.schedule-picker').first();
    await expect(picker6).toContainText('انتخاب زمان جلسات');
    await expect(picker6.locator('input[type="checkbox"]').first()).toBeVisible();
    await page.getByRole('button', { name: /۴ جلسه/ }).first().click();

    // Uncheck first occurrence if it overlaps with class 1's first occurrence and pick 4 non-overlapping ones
    const checkboxes = picker6.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    expect(cbCount).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < cbCount; i++) {
      if (await checkboxes.nth(i).isChecked()) {
        await checkboxes.nth(i).uncheck();
      }
    }
    for (let i = 1; i <= 4; i++) {
      await checkboxes.nth(i).check();
    }

    await page.getByRole('button', { name: 'کیف پول', exact: true }).click();
    const multiBookPromise = page.waitForResponse((r) => r.url().includes('/api/bookings') && r.request().method() === 'POST');
    await page.getByTestId('pay-btn').click();
    const multiBookRes = await multiBookPromise;
    expect(multiBookRes.status()).toBe(200);
    const multiBookData = await multiBookRes.json();
    expect(multiBookData.status).toBe('confirmed');
    expect(multiBookData.sessions).toBe(4);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b4-multi-session-booked.png') });

    // Verify student calendar UI (/panel/calendar) displays booked sessions & survives reload
    await page.goto('/panel/calendar');
    await expect(page.getByRole('heading', { name: 'تقویم و کلاس‌های من' })).toBeVisible();
    await expect(page.locator('body')).toContainText('حل تمرین فیزیک یازدهم');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b3-b4-student-calendar.png') });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'تقویم و کلاس‌های من' })).toBeVisible();
    await expect(page.locator('body')).toContainText('حل تمرین فیزیک یازدهم');
  });

  test('B5, B6 & B7: Live Search Combobox, Level Suggestion Persistence, Home-Only MEHR05 Modal, RTL & Mobile/Reduced-Motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 1000 });

    // B6: Fresh guest visit to / displays FirstRegistrationPromoModal with MEHR05
    await page.goto('/');
    const promoModal = page.locator('[data-testid="first-registration-promo-modal"]');
    await expect(promoModal).toBeVisible();
    await expect(promoModal).toContainText('MEHR05');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b6-home-promo-modal.png') });

    // Close modal and verify it does NOT reopen after reload
    await page.getByRole('button', { name: 'بستن پنجره تخفیف ثبت‌نام اول' }).click();
    await expect(promoModal).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-testid="first-registration-promo-modal"]')).toHaveCount(0);

    // B5: Click search button in header — must NOT redirect to /classes, instead opens header live search combobox
    await page.locator('.site-header').getByRole('button', { name: 'جستجو' }).click();
    await expect(page).toHaveURL(/\/$/);
    const headerSearch = page.locator('.site-header [role="combobox"]').first();
    await expect(headerSearch).toBeVisible();

    // Type Arabic/Persian query and verify live suggestions listbox opens
    await headerSearch.fill('فيزيك يازدهم');
    const listbox = page.locator('.site-header [role="listbox"]').first();
    await expect(listbox).toBeVisible();
    await expect(listbox).toContainText('فیزیک یازدهم');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b5-live-search-suggestions.png') });

    // Keyboard navigation + selecting a suggestion from the live listbox
    await headerSearch.press('ArrowDown');
    const firstClassOption = listbox.locator('.nk-live-search__item').first();
    await expect(firstClassOption).toBeVisible();
    await firstClassOption.click();
    await expect(page).toHaveURL(/\/classes\/(1|5)/);

    // Navigate to /classes?kind=گروهی and verify promo modal does NOT appear on internal routes AND 'مناسب سطح شما' persists across filter changes and reload
    await page.goto('/classes?kind=گروهی');
    await expect(page.locator('[data-testid="first-registration-promo-modal"]')).toHaveCount(0);
    await expect(page.getByText('مناسب سطح شما').first()).toBeVisible();
    await page.getByRole('combobox', { name: 'مقطع', exact: true }).selectOption('متوسطه دوم');
    await expect(page.getByText('مناسب سطح شما').first()).toBeVisible();
    await page.getByRole('combobox', { name: 'مقطع', exact: true }).selectOption('همه');
    await expect(page.getByText('مناسب سطح شما').first()).toBeVisible();
    await page.reload();
    await expect(page.getByText('مناسب سطح شما').first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b5-classes-group-level-badge.png') });

    // B7: Verify RTL and Mobile viewport (375x812 and 320x640) without horizontal overflow
    for (const vp of [{ width: 375, height: 812 }, { width: 320, height: 640 }]) {
      await page.setViewportSize(vp);
      await page.goto('/');
      const dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.documentElement).direction);
      expect(dir).toBe('rtl');
      const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      expect(noHorizontalOverflow).toBe(true);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b7-mobile-rtl-home.png') });
  });
});
