# گزارش جامع بازیابی محصول، احیای صفحات و کنترل کیفیت عملکردی نیمکت (`2026-10-25`)

- **تاریخ اجرا:** `2026-10-25` (`Asia/Tehran`)
- **شاخه کاری:** `arena/c1a746f9-nimkat` (بدون commit، push یا deploy جدید طبق دستور کاربر)
- **وضعیت آمادگی تولید (`productionReadiness`):** `false` (به دلیل وابستگی‌های عملیاتی خارجی مانند درگاه شاپرک/زرین‌پال، پنل پیامک OTP تجاری، اسکای‌روم تجاری، ClamAV زنده و نبود باینری Chromium در محیط ایزوله برای اجرای مرورگر Playwright)

---

## ۱. تشخیص نسخهٔ در حال اجرا و ریشه‌یابی کلی (فاز ۰)

### ۱.۱ علت تفاوت نسخه‌ها روی `localhost:5173`
1. **نسخهٔ اولیهٔ آرشیوشده در کامیت‌های قدیمی (`55e5bba` / `b79f45e`):**
   - یک نمونهٔ اولیهٔ ۹ صفحه‌ای مبتنی بر Vite + React Router (`frontend/src/App.jsx`) بود که در آن مسیر `/blog` به `/` ریدایرکت می‌شد، صفحات قانونی فوتر وجود نداشتند، و لینک‌های پنل شاگرد به مسیرهای ناموجود اشاره داشتند.
2. **نسخهٔ کامل پلتفرم در ریشهٔ مخزن (`frontend/` با Next.js 16.4.2 App Router + `backend/` با ۱۴ ماژول Express):**
   - نقطهٔ ورود واقعی در `frontend/package.json` دستور `next dev --webpack --hostname 0.0.0.0 --port 5173` و در `backend/package.json` دستور `node src/server.js` روی پورت `8000` است.
   - پوشهٔ `releases/nimkat-final-release/` نیز به‌طور کامل با نسخهٔ ریشه همگام‌سازی شده است تا اجرای محلی از هر دو مسیر یکسان باشد.

---

## ۲. فهرست کامل مشکلات کشف‌شده و علت ریشه‌ای هر مورد (فازهای ۱ تا ۹)

| فاز | بخش / صفحه | مشکل کشف‌شده | علت ریشه‌ای | وضعیت پس از اصلاح |
|---|---|---|---|---|
| **فاز ۱** | مجله نیمکت (`/blog`، `/blog/[slug]`، صفحه اصلی) | لینک دکمهٔ «همه‌ی مقاله‌ها» در بلوک مجلهٔ صفحه اصلی به `#magazine` اشاره داشت؛ کارت‌های اساتید برتر در بلوک صفحه اصلی فاقد لینک مستقیم به پروفایل استاد بودند؛ `BlogTeasers.jsx` فاقد حالت خطا/تلاش مجدد و بارگذاری بود. | مقدار پیش‌فرض `moreHref: '#magazine'` در `home-blocks-2.jsx` و نبود `href` در `topTeachersSpec.defaults.teachers` در `home-blocks-1.jsx` و `Home.jsx`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۲** | فرم جستجوی کلاس‌ها (`HeroSearch.jsx` و `ClassesSearch.jsx`) | ۱) در `ClassesSearch.jsx` چهار `<select>` مربوط به «رشته»، «پایه»، «درس» و «مرتب‌سازی» دارای `defaultValue` بدون `value` و `onChange` بودند؛ ۲) تغییر «مقطع» گزینه‌های «رشته»، «پایه» و «درس» را به‌روز نمی‌کرد؛ ۳) فیلترهای «بستر کلاس آنلاین» (`platforms`) و «جنسیت استاد» (`gender`) در تابع فیلتر اعمال نمی‌شدند؛ ۴) دکمهٔ «پاک کردن همه» همهٔ فیلترها را ریست نمی‌کرد؛ ۵) صفحه‌بندی روی `[1, 2, 3, '…', 14]` هاردکد شده بود؛ ۶) دکمهٔ «چطور انتخاب می‌کنیم؟» و «پیشنهاد استاد» به مودال/فرم واقعی متصل نبودند. | پیاده‌سازی اولیهٔ ایستا برای کنترل‌های سایدبار و صفحه‌بندی در `ClassesSearch.jsx` و نبود جدول سلسله‌مراتبی برنامهٔ درسی. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۳** | پنل شاگرد (`/panel` و زیرمسیرها) | ۱) لینک‌های سایدبار برای «گزارش تحصیلی»، «آزمون‌ها و تمرین‌ها»، «اعلان‌ها» و «پروفایل و تنظیمات» صفحهٔ اختصاصی نداشتند؛ ۲) درصد تکمیل پروفایل در `Dashboard.jsx` روی `۷۰٪` هاردکد شده بود؛ ۳) کارت کلاس پیش‌رو و فایل‌های اخیر در داشبورد به تست فنی و دانلود واقعی متصل نبودند. | نبود مسیرهای App Router برای `/panel/profile`، `/panel/notifications`، `/panel/reports` و `/panel/exams` و محاسبه نشدن `profileCompletion` در `/api/panel/overview`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۴** | نیم‌چت (`/panel/chat`) | ۱) نبود تب‌های دسته‌بندی اتاق‌ها (`همه`، `کلاس‌ها`، `اساتید و خصوصی`، `گروه‌ها`، `اعلان‌ها`) و جستجو در فهرست گفتگوها؛ ۲) نبود مودال تنظیمات گفتگو و اعلان‌ها با ذخیرهٔ پایدار در بک‌اند؛ ۳) استفاده از `window.prompt` برای گزارش تخلف به‌جای مودال دارای اعتبارسنجی؛ ۴) نبود انتخابگر پیوست از فایل‌های تأییدشدهٔ کلاس؛ ۵) نبود نشانگر وضعیت اتصال لحظه‌ای (SSE). | پیاده‌سازی فشردهٔ اولیه در `Chat.jsx` و نبود جدول `chat_user_settings` در `backend/src/modules/chat/index.js`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۵** | اعلان‌ها و فایل‌ها (`/panel/notifications`، `/panel/files`) | ۱) نبود امکان فیلتر دسته‌ای اعلان‌ها، خوانده‌شدن تکی/جمعی و بستن اعلان (`dismiss`) بدون دستکاری سوابق مالی؛ ۲) در `/panel/files` نیاز به انتخاب دستی جلسه قبل از مشاهدهٔ همهٔ فایل‌های مجاز وجود داشت. | نبود جدول `user_notification_dismissals` و مسیرهای `/api/notifications/*` و `/api/materials/mine`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۶** | نیمکت کلاب (`/club` و `/panel/club`) | ۱) دکمهٔ جوایز غیرفعال دلیل دقیق غیرفعال بودن (عدم ورود، کمبود سکه، سطح موردنیاز، اتمام موجودی یا غیرفعال بودن در تنظیمات مدیر) را روی دکمه نشان نمی‌داد؛ ۲) نبود مودال دسترس‌پذیر «چطور انتخاب می‌کنیم و قوانین نیمکت کلاب چیست؟» و دیالوگ تأیید دریافت جایزه. | نمایش متن ثابت «دریافت جایزه» روی همهٔ دکمه‌ها در `Club.jsx`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۷** | صفحات اساتید و جزئیات کلاس (`/teachers/[id]`، `/classes/[id]`) | ۱) در `TeacherProfile.jsx` برخی فیلدها ثابت بودند و ارسال پرسش کلید `teacher_id` می‌فرستاد در حالی که سرور `teacherId` می‌خواند؛ ۲) در `ClassDetail.jsx` موجودی کیف پول روی `۱٬۲۴۰٬۰۰۰` هاردکد شده بود، انتخاب روش پرداخت (درگاه/کیف پول) وجود نداشت و چیپ «چت پشتیبانی» رویداد باز کردن پشتیبانی را صدا نمی‌زد؛ ۳) خطای ۴۰۴ برای شناسهٔ نامعتبر استاد/کلاس حالت اختصاصی نداشت. | عدم تطابق نام کلید در `POST /api/questions` و مقادیر نمونهٔ اولیه در `TeacherProfile.jsx` و `ClassDetail.jsx`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۸** | فوتر و صفحات قانونی و راهنما (`Footer.jsx`، `Login.jsx`) | لینک‌های فوتر برای `سؤالات متداول`، `حریم خصوصی`، `قوانین و مقررات`، `شرایط لغو`، `تماس با ما`، `راهنمای والدین` و `نقشهٔ سایت` به مسیرهای دارای صفحهٔ اختصاصی متصل نبودند و در `Login.jsx` دو لینک `href="#"` وجود داشت. | ایجاد نشدن صفحات عمومی `/faq`، `/privacy`، `/terms`، `/cancellation-policy`، `/contact`، `/parent-guide` و `/sitemap` در گروه `(public)`. | **اصلاح‌شده و آزمون‌شده** |
| **فاز ۹** | یکپارچگی فنی، TypeScript و سرور | ۱) در `PanelLayout.jsx` پراپ `variant` ارسالی از `layout.tsx`های `(student)`، `(teacher)` و `(parent)` در امضای تابع تعریف نشده بود که باعث خطای TypeScript در `next build` می‌شد؛ ۲) در `backend/src/server.js` فراخوانی `app.listen` هنگام `require` شدن در تست‌ها شرط `require.main === module` نداشت. | ناهماهنگی نام پراپ `role` و `variant` در `PanelLayout.jsx` و نبود شرط `NIMKAT_AUTO_LISTEN` در `server.js`. | **اصلاح‌شده و آزمون‌شده** |

---

## ۳. فایل‌ها و بخش‌های تغییریافته یا ایجادشده

### ۳.۱ بک‌اند (`backend/`)
- `backend/src/server.js`:
  - پذیرش هر دو کلید `teacherId` و `teacher_id` در `POST /api/questions`.
  - افزودن گارد `if (require.main === module && process.env.NIMKAT_AUTO_LISTEN !== 'false')` پیش از `app.listen` و خروجی دادن `{ app, db }`.
- `backend/src/modules/panel/index.js`:
  - افزودن جدول `user_notification_dismissals` و مهاجرت ایمن ستون‌های `subtitle`، `letter` و `platform`.
  - محاسبهٔ پویا و واقعی درصد تکمیل پروفایل (`buildProfileCompletion`) از روی فیلدهای واقعی کاربر و پروفایل کلاب.
  - افزودن مسیرهای `GET /api/profile` و `PUT /api/profile` با اعطای یک‌باره و幂 (Idempotent) پاداش `profile.completed`.
  - افزودن مسیرهای `GET /api/notifications`، `POST /api/notifications/read-all`، `POST /api/notifications/:id/read` و `POST /api/notifications/:id/dismiss` بدون حذف یا تغییر هیچ رکورد مالی یا رزرو.
- `backend/src/modules/chat/index.js`:
  - افزودن جدول `chat_user_settings` و مسیر `PUT /api/chats/:id/settings` برای ذخیرهٔ پایدار تنظیمات اعلان هر گفتگو (`notifyAll`، `sound`، `preview`، `teacherOnly`) و بازگرداندن آن در `GET /api/chats/:id`.
- `backend/src/modules/education/materials.js`:
  - افزودن مسیر `GET /api/materials/mine` برای فهرست کردن تمام فایل‌های بررسی‌شده و مجاز کاربر در همهٔ جلسات.
- `backend/tests/product-recovery.test.js`:
  - افزودن مجموعه تست‌های رگرسیون یکپارچه برای فازهای ۱ تا ۶.

### ۳.۲ فرانت‌اند (`frontend/`)
- **مسیرها و صفحات جدید Next.js App Router:**
  - `frontend/src/app/(public)/faq/page.tsx`
  - `frontend/src/app/(public)/privacy/page.tsx`
  - `frontend/src/app/(public)/terms/page.tsx`
  - `frontend/src/app/(public)/cancellation-policy/page.tsx`
  - `frontend/src/app/(public)/contact/page.tsx`
  - `frontend/src/app/(public)/parent-guide/page.tsx`
  - `frontend/src/app/(public)/sitemap/page.tsx`
  - `frontend/src/app/(student)/panel/profile/page.tsx`
  - `frontend/src/app/(student)/panel/notifications/page.tsx`
  - `frontend/src/app/(student)/panel/reports/page.tsx`
  - `frontend/src/app/(student)/panel/exams/page.tsx`
- **نماها و کامپوننت‌های جدید و به‌روزشده:**
  - `frontend/src/utils/curriculum.js`: سلسله‌مراتب مقاطع، رشته‌ها، پایه‌ها و دروس.
  - `frontend/src/components/HeroSearch.jsx` و `frontend/src/views/ClassesSearch.jsx`: کنترل کامل `<select>`ها، وابستگی مقطع/رشته/پایه/درس، اعمال تمام فیلترها، ریست کامل با «پاک کردن همه»، ریست صفحه به ۱ در تغییر فیلتر، صفحه‌بندی پویا، مودال دسترس‌پذیر «چطور انتخاب می‌کنیم؟» و فرم مودال «پیشنهاد استاد».
  - `frontend/src/components/BlogTeasers.jsx`، `frontend/src/app/(public)/blog/page.tsx`، `frontend/src/blocks/home-blocks-1.jsx`، `frontend/src/blocks/home-blocks-2.jsx` و `frontend/src/views/Home.jsx`: اصلاح لینک‌های مجله (`/blog`) و پروفایل اساتید (`/teachers/1` تا `/teachers/7`) و مدیریت حالت خطا/تلاش مجدد.
  - `frontend/src/layouts/PanelLayout.jsx` و `frontend/src/views/panel/Dashboard.jsx`: اصلاح لینک‌های منوی شاگرد، نشانگرهای پویا، کارت تکمیل پروفایل پویا، تست فنی و ورود به کلاس، دانلود واقعی فایل‌ها و مدیریت اعلان‌ها.
  - `frontend/src/views/panel/{ProfileSettings,Notifications,AcademicReport,Exams,Calendar,Materials,Chat,Club}.jsx`: پیاده‌سازی کامل صفحات پنل شاگرد، نیم‌چت، تقویم، فایل‌ها و نیمکت کلاب.
  - `frontend/src/views/{TeacherProfile,ClassDetail,Login}.jsx`، `frontend/src/components/Footer.jsx`، `frontend/src/app/not-found.tsx` و `frontend/src/app/sitemap.ts`.
  - `frontend/tests/unit/product-recovery.test.ts`: تست‌های واحد و یکپارچگی مسیرها و کنترل‌ها.

---

## ۴. فهرست کامل صفحات و لینک‌های بازیابی‌شده

| مسیر (`Route`) | عنوان صفحه | وضعیت |
|---|---|---|
| `/blog` | مجله نیمکت (فهرست مقالات، جستجو، دسته‌بندی، صفحه‌بندی و RSS) | فعال و تست‌شده |
| `/blog/[slug]` | صفحهٔ مطالعهٔ مقاله با فهرست مطالب، برچسب‌ها، مقالات مرتبط و ۴۰۴ برای اسلاگ نامعتبر | فعال و تست‌شده |
| `/classes` | جستجوی پیشرفتهٔ کلاس‌ها و اساتید با فیلترهای کنترل‌شده و صفحه‌بندی واقعی | فعال و تست‌شده |
| `/classes/[id]` | جزئیات کلاس، انتخاب زمان از تقویم واقعی، محاسبهٔ قیمت پلکانی/دوستانه/کد تخفیف و رزرو | فعال و تست‌شده |
| `/teachers/[id]` | پروفایل کامل استاد، تقویم جلسات آزاد، نظرات تأییدشده و ثبت پرسش | فعال و تست‌شده |
| `/panel` | داشبورد شاگرد با تکمیل پروفایل واقعی، کلاس پیش‌رو، تست فنی، فایل‌ها و اعلان‌ها | فعال و تست‌شده |
| `/panel/calendar` | تقویم شمسی جلسات، ورود به کلاس، تغییر زمان توافقی و لغو/بازپرداخت واقعی | فعال و تست‌شده |
| `/panel/chat` | نیم‌چت با تب‌های دسته‌بندی، جستجو، پیوست جزوه، تنظیمات اعلان پایدار و گزارش تخلف | فعال و تست‌شده |
| `/panel/reports` | کارنامه و گزارش تحصیلی هشت‌شاخصی شاگرد | فعال و تست‌شده |
| `/panel/exams` | آزمون‌ها، تمرین‌ها و پیگیری تکالیف جلسات | فعال و تست‌شده |
| `/panel/files` | همهٔ فایل‌ها و جزوه‌های بررسی‌شده با دانلود امن | فعال و تست‌شده |
| `/panel/finance` | کیف پول، شارژ، رزروها و ثبت درخواست بازپرداخت | فعال و تست‌شده |
| `/panel/club` | نیمکت کلاب شاگرد (۵ سطح، ۱۹ قاعده، ۱۳ جایزه، گردونه و لیگ) | فعال و تست‌شده |
| `/panel/notifications` | مرکز اعلان‌ها با فیلتر دسته‌ای، خواندن و بستن ایمن | فعال و تست‌شده |
| `/panel/profile` | پروفایل و تنظیمات شاگرد با محاسبهٔ درصد واقعی و پاداش یک‌بارهٔ تکمیل پروفایل | فعال و تست‌شده |
| `/faq` | سؤالات متداول دسته‌بندی‌شده با جستجو | فعال و تست‌شده |
| `/privacy` | سیاست حریم خصوصی و امنیت داده‌ها | فعال و تست‌شده |
| `/terms` | قوانین و مقررات سامانه | فعال و تست‌شده |
| `/cancellation-policy` | شرایط لغو کلاس و بازگشت وجه | فعال و تست‌شده |
| `/contact` | تماس با ما و فرم ثبت درخواست مشاوره تلفنی (`POST /api/callback`) | فعال و تست‌شده |
| `/parent-guide` | راهنمای جامع والدین | فعال و تست‌شده |
| `/sitemap` | نقشهٔ سایت HTML + لینک به `/sitemap.xml` و `/rss.xml` | فعال و تست‌شده |

---

## ۵. نتایج تست‌های خودکار قبل و بعد از تغییرات (فاز ۱۰)

| مجموعه آزمون | قبل از تغییرات (Baseline) | بعد از تغییرات (Final) | وضعیت |
|---|---|---|---|
| **تست‌های بک‌اند (`cd backend && npm test`)** | `115 pass, 0 fail` | **`118 pass, 0 fail`** (شامل تست‌های یکپارچهٔ جدید در `product-recovery.test.js`) | `PASS` |
| **تست‌های فرانت‌اند (`cd frontend && npm test`)** | `5 files, 18 pass, 0 fail` | **`6 files, 23 pass, 0 fail`** (شامل تست‌های جدید در `product-recovery.test.ts`) | `PASS` |
| **بیلد کامل تولید Next.js + TypeScript (`cd frontend && npm run build`)** | خطای TypeScript روی `variant` در `PanelLayout.jsx` | **`Compiled successfully` + `Finished TypeScript in 657ms` + `58/58 routes built`** | `PASS` |
| **تست مرورگر Playwright (`npx playwright test`)** | `BLOCKED` (عدم دسترسی شبکهٔ سندباکس به `cdn.playwright.dev` برای دانلود باینری Chromium) | `BLOCKED` (گزارش صادقانه طبق دستور؛ تست‌های API، واحد و بیلد کامل اجرا و تأیید شدند) | `BLOCKED` |

---

## ۶. وابستگی‌های سرویس خارجی و وضعیت نهایی آمادگی تولید

1. **درگاه پرداخت بانکی (شاپرک / زرین‌پال):** آداپتور و دفتر کل دوطرفه (`ledger_journals` / `ledger_entries`) کاملاً پیاده‌سازی و تست شده است؛ برای تراکنش بانکی واقعی نیازمند `merchantId` عملیاتی در پنل تنظیمات مدیر (`/admin/integrations`) است.
2. **سرویس پیامک OTP:** آداپتور پیامک و محدودکنندهٔ نرخ درخواست کاملاً پیاده‌سازی شده است؛ در محیط تولید (`NODE_ENV=production`) بدون تنظیم کلید سرویس پیامک به‌صورت Fail-Closed عمل می‌کند.
3. **اتاق کلاس آنلاین (اسکای‌روم) و وب‌هوک حضور:** بررسی پنجرهٔ زمانی (۱۵ دقیقه قبل تا ۱۵ دقیقه بعد)، مجوز رزرو قطعی و بررسی امضای HMAC وب‌هوک حضور پیاده‌سازی و تست شده است؛ نیازمند کلید API اسکای‌روم در محیط عملیاتی است.
4. **اسکنر امنیتی فایل‌ها (ClamAV INSTREAM):** پروتکل `zINSTREAM` و بررسی امضای باینری فایل‌ها پیاده‌سازی و تست شده است؛ نیازمند سرویس `clamd` روی پورت `3310` در محیط عملیاتی است.
5. **متون حقوقی (`/terms`، `/privacy`):** بر اساس منطق واقعی سامانه تدوین شده و به‌وضوح با برچسب پیش‌نویس نیازمند تصویب نهایی حقوقی پیش از بهره‌برداری تجاری مشخص شده‌اند.

- **نتیجهٔ نهایی `productionReadiness`:** `false` (تا زمان اتصال سرویس‌های تجاری خارجی بالا و اجرای تست مرورگر در محیط دارای باینری Chromium).
