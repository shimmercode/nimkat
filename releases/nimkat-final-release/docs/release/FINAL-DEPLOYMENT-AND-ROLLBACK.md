# راهنمای استقرار، اجرای محلی، پشتیبان‌گیری و بازگشت (`FINAL-DEPLOYMENT-AND-ROLLBACK.md`)

## ۱. پیش‌نیازها
- **Node.js:** نسخهٔ `20.x` یا `22.x` (تست‌شده روی `v22.22.3`)
- **ابزار ساخت بومی (در صورت نیاز به کامپایل `better-sqlite3`):** Python 3 و C++ Build Tools

---

## ۲. اجرای محلی سریع (ویندوز، لینوکس و مک)

### ۲.۱ ویندوز (PowerShell — پیشنهادی)
از ریشهٔ مخزن اجرا کنید:
```powershell
.\run-local.ps1
```
یا به‌صورت دستی در دو پنجرهٔ مجزا:

**پنجره ۱ — بک‌اند (پورت `8000`):**
```powershell
cd backend
$env:NODE_ENV="development"
$env:COOKIE_SECURE="false"
$env:COOKIE_SAME_SITE="lax"
$env:COOKIE_PARTITIONED="false"
$env:APP_ORIGINS="http://localhost:5173"
npm install --no-audit --no-fund
npm start
```

**پنجره ۲ — فرانت‌اند Next.js (پورت `5173`):**
```powershell
cd frontend
npm install --no-audit --no-fund
npm run dev
```
سپس در مرورگر فقط آدرس زیر را باز کنید:
- **`http://localhost:5173`**

---

## ۳. متغیرهای محیطی تولید (`Production Environment Variables`)

### ۳.۱ بک‌اند (`backend/.env`)
- `NODE_ENV=production`
- `PORT=8000`
- `NIMKAT_SECRET`: رشتهٔ تصادفی حداقل ۳۲ کاراکتری برای امضای نشست‌ها و رمزنگاری
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`
- `APP_ORIGINS=https://your-domain.ir`
- `NIMKAT_DATA_DIR=/var/lib/nimkat/data`
- `NIMKAT_CLAMD_HOST=127.0.0.1` و `NIMKAT_CLAMD_PORT=3310`

### ۳.۲ فرانت‌اند (`frontend/.env`)
- `NODE_ENV=production`
- `API_INTERNAL_URL=http://127.0.0.1:8000`
- `SITE_URL=https://your-domain.ir`
- `NEXT_TELEMETRY_DISABLED=1`

---

## ۴. پشتیبان‌گیری امن و بازگشت (`Backup & Rollback`)

### ۴.۱ پشتیبان‌گیری آنلاین از SQLite (در حالت WAL)
هرگز فایل `nimkat.db` را بدون فایل‌های `-wal` یا بدون API پشتیبان‌گیری آنلاین کپی نکنید. برای تهیهٔ نسخهٔ پشتیبان اتمیک در حین کار سرور:
```bash
node -e "
const Database = require('./backend/node_modules/better-sqlite3');
const db = new Database('./backend/data/nimkat.db', { readonly: true });
db.backup('./nimkat-backup-' + Date.now() + '.db').then(() => {
  console.log('Backup completed successfully');
  db.close();
});
"
```
همچنین ماژول پشتیبان‌گیری رمزنگاری‌شدهٔ داخلی در `backend/src/modules/ops/backup.js` از بررسی یکپارچگی (`PRAGMA integrity_check`) و بازیابی به مسیر مستقل پشتیبانی می‌کند.

### ۴.۲ روش بازگشت (`Rollback`) به نسخهٔ قبلی
1. سرویس‌های فرانت‌اند و بک‌اند را متوقف کنید.
2. از فایل‌های فعلی `backend/data/nimkat.db` و `backend/data/settings.key` یک کپی امن تهیه کنید.
3. کد را به تگ پایدار مورد نظر بازگردانید:
   ```bash
   git checkout v1.3.0
   ```
4. تمام مهاجرت‌های پایگاه داده در نسخهٔ `v1.3.0` به‌صورت **افزودنی و غیرمخرب (`Additive / Non-destructive`)** طراحی شده‌اند (`CREATE TABLE IF NOT EXISTS` و `ALTER TABLE ... ADD COLUMN` ایمن) و هیچ ستون یا جدولی را حذف نمی‌کنند.
5. پس از بررسی `cd backend && npm test` و `cd frontend && npm run build`، سرویس‌ها را مجدداً راه‌اندازی کنید.
