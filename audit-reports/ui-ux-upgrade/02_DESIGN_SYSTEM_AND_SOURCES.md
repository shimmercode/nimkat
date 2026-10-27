# مشخصات Design System یکپارچه، استاندارد Motion و فهرست کامپوننت‌ها و منابع

- **تاریخ تدوین:** ۱۴۰۵/۰۸/۰۵ (۲۰۲۶-۱۰-۲۷)
- **فایل‌های مرجع Design System:**
  - `design-system/nimkat/MASTER.md`
  - `frontend/src/components/ui/design-system.jsx`
  - `frontend/src/components/ui/twenty-first/SOURCES.md`
  - `frontend/src/styles/global.css` و `frontend/src/styles/interactions.css`

---

## ۱. توکن‌های طراحی (Design Tokens) — حفظ ۱۰۰٪ هویت بصری نیمکت

### ۱.۱ پالت رنگی (Color Tokens)
تمامی کامپوننت‌های جدید و ارتقایافته صرفاً از متغیرهای CSS رسمی نیمکت استفاده می‌کنند و هیچ رنگ غیراستاندارد یا هاردکدشده‌ای اضافه نشده است:
- **رنگ‌های اصلی برند (Emerald Green):**
  - `--primary`: `#0A6847` (سبز اصلی نیمکت)
  - `--primary-900`: `#053D29` (سبز تیره برای هدرها، متون تأکیدی و کارت کلاس بعدی)
  - `--primary-50`: `#E3F4EC` (پس‌زمینهٔ ملایم نشان‌ها و کپسول کیف پول)
  - `--secondary`: `#21A878` (سبز روشن / Fresh برای وضعیت‌های موفق و آنلاین)
- **رنگ‌های مکمل و تاکیدی (Warm Orange):**
  - `--accent`: `#F28A3D` (نارنجی برند برای دکمه‌های CTA ویژه با متن تیره `#17211E`)
  - `--accent-800`: `#9C4F14` (نارنجی تیره با کنتراست بالا برای متون هشدار و نشان‌ها)
  - `--accent-50`: `#FDEEE2` (پس‌زمینهٔ ملایم کارت‌های هشدار و مأموریت‌ها)
- **طیف خنثی (Neutrals):**
  - `--bg`: `#FAFBF9`، `--n50`: `#F3F6F4`، `--n200` / `--border`: `#D9E1DE`، `--n500` / `--muted`: `#89938F`، `--n700`: `#46514D`، `--n900` / `--ink`: `#17211E`
- **وضعیت خطا (Error):**
  - `--error`: `#B42A48`، `--error-50`: `#FDE1E7`

### ۱.۲ تایپوگرافی فارسی و ارقام (Typography & Persian Numerals)
- **فونت واحد:** `YekanBakh` (نسخهٔ خودمیزبان `FaNum` در ۸ وزن `100` تا `950` با `font-display: swap`).
- **مقیاس تایپوگرافی:**
  - `t-display` / `t-h1`: عناوین اصلی صفحات (`clamp(28px, 4vw, 44px)`، وزن `900`)
  - `t-h2`: عناوین بخش‌ها (`24px` تا `30px`، وزن `900`)
  - `t-h3`: عناوین کارت‌ها و پنل‌ها (`20px` تا `24px`، وزن `800`–`900`)
  - متن بدنه: `14px` تا `16px` با `line-height: 1.8` تا `2.0` برای خوانایی بهینهٔ متون فارسی
  - حداقل سایز فونت مجاز در کل رابط کاربری: `12px` (`t-caption`)
  - کلاس `.num`: اعمال `font-variant-numeric: tabular-nums` همراه با تابع `faNum()` / `faPrice()` برای نمایش تراز و یکدست قیمت‌ها، زمان‌ها و کدها به فارسی.

### ۱.۳ فاصله‌گذاری، گردی گوشه‌ها، سایه و لایه‌بندی (Spacing, Radius, Shadow & Z-Index)
- **سیستم فاصله‌گذاری (Spacing):** مضرب‌های ۴ پیکسل (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`).
- **گردی گوشه‌ها (Border Radius):**
  - `--r-sm`: `8px`، `--r-md`: `12px`، `--r-lg`: `16px`، `--r-xl`: `20px`، `--r-2xl`: `24px`، کپسولی: `999px`
- **سایه‌ها (Shadows):**
  - `--shadow-sm`: `0 2px 8px rgba(5, 61, 41, 0.04)`
  - `--shadow-md`: `0 10px 26px rgba(5, 61, 41, 0.07)`
  - `--shadow-lg`: `0 20px 48px rgba(5, 61, 41, 0.12)`
- **لایه‌بندی (Z-Index Hierarchy):**
  - هدر چسبان (`.site-header` / `.panel-top`): `z-index: 40–50`
  - لودر برند (`nk-brand-loader--overlay`): `z-index: 75`
  - ویجت پشتیبانی شناور (`SupportWidget`): `z-index: 90`
  - دیالوگ‌ها و منوهای موبایل Radix (`DsDialog` / `.nk-ds-dialog-overlay`): `z-index: 120–121`
  - اعلان‌های سیستم (`#nimkat-toast-host`): `z-index: 9999`

---

## ۲. استاندارد حرکت و انیمیشن (Phase 4 — Motion Standard)

- **کتابخانه:** استفاده از `motion/react` (`v11.18.2`) موجود در پروژه در کنار ترنزیشن‌های دقیق CSS مبتنی بر `transform` و `opacity`.
- **ممنوعیت مطلق `transition: all`:** در تمام فایل‌های استایل (`global.css`، `interactions.css`، `responsive.css`، `community.css`، `editor.css`) تعداد `transition: all` دقیقاً `0` است (تأییدشده با تست واحد `motion-and-polish.test.ts`).
- **زمان‌بندی استاندارد (Timing):**
  - Micro-interactions (هاور دکمه‌ها، کارت‌ها، صندلی‌های کلاس، فیلدها و چیپ‌ها): `140ms` تا `180ms` (`--dur-fast: 160ms` با منحنی `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`).
  - ورود پیام‌های چت (`nk-msg-enter`) و تغییر وضعیت پنل‌ها/مدال‌ها (`DsDialog`، `PageTransition`): `160ms` تا `220ms` (`--dur-med: 220ms`).
  - انتقال صفحات (`PageTransition.jsx`): دارای `initial={false}` و بدون حرکت عمودی `y` برای جلوگیری از پرش محتوا هنگام SSR/Hydration.
- **پشتیبانی کامل از `prefers-reduced-motion`:**
  - در سطح React (`useReducedMotion()` در `PageTransition.jsx`) و در سطح CSS (`@media (prefers-reduced-motion: reduce)` در `interactions.css`)، تمام انیمیشن‌های چرخشی، پالس و جابه‌جایی‌های Hover برای کاربران حساس به حرکت غیرفعال می‌شوند.

---

## ۳. فهرست کامپوننت‌های مشترک Design System و منابع الهام‌گرفته (Phase 2 & 3)

| کامپوننت | مسیر فایل | منبع الگو / کتابخانه پایه | دلیل انتخاب و نحوهٔ بومی‌سازی برای نیمکت |
|---|---|---|---|
| **`DsButton`** | `src/components/ui/design-system.jsx` | الگوی shadcn/ui Button + توکن‌های بومی نیمکت | پشتیبانی از ۶ گونه (`primary`, `secondary`, `orange`, `outline`, `ghost`, `danger`)، حداقل ارتفاع لمسی `44px` در موبایل، حالت `loading` با Spinner داخلی (`.nk-btn-spinner`) و `aria-busy`. |
| **`DsBadge`** | `src/components/ui/design-system.jsx` | الگوی shadcn/ui Badge + نشانگر وضعیت زنده (Magic UI Status Dot) | نمایش یکپارچهٔ وضعیت‌ها (`green`, `orange`, `error`, `neutral`, `primary`) همراه با نقطهٔ وضعیت زنده (`.nk-live-dot`) برای اتصال نیم‌چت، وضعیت درگاه‌ها و مجوزهای خانواده. |
| **`DsAlert`** | `src/components/ui/design-system.jsx` | الگوی shadcn/ui Alert با دسترس‌پذیری WAI-ARIA | نمایش پیام‌های خطا (`role="alert"`), هشدار کسری موجودی کیف پول، و پیام‌های موفقیت/راهنما (`role="status"`) با آیکون و اسلات دکمهٔ اقدام. |
| **`DsEmptyState`** | `src/components/ui/design-system.jsx` | الگوی کارت وضعیت خالی 21st.dev / Tailark | جایگزینی `<p>`های ساده با کارت وضعیت خالی استاندارد شامل آیکون برند، عنوان، توضیح راهنما و دکمهٔ اقدام اختیاری. |
| **`DsLoadingState`** | `src/components/ui/design-system.jsx` | الگوی Skeleton با انیمیشن Shimmer ملایم | نمایش وضعیت بارگذاری (`role="status"`, `aria-busy="true"`) در حالت لیست یا شبکهٔ KPI بدون پرش چیدمان (CLS) و بدون پاک‌کردن داده‌های قبلی هنگام بروزرسانی. |
| **`DsKpiCard`** | `src/components/ui/design-system.jsx` | الگوی کارت شاخص مالی/عملیاتی با نوار تاکیدی بالا | استفاده در `Finance.jsx` و `Analytics.jsx` برای نمایش شفاف موجودی، تعداد رزروها، گردش دفتر کل و شاخص‌های ۳۶۵ روزه با ارقام فارسی. |
| **`DsDialog`** | `src/components/ui/design-system.jsx` | `@radix-ui/react-dialog` (نصب‌شده در پروژه) | مدال دسترس‌پذیر با Focus Trap، بستن با کلید `Escape`، قفل اسکرول پس‌زمینه و چیدمان کاملاً RTL. |
| **`DsTabs`** | `src/components/ui/design-system.jsx` | الگوی Segmented Tabs دسترس‌پذیر (`role="tablist"`) | تب‌بندی RTL با پشتیبانی از شمارندهٔ فارسی و اسکرول افقی ایمن در صفحات موبایل. |
| **`DsTooltip`** | `src/components/ui/design-system.jsx` | الگوی Tooltip سبک مبتنی بر فوکوس و هاور (`role="tooltip"`) | نمایش راهنمای کوتاه بدون وابستگی سنگین اضافی و سازگار با کیبورد. |
| **`DsTable`** | `src/components/ui/design-system.jsx` | الگوی جدول عملیاتی واکنش‌گرا (`.operations-table-wrap`) | جدول RTL با هدر متمایز، اسکرول افقی ایمن در عرض `320px`/`375px`، `caption` دسترس‌پذیر و وضعیت خالی داخلی. |
| **Header / Hero / CTA / Footer** | `src/components/ui/twenty-first/*.jsx` | Tailark (`github.com/tailark/blocks` commit `8139698`) + `@radix-ui/react-navigation-menu` + `@radix-ui/react-dialog` | مگامنوی دسکتاپ، منوی کشویی موبایل با Focus Trap، هیروی لایه‌ای و فوتر استاندارد که قبلاً در `SOURCES.md` مستند شده و در این ارتقا دست‌نخورده و سازگار حفظ شده‌اند. |
