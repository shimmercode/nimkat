# گزارش نهایی رگرسیون و یکپارچگی (`FINAL_REGRESSION_REPORT.md`)

- **پروژه:** پلتفرم آموزشی نیمکت (`Nimkat — Final Evidence Reconciliation & Payment Sign-off`)
- **تاریخ اجرای مجدد تازه:** `2026-10-27` (`13:57:00Z` تا `14:00:30Z` — `Asia/Tehran`)
- **محیط اجرای ایزوله:** `/tmp/nimkat-independent-audit/extracted/nimkat`
- **وضعیت کلی مرحلهٔ C (رگرسیون و یکپارچگی):** **`PASS`**

---

## ۱. جدول خلاصهٔ اجرای واقعی دستورات در این نوبت (Stage C)

تمامی دستورات زیر در این نوبت مجدداً در محیط ایزوله اجرا شدند و هیچ نتیجه‌ای بدون اجرای تازه از گزارش قبلی کپی نشده است:

| ردیف | آزمون / بررسی | دستور دقیق اجرا‌شده | تعداد موفق / کل | زمان اجرا | کد خروج | وضعیت |
|---|---|---|---|---|---|---|
| **۱** | **تست‌های بک‌اند (`Backend Tests`)** | `cd /tmp/nimkat-independent-audit/extracted/nimkat/backend && npm test` | **`121 / 121` (`0 fail`)** | `8,780 ms` (`8.78s`) | `0` | **`PASS`** |
| **۲** | **تست‌های واحد فرانت‌اند (`Frontend Vitest`)** | `cd /tmp/nimkat-independent-audit/extracted/nimkat/frontend && npx vitest run` | **`39 / 39` در `8 / 8` فایل (`0 fail`)** | `2,170 ms` (`2.17s`) | `0` | **`PASS`** |
| **۳** | **بررسی TypeScript (`TypeScript Typecheck`)** | `cd /tmp/nimkat-independent-audit/extracted/nimkat/frontend && npm run typecheck` | بدون خطای تایپ (`tsc --noEmit`) | `662 ms` (`0.66s`) | `0` | **`PASS`** |
| **۴** | **بیلد تولیدی (`Production Build`)** | `cd /tmp/nimkat-independent-audit/extracted/nimkat/frontend && npm run build` | **`58 / 58` مسیر (`47` استاتیک)** | `20,204 ms` (`20.20s`) | `0` | **`PASS`** |
| **۵** | **تست‌های مرورگر واقعی (`Playwright E2E`)** | `CI=1 NIMKAT_DATA_DIR=/tmp/nimkat-independent-audit/db-pw-ci COOKIE_SAME_SITE=none COOKIE_SECURE=true COOKIE_PARTITIONED=true CHROMIUM_EXECUTABLE_PATH=/tmp/chromium-wrapper npx playwright test tests/e2e/final-qa-gate.spec.ts tests/e2e/login-search-regression.spec.ts --reporter=list` | **`15 / 15` (`3/3` + `12/12`, `0 fail`)** | `22,200 ms` (`22.2s`) | `0` | **`PASS`** |

---

## ۲. خروجی‌های واقعی ثبت‌شده برای هر دستور

### ۲.۱. خروجی واقعی Backend Tests (`npm test`)
```text
ok 118 - club customization delivers a brand-only private profile frame and expires without refunding spent coins
  ---
  duration_ms: 44.204407
  type: 'test'
  ...
1..118
# tests 121
# suites 0
# pass 121
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8780.022661
BACKEND_EXIT_CODE=0
```

### ۲.۲. خروجی واقعی Frontend Vitest (`npx vitest run`)
```text
 RUN  v5.0.5 /tmp/nimkat-independent-audit/extracted/nimkat/frontend

 ✓ tests/unit/api-session.test.ts (5 tests) 92ms
 ✓ tests/unit/motion-and-polish.test.ts (8 tests) 42ms
 ✓ tests/unit/booking-wallet-search-ux.test.ts (4 tests) 12ms
 ✓ tests/unit/product-recovery.test.ts (6 tests) 10ms
 ✓ tests/unit/page-content.test.ts (8 tests) 9ms
 ✓ tests/unit/persian-calendar.test.ts (4 tests) 9ms
 ✓ tests/unit/editor-markup.test.ts (2 tests) 3ms
 ✓ tests/unit/login-input.test.ts (2 tests) 3ms

 Test Files  8 passed (8)
      Tests  39 passed (39)
   Start at  13:58:45
   Duration  2.17s (import 74%, tests 13%, transform 11%, worker 2%)
VITEST_EXIT_CODE=0
```

### ۲.۳. خروجی واقعی TypeScript Typecheck (`npm run typecheck`)
```text
> nimkat-frontend@0.1.0 typecheck
> tsc --noEmit

TSC_DURATION_MS=662 | TSC_EXIT_CODE=0
```

### ۲.۴. خروجی واقعی Production Build (`npm run build`)
```text
> nimkat-frontend@0.1.0 build
> next build --webpack

▲ Next.js 16.4.2 (webpack)
✓ Running next.config.ts took 128ms
  Creating an optimized production build ...
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Finished TypeScript in 473ms ...
  Collecting page data using 1 worker ...
✓ Generating static pages using 1 worker (47/47) in 1098ms
  Finalizing page optimization ...
  Collecting build traces ...
BUILD_DURATION_MS=20204 | BUILD_EXIT_CODE=0
```

### ۲.۵. خروجی واقعی Playwright E2E در Chromium 153 (`15 passed`)
```text
Running 15 tests using 1 worker

  ✓   1 tests/e2e/final-qa-gate.spec.ts:24:3 › Final QA Gate — Real Chromium 153 Playwright E2E Verification (B1–B7) › B1 & B2: Real UI Login, Header Wallet Access, Controlled Mock Charge, Ledger Reconciliation, Duplicate Callback Replay & Cancelled Payment (3.0s)
  ✓   2 tests/e2e/final-qa-gate.spec.ts:108:3 › Final QA Gate — Real Chromium 153 Playwright E2E Verification (B1–B7) › B3 & B4: Single-Session (/classes/1) & Multi-Session (/classes/6) Booking via Real Browser UI, Calendar Verification & Refresh (4.1s)
  ✓   3 tests/e2e/final-qa-gate.spec.ts:194:3 › Final QA Gate — Real Chromium 153 Playwright E2E Verification (B1–B7) › B5, B6 & B7: Live Search Combobox, Level Suggestion Persistence, Home-Only MEHR05 Modal, RTL & Mobile/Reduced-Motion (2.7s)
  ✓   4 tests/e2e/login-search-regression.spec.ts:3:1 › late anonymous bootstrap cannot undo a completed OTP login (822ms)
  ✓   5 tests/e2e/login-search-regression.spec.ts:23:44 › hero fields work and inherit Yekan at 320 (851ms)
  ✓   6 tests/e2e/login-search-regression.spec.ts:23:44 › hero fields work and inherit Yekan at 375 (767ms)
  ✓   7 tests/e2e/login-search-regression.spec.ts:23:44 › hero fields work and inherit Yekan at 768 (928ms)
  ✓   8 tests/e2e/login-search-regression.spec.ts:23:44 › hero fields work and inherit Yekan at 1024 (1.1s)
  ✓   9 tests/e2e/login-search-regression.spec.ts:23:44 › hero fields work and inherit Yekan at 1440 (1.2s)
  ✓  10 tests/e2e/login-search-regression.spec.ts:39:1 › OTP session survives reload inside a cross-site preview iframe (1.0s)
  ✓  11 tests/e2e/login-search-regression.spec.ts:54:1 › blocked cookies give a clear error instead of an endless panel/login bounce (479ms)
  ✓  12 tests/e2e/login-search-regression.spec.ts:60:1 › SMS autofill accepts the full Arabic code and international phone number, then persists a real panel session (881ms)
  ✓  13 tests/e2e/login-search-regression.spec.ts:63:1 › delayed refresh cookie clearing finishes before OTP creates the new session (786ms)
  ✓  14 tests/e2e/login-search-regression.spec.ts:69:1 › PWA offline screen never substitutes cached personal data or a successful payment (882ms)
  ✓  15 tests/e2e/login-search-regression.spec.ts:73:1 › initial OTP focus never jumps back during rapid keyboard entry (751ms)

  15 passed (22.2s)
PLAYWRIGHT_EXIT_CODE=0
```

---

## ۳. مقایسهٔ یکپارچگی قبل و بعد از اجرا (ZIP اصلی، دیتابیس اصلی و وضعیت Git)

| مورد بررسی | وضعیت قبل از اجرا (`13:57:00Z`) | وضعیت بعد از اجرا (`14:00:30Z`) | نتیجهٔ تطبیق |
|---|---|---|---|
| **SHA-256 فایل `/home/user/nimkat/nimkat-booking-wallet-final.zip`** | `b0c259b29b98ce7d16a435b150d6a5f8df1097684f999ae09d7e1ea5f31c8d2f` | `b0c259b29b98ce7d16a435b150d6a5f8df1097684f999ae09d7e1ea5f31c8d2f` | **کاملاً یکسان (`PASS`)** |
| **اندازه و زمان تغییر فایل ZIP اصلی** | `5938420 bytes \| mtime=2026-10-27 13:06:55.831004279 +0000` | `5938420 bytes \| mtime=2026-10-27 13:06:55.831004279 +0000` | **کاملاً یکسان (`PASS`)** |
| **دیتابیس اصلی در `/home/user/nimkat/backend/data`** | `No such file or directory` (هیچ دیتابیس اجرایی در مخزن اصلی ساخته نشده؛ تمام تست‌ها در `/tmp` اجرا شدند) | `No such file or directory` | **بدون تغییر (`PASS`)** |
| **کامیت `HEAD` و شاخهٔ Git** | شاخهٔ `arena/4f156d38-nimkat`، کامیت `f19f5e188a14fb0715e33359dd94f52adf2f92dc` | شاخهٔ `arena/4f156d38-nimkat`، کامیت `f19f5e188a14fb0715e33359dd94f52adf2f92dc` | **بدون تغییر (`PASS`)** |
| **مقایسهٔ `git status --short --branch`** | `89` خط (`/tmp/nimkat-git-status-before.txt`) | `diff -u` خروجی خالی (`GIT_STATUS_UNCHANGED=true`) | **بدون تغییر (`PASS`)** |
