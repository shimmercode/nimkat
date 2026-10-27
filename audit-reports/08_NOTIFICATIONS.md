# فاز ۸ — ممیزی پیامک، ایمیل و اعلان‌ها (`08_NOTIFICATIONS.md`)

- **پروژه:** نیمکت (`Nimkat 1.7.0`)
- **تاریخ ممیزی:** `2026-10-27` (`Asia/Tehran`)
- **فایل شواهد خام:** `/tmp/nimkat-1.7.0-audit-work/logs/phase-4-to-9-probes.json` (`phase4`, `phase8`), `backend/tests/auth.test.js`

---

## ۸.۱. ممیزی سرویس پیامک (OTP و کاوه‌نگار)

| مورد بررسی | محل پیاده‌سازی در کد | رفتار واقعی تأییدشده | وضعیت |
|---|---|---|---|
| **تولید و ارسال OTP** | `backend/src/modules/auth/index.js:52-66` و `backend/src/modules/settings/providers.js:75-86` | کد ۵ رقمی تصادفی تولید شده، به `sendOtp(mobile, code)` تحویل می‌شود و تنها پس از موفقیت ارسال، هش HMAC آن در جدول `otp` ذخیره می‌گردد. | **`PASS`** |
| **مدیریت خطای سرویس‌دهندهٔ پیامک (کاوه‌نگار)** | `backend/src/modules/settings/providers.js:79-85` و `auth/index.js:60` | ۱) در `NODE_ENV=production` اگر سرویس پیامک فعال نباشد یا کلید `apiKey`/`template` ناقص باشد، خطای `503 SERVICE_NOT_CONFIGURED` برمی‌گردد.<br>۲) اگر درخواست HTTP به کاوه‌نگار ناموفق باشد (`!res.ok` یا خطای شبکه)، کد `503` با پیام `'ارسال پیامک موفق نبود؛ بعداً تلاش کنید.'` بازگردانده می‌شود و هیچ کد OTP ناقصی در دیتابیس ثبت نمی‌گردد (`auth.test.js:128-136`). | **`PASS`** |
| **محدودیت نرخ ارسال (Rate Limiting) و Cooldown** | `backend/src/modules/auth/index.js:56-59` | ۱) فاصلهٔ حداقل `60` ثانیه بین دو درخواست برای یک شماره (`cooldownStatus: 429, code: 'RATE_LIMITED'`).<br>۲) حداکثر `5` درخواست در ۱۵ دقیقه برای هر شماره موبایل.<br>۳) حداکثر `30` درخواست در ۱۵ دقیقه برای هر IP در محیط تولیدی. | **`PASS`** |
| **ایمیل (Email Service)** | بررسی کل سورس کد (`backend/src/**`) | در معماری نیمکت ۱.۷.۰ سرویس ارسال ایمیل خارجی وجود ندارد و احراز هویت و اطلاع‌رسانی‌ها بر پایهٔ شماره موبایل (پیامک OTP) و اعلان‌های درون‌برنامه‌ای/SSE طراحی شده‌اند. | **`NOT APPLICABLE`** |
| **اتصال زنده به سرور واقعی کاوه‌نگار (`api.kavenegar.com`)** | `backend/src/modules/settings/providers.js:82` | مطابق قانون ۵ بخش ۰ (ممنوعیت ارسال پیامک پولی واقعی) و فایروال خروجی کانتینر، اتصال به API کاوه‌نگار از طریق Mock استاندارد HTTP در `auth.test.js` و `services.test.js` تست و تأیید شد. | **`BLOCKED`** (برای ارسال پیامک واقعی پولی؛ آداپتور با Mock: **`PASS`**) |

---

## ۸.۲. ممیزی اعلان‌های درون‌برنامه‌ای، یادآوری جلسات و رویدادهای بلادرنگ (SSE)

1. **اعلان‌های پنل کاربری (`backend/src/modules/panel/index.js` و `server.js:492-502`):**
   - اعلان‌های واقعی از وضعیت رزروهای تأییدشده، جلسات پیش‌رو، پیشنهادهای تغییر زمان جلسه (`schedule_proposals`) و رویدادهای نیمکت کلاب استخراج می‌شوند.
   - کاربر می‌تواند هر اعلان را با `POST /api/notifications/:id/cancel` ببندد؛ این عمل علاوه بر حذف اعلان شخصی، شناسهٔ آن را در جدول `user_notification_dismissals(user_id, notification_id, created_at)` ثبت می‌کند تا پس از Refresh دوباره ظاهر نشود (`dismissStatus: 200` در `phase8.otpAndNotifications` — **`PASS`**).
2. **جلوگیری از ارسال اعلان تکراری در نیمکت کلاب و رویدادها:**
   - در `backend/src/modules/club/index.js` هر رویداد دارای کلید یکتا (`source_key`) در جدول `club_events` (`UNIQUE(user_id, rule_id, source_key)`) است و ثبت مجدد همان رویداد نادیده گرفته می‌شود (`PASS`).
3. **رویدادهای بلادرنگ (`GET /api/events` در `backend/src/modules/realtime/index.js`):**
   - جریان استاندارد `text/event-stream` با احراز هویت کوکی، ارسال ضربان (`heartbeat`) و انتشار آنی پیام‌های نیم‌چت، تیکت‌های پشتیبانی و تغییرات وضعیت به کاربران مجاز (`PASS`).
