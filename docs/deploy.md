# استقرار نیمکت — Next.js + API

## معماری جاری

```text
HTTPS → Nginx → Next.js Node server :5173 → /api rewrite → Express :8000 → SQLite
```

این نسخه SPA استاتیک Vite نیست؛ آپلود `dist` یا try_files به index.html صحیح نیست.
به دو سرویس Node تحت systemd یا یک process manager نیاز است.

## نصب و ساخت

Node 22، ابزار ساخت native dependencyها و فضای writable برای `backend/data` لازم است.

```bash
cd backend
npm ci --omit=dev
# NIMKAT_SECRET را یک secret تصادفی قوی و خارج از مخزن قرار دهید.
npm start

# در ترمینال جدا
cd frontend
npm ci
npm run build
# متغیرهای server-side در محیط سرویس:
# API_INTERNAL_URL=http://127.0.0.1:8000
# SITE_URL=https://REAL_DOMAIN
npm start
```

نام دامنهٔ واقعی را در `SITE_URL` تنظیم کنید تا sitemap میزبان اشتباه معرفی نکند.
`API_INTERNAL_URL` نباید NEXT_PUBLIC شود و نباید به مرورگر کاربر ارسال شود.

## نمونهٔ Nginx

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

TLS و مدیریت سرویس‌ها متناسب با سرور تنظیم شود. API نباید به‌صورت عمومی و بدون
محدودیت شبکه عرضه شود. از `backend/data` با روش سازگار با SQLite/WAL بکاپ بگیرید؛
کپی فایل DB هنگام نوشتن به‌تنهایی بکاپ قابل اتکا نیست.

## محدودیت تولید

کوکی HttpOnly/refresh/revoke و CSRF اکنون پیاده شده‌اند (شرح: `technical/AUTH-SESSIONS.md`).
OTP آزمایشی، SQLite مالی، درگاه/پیامک نمایشی و سایر موارد باز
مناسب تولید نیستند. قبل از انتشار عمومی باید تنظیمات امن API و پراکسی، انتقال limiter/session به زیرساخت هدف، سرویس‌های
واقعی، دیتابیس هدف، تراکنش‌های مالی، بکاپ/restore و آزمون بار تکمیل شوند.
جزئیات در `technical/IMPLEMENTATION-PLAN.md` است.

## متغیرهای API

برای خود سرویس API، NODE_ENV=production و NIMKAT_SECRET تصادفی حداقل ۳۲کاراکتری
الزامی‌اند؛ backend/.env.example صرفاً نمونه است و خودکار خوانده نمی‌شود. تنظیم
COOKIE_SECURE=false در production پذیرفته نیست. APP_ORIGINS را exact و TRUST_PROXY
را فقط برای پراکسی کنترل‌شده تنظیم کنید. بدون SMS adapter، درخواست OTP تولیدی
با 503 رد می‌شود و هیچ کد آزمایشی برنمی‌گرداند. حالت development را برای دورزدن
این محافظت روی دامنهٔ واقعی فعال نکنید.

## دامنهٔ canonical، مجله و RSS

روی سرویس Next.js، `SITE_URL=https://your-real-domain.tld` (بدون مسیر) را با
دامنهٔ واقعی تنظیم کنید؛ `PUBLIC_SITE_URL` نیز پشتیبانی می‌شود. نام بالا فقط
الگوست، نه مقدار قابل استقرار. canonical، Open Graph، JSON-LD، sitemap و RSS
باید همگی به همین دامنه اشاره کنند. مسیرها: `/blog`، `/blog/[slug]`، `/rss.xml`،
`/sitemap.xml` و `/robots.txt`. فقط مقالات منتشرشده وارد feed/sitemap می‌شوند؛
ذخیرهٔ پیش‌نویس مطلب زنده را تغییر نمی‌دهد. RSS تولیدی حداکثر ۵ دقیقه cache دارد.

بدون دامنهٔ معتبر HTTPS، صفحات noindex و sitemap خالی‌اند؛ RSS پیش‌فرض 503 است.
فقط برای پیش‌نمایش خصوصی `NIMKAT_PREVIEW_MODE=true` اجازهٔ RSS با میزبان معتبر
Arena/E2B یا loopback را می‌دهد (private/no-store/noindex). این حالت را جای
تنظیم دامنهٔ تولید استفاده نکنید. دامنهٔ example.test در آزمون‌ها استفاده شد
و روی پیش‌نمایش نهایی تنظیم نیست. شرح قابلیت‌ها و محدودیت‌ها:
`technical/BLOG-GUEST-SUPPORT.md`.
