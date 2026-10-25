# راهنمای انتشار نیمکت (Deploy)

هدف: با هر push به GitHub، نسخهٔ جدید ساخته و روی سرور منتشر شود، بدون آپلود دستی
فایل‌های حجیم. نکتهٔ کلیدی: **هرگز `node_modules` یا سورس React را آپلود نمی‌کنیم**؛
فقط خروجی `npm run build` (پوشهٔ `dist`) منتشر می‌شود.

## ۰) معماری

```
مرورگر کاربر
   │
   ▼
React + Vite (خروجی استاتیک dist)   ←─ روی Nginx / هاست استاتیک
   │  API
   ▼
Laravel (بعداً، پوشهٔ backend/)     ←─ سرویس جدا + MySQL
```

فرانت‌اند فعلی بدون بک‌اند کار می‌کند (دادهٔ نمونه). وقتی Laravel اضافه شد،
فرانت‌اند فقط با آدرس API (متغیر `VITE_API_URL`) صحبت می‌کند.

## ۱) تست لوکال

```bash
cd frontend
npm install
npm run dev        # توسعه
npm run build      # بیلد انتشار
npm run preview    # تست خروجی بیلد
```

## ۲) روش الف: سرور مجازی (VPS) + Nginx

روی سرور (یک بار):

```bash
sudo apt update && sudo apt install -y nginx nodejs npm git   # یا معادل توزیع خودتان
git clone https://github.com/shimmercode/nimkat.git /var/www/nimkat
```

بروزرسانی در هر انتشار:

```bash
cd /var/www/nimkat
git pull
cd frontend
npm ci
npm run build
sudo rsync -a --delete dist/ /var/www/nimkat-dist/
```

نمونهٔ تنظیم Nginx (SPA با روتر سمت مرورگر):

```nginx
server {
    listen 80;
    server_name nimkat.ir www.nimkat.ir;

    root /var/www/nimkat-dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;   # بعداً: Laravel
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # کش کردن asset های هش‌دار
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

برای HTTPS از `certbot --nginx` استفاده کنید.

## ۳) روش ب: هاست اشتراکی cPanel

1. لوکال: `npm run build`
2. محتوای `frontend/dist` را ZIP کنید (خودِ فایل‌ها، نه پوشهٔ dist).
3. در File Manager مسیر `public_html` آپلود و Extract کنید.
4. فایل `.htaccess` زیر را در `public_html` بگذارید تا رفرش صفحات داخلی 404 ندهد:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

اگر سایت در زیرپوشه است (مثلاً `public_html/nimkat`)، `RewriteBase` و مسیر
هدف را مطابق آن عوض کنید.

## ۴) روش ج: دیپلوی خودکار با GitHub Actions (پیشنهادی)

فایل نمونهٔ `docs/ci.yml.example` را در مسیر `.github/workflows/ci.yml` کپی کنید
تا با هر push فرانت‌اند بیلد شود و خروجی `dist` به‌صورت artifact نگه داشته شود.
برای انتشار خودکار روی VPS، یک
workflow جدا (مثل `deploy.yml`) بسازید که فقط پس از موفقیت CI اجرا شود:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      - name: Deploy over rsync/ssh
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: -avz --delete
          path: dist/
          remote_path: /var/www/nimkat-dist/
          remote_host: ${{ secrets.DEPLOY_HOST }}
          remote_user: ${{ secrets.DEPLOY_USER }}
          remote_key: ${{ secrets.DEPLOY_SSH_KEY }}
```

Secretsهای موردنیاز (Settings → Secrets and variables → Actions):

- `DEPLOY_HOST`: آی‌پی یا دامنهٔ سرور
- `DEPLOY_USER`: کاربر SSH (مثلاً `deploy`)
- `DEPLOY_SSH_KEY`: کلید خصوصی همان کاربر

نکته: این فایل نمونه است؛ وقتی سرور خریدید آن را با هم فعال می‌کنیم.

## ۵) امنیت و داده‌های محرمانه

- `.env` هرگز به مخزن نرود (در `.gitignore` هست). فقط `.env.example` مجاز است.
- متغیرهای فرانت‌اند با پیشوند `VITE_` داخل بیلد عمومی می‌شوند؛ رمز و کلید
  خصوصی (درگاه پرداخت، پیامک، دیتابیس) هرگز در آن‌ها قرار نگیرد.
- کلیدهای پرداخت و پیامک سمت بک‌اند (Laravel) و در `.env` سرور بماند.
- قبل از هر migration مخرب یا انتشار بزرگ، از دیتابیس بک‌آپ بگیرید.
- دسترسی SSH دیپلوی فقط با کلید، بدون رمز عبور، و محدود به یک کاربر غیر-root.

## ۶) چک‌لیست انتشار

- [ ] `npm run build` لوکال بدون خطا
- [ ] CI سبز روی GitHub Actions
- [ ] بک‌آپ دیتابیس (پس از افزوده‌شدن بک‌اند)
- [ ] اجرای دیپلوی و بررسی صفحهٔ اصلی + یک مسیر داخلی (رفرش بدون 404)
- [ ] بررسی کنسول مرورگر و لود فونت وزیرمتن
