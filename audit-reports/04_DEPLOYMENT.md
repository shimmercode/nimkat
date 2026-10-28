# فاز ۴ — ممیزی استقرار، Docker، محیط اجرا و پایداری سرور (`04_DEPLOYMENT.md`)

- **پروژه:** نیمکت (`Nimkat 1.7.0`)
- **تاریخ ممیزی:** `2026-10-27` (`Asia/Tehran`)

---

## ۴.۱. ممیزی فایل‌های Docker، Compose و Nginx

### ۱. وضعیت اولیه در بستهٔ `nimkat-complete-final-v1.7.0.zip` (`FAIL` در مبنا -> `FIXED — VERIFIED`)
- **غیبت فایل‌ها در ریشهٔ بستهٔ ۱.۷.۰:** فایل‌های `Dockerfile.frontend`, `Dockerfile.backend`, `docker-compose.yml`, `nginx.conf` و `.dockerignore` در ریشهٔ بستهٔ ۱.۷.۰ قرار نداشتند و تنها یک نسخهٔ قدیمی در `/home/user/nimkat/releases/nimkat-final-release/` موجود بود.
- **نقص بحرانی در `Dockerfile.frontend` و `nginx.conf` قدیمی (`NIM-002`):**
  - در نسخهٔ قدیمی:
    ```dockerfile
    FROM nginx:1.27-alpine AS runtime
    COPY --from=build /app/frontend/dist /usr/share/nginx/html
    ```
  - فرانت‌اند نیمکت از Vite به **Next.js `16.4.2` (App Router با صفحات Dynamic SSR مانند `/`, `/classes`, `/teachers/[id]`, `/classes/[id]`, `/blog`, `/rss.xml`, `/sitemap.xml`)** مهاجرت کرده است و خروجی آن در `.next/` قرار می‌گیرد و نیازمند سرور Node.js (`next start`) است، نه فایل استاتیک در `/app/frontend/dist`.
- **نقص بحرانی در `docker-compose.yml` و `Dockerfile.backend` قدیمی (`NIM-001` و `NIM-003`):**
  - متغیر الزامی `NIMKAT_SETTINGS_KEY` (رشتهٔ ۶۴ کاراکتری هگزادسیمال برای AES-256-GCM در `backend/src/modules/settings/store.js:17-20`) در `docker-compose.yml` تعریف نشده بود که باعث کرش فوری کانتینر `backend` در `NODE_ENV=production` می‌شد.
  - متغیرهای `NIMKAT_DB_PATH` و `ALLOWED_ORIGINS` استفاده شده بودند، در حالی که کد واقعی `NIMKAT_DATA_DIR` و `APP_ORIGINS` را می‌خواند.
  - در `Dockerfile.backend` ابزارهای ساخت بومی (`python3 make g++`) برای کامپایل `better-sqlite3` در صورت عدم دسترسی به باینری از پیش کامپایل‌شده پیش‌بینی نشده بود.

### ۲. معماری اصلاح‌شده در نسخهٔ ممیزی‌شده (`work/`)
- **`Dockerfile.backend`:** بر پایهٔ `node:22-bookworm-slim`، نصب وابستگی‌های کامپایل بومی و اجرای `npm ci --omit=dev`، ایجاد کاربر غیرریشه (`USER node`)، تنظیم `NIMKAT_DATA_DIR=/data` و `PORT=8000`، به همراه `HEALTHCHECK` واقعی روی `http://127.0.0.1:8000/api/health`.
- **`Dockerfile.frontend`:** دو مرحله‌ای (Multi-stage) بر پایهٔ `node:22-bookworm-slim`؛ مرحلهٔ `build` اجرای `npm ci` و `npm run build` (`next build --webpack`)؛ مرحلهٔ `runtime` با کاربر غیرریشه، تنظیم `NODE_ENV=production`, `PORT=5173`, `API_INTERNAL_URL=http://backend:8000` و `HEALTHCHECK` روی `http://127.0.0.1:5173/`.
- **`nginx.conf`:** تنظیم Reverse Proxy استاندارد که مسیر `/api/` را به `http://backend:8000` (با هدرهای `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` و پشتیبانی از SSE در `/api/events`) و سایر مسیرها (`/`, `/_next/static/`, ...) را به سرور Next.js (`http://frontend:5173`) هدایت می‌کند.
- **`docker-compose.yml`:** تعریف سرویس‌های `backend` (با Volume پایدار `nimkat_data:/data` و متغیرهای الزامی `NIMKAT_SECRET:?` و `NIMKAT_SETTINGS_KEY:?`)، `frontend` (وابسته به سلامت `backend`) و `nginx` (پورت `8080:80`).

---

## ۴.۲. ماتریس کامل متغیرهای محیطی (Environment Variables Matrix)

تمامی متغیرهای محیطی استفاده شده در سورس کد (`backend/src/**` و `frontend/src/**`) استخراج و با `.env.example` تطبیق داده شدند:

| نام متغیر در کد | محل خوانده شدن در سورس | الزامی در Dev | الزامی در Test | الزامی در Prod | مقدار پیش‌فرض در کد | رفتار در صورت نبود در Prod | وضعیت در `.env.example` (پس از اصلاح) |
|---|---|---|---|---|---|---|---|
| `NODE_ENV` | کل پروژه | خیر (`development`) | بله (`test`) | **بله (`production`)** | `development` | عدم اعمال قفل‌های امنیتی Production | مستند و هماهنگ (`PASS`) |
| `PORT` | `backend/src/server.js:8` | خیر | خیر | خیر | `8000` | اجرا روی پورت `8000` | اصلاح از `3001` به `8000` (`FIXED — VERIFIED`) |
| `NIMKAT_DATA_DIR` | `backend/src/db.js:6`, `materials.js`, `media.js` | خیر | بله (مسیر ایزوله) | **بله** | `backend/data` | ذخیره در مسیر داخل کانتینر به جای Volume پایدار | جایگزین `NIMKAT_DB_PATH` شد (`FIXED — VERIFIED`) |
| `NIMKAT_SECRET` | `backend/src/modules/auth/security.js:21` | خیر (کلید موقت تصادفی) | خیر | **بله (حداقل ۳۲ کاراکتر)** | کلید تصادفی در حافظه (فقط غیرتولیدی) | **Fail-Closed:** پرتاب خطا `NIMKAT_SECRET must contain at least 32 characters.` | جایگزین `NIMKAT_AUTH_SECRET` شد (`FIXED — VERIFIED`) |
| `NIMKAT_SETTINGS_KEY` | `backend/src/modules/settings/store.js:15-20` | خیر (مگر تنظیم شود که باید ۶۴ کاراکتر هگز باشد) | خیر | **بله (دقیقاً ۶۴ کاراکتر هگز)** | کلید مشتق‌شدهٔ توسعه (فقط غیرتولیدی) | **Fail-Closed:** پرتاب خطا `NIMKAT_SETTINGS_KEY is required in production.` | اصلاح به ۶۴ کاراکتر هگز معتبر (`FIXED — VERIFIED`) |
| `APP_ORIGINS` | `backend/src/modules/auth/security.js:33`, `providers.js:14` | خیر | خیر | **بله** | `""` (بررسی هم‌نامی با `Host`) | پذیرش فقط درخواست‌های هم‌نام با `Host` | جایگزین `ALLOWED_ORIGINS` شد (`FIXED — VERIFIED`) |
| `PUBLIC_SITE_URL` | `backend/src/modules/settings/providers.js:9,13`, `frontend/src/server/seo.ts:3` | خیر (`http://localhost:5173`) | خیر | **بله (`https://...`)** | `http://localhost:5173` (در غیرتولیدی) | **Fail-Closed در پرداخت:** خطای `503 دامنهٔ بازگشت پرداخت توسط مدیر سرور تنظیم نشده است.` | مستند و هماهنگ (`FIXED — VERIFIED`) |
| `SITE_URL` | `frontend/src/server/seo.ts:3` | خیر | خیر | توصیه‌شده (`https://...`) | `https://nimkat.ir` | استفاده از Origin پیش‌فرض `https://nimkat.ir` | مستند و هماهنگ (`FIXED — VERIFIED`) |
| `API_INTERNAL_URL` | `frontend/next.config.ts:3`, `frontend/src/server/*.ts` | خیر | خیر | بله (در Docker: `http://backend:8000`) | `http://127.0.0.1:8000` | تلاش برای اتصال به `127.0.0.1:8000` | مستند و هماهنگ (`FIXED — VERIFIED`) |
| `COOKIE_SECURE` | `backend/src/modules/auth/security.js:24-25` | خیر | خیر | خیر (پیش‌فرض `true` در Prod) | `true` در Prod، `false` در Dev | در Prod اگر `false` شود **Fail-Closed:** `Production auth requires Secure cookies.` | مستند و هماهنگ (`PASS`) |
| `COOKIE_SAME_SITE` | `backend/src/modules/auth/security.js:23` | خیر | خیر | خیر | `'lax'` | `'lax'` (اگر `'none'` بدون `Secure` باشد پرتاب خطا) | مستند و هماهنگ (`PASS`) |
| `COOKIE_PARTITIONED` | `backend/src/modules/auth/security.js:26` | خیر | خیر | خیر | `false` | `false` (اگر `true` بدون `Secure` باشد پرتاب خطا) | مستند و هماهنگ (`PASS`) |
| `TRUST_PROXY` | `backend/src/server.js:7` | خیر | خیر | توصیه‌شده پشت Nginx (`1`) | غیرفعال | خواندن IP مستقیم سوکت | مستند و هماهنگ (`PASS`) |
| `NIMKAT_CLAMD_HOST` / `NIMKAT_CLAMD_PORT` | `backend/src/modules/education/materials.js:9` | خیر | خیر | در صورت فعال بودن آپلود جزوه | `127.0.0.1` / `3310` | **Fail-Closed در آپلود جزوه:** خطای `503 اسکن امنیتی فایل در دسترس نیست` | مستند و هماهنگ (`PASS`) |

---

## ۴.۳. نتایج تست راه‌اندازی Production و بررسی Fail-Closed

تمامی آزمون‌های زیر به صورت واقعی در اسکریپت ایزوله (`/tmp/nimkat-1.7.0-audit-work/phase-4-to-9-probes.js`) اجرا و در `/tmp/nimkat-1.7.0-audit-work/logs/phase-4-to-9-probes.json` ثبت شدند:

| آزمون | ورودی / شرایط محیطی | خروجی واقعی ثبت‌شده | وضعیت |
|---|---|---|---|
| نبود `NIMKAT_SECRET` در Production | `NODE_ENV=production` بدون `NIMKAT_SECRET` | پرتاب خطا و توقف بالا آمدن سرور: `"NIMKAT_SECRET must contain at least 32 characters."` | **`PASS`** |
| نبود `NIMKAT_SETTINGS_KEY` در Production | `NODE_ENV=production` بدون `NIMKAT_SETTINGS_KEY` | پرتاب خطا و توقف بالا آمدن سرور: `"NIMKAT_SETTINGS_KEY is required in production."` | **`PASS`** |
| غیرفعال کردن `COOKIE_SECURE` در Production | `NODE_ENV=production`, `COOKIE_SECURE=false` | پرتاب خطا و توقف بالا آمدن سرور: `"Production auth requires Secure cookies."` | **`PASS`** |
| بالا آمدن کامل سرور در Production با کلیدهای معتبر | `NODE_ENV=production`, `NIMKAT_SECRET` (۴۸ کاراکتر)، `NIMKAT_SETTINGS_KEY` (۶۴ هگز) | `GET /api/health` -> `HTTP 200 {"ok":true,"service":"nimkat-api","version":"1.0.0"}` | **`PASS`** |
| رفتار Fail-Closed پیامک در Production بدون تنظیم کاوه‌نگار | `POST /api/auth/otp/request` در `NODE_ENV=production` بدون کلید کاوه‌نگار | `HTTP 503 {"error":"ارسال پیامک موفق نبود؛ بعداً تلاش کنید."}` و عدم افشای `devCode` در پاسخ | **`PASS`** |
| بررسی دسترس‌پذیری باینری Docker در محیط فعلی | بررسی وجود دستور `docker` در کانتینر ممیزی | دیمن Docker در این کانتینر لینوکسی نصب نیست؛ صحت ساخت و اجرای Production مستقیماً با `next build --webpack` + `next start` و `NODE_ENV=production node src/server.js` تأیید شد. | **`BLOCKED`** (محدودیت زیرساخت کانتینر برای `docker build`؛ اجرای مستقیم Production: **`PASS`**) |
