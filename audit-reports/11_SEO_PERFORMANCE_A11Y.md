# Phase 11 — SEO, Performance & Accessibility Audit (`11_SEO_PERFORMANCE_A11Y.md`)

**Audit Date:** 2026-10-27  
**Target Environment:** Isolated Production Runtime (`next start` + `backend/src/server.js`)  
**Evidence Logs:** `/tmp/nimkat-1.7.0-audit-work/logs/phase-10-11-metrics.json`, `/tmp/nimkat-1.7.0-audit-work/logs/prod-robots.txt`, `/tmp/nimkat-1.7.0-audit-work/logs/prod-sitemap.xml`, `/tmp/nimkat-1.7.0-audit-work/logs/prod-rss.xml`  

---

## 11.1 SEO & Metadata Verification

### 1. Metadata, Canonical URLs, OpenGraph & JSON-LD (`FIXED — VERIFIED`)
- **Pre-Fix Defect (`NIM-005`):**
  - `frontend/src/server/seo.ts:3` returned `null` in `NODE_ENV=production` whenever `SITE_URL` / `PUBLIC_SITE_URL` was unset, causing `/rss.xml` to fail with `HTTP 503`, `/sitemap.xml` to emit an empty `<urlset>`, and `/robots.txt` to emit `Disallow: /`.
  - Additionally, `frontend/src/app/(public)/loading.tsx` wrapped `(public)` routes in a streaming `<Suspense>` boundary, causing `GET /blog/no-such-article` to stream `HTTP 200` before `notFound()` executed and hiding SSR content inside `<div hidden id="S:0">` when JavaScript was disabled.
- **Post-Fix Verification:**
  - `seo.ts` defaults to `'https://nimkat.ir'` when `SITE_URL` and `PUBLIC_SITE_URL` are unset, and `(public)/loading.tsx` was removed so SSR is synchronous and non-streaming.
  - Verified in production runtime (`run-phase10.sh` & `blog-guest.spec.ts`):
    - `GET /robots.txt` -> `HTTP 200` (`Allow: /`, `Disallow: /admin`, `Disallow: /editor`, `Disallow: /panel`, `Disallow: /parent`, `Disallow: /teacher`, `Disallow: /login`, `Sitemap: https://nimkat.ir/sitemap.xml`)
    - `GET /sitemap.xml` -> `HTTP 200` (contains `/`, `/classes`, `/club`, `/blog`, `/teachers/1`..`/teachers/7`, `/classes/1`..`/classes/9`, `/blog/weekly-study-plan`, etc.)
    - `GET /rss.xml` -> `HTTP 200` (`Content-Type: application/rss+xml; charset=utf-8`, valid `<rss version="2.0">` feed without draft articles)
    - JSON-LD (`application/ld+json`): `Organization` on root layout, `Course` on `/classes/[id]`, `Person` on `/teachers/[id]`, `BlogPosting` + `BreadcrumbList` on `/blog/[slug]`.

### 2. HTTP Status Codes for Valid vs Non-Existent Entities (`PASS`)
| Endpoint | Expected Status | Actual Status | Result |
|---|---|---|---|
| `GET /` | `200` | `200` | `PASS` |
| `GET /classes/1` | `200` | `200` | `PASS` |
| `GET /teachers/1` | `200` | `200` | `PASS` |
| `GET /blog/weekly-study-plan` | `200` | `200` | `PASS` |
| `GET /does-not-exist-404` | `404` | `404` | `PASS` |
| `GET /blog/no-such-article` | `404` | `404` | `PASS` |
| `GET /classes/999999` | `404` | `404` | `PASS` |
| `GET /teachers/999999` | `404` | `404` | `PASS` |

---

## 11.2 Performance Audit (`PASS`)

| Metric | Measured Value | Target / Threshold | Status |
|---|---|---|---|
| Next.js Production Build (`npm run build`) | `25.5s` (`58/58` routes) | `< 60s` | `PASS` |
| Local API Health / Catalog Response (`/api/health`, `/api/classes`) | `2ms – 8ms` | `< 100ms` | `PASS` |
| Local SSR Page Load + Hydration (`domcontentloaded` + settle across 26 routes) | `480ms – 550ms` (incl. 450ms settle wait; raw DOMContentLoaded `30ms – 95ms`) | `< 1000ms` | `PASS` |
| Font Loading (`YekanBakh FaNum`) | Self-hosted WOFF (`font-display: swap`), 0 external font requests | 0 external requests | `PASS` |
| Blog & Hero Images | Next.js `<Image>` with explicit `width`/`height` and `sizes` | Zero CLS | `PASS` |

---

## 11.3 Accessibility (a11y) Audit (`FIXED — VERIFIED`)

1. **Document Landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`):**
   - **Pre-Fix Defect (`NIM-004`):** `SiteLayout.jsx` wrapped `<PageTransition>` in an outer `<main>` while `PageTransition.jsx` rendered `<motion.main>`, creating nested `<main><main>` on public pages; meanwhile `PanelLayout.jsx` used `<div>` instead of `<main>` around panel content.
   - **Post-Fix Verification:** Every public and panel route now renders **exactly 1 `<main>` landmark** (`mainCount: 1` across all 26 routes in `phase-10-11-metrics.json`) and **exactly 1 `<h1>` heading** (`h1Count: 1`).
2. **Keyboard Focus, Escape & Focus Trapping:**
   - Verified in `community-ui.spec.ts` (`desktop main menu supports keyboard focus`, `mobile sheet traps focus, closes on Escape`) and `support-responsive.spec.ts` (support widget dialog focus and Escape close).
3. **Accessible Labels & ARIA Roles:**
   - `LiveSearch.jsx` implements `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, and `role="listbox"`.
   - `Chat.jsx` conversation buttons include `aria-label={r.unread ? `${r.title} (${r.unread})` : r.title}`.
   - All images across all 26 inspected routes have `alt` attributes (`imgsMissingAlt: 0`).
   - Reduced motion (`prefers-reduced-motion: reduce`) disables transitions and animations (`PageTransition.jsx`, `community.css`, `interactions.css`).
