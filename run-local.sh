#!/usr/bin/env bash
# Nimkat - اجرای هم‌زمان بک‌اند و فرانت‌اند روی لوکال
set -e
cd "$(dirname "$0")"

echo "==> نصب وابستگی‌های بک‌اند..."
(cd backend && npm install --no-audit --no-fund)
echo "==> نصب وابستگی‌های فرانت‌اند..."
(cd frontend && npm install --no-audit --no-fund)

echo "==> شروع بک‌اند روی http://localhost:8000 و فرانت‌اند روی http://localhost:5173"
(cd backend && npm start) &
BACK=$!
(cd frontend && npm run dev) &
FRONT=$!
trap "kill $BACK $FRONT 2>/dev/null" EXIT
wait
