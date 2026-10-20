# تطبیق فنی نیمکت با مستند ارسالی

## وضعیت واقعی — ۲۰ اکتبر ۲۰۲۶

پیاده‌سازی فعلی React 18 + Vite + JavaScript، Express و SQLite است؛ هنوز
Next.js/TypeScript/PostgreSQL/Redis نیست. نصب پکیج به معنای تحقق تمام سند نیست.
متن PDF شامل نویسه‌های خراب در برخی تیترهاست؛ موارد مبهم دست‌نویس باید پیش از
تبدیل به معیار پذیرش قطعی، با کارفرما تطبیق داده شوند.

## ساختار هدف (مطابق صفحات ۳ تا ۷ سند)

- Frontend: Next.js App Router + TypeScript؛ گروه مسیرهای public/auth/student/teacher/parent/admin.
- Public SSR/SSG: خانه، جستجو، پروفایل استاد، بلاگ و حقوقی؛ پنل‌ها noindex.
- Tailwind + توکن‌های برند، TanStack Query، Zustand، React Hook Form + Zod.
- Backend: Modular Monolith با مرز دامنه‌های auth/users/catalog/scheduling/booking/payments/wallet/chat/club/content/support.
- PostgreSQL 16 برای داده و تراکنش؛ Redis برای OTP/rate limit/cache/queue/pubsub.
- Socket.io، S3-compatible object storage، Docker + CI/CD.
- OTP کوتاه‌عمر، refresh cookie از نوع HttpOnly، revoke سمت سرور؛ نه localStorage تولیدی.
- رزرو ضد double booking، تراکنش و قفل، پرداخت idempotent و ledger دوطرفه append-only.
- سرویس کلاس آنلاین از طریق adapter سرور؛ لینک/اعتبارنامه نباید در فرانت تولید شود.

## انجام‌شده در این تغییر

- نصب مهارت‌های UI/UX Pro Max با حفظ لایسنس؛ اجرای جست‌وجوی طراحی، UX و Next.js.
- نصب و اتصال Tailwind v4 به Vite، بدون preflight و با prefix برای حفظ طراحی موجود.
- نصب و استفاده Motion: ورود صفحه و reveal بلوک‌های منتشرشده؛ reduced-motion.
- توکن‌های برند، focus-visible و بازخورد دکمه‌ها.
- رفع viewport ثابت PageRenderer: override عمومی اکنون از عرض واقعی مرورگر استفاده می‌کند.

## باقی‌مانده؛ ادعای تکمیل ندارند

1. بلوکی‌کردن جستجوی کلاس، پروفایل استاد، جزئیات کلاس و کلاب با حفظ رفتارها و فیلدهای قابل ویرایش.
2. مهاجرت کنترل‌شده به Next.js/TypeScript، همراه تست برابری مسیرها، SEO و حفظ اسکیماهای ویرایشگر.
3. زیرساخت PostgreSQL/Redis و ماژولارسازی بک‌اند با migration داده.
4. امنیت احراز هویت، سرویس‌های واقعی پیامک/درگاه/کلاس، ledger و تست همزمانی رزرو.
5. Query/store/forms، تقویم شمسی، realtime، PWA و رصد خطا؛ نصب هرکدام همراه کاربرد واقعی.
6. Vitest/Playwright، تست‌های مالی و کنترل بصری موبایل/دسکتاپ، CI.

## نکات تصاویر جلسه

نکات خوانا شامل SSR، ورود داده اولیه CSV، سطح دسترسی superadmin، جلوگیری از
رزرو تکراری، اطلاع‌رسانی پیامکی قبل کلاس، ظرفیت همزمان کلاس، تیکتینگ، کانال
اطلاع‌رسانی و پرداخت است. اعداد، نام درگاه و عبارت‌های ناخوانا هنوز معیار پذیرش
قطعی نیستند. PDF همچنین استک را معماری مرجع می‌نامد و تطبیق با پیوست فنی قرارداد
را لازم می‌داند؛ نباید از این سند به‌تنهایی تعهد اجرایی قراردادی جدید ساخت.
