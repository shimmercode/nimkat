# گزارش اجرای مستقل تست‌ها و بیلد تولید (Stage 6 — TEST_EXECUTION_REPORT)

تمامی تست‌ها و بیلدها به صورت مستقل روی کد استخراج‌شده از بسته در مسیر ایزولهٔ `/tmp/nimkat-independent-audit/extracted/nimkat` اجرا شدند.

---

## ۱. مشخصات محیط اجرا

- **نسخهٔ Node.js:** `v22.22.3`
- **نسخهٔ npm:** `10.9.8`
- **مسیر اجرای ایزوله:** `/tmp/nimkat-independent-audit/extracted/nimkat`

---

## ۲. نتایج اجرای تست‌های بک‌اند (`cd backend && npm test`)

- **دستور واقعی اجراشده:** `node --test tests/*.test.js`
- **تعداد کل تست‌ها:** `121`
- **موفق (`pass`):** `121`
- **ناموفق (`fail`):** `0`
- **ردشده (`skipped`):** `0`
- **ناتمام (`todo`):** `0`
- **مدت زمان اجرا:** `6,530.23 ms`
- **وضعیت:** **`PASS`**

---

## ۳. نتایج اجرای تست‌های واحد فرانت‌اند (`cd frontend && npx vitest run`)

- **دستور واقعی اجراشده:** `npx vitest run` (Vitest `v5.0.5`)
- **فایل‌های تست اجراشده (`8` فایل):**
  1. `tests/unit/api-session.test.ts` (`5` تست — `PASS`)
  2. `tests/unit/motion-and-polish.test.ts` (`8` تست — `PASS`)
  3. `tests/unit/booking-wallet-search-ux.test.ts` (`4` تست — `PASS`)
  4. `tests/unit/product-recovery.test.ts` (`6` تست — `PASS`)
  5. `tests/unit/persian-calendar.test.ts` (`4` تست — `PASS`)
  6. `tests/unit/page-content.test.ts` (`8` تست — `PASS`)
  7. `tests/unit/editor-markup.test.ts` (`2` تست — `PASS`)
  8. `tests/unit/login-input.test.ts` (`2` تست — `PASS`)
- **تعداد کل تست‌ها:** `39` (`39 passed`, `0 failed`, `0 skipped`, `0 todo`)
- **مدت زمان اجرا:** `2.14 s`
- **وضعیت:** **`PASS`**

---

## ۴. نتیجهٔ اجرای Build تولید و TypeScript (`cd frontend && npm run build`)

- **دستور واقعی اجراشده:** `next build --webpack` (Next.js `16.4.2`)
- **بررسی TypeScript:** `Finished TypeScript in 820ms` (`0` خطا)
- **تولید صفحات ایستا و پویا:** `58` مسیر کامل (`47` صفحهٔ استاتیک + مسیرهای داینامیک `/`, `/classes`, `/classes/[id]`, `/teachers/[id]`, `/blog`, `/blog/[slug]`, `/club`, `/editor/[slug]`, `/p/[slug]`, `/robots.txt`, `/rss.xml`, `/sitemap`, `/sitemap.xml`)
- **وضعیت:** **`PASS`**

---

## ۵. تست زندهٔ رندر سمت سرور (SSR HTTP Smoke) روی بیلد استخراج‌شده

با اجرای هم‌زمان سرور Express و `npx next start -p 4321` روی نسخهٔ استخراج‌شده، پاسخ واقعی HTTP و HTML مسیرهای اصلی بررسی شد:
- `GET /` -> `HTTP 200` (`72,701` بایت، حاوی `site-header` و `role="combobox"`)
- `GET /classes?kind=گروهی` -> `HTTP 200` (`39,832` بایت، حاوی `site-header` و `role="combobox"`)
- `GET /classes/1` -> `HTTP 200` (`20,319` بایت، حاوی `site-header`)
- `GET /teachers/1` -> `HTTP 200` (`20,301` بایت، حاوی `site-header`)
- `GET /login` -> `HTTP 200` (`9,515` بایت)
- `GET /panel/finance` -> `HTTP 200` (`10,701` بایت)
- `GET /payment/result` -> `HTTP 200` (`18,047` بایت)
