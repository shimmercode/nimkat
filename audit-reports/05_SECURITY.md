# فاز ۵ — ممیزی امنیتی و کنترل دسترسی (`05_SECURITY.md`)

- **پروژه:** نیمکت (`Nimkat 1.7.0`)
- **تاریخ ممیزی:** `2026-10-27` (`Asia/Tehran`)
- **فایل شواهد خام:** `/tmp/nimkat-1.7.0-audit-work/logs/phase-4-to-9-probes.json` (`phase5`), `/tmp/nimkat-1.7.0-audit-work/logs/npm-audit-backend.json`, `/tmp/nimkat-1.7.0-audit-work/logs/npm-audit-frontend.json`

---

## ۵.۱. ممیزی احراز هویت، OTP، نشست، کوکی‌ها و CSRF

| محور امنیتی | پیاده‌سازی در سورس کد | نتیجهٔ آزمون مستقل | وضعیت |
|---|---|---|---|
| **تولید و هش کردن OTP** | در `backend/src/modules/auth/security.js:41` کد ۵ رقمی با `crypto.randomInt(10000, 100000)` تولید شده و در `index.js:61` با `HMAC-SHA256` (`S.hmac(cfg.secret, mobile + ':' + code)`) در ستون `code` جدول `otp` ذخیره می‌شود. کد خام هرگز در دیتابیس ذخیره نمی‌گردد (`storedDigestSample: "6d0402f122014efc..."`). | بررسی جدول `otp` بلافاصله پس از `/api/auth/otp/request`: طول رشتهٔ هگزادسیمال ۶۴ کاراکتر، بدون متن خام. | **`PASS`** |
| **مقایسهٔ زمان‌ثابت (Timing-Safe) و انقضای OTP** | مقایسهٔ هش در `security.js:43` با `crypto.timingSafeEqual` انجام می‌شود. زمان انقضا `120,000ms` (۲ دقیقه) است. | تایید در `auth.test.js` و `phase-4-to-9-probes.js`. | **`PASS`** |
| **سقف تلاش ناموفق و Cooldown ارسال مجدد OTP** | فاصلهٔ ارسال مجدد برای هر شماره `60,000ms` (`429 RATE_LIMITED`). پس از ۵ تلاش ناموفق (`attempts + 1 >= 5`) رکورد OTP از جدول `otp` حذف می‌شود و حتی ارسال کد صحیح در تلاش ششم با `400 OTP_INVALID` رد می‌شود. | تست واقعی در `phase8.otpAndNotifications`: درخواست دوم در ثانیهٔ اول `429`؛ ۵ تلاش غلط و سپس تلاش ششم با کد صحیح `400`. | **`PASS`** |
| **عدم افشای `devCode` در Production** | در `backend/src/modules/auth/index.js:65`: `...(cfg.production ? {} : { devCode: code })`. | در `NODE_ENV=production` فیلد `devCode` برابر با `undefined` است (`auth.test.js:136`). | **`PASS`** |
| **امنیت کوکی‌ها و چرخش توکن نشست (Refresh Rotation)** | کوکی‌های `nk_access` (`HttpOnly`, `path: '/api'`, عمر ۱۵ دقیقه) و `nk_refresh` (`HttpOnly`, `path: '/api/auth'`, عمر ۷ روز). هش توکن‌ها در `auth_sessions` نگهداری می‌شود. استفادهٔ مجدد از `nk_refresh` چرخش‌یافته در `auth_refresh_used` تشخیص داده شده و کل نشست با `401 SESSION_COMPROMISED` باطل می‌گردد. | تایید در `auth.test.js` و `login-search-regression.spec.ts`. | **`PASS`** |
| **محافظت CSRF، Origin و `Sec-Fetch-Site`** | در `backend/src/modules/auth/index.js:40-48` تمام درخواست‌های غیر از `GET/HEAD/OPTIONS` روی `/api` باید: ۱) `Sec-Fetch-Site !== 'cross-site'` باشند، ۲) هدر `Origin` منطبق با `Host` یا `APP_ORIGINS` داشته باشند، ۳) برای مسیرهای غیراحراز هویت اولیه، هدر `X-CSRF-Token` منطبق با کوکی `nk_csrf` ارسال کنند. | بدون توکن CSRF -> `403 CSRF_REJECTED`؛ با `Origin: https://evil.example.com` -> `403 ORIGIN_REJECTED`؛ با `Sec-Fetch-Site: cross-site` -> `403 ORIGIN_REJECTED`. | **`PASS`** |
| **خروج از حساب (`POST /api/auth/logout`)** | تنظیم `revoked_at` روی نشست فعلی در `auth_sessions` و پاک کردن کوکی‌های `nk_access`, `nk_refresh`, `nk_csrf` در هر دو حالت عادی و Partitioned. | پس از خروج، `/api/auth/me` مقدار `{ user: null }` و مسیرهای محافظت‌شده `401` برمی‌گردانند. | **`PASS`** |

---

## ۵.۲. ماتریس کامل کنترل دسترسی مبتنی بر نقش (RBAC) و جلوگیری از IDOR

در محیط ایزوله ۶ کلاینت مجزا (**مهمان**، **شاگرد الف**، **شاگرد ب**، **مدرس**، **والدین**، **مدیر**) ایجاد شد و دسترسی به منابع یکدیگر آزموده شد:

| سناریوی آزمون دسترسی / IDOR | نقش مهاجم / درخواست‌کننده | مسیر و متد مورد آزمون | کد وضعیت واقعی | رفتار سرور | وضعیت |
|---|---|---|---:|---|---|
| دسترسی مهمان به پنل شاگرد | مهمان (`Guest`) | `GET /api/panel/student` | `401` | رد درخواست (`UNAUTHENTICATED`) | **`PASS`** |
| مشاهدهٔ رسید پرداخت شاگرد الف توسط شاگرد ب (IDOR) | شاگرد ب (`Student B`) | `GET /api/payments/:paymentIdOfA` | `404` | فیلتر `WHERE id=? AND user_id=?` مانع افشای وجود پرداخت می‌شود | **`PASS`** |
| ثبت درخواست بازپرداخت روی رزرو شاگرد الف توسط شاگرد ب (IDOR) | شاگرد ب (`Student B`) | `POST /api/bookings/:bookingIdOfA/refunds` | `404` | فیلتر `WHERE id=? AND user_id=?` مانع دستکاری رزرو دیگری می‌شود | **`PASS`** |
| دسترسی شاگرد به شاخص‌های مالی مدیریت | شاگرد الف (`Student A`) | `GET /api/admin/analytics` | `403` | رد توسط میان‌افزار `requireRole('admin')` (`FORBIDDEN`) | **`PASS`** |
| ویرایش پیش‌نویس صفحات سایت توسط شاگرد | شاگرد الف (`Student A`) | `PUT /api/pages/home` | `403` | رد توسط `requireRole('admin')` | **`PASS`** |
| دسترسی شاگرد به مدیریت کلاس‌های مدرس | شاگرد الف (`Student A`) | `GET /api/teacher/schedule/classes` | `403` | رد توسط `requireRole('teacher')` | **`PASS`** |
| دسترسی مدرس به تنظیمات کلیدهای درگاه و پیامک | مدرس (`Teacher`) | `GET /api/admin/integrations` | `403` | رد توسط `requireRole('admin')`؛ کلیدهای رمزنگاری‌شده هرگز در API بازگردانده نمی‌شوند | **`PASS`** |
| مشاهدهٔ اطلاعات شاگرد بدون لینک فعال خانواده توسط والدین (IDOR) | والدین (`Parent`) | `GET /api/parent/students/:studentAId` | `404` | بررسی جدول `parent_links` با `status='active'` و اسکوپ‌های مجاز (`schedule`, `reports`, `files`) | **`PASS`** |
| دانلود یا ابطال جزوهٔ آموزشی جلسهٔ مدرس دیگر | مدرس / شاگرد غیرمجاز | `GET /api/materials/:id/download`, `POST /api/materials/:id/revoke` | `404` | بررسی تابع `allowed(req.user, occurrence_id)` و مالکیت `owner_id` | **`PASS`** |

---

## ۵.۳. امنیت ورودی‌ها، SQL Injection، آپلود فایل، مدیریت خطا و آسیب‌پذیری بسته‌ها (`npm audit`)

1. **مقاومت در برابر SQL Injection:**
   - تمام پرس‌وجوهای دیتابیس در بک‌اند با Prepared Statements (`db.prepare('... WHERE id = ?').get(...)`) در `better-sqlite3` نوشته شده‌اند.
   - تزریق بارهای `q=' OR 1=1 --` و `grade=' UNION SELECT 1,2,3 --` به `/api/classes` و `/api/search/suggestions` بدون خطا و بدون نشت داده با کد `200` مهار شد (`PASS`).
2. **امنیت آپلود فایل‌ها (`materials.js` و `media.js`):**
   - در `backend/src/modules/education/materials.js`: بررسی Magic Bytes واقعی بافر برای PDF (`%PDF-`)، PNG و JPEG (رد فایل اجرایی تغییرنام‌یافته به `../../etc/passwd.pdf` با کد `415 فرمت فایل باید PDF، PNG یا JPEG واقعی باشد`)، سقف حجم ۵۱۲ کیلوبایت، پاکسازی نام فایل (`path.basename` و حذف کاراکترهای کنترلی)، اسکن اجباری ClamAV (`INSTREAM`) و ارسال هدرهای `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` و `Content-Security-Policy: default-src 'none'; sandbox` هنگام دانلود (`PASS`).
   - در `backend/src/modules/content/media.js`: بازکدگذاری کامل تصویر با `sharp` که هرگونه متادیتا یا کد مخرب احتمالی را حذف می‌کند (`PASS`).
3. **مدیریت خطا و JSON نامعتبر:**
   - ارسال JSON شکسته (`{"mobile": "0912`) به سرور با کد `400` و بدون افشای Stack Trace یا مسیر فایل‌های داخلی سرور مدیریت می‌شود (`PASS`).
4. **ممیزی آسیب‌پذیری وابستگی‌ها (`npm audit`):**
   - **بک‌اند (`backend`):** `{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}` (`PASS`)
   - **فرانت‌اند (`frontend`):** `{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}` (`PASS`)
