# پلتفرم آموزشی نیمکت — بستهٔ تحویل نهایی مستقل (`nimkat-final-release`)

**وضعیت انتشار:** `PREPARED — RUNTIME VERIFICATION BLOCKED` (`productionReady: false`)

این پوشه نسخهٔ نهایی، مستقل و خودکفای پروژهٔ **نیمکت (Nimkat)** شامل بک‌اند (`Express + better-sqlite3 WAL`)، فرانت‌اند (`React 18 + Vite 5 + RTL`)، پیکربندی‌های استقرار (`Dockerfile.backend`، `Dockerfile.frontend`، `docker-compose.yml`، `nginx.conf`، `.github/workflows/ci.yml`) و مستندات کامل تحویل است.

## اجرای سریع در محیط محلی (Development / Staging)

### ۱. اجرای بک‌اند (پورت `8000`)
```bash
cd backend
npm ci
NIMKAT_DB_PATH=./data/nimkat.db PORT=8000 node src/server.js
```

### ۲. اجرای فرانت‌اند (پورت `5173`)
```bash
cd frontend
npm ci
npm run dev
```

### ۳. بیلد نسخهٔ پروداکشن فرانت‌اند
```bash
cd frontend
npm run build
```

### ۴. اجرای تست‌ها روی دیتابیس ایزوله
```bash
node --test backend/tests/api.test.js
node --test frontend/tests/frontend.test.js
```

## حساب‌های نمونه (پشتیبانی از OTP آزمایشی)
- **دانش‌آموز:** `09121234567` (سارا احمدی)
- **استاد:** `09129876543` (سارا محمدی)
- **والدین:** `09123334455` (پدر علی)
