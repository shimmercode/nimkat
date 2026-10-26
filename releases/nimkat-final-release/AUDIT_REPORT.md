# AUDIT_REPORT.md — گزارش جامع ممیزی فنی، UI/UX، Motion و امنیت پلتفرم نیمکت (Nimkat)

**تاریخ ممیزی:** ۱۴۰۵/۰۸/۰۴ (`2026-10-26` · منطقه زمانی: `Asia/Tehran`)
**شاخهٔ فعال کاری:** `arena/4f156d38-nimkat` (بدون انجام هیچ‌گونه Commit/Push/PR/Release جدید طبق دستور صریح)

---

## ۱. وضعیت اولیه و معماری واقعی پروژه

- **فرانت‌اند (`frontend/`):** Next.js `16.4.2` (App Router + Webpack)، React `19.3.1`، TypeScript `7.0.2`، Tailwind CSS `4.3.3` (با پیشوند `tw:` در کنار سیستم استایل اختصاصی `global.css`، `interactions.css`، `responsive.css` و `community.css`)، Radix UI (`@radix-ui/react-dialog`، `@radix-ui/react-navigation-menu`) و Motion (`14.4.0`).
- **بک‌اند (`backend/`):** Node.js (`v22.22.3` در محیط فعلی) + Express `5.3.0` + `better-sqlite3` `13.0.3` (در حالت `WAL` با تراکنش‌های اتمیک `db.transaction`) + `sharp` `0.35.5` (پردازش امن تصاویر و حذف متادیتا).
- **مسیرهای واقعی برنامه:** ۵۸ مسیر در Next.js App Router (شامل صفحات عمومی، کاتالوگ کلاس‌ها و اساتید، پروفایل استاد، صفحهٔ تک‌کلاس، ورود OTP، پنل دانش‌آموز، پنل مدرس، پنل والد، پنل مدیریت، نیم‌چت، نیمکت کلاب، مجله آموزشی، صفحه‌ساز بصری `/editor/[slug]` و مسیرهای حقوقی/سئو) و بیش از ۶۵ نقطهٔ انتهایی REST در `/api/*`.

---

## ۲. فهرست مشکلات واقعی شناسایی‌شده، شدت و علت ریشه‌ای

| شناسه | شدت | مسیر فایل | شرح مشکل و علت ریشه‌ای | وضعیت و اصلاح انجام‌شده |
|---|---|---|---|---|
| **M-01** | **Critical** | `frontend/src/components/PageTransition.jsx` | ترکیب `initial={false}` با آرایهٔ کلیدواژه‌ای `animate={{ opacity: [.8, 1], y: [8, 0] }}` روی `<motion.main>` باعث پرش عمودی `8px` بلافاصله پس از Hydration کلاینت و در هر تغییر مسیر می‌شد و اعمال `transform` روی والد `<main>` رفتار `position: sticky` باکس‌های رزرو و فیلترها را مختل می‌کرد. | **برطرف شد:** حذف کامل `y`، تشخیص رندر اولیه با `hasNavigatedRef` (بدون انیمیشن در SSR/Hydration)، اجرای Fade ملایم `180ms` فقط در ناوبری‌های کلاینت، و پشتیبانی کامل از `useReducedMotion()`. |
| **M-02** | **Critical** | `frontend/src/render/PageRenderer.jsx` | کامپوننت `EditWrap` در حالت عمومی (`!edit`) تمام گره‌های درخت صفحه‌ساز را در تمام اعماق (`depth >= 0`) داخل `<motion.div whileInView={{ opacity: [.85, 1], y: [12, 0] }}>` قرار می‌داد و باعث پرش چندلایه (`12px × depth`)، تکان خوردن Hero و ویجت‌های کاربردی پس از SSR، و ثبت لیسنر `resize` غیرضروری در حالت عمومی می‌شد. | **برطرف شد:** حذف کامل `whileInView` بازگشتی، ایزوله‌سازی کامل بوم ادیتور (`edit === true`)، پیاده‌سازی `PublicRevealWrap` یک‌باره (`once`) صرفاً برای سکشن‌های سطح اول (`depth === 0 && index > 0`) پایین‌تر از خط تا، و محدودسازی لیسنر `resize` به حالت ادیتور. |
| **M-03** | **High** | `frontend/src/components/BlogTeasers.jsx` | در حالت `loading === true` یک خط متن وضعیت (`~60px`) رندر می‌شد که پس از دریافت `/api/blog` به گرید ۳ ستونهٔ کارت‌ها (`~390px`) تبدیل می‌شد و بیش از `330px` پرش چیدمان (CLS) در صفحهٔ اصلی ایجاد می‌کرد. | **برطرف شد:** جایگزینی با اسکلت ۳ کارتهٔ هم‌ارتفاع `.mag-card-skeleton` در `.grid-3` همراه با `role="status"` و `aria-busy="true"`. |
| **M-04** | **High** | `frontend/src/render/PublishedPage.jsx` و `frontend/src/views/Home.jsx` | فراخوانی بدون شرط `setResult` / `setPubSchema` پس از دریافت `/api/pages/*` حتی زمانی که اسکیمای کلاینت با اسکیمای SSR یکسان بود، باعث Re-render تکراری کل صفحه می‌شد. | **برطرف شد:** افزودن مقایسهٔ ساختاری (`JSON.stringify(prev) === JSON.stringify(next)`) پیش از به‌روزرسانی State. |
| **M-05** | **High** | `Calendar.jsx`، `SchedulePicker.jsx`، `Finance.jsx`، `Materials.jsx`، `PublicTeacherSchedule.jsx` | فراخوانی هم‌زمان `setData(null)` یا `setItems(null)` هنگام تغییر ماه/هفته/صفحه یا فیلتر جلسه باعث حذف کامل کارت‌های موجود و فروپاشی ارتفاع صفحه (Height Collapse) می‌شد؛ همچنین نبود شمارندهٔ یکنواخت درخواست (`requestSeqRef`) در تابع بارگذاری دستی `Calendar.jsx` و `SchedulePicker.jsx` می‌توانست هنگام تعویض سریع ماه/برنامه باعث بازنویسی دادهٔ جدید توسط پاسخ دیررس قبلی شود. | **برطرف شد:** حذف `setData(null)` / `setItems(null)` در جابه‌جایی بازه‌ها، مدیریت وضعیت `reloading` بدون پرش ارتفاع، و افزودن محافظ `requestSeqRef` (`seq === requestSeqRef.current`) در `Calendar.jsx` و `SchedulePicker.jsx`. |
| **C-01** | **High** | `frontend/src/views/panel/Calendar.jsx`، `persian-calendar.js`، `backend/src/modules/scheduling/` | تقویم پنل دانش‌آموز و مدرس صرفاً یک لیست ساده از کارت‌ها بود و فاقد گرید ماهانهٔ شمسی (شنبه تا جمعه)، نمای هفتگی و روزانه، نشانگر روز جاری و تراکم جلسات، فیلتر شیوهٔ برگزاری، و امکان ثبت/لغو بازه‌های آزاد توسط مدرس تأییدشده بود. | **برطرف شد:** پیاده‌سازی کامل `persianMonthGrid`، گرید ماهانه/هفتگی/روزانهٔ شمسی، خلاصهٔ آماری، راهنمای وضعیت‌ها (Legend)، فیلترهای کامل، و نقاط انتهایی `/api/teacher/schedule/*` با بررسی تداخل در بک‌اند. |
| **S-01** | **High** | `backend/package-lock.json` (`body-parser`) | آسیب‌پذیری امنیتی `GHSA-27r3-jxmh-p828` (CVSS 7.5 — Denial of Service) در وابستگی غیرمستقیم `body-parser < 2.4.0`. | **برطرف شد:** ارتقای امن `body-parser` در `backend/package-lock.json`؛ خروجی `npm audit` در بک‌اند و فرانت‌اند به `0 vulnerabilities` رسید. |
| **U-01** | **Medium** | `frontend/src/styles/global.css` و `interactions.css` | وجود ۱۴ مورد `transition: all`، انیمیشن ویژگی چیدمانی `right` در `.toggle::after`، و تغییر عرض حاشیه از `1px` به `1.5px` در `.gc-mini.is-active` و `.level-card.is-now` / `.is-goal`. | **برطرف شد:** جایگزینی تمام ۱۴ مورد با ویژگی‌های صریح (`transform`، `opacity`، `background-color`، `border-color`، `box-shadow`)، تبدیل `.toggle::after` به `translate3d(-20px, 0, 0)`، و تثبیت حاشیهٔ `1px` با `box-shadow: 0 0 0 1px`. |

---

## ۳. محدودیت‌ها و وابستگی‌های خارجی مستندشده

1. **سرویس پیامک واقعی (SMS Provider برای OTP در محیط Production):** در محیط توسعه کد تأیید از مسیر آزمایشی (`devCode`) برگردانده می‌شود؛ در حالت `NODE_ENV=production` سرور بدون پیکربندی آداپتور پیامک واقعی و `NIMKAT_SECRET` به صورت Fail-Closed عمل می‌کند.
2. **درگاه پرداخت بانکی (Zarinpal) و اتاق کلاس آنلاین (Skyroom / BigBlueButton):** در پنل مدیریت (`/admin/integrations`) با رمزنگاری AES-256-GCM قابل پیکربندی هستند؛ تا پیش از ثبت کلیدهای تجاری واقعی، پرداخت در حالت Sandbox/کیف پول و ورود به کلاس به صورت Fail-Closed بررسی می‌شود.
3. **اسکنر آنتی‌ویروس ClamAV (`TCP/3310` INSTREAM):** بارگذاری فایل‌های آموزشی در `/api/materials/:occurrenceId` پیش از انتشار نیازمند پاسخ پاک (`stream: OK`) از سرویس ClamAV است و در صورت عدم اتصال سرویس ClamAV، به صورت ایمن (Fail-Closed با کد `503`) از انتشار فایل اسکن‌نشده جلوگیری می‌کند.
4. **مرورگر Headless برای اجرای زندهٔ Playwright E2E در سندباکس:** رانر `@playwright/test` نصب است اما دانلود باینری Chromium از `cdn.playwright.dev` توسط فایروال خروجی سندباکس مسدود است.
