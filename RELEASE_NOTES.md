# RELEASE_NOTES.md — یادداشت تغییرات نسخهٔ تکمیلی (UI/UX, Motion Stability, Jalali Calendar & Security)

**تاریخ انتشار بسته:** ۱۴۰۵/۰۸/۰۴ (`2026-10-26`)
**بستهٔ تحویلی نهایی:** `nimkat-complete-ui-ux-stability-final.zip`

---

## ۱. خلاصهٔ دستاوردها و تغییرات کلیدی

### الف) تقویم شمسی حرفه‌ای برای دانش‌آموز و مدرس (`Calendar.jsx`، `persian-calendar.js`، `SchedulePicker.jsx`، `scheduling/*`)
- پیاده‌سازی موتور کامل تقویم هجری شمسی (`persianMonthGrid` و `toPersianDateParts`) در منطقه زمانی رسمی `Asia/Tehran` با شروع هفته از **شنبه** و محاسبهٔ دقیق ماه‌های ۲۹، ۳۰ و ۳۱ روزه و سال‌های کبیسه.
- افزودن ۴ نمای کاربردی در تقویم پنل دانش‌آموز و مدرس (`/panel/calendar` و `/teacher/calendar`): **نمای ماهانه (گرید ۷ ستونه)**، **نمای هفتگی**، **نمای روزانه** و **نمای فهرست**.
- افزودن نوار شاخص‌های کلیدی (KPI) بالای تقویم (کل جلسات ماه، جلسات پیش رو، برگزارشده، رزروشده/آزاد و لغوشده) و راهنمای رنگ‌بندی وضعیت‌ها (Legend).
- افزودن نقاط انتهایی بک‌اند برای تقویم مدرس (`GET /api/teacher/schedule/classes`، `POST /api/teacher/schedule/occurrences` و `POST /api/teacher/schedule/occurrences/:id/cancel`) با بررسی اتمیک تداخل زمانی و فاصلهٔ رفت‌وآمد (`checkSlot`) و حفظ کامل حریم خصوصی دانش‌آموزان در `GET /api/calendar`.
- ارتقای `SchedulePicker.jsx` برای نمایش دقیق روز هفته، تاریخ شمسی، ساعت تهران و مدت جلسه به دقیقه.

### ب) پایداری حرکتی (Motion Stability) و حذف کامل پرش‌های صفحه و CLS
- بازنویسی `PageTransition.jsx`: حذف آرایهٔ کلیدواژه‌ای `y: [8, 0]` و حذف `transform` روی `<motion.main>` جهت جلوگیری از پرش Hydration و حفظ عملکرد صحیح `position: sticky` در سایدبارها و باکس‌های رزرو.
- بازنویسی `PageRenderer.jsx`: حذف `whileInView` بازگشتی از گره‌های تودرتو (`depth > 0`)، ایزوله‌سازی کامل بوم ویرایشگر (`edit === true`)، و پیاده‌سازی `PublicRevealWrap` یک‌باره فقط برای سکشن‌های سطح اول پایین‌تر از خط تا.
- حذف پرش ارتفاع (CLS) در `BlogTeasers.jsx` با رندر اسکلت ۳ کارتهٔ هم‌اندازه (`.mag-card-skeleton`) در زمان بارگذاری اولیه.
- جلوگیری از Re-render تکراری پس از Hydration در `PublishedPage.jsx` و `Home.jsx` و جلوگیری از فروپاشی ارتفاع (Height Collapse) در `Calendar.jsx`، `Finance.jsx`، `Materials.jsx` و `PublicTeacherSchedule.jsx`.

### ج) ارتقای سیستم استایل، دسترس‌پذیری و امنیت وابستگی‌ها
- حذف تمام ۱۴ مورد `transition: all` در `frontend/src/styles/global.css` و جایگزینی با ویژگی‌های صریح (`transform`، `opacity`، `background-color`، `border-color`، `color`، `box-shadow`) و توکن‌های حرکتی یکپارچه (`--motion-fast`، `--motion-normal`، `--motion-slow`).
- تبدیل انیمیشن `.toggle::after` از ویژگی چیدمانی `right` به `transform: translate3d(-20px, 0, 0)` و تثبیت حاشیهٔ `1px` کارت‌های فعال با `box-shadow: 0 0 0 1px`.
- تعریف استایل‌های `:focus-visible` و پشتیبانی کامل از `@media (prefers-reduced-motion: reduce)`.
- رفع آسیب‌پذیری امنیتی `body-parser` (`GHSA-27r3-jxmh-p828`) در `backend/package-lock.json` و رساندن خروجی `npm audit` به `0 vulnerabilities` در هر دو بخش فرانت‌اند و بک‌اند.
