# Nimkat — گزارش تغییرات (Phase 14)
### اصلاحات هدفمند UI/UX و Responsive — بدون Regression

**تاریخ:** ۳۰ اکتبر ۲۰۲۶
**شاخه:** `arena/4f156d38-nimkat`
**وضعیت:** تمام تغییرات **بدون Commit / Push / Merge / Release / Deploy** در working tree باقی مانده‌اند.
**Live Preview:** `http://127.0.0.1:3000` (پروداکشن Next.js + بک‌اند تعبیه‌شده)

---

## ۱. کدام فایل‌ها تغییر کردند؟

### فایل‌های سورس (تغییر مستقیم)
| فایل | نوع تغییر | توضیح |
|---|---|---|
| `frontend/src/views/Home.jsx` | اصلاح | حذف کامل Preload + پیاده‌سازی Carousel نوابغ |
| `frontend/src/components/HomeBrandLoader.jsx` | **حذف شد** | کامپوننت Preloader برند (NIMKAT) |
| `frontend/src/components/HorizontalCarousel.jsx` | **افزوده شد** | کنترلر Carousel افقی (بدون کتابخانه جدید) |
| `frontend/src/components/Footer.jsx` | اصلاح | افزودن کلاس‌های معنایی به ستون‌ها (بدون حذف محتوا) |
| `frontend/src/components/FirstRegistrationPromoModal.jsx` | اصلاح | پرچم `data-nk-promo-open` + انحصار متقابل Popup/دکمه شناور |
| `frontend/src/blocks/home-blocks-1.jsx` | اصلاح | همان Carousel برای نسخهٔ Page-Builder خانه |
| `frontend/src/app/(public)/blog/[slug]/page.tsx` | اصلاح | چیدمان Article-First (متن محور) |
| `frontend/src/styles/global.css` | اصلاح | Grid واقعی فوتر + رفع تک‌ستونه شدن در breakpointها |
| `frontend/src/styles/interactions.css` | اصلاح | حذف CSS پری‌لودر + کارت افقی پیشنهاد مطالب + مخفی‌سازی شناور |
| `frontend/src/styles/responsive.css` | اصلاح | استایل Carousel + چیدمان مقاله + Grid فوتر موبایل |
| `frontend/src/styles/community.css` | اصلاح | کاهش ظریف فونت منوی موبایل |

### فایل‌های تست (افزوده/به‌روزرسانی)
| فایل | نوع | توضیح |
|---|---|---|
| `frontend/tests/unit/targeted-ui-responsive-fixes.test.ts` | **افزوده شد** | ۴۲ تست پذیرش برای هر ۷ تسک |
| `frontend/tests/unit/booking-wallet-search-ux.test.ts` | به‌روزرسانی | تست «Branded Home Loader» به «عدم وجود Preload» تغییر کرد |

### فایل‌های گزارش (خروجی، خارج از سورس محصول)
| فایل | توضیح |
|---|---|
| `audit-reports/targeted-ui-responsive-fixes/phase13-runner.mjs` | اسکریپت تست پذیرش مبتنی بر Chromium headless |
| `audit-reports/targeted-ui-responsive-fixes/phase-13-results.json` | خروجی JSON تست‌های فاز ۱۳ |
| `audit-reports/targeted-ui-responsive-fixes/screenshots/` | اسکرین‌شات‌های قبل و بعد |

> **هیچ API، قرارداد داده‌ای، schema دیتابیس، منطق پرداخت/رزرو/ثبت‌نام یا کتابخانهٔ جدیدی تغییر نکرد.**

---

## ۲. Preload از کدام قسمت‌ها حذف شد؟

### مسیر فعال‌سازی (پیش از تغییر)
```
frontend/src/views/Home.jsx
  └─ useState(homeLoading = !preview)      ← حالت اولیه
  └─ useEffect: minTimer = 1800ms + Promise.all([...])
  └─ {homeLoading && !preview && <HomeBrandLoader overlay exiting={homeExiting} />}
       └─ frontend/src/components/HomeBrandLoader.jsx
            └─ .nk-brand-loader (position: fixed; inset: 0; z-index: 99999)
                 └─ frontend/src/styles/interactions.css
                      .nk-brand-loader / .nk-preloader__* / @keyframes nk-word-fill-ltr …
```

### موارد حذف‌شده
1. **کامپوننت** `frontend/src/components/HomeBrandLoader.jsx` — کلاً حذف شد.
2. **دو سایت رندر** در `Home.jsx` (شاخهٔ `pubSchema` و شاخهٔ پیش‌فرض).
3. **سه state** : `homeLoading`، `homeExiting`، `exitTimeout`.
4. **تأخیر مصنوعی** `minTimer` (۱۸۰۰ میلی‌ثانیه) و `setTimeout(…, 650)` مربوط به انیمیشن خروج.
5. **CSS اولیه** — مجموعهٔ کامل `.nk-brand-loader` / `.nk-brand-loader--overlay` و `~۷ KB` کد.
6. **CSS قدیمی دوم** — مجموعهٔ `.nk-brand-loader__card` / `__logo` / `__halo` / `__bar` / `__skeleton` (بدون مصرف‌کننده).
7. **کی‌فریم‌ها** `@keyframes nk-word-fill-ltr`، `nk-slogan-fill-rtl`، `nk-line-fill-scale`، `nk-brand-bar-slide`، `nk-preloader-slide`.

### آنچه **حفظ** شد (طبق قوانین تسک)
- ✅ `api('/pages/home')` و `api('/promotions/home')` — **بدون تغییر**، فقط دیلی شدن Promise.all حذف شد (نه خود API).
- ✅ سیستم‌های Loading واقعی: اسکلتون مجله (`.mag-card-skeleton`)، اسپینر دکمه‌ها (`.nk-btn-spinner`)، حالت بارگذاری پنل.
- ✅ انیمیشن صفحهٔ ۴۰۴: کی‌فریم `nk-preloader-pulse` که صفحهٔ ۴۰۴ استفاده می‌کرد با نام صحیحِ `nk-404-pulse-scale` بازتعریف شد تا صفحهٔ ۴۰۴ خراب نشود.
- ✅ `PageTransition.jsx` — این یک Route-transition است (بدون تأخیر، بدون preloader اولیه) و دست‌نخورده ماند.

**نتیجه:** با ورود به سایت و جابه‌جایی بین صفحات هیچ Preloader اولیه‌ای نمایش داده نمی‌شود و هیچ صفحهٔ سفید یا فضای خالی ایجاد نمی‌شود.

---

## ۳. Footer چگونه به Grid تبدیل شد؟

### مشکل
در موبایل فوتر یک **ستون کاملاً عمودی** می‌شد (قانون `grid-template-columns: minmax(0,1fr)` در breakpointهای ۴۸۰px و ۴۰۰px) و بسیار بلند بود.

### راه‌حل
| breakpoint | قبل | بعد |
|---|---|---|
| دسکتاپ (≥۱۱۰۱px) | `1.6fr 1fr 1fr 1fr 1.15fr` | `minmax(0,1.45fr) repeat(3, minmax(0,1fr)) minmax(0,1.15fr)` |
| تبلت (≤۱۱۰۰px) | `1fr 1fr 1fr` (برند بدون span) | `repeat(2, minmax(0,1fr))` + برند `grid-column: 1/-1` |
| موبایل (≤۹۰۰px) | `repeat(2,1fr)` | `repeat(2, minmax(0,1fr))` + برند تمام‌عرض |
| موبایل (≤۴۸۰px) | **`minmax(0,1fr)` — تک‌ستونه** | **`repeat(2, minmax(0,1fr))`** |
| خیلی باریک (≤۴۰۰px) | `minmax(0,1fr)` | `repeat(2, minmax(0,1fr))` |

### جزئیات
- `.site-footer .cols` یک **CSS Grid واقعی** است با `align-items: start` و `min-width: 0` روی فرزندان (پیشگیری از سرریز).
- کلاس‌های معنایی `footer-col--grades` / `--quick` / `--support` / `--licenses` اضافه شد (فقط برای کنترل Grid — **هیچ محتوایی حذف نشد**).
- بلوک برند (`footer-brand`) در موبایل/تبلت تمام عرض می‌شود و لوگو + توضیحات + شبکه‌های اجتماعی + تلفن در همان گروه می‌مانند.
- بخش کپی‌رایت (`.footer-bottom`) همچنان **در انتهای فوتر** است و در موبایل به‌صورت ستونی می‌چیند.
- `overflow-wrap: anywhere` روی توضیحات برند و `flex-wrap` روی نشان‌های مجوز → بدون بیرون‌زدگی متن‌های طولانی.
- فاصلهٔ ستون‌ها: ۳۲px دسکتاپ → ۲۸px تبلت → ۲۴px موبایل → ۲۰px باریک → ۱۶px در ۴۰۰px.
- همهٔ لینک‌ها، اطلاعات تماس، لوگو و متن‌ها **دست‌نخورده** باقی ماندند (تأیید: ۵ ستون، ۴ عنوان، ۲۰ لینک، کپی‌رایت).

---

## ۴. Carousel نوابغ چگونه اصلاح شد؟

### مشکل
بخش «نوابغ ماه» از `.row-scroll` استفاده می‌کرد که یک **CSS Grid** بود:
`repeat(2, 1fr)` در موبایل ← نتیجه: **۵ ردیف × ۲ ستون** برای ۱۰ نفر.

### راه‌حل — ساختار موجود اصلاح شد (Carousel موازی ساخته نشد)
```
frontend/src/components/HorizontalCarousel.jsx  ← کنترلر عمومی (بدون کتابخانه)
  └─ .nk-carousel > .nk-carousel__track[role=group][tabindex=0]
       └─ .row-scroll  (flex, nowrap)
            └─ ۱۰ × .s-card
```

| قابلیت | پیاده‌سازی |
|---|---|
| تک‌ردیفه در همهٔ دستگاه‌ها | `display:flex; flex-wrap:nowrap` روی track و `.row-scroll` |
| اسکرول افقی | `overflow-x:auto` + `overscroll-behavior-x:contain` |
| Snap | `scroll-snap-type:x mandatory` + `scroll-snap-align:start` روی هر کارت |
| Swipe لمسی | اسکرول نیتیو موبایل (`-webkit-overflow-scrolling:touch`) |
| دکمه‌های قبلی/بعدی | همان دکمه‌های موجود؛ `querySelector('.nk-carousel__track')` و همان `±320px` |
| صفحه‌کلید | `onKeyDown` روی track (`ArrowLeft`/`ArrowRight`) + `tabIndex={0}` |
| `prefers-reduced-motion` | `scroll-behavior:auto` + `scroll-snap-type:x proximity` |
| بدون اسکرول افقی ناخواستهٔ صفحه | track فقط `overflow` دارد؛ `html`/`body` هیچ `overflow-x:hidden` ندارند |
| تعداد آیتم‌ها | **۱۰ (بدون تغییر)** — هر ۱۰ کارت در DOM باقی ماندند |

### اندازهٔ کارت‌ها
| viewport | عرض کارت |
|---|---|
| ۳۲۰–۳۶۰px | `clamp(150px, 66vw, 184px)` |
| ۳۷۵–۴۸۰px | `clamp(158px, 62vw, 200px)` |
| ≤۷۲۰px | `clamp(170px, 56vw, 214px)` |
| ≤۹۰۰px | `clamp(190px, 44vw, 230px)` |
| >۹۰۰px | `clamp(200px, 21vw, 250px)` |

هم دو نسخهٔ خانه (`Home.jsx` و `home-blocks-1.jsx` — نسخهٔ Page-Builder) از **همان** کامپوننت استفاده می‌کنند.

---

## ۵. چیدمان صفحهٔ مقاله چگونه تغییر کرد؟

### ساختار قبل (۲ ستونه)
`[TOC | Categories | Recent | CTA]  ‖  [متن مقاله]` — متن مقاله در ۷۶۰px محدود شده بود.

### ساختار بعد (متن‌محور)
```
۱. wm-post-hero          → عنوان، دسته‌بندی، تاریخ، نویسنده، متا
۲. wm-post-cover-frame   → تصویر اصلی (در جایگاه فعلی، دست‌نخورده)
۳. wm-sidebar--toc       → Table of Contents (تمام‌عرض، بالای متن)
۴. wm-article-column     → متن کامل مقاله (ستون اصلی، تمام‌عرض)
۵. wm-related-section    → پیشنهاد مطالب مرتبط
۶. wm-after-article-widgets → دسته‌بندی‌ها + تازه‌ترین مطالب + CTA
```

### جزئیات فنی
- `.journal-reading-layout.wm-reading-grid--article-first { grid-template-columns: minmax(0,1fr) }` — **یک ستون**.
- **نکتهٔ مهم Cascade:** `journal.css` بعد از `interactions.css` ایمپورت می‌شود و `.journal-reading-layout` را با `grid-template-columns:240px minmax(0,760px)` تعریف می‌کند. بنابراین تمام قوانین article-first در `responsive.css` (که **آخرین** فایل ایمپورت است) قرار گرفتند و سلسله‌مراتب با `!important` یا `transform: scale` حل نشد.
- عرض متن مقاله: ۳۴۷px (۳۷۵px) → ۸۱۲px (۱۰۲۴px) → ۸۵۲px (۱۴۴۰px) → ۸۲۰px (۱۹۲۰px) و **دقیقاً وسط‌چین** (فاصلهٔ چپ = فاصلهٔ راست).
- فونت متن: ۱۵٫۵px در ۳۷۵px و ۱۶٫۵px از ۷۶۸px به بالا با `line-height` متناسب — خوانایی استاندارد.
- **هیچ متن، پاراگراف، عنوان، تصویر یا اطلاعاتی حذف یا کوتاه نشد.** تمام `p.sections`، FAQ، باکس نویسنده، ناوبری قبلی/بعدی، برچسب‌ها و دکمهٔ اشتراک‌گذاری سر جای خود هستند.
- Anchorها سالم‌اند: `#section-1..N` و `#article-faq` (تأیید: ۵ لینک TOC ↔ ۴ سرفصل + ۱ FAQ، همه resolve شدند).

---

## ۶. پیشنهاد مطالب چگونه اصلاح شد؟

کلاس جدید `journal-card--row` (به‌همراه `journal-grid--related`) به کارت‌های بخش «این مسیر را ادامه دهید» اضافه شد.

| خواسته | پیاده‌سازی |
|---|---|
| تصویر کنار عنوان (دسکتاپ) | `.journal-card--row { flex-direction: row }` + `.journal-card-cover-wrap { flex: 0 0 152px }` |
| تصویر کنار عنوان (موبایل) | **همان الگوی افقی حفظ شد** (فقط عرض کمتر: ۱۱۶px در ۷۲۰px، ۱۰۴px در ۴۰۰px) |
| نسبت ابعاد ثابت | `object-fit: cover` + `min-height` — تصویر کشیده یا له نمی‌شود |
| عنوان فضای کافی | `.journal-card-copy { flex:1 1 auto; min-width:0 }` + `overflow-wrap:anywhere` |
| کارت هم‌اندازه | گرید `repeat(3)` → `repeat(2)` در ۱۱۰۰px → `1` در ۷۲۰px با `align-items:stretch` |
| کل کارت قابل کلیک | همان `<a class="journal-card-link">` که کل محتوا را در بر گرفته (تأیید در مرورگر) |
| بدون برش عنوان | `-webkit-line-clamp` فقط روی **خلاصه**، نه روی عنوان |
| بدون حذف محتوا | خلاصه حتی در ۳۲۰px هم باقی است (فقط ۲ خط) |

Badge دسته‌بندی و برچسب زمان مطالعه به‌صورت overlay روی تصویر باقی ماندند.

---

## ۷. Popup تخفیف چگونه مدیریت شد؟

### تحلیل منبع دکمهٔ شناور
دو عنصر شناور در گوشهٔ پایین وجود داشت:
1. `.nk-promo-reopen-wrap` — دکمهٔ «هدیه ثبت‌نام اول: ۵٪ تخفیف» (مربوط به همان تخفیف).
2. `.support-launcher` — دکمهٔ «پشتیبانی» (قابلیت جدا و مشروع، اما هم‌زمان با Popup دیده می‌شد).

### راه‌حل (بدون ساخت سیستم موازی)
- یک پرچم واحد روی `<html>`: `data-nk-promo-open="true"` که **فقط** هنگام باز بودن Popup ست می‌شود و در `useEffect` پاک‌سازی می‌شود.
- CSS: `html[data-nk-promo-open='true']` → `.nk-promo-reopen-wrap`، `.nk-promo-reopen-btn` و `.support-launcher` همگی `display:none !important`.
- در خود کامپوننت هم Popup و دکمهٔ شناور **انحصار متقابل** دارند (`if (dismissed) → دکمه` وگرنه `→ Popup`).

### آنچه **تغییر نکرد**
- ✅ کلید ذخیره‌سازی `nk_first_reg_promo_dismissed_v1` و `PROMO_DISMISS_STORAGE_KEY`
- ✅ زمان‌بندی ۴۵۰ms، منطق `handleDismiss` / `handleReopen`، تشخیص تعامل زودهنگام با فرم
- ✅ محاسبهٔ درصد/کد تخفیف، `ctaPrimary`/`ctaSecondary`، کپی کد، Toast
- ✅ شرط `eligibleForFirstRegistration`، `active/enabled`، `!user`، `open !== false`
- ✅ **هیچ API یا قرارداد داده‌ای تغییر نکرد**

### رفتار پس از بستن Popup
طبق طراحی موجود: پس از بستن، دکمهٔ شناور «هدیه�بت‌نام اول» برمی‌گردد تا کاربر بتواند Popup را دوباره باز کند (تأیید‌شده در مرورگر: `modal=false, reopen pill=true`).

---

## ۸. اندازهٔ فونت منوی موبایل چقدر تغییر کرد؟

| مورد | قبل | بعد | تغییر |
|---|---|---|---|
| آیتم‌های منوی موبایل (`.nk-sheet-links > a`) | ۱۶px (ارث‌شده از `body`) | **۱۵px** | ‎−۱px (−۶٫۲۵٪) |
| `line-height` آیتم‌ها | ۱٫۷۵ (ارث‌شده) | **۱٫۷۵** | بدون تغییر |
| `font-weight` | ۷۰۰ | **۷۰۰** | بدون تغییر |
| فاصلهٔ آیکون تا متن (`gap`) | ۱۲px | **۱۰px** | ظریف |
| عنوان شیت | ۲۲px | **۲۰px** | ظریف |
| توضیح شیت | ۱۳px | **۱۲٫۵px** | ظریف |
| فاصلهٔ بین آیتم‌ها (`gap`) | ۴px | **۴px** | بدون تغییر |
| **منوی دسکتاپ** (`.main-nav a`) | ۱۴px | **۱۴px** | **بدون تغییر** |

کاهش فقط در `@media(max-width:1100px)` اعمال می‌شود (همان جایی که شیت موبایل نمایش داده می‌شود) و جهت `rtl` و تراز متن فارسی حفظ شده است.

---

## ۹. تست‌های اجراشده چه نتایجی داشتند؟

### ۹-۱. تست‌های واحد (Vitest)
```
Test Files  10 passed (10)
Tests       86 passed (86)      ← ۴۴ قبلی + ۴۲ تست جدیدِ پذیرش
```
فایل جدید `targeted-ui-responsive-fixes.test.ts` شامل ۴۲ تست برای هر ۷ تسک است.

### ۹-۲. تست‌های بک‌اند (Node test runner)
```
# tests 121
# pass  121
# fail  0
```

### ۹-۳. بیلد پروداکشن
```
✓ Compiled successfully in 7.3s
✓ Generating static pages using 1 worker (48/48)
```
**۴۸/۴۸ مسیر** بدون خطای TypeScript یا webpack.

### ۹-۴. تست پذیرش زنده با Chromium (Phase 13)
```
PASSED: 115/115
CONSOLE ERRORS captured: 0
```

| گروه | تعداد | نتیجه |
|---|---|---|
| بدون سرریز افقی — ۱۲ viewport × ۶ صفحه | ۷۲ | ✅ همه |
| Grid فوتر (ساختار + چیدمان + حفظ محتوا) | ۳ | ✅ |
| Carousel نوابغ (تک‌ردیفه + ۱۰ آیتم + اسکرول) × ۶ viewport | ۱۸ | ✅ |
| ترتیب مقاله + TOC + ستون اصلی + وسط‌چینی × ۲ viewport | ۸ | ✅ |
| کارت پیشنهاد مطالب × ۴ viewport | ۸ | ✅ |
| Popup تخفیف (باز شدن، نبود دکمهٔ شناور، رفتار بعد از بستن) | ۳ | ✅ |
| فونت منوی موبایل + RTL | ۳ | ✅ |

**viewportهای تست‌شده:** ۳۲۰، ۳۶۰، ۳۷۵، ۳۹۰، ۴۳۰، ۶۰۰، ۷۶۸، ۱۰۲۴، ۱۳۶۶، ۱۴۴۰، ۱۹۲۰، ۳۸۴۰

**صفحه‌های تست‌شده:** `/`، `/blog`، `/blog/weekly-study-plan`، `/classes`، `/teachers/1`، `/club` (+ `/panel`، `/faq`، `/login`، `/terms`، `/privacy` با ۱۳۲/۱۳۲ پاسخ ۲۰۰)

### ۹-۵. بررسی Cascade با اسکریپت مستقل
برای هر selector کلیدی، مقدار مؤثر CSS در هر ۱۲ viewport محاسبه و تأیید شد:
- فوتر: `repeat(2, minmax(0,1fr))` در همهٔ موبایل‌ها ✅
- نوابغ: `display:flex; flex-wrap:nowrap` در همهٔ viewportها ✅
- مقاله: `minmax(0,1fr)` (تک‌ستون) در همهٔ viewportها ✅
- کارت پیشنهاد: `flex-direction:row` در همهٔ viewportها ✅
- فونت منو: ۱۵px در موبایل/تبلت و ۱۶px در دسکتاپ (پایه) ✅
- مخفی‌سازی شناور: `display:none` در همهٔ viewportها ✅

### ۹-۶. اسکرین‌شات‌ها
`audit-reports/targeted-ui-responsive-fixes/screenshots/` شامل:
- **قبل:** `before-mobile-375-*.png`، `before-tablet-768-*.png`، `before-desktop-1440-*.png` (۹ فایل تمام‌صفحه) + ۱۲ فایل `section-before-*`
- **بعد:** `after-mobile-375-*.png`، `after-tablet-768-*.png`، `after-desktop-1440-*.png` (۱۸ فایل) + ۱۲ فایل `section-*`

> تصاویر «قبل» با اجرای یک نسخهٔ جداگانه از همان کد با **بازگردانی فقط همین ۷ تغییر** تولید شد — هیچ‌کدام از تغییرات فعلی working tree دست‌نخورده باقی ماندند.

---

## ۱۰. چه مشکلاتی باقی مانده‌اند؟

### حل‌شده (۷/۷)
هر هفت خواستهٔ کارفرما پیاده‌سازی و با اجرای واقعی تست تأیید شد.

### باقی‌مانده / محدودیت‌های محیطی
1. **بدون باگراند مرورگر (Chromium)** — دانلود رسمی Playwright از `cdn.playwright.dev` توسط پروکسی مسدود است. برای اجرای تست‌های بصری، بستهٔ npm-based `@sparticuz/chromium` (از `registry.npmjs.org` که مجاز است) استفاده شد. اسکریپت در `audit-reports/targeted-ui-responsive-fixes/phase13-runner.mjs` برای اجرای مجدد قابل استفاده است.
2. **E2E کامل Playwright** (`frontend/tests/e2e/`) به‌دلیل نبود مرورگر در این سندباکس اجرا نشد؛ معادل آن با اسکریپت پذیرش Chromium + ۱۱۵ assertion پوشش داده شد.
3. **درگیری پورت ۸۰۰۰** — سرور «before» با `BACKEND_INTERNAL_PORT=8000` به بک‌اند محلی متصل شد تا به Render (که توسط پروکسی مسدود است) وابسته نباشد.
4. **کاربران واردشده (logged-in)** — بررسی پنل‌های کاربری از نظر ساختار و route انجام شد، اما سناریوهای تعاملیِ وابسته به نقش (مالی/پرداخت/رزرو) در این گزارش دست‌نخورده باقی ماندند — این‌ها طبق قوانین تسک در محدودهٔ اصلاحات UI/UX نبودند.
5. **کارفرما باید روی دستگاه واقعی تأیید نهایی کند** — گزارش بر پایهٔ Chromium headless با ابعاد دقیق viewport است؛ تفاوت‌های جزئی مرورگرهای موبایل (Safari iOS) ممکن است نیاز به بازبینی داشته باشد.

### خارج از محدوده (عمداً تغییر نکرد)
- معماری Next.js / Tailwind / Radix / RTL / YekanBakh
- هیچ API، دیتابیس، پرداخت، رزرو، ثبت‌نام، کیف پول، کلاب یا نقش‌ها
- محتوای مقاله، اطلاعات اولیهٔ مقاله، متن و لینک‌های فوتر، تعداد و دادهٔ نوابغ
- زمان‌بندی، کد و شرایط تخفیف

---

## ۱۱. دستورات بازتولید

```bash
# تست‌های واحد فرانت‌اند
./frontend/node_modules/.bin/vitest run --root frontend

# تست‌های بک‌اند
npm test --prefix backend

# بیلد پروداکشن
npm run build --prefix frontend

# تست پذیرش بصری (نیازمند Chromium محلی)
NIMKAT_BASE=http://127.0.0.1:3000 \
  node audit-reports/targeted-ui-responsive-fixes/phase13-runner.mjs
```

---

## ۱۲. وضعیت Git (بدون Commit / Push / Deploy)

```
شاخه:   arena/4f156d38-nimkat
HEAD:   f19f5e1 (بدون تغییر — هیچ commit جدیدی ساخته نشده)
```

تمام اصلاحات به‌صورت **فایل‌های تغییریافته در working tree** باقی مانده‌اند تا با `git diff` و `git status` قابل بازبینی باشند. هیچ `git commit`، `git push`، `merge`، `release` یا `deploy` انجام نشده است.
