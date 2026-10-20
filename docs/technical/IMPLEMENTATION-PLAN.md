# تطبیق فنی نیمکت با مستند ارسالی

## وضعیت واقعی — ۲۰ اکتبر ۲۰۲۶

فرانت‌اند از Vite/React Router به **Next.js 16 App Router + React 19** منتقل شد.
entryها، routeها، layoutهای ریشه، helperهای سرور و قرارداد اسکیما TypeScript هستند؛
کامپوننت‌های قدیمی JSX با allowJs حفظ شده‌اند و هنوز همه به TS تبدیل نشده‌اند.
بک‌اند همچنان Express/SQLite است، نه PostgreSQL/Redis.
متن PDF در برخی تیترها نویسه‌های خراب دارد؛ موارد ناخوانای تصاویر جلسه قبل از
تبدیل به معیار پذیرش باید تطبیق داده شوند.

## ساختار هدف مطابق سند

- Next App Router، TypeScript، SSR/SSG عمومی و CSR محافظت‌شده پنل‌ها.
- گروه مسیرهای public/auth/student/teacher/parent/admin.
- Tailwind + توکن‌های برند، TanStack Query، Zustand، React Hook Form + Zod.
- بک‌اند Modular Monolith: auth/users/catalog/scheduling/booking/payments/wallet/chat/club/content/support.
- PostgreSQL 16، Redis، Socket.io، S3-compatible storage، Docker و CI/CD.
- OTP کوتاه‌عمر، refresh cookie از نوع HttpOnly، revoke سمت سرور.
- رزرو ضد double booking، تراکنش و قفل، پرداخت idempotent و ledger دوطرفه append-only.
- کلاس آنلاین با adapter سرور؛ اعتبارنامهٔ سرویس‌ها هرگز در فرانت قرار نگیرد.

## انجام‌شده

1. نصب UI/UX Pro Max و استفاده از جست‌وجوی آن با حفظ برند/PDF؛ Tailwind و Motion.
2. جایگزینی روتر SPA و build Vite با Next App Router. درخواست /api هم‌مبدأ با rewrite.
3. SSR عمومی، دریافت محتوای منتشرشده در سرور، متادیتای نام استاد/کلاس، robots،
   sitemap وابسته به دامنهٔ واقعی و JSON-LD Person/Course.
4. پشتیبانی ویرایشگر برای خانه، جستجوی کلاس، پروفایل استاد، جزئیات کلاس و کلاب.
   صفحات کاربردی widgetهای یکپارچه با متن‌های قابل‌ویرایش‌اند؛ هنوز تک‌تک کارت‌های
   داخلی آن‌ها بلوک مستقل نیستند. منطق رزرو و فیلتر محفوظ است.
5. اولویت محتوای اختصاصی teacher-ID/class-ID نسبت به قالب عمومی؛ پنل و مسیر عمومی کلاب.
6. جداسازی snapshot منتشرشده از پیش‌نویس با migration افزایشی، تراکنش save/publish
   و snapshot؛ validation ساختاری محدود به عمق/تعداد و ID یکتا.
7. استخراج دامنه content در بک‌اند؛ سایر دامنه‌ها هنوز یکپارچه در server.js هستند.
8. کنترل دسترسی ویرایشگر، preview غیرتعاملی برای widgetهای مالی، return-to پس از ورود.
9. تست‌های Vitest، Node test و Playwright برای انتشار/SSR/دسترسی و استقلال پیش‌نویس.

## باقی‌مانده؛ ادعای تکمیل ندارند

- مهاجرت تمام JSX و مدل‌های مالی به TypeScript و تکمیل اعتبارسنجی دامنه.
- PostgreSQL/Redis، migration و انتقال داده و modularization تمام بک‌اند.
- امنیت production نشست/OTP، HttpOnly refresh/revoke، rate limit و audit.
- پیامک/درگاه/کلاس واقعی، ledger، تست همزمانی رزرو و reconciliation.
- Query/store/forms مطابق سند، تقویم شمسی، realtime، PWA، object storage و رصد خطا.
- تکمیل پنل مستقل والدین و ماژول‌های باقی‌مانده سند و تست‌های پذیرش آن‌ها.
- اصلاحات ریز responsive پنل‌ها و بوم ویرایشگر؛ کنترل بصری جامع در تمام breakpointها.
- E2E مالی و آزمون بار قبل از ورود پول واقعی.

## نکات تصاویر جلسه

موارد خوانا شامل SSR، CSV، superadmin، ضد double booking، پیامک قبل از کلاس،
ظرفیت همزمان، تیکتینگ، کانال اطلاع‌رسانی و پرداخت‌اند. اعداد و نام‌های مبهم هنوز
معیار قطعی نیستند. خود PDF معماری را مرجع و تطبیق با پیوست فنی قرارداد را لازم
می‌داند؛ نباید صرفاً از روی آن تعهد قراردادی جدید ساخت.
