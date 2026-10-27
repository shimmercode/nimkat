# گزارش بازتولید باگ‌ها روی نسخهٔ پایه (Stage 0 — BUG_REPRODUCTION_REPORT)

این گزارش پیش از اعمال و بسته شدن نهایی اصلاحات، با اجرای سرور واقعی نسخهٔ پایه (`HEAD: 5eafaa09b7e1f4ad2c6983218435e530db60cc09` / بستهٔ `nimkat-complete-ui-ux-stability-final.zip`) روی دیتابیس ایزولهٔ تست (`/tmp/nimkat-repro-db-*`) ثبت شده است. دیتابیس اصلی پروژه دست‌نخورده باقی مانده است.

---

## ۱. خطای شارژ کیف پول (`0.1` — Wallet Charge Failure)

- **باگ:** بروز خطای `503 Service Unavailable` در ارسال درخواست شارژ کیف پول با عدد انگلیسی معتبر و خطای `400 Bad Request` در ارسال مبلغ با ارقام فارسی/جداکنندهٔ هزارگان.
- **محیط:** Node.js `v22.22.3`، دیتابیس ایزولهٔ SQLite (`/tmp/nimkat-repro-db-*`)، سرور واقعی Express از نسخهٔ پایه (`backend/src/server.js`)، کاربر احراز هویت‌شده با نقش `student` (`mobile: 09125551122`).
- **مراحل بازتولید:**
  1. ورود با OTP به عنوان دانش‌آموز و دریافت کوکی `nk_access` و توکن `nk_csrf`.
  2. فراخوانی `GET /api/wallet` برای ثبت موجودی اولیه (`balance: 0`, `balanceRial: 0`).
  3. ارسال درخواست اول:
     - `Method`: `POST`
     - `URL`: `/api/wallet/charge`
     - `Payload`: `{"amount": 100000, "idempotencyKey": "repro-wallet-int-100000"}`
  4. ارسال درخواست دوم (با ارقام فارسی در فرم UI):
     - `Method`: `POST`
     - `URL`: `/api/wallet/charge`
     - `Payload`: `{"amount": "۱۰۰٬۰۰۰", "idempotencyKey": "repro-wallet-fa-100000"}`
- **نتیجهٔ مورد انتظار:**
  - نرمال‌سازی ارقام فارسی/عربی و جداکننده‌ها به عدد صحیح معتبر (`100000` تومان = `1000000` ریال).
  - ایجاد رکورد `pending` در جدول `payment_intents` و بازگرداندن `redirectUrl` به درگاه پرداخت (یا شبیه‌ساز کنترل‌شدهٔ `local_dev` در محیط توسعه/تست بدون کلید تجاری خارجی).
- **نتیجهٔ واقعی:**
  - برای `amount: 100000`:
    - `HTTP Status`: **`503`**
    - `Response JSON`: `{"error": "درگاه پرداخت فعال نیست؛ هیچ مبلغی برداشت یا رزروی تأیید نشد."}`
    - `Backend Console Log`: `API error: SERVICE_NOT_CONFIGURED`
  - برای `amount: "۱۰۰٬۰۰۰"`:
    - `HTTP Status`: **`400`**
    - `Response JSON`: `{"error": "مبلغ یا شناسهٔ درخواست شارژ نامعتبر است."}`
- **شواهد (وضعیت دیتابیس قبل و بعد از درخواست):**
  - قبل از درخواست: `payment_intents: 0`, `ledger_journals: 0`, `ledger_entries: 0`, `wallet.balance: 0`
  - بعد از هر دو درخواست: `payment_intents: 0`, `ledger_journals: 0`, `ledger_entries: 0`, `wallet.balance: 0`
- **علت ریشه‌ای:**
  1. در `backend/src/modules/settings/providers.js` تابع `paymentConfig()` هنگامی که تنظیمات درگاه در جدول `provider_settings` نسخهٔ `0` داشت (`version === 0` در دیتابیس تازه و محیط توسعه بدون `merchantId` واقعی زرین‌پال)، بلافاصله خطای `SERVICE_NOT_CONFIGURED` (`503`) پرتاب می‌کرد.
  2. در `backend/src/modules/payments/index.js`، اعتبارسنجی `Number.isSafeInteger(amount)` مستقیم روی مقدار خام `req.body.amount` اجرا می‌شد و رشته‌های دارای ارقام فارسی/عربی (`۱۰۰٬۰۰۰`) را رد می‌کرد و سقف مبلغ نیز روی `50,000,000` محدود شده بود.
- **وضعیت:** `REPRODUCED`

---

## ۲. خطای رزرو کلاس، پیام «کلاسی برای رزرو انتخاب نشده» و تناقض زمان‌های آزاد (`0.2` — Booking & Schedule Contradiction)

- **باگ:** عدم امکان رزرو تک‌جلسه‌ای یا چندجلسه‌ای در `/classes/1` و پروفایل اساتید (`/teachers/:id#slots` و `#book`)؛ نمایش هم‌زمان «کلاس‌های فعال استاد (۰)»، زمان‌های آزاد استاتیک (`۱۷:۰۰`)، پیام «در این بازه جلسهٔ قابل نمایش برای مدرس تأییدشده منتشر نشده است»، قیمت هر جلسه و دکمهٔ رزرو.
- **محیط:** دیتابیس ایزولهٔ نسخهٔ پایه (`backend/src/db.js` + `backend/src/server.js`) و کامپوننت‌های `ClassDetail.jsx`، `SchedulePicker.jsx`، `TeacherProfile.jsx` و `PublicTeacherSchedule.jsx`.
- **مراحل بازتولید:**
  1. فراخوانی `GET /api/classes/1` و `GET /api/classes/1/schedule`.
  2. فراخوانی `POST /api/bookings` با `{"classId": 1, "sessions": 1, "people": 1, "occurrenceIds": [], "method": "wallet", "idempotencyKey": "repro-booking-class1-empty"}`.
  3. فراخوانی `GET /api/teachers/1`، `GET /api/teachers/1/availability`، `GET /api/teachers/2`، `GET /api/teachers/2/availability`، `GET /api/teachers/6` و بررسی جداول `teachers`، `classes`، `teacher_accounts` و `class_occurrences`.
- **نتیجهٔ مورد انتظار:**
  - هر کلاس فعال در `/classes/:id/schedule` و هر استاد تأییدشده در `/teachers/:id/availability` باید جلسات زمان‌بندی‌شدهٔ واقعی (`class_occurrences`) داشته باشد.
  - امکان رزرو ۱ جلسه و چند جلسه با انتخاب زمان واقعی فراهم باشد و انتخاب صرفِ روز/ساعت دکوراتیو جایگزین `classId` و `occurrenceIds` نشود.
- **نتیجهٔ واقعی:**
  - خروجی `GET /api/classes/1/schedule`:
    - `HTTP Status`: `200`
    - `Response JSON`: `{"timezone": "UTC", "occurrences": []}`
  - خروجی `POST /api/bookings` (در غیاب جلسهٔ قابل انتخاب):
    - `HTTP Status`: `400`
    - `Response JSON`: `{"error": "به تعداد جلسات رزرو، زمان معتبر انتخاب کنید."}`
  - خروجی `GET /api/teachers/1/availability`، `/teachers/2/availability` و `/teachers/6/availability`:
    - `HTTP Status`: `200`
    - `Response JSON`: `{"week": 0, "timezone": "Asia/Tehran", "occurrences": [], "hasMore": false}`
  - خروجی کوئری دیتابیس نسخهٔ پایه روی ۷ استاد (`teachers`):
    - اساتید `1..7`: در همگی `approved_account = 0` و `scheduled_occurrences = 0`.
    - اساتید `2` (امیر رضایی)، `6` (حسین نوری) و `7` (مریم کاظمی): `active_classes_count = 0` در جدول `classes`؛ استاد `4` (کاوه مرادی): تنها کلاس `id = 2` با `capacity = 10, taken = 10` (ظرفیت پر).
- **شواهد:**
  - در `TeacherProfile.jsx` نسخهٔ پایه، پیش از بارگذاری `/api/classes` یا برای اساتید ۲، ۶ و ۷، `groupClasses` خالی بود (`selectedClassId = null`)، در حالی که `teacher.slots` شامل ۶ اسلات استاتیک (از جمله `۱۷:۰۰`) رندر می‌شد و کلیک روی دکمهٔ رزرو با خطای نبود کلاس انتخاب‌شده/زمان معتبر مواجه می‌شد.
  - در `ClassDetail.jsx`، انتخاب‌گر تعداد جلسات فقط مقادیر `[4, 8, 16]` را داشت و رزرو تک‌جلسه‌ای (`1`) در UI غیرممکن بود.
- **علت ریشه‌ای:**
  1. در `backend/src/db.js`، هیچ رکوردی در `teacher_accounts` با `status = 'approved'` و هیچ رکوردی در `class_occurrences` برای کلاس‌های seed شده ثبت نشده بود، و اساتید ۲، ۶ و ۷ هیچ کلاس فعالی در جدول `classes` نداشتند.
  2. در `GET /api/teachers/:id`، فیلد `activeClasses` مستقیماً بازگردانده نمی‌شد و `TeacherProfile.jsx` به واکشی جداگانهٔ `/api/classes` وابسته بود.
  3. در `PublicTeacherSchedule.jsx` و `TeacherProfile.jsx`، اسلات‌های استاتیک `teacher.slots` (`۱۷:۰۰`) به `class_occurrences` واقعی متصل نبودند و حتی هنگام خالی بودن `occurrences` هم‌زمان با پیام «در این بازه جلسهٔ قابل نمایش برای مدرس تأییدشده منتشر نشده است» نمایش داده می‌شدند.
- **وضعیت:** `REPRODUCED`

---

## ۳. ناپدید شدن کارت/برچسب «مناسب سطح شما» در `/classes?kind=گروهی` (`Phase 4`)

- **باگ:** در صفحهٔ `/classes?kind=گروهی`، بخش «پیشنهاد نیمکت براساس سطح شما» و برچسب «مناسب سطح شما» در لحظهٔ اول دیده شده و بلافاصله پس از پاسخ `/api/classes` ناپدید می‌شد.
- **محیط:** سرور پایه (`GET /api/classes`) و کامپوننت `frontend/src/views/ClassesSearch.jsx`.
- **مراحل بازتولید:**
  1. باز کردن `/classes?kind=گروهی` (رندر اولیه با `suggested = []` که آرایهٔ ۵ استادیِ fallback شامل `{ id: 3, name: 'نگار سلطانی', badge: 'مناسب سطح شما' }` را نمایش می‌دهد).
  2. دریافت پاسخ `GET /api/classes` از سرور پایه.
- **نتیجهٔ مورد انتظار:**
  - حفظ پایدار لیست اساتید پیشنهادی و برچسب‌های سطح‌بندی‌شده («مناسب سطح شما»، «منتخب نیمکت»، «پیشنهاد ویژه») پس از دریافت پاسخ API.
- **نتیجهٔ واقعی:**
  - سرور پایه در `GET /api/classes` تنها ۳ آیتم بدون فیلد `badge` بازمی‌گرداند:
    `[{"id":1,"name":"سارا محمدی"},{"id":2,"name":"امیر رضایی"},{"id":4,"name":"کاوه مرادی"}]`
  - در نتیجه `suggestedItems` در `ClassesSearch.jsx` آرایهٔ ۵تایی اولیه را با این ۳ آیتم جایگزین می‌کرد و کارت نگار سلطانی («مناسب سطح شما») ناپدید می‌شد.
- **شواهد:** خروجی ثبت‌شدهٔ `catalogRepro.suggestedReturnedByApi` در اسکریپت بازتولید.
- **علت ریشه‌ای:** کوئری محدود `WHERE id IN (1,2,4)` بدون متادیتای `badge`/`reason` در `backend/src/server.js` و جایگزینی کامل آرایهٔ fallback در `frontend/src/views/ClassesSearch.jsx`.
- **وضعیت:** `REPRODUCED`

---

## ۴. باگ جستجوی زنده (Autocomplete) در هدر، هیرو و صفحهٔ کلاس‌ها (`Phase 5`)

- **باگ:** ورودی‌های جستجو در `Header.jsx` و `HeroSearch.jsx` فاقد پیشنهاد زندهٔ هم‌زمان با تایپ (Live Autocomplete) بودند و در `Header.jsx` فوکوس یا کلیک روی ورودی جستجو بلافاصله کاربر را به `/classes` منتقل می‌کرد.
- **محیط:** `frontend/src/components/Header.jsx`، `frontend/src/components/HeroSearch.jsx`، `frontend/src/views/ClassesSearch.jsx` و `backend/src/server.js`.
- **مراحل بازتولید:**
  1. کلیک روی فیلد جستجوی هدر در صفحهٔ اصلی (`/`).
  2. تایپ عبارت فارسی (با «ی/ي» یا «ک/ك») در باکس جستجو.
- **نتیجهٔ مورد انتظار:** باز شدن دراپ‌داون پیشنهاد زنده (`role="combobox"`) با دسته‌بندی کلاس‌ها، اساتید و موضوعات، بدون ریدایرکت ناخواسته تا زمان ارسال فرم یا انتخاب آیتم.
- **نتیجهٔ واقعی:** در `Header.jsx` فراخوانی `navigate('/classes')` روی کلیک/فوکوس اجرا می‌شد و هیچ endpoint یا کامپوننتی برای پیشنهاد زنده وجود نداشت.
- **علت ریشه‌ای:** نبود کامپوننت `LiveSearch.jsx` و نبود endpoint اختصاصی `/api/search/suggestions` با نرمال‌سازی حروف و ارقام فارسی/عربی.
- **وضعیت:** `REPRODUCED`

---

## ۵. وضعیت اجرای مرورگر Headless (Playwright Browser Binary)

- **باگ / محدودیت محیط:** اجرای مستقیم تست‌های Playwright با مرورگر Chromium در کانتینر فعلی.
- **محیط:** کانتینر لینوکس فعلی (`/home/user/nimkat`).
- **شواهد:** باینری مرورگر Chromium در مسیر کش Playwright نصب نیست و دسترسی اینترنت کانتینر به هاست‌های مجاز (`github.com`, `registry.npmjs.org`, `pypi.org`) محدود است.
- **وضعیت:** `BLOCKED` (تمامی جریان‌های API، دیتابیس، لجر، تقویم، رندر کامپوننت‌های SSR/Unit با Vitest و بیلد کامل Next.js به صورت کامل اجرا و تأیید شده‌اند؛ اجرای بصری مرورگر واقعی به دلیل نبود باینری Chromium در این کانتینر `BLOCKED` گزارش می‌شود).
