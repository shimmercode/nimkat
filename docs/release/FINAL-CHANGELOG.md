# فهرست جامع تغییرات نسخه نهایی (`FINAL-CHANGELOG.md`)

## نسخه `v1.3.0` — بازیابی کامل محصول، احیای مسیرها، همگام‌سازی مخزن و تکمیل تست‌ها (`2026-10-25`)

### ۱. مجله نیمکت و صفحات محتوایی
- اصلاح لینک‌های `#magazine` به `/blog` در `frontend/src/blocks/home-blocks-2.jsx` و `frontend/src/components/BlogTeasers.jsx`.
- افزودن حالت بارگذاری، خطا و دکمهٔ «تلاش دوباره» به `BlogTeasers.jsx`.
- افزودن مدیریت خطای ارتباط با سرور در `frontend/src/app/(public)/blog/page.tsx`.
- اصلاح `siteUrl()` در `frontend/src/server/seo.ts` برای فعال بودن `/rss.xml` و `/sitemap.xml` در محیط توسعه بدون نیاز به تنظیم دستی متغیر محیطی، با حفظ رفتار Fail-Closed در محیط تولید.
- افزودن لینک مستقیم پروفایل اساتید (`/teachers/1` تا `/teachers/7`) به کارت‌های اساتید برتر در `frontend/src/views/Home.jsx` و `frontend/src/blocks/home-blocks-1.jsx`.

### ۲. جستجو و انتخاب کلاس (`HeroSearch.jsx` و `ClassesSearch.jsx`)
- ایجاد ماژول `frontend/src/utils/curriculum.js` برای مدیریت سلسله‌مراتب «مقطع»، «رشته»، «پایه» و «درس».
- تبدیل تمام `<select>`های صفحهٔ جستجوی کلاس‌ها به کنترل‌شده (`value` + `onChange`) و حذف کامل `defaultValue`.
- اعمال واقعی فیلترهای «رشته»، «پایه»، «بستر کلاس آنلاین» (`اسکای‌روم`، `فنوتک`، `گوگل‌میت`) و «جنسیت استاد» (`خانم` / `آقا`) علاوه بر فیلترهای قیمت، روز، ساعت، سطح و امتیاز.
- ریست کامل تمام فیلترها با دکمهٔ «پاک کردن همه» و بازگشت خودکار شمارهٔ صفحه به `۱` هنگام تغییر هر فیلتر یا ترتیب مرتب‌سازی.
- جایگزینی صفحه‌بندی ثابت `[1, 2, 3, '…', 14]` با صفحه‌بندی پویا بر اساس تعداد واقعی نتایج.
- افزودن مودال دسترس‌پذیر «چطور انتخاب می‌کنیم؟» و مودال فرم «پیشنهاد استاد» متصل به `POST /api/callback`.

### ۳. پنل شاگرد، پروفایل، اعلان‌ها و فایل‌ها
- ایجاد صفحات App Router جدید در `frontend/src/app/(student)/panel/`:
  - `profile/page.tsx` (`frontend/src/views/panel/ProfileSettings.jsx`)
  - `notifications/page.tsx` (`frontend/src/views/panel/Notifications.jsx`)
  - `reports/page.tsx` (`frontend/src/views/panel/AcademicReport.jsx`)
  - `exams/page.tsx` (`frontend/src/views/panel/Exams.jsx`)
- اصلاح `frontend/src/layouts/PanelLayout.jsx` برای پشتیبانی هم‌زمان از پراپ‌های `role` و `variant` و نمایش نشانگرهای پویا.
- افزودن محاسبهٔ واقعی درصد تکمیل پروفایل (`buildProfileCompletion`) و مسیرهای `GET /api/profile` و `PUT /api/profile` در `backend/src/modules/panel/index.js` با اعطای یک‌بارهٔ پاداش `profile.completed`.
- افزودن مسیرهای `GET /api/notifications`، `POST /api/notifications/read-all`، `POST /api/notifications/:id/read` و `POST /api/notifications/:id/dismiss` با جدول `user_notification_dismissals`.
- افزودن مسیر `GET /api/materials/mine` در `backend/src/modules/education/materials.js` و نمایش خودکار تمام فایل‌های مجاز در `/panel/files`.

### ۴. نیم‌چت (`Chat.jsx` و `backend/src/modules/chat/index.js`)
- افزودن جدول `chat_user_settings` و مسیر `PUT /api/chats/:id/settings` برای ذخیرهٔ پایدار تنظیمات اعلان هر گفتگو.
- افزودن تب‌های دسته‌بندی اتاق‌ها (`همه`، `کلاس‌ها`، `اساتید و خصوصی`، `گروه‌ها`، `اعلان‌ها`)، جستجوی اتاق و جستجوی پیام.
- افزودن انتخابگر پیوست از جزوه‌های تأییدشدهٔ کلاس، نشانگر وضعیت اتصال لحظه‌ای (SSE) و مودال گزارش تخلف پیام.

### ۵. نیمکت کلاب، پروفایل استاد، جزئیات کلاس و صفحات قانونی فوتر
- نمایش دلیل دقیق وضعیت هر جایزه روی دکمهٔ کارت جایزه، افزودن مودال تأیید دریافت جایزه و مودال «چطور انتخاب می‌کنیم و قوانین نیمکت کلاب چیست؟» در `frontend/src/views/panel/Club.jsx`.
- پشتیبانی از هر دو کلید `teacherId` و `teacher_id` در `POST /api/questions` و نمایش پویا و حالت ۴۰۴ در `TeacherProfile.jsx` و `ClassDetail.jsx`.
- ایجاد صفحات عمومی `/faq`، `/privacy`، `/terms`، `/cancellation-policy`، `/contact`، `/parent-guide` و `/sitemap` در `frontend/src/app/(public)/` و به‌روزرسانی `Footer.jsx`، `Login.jsx` و `sitemap.ts`.
- همگام‌سازی کامل `releases/nimkat-final-release/` با ریشهٔ مخزن و به‌روزرسانی `SHA256SUMS`.
