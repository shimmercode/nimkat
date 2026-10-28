# گزارش اجرای واقعی تست‌ها (Real Test Execution Report)

- **تاریخ و زمان اجرا:** ۱۴۰۵/۰۸/۰۵ (۲۰۲۶-۱۰-۲۷)
- **محیط اجرا:** کپی ایزوله `/tmp/nimkat-ui-ux-work/work` با پایگاه دادهٔ SQLite مجزا (`/tmp/nimkat-ui-ux-work/db-e2e`) و مرورگر واقعی Headless Chromium `153.0.8010.0`

---

## ۱. جدول خلاصه وضعیت تست‌ها (`PASS` / `FAIL` / `BLOCKED` / `NOT RUN`)

| ردیف | دستهٔ آزمون | ابزار / دستور اجرا | تعداد کل | نتیجه | زمان اجرا | وضعیت نهایی |
|---|---|---|---|---|---|---|
| ۱ | **تست‌های واحد و یکپارچگی بک‌اند** | `cd backend && npm test` (`node --test`) | `121` تست | `121` موفق / `0` ناموفق | `6.67s` | **PASS** |
| ۲ | **تست‌های واحد فرانت‌اند و Design System** | `cd frontend && npx vitest run` | `40` تست در `8` فایل | `40` موفق / `0` ناموفق | `1.69s` | **PASS** |
| ۳ | **بررسی نوع‌ها (TypeScript Typecheck)** | `cd frontend && npm run typecheck` (`tsc --noEmit`) | کل پروژه فرانت‌اند | `0` خطا (`EXIT=0`) | `3.1s` | **PASS** |
| ۴ | **بیلد تولیدی فرانت‌اند (Production Build)** | `cd frontend && npm run build` (`next build`) | `58` مسیر (SSR + Static) | `58/58` موفق (`EXIT=0`) | `31.4s` | **PASS** |
| ۵ | **ممیزی چنداندازه‌ای RTL، سرریز افقی و کنسول مرورگر** | `node capture-after-and-test.mjs` در ۳ اندازه (`375×812`، `768×1024`، `1440×900`) | `78` بررسی (۲۶ صفحه × ۳ اندازه) | `CAPTURED=78`، `OVERFLOWS=0`، `ERRORS=0` | `28.5s` | **PASS** |
| ۶ | **تست‌های End-to-End مرورگر واقعی (Playwright E2E)** | `npx playwright test` روی سرور تولیدی (`next start` + `backend`) | `54` سناریوی کامل E2E در `9` فایل | `54` موفق / `0` ناموفق | `1.6m` | **PASS** |
| ۷ | **تست فوکوس کیبورد، تلهٔ فوکوس مدال و `prefers-reduced-motion`** | `tests/e2e/community-ui.spec.ts` + `tests/unit/motion-and-polish.test.ts` | پوشش کامل منو، دیالوگ، تب‌ها و CSS | بدون هیچ `transition: all` و با غیرفعال‌سازی کامل حرکت در حالت Reduced Motion | بخشی از موارد ۲ و ۶ | **PASS** |
| ۸ | **تست اتصال زنده به درگاه بانکی خارجی (شاپرک/زرین‌پال واقعی) و کاوهنگار واقعی** | نیازمند کلیدهای تجاری محیط عملیاتی (`ZARINPAL_MERCHANT_ID`، `KAVEHNEGAR_API_KEY`) | — | در محیط Sandbox بدون کلید تجاری خارجی، مسیر Callback کنترل‌شده و شبیه‌ساز توسعه تست شد | — | **BLOCKED (External Credentials)** |
| ۹ | **تست مرورگرهای Safari WebKit / Firefox دسکتاپ** | در محیط لینوکس فعلی باینری Chromium `153.0.8010.0` نصب و اجرا شد | — | صرفاً روی موتور واقعی Chromium تست شد (بدون ادعای تست روی Safari/Firefox) | — | **NOT RUN (Chromium Only)** |

---

## ۲. جزئیات اجرای تست‌های واحد فرانت‌اند (`Vitest` — `40/40 PASS`)

```text
 RUN  v5.0.5 /tmp/nimkat-ui-ux-work/work/frontend

 ✓ tests/unit/api-session.test.ts (5 tests) 97ms
 ✓ tests/unit/motion-and-polish.test.ts (9 tests) 42ms
 ✓ tests/unit/booking-wallet-search-ux.test.ts (4 tests) 16ms
 ✓ tests/unit/page-content.test.ts (8 tests) 8ms
 ✓ tests/unit/product-recovery.test.ts (6 tests) 10ms
 ✓ tests/unit/persian-calendar.test.ts (4 tests) 10ms
 ✓ tests/unit/login-input.test.ts (2 tests) 4ms
 ✓ tests/unit/editor-markup.test.ts (2 tests) 4ms

 Test Files  8 passed (8)
      Tests  40 passed (40)
   Duration  1.69s
```

---

## ۳. جزئیات اجرای ۵۴ سناریوی Playwright E2E در Chromium واقعی (`54/54 PASS`)

تمامی ۹ فایل تست End-to-End روی بیلد تولیدی (`npm run build && npm start`) و سرور بک‌اند واقعی اجرا شدند:
1. **`tests/e2e/booking-flow.spec.ts` (`3/3 PASS`):**
   - رزرو کامل کلاس گروهی از صفحهٔ جزئیات کلاس، انتخاب صندلی و زمان واقعی از `SchedulePicker`، اعمال کد تخفیف، پرداخت از کیف پول و ثبت در تقویم شاگرد.
2. **`tests/e2e/wallet-payment.spec.ts` (`3/3 PASS`):**
   - شارژ کیف پول، انتقال به صفحهٔ Callback، تأیید تراکنش (`Status=OK`)، جلوگیری از شارژ تکراری با کلید Idempotency، و مدیریت لغو تراکنش (`Status=NOK`) در `PaymentResult.jsx`.
3. **`tests/e2e/community-ui.spec.ts` (`4/4 PASS`):**
   - ناوبری کیبوردی مگامنوی دسکتاپ، فیلتر واقعی کلاس‌های گروهی، منوی موبایل Radix با Focus Trap و بازگردانی فوکوس با کلید `Escape` در عرض‌های `320px` تا `1920px`، بررسی فونت محاسبه‌شدهٔ `YekanBakh` و کنتراست رنگ‌ها، و تست `prefers-reduced-motion: reduce`.
4. **`tests/e2e/final-qa-gate.spec.ts` (`5/5 PASS`):**
   - بررسی جامع صفحات عمومی، پنل‌ها، سئو، عدم وجود لینک شکسته و صحت عملکرد فرم‌ها.
5. **`tests/e2e/login-search-regression.spec.ts` (`12/12 PASS`):**
   - ورود با OTP، پایداری نشست در برابر درخواست‌های همزمان، تست ورود درون `iframe` پیش‌نمایش Cross-Site (`SameSite=None; Secure; Partitioned`)، و تست فیلترهای جستجوی هیرو در عرض‌های `320`, `375`, `768`, `1024`, `1440` بدون سرریز افقی (`scrollWidth <= innerWidth + 1`).
6. **`tests/e2e/remaining-flows.spec.ts` (`5/5 PASS`):**
   - دعوت‌نامهٔ خصوصی، گفت‌وگوی زنده در نیم‌چت (`Chat.jsx`)، فیلتر کلمات نامناسب، گزارش پیام (`گزارش`)، داوری ادمین و صفحه‌بندی پیام‌های قدیمی‌تر.
7. **`tests/e2e/support-responsive.spec.ts` (`11/11 PASS`):**
   - بررسی واکنش‌گرایی ویجت پشتیبانی مهمان در ۸ اندازهٔ مختلف (`320×640` تا `1920×1080` و حالت افقی `844×390`)، ارجاع مکالمه به پشتیبان انسانی، پاسخ ادمین، میز تدریس (`TeachingAdmin.jsx`) و انتشار مقاله در ویرایشگر.
8. **`tests/e2e/zz-club-audit.spec.ts` (`3/3 PASS`) و `tests/e2e/zz-commerce.spec.ts` (`2/2 PASS`):**
   - کاتالوگ ۵ سطحی نیمکت کلاب، ۱۹ قانون، ۱۳ جایزه، تفکیک سکهٔ قابل خرج از امتیاز سطح، خرید از فروشگاه با کیف پول واقعی، و تست فنی میکروفون/دوربین (`TechnicalCheck.jsx`).
9. **`tests/e2e/zz-editor-advanced.spec.ts` (`2/2 PASS`)، `tests/e2e/zz-next-modules.spec.ts` (`3/3 PASS`) و `tests/e2e/zz-operations.spec.ts` (`1/1 PASS`):**
   - ورود مستقل والد با OTP، اعطا و لغو دسترسی توسط شاگرد در `Family.jsx`، شاخص‌های واقعی در `Analytics.jsx`، زمان‌بندی هفتگی، تغییر زمان جلسه با توافق طرفین، و بازپرداخت جزئی/کامل به کیف پول در `Finance.jsx`.
