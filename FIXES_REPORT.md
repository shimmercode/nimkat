# گزارش جامع اصلاحات پیاده‌سازی‌شده (FIXES_REPORT)

تمامی اصلاحات زیر به صورت ریشه‌ای و بدون استفاده از داده‌های جعلی یا Toast نمایشی، روی کدهای بک‌اند و فرانت‌اند پیاده‌سازی و راستی‌آزمایی شده‌اند.

---

## ۱. فاز ۲: دسترسی سریع به کیف پول و رفع خطای شارژ کیف پول

### ۱.۱ دسترسی سریع به کیف پول در هدر و پنل
- **`frontend/src/components/Header.jsx`**:
  - افزودن دکمهٔ اختصاصی کیف پول (`.nk-wallet-pill`, `data-testid="header-wallet-balance"`) در هدر اصلی سایت برای کاربران واردشده با نمایش موجودی زنده از `/api/wallet`.
  - افزودن منوی کشویی سریع شامل:
    - مشاهدهٔ موجودی فعلی به تومان (با ارقام فارسی)
    - دکمهٔ «+ شارژ سریع کیف پول» (`/panel/finance#wallet-charge`)
    - دکمهٔ «تاریخچهٔ تراکنش‌ها» (`/panel/finance#wallet-history`)
  - افزودن لینک مستقیم کیف پول و موجودی در منوی کشویی موبایل (Drawer).
- **`frontend/src/layouts/PanelLayout.jsx`**:
  - افزودن دکمهٔ مستقیم کیف پول (`.nk-header-wallet-btn`) در نوار بالای پنل دانش‌آموز، استاد، والد و ادمین.

### ۱.۲ رفع کامل خطای شارژ کیف پول و چرخهٔ پرداخت/لجر
- **`backend/src/modules/settings/providers.js`**:
  - اصلاح `paymentConfig()` برای پشتیبانی از حالت کنترل‌شدهٔ توسعه/تست (`local_dev`) هنگامی که در محیط غیر Production (`NODE_ENV !== 'production'`) تنظیمات درگاه خارجی زرین‌پال ثبت نشده است (`version === 0`)، با حفظ خطای امن `SERVICE_NOT_CONFIGURED` (`503`) در محیط Production واقعی.
  - افزودن متدهای `createPaymentRequest`، `verifyPaymentRequest`، `resolveOrigin` و `gatewayMode`.
- **`backend/src/modules/payments/index.js`**:
  - افزودن تابع `normalizeAmountToman(raw)` برای تبدیل ارقام فارسی (`۰-۹`) و عربی (`٠-٩`) و حذف جداکننده‌های هزارگان (`٬`, `,`, `_`, فاصله) پیش از اعتبارسنجی عدد صحیح در بازهٔ `1,000` تا `100,000,000` تومان.
  - پشتیبانی از callback درگاه در `GET /api/payments/callback/:id` هم با ریدایرکت استاندارد `303` برای مرورگر و هم خروجی JSON (`?format=json`) برای فراخوانی مستقیم کلاینت، همراه با محاسبهٔ دقیق موجودی به تومان (`Math.floor(walletBalance(uid) / 10)`).
  - پشتیبانی از لغو/عدم موفقیت پرداخت (`Status=NOK`) با تغییر وضعیت به `cancelled` و آزادسازی صندلی‌های نگه‌داشته شده (`releaseBookingHold`) بدون هیچ‌گونه افزایش کاذب موجودی.
- **`frontend/src/views/panel/Finance.jsx` و `frontend/src/views/PaymentResult.jsx`**:
  - افزودن چیپ‌های انتخاب سریع مبلغ (`۵۰,۰۰۰`، `۱۰۰,۰۰۰`، `۲۵۰,۰۰۰`، `۵۰۰,۰۰۰`، `۱,۰۰۰,۰۰۰` تومان)، نرمال‌سازی زندهٔ ورودی مبلغ، نمایش شفاف وضعیت درگاه، و شبیه‌ساز کنترل‌شدهٔ callback برای محیط توسعه (`devGateway=1`).

---

## ۲. فاز ۳: اصلاح کامل سیستم رزرو تک‌جلسه‌ای، چندجلسه‌ای و تقویم هفتگی

- **`backend/src/db.js` و `backend/src/server.js`**:
  - تکمیل کاتالوگ کلاس‌ها (کلاس‌های `6..9`) تا تمام ۷ استاد (`id = 1..7`) دارای حداقل یک کلاس فعال با ظرفیت باز باشند.
  - افزودن تابع اتمیک `ensureCatalogAndScheduleConsistency()` که در راه‌اندازی سرور تضمین می‌کند هر ۷ استاد دارای حساب تأییدشده (`teacher_accounts.status = 'approved'`) و هر کلاس دارای ۱۶ جلسهٔ زمان‌بندی‌شدهٔ آینده (`class_occurrences`) است.
  - بازگرداندن مستقیم `activeClasses` و `groupClasses` در `GET /api/teachers/:id`.
- **`frontend/src/views/ClassDetail.jsx` و `frontend/src/components/SchedulePicker.jsx`**:
  - پشتیبانی از انتخاب ۱ جلسه (رزرو تک‌جلسه‌ای) و چند جلسه (`1..16`) با دکمه‌های سریع `۱، ۴، ۸، ۱۶ جلسه` و استپر `+ / -`.
  - همگام‌سازی خودکار آرایهٔ زمان‌های انتخاب‌شده (`occurrenceIds`) با تعداد جلسات انتخابی (`sessions`).
  - غیرفعال‌سازی دکمهٔ رزرو و نمایش پیام دقیق «جلسه‌ای برای رزرو موجود نیست» در صورت خالی بودن برنامهٔ زمانی کلاس.
- **`frontend/src/components/PublicTeacherSchedule.jsx` و `frontend/src/views/TeacherProfile.jsx`**:
  - حذف کامل تناقض نمایش هم‌زمان «۰ کلاس فعال»، اسلات استاتیک `۱۷:۰۰` و پیام «در این بازه جلسهٔ قابل نمایش...»: اسلات‌های میان‌بر هفتگی تنها زمانی نمایش داده می‌شوند که در هفتهٔ انتخابی، جلسات واقعی (`occurrences.length > 0`) وجود داشته باشد.
  - اتصال مستقیم انتخاب زمان در `#slots` به `selectedClassId` و `selectedOccurrenceIds` در سایدبار `#book` و پشتیبانی از پیش‌انتخاب جلسه با پارامتر `?occurrenceId=`.
  - افزودن محافظ ترتیب درخواست (`reqSeqRef`) در `PublicTeacherSchedule.jsx` تا پاسخ دیررس هفتهٔ قبلی، وضعیت هفتهٔ جدید را بازنویسی نکند و دادهٔ معتبر قبلی هنگام بارگذاری مجدد پاک نشود.

---

## ۳. فاز ۴: رفع ناپدید شدن «مناسب سطح شما» در `/classes?kind=گروهی`

- **`backend/src/server.js` و `frontend/src/views/ClassesSearch.jsx`**:
  - افزودن تابع `buildSuggestedTeachers()` در بک‌اند برای ارسال هر ۵ استاد پیشنهادی همراه با برچسب‌های سطح‌بندی (`مناسب سطح شما`، `منتخب نیمکت`، `پیشنهاد ویژه`).
  - ادغام هوشمند (`merge`) پاسخ سرور با متادیتای پیش‌فرض و افزودن محافظ ترتیب درخواست (`catalogReqSeqRef`) در `ClassesSearch.jsx` تا در هیچ تغییر فیلتر یا بارگذاری مجددی کارت‌های پیشنهادی ناپدید نشوند.

---

## ۴. فاز ۵: جستجوی زنده و Autocomplete استاندارد (`LiveSearch.jsx`)

- **`backend/src/server.js` (`GET /api/search/suggestions`)**:
  - پیاده‌سازی نرمال‌سازی کامل فارسی/عربی (`normalizeFaSearch`: تبدیل ی/ي/ئ، ک/ك، اعداد فارسی/عربی و نیم‌فاصله) و بازگرداندن پیشنهادهای دسته‌بندی‌شده در ۳ گروه `classes`، `teachers` و `topics`.
- **`frontend/src/components/LiveSearch.jsx`**:
  - پیاده‌سازی الگوی کامل دسترسی‌پذیر (`role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"`, `role="option"`), دیباونس `160ms`، لغو درخواست‌های قدیمی با `requestSeqRef`، ناوبری کامل کیبورد (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`)، بستن با کلیک بیرون، و حذف ریدایرکت ناخواسته روی کلیک اولیه در هدر.

---

## ۵. فاز ۶، ۷ و ۸: تجربهٔ کاربری صفحهٔ اصلی (حلقهٔ چرخان، لودینگ برندینگ‌شده، مودال تخفیف ثبت‌نام اول)

- **فاز ۶ (`frontend/src/blocks/home-blocks-1.jsx` و `frontend/src/styles/interactions.css`)**:
  - افزودن حلقهٔ چرخان نرم دور آواتار دانش‌آموزان برتر (`.student-avatar-ring`, `@keyframes nk-student-ring-spin`) با `transform: rotate()` و غیرفعال‌سازی کامل چرخش در `@media (prefers-reduced-motion: reduce)`.
- **فاز ۷ (`frontend/src/components/HomeBrandLoader.jsx` و `frontend/src/app/(public)/loading.tsx`)**:
  - پیاده‌سازی لودینگ برندینگ‌شده با لوگوی نیمکت و انیمیشن ظریف بدون تأخیر مصنوعی و بدون خطای Hydration.
- **فاز ۸ (`frontend/src/components/FirstRegistrationPromoModal.jsx` و `backend/src/server.js`)**:
  - نمایش مودال تخفیف ثبت‌نام اول **فقط در مسیر `/`** (`pathname === '/'`) متصل به کوپن واقعی دیتابیس (`MEHR05` با `5%` تخفیف از جدول `coupons`) و بررسی سمت سرور (`eligibleForFirstRegistration`) که پس از ثبت اولین رزرو، مقدار آن را `false` می‌کند.
