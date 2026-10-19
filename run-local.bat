@echo off
REM Nimkat - اجرای هم‌زمان بک‌اند و فرانت‌اند روی لوکال (ویندوز)
cd /d %~dp0

echo ==> نصب وابستگی‌های بک‌اند...
cd backend
call npm install --no-audit --no-fund
cd ..

echo ==> نصب وابستگی‌های فرانت‌اند...
cd frontend
call npm install --no-audit --no-fund
cd ..

echo ==> بک‌اند: http://localhost:8000  فرانت‌اند: http://localhost:5173
start "Nimkat API" cmd /k "cd backend && npm start"
start "Nimkat Web" cmd /k "cd frontend && npm run dev"
