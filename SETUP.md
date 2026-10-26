# SETUP.md — راهنمای نصب، پیکربندی، اجرا، تست و Build پروژه نیمکت (Nimkat)

---

## ۱. پیش‌نیازها

- **Node.js:** نسخهٔ `20.x` یا `22.x` LTS (همراه با `npm`)
- **ابزار کامپایل بومی (در صورت نیاز به بازسازی `better-sqlite3`):** Python 3 و ابزارهای استاندارد C++ (`build-essential` در لینوکس یا Visual Studio Build Tools در ویندوز)

---

## ۲. نصب وابستگی‌ها

از ریشهٔ پروژه دستورات زیر را اجرا کنید:

```bash
# ۱. نصب وابستگی‌های بک‌اند
cd backend
npm install

# ۲. نصب وابستگی‌های فرانت‌اند
cd ../frontend
npm install
```

> **نکته برای محیط‌های لینوکس بدون دسترسی به هدرهای آنلاین Node:**
> در صورتی که `npm ci` در پوشهٔ `backend` به هدرهای محلی نیاز داشت، از دستور زیر استفاده کنید:
> ```bash
> cd backend
> npm ci --ignore-scripts
> npm_config_nodedir=/usr/local npm rebuild better-sqlite3
> ```

---

## ۳. تنظیمات محیط اجرا (`.env`)

فایل‌های نمونه در پروژه قرار دارند:
- `/.env.example` (در ریشهٔ پروژه)
- `/backend/.env.example`
- `/frontend/.env.example`

در محیط توسعه (`NODE_ENV=development`)، بک‌اند به صورت پیش‌فرض روی پورت `8000` و دیتابیس SQLite در مسیر `backend/data/nimkat.db` (با ایجاد خودکار جداول و داده‌های اولیهٔ کاتالوگ) اجرا می‌شود و فرانت‌اند درخواست‌های `/api/*` و `/media/*` را به `http://127.0.0.1:8000` پروکسی می‌کند.

برای محیط **Production**، متغیرهای زیر الزامی هستند:
- `NODE_ENV=production`
- `NIMKAT_SECRET` (رشتهٔ تصادفی حداقل ۳۲ کاراکتری)
- `NIMKAT_SETTINGS_KEY` (کلید ۶۴ کاراکتری هگزادسیمال برای رمزنگاری تنظیمات حساس)
- `COOKIE_SECURE=true`
- `APP_ORIGINS=https://your-domain.ir`
- `PUBLIC_SITE_URL=https://your-domain.ir`
- `API_INTERNAL_URL=http://127.0.0.1:8000`

---

## ۴. اجرای پروژه در محیط توسعه و تولید

### الف) اجرای سریع با اسکریپت‌های ریشه
- در لینوکس / macOS:
  ```bash
  ./run-local.sh
  ```
- در ویندوز (PowerShell):
  ```powershell
  .\run-local.ps1
  ```

### ب) اجرای دستی سرویس‌ها
1. **اجرای بک‌اند (پورت `8000`):**
   ```bash
   cd backend
   npm start
   ```
2. **بیلد و اجرای فرانت‌اند:**
   ```bash
   cd frontend
   # حالت توسعه:
   npm run dev
   # یا بیلد و اجرای نسخهٔ Production:
   npm run build
   npm run start:3000
   ```

---

## ۵. اجرای تست‌ها و بررسی صحت

1. **تست‌های واحد فرانت‌اند (Vitest):**
   ```bash
   cd frontend
   npm test
   ```
2. **بررسی TypeScript و بیلد تولیدی فرانت‌اند:**
   ```bash
   cd frontend
   npm run build
   ```
3. **تست‌های واحد و یکپارچهٔ بک‌اند (۱۱9 تست):**
   ```bash
   cd backend
   npm test
   ```
4. **ممیزی امنیتی پکیج‌ها:**
   ```bash
   cd backend && npm audit
   cd ../frontend && npm audit
   ```
