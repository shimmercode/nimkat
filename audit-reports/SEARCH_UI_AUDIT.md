# گزارش ممیزی مستقل جستجو، پیشنهادهای سطح و اصلاحات UI/UX (Stages 4 & 5 — SEARCH_UI_AUDIT)

## ۱. ممیزی جستجوی زنده و پیشنهادهای سطح (Stage 4)

### ۱.۱ بررسی کامپوننت `LiveSearch.jsx` و Endpoint `/api/search/suggestions`
- **منبع داده:** پیشنهادها مستقیماً از جداول واقعی `classes` و `teachers` در SQLite از طریق `GET /api/search/suggestions` واکشی می‌شوند.
- **نرمال‌سازی حروف و ارقام فارسی/عربی (`normalizeFaSearch` و `normalizePersianQuery`):**
  - تست مستقل با کوئری عربی `فيزيك يازدهم` -> تبدیل به `فیزیک یازدهم` و بازگرداندن `5` کلاس مرتبط (`200 OK`).
  - تست مستقل با کوئری عربی `كاوه مرادي` -> تبدیل به `کاوه مرادی` و بازگرداندن `2` کلاس و `1` استاد (`200 OK`).
  - تست مستقل با کوئری دارای نیم‌فاصله `حل‌تمرین فیزیک` -> تبدیل به `حل تمرین فیزیک` و بازگرداندن کلاس `1` (`200 OK`).
  - **ملاحظهٔ فنی ثبت‌شده:** اگر کاربر به جای کلمهٔ `یازدهم` از عدد `۱۱` (`فيزيك ١١`) استفاده کند، چون عنوان کلاس در دیتابیس با حروف (`یازدهم`) ذخیره شده است، تطابق توکنی مستقیم عدد `11` را با `یازدهم` معادل‌سازی نمی‌کند (به عنوان بهبود پیشنهادی با اولویت `LOW` در `REMAINING_ISSUES.md` ثبت شده است).
- **عدم ریدایرکت ناخواسته روی کلیک:** در `Header.jsx` و `HeroSearch.jsx`، فوکوس یا کلیک روی ورودی جستجو صرفاً دراپ‌داون پیشنهادها را باز می‌کند و کاربر را به `/classes` منتقل نمی‌کند.
- **جلوگیری از بازنویسی نتایج جدید توسط درخواست‌های قدیمی:** شمارندهٔ `requestSeqRef` در `LiveSearch.jsx` تضمین می‌کند پاسخ‌های دیررس نادیده گرفته شوند (`if (seq !== requestSeqRef.current) return;`).
- **دسترس‌پذیری و کیبورد:** ویژگی‌های `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"` و کلیدهای `ArrowDown`, `ArrowUp`, `Enter`, `Escape` در سورس و تست واحد بررسی و تأیید شدند.

### ۱.۲ بررسی پایداری «مناسب سطح شما» در `/classes?kind=گروهی`
- در `backend/src/server.js`، تابع `buildSuggestedTeachers()` هر ۵ استاد پیشنهادی را همراه با فیلد `badge` (شامل `id: 3` با `badge: 'مناسب سطح شما'`) بازمی‌گرداند.
- تست مستقل `GET /api/classes?kind=گروهی` روی سرور استخراج‌شده:
  - `suggestedTeachersCount: 5`
  - `hasMonasebSatheShomaBadge: true`
- در `frontend/src/views/ClassesSearch.jsx`، آرایهٔ برگشتی با `DEFAULT_SUGGESTED` ادغام (`merge`) می‌شود و محافظ `catalogReqSeqRef` مانع از پاک شدن داده در بارگذاری مجدد می‌شود.

---

## ۲. ممیزی سایر اصلاحات UI/UX (Stage 5)

| مورد بررسی | مسیر فایل در بسته | نتیجهٔ بررسی کد و تست | وضعیت |
|---|---|---|---|
| دسترسی سریع به کیف پول پس از ورود | `frontend/src/components/Header.jsx`, `frontend/src/layouts/PanelLayout.jsx` | نمایش موجودی زنده (`data-testid="header-wallet-balance"`) + منوی سریع شارژ (`#wallet-charge`) و تاریخچه (`#wallet-history`) | `PASS` |
| حلقهٔ چرخان دور آواتار دانش‌آموزان برتر | `frontend/src/blocks/home-blocks-1.jsx`, `frontend/src/styles/interactions.css` | کلاس `.student-avatar-ring` با `@keyframes nk-student-ring-spin` بر پایهٔ `transform: rotate(360deg)` بدون ایجاد CLS | `PASS` |
| پشتیبانی از `prefers-reduced-motion` | `frontend/src/styles/interactions.css` | در `@media (prefers-reduced-motion: reduce)` مقدار `animation: none !important` اعمال شده است | `PASS` |
| لودینگ برندینگ‌شدهٔ صفحهٔ اصلی | `frontend/src/components/HomeBrandLoader.jsx`, `frontend/src/app/(public)/loading.tsx` | لوگوی نیمکت، تایپوگرافی یکان‌بخ و بدون تأخیر مصنوعی (`setTimeout` مسدودکننده وجود ندارد) | `PASS` |
| مودال تخفیف ثبت‌نام اول فقط در `/` و متصل به `MEHR05` | `frontend/src/components/FirstRegistrationPromoModal.jsx`, `backend/src/server.js` | شرط `pathname === '/'` در کلاینت + خواندن کوپن واقعی `MEHR05` (`5%`) از جدول `coupons` + بررسی واجد شرایط بودن در سرور (`studentAEligibleBeforeBooking: true` -> `studentAEligibleAfterBooking: false`) | `PASS` |
| رعایت `design-system/nimkat/MASTER.md` | `frontend/src/styles/interactions.css` | استفاده از پالت رسمی (`#0A6847`, `#053D29`, `#21A878`, `#F28A3D`)، فونت `Yekan Bakh FaNum` و چیدمان کاملاً RTL | `PASS` |
