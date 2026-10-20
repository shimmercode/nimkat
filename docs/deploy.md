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

OTP فعلی توسعه و توکن مرورگر، SQLite مالی، درگاه/پیامک نمایشی و سایر موارد باز
مناسب تولید نیستند. قبل از انتشار عمومی باید امنیت نشست، rate limit، سرویس‌های
واقعی، دیتابیس هدف، تراکنش‌های مالی، بکاپ/restore و آزمون بار تکمیل شوند.
جزئیات در `technical/IMPLEMENTATION-PLAN.md` است.
