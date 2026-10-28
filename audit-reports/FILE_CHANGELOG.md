# Phase 15 — Complete File Changelog (`FILE_CHANGELOG.md`)

Comparison between original `/home/user/nimkat/nimkat-complete-final-v1.7.0.zip` (`2606a6042b7a1c50049b524de16017b7b5a975429be4ff8be0d9033ac8e4d11b`) and `/home/user/nimkat/nimkat-1.7.0-audited.zip` (`7a9706934298ad4baca59a448ea3e21c806be74fc2b5be9c6bbf2e140b2d97c5`):

---

## 1. Added Files (`5` Files)

| File Path in Archive | Issue ID | Reason for Addition |
|---|---|---|
| `nimkat/Dockerfile.backend` | `NIM-002`, `NIM-003` | Production Node 20 container definition for Express + SQLite backend on port `8000` with `/api/health` healthcheck and `/data` volume. |
| `nimkat/Dockerfile.frontend` | `NIM-002` | Multi-stage Next.js 16 App Router SSR production container (`npm run build` -> `npm start` on `0.0.0.0:3000`). |
| `nimkat/docker-compose.yml` | `NIM-001`, `NIM-002`, `NIM-003` | Full orchestration for `backend`, `frontend` (Next.js SSR), and `nginx` with fail-closed `NIMKAT_SECRET` and `NIMKAT_SETTINGS_KEY` validation. |
| `nimkat/nginx.conf` | `NIM-002` | Reverse proxy routing `/api/events` (SSE unbuffered), `/api/*` (`backend:8000`), and `/*` (`frontend:3000` SSR) with security headers. |
| `nimkat/.dockerignore` | `NIM-002` | Excludes `node_modules`, `.next`, `.git`, `.env*`, and `*.db*` from Docker build contexts. |

---

## 2. Modified Files (`21` Files)

| File Path in Archive | Issue ID | Summary of Modification |
|---|---|---|
| `nimkat/.env.example` | `NIM-001`, `NIM-003` | Replaced outdated variable names (`NIMKAT_AUTH_SECRET`, `NIMKAT_DB_PATH`, `ALLOWED_ORIGINS`, `PORT=3001`) and invalid non-hex `NIMKAT_SETTINGS_KEY` placeholder with exact runtime variables (`NIMKAT_SECRET`, 64-hex `NIMKAT_SETTINGS_KEY`, `PORT=8000`, `NIMKAT_DATA_DIR`, `APP_ORIGINS`, `SITE_URL`, `API_INTERNAL_URL`). |
| `nimkat/README.md` | `NIM-010` | Updated documentation to reflect Nimkat 1.7.0 architecture (Next.js 16 SSR, `/parent` portal, double-entry ledger, Zarinpal/SMS adapters, and required production env vars). |
| `nimkat/SHA256SUMS.txt` | `NIM-010` | Recomputed internal SHA-256 manifest across all tracked archive files (`sha256sum -c SHA256SUMS.txt` passes with `0` mismatches). |
| `nimkat/backend/src/server.js` | `NIM-008` | Enhanced `normalizeFaSearch()` with bidirectional numeric (`1..12`) <-> Persian grade word (`اول..دوازدهم`) token expansion so `فیزیک ۱۱` and `فیزیک یازدهم` return identical results. |
| `nimkat/backend/src/modules/payments/index.js` | `NIM-009` | Updated `quote(body, userId)` and `POST /api/bookings/quote` (`optionalUserId(req)`) to verify that `MEHR05` is only accepted when the authenticated user has `0` prior confirmed/held/paid bookings (`409` on repeat use). |
| `nimkat/backend/src/modules/auth/security.js` | `NIM-007` | Preserved `Secure; SameSite=None; Partitioned` for embedded previews while allowing plain `http://localhost` Playwright `APIRequestContext` (`User-Agent: Playwright/...`) in non-production test runs to store session cookies. |
| `nimkat/backend/src/modules/auth/index.js` | `NIM-007` | Allowed `NIMKAT_OTP_PHONE_LIMIT` and `NIMKAT_OTP_IP_LIMIT` environment overrides while keeping production defaults (`5` per phone / `10` per IP per 10 minutes). |
| `nimkat/backend/tests/booking-wallet-search-ux.test.js` | `NIM-008`, `NIM-009` | Added backend regression assertions for numeric grade search (`فیزیک ۱۱` == `فیزیک یازدهم`) and `MEHR05` repeat-buyer rejection (`409`). |
| `nimkat/frontend/src/server/seo.ts` | `NIM-005` | Added default fallback `'https://nimkat.ir'` when `SITE_URL` and `PUBLIC_SITE_URL` are unset so `/rss.xml` (`200`), `/sitemap.xml` (`200`), and `/robots.txt` (`Allow: /`) work out of the box in production builds. |
| `nimkat/frontend/src/layouts/SiteLayout.jsx` | `NIM-004` | Changed outer `<main id="main-content">` wrapper around `<PageTransition>` (`<motion.main>`) to `<div>` so public pages have exactly one `<main>` landmark. |
| `nimkat/frontend/src/layouts/PanelLayout.jsx` | `NIM-004` | Changed panel content container from `<div>` to `<main style={{ minWidth: 0 }}>` so all authenticated panel routes expose a `<main>` landmark and prevent grid child horizontal overflow. |
| `nimkat/frontend/src/views/panel/Materials.jsx` | `NIM-006` | Fixed Persian copy strings (`به هیچ جلسهٔ مجازی دسترسی ندارید.` and `هنوز فایلی برای این جلسه آپلود نشده است.`). |
| `nimkat/frontend/src/views/ClassesSearch.jsx` | `NIM-010` | Added URL `searchParams` sync hook so initial/updated `?q=`, `?mode=`, `?type=`, and `?level=` parameters populate filter state on SSR hydration. |
| `nimkat/frontend/src/components/SchedulePicker.jsx` | `NIM-010` | Tracked initial auto-selection per `classId` via `autoInitClassRef` so unchecking all sessions leaves `0` sessions selected instead of re-selecting the first session. |
| `nimkat/frontend/src/views/panel/Chat.jsx` | `NIM-010` | Added `aria-label` on `.conv` conversation buttons so Playwright `getByRole('button', { name: ... })` matches the room title consistently even when an unread badge is present. |
| `nimkat/frontend/src/views/panel/Club.jsx` | `NIM-010` | Exposed coin balance inside the `کوین قابل خرج` KPI card on `/teacher/club` to match `/panel/club`. |
| `nimkat/frontend/src/views/panel/TeacherHome.jsx` | `NIM-010` | Added `flexWrap: 'wrap'` on the `TODAY` header row and `className="grid"` on course-request form grids to eliminate the `7px` horizontal overflow on `375×812` mobile. |
| `nimkat/frontend/src/app/(public)/faq/page.tsx` | `NIM-010` | Added `flexWrap: 'wrap'` to the bottom CTA action row to prevent horizontal overflow on `375×812` mobile. |
| `nimkat/frontend/src/styles/responsive.css` | `NIM-010` | Scoped mobile `.booking-box` sticky footer to viewport widths `<= 640px`, hid `.header-actions .btn-ghost` at `<= 640px`, and added `flex-wrap: wrap` to `.segmented` and `.tip-band`. |
| `nimkat/frontend/playwright.config.ts` | `NIM-007` | Passed `NIMKAT_OTP_IP_LIMIT: process.env.NIMKAT_OTP_IP_LIMIT || '500'` to the Playwright `webServer` backend config. |
| `nimkat/frontend/tests/e2e/community-ui.spec.ts` | `NIM-010` | Updated hero search selector (`form.hero-search`) and current design-system token RGB values (`#0A6847`, `#F28A3D`, `#17211E`). |
| `nimkat/frontend/tests/e2e/zz-operations.spec.ts` | `NIM-010` | Scoped `getByRole('heading', { name: 'آزمون آنلاین جلسات' })` to avoid matching the sidebar nav link. |

---

## 3. Removed Files (`3` Build/Cache/Streaming Artifacts)

| File Path in Original 1.7.0 Archive | Issue ID | Reason for Removal |
|---|---|---|
| `nimkat/frontend/src/app/(public)/loading.tsx` | `NIM-004`, `NIM-005` | Removed React 19 streaming `<Suspense>` boundary on `(public)` routes that caused Next.js 16 to return `HTTP 200` instead of `404` on `/blog/no-such-article` and hid SSR HTML inside `<div hidden id="S:0">` when JS was disabled. |
| `nimkat/frontend/.cache/eslint/tsconfig.json` | `NIM-010` | Removed leftover build cache artifact from the source archive. |
| `nimkat/frontend/tsconfig.tsbuildinfo` | `NIM-010` | Removed incremental TypeScript build cache artifact from the source archive. |
