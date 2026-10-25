@echo off
cd /d %~dp0

echo ==> Starting Nimkat Complete Backend (Port 8000)...
start "Nimkat Complete API" cmd /k "cd /d %~dp0backend && set NODE_ENV=development&& set COOKIE_SECURE=false&& set COOKIE_SAME_SITE=lax&& set COOKIE_PARTITIONED=false&& set APP_ORIGINS=http://localhost:5173&& npm install --no-audit --no-fund && npm start"

echo ==> Starting Nimkat Complete Frontend (Next.js Port 5173)...
start "Nimkat Complete Web" cmd /k "cd /d %~dp0frontend && npm install --no-audit --no-fund && npm run dev"
