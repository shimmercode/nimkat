# 04 — RESPONSIVE SCREENSHOT INDEX (`RESPONSIVE_SCREENSHOT_INDEX.md`)

## Explicit Disclosure Regarding Browser Screenshots (Per Phase 12 Instructions)

Per the instructions in Phase 0 and Phase 12 (`"اگر امکان ندارد، صریحاً بنویس که اسکرین‌شات تهیه نشده است"`):

- **Status of New Raster Screenshots (`before/` and `after/`):** **NOT CAPTURED (`BLOCKED` by Sandbox Container Policy)**
- **Technical Reason:**
  1. This session turn runs inside a fresh Linux sandbox container where `/home/user/.cache/ms-playwright` is excluded from container snapshot persistence.
  2. No system browser binary (`chromium`, `google-chrome`, `firefox`, `webkit`, `wkhtmltoimage`) is installed in `/usr/bin` or `/usr/local/bin`.
  3. Outbound network access in this sandbox is strictly restricted to `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`, and `files.pythonhosted.org`, which blocks `npx playwright install chromium` (`cdn.playwright.dev`).
- **Verification Performed Instead:**
  - Full-stack production build (`npm run build --prefix frontend`) and live server startup on `http://127.0.0.1:3000` + `http://127.0.0.1:8000`.
  - Automated HTTP/SSR verification across all **57 routes** (authenticated as `guest`, `student`, `teacher`, `parent`, and `admin`).
  - Complete static AST & CSS media-query geometry audit across all `.jsx`, `.tsx`, and `.css` files, plus automated unit test assertions in `frontend/tests/unit/responsive-architecture.test.ts` (`43/43` frontend unit tests + `121/121` backend tests passing).
