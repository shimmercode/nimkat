$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==> Starting Nimkat Complete Backend (14 Modules, Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$Root\backend'
`$env:NODE_ENV='development'
`$env:COOKIE_SECURE='false'
`$env:COOKIE_SAME_SITE='lax'
`$env:COOKIE_PARTITIONED='false'
`$env:APP_ORIGINS='http://localhost:5173'
npm install --no-audit --no-fund
npm start
"@

Write-Host "==> Starting Nimkat Complete Frontend (Next.js App Router + Visual Editor + Admin, Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$Root\frontend'
npm install --no-audit --no-fund
npm run dev
"@
