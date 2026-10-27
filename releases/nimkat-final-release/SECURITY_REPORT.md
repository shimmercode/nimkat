# SECURITY_REPORT.md — گزارش ممیزی امنیت، کنترل دسترسی و وابستگی‌ها

**تاریخ ممیزی:** ۱۴۰۵/۰۸/۰۴ (`2026-10-26`)

---

## ۱. بررسی و رفع آسیب‌پذیری وابستگی‌ها (Dependency Audit)

- **وضعیت اولیه (`backend`):** اجرای `npm audit` درپوشهٔ `backend` یک آسیب‌پذیری با شدت **High** (`GHSA-27r3-jxmh-p828`، CVSS `7.5` — Denial of Service via trailing bytes after a compressed request body) در پکیج غیرمستقیم `body-parser` (نسخهٔ `< 2.4.0`) گزارش می‌کرد.
- **اقدام اصلاحی:** ارتقای پکیج `body-parser` از طریق `npm audit fix --ignore-scripts` در `backend/package-lock.json` بدون تغییر ناسازگار در Express `5.3.0`.
- **وضعیت فعلی پس از اصلاح:**
  - `cd backend && npm audit` ⬅ **`found 0 vulnerabilities`**
  - `cd frontend && npm audit` ⬅ **`found 0 vulnerabilities`**

---

## ۲. کنترل‌های امنیتی فعال و تست‌شده در معماری پروژه

| حوزهٔ امنیتی | مکانیزم پیاده‌سازی‌شده در کد | وضعیت تست |
|---|---|---|
| **احراز هویت و نشست‌ها (`auth`)** | ذخیرهٔ هش SHA-256 برای کدهای OTP و توکن‌های نشست؛ کوکی‌های `HttpOnly` (`nk_access`، `nk_refresh`)؛ چرخش توکن Refresh و ابطال کل زنجیره در صورت استفادهٔ مجدد از توکن بازنشسته؛ سقف مطلق عمر نشست. | تست‌شده در `backend/tests/auth.test.js` (۱۱ تست). |
| **محافظت CSRF و Origin** | بررسی هدر `Origin` و تطبیق توکن `X-CSRF-Token` با کوکی `nk_csrf` برای تمامی درخواست‌های تغییر وضعیت (`POST`، `PUT`، `DELETE`) و مسیرهای حساس احراز هویت. | تست‌شده در `backend/tests/auth.test.js`. |
| **محدودیت نرخ درخواست (Rate Limiting) و OTP** | محدودیت ۵ تلاش برای هر کد OTP، انقضای ۲ دقیقه‌ای، Cooldown بین درخواست‌ها و سقف درخواست موبایل همراه با هدر `Retry-After`. | تست‌شده در `backend/tests/auth.test.js`. |
| **کنترل دسترسی مبتنی بر نقش و مالکیت منبع (RBAC & IDOR)** | بررسی نقش (`requireRole`) و مالکیت رکورد در تمامی مسیرها: دانش‌آموز فقط رزروها، تقویم، کیف پول و فایل‌های جلسات خودش را می‌بیند؛ والد فقط به اطلاعات فرزندان دارای مجوز فعال دسترسی دارد؛ مدرس فقط جلسات و گزارش‌های کلاس‌های خودش را مدیریت می‌کند. | تست‌شده در `services.test.js` و `product-recovery.test.js`. |
| **امنیت مالی و جلوگیری از Double-Spend** | عدم اعتماد به Query String مرورگر برای تأیید پرداخت؛ تأیید سمت سرور (`verifyPayment`)؛ ثبت اتمیک در دفتر کل (`ledger_entries`)؛ کلید `idempotencyKey` در رزرو، شارژ کیف پول، بازپرداخت و دریافت جایزهٔ کلاب. | تست‌شده در `services.test.js` و `club.test.js`. |
| **رمزنگاری اطلاعات حساس در دیتابیس** | رمزنگاری تنظیمات سرویس‌های خارجی (`settingsStore`)، اطلاعات شخصی پروندهٔ مدرس (`onboarding.js`) و شماره شبا (`IBAN` در `earnings.js`) با الگوریتم AES-256-GCM. | تست‌شده در `services.test.js` و `onboarding.test.js`. |
| **آپلود فایل، تصاویر و آنتی‌ویروس (Fail-Closed)** | بررسی امضای باینری فایل (Magic Bytes)، حذف متادیتای EXIF و رد SVGهای مخرب با `sharp`؛ اسکن اجباری فایل‌های آموزشی با پروتکل `INSTREAM` سرویس ClamAV پیش از انتشار (رد ایمن با کد `503` در صورت نبود اسکنر). | تست‌شده در `content.test.js`، `material-scanner.test.js` و `services.test.js`. |
| **محافظت در برابر XSS در صفحه‌ساز و چت** | پاک‌سازی مارکاپ در `safe-markup.ts` (حذف تگ‌های `<script>`، `<img>` و صفت‌های رویدادی `onerror`/`onclick`) و فیلتر کردن استایل‌های خطرناک (`url(...)`، `;`، `{}`) در `PageRenderer.jsx` و بک‌اند `content`. | تست‌شده در `editor-markup.test.ts` و `content.test.js`. |
| **پشتیبان‌گیری رمزنگاری‌شدهٔ دیتابیس** | پشتیبان‌گیری آنلاین SQLite با رمزنگاری AES-256-GCM، بررسی صحت (`PRAGMA integrity_check`) و ممانعت از بازنویسی پوشهٔ دیتابیس زنده. | تست‌شده در `backup.test.js`. |

---

## ۳. ریسک‌های عملیاتی باقی‌مانده برای استقرار Production

1. **الزام متغیرهای محیطی Production:** در محیط عملیاتی واقعی، متغیرهای `NODE_ENV=production`، `NIMKAT_SECRET` (حداقل ۳۲ کاراکتر تصادفی)، `NIMKAT_SETTINGS_KEY` (۶۴ کاراکتر هگزادسیمال)، `COOKIE_SECURE=true` و `APP_ORIGINS` باید در سرویس‌منیجر تنظیم شوند.
2. **سرویس ClamAV برای بارگذاری جزوات:** برای فعال شدن بارگذاری فایل‌های آموزشی در محیط عملیاتی، دیمن `clamd` باید روی شبکهٔ خصوصی داخلی (`127.0.0.1:3310`) فعال و در تنظیمات ادمین روشن شود.
