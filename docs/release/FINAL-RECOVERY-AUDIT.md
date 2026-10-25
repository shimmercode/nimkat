# ممیزی جامع، ریشه‌یابی و بازیابی نهایی محصول نیمکت (`FINAL-RECOVERY-AUDIT.md`)

- **تاریخ ممیزی:** `2026-10-25` (`Asia/Tehran`)
- **مخزن رسمی:** `https://github.com/shimmercode/nimkat`
- **شاخه فعال (Active Branch):** `arena/c1a746f9-nimkat`
- **تگ انتشار نهایی:** `v1.3.0` (`https://github.com/shimmercode/nimkat/releases/tag/v1.3.0`)
- **مسیر منبع حقیقت (Source of Truth):** `/home/user/nimkat` (`backend/` + `frontend/`، همگام‌شده ۱:۱ با `releases/nimkat-final-release/`)
- **تصمیم نهایی انتشار کد (`GitHub Release Readiness`):** `READY FOR RELEASE` (برای انتشار سورس، بیلد و تگ در GitHub؛ استقرار تجاری Production نیازمند کلیدهای عملیاتی سرویس‌های خارجی است)

---

## ۱. تشخیص منبع حقیقت (Source of Truth) و علت مشاهدهٔ نسخهٔ قدیمی در مرورگر

### ۱.۱ چرا کاربر هنگام دانلود نسخهٔ قبلی (`v1.2.0`) نسخهٔ قدیمی ۹ صفحه‌ای را در مرورگر می‌دید؟
بررسی دقیق تاریخچهٔ گیت (`git show-ref --tags -d` و `git log --oneline --decorate`) سه علت ریشه‌ای قطعی را مشخص کرد:

1. **اشارهٔ تگ `v1.2.0` به کامیت قدیمی `0f26796ab522fce688ff2f511cd28e355ee6837d`:**
   - در کامیت `0f26796` (که تگ `v1.2.0` روی آن ثبت شده بود)، پوشهٔ `releases/nimkat-final-release/frontend/` هنوز حاوی نمونهٔ اولیهٔ ۹ صفحه‌ای مبتنی بر **React 18 + Vite** (`"dev": "vite"` و باندل `dist/assets/index-DLbxE9Qj.js`) بود که در آن مسیر `/blog` به `/` ریدایرکت می‌شد و پنل‌ها ایستا بودند.
   - کامیت‌های بعدی (`e7ddd79` و `99c6d69`) که پلتفرم کامل Next.js 16 App Router و ۱۴ ماژول بک‌اند را به `releases/nimkat-final-release/` منتقل کردند، روی شاخهٔ `arena/c1a746f9-nimkat` پوش شدند اما تگ `v1.2.0` همچنان روی `0f26796` باقی مانده بود. در نتیجه دانلود `Source code (zip)` از صفحهٔ Release مربوط به `v1.2.0` محتوای کامیت `0f26796` را تحویل می‌داد.
2. **نواقص عملکردی باقی‌مانده در کامیت `99c6d69` پیش از بازیابی امروز:**
   - حتی در نسخهٔ Next.js 16 (`99c6d69`)، پیش از اصلاحات این مأموریت، موارد زیر ناقص بودند:
     - در `ClassesSearch.jsx` چهار `<select>` (`رشته`، `پایه`، `درس`، `مرتب‌سازی`) دارای `defaultValue` بدون `value` و `onChange` بودند و صفحه‌بندی روی `[1, 2, 3, '…', 14]` هاردکد شده بود.
     - زیرمسیرهای پنل شاگرد (`/panel/profile`، `/panel/notifications`، `/panel/reports`، `/panel/exams`) فاقد فایل `page.tsx` در Next.js App Router بودند.
     - درصد تکمیل پروفایل در `Dashboard.jsx` روی `۷۰٪` هاردکد شده بود.
     - صفحات قانونی و راهنمای فوتر (`/faq`، `/privacy`، `/terms`، `/cancellation-policy`، `/contact`، `/parent-guide`، `/sitemap`) در گروه `(public)` ایجاد نشده بودند.
     - مسیر `/rss.xml` در حالت توسعه بدون متغیر محیطی `SITE_URL` کد `503` برمی‌گرداند.
     - پراپ `variant` در `PanelLayout.jsx` باعث خطای TypeScript در `next build` می‌شد.

---

## ۲. جدول کامل مشکلات کشف‌شده، شدت، علت ریشه‌ای و اصلاح انجام‌شده

| شناسه | شدت | بخش | شرح مشکل | علت ریشه‌ای | اصلاح انجام‌شده و تست رگرسیون |
|---|---|---|---|---|---|
| **BUG-01** | `Blocker` | Release / Git Tag | دانلود ZIP از تگ `v1.2.0` نسخهٔ قدیمی Vite را در `releases/nimkat-final-release/` تحویل می‌داد. | تگ `v1.2.0` روی کامیت `0f26796` (قبل از همگام‌سازی کامل `99c6d69`) ثبت شده بود. | همگام‌سازی ۱:۱ ریشه و `releases/nimkat-final-release/` و انتشار تگ جدید و یکتای `v1.3.0` روی کامیت نهایی. |
| **BUG-02** | `Blocker` | Build / TypeScript | دستور `npm run build` در `frontend/` با خطای `TS2322` روی پراپ `variant` در `PanelLayout.jsx` متوقف می‌شد. | `layout.tsx`های `(student)`، `(teacher)` و `(parent)` پراپ `variant` می‌فرستادند اما `PanelLayout.jsx` فقط `role` می‌پذیرفت. | تعریف `role: propRole = '', variant = ''` در `PanelLayout.jsx`؛ تأیید با `next build --webpack` (`58/58 routes`). |
| **BUG-03** | `Critical` | جستجوی کلاس‌ها (`ClassesSearch.jsx`) | `<select>`های رشته، پایه، درس و مرتب‌سازی غیرکنترل‌شده بودند، فیلترهای بستر آنلاین و جنسیت استاد اعمال نمی‌شدند و صفحه‌بندی روی `14` ثابت بود. | استفاده از `defaultValue` و لیست ثابت `[1, 2, 3, '…', 14]` در `ClassesSearch.jsx`. | ایجاد `curriculum.js`، کنترل کامل تمام `<select>`ها، اعمال همهٔ فیلترها، ریست کامل با «پاک کردن همه»، صفحه‌بندی پویا، مودال «چطور انتخاب می‌کنیم؟» و فرم «پیشنهاد استاد». (`product-recovery.test.ts`) |
| **BUG-04** | `Critical` | پنل شاگرد (`/panel/*`) | لینک‌های «پروفایل و تنظیمات»، «اعلان‌ها»، «گزارش تحصیلی» و «آزمون‌ها» صفحهٔ اختصاصی نداشتند و درصد تکمیل پروفایل `۷۰٪` ثابت بود. | نبود `page.tsx` برای این ۴ مسیر و محاسبه نشدن `profileCompletion` در `/api/panel/overview`. | ایجاد ۴ صفحهٔ App Router و نماهای مربوطه، افزودن `GET/PUT /api/profile` و محاسبهٔ پویا با پاداش یک‌بارهٔ `profile.completed`. (`product-recovery.test.js`) |
| **BUG-05** | `High` | اعلان‌ها و فایل‌ها (`/panel/notifications`، `/panel/files`) | نبود امکان بستن اعلان (`dismiss`) بدون اثر مالی و نبود مسیر تجمیعی فایل‌های شاگرد. | نبود جدول `user_notification_dismissals` و مسیر `GET /api/materials/mine`. | افزودن مسیرهای `/api/notifications/*` و `/api/materials/mine` و بارگذاری خودکار فایل‌ها در `Materials.jsx`. (`product-recovery.test.js`) |
| **BUG-06** | `High` | نیم‌چت (`/panel/chat`) | نبود تب‌های دسته‌بندی اتاق‌ها، تنظیمات اعلان پایدار، انتخابگر پیوست جزوه و مودال گزارش تخلف. | نبود جدول `chat_user_settings` و استفاده از `window.prompt` در `Chat.jsx`. | افزودن `PUT /api/chats/:id/settings`، تب‌های دسته‌بندی، جستجو، انتخابگر پیوست جزوه، نشانگر SSE و مودال گزارش تخلف. (`product-recovery.test.js`) |
| **BUG-07** | `High` | فوتر و صفحات قانونی | لینک‌های فوتر برای سؤالات متداول، حریم خصوصی، قوانین، شرایط لغو، تماس با ما، راهنمای والدین و نقشهٔ سایت فاقد صفحهٔ مقصد بودند و `Login.jsx` دارای `href="#"` بود. | ایجاد نشدن صفحات در `src/app/(public)/`. | ایجاد ۷ صفحهٔ عمومی در `src/app/(public)/` و حذف تمام `href="#"` و `#magazine`. (`product-recovery.test.ts`) |
| **BUG-08** | `Medium` | پروفایل استاد و جزئیات کلاس | عدم تطابق کلید `teacher_id` / `teacherId` در `POST /api/questions`، موجودی ثابت کیف پول در `ClassDetail.jsx` و نبود حالت ۴۰۴ اختصاصی. | خواندن صرفاً `teacherId` در `server.js` و مقدار ثابت در `ClassDetail.jsx`. | پشتیبانی از هر دو کلید در `POST /api/questions`، دریافت موجودی واقعی کیف پول، انتخاب روش پرداخت و حالت ۴۰۴ اختصاصی. (`product-recovery.test.js`) |
| **BUG-09** | `Medium` | خوراک RSS (`/rss.xml`) | درخواست `GET /rss.xml` در محیط محلی بدون `SITE_URL` کد `503` برمی‌گرداند. | بازگشت `null` از `siteUrl()` در حالت توسعه. | بازگشت دامنهٔ پیش‌فرض امن `https://nimkat.ir` در حالت غیرتولید (`NODE_ENV !== 'production'`) و حفظ Fail-Closed در تولید. |

---

## ۳. حفاظت از داده‌ها، پایگاه داده و منطق مالی و امنیتی

1. **عدم دستکاری یا حذف دیتابیس اصلی:**
   - پوشهٔ `backend/data/` و `releases/nimkat-final-release/backend/data/` در `.gitignore` قرار دارند و هیچ فایل دیتابیس، کلید رمزنگاری (`settings.key`) یا فایل `.env` وارد گیت یا GitHub Release نشده است.
   - یک نسخهٔ پشتیبان آنلاین با `await db.backup('/tmp/nimkat-backup-verified.db')` تهیه و با `PRAGMA integrity_check` (`ok`) و شمارش ۱۰۱ جدول، ۴ کاربر پایه، ۷ استاد، ۵ کلاس، ۳ مقالهٔ مجله، ۵ سطح کلاب، ۳۴ قاعده (۱۹ قاعدهٔ شاگرد) و ۲۰ جایزه (۱۳ جایزهٔ شاگرد) راستی‌آزمایی شد.
2. **حفظ کامل منطق مالی، رزرو، دفتر کل و کلاب:**
   - دفتر کل دوطرفه (`ledger_journals` / `ledger_entries`)، رزرو و قفل ظرفیت، رزرو دوستانه، بازپرداخت مرحله‌ای و کامل، تسویهٔ اساتید، و تفکیک سکهٔ قابل مصرف (`coins`) از امتیاز سطح غیرقابل کاهش (`points`) و موجودی کیف پول (`wallet`) بدون هیچ تضعیفی حفظ شده و با ۱۱۸ تست بک‌اند تأیید شده‌اند.
