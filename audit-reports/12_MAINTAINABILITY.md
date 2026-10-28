# Phase 12 — Code Quality & Maintainability Audit (`12_MAINTAINABILITY.md`)

**Audit Date:** 2026-10-27  
**Scope:** Low-risk, high-value maintainability improvements in configuration, validation, error handling, documentation, and test reliability.  

---

## 12.1 Structural & Maintainability Assessment

1. **Backend Modularity (`backend/src/`):**
   - Core domains (`auth`, `payments`, `schedule`, `loyalty`, `chat`, `support`, `teaching`, `materials`, `commerce`, `family`, `analytics`, `reviews`, `blog`, `content`, `settings`) are cleanly separated under `backend/src/modules/*` with explicit SQLite schema migrations (`ensureColumn`) and transactional boundaries (`db.transaction(...)`).
   - `backend/src/server.js` acts as the Express composition root and exports `{ app, db }` when `NIMKAT_AUTO_LISTEN === 'false'`, enabling fast, isolated, multi-instance integration tests without port collisions.
2. **Frontend Architecture (`frontend/src/`):**
   - Next.js 16 App Router (`frontend/src/app/`) owns all routing and SSR metadata generation (`58` routes).
   - `frontend/src/routing/navigation.tsx` provides a thin compatibility layer (`Link`, `NavLink`, `useNavigate`, `useLocation`, `useParams`, `useSearchParams`) so legacy JSX views in `frontend/src/views/` work seamlessly inside Next.js App Router without `react-router-dom`.

---

## 12.2 High-Value Maintainability Improvements Implemented in Phase 13

| Area | Issue Identified | Maintainability Improvement Applied | Risk Level |
|---|---|---|---|
| **Environment & Secrets** | `.env.example` used outdated variable names (`NIMKAT_AUTH_SECRET`, `NIMKAT_DB_PATH`, `ALLOWED_ORIGINS`, `PORT=3001`) and a non-hex `NIMKAT_SETTINGS_KEY` that crashed `store.js` | Rewrote `.env.example` with exact runtime variables (`NIMKAT_SECRET`, 64-hex `NIMKAT_SETTINGS_KEY`, `PORT=8000`, `NIMKAT_DATA_DIR`, `APP_ORIGINS`, `SITE_URL`, `API_INTERNAL_URL`) and inline documentation. | Low |
| **Container & Reverse Proxy Packaging** | `Dockerfile.*`, `docker-compose.yml`, and `nginx.conf` were missing from the 1.7.0 archive root and targeted a legacy Vite static `/dist` build | Added production-ready `Dockerfile.backend`, `Dockerfile.frontend` (Next.js 16 SSR), `docker-compose.yml` (with fail-closed secret interpolation and healthchecks), `nginx.conf` (SSE + SSR + API reverse proxy), and `.dockerignore` to the archive root. | Low |
| **SSR vs Streaming Consistency** | `frontend/src/app/(public)/loading.tsx` caused Next.js 16 to stream HTTP `200` on `notFound()` routes (`/blog/no-such-article`) and hide SSR content when JS was disabled | Removed `(public)/loading.tsx` so public routes render deterministic synchronous SSR HTML with accurate `404` status codes and full no-JS visibility. | Low |
| **Search & Coupon Domain Validation** | Numeric grade search (`فیزیک ۱۱`) and repeat first-booking coupon (`MEHR05`) lacked server-side normalization/enforcement | Added `GRADE_NUMBER_TO_WORD` token normalization in `normalizeFaSearch` (`backend/src/server.js`) and prior-booking check for `MEHR05` in `quote()` (`backend/src/modules/payments/index.js`) with regression tests. | Low |
| **Documentation Accuracy** | `README.md` still contained pre-1.7.0 disclaimers claiming `/parent`, double-entry ledger, and payment/SMS adapters were unbuilt | Updated `README.md` to accurately document the 1.7.0 architecture, role routes, double-entry ledger, and required production environment variables. | Low |
