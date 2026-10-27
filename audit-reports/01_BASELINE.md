# فاز ۱ — شناسایی و تثبیت نسخه مبنا (`01_BASELINE.md`)

- **پروژه:** نیمکت (`Nimkat 1.7.0`)
- **تاریخ ممیزی:** `2026-10-27` (`Asia/Tehran`)
- **محیط کاری مستقل و ایزوله:** `/tmp/nimkat-1.7.0-audit-work`
  - مسیر استخراج مبنا (بدون تغییر برای بازتولید فاز ۲): `/tmp/nimkat-1.7.0-audit-work/baseline-extracted/nimkat`
  - مسیر نسخهٔ کاری اصلاحات: `/tmp/nimkat-1.7.0-audit-work/work`

---

## ۱.۱. شناسایی آرشیو و بررسی سلامت بسته

### جدول آرشیوهای ZIP موجود در ریشهٔ پروژه (`/home/user/nimkat/`)

| نام فایل | مسیر کامل | حجم دقیق (بایت) | تاریخ تغییر (`mtime` UTC) | هش `SHA-256` | نقش آرشیو |
|---|---|---:|---|---|---|
| **`nimkat-complete-final-v1.7.0.zip`** | `/home/user/nimkat/nimkat-complete-final-v1.7.0.zip` | `6,075,961` | `2026-10-27 15:47:12.175537258 +0000` | `2606a6042b7a1c50049b524de16017b7b5a975429be4ff8be0d9033ac8e4d11b` | **بستهٔ هدف نسخهٔ ۱.۷.۰ (مبنای این ممیزی)** |
| `nimkat-booking-wallet-final.zip` | `/home/user/nimkat/nimkat-booking-wallet-final.zip` | `5,938,420` | `2026-10-27 15:47:12.163537197 +0000` | `b0c259b29b98ce7d16a435b150d6a5f8df1097684f999ae09d7e1ea5f31c8d2f` | بستهٔ قبلی پیش از افزودن ۴ اصلاح UI و گزارش‌های مرحلهٔ نهایی |
| `nimkat-booking-wallet-search-ux-fixes.zip` | `/home/user/nimkat/nimkat-booking-wallet-search-ux-fixes.zip` | `5,925,139` | `2026-10-27 15:47:12.171537237 +0000` | `7412b7dba57ec1c27a723d6d632643d01480850f816efc2e53c07deb9fe4ccd7` | بستهٔ میانی اصلاحات کیف پول و جستجو |
| `nimkat-complete-ui-ux-stability-final.zip` | `/home/user/nimkat/nimkat-complete-ui-ux-stability-final.zip` | `5,491,517` | `2026-10-27 15:47:12.179537278 +0000` | `d40f2f0d829b202dc33ca6140b84e3dc0b2ca59b155f1c97fdd8a612139f9db4` | بستهٔ قدیمی‌تر نسخهٔ `v1.6.0` |

### نتایج بررسی سلامت آرشیو `nimkat-complete-final-v1.7.0.zip`

- **تست سلامت فشرده‌سازی (`unzip -t`):** `No errors detected in compressed data of /home/user/nimkat/nimkat-complete-final-v1.7.0.zip.` (`PASS`)
- **تعداد کل ورودی‌ها (`unzip -Z1 | wc -l`):** `773` ورودی (شامل دایرکتوری‌ها و فایل‌ها تحت ریشهٔ `nimkat/`).
- **فهرست کامل فایل‌ها:** ذخیره شده در `/tmp/nimkat-1.7.0-audit-work/logs/zip-filelist.txt`.
- **بررسی فایل‌های تکراری (`sort | uniq -d`):** `0` مورد.
- **بررسی مسیرهای خارج از محدوده (`^/` یا `../`)، فایل‌های `.env` واقعی، دیتابیس‌های `.db`/`.sqlite`، پوشه‌های `node_modules/` یا `.next/`:** `0` مورد (`NO_SUSPICIOUS_OR_OUT_OF_SCOPE_PATHS`).

### بررسی گزارش‌ها، مستندات و فایل‌های Checksum موجود در بستهٔ ۱.۷.۰

| فایل مستند / گزارش در بسته | نسخه / شاخه / کامیت / کپی کاری اشاره‌شده در متن آن | وضعیت تطابق با بستهٔ ۱.۷.۰ |
|---|---|---|
| `README.md` | نسخه، شاخه و کامیت: **نامشخص** | حاوی برخی ادعاهای قدیمی دربارهٔ نبود پنل والدین و نبود دفتر کل دوبل (در جدول ۱.۳ مستند شده است). |
| `SETUP.md` | نسخه، شاخه و کامیت: **نامشخص** | راهنمای راه‌اندازی محلی؛ برخی متغیرهای محیطی با کد واقعی تفاوت دارند. |
| `SHA256SUMS.txt` | اشاره به ۲۷ فایل اصلاح‌شده و `nimkat-booking-wallet-final.zip`؛ کامیت: **نامشخص** | هش‌های ۵ فایل فرانت‌اند (`LiveSearch.jsx`, `HeroSearch.jsx`, `Home.jsx`, `ClassesSearch.jsx`, `interactions.css`) در `SHA256SUMS.txt` مربوط به پیش از ۴ اصلاح UI نهایی هستند و در بستهٔ ۱.۷.۰ بروزرسانی نشده‌اند. |
| `RELEASE_NOTES.md`, `FIXES_REPORT.md`, `BUG_AUDIT_REPORT.md`, `BUG_REPRODUCTION_REPORT.md`, `TEST_REPORT.md`, `SECURITY_REPORT.md`, `IMPLEMENTATION_STATUS.md`, `AUDIT_REPORT.md` | شاخهٔ `arena/4f156d38-nimkat`، کامیت پایه `f19f5e188a14fb0715e33359dd94f52adf2f92dc`، نسخه: **نامشخص** (پیش از برچسب ۱.۷.۰) | گزارش‌های تولیدشده در مراحل قبلی توسعه. |
| `audit-reports/FINAL_RELEASE_READINESS.md`, `audit-reports/E2E_BROWSER_REPORT.md`, `audit-reports/PLAYWRIGHT_E2E_FINAL_REPORT.md`, `audit-reports/FINAL_REGRESSION_REPORT.md`, `audit-reports/STAGING_PAYMENT_VERIFICATION.md` | تاریخ `2026-10-27`، شاخهٔ `arena/4f156d38-nimkat` (`HEAD = f19f5e188a14fb0715e33359dd94f52adf2f92dc`)، کپی کاری `/tmp/nimkat-independent-audit/extracted/nimkat` و بستهٔ پایه `nimkat-booking-wallet-final.zip` (`b0c259b2...`) | مربوط به ممیزی مرحلهٔ قبل روی کپی ایزوله. |
| `audit-reports/INDEPENDENT_AUDIT_REPORT.md` و سایر فایل‌های `audit-reports/*.md` | تاریخ `2026-10-26`/`2026-10-27`، کپی کاری `/tmp/nimkat-independent-audit/extracted/nimkat`، کامیت: **نامشخص** در برخی زیرگزارش‌ها | مربوط به ممیزی ۱۰ مرحله‌ای قبلی. |

---

## ۱.۲. معماری واقعی استخراج‌شده از روی کد (بدون اتکا به مستندات)

| لایه / مؤلفه | واقعیت کشف‌شده در سورس کد | فایل‌های مرجع در کد |
|---|---|---|
| **چارچوب فرانت‌اند و نسخه‌ها** | **Next.js `^16.4.2`** (App Router با SSR و Client Components)، **React `^19.3.1`**، **TypeScript `^7.0.2`**، **Tailwind CSS `^4.3.3`**، `@radix-ui/react-dialog ^1.3.1`، `@radix-ui/react-navigation-menu ^1.4.1`، `motion ^14.4.0`. | `frontend/package.json`, `frontend/next.config.ts` |
| **چارچوب بک‌اند و نسخه‌ها** | **Express `^5.3.0`** (CommonJS روی Node.js)، **better-sqlite3 `^13.0.3`**، **sharp `^0.35.5`**. | `backend/package.json`, `backend/src/server.js` |
| **روش Build و اجرای Production** | فرانت‌اند: `next build --webpack` (تولید پوشهٔ `.next/`) و اجرا با `next start --hostname 0.0.0.0 --port 5173` (یا `node scripts/start-web.mjs` که پورت `5173` را بالا می‌آورد و یک پراکسی آینه‌ای روی پورت `3000` ایجاد می‌کند). بک‌اند: `node src/server.js` روی پورت پیش‌فرض `8000`. | `frontend/package.json`, `frontend/scripts/start-web.mjs`, `backend/src/server.js` |
| **دیتابیس و مدیریت تراکنش** | **SQLite** در حالت `PRAGMA journal_mode = WAL` در مسیر `${NIMKAT_DATA_DIR}/nimkat.db` (پیش‌فرض: `backend/data/nimkat.db`). تراکنش‌های حساس مالی و رزرو با `db.transaction(() => { ... })()` به‌صورت اتمیک و همگام (Synchronous/Serializable در SQLite) اجرا می‌شوند. | `backend/src/db.js`, `backend/src/modules/payments/index.js`, `backend/src/modules/scheduling/index.js` |
| **احراز هویت و مدیریت نشست** | OTP ۵ رقمی با هش `HMAC-SHA256` در جدول `otp` (انقضا `120s`، فاصلهٔ ارسال مجدد `60s`، حداکثر `5` تلاش، محدودیت نرخ در `auth_limits`: ۳۰ درخواست در ۱۵ دقیقه برای هر IP و ۵ درخواست برای هر شماره). نشست‌ها در `auth_sessions` با توکن‌های تصادفی ۲۵۶ بیتی (ذخیرهٔ هش SHA-256 در دیتابیس) و کوکی‌های `nk_access` (`HttpOnly`, مسیر `/api`, عمر ۱۵ دقیقه)، `nk_refresh` (`HttpOnly`, مسیر `/api/auth`, عمر ۷ روز با چرخش توکن و تشخیص استفادهٔ مجدد در `auth_refresh_used`) و `nk_csrf` (مسیر `/`). بررسی `Sec-Fetch-Site !== 'cross-site'`، تطبیق `Origin` با `Host`/`APP_ORIGINS` و هدر `X-CSRF-Token` در تمام درخواست‌های تغییر وضعیت. | `backend/src/modules/auth/index.js`, `backend/src/modules/auth/security.js`, `frontend/src/api.js` |
| **صف‌ها، کش و رویدادهای بلادرنگ** | رویدادهای بلادرنگ از طریق **SSE (`Server-Sent Events`)** در مسیر `GET /api/events` (`backend/src/modules/realtime/index.js`). کارهای دوره‌ای با یک `setInterval` هر ۶۰ ثانیه در `server.js:35` برای `friendly.expire()` و `earnings.settle()`. هیچ سرویس خارجی Redis یا صف پیام مجزا در کد وجود ندارد. | `backend/src/modules/realtime/index.js`, `backend/src/server.js:35` |
| **سرویس‌های پرداخت و پیامک** | در `backend/src/modules/settings/providers.js`: پشتیبانی از **زرین‌پال نسخه ۴** (`payment.zarinpal.com` و `sandbox.zarinpal.com`) و پیامک **کاوه‌نگار** (`api.kavenegar.com`). تنظیمات ارائه‌دهندگان به صورت رمزنگاری‌شده با **AES-256-GCM** در جدول `provider_settings` ذخیره می‌شوند (با کلید `NIMKAT_SETTINGS_KEY`). در محیط غیرتولیدی (`NODE_ENV !== 'production'`) در صورت عدم تنظیم درگاه (`version === 0`)، شبیه‌ساز محلی `local_dev` فعال است؛ در `NODE_ENV === 'production'` بدون تنظیمات معتبر، سیستم به صورت Fail-Closed خطای `503 SERVICE_NOT_CONFIGURED` برمی‌گرداند. | `backend/src/modules/settings/providers.js`, `backend/src/modules/settings/store.js`, `backend/src/modules/payments/index.js` |
| **مدیریت فایل‌ها و ذخیره‌سازی** | ۱) تصاویر ویرایشگر (`modules/content/media.js`): اعتبارسنجی و بازکدگذاری (Re-encode) با `sharp` به WebP/PNG/JPEG حداکثر ۲ مگابایت در `${NIMKAT_DATA_DIR}/editor-media`.<br>۲) فایل‌های آموزشی (`modules/education/materials.js`): بررسی Magic Bytes برای PDF/PNG/JPEG حداکثر ۵۱۲ کیلوبایت، اسکن اجباری با **ClamAV (`INSTREAM` روی پورت TCP `3310`)** و ذخیره در `${NIMKAT_DATA_DIR}/materials`. در صورت در دسترس نبودن ClamAV، به صورت Fail-Closed با کد `503 SCANNER_UNAVAILABLE` رد می‌شود. | `backend/src/modules/content/media.js`, `backend/src/modules/education/materials.js` |
| **مسیرهای API و ساختار ماژول‌ها** | ۱۴ ماژول در `backend/src/modules/`: `auth`, `settings`, `blog`, `content`, `realtime`, `chat`, `support`, `scheduling`, `classroom`, `payments` (+ `refunds`), `club`, `commerce` (`earnings`, `shop`, `friendly`), `education` (`availability`, `reviews`, `materials`), `panel` (+ `analytics`) به همراه مسیرهای کاتالوگ، جستجوی زنده (`/api/search/live`)، تخفیف‌ها (`/api/promotions/home`) و سلامت (`/api/health`) در `backend/src/server.js`. | `backend/src/server.js`, `backend/src/modules/**` |
| **ابزارهای تست و پوشش واقعی** | ۱) بک‌اند: `node --test tests/*.test.js` (`11` فایل تست، `121` تست).<br>۲) فرانت‌اند واحد: `vitest run` (`8` فایل تست در `frontend/tests/unit/`, `39` تست).<br>۳) فرانت‌اند E2E: `@playwright/test` (`11` فایل `.spec.ts` در `frontend/tests/e2e/`, شامل `54` تست تعریف‌شده).<br>۴) اسکریپت `lint`: در هیچ‌یک از `backend/package.json` و `frontend/package.json` تعریف نشده است (فقط `typecheck`: `tsc --noEmit` وجود دارد). | `backend/package.json`, `frontend/package.json` |

---

## ۱.۳. فهرست اختلاف‌های مستندات و فایل‌های پیکربندی با سورس واقعی

1. **نبود فایل‌های Docker و Nginx در بستهٔ `nimkat-complete-final-v1.7.0.zip` و ناسازگاری کامل نسخهٔ موجود در `releases/nimkat-final-release/` با Next.js 16:**
   - در بستهٔ `nimkat-complete-final-v1.7.0.zip` فایل‌های `Dockerfile.frontend`, `Dockerfile.backend`, `docker-compose.yml` و `nginx.conf` حذف شده بودند.
   - نسخهٔ موجود این فایل‌ها در `/home/user/nimkat/releases/nimkat-final-release/` برای فرانت‌اند Vite قدیمی نوشته شده است (`COPY --from=build /app/frontend/dist /usr/share/nginx/html`) در حالی که فرانت‌اند فعلی Next.js 16 SSR است و پوشهٔ `dist` تولید نمی‌کند.
2. **تناقض نام و فرمت متغیرهای محیطی در `.env.example`، `Dockerfile.backend` و `docker-compose.yml` با کد واقعی:**
   - `.env.example` متغیر `NIMKAT_AUTH_SECRET` را معرفی کرده اما کد احراز هویت (`backend/src/modules/auth/security.js:21`) متغیر `NIMKAT_SECRET` را می‌خواند.
   - `.env.example` برای `NIMKAT_SETTINGS_KEY` مقدار نمونهٔ متنی (`replace-with-32-byte-base64-or-hex-key...`) قرار داده در حالی که `backend/src/modules/settings/store.js:17` فقط و فقط رشتهٔ ۶۴ کاراکتری هگزادسیمال (`/^[a-f0-9]{64}$/i`) را می‌پذیرد و با مقدار نمونهٔ `.env.example` سرور هنگام بالا آمدن کرش می‌کند.
   - `docker-compose.yml` متغیر اجباری `NIMKAT_SETTINGS_KEY` را در `NODE_ENV=production` به سرویس `backend` نمی‌دهد؛ در نتیجه `backend` بلافاصله در خط ۲۰ فایل `store.js` با خطای `NIMKAT_SETTINGS_KEY is required in production` متوقف می‌شود.
   - `Dockerfile.backend` و `docker-compose.yml` متغیر `NIMKAT_DB_PATH` و `ALLOWED_ORIGINS` را تنظیم کرده‌اند، اما کد واقعی (`db.js:6` و `security.js:33`) متغیرهای `NIMKAT_DATA_DIR` و `APP_ORIGINS` را می‌خواند.
   - `.env.example` پورت `PORT=3001` را نوشته اما کل کد فرانت‌اند و بک‌اند روی پورت `8000` تنظیم شده است.
3. **ادعاهای منسوخ در `README.md`:**
   - خط ۴۹ `README.md` می‌گوید پنل مستقل والدین هنوز ساخته نشده و به `/panel` می‌رود، در حالی که پنل مستقل والدین در `/parent` و `/parent/files` پیاده‌سازی شده است.
   - خط ۱۱۹ `README.md` می‌گوید دفتر کل دوطرفه (`ledger`) و درگاه/پیامک پیاده‌سازی نشده‌اند، در حالی که جداول `ledger_journals` و `ledger_entries` و ماژول‌های `payments` و `providers` در کد وجود دارند.
4. **عدم بروزرسانی ۵ هش در `SHA256SUMS.txt`:**
   - فایل `SHA256SUMS.txt` داخل بستهٔ `1.7.0` هنوز هش‌های قبلی ۵ فایل اصلاح‌شدهٔ فرانت‌اند (`LiveSearch.jsx`, `HeroSearch.jsx`, `Home.jsx`, `ClassesSearch.jsx`, `interactions.css`) را دارد.
