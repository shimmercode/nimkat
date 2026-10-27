# فهرست کامل فایل‌های ایجادشده و تغییریافته (Modified Files Changelog)

- **تاریخ ثبت:** ۱۴۰۵/۰۸/۰۵ (۲۰۲۶-۱۰-۲۷)
- **آرشیو مبنا:** `/home/user/nimkat/nimkat-1.7.0-audited.zip` (`777` مدخل)
- **آرشیو خروجی ارتقایافته:** `/home/user/nimkat/audit-reports/ui-ux-upgrade/nimkat-1.7.0-ui-ux-upgraded.zip` (`778` مدخل، SHA-256: `5618032799d2be4c3ddb31027377254c68a8068657265898401b2b9ce31e338c`)
- **تغییرات وابستگی‌ها (`package.json` / `package-lock.json`):** **صفر تغییر** (هیچ کتابخانهٔ اضافی یا تکراری نصب نشده است).
- **تغییرات بک‌اند (`backend/**`):** **صفر تغییر** (تمامی APIها، منطق کسب‌وکار، دیتابیس، احراز هویت و پرداخت ۱۰۰٪ دست‌نخورده حفظ شده‌اند).

---

## ۱. فایل جدید ایجادشده (۱ فایل)

| ردیف | مسیر فایل در آرشیو | توضیح و دلیل ایجاد |
|---|---|---|
| ۱ | `nimkat/frontend/src/components/ui/design-system.jsx` | ماژول کامپوننت‌های مشترک Design System نیمکت شامل ۱۰ کامپوننت استاندارد و دسترس‌پذیر: `DsButton`، `DsBadge`، `DsAlert`، `DsEmptyState`، `DsLoadingState`، `DsKpiCard`، `DsDialog`، `DsTabs`، `DsTooltip` و `DsTable` با پشتیبانی کامل از RTL، ارقام فارسی و `prefers-reduced-motion`. |

---

## ۲. فایل‌های ویرایش‌شده (۱۴ فایل)

| ردیف | مسیر فایل در آرشیو | اولویت مرتبط | خلاصه تغییرات و دلیل فنی هر تغییر |
|---|---|---|---|
| ۱ | `nimkat/frontend/src/styles/interactions.css` | Phase 2, 3, 4 | ۱) افزودن استایل‌های کامل Design System (`.nk-ds-alert`، `.nk-ds-empty`، `.nk-ds-skeleton`، `.nk-ds-kpi`، `.nk-ds-dialog`، `.nk-ds-tabs`، `.nk-ds-tooltip`، `.nk-btn-spinner`، `.nk-live-dot`). ۲) استایل‌دهی کپسولی `.nk-header-wallet-btn` در هدر پنل. ۳) ارتقای استایل‌های `.schedule-picker`، `.teaching-card`، `.operations-table` و `.nimchat-report`. ۴) افزودن انیمیشن نرم ورود پیام چت (`nk-msg-enter` در `160ms`). ۵) اصلاح چیدمان واکنش‌گرای موبایل برای `.p-grid-2 > *`، `.panel-top .inner`، بنر پروفایل و `.tip-band` و اصلاح `.sr-only` در حالت RTL. ۶) تکمیل قوانین `@media (prefers-reduced-motion: reduce)` با حفظ صفر مورد `transition: all`. |
| ۲ | `nimkat/frontend/src/utils/toast.js` | Phase 2 & 4 | ارتقای دسترس‌پذیری سیستم اعلان (Toast) با افزودن `role="region"`، `aria-label="اعلان‌های سیستم"` و `aria-live="polite"` به میزبان `#nimkat-toast-host` و افزودن `role="alert"` (برای خطاها) و `role="status"` (برای پیام‌های عادی) به هر اعلان. |
| ۳ | `nimkat/frontend/src/components/SchedulePicker.jsx` | اولویت A (رزرو کلاس) | افزودن هدر شمارندهٔ جلسات فعال با نشان سبز، افزودن اسکلتون بارگذاری در کنار متن استاندارد `در حال دریافت زمان‌های واقعی…`، کارت وضعیت خالی ساختاریافته، و هایلایت ردیف انتخاب‌شده (`is-selected`) همراه با نشان ظرفیت باقی‌ماندهٔ هر جلسه با حفظ کامل `<input type="radio" name="occurrenceId">`. |
| ۴ | `nimkat/frontend/src/views/ClassDetail.jsx` | اولویت A (رزرو کلاس) | ۱) اصلاح مسیر راهنما (Breadcrumb) از متن ثابت به عنوان و نوع واقعی کلاس (`{classTitle} · {kindLabel}`). ۲) پویاسازی نشانگر مراحل رزرو (`گام ۱ از ۳` تا `گام ۳ از ۳`) بر اساس انتخاب جلسه و پرداخت. ۳) نمایش تاریخ و ساعت واقعی جلسهٔ انتخاب‌شده در پیش‌نمایش «زمان جلسه‌ی اول». ۴) افزودن هشدار کسری موجودی کیف پول پیش از پرداخت و افزودن Spinner و حالت `aria-busy` به دکمهٔ پرداخت (`data-testid="pay-btn"`). |
| ۵ | `nimkat/frontend/src/views/panel/Finance.jsx` | اولویت B (کیف پول و پرداخت) | ۱) افزودن ۳ کارت شاخص کلیدی (`DsKpiCard`) برای موجودی قابل استفاده، رزروهای ثبت‌شده و گردش دفتر کل. ۲) افزودن پیش‌نمایش لحظه‌ای مبلغ شارژ به تومان (`معادل ... تومان`) هنگام تایپ در فیلد مبلغ. ۳) استفاده از `DsAlert`، `DsLoadingState` (بدون پاک‌کردن دادهٔ قبلی در بروزرسانی مجدد) و `DsEmptyState`. ۴) افزودن Spinner به دکمه‌های شارژ، درخواست بازپرداخت و داوری ادمین. |
| ۶ | `nimkat/frontend/src/views/PaymentResult.jsx` | اولویت B (کیف پول و پرداخت) | افزودن هدر وضعیت معنایی (`paid` سبز، `cancelled`/`failed` قرمز، `pending` نارنجی)، کارت‌های خلاصهٔ ۳ ستونی تراکنش (مبلغ، کد مرجع، وضعیت دفتر کل)، `DsAlert` برای پیام‌های خطا و نوار دکمه‌های اقدام سریع. |
| ۷ | `nimkat/frontend/src/views/panel/Family.jsx` | اولویت C (داشبورد والد و خانواده) | بازطراحی کامل رابط کاربری پنل والد (`/parent`) و بخش خانوادهٔ شاگرد (`/panel/family`) با افزودن بنر هدر نقش‌محور، دکمهٔ کپی کد دعوت ۳۲ نویسه‌ای، کارت‌های چک‌باکس مجوزها، چیپ‌های وضعیت (`فعال` / `لغو شده`) و گزارش‌های مجاز با حفظ دقیق تمام کنترل‌ها و نام فیلدها (`name="token"`, `name="scopes"`, `name="consent"`, `.nimchat-report`). |
| ۸ | `nimkat/frontend/src/layouts/PanelLayout.jsx` | اولویت C (داشبوردهای نقش‌محور) | ۱) اصلاح تمام لینک‌های منوی کناری (`STUDENT_NAV`, `TEACHER_NAV`, `PARENT_NAV`, `ADMIN_NAV`) به مسیرهای واقعی موجود در App Router (`/contact`، `/teacher/calendar`، `/teacher#reviews`، `/teacher/application`، `/admin/finance`) که باعث حذف کامل خطاهای `404` هنگام Prefetch در دسکتاپ شد. ۲) عدم نمایش لینک کیف پول شاگرد در هدر پنل والد (`!isParent`). |
| ۹ | `nimkat/frontend/src/views/panel/StudentHome.jsx` | اولویت C (داشبورد شاگرد) | یکپارچه‌سازی کلاس `.sr-only` روی المان‌های وضعیت خوانندهٔ صفحه جهت جلوگیری از سرریز ۱ پیکسلی در حالت RTL موبایل (`375×812`). |
| ۱۰ | `nimkat/frontend/src/views/panel/Chat.jsx` | اولویت D (چت و کلاس آنلاین) | افزودن نشانگر وضعیت اتصال زنده با نقطهٔ پالس (`.nk-live-dot`) در پنل کناری و هدر گفتگو برای نمایش شفاف وضعیت‌های `متصل`، `در حال اتصال مجدد…` و `در حال اتصال…`. |
| ۱۱ | `nimkat/frontend/src/views/Analytics.jsx` | اولویت F (پنل ادمین) | افزودن ۴ کارت `DsKpiCard` برای خلاصهٔ شاخص‌های واقعی ۳۶۵ روز اخیر (رزروهای قطعی، خریداران یکتا، حجم کل خرید، بازپرداخت به کیف پول) و ارتقای استایل جدول کوهورت و کارت‌های تعریف شاخص‌ها با حفظ کامل تگ `<dl>`. |
| ۱۲ | `nimkat/frontend/src/views/Integrations.jsx` | اولویت F (پنل ادمین) | قرار دادن ۱۱ لینک ناوبری پنل ادمین در شبکهٔ منظم `.nk-admin-nav-grid`، افزودن هدر با شمارندهٔ سرویس‌های پیکربندی‌شده، نمایش وضعیت هر سرویس با `DsBadge` و حذف رنگ هاردکدشدهٔ `#D9E1DE`. |
| ۱۳ | `nimkat/frontend/src/components/ui/twenty-first/SOURCES.md` | مستندات فنی | مستندسازی کامپوننت‌های جدید ماژول `src/components/ui/design-system.jsx` و الگوهای طراحی بومی‌سازی‌شده. |
| ۱۴ | `nimkat/frontend/tests/unit/motion-and-polish.test.ts` |Phase 7 (تست‌ها) | افزودن تست واحد `Shared Design System primitives render accessible RTL roles, loading states, KPI cards, and tables` برای بررسی رندر و ویژگی‌های دسترس‌پذیری تمام کامپوننت‌های `design-system.jsx`. |
