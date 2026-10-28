# گزارش ممیزی امنیت و حریم خصوصی (Stage 8 — SECURITY_AUDIT)

## ۱. خلاصهٔ بررسی‌های امنیتی انجام‌شده

1. **اسکن اسرار و فایل‌های حساس در بسته:**
   - هیچ فایل `.env`، کلید خصوصی، توکن واقعی یا دیتابیس زمان اجرا در آرشیو وجود ندارد (`forbidden_matches: []`).
   - فایل `.env.example` صرفاً شامل مقادیر نمونهٔ آموزشی (`replace-with-...`) است.
2. **آسیب‌پذیری وابستگی‌ها (`npm audit`):**
   - `backend`: `found 0 vulnerabilities` (۷۹ پکیج بررسی‌شده)
   - `frontend`: `found 0 vulnerabilities` (۱۲۲ پکیج بررسی‌شده)
3. **احراز هویت، مجوزها و جداسازی داده‌های مالی کاربران:**
   - کوکی‌های نشست (`nk_access`, `nk_refresh`) دارای پرچم `HttpOnly` و `SameSite=Lax` (و `Secure` در Production) هستند و توکن‌ها در دیتابیس فقط به صورت هش SHA-256 ذخیره می‌شوند.
   - تست نفوذ مستقل دسترسی عرضی (IDOR): تلاش کاربر `studentB` برای دسترسی به تراکنش کاربر `studentA` (`GET /api/payments/:id`) با **`404 Not Found`** مسدود شد (`crossUserPaymentAccessStatus: 404`).
   - درخواست بدون احراز هویت به `GET /api/wallet` و `POST /api/wallet/charge` با **`401 Unauthorized`** رد شد.
4. **جلوگیری از جعل Callback پرداخت و Race Condition:**
   - ارسال Callback با `Status=OK` و `Authority` جعلی با **`400 Bad Request`** رد شد و هیچ تغییری در موجودی ایجاد نکرد.
   - ارسال ۵ درخواست هم‌زمان Callback روی یک پرداخت در انتظار، تنها ۱ ژورنال در `ledger_journals` ثبت کرد.
   - ارسال هم‌زمان رزرو روی آخرین صندلی خالی کلاس توسط دو کاربر، تنها ۱ رزرو را تأیید (`200`) و دیگری را رد (`409`) کرد.
5. **محافظت از حالت Mock Gateway در محیط عملیاتی:**
   - در `backend/src/modules/settings/providers.js` (خط ۵۶)، حالت `local_dev` صریحاً مقید به `process.env.NODE_ENV !== 'production'` است و در محیط Production بدون پیکربندی معتبر درگاه، خطای `503 SERVICE_NOT_CONFIGURED` برمی‌گرداند.

---

## ۲. جدول طبقه‌بندی یافته‌های امنیتی

| شناسه | عنوان یافته | شدت | مسیر فایل و شواهد | وضعیت |
|---|---|---|---|---|
| `SEC-01` | عدم وجود آسیب‌پذیری در وابستگی‌های npm و عدم نشت اسرار در بسته | `INFO` | `backend/package-lock.json`, `frontend/package-lock.json` (`0 vulnerabilities`) | `PASS` |
| `SEC-02` | جداسازی کامل تراکنش‌ها و کیف پول کاربران و محافظت CSRF/Origin | `INFO` | `backend/src/modules/payments/index.js`, `backend/src/modules/auth/index.js` (`401` / `403` / `404`) | `PASS` |
| `SEC-03` | بررسی واجد شرایط بودن تخفیف ثبت‌نام اول (`MEHR05`) در نمایش اولیه در مقابل اعمال کد در رزرو | `LOW` | در `GET /api/promotions/home` (`backend/src/server.js` خط ۴۲۲)، فیلد `eligibleForFirstRegistration` پس از اولین رزرو `false` می‌شود و مودال دیگر نمایش داده نمی‌شود؛ با این حال در `backend/src/modules/payments/vouchers.js`، کد عمومی `MEHR05` به عنوان یک کوپن عمومی ۵٪ در جدول `coupons` بدون محدودیت یک‌بارمصرف به ازای هر کاربر تعریف شده است. | ثبت‌شده در `REMAINING_ISSUES.md` (رفتار پایهٔ جدول `coupons`) |

**جمع‌بندی امنیتی:** هیچ آسیب‌پذیری با شدت `CRITICAL`، `HIGH` یا `MEDIUM` در بستهٔ تحویلی مشاهده نشد.
