# گزارش نتایج تست و بیلد (`TEST_RESULTS.md`)

| دسته آزمایش | دستور اجرا | نتیجه | وضعیت |
|---|---|---|---|
| تست‌های API بک‌اند | `node --test backend/tests/api.test.js` | `PASS` | تاییدشده روی دیتابیس ایزوله `/tmp` |
| تست‌های ساختار فرانت‌اند | `node --test frontend/tests/frontend.test.js` | `PASS` | تاییدشده |
| بیلد پروداکشن فرانت‌اند | `cd frontend && npm run build` | `PASS` (`75 modules`) | تولید تمیز باندل در `dist/` |
| سلامت سرور ایزوله | `GET /api/health` و `GET /api/ready` | `200 OK` | تاییدشده |
| اجرای دیمن Docker / Nginx | `docker compose up` / `nginx -t` | `BLOCKED` | عدم نصب دیمن در سندباکس |
