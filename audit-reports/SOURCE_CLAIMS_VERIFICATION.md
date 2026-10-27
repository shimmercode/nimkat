# گزارش تطبیق مستندات با سورس واقعی و Diff نسبت به نسخهٔ پایه (Stage 1 — SOURCE_CLAIMS_VERIFICATION)

مقایسهٔ مستقیم کدهای استخراج‌شده از `/tmp/nimkat-independent-audit/extracted/nimkat` با نسخهٔ پایه (`/tmp/nimkat-repro-baseline/nimkat`) و بررسی خط‌به‌خط فایل‌ها و توابع انجام شد.

---

## ۱. وضعیت فایل‌های کلیدی و Diff نسبت به نسخهٔ پایه

| مسیر واقعی در بسته | وضعیت نسبت به نسخهٔ پایه | اندازه (بایت) | خطوط Diff | توابع / بخش‌های پیاده‌سازی‌شده در سورس واقعی |
|---|---|---:|---:|---|
| `backend/src/modules/settings/providers.js` | `MODIFIED` | `6,488` | `166` | `resolveOrigin`, `gatewayMode`, `paymentConfig` (پشتیبانی کنترل‌شده از `local_dev` در محیط غیر Production هنگام `version === 0`)، `createPaymentRequest`, `verifyPaymentRequest` |
| `backend/src/modules/payments/index.js` | `MODIFIED` | `21,776` | `128` | `normalizeAmountToman` (تبدیل ارقام فارسی/عربی و جداکننده‌ها)، `paymentView`, `/api/wallet/charge`, `/api/payments/callback/:id` (پشتیبانی از `?format=json` و محاسبهٔ `Math.floor(walletBalance(uid)/10)`)، بازگرداندن `sessions` در `/api/bookings` |
| `backend/src/modules/payments/refunds.js` | `MODIFIED` | `8,300` | `39` | `releaseBookingHold` (آزادسازی صندلی در صورت لغو/خطای پرداخت یا انقضای Hold) |
| `backend/src/modules/scheduling/index.js` | `MODIFIED` | `11,825` | `10` | جداسازی رکوردهای اولیهٔ `teacher_accounts` دارای `submission_id IS NULL` هنگام تأیید درخواست تدریس جدید در پنل ادمین |
| `backend/src/db.js` | `MODIFIED` | `34,486` | `37` | تکمیل seed کلاس‌های `6..9` برای پوشش تمام اساتید `1..7` |
| `backend/src/server.js` | `MODIFIED` | `28,364` | `422` | `normalizeFaSearch`, `ensureCatalogAndScheduleConsistency` (تأیید حساب اساتید `1..7` و تولید ۱۶ جلسهٔ واقعی برای هر کلاس)، `buildSuggestedTeachers`, `activeClasses` در `/api/teachers/:id`, `/api/search/suggestions`, `/api/promotions/home` |
| `backend/tests/booking-wallet-search-ux.test.js` | `ADDED_NEW` | `13,539` | `331` | تست‌های یکپارچهٔ کیف پول، لجر، رزرو تک/چندجلسه‌ای، تقویم، تداخل زمانی و پروموشن |
| `frontend/src/views/panel/Calendar.jsx` | `UNCHANGED` | `38,268` | `0` | نمایش تقویم شمسی دانش‌آموز و استاد، پیشنهاد تغییر زمان و ورود امن به کلاس |
| `frontend/src/views/panel/Finance.jsx` | `MODIFIED` | `17,291` | `438` | فرم شارژ کیف پول (`#wallet-charge`)، چیپ‌های مبلغ سریع، `normalizeNumericInput`، نشان وضعیت درگاه و تاریخچهٔ تراکنش‌ها (`#wallet-history`) |
| `frontend/src/views/PaymentResult.jsx` | `MODIFIED` | `8,932` | `234` | صفحهٔ نتیجهٔ پرداخت و شبیه‌ساز کنترل‌شدهٔ callback برای حالت `devGateway=1` |
| `frontend/src/views/ClassDetail.jsx` | `MODIFIED` | `30,405` | `195` | انتخاب `1..16` جلسه (تک‌جلسه‌ای و چندجلسه‌ای)، دکمه‌های سریع `1/4/8/16`، استپر `+ / -`، پیش‌انتخاب `?occurrenceId=` و غیرفعال‌سازی رزرو هنگام خالی بودن برنامه |
| `frontend/src/views/TeacherProfile.jsx` | `MODIFIED` | `63,412` | `261` | مقداردهی اولیه از `activeClasses`، همگام‌سازی `#slots` با `#book`، پشتیبانی از `1..16` جلسه |
| `frontend/src/components/SchedulePicker.jsx` | `MODIFIED` | `6,165` | `163` | همگام‌سازی خودکار جلسات انتخابی با `count` و `onOccurrencesChange` |
| `frontend/src/components/PublicTeacherSchedule.jsx` | `MODIFIED` | `12,337` | `593` | حذف تناقض نمایش اسلات استاتیک `۱۷:۰۰` هنگام خالی بودن هفته، محافظ ترتیب درخواست (`reqSeqRef`)، حفظ دادهٔ قبلی در بارگذاری مجدد و تفکیک پیام‌های خطا/تکمیل ظرفیت/نبود زمان |
| `frontend/src/views/ClassesSearch.jsx` | `MODIFIED` | `59,989` | `148` | ادغام پایدار `DEFAULT_SUGGESTED` برای حفظ کارت «مناسب سطح شما»، محافظ `catalogReqSeqRef` و اتصال `<LiveSearch />` |
| `frontend/src/components/LiveSearch.jsx` | `ADDED_NEW` | `14,359` | `398` | کامپوننت جستجوی زنده با `role="combobox"`, دیباونس `160ms`, `requestSeqRef`, ناوبری کیبورد و نرمال‌سازی فارسی/عربی |
| `frontend/src/components/Header.jsx` | `MODIFIED` | `10,519` | `237` | قرص موجودی کیف پول (`data-testid="header-wallet-balance"`)، منوی سریع شارژ/تاریخچه و `<LiveSearch />` بدون ریدایرکت ناخواسته روی کلیک |
| `frontend/src/components/HeroSearch.jsx` | `MODIFIED` | `5,180` | `62` | اتصال ورودی جستجوی هیرو به `<LiveSearch />` با حفظ سلکتورهای تست |
| `frontend/src/layouts/PanelLayout.jsx` | `MODIFIED` | `13,633` | `33` | دکمهٔ مستقیم کیف پول (`.nk-header-wallet-btn`) در نوار بالای پنل |
| `frontend/src/components/HomeBrandLoader.jsx` | `ADDED_NEW` | `1,713` | `44` | لودینگ برندینگ‌شده با لوگوی نیمکت |
| `frontend/src/app/(public)/loading.tsx` | `ADDED_NEW` | `143` | `5` | اتصال `HomeBrandLoader` به مسیرهای عمومی Next.js |
| `frontend/src/components/FirstRegistrationPromoModal.jsx` | `ADDED_NEW` | `6,235` | `193` | مودال تخفیف ثبت‌نام اول مختص مسیر `/` متصل به `/api/promotions/home` (`MEHR05`) |
| `frontend/src/views/Home.jsx` | `MODIFIED` | `42,367` | `111` | اتصال `HomeBrandLoader` و `FirstRegistrationPromoModal` |
| `frontend/src/blocks/home-blocks-1.jsx` | `MODIFIED` | `24,413` | `48` | افزودن `.student-avatar-ring` و `.student-avatar-ring-spin` دور آواتار دانش‌آموزان برتر |
| `frontend/src/styles/interactions.css` | `MODIFIED` | `22,642` | `659` | استایل‌های کیف پول، جستجوی زنده، حلقهٔ چرخان آواتار (`@keyframes nk-student-ring-spin` + `prefers-reduced-motion`)، لودینگ و مودال تخفیف |
| `frontend/tests/unit/booking-wallet-search-ux.test.ts` | `ADDED_NEW` | `6,228` | `108` | تست‌های واحد Vitest برای کامپوننت‌های جدید |
| `design-system/nimkat/MASTER.md` | `UNCHANGED` | `2,126` | `0` | سند مرجع سیستم طراحی نیمکت (رعایت‌شده در توکن‌های رنگی، فونت یکان‌بخ و RTL) |

---

## ۲. جدول تطبیق ادعاهای گزارش قبلی با واقعیت سورس و تست مستقل

| ادعای گزارش قبلی | وجود در سورس واقعی | وجود تست خودکار | اجرای مستقل توسط ممیز | آنچه هنوز در محیط فعلی اثبات نشده است |
|---|---|---|---|---|
| رفع خطای شارژ کیف پول و پشتیبانی از ارقام فارسی/عربی | بله (`providers.js`, `payments/index.js`) | بله | **`PASS`** (اجرای ۱۵ سناریوی زنده روی DB ایزوله) | اتصال شبکه به درگاه واقعی زرین‌پال در محیط عملیاتی (`NOT TESTED` / `BLOCKED`) |
| رزرو تک‌جلسه‌ای (`1`) و چندجلسه‌ای (`2..16`) و رفع خطای نبود زمان در `/classes/1` | بله (`ClassDetail.jsx`, `TeacherProfile.jsx`, `server.js`) | بله | **`PASS`** (اجرای زندهٔ رزرو ۱ و ۴ جلسه‌ای + تست هم‌زمانی آخرین صندلی) | اجرای کلیک مرورگر واقعی با باینری Chromium (`BLOCKED`) |
| حذف تناقض نمایش اسلات `۱۷:۰۰` هنگام خالی بودن هفته یا نبود کلاس فعال | بله (`PublicTeacherSchedule.jsx` خط ۱۳۵) | بله | **`PASS`** | اجرای بصری در مرورگر Chromium (`BLOCKED`) |
| پایداری برچسب «مناسب سطح شما» در `/classes?kind=گروهی` | بله (`ClassesSearch.jsx`, `server.js`) | بله | **`PASS`** (`hasMonasebSatheShomaBadge: true`) | اجرای بصری در مرورگر Chromium (`BLOCKED`) |
| جستجوی زنده (`role="combobox"`) بدون ریدایرکت روی کلیک و با نرمال‌سازی فارسی/عربی | بله (`LiveSearch.jsx`, `Header.jsx`, `server.js`) | بله | **`PASS`** | ملاحظهٔ جزئی: کوئری ترکیبی عدد و حروف مثل `فيزيك ١١` در مقابل عنوان دارای حروف `یازدهم` منطبق نمی‌شود (در `REMAINING_ISSUES.md` ثبت شد) |
| مودال تخفیف ثبت‌نام اول فقط در `/` متصل به کوپن واقعی `MEHR05` و بررسی سمت سرور | بله (`FirstRegistrationPromoModal.jsx`, `server.js`) | بله | **`PASS`** (`eligibleForFirstRegistration: true -> false` پس از اولین رزرو) | اجرای بصری در مرورگر Chromium (`BLOCKED`) |

**نتیجهٔ نهایی Stage 1:** **`PASS`**
