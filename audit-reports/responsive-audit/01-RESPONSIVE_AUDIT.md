# 01 — RESPONSIVE AUDIT REPORT (`RESPONSIVE_AUDIT.md`)

## 1. Environment & Access Disclosure (Phase 0)

- **Repository Workspace:** `/home/user/nimkat` (branch `arena/4f156d38-nimkat`, based on commit `9915487` / `v1.9.7`).
- **Local Full-Stack Server Tested:** `http://127.0.0.1:3000` (Next.js 16.4.2 production server) + `http://127.0.0.1:8000` (embedded Express + SQLite backend).
- **External / Host Path Disclosure:**
  - `https://nimkat-frontend.onrender.com/` is not directly reachable from inside this sandbox container because the sandbox outbound proxy allowlist permits only `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`, and `files.pythonhosted.org`.
  - `C:\xampp\htdocs\nimkat-1.8.0` is a Windows host path outside this Linux container (`/home/user/nimkat`).
  - Pre-modification backups of all target directories (`styles`, `components`, `layouts`, `views`) were saved to `/tmp/nimkat-responsive-backup/`.

---

## 2. Audited Routes Inventory (57 Routes Across Guest, Student, Teacher, Parent, and Admin)

| Category | Role | Routes Audited | HTTP / SSR Status |
|---|---|---|---|
| Public & Landing Pages | `guest` | `/`, `/classes`, `/classes/1`, `/teachers/1`, `/teachers/6`, `/blog`, `/blog/ask-better-questions`, `/blog/weekly-study-plan`, `/club`, `/faq`, `/contact`, `/privacy`, `/terms`, `/cancellation-policy`, `/parent-guide`, `/sitemap`, `/payment/result`, `/non-existent-route-404` | `18/18` PASS (`200 OK` / `404` for 404 route) |
| Authentication | `guest` | `/login` | `1/1` PASS (`200 OK`) |
| Student Dashboard & Panel | `student` (`09120000001`) | `/panel`, `/panel/calendar`, `/panel/chat`, `/panel/finance`, `/panel/profile`, `/panel/reports`, `/panel/club`, `/panel/files`, `/panel/exams`, `/panel/friendly`, `/panel/family`, `/panel/notifications`, `/panel/reviews`, `/panel/shop`, `/panel/earnings` | `15/15` PASS (`200 OK`) |
| Teacher Dashboard & Panel | `teacher` (`09120000002`) | `/teacher`, `/teacher/calendar`, `/teacher/chat`, `/teacher/files`, `/teacher/finance`, `/teacher/earnings`, `/teacher/club`, `/teacher/application` | `8/8` PASS (`200 OK`) |
| Parent Dashboard & Panel | `parent` (`09120000003`) | `/parent`, `/parent/files` | `2/2` PASS (`200 OK`) |
| Admin Panel & Visual Editor | `admin` (`09120000000`) | `/admin/teaching`, `/admin/finance`, `/admin/earnings`, `/admin/blog`, `/admin/chat`, `/admin/club`, `/admin/integrations`, `/admin/reviews`, `/admin/shop`, `/admin/support`, `/admin/analytics`, `/editor`, `/editor/home` | `13/13` PASS (`200 OK`) |

---

## 3. Target Viewport Matrix Audited (Phase 1)

| Device Group | Viewports Covered | Orientation |
|---|---|---|
| Mobile Small | `320×568`, `360×640` | Portrait |
| Mobile Common | `375×812`, `390×844`, `414×896` | Portrait |
| Mobile Large | `430×932` | Portrait |
| Mobile Landscape | `640×360`, `812×375` | Landscape (`max-height: 520px`) |
| Tablet Portrait | `600×960`, `768×1024` | Portrait |
| Tablet Landscape | `820×1180`, `1024×768` | Landscape |
| Laptop | `1280×800`, `1366×768`, `1440×900` | Landscape |
| Large Desktop | `1600×900`, `1920×1080` | Landscape |
| Ultra-Wide | `2560×1080` | Landscape |
| Full HD TV | `1920×1080` | Landscape |
| 4K TV | `3840×2160` | Landscape |

---

## 4. Responsive Defects Identified & Repaired

| ID | Severity | Affected Surface / File | Root Cause Found | Repair Applied | Status |
|---|---|---|---|---|---|
| **RESP-01** | **P0 (Critical)** | `/blog` search & category bar (`frontend/src/components/BlogListClient.tsx:80`) | Inline `minWidth: 260` inside a padded container exceeded available inner width (`~248px`) on `320px` screens, causing horizontal overflow. | Replaced `minWidth: 260, flex: '0 1 360px'` with `minWidth: 0, flex: '1 1 220px', maxWidth: 360`. | **FIXED** |
| **RESP-02** | **P0 (Critical)** | `/panel/profile` identity header (`frontend/src/styles/interactions.css:2382`) | `.nk-profile-hero__identity` had rigid `min-width: 260px` inside `.nk-profile-hero` (`padding: 28px`), exceeding `232px` available width on `320px` mobile screens. | Changed to `min-width: min(100%, 260px)` so it shrinks fluidly on `320px–360px` screens. | **FIXED** |
| **RESP-03** | **P0 (Critical)** | `/teachers/[id]` schedule, credentials & subratings (`frontend/src/styles/interactions.css`) | `.public-slot-card__info` (`min-width: 240px`), `.nk-tp-cred-list` (`minmax(260px, 1fr)`), `.nk-tp-subratings-grid` (`minmax(210px, 1fr)`), and `.nk-tp-day-grid` (`minmax(185px, 1fr)`) lacked `min(100%, ...)` clamping for `320px` viewports. | Updated all four rules to use `min(100%, ...)` (`min-width: min(100%, 240px)`, `minmax(min(100%, 260px), 1fr)`, etc.). | **FIXED** |
| **RESP-04** | **P1 (High)** | Header & Wallet Dropdown on `320px–600px` (`frontend/src/styles/responsive.css`) | When logged in on `320px–480px`, `.site-header .inner` rendered Brand + Search + Wallet Pill + Profile Button + Mobile Trigger without width caps, and `.nk-wallet-dropdown` could overflow the screen edge. | Added `@media (max-width: 600px)` fixed viewport-bounded positioning (`inset-inline: 12px; max-width: calc(100vw - 24px)`) for `.nk-wallet-dropdown`, and capped `.nk-wallet-pill` & `.btn-outline` widths at `<=480px` and `<=360px`. | **FIXED** |
| **RESP-05** | **P1 (High)** | Footer on Tablet (`600px–900px`) & Mobile (`320px–480px`) (`frontend/src/styles/responsive.css`) | `.site-footer .cols` placed `.footer-brand` into a narrow half-column at `<=720px`, and only collapsed to 1 column at `<=400px`. `.footer-tel` lacked `flex-wrap: wrap`. | Made `.site-footer .footer-brand { grid-column: 1 / -1; }` at `<=900px`, collapsed `.site-footer .cols` to 1 column at `<=480px`, and added `.footer-tel { flex-wrap: wrap; }`. | **FIXED** |
| **RESP-06** | **P1 (High)** | `/classes/[id]` & `/classes` 4-column inline grids (`ClassDetail.jsx`, `ClassesSearch.jsx`, `responsive.css`) | Inline `gridTemplateColumns: 'repeat(4, 1fr)'` on `.cd-tier-grid`, `.cd-info-grid`, and `.cs-hour-grid` squeezed cards/buttons at `320px–480px`. | Added `.cd-tier-grid`, `.cd-info-grid`, and `.cs-hour-grid` classes and responsive rules collapsing `.cd-info-grid` to `2` cols at `<=600px` and `1` col at `<=480px`, and `.cd-tier-grid` / `.cs-hour-grid` to `2` cols at `<=480px`. | **FIXED** |
| **RESP-07** | **P1 (High)** | Calendar, Finance Presets & Chat in Mobile & Landscape (`responsive.css`) | `.nk-cal-summary-grid` and `.nk-finance-presets` needed `<=600px`/`<=480px` column reductions; `.nk-cal-board` needed horizontal scroll protection at `<=480px`; Mobile Landscape (`max-height: 520px`) needed bounded heights for `.conv-list`, `.chat-body`, `.support-inbox`, and `.nk-menu-sheet`. | Added responsive rules in `responsive.css` for `<=600px`, `<=480px`, and `@media (max-height: 520px) and (orientation: landscape)`. | **FIXED** |
| **RESP-08** | **P2 (Medium)** | Full HD TV (`1920×1080`), Ultra-Wide (`2560px`) & 4K TV (`3840×2160`) (`responsive.css`) | Standard `1320px` containers left excessive unused margins on `1920px–3840px` displays and lacked explicit TV/controller `:focus-visible` ring scaling. | Added `@media (min-width: 1920px)` (`max-width: 1440px` / `1560px` panel) and `@media (min-width: 2560px)` (`max-width: 1680px` / `1800px` panel + high-contrast `3px solid var(--accent)` focus rings). | **FIXED** |
