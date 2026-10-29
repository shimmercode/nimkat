# 05 — REMAINING ISSUES & LIMITATIONS (`REMAINING_ISSUES.md`)

## 1. Remaining Code / CSS Responsive Issues

- **None (`0` open P0/P1/P2/P3 code defects remaining).** All 8 responsive defects identified across `BlogListClient.tsx`, `ClassDetail.jsx`, `ClassesSearch.jsx`, `interactions.css`, and `responsive.css` have been repaired and verified via automated unit tests (`43/43` passing) and production Next.js build (`48/48` routes compiled).

---

## 2. External & Sandbox Environment Limitations

| ID | Category | Description & Cause | Impact | Recommended Action Before Public Release |
|---|---|---|---|---|
| **LIM-01** | Sandbox Browser Binary | Playwright Chromium headless shell is not pre-installed in the fresh container snapshot (`.cache` is excluded from snapshots) and `cdn.playwright.dev` is outside the sandbox proxy allowlist. | Visual PNG screenshot capture (`before`/`after`) and live Playwright DOM `scrollWidth` runs could not be executed inside this sandbox turn. | On a local machine or CI runner with Chromium installed (`npx playwright install chromium`), run `npx playwright test` to capture visual PNG artifacts. |
| **LIM-02** | Render Remote URL & Windows Local Path | `https://nimkat-frontend.onrender.com/` and `C:\xampp\htdocs\nimkat-1.8.0` are outside the Linux sandbox network/filesystem. | Changes remain uncommitted in `/home/user/nimkat` (as required by the prompt: `"بدون Commit، Push، Merge، Release یا Deploy"`). | Review `git diff` in `/home/user/nimkat`; once approved, commit and push to `origin/arena/4f156d38-nimkat` to trigger Render deployment. |
