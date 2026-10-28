# فاز ۲ — بازتولید مستقل وضعیت اولیه (`02_BASELINE_TESTS.md`)

- **پروژه:** نیمکت (`Nimkat 1.7.0`)
- **تاریخ اجرا:** `2026-10-27` (`Asia/Tehran`)
- **مسیر اجرای بدون تغییر:** `/tmp/nimkat-1.7.0-audit-work/baseline-extracted/nimkat` (استخراج مستقیم از `/home/user/nimkat/nimkat-complete-final-v1.7.0.zip` پیش از هرگونه تغییر)
- **نسخهٔ ابزارها:**
  - `node -v`: `v22.22.3`
  - `npm -v`: `10.9.4`
  - `Chromium`: `Chromium 153.0.8010.0` (`/tmp/chromium-wrapper`)

---

## ۲.۱. ثبت وضعیت اولیهٔ Git مخزن اصلی (`/home/user/nimkat`)

بدون اجرای هیچ دستور تغییر وضعیت روی Git:
- `git rev-parse HEAD`: `f19f5e188a14fb0715e33359dd94f52adf2f92dc`
- `git status --short --branch`:
  ```text
  ## arena/4f156d38-nimkat...origin/arena/4f156d38-nimkat [behind 1]
  ?? audit-reports/
  ```
- فایل‌های گزارش خام:
  - `/tmp/nimkat-1.7.0-audit-work/logs/git-head-initial.txt`
  - `/tmp/nimkat-1.7.0-audit-work/logs/git-status-initial.txt`

---

## ۲.۲. بررسی اسکریپت‌های رسمی تعریف‌شده در `package.json`

### بک‌اند (`backend/package.json`)
- `dev`: `node --watch src/server.js`
- `start`: `node src/server.js`
- `seed`: `node src/seed.js`
- `test`: `node --test`
- `lint` / `typecheck` / `build`: تعریف نشده (`NOT APPLICABLE`)

### فرانت‌اند (`frontend/package.json`)
- `dev`: `node scripts/dev.mjs`
- `build`: `next build --webpack`
- `start`: `node scripts/start-web.mjs`
- `typecheck`: `tsc --noEmit`
- `test:e2e`: `playwright test`
- `lint`: در `frontend/package.json` تعریف نشده است (تست‌های واحد با `npx vitest run` اجرا می‌شوند).

---

## ۲.۳. جدول خلاصهٔ نتایج اجرای اولیه (Baseline) روی نسخهٔ بدون تغییر ۱.۷.۰

| ردیف | بررسی / مجموعه تست | دستور دقیق اجرا شده | مسیر اجرا | کد خروج (`Exit Code`) | زمان اجرا | نتیجه واقعی | وضعیت مجاز | فایل لاگ کامل |
|---:|---|---|---|---:|---:|---|---|---|
| ۱ | نصب وابستگی‌های فرانت‌اند | `npm ci --no-audit --no-fund` | `.../frontend` | `0` | `13.0s` | `121 packages added` | **`PASS`** | کنسول نصب |
| ۲ | نصب وابستگی‌های بک‌اند (بدون هدر محلی Node) | `npm ci --no-audit --no-fund` | `.../backend` | `1` | `2.1s` | خطای `ECONNRESET` در دانلود هدر از `nodejs.org` توسط `node-gyp` برای `better-sqlite3` | **`FAIL`** | کنسول نصب |
| ۳ | نصب وابستگی‌های بک‌اند (با هدر محلی `/usr/local`) | `npm_config_nodedir=/usr/local npm ci --no-audit --no-fund` | `.../backend` | `0` | `1.0s` | `78 packages added` | **`PASS`** | کنسول نصب |
| ۴ | تست‌های واحد و یکپارچهٔ بک‌اند | `npm test` | `.../backend` | `0` | `6.35s` | `121/121 passed` (`0 failed`) | **`PASS`** | `logs/baseline-backend-test.log` |
| ۵ | تست‌های واحد فرانت‌اند (Vitest) | `npx vitest run` | `.../frontend` | `0` | `2.83s` | `8 test files`, `39/39 passed` (`0 failed`) | **`PASS`** | `logs/baseline-frontend-vitest.log` |
| ۶ | بررسی TypeScript فرانت‌اند | `npm run typecheck` | `.../frontend` | `0` | `0.78s` | `0 errors` | **`PASS`** | `logs/baseline-frontend-typecheck.log` |
| ۷ | بررسی Lint | `npm run lint` | `.../frontend` & `.../backend` | — | — | اسکریپت `lint` در `package.json` تعریف نشده است | **`NOT APPLICABLE`** | — |
| ۸ | Build تولیدی فرانت‌اند (Next.js 16) | `npm run build` | `.../frontend` | `0` | `34.70s` | `58/58 routes compiled` (Static + Dynamic SSR) | **`PASS`** | `logs/baseline-frontend-build.log` |
| ۹ | تست‌های E2E مرورگر — گیت نهایی و رگرسیون ورود/جستجو (۱۵ تست) | `CI=1 COOKIE_SAME_SITE=none COOKIE_SECURE=true COOKIE_PARTITIONED=true CHROMIUM_EXECUTABLE_PATH=/tmp/chromium-wrapper npx playwright test tests/e2e/final-qa-gate.spec.ts tests/e2e/login-search-regression.spec.ts` | `.../frontend` | `0` | `25.70s` | `15/15 passed` در Chromium `153.0.8010.0` | **`PASS`** | `logs/baseline-playwright-15.log` |
| ۱۰ | تست‌های E2E مرورگر — سایر ۱۰ فایل قدیمی‌تر (`39` تست) | `CI=1 CHROMIUM_EXECUTABLE_PATH=/tmp/chromium-wrapper npx playwright test tests/e2e/blog-guest.spec.ts ... tests/e2e/zz-operations.spec.ts` | `.../frontend` | `1` | `202.08s` | `5 passed`, `19 failed`, `15 did not run` (به دلایل ریشه‌ای مستند در بخش ۲.۴) | **`FAIL`** | `logs/baseline-playwright-rest.log` |
| ۱۱ | بررسی بالا آمدن سرورهای محلی (`server.js` + `next start`) | `node src/server.js` (`:8000`) + `npx next start -p 5173` | `.../backend` & `.../frontend` | `0` | `3.68s` | `/api/health` و تمام صفحات اصلی `HTTP 200`؛ اما `/rss.xml` در حالت `next start` کد `HTTP 503` برگرداند | **`FAIL`** | `logs/baseline-runtime-*.log` |

---

## ۲.۴. تحلیل دقیق و مستند خطاهای کشف‌شده در اجرای اولیه (Baseline Failures)

### ۱. خطای `HTTP 503` در مسیر `/rss.xml` هنگام اجرای Production (`next start`) — (`blog-guest.spec.ts:14` و Runtime Check)
- **علت دقیق:** هنگام اجرای `next start` (که `NODE_ENV=production` است)، تابع `siteOrigin()` در `frontend/src/server/seo.ts:3-6` در صورت تنظیم نبودن متغیر محیطی `SITE_URL` یا `PUBLIC_SITE_URL` مقدار `null` برمی‌گرداند. در نتیجه `frontend/src/app/rss.xml/route.ts:5` به جای استخراج Origin معتبر از هدرهای درخواست یا مقدار پیش‌فرض امن، کد `HTTP 503` (`Service Unavailable`) برمی‌گرداند.

### ۲. خطای دو تگ تو در توی `<main>` در صفحات عمومی (`strict mode violation: locator('main') resolved to 2 elements` در `page-editor.spec.ts:62`)
- **علت دقیق:** فایل `frontend/src/layouts/SiteLayout.jsx:9-11` تگ `<main><PageTransition>{children}</PageTransition></main>` را رندر می‌کند، و خود `frontend/src/components/PageTransition.jsx:29` نیز یک `<motion.main className="tw:min-w-0 nk-page-transition">` رندر می‌کند.
- **پیامد زنجیره‌ای:** وجود دو تگ `<main>` تو در تو (علاوه بر نقض استاندارد معنایی HTML5 و دسترس‌پذیری) باعث شکست خط ۶۲ در `page-editor.spec.ts` (`await expect(page.locator('main')).toContainText(...)`) روی هر ۴ صفحهٔ `classes`, `teacher-profile`, `class-detail` و `club` می‌شود. به دلیل توقف تست در خط ۶۲ پیش از رسیدن به خط ۷۰ (بازگردانی نسخهٔ اصلی صفحه در دیتابیس)، صفحهٔ `teacher-profile` در دیتابیس بدون اسلات زندهٔ نظرات باقی می‌ماند و باعث شکست تست `public teacher SSR no longer invents reviews or verified counts` در `zz-next-modules.spec.ts:21` نیز می‌گردد.

### ۳. خطای محدودیت نرخ OTP (`429 RATE_LIMITED`) روی IP محلی در اجرای متوالی مجموعهٔ کامل E2E (`page-editor.spec.ts:82`, `remaining-flows.spec.ts`, `support-responsive.spec.ts`, `zz-*.spec.ts`)
- **علت دقیق:** در `backend/src/modules/auth/index.js:56` سقف درخواست OTP برای هر IP برابر با `30` درخواست در ۱۵ دقیقه (`hit('otp-ip', ip, 30, 15 * 60_000)`) تعریف شده است. از آنجا که ۱۱ فایل تست E2E بیش از ۴۰ نشست کاربری و ادمین مختلف را از یک IP (`127.0.0.1`) ایجاد می‌کنند، پس از سی‌امین درخواست OTP در میانهٔ `page-editor.spec.ts`، تمام تست‌های بعدی با خطای `Disposable development admin OTP unavailable (429)` متوقف می‌شوند.

### ۴. خطای متن اشتباه در صفحهٔ فایل‌های آموزشی شاگرد/والدین (`zz-next-modules.spec.ts:13`)
- **علت دقیق:** در `frontend/src/views/panel/Materials.jsx:183`، عبارت مورد انتظار `'جلسهٔ مجاز برای فایل آموزشی وجود ندارد.'` به اشتباه به `'هنوز جلسهٔ مجازی برای فایل آموزشی ثبت نشده است...'` («مجازی» به جای «مجاز») تغییر یافته بود.

### ۵. ناهماهنگی ۲ تست قدیمی `community-ui.spec.ts` با طراحی مصوب PDFهای رابط کاربری
- **علت دقیق:** طبق الزامات مصوب کارفرما و تست واحد `tests/unit/product-recovery.test.ts:97-118`، کامپوننت‌های `Header.jsx` (`.site-header` به جای `.nk-header`)، `Footer.jsx` (`.site-footer` به جای `.nk-footer`) و `Home.jsx` (`.hero` و `.cta-banner` به جای `.nk-hero` و `.nk-action-panel`) باید دقیقاً مطابق ۱۰ فایل PDF مرجع باشند و وجود کلاس‌های قدیمی `nk-header`/`nk-footer` در تست واحد ممنوع شده است؛ اما ۲ تست در `tests/e2e/community-ui.spec.ts` هنوز به دنبال انتخابگرهای حذف‌شدهٔ `.nk-header`, `.nk-mega-menu` و `.nk-footer` می‌گشتند.
