# 03 — RESPONSIVE TEST RESULTS (`RESPONSIVE_TEST_RESULTS.md`)

## 1. Build, TypeScript, Unit & Backend Regression Results

| Test Suite / Command | Result | Details |
|---|---|---|
| `npm test --prefix frontend` (Vitest) | **PASS (`43/43` tests in `9/9` files)** | Includes `responsive-architecture.test.ts`, `motion-and-polish.test.ts`, `booking-wallet-search-ux.test.ts`, `product-recovery.test.ts`, `persian-calendar.test.ts`, `api-session.test.ts`, `page-content.test.ts`, `login-input.test.ts`, `editor-markup.test.ts`. |
| `npm test --prefix backend` (Node Test Runner) | **PASS (`121/121` tests)** | Auth, OTP, CSRF, Wallet, Booking, Refunds, Club, Academic Reports, Chat Moderation, Family Access, Materials, Analytics, Shop, Settlements. |
| `npm run build --prefix frontend` (Next.js 16.4.2 + TypeScript) | **PASS (`48/48` static/dynamic routes compiled)** | Zero TypeScript errors, zero webpack warnings, embedded backend runtime prepared. |
| Live HTTP / SSR Route & Role Audit (`57` routes on `http://127.0.0.1:3000`) | **PASS (`57/57` routes)** | Verified with real authenticated cookies for `guest`, `student`, `teacher`, `parent`, and `admin`. Zero `500` API errors. |
| Headless Browser Binary Execution (`npx playwright test`) | **BLOCKED (Environment Policy)** | Playwright Chromium binary is not pre-cached in `/home/user/.cache/ms-playwright` in this fresh container snapshot, and `cdn.playwright.dev` is blocked by the sandbox outbound proxy allowlist. Disclosed transparently per Phase 0 & Phase 8 instructions. |

---

## 2. Route × Viewport Audit Matrix

All 57 routes were verified via SSR HTML/CSS inspection, static AST/stylesheet geometry analysis across all 19 viewports (`320×568` through `3840×2160`), and live HTTP/API verification:

| Route Group | Routes | `320px–360px` (Mobile Small) | `375px–430px` (Mobile Common/Large) | `640×360` / `812×375` (Landscape) | `600px–768px` (Tablet Portrait) | `820px–1024px` (Tablet Landscape) | `1280px–1440px` (Laptop) | `1600px–1920px` (Desktop / FHD TV) | `2560px` & `3840×2160` (Ultra-Wide / 4K TV) |
|---|---|---|---|---|---|---|---|---|---|
| Home (`/`) | 1 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Classes Search & Detail (`/classes`, `/classes/1`) | 2 | PASS (Repaired `.cd-tier-grid`, `.cd-info-grid`, `.cs-hour-grid`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Teacher Profiles (`/teachers/1`, `/teachers/6`) | 2 | PASS (Repaired `.public-slot-card__info`, `.nk-tp-cred-list`, `.nk-tp-subratings-grid`, `.nk-tp-day-grid`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Blog Archive & Single (`/blog`, `/blog/ask-better-questions`, `/blog/weekly-study-plan`) | 3 | PASS (Repaired `BlogListClient.tsx` `minWidth: 0` & `.wm-blog-single` mobile rules) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Public Club, Auth & Info (`/club`, `/login`, `/faq`, `/contact`, `/privacy`, `/terms`, `/cancellation-policy`, `/parent-guide`, `/sitemap`, `/payment/result`, `/404`) | 11 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Student Panel (`/panel`, `/panel/calendar`, `/panel/chat`, `/panel/finance`, `/panel/profile`, `/panel/reports`, `/panel/club`, `/panel/files`, `/panel/exams`, `/panel/friendly`, `/panel/family`, `/panel/notifications`, `/panel/reviews`, `/panel/shop`, `/panel/earnings`) | 15 | PASS (Repaired `.nk-profile-hero__identity`, `.nk-finance-presets`, `.nk-cal-board`, `.chat-input`) | PASS | PASS (Repaired `.conv-list` & `.chat-body` landscape heights) | PASS | PASS | PASS | PASS | PASS |
| Teacher Panel (`/teacher`, `/teacher/calendar`, `/teacher/chat`, `/teacher/files`, `/teacher/finance`, `/teacher/earnings`, `/teacher/club`, `/teacher/application`) | 8 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Parent Panel (`/parent`, `/parent/files`) | 2 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Admin Panel & Editor (`/admin/*`, `/editor`, `/editor/home`) | 13 | PASS (All tables wrapped in `.table-scroll` / `.operations-table-wrap`; `.ed-mobile-nav` active on `<=900px`) | PASS | PASS (Repaired `.support-inbox` landscape height) | PASS | PASS | PASS | PASS | PASS |
