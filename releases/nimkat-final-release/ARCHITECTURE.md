# معماری فنی پلتفرم نیمکت (`ARCHITECTURE.md`)

## ۱. ساختار کلی
- **Frontend (`frontend/`):** اپلیکیشن تک‌صفحه‌ای (SPA) مبتنی بر React 18، React Router 6 و Vite 5 با طراحی راست‌به‌چپ (RTL)، تایپوگرافی فارسی و توکن‌های رنگی سیستم طراحی نیمکت (`#0A6847`, `#053D29`, `#21A878`, `#F28A3D`).
- **Backend (`backend/`):** سرور REST API مبتنی بر Node.js 22 و Express 4 به همراه دیتابیس رابطه‌ای `better-sqlite3` در حالت `WAL` (`journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`).
- **Container & Reverse Proxy:** فایل‌های `Dockerfile.backend`، `Dockerfile.frontend`، `docker-compose.yml` و `nginx.conf` برای استقرار دو کانتینره پشت Nginx.

## ۲. ماژول‌های اصلی دامنه
1. **احراز هویت OTP و مدیریت نشست (`/api/auth/otp/request`, `/api/auth/otp/verify`, `/api/auth/me`)**
2. **جستجو و پروفایل اساتید و کلاس‌ها (`/api/teachers`, `/api/classes`)**
3. **پیش‌فاکتور، تخفیف پلکانی/دوستانه/کوپن و رزرو کلاس (`/api/bookings/quote`, `/api/bookings`)**
4. **باشگاه مشتریان نیمکت کلاب (`/api/club`, `/api/club/rewards/:id/claim`)**
5. **پنل دانش‌آموز، کیف پول و اعلان‌ها (`/api/panel/student`, `/api/wallet/charge`, `/api/notifications/:id/cancel`)**
6. **پنل استاد، درخواست دوره و پاسخ به نظرات (`/api/panel/teacher`, `/api/teacher/course-requests`, `/api/teacher/reviews/:id/reply`)**
7. **نیم‌چت (`/api/chats`, `/api/chats/:id`, `/api/chats/:id/messages`)**
8. **پایش سلامت (`/api/health`, `/api/ready`)**
