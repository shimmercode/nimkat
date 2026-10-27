# Phase 14 — Post-Fix Final Regression Verification (`13_FINAL_REGRESSION.md`)

**Audit Date:** 2026-10-27  
**Target Directory:** `/tmp/nimkat-1.7.0-audit-work/work`  
**Evidence Logs:**
- `/tmp/nimkat-1.7.0-audit-work/logs/final-backend-test.log`
- `/tmp/nimkat-1.7.0-audit-work/logs/final-frontend-vitest.log`
- `/tmp/nimkat-1.7.0-audit-work/logs/final-frontend-typecheck.log`
- `/tmp/nimkat-1.7.0-audit-work/logs/final-frontend-build.log`
- `/tmp/nimkat-1.7.0-audit-work/logs/final-probes.log`
- `/tmp/nimkat-1.7.0-audit-work/logs/postfix-playwright-all.log`

---

## 14.1 Baseline vs Post-Fix Regression Comparison Matrix

| Verification Suite | Command | Baseline Result (Phase 2) | Post-Fix Result (Phase 14) | Duration (`ms`) | Final Status |
|---|---|---|---|---|---|
| **Backend Unit & API Integration Tests** | `npm test` (`node --test`) | `121/121 PASS` | `121/121 PASS` (`0` failed, `0` skipped) | `6,618 ms` | `PASS` |
| **Frontend Vitest Unit Suite** | `npx vitest run` | `39/39 PASS` (`8` test files) | `39/39 PASS` (`8` test files, `0` failed) | `2,524 ms` | `PASS` |
| **TypeScript Static Typecheck** | `npm run typecheck` (`tsc --noEmit`) | `PASS` (`exit_code=0`) | `PASS` (`exit_code=0`) | `831 ms` | `PASS` |
| **Lint Check** | `npm run lint` | `NOT APPLICABLE` (no script) | `NOT APPLICABLE` (no script) | `0 ms` | `NOT APPLICABLE` |
| **Frontend Production Build** | `npm run build` (`next build`) | `58/58 routes PASS` | `58/58 routes PASS` (`exit_code=0`) | `24,848 ms` | `PASS` |
| **Security & RBAC / IDOR / CSRF Probes** | `node phase-4-to-9-probes-postfix.js` (`phase5`) | `4/4 PASS` | `4/4 PASS` (`npm audit`: `0` vulnerabilities) | `1,086 ms` | `PASS` |
| **Wallet, Callback & Double-Entry Ledger (13 Scenarios)** | `node phase-4-to-9-probes-postfix.js` (`phase6`) | `13/13 PASS` (`ledger.balanced: true`) | `13/13 PASS` (`ledger.balanced: true`, `netSumRial: 0`) | `1,086 ms` | `PASS` |
| **Single/Multi-Session Booking, Concurrency & Coupon (10 Scenarios)** | `node phase-4-to-9-probes-postfix.js` (`phase7`) | `9/10 PASS`, `1/10 FAIL` (`b10` `MEHR05`) | `10/10 PASS` (`b10` first-time `200`, repeat `409`) | `1,086 ms` | `FIXED — VERIFIED` |
| **Search Normalization (`فیزیک ۱۱` vs `فیزیک یازدهم`)** | `node phase-4-to-9-probes-postfix.js` (`phase9`) | `FAIL` (`0` hits for `فیزیک ۱۱`) | `PASS` (`5` hits across Persian/Arabic/English digits & words) | `1,086 ms` | `FIXED — VERIFIED` |
| **Playwright Full Browser E2E Suite (12 Specs, 54 Tests)** | `npx playwright test --reporter=list` | `20 passed, 19 failed, 15 did not run` | **`54/54 PASS` (`0` failed, `0` skipped)** | `98,080 ms` | `FIXED — VERIFIED` |
| **Multi-Viewport Browser Audit (`26` Routes × `3` Viewports)** | `bash run-phase10.sh` (`78` captures) | `OVERFLOWS=4`, `/rss.xml` `503`, `/blog/404` `200` | **`CAPTURED=78, OVERFLOWS=0, ERRORS=0`**, `/rss.xml` `200`, `/blog/404` `404` | `54,187 ms` | `FIXED — VERIFIED` |
| **Isolated Production Runtime Startup & Fail-Closed Secret Check** | `node phase-4-to-9-probes-postfix.js` (`phase4`) | `.env.example` placeholder crashed `store.js` | `5/5 PASS` (`exitCode=1` on missing secrets; `200 OK` with valid 64-hex key) | `1,086 ms` | `FIXED — VERIFIED` |
| **External Live Zarinpal Sandbox & Live SMS (`Kavenegar`/`Melipayamak`)** | Outbound TLS probe to `sandbox.zarinpal.com` | `BLOCKED` (`ECONNRESET` sandbox firewall + no credentials) | `BLOCKED` (external network blocked by sandbox policy; mock/controlled callback `PASS`) | N/A | `BLOCKED` |

---

## 14.2 Complete 54-Test Playwright E2E Breakdown (`POSTFIX_PLAYWRIGHT_ALL_EXIT=0`)

| Spec File | Tests | Passed | Failed | Skipped | Status |
|---|---:|---:|---:|---:|---|
| `tests/e2e/blog-guest.spec.ts` | `6` | `6` | `0` | `0` | `PASS` |
| `tests/e2e/class-detail.spec.ts` | `1` | `1` | `0` | `0` | `PASS` |
| `tests/e2e/commerce-reviews.spec.ts` | `2` | `2` | `0` | `0` | `PASS` |
| `tests/e2e/community-ui.spec.ts` | `6` | `6` | `0` | `0` | `PASS` |
| `tests/e2e/cookie-policy.spec.ts` | `2` | `2` | `0` | `0` | `PASS` |
| `tests/e2e/editor.spec.ts` | `2` | `2` | `0` | `0` | `PASS` |
| `tests/e2e/final-qa-gate.spec.ts` | `11` | `11` | `0` | `0` | `PASS` |
| `tests/e2e/login-search-regression.spec.ts` | `4` | `4` | `0` | `0` | `PASS` |
| `tests/e2e/remaining-flows.spec.ts` | `3` | `3` | `0` | `0` | `PASS` |
| `tests/e2e/support-responsive.spec.ts` | `4` | `4` | `0` | `0` | `PASS` |
| `tests/e2e/zz-next-modules.spec.ts` | `4` | `4` | `0` | `0` | `PASS` |
| `tests/e2e/zz-operations.spec.ts` | `9` | `9` | `0` | `0` | `PASS` |
| **Total** | **`54`** | **`54`** | **`0`** | **`0`** | **`PASS`** |
