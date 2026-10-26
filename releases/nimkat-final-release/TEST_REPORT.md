# TEST_REPORT.md — گزارش واقعی اجرای تست‌ها، بیلد و راستی‌آزمایی

**تاریخ اجرا:** ۱۴۰۵/۰۸/۰۴ (`2026-10-26`)

---

## ۱. خلاصهٔ دستورات اجراشده و نتایج واقعی

| سطح بررسی | دستور اجراشده | نتیجهٔ واقعی | جزئیات |
|---|---|---|---|
| **تست‌های واحد و رگرسیون فرانت‌اند (Vitest)** | `cd frontend && npx vitest run` | **PASS (`35/35` تست در `7/7` فایل)** | شامل `api-session.test.ts` (۵ تست)، `motion-and-polish.test.ts` (۸ تست جدید)، `product-recovery.test.ts` (۶ تست)، `persian-calendar.test.ts` (۴ تست جامع تقویم شمسی و کبیسه)، `page-content.test.ts` (۸ تست)، `editor-markup.test.ts` (۲ تست)، `login-input.test.ts` (۲ تست). |
| **بیلد تولیدی و Type Check فرانت‌اند** | `cd frontend && npm run build` (`next build --webpack`) | **PASS (`0` خطا · `58/58` مسیر)** | کامپایل کامل وب‌پک، بررسی TypeScript در `576ms` بدون خطا، و تولید ۴۷ صفحهٔ استاتیک و ۱۱ مسیر داینامیک SSR. |
| **تست‌های واحد و یکپارچهٔ بک‌اند (Node Test Runner)** | `cd backend && npm test` (`node --test tests/*.test.js`) | **PASS (`119/119` تست، `0` شکست)** | شامل `auth.test.js`، `backup.test.js`، `club.test.js`، `content.test.js`، `material-scanner.test.js`، `onboarding.test.js`، `product-recovery.test.js` (به همراه تست جدید تقویم مدرس) و `services.test.js`. |
| **ممیزی امنیتی وابستگی‌ها (`npm audit`)** | `cd backend && npm audit` و `cd frontend && npm audit` | **PASS (`0 vulnerabilities`)** | آسیب‌پذیری `body-parser` (`GHSA-27r3-jxmh-p828`) در بک‌اند برطرف شد؛ هر دو پروژه `found 0 vulnerabilities` گزارش می‌دهند. |
| **بررسی زندهٔ سرورها و پاسخ SSR (`HTTP 200`)** | درخواست HTTP زنده به ۲۵ مسیر اصلی روی `:5175` و `:8000` | **PASS (`25/25` مسیر `HTTP 200`)** | بررسی صحت رندر SSR، نبود استایل پرش `translateY(8px)` یا `translateY(12px)` و سلامت `/api/health`. |
| **تست‌های مرورگر Playwright E2E** | `npx playwright test` | **اجرا نشد (محدودیت محیط سندباکس)** | فایل‌های تست در `frontend/tests/e2e/*.spec.ts` کامل هستند اما باینری مرورگر Chromium در کانتینر کش نشده و دانلود از `cdn.playwright.dev` توسط فایروال خروجی سندباکس مسدود است. قراردادهای DOM مورد نیاز E2E در تست‌های واحد و خروجی SSR بررسی و تأیید شدند. |

---

## ۲. تفکیک تست‌های جدید اضافه‌شده در این مرحله

1. **`frontend/tests/unit/motion-and-polish.test.ts` (۸ تست جدید):**
   - بررسی رندر اولیهٔ `PageTransition` بدون `translateY` و بدون افت Opacity در SSR/Hydration + بررسی پشتیبانی از `useReducedMotion`.
   - بررسی حفظ ساختار `.pb-page .eb-wrap > div` و نبود انیمیشن روی بوم ویرایشگر (`edit={true}`) در `PageRenderer`.
   - بررسی حذف `whileInView` بازگشتی، ثابت ماندن ویجت‌های تمام‌صفحه (`STATIC_TOP_BLOCKS`) و عدم ثبت لیسنر `resize` در حالت عمومی `PageRenderer`.
   - بررسی رندر اسکلت ۳ کارتهٔ `.mag-card-skeleton` در `BlogTeasers` برای جلوگیری از CLS در صفحهٔ اصلی.
   - بررسی محافظت از State تکراری و جلوگیری از فروپاشی ارتفاع در `PublishedPage`، `Home`، `Calendar`، `Finance`، `Materials` و `PublicTeacherSchedule`.
   - بررسی نبود هرگونه `transition: all` در تمامی فایل‌های CSS و وجود توکن‌های حرکتی و قوانین `prefers-reduced-motion: reduce`.
   - بررسی رندر کامل گرید ماهانهٔ تقویم شمسی (`Calendar.jsx`) از شنبه تا جمعه، سوییچر نماها (`نمای ماهانه`، `نمای هفتگی`، `نمای روزانه`، `نمای فهرست`) و راهنمای وضعیت‌ها.
   - بررسی محافظ شمارندهٔ یکنواخت درخواست‌ها (`requestSeqRef` و `seq === requestSeqRef.current`) در `Calendar.jsx` و `SchedulePicker.jsx` برای جلوگیری از بازنویسی داده‌های ماه جدید توسط پاسخ‌های دیررس قبلی.
2. **`frontend/tests/unit/persian-calendar.test.ts` (ارتقا از ۱ به ۴ تست جامع):**
   - بررسی مرزهای ماه‌های شمسی در نیمه‌شب تهران (`20:30:00Z`).
   - بررسی دقیق سال کبیسهٔ ۱۴۰۳ (اسفند ۳۰ روزه) در برابر سال غیرکبیسهٔ ۱۴۰۴ (اسفند ۲۹ روزه) و انتقال سال به فروردین ۱۴۰۴ (۳۱ روزه).
   - بررسی نگاشت روزهای هفته با شروع از شنبه (`شنبه = 0` تا `جمعه = 6`) و جلسات نزدیک نیمه‌شب تهران (`23:59:59` در برابر `00:00:01`).
   - بررسی تبدیل ورودی تاریخ/ساعت تهران (`tehranInputToUtcMs`) به UTC و محاسبهٔ مدت جلسه (`formatTehranTimeRange`).
3. **`backend/tests/product-recovery.test.js` (تست یکپارچهٔ جدید تقویم مدرس):**
   - بررسی `GET /api/teacher/schedule/classes`، انتشار جلسهٔ جدید توسط مدرس تأییدشده (`POST /api/teacher/schedule/occurrences`)، رد تداخل زمانی با کد `409`، لغو جلسهٔ بدون رزرو (`POST /api/teacher/schedule/occurrences/:id/cancel`) و حفظ محرمانگی اطلاعات دانش‌آموزان در `GET /api/calendar`.
