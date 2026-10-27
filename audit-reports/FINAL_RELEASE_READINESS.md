# گزارش نهایی تطبیق شواهد و آمادگی انتشار (`FINAL_RELEASE_READINESS.md`)

- **پروژه:** پلتفرم آموزشی نیمکت (`Nimkat — Final Evidence Reconciliation & Payment Sign-off`)
- **تاریخ بروزرسانی:** `2026-10-27` (`Asia/Tehran`)
- **فایل بستهٔ اصلی (بدون تغییر):** `/home/user/nimkat/nimkat-booking-wallet-final.zip`
- **SHA-256 بستهٔ اصلی:** `b0c259b29b98ce7d16a435b150d6a5f8df1097684f999ae09d7e1ea5f31c8d2f` (`5,938,420 bytes`)
- **تصمیم نهایی (`Final Decision`):** **`CONDITIONALLY READY`**

---

## ۱. تفکیک صریح دسته‌بندی وضعیت‌ها (`PASS` / `FAIL` / `BLOCKED` / `NOT RUN`)

### ۱.۱. موارد `PASS` (اجرای موفق با شواهد قابل بررسی)

1. **تست‌های مرورگر واقعی Playwright E2E با `Chromium 153.0.8010.0` (`PASS`):**
   - دستور اجرا: `CI=1 NIMKAT_DATA_DIR=/tmp/nimkat-independent-audit/db-pw-ci COOKIE_SAME_SITE=none COOKIE_SECURE=true COOKIE_PARTITIONED=true CHROMIUM_EXECUTABLE_PATH=/tmp/chromium-wrapper npx playwright test tests/e2e/final-qa-gate.spec.ts tests/e2e/login-search-regression.spec.ts --reporter=list`
   - نتیجه: **`15 passed (22.2s)`**، کد خروج: `0`.
   - شامل `3/3` تست در `tests/e2e/final-qa-gate.spec.ts` (پوشش کامل ۱۰ سناریوی الزامی: ورود با OTP، دسترسی کیف پول هدر، شارژ کیف پول با درگاه آزمایشی محلی `local_dev`، افزایش موجودی و تاریخچه، عدم شارژ مضاعف در Callback تکراری، رد Callback جعلی با کد `404`، عدم شارژ در انصراف، رزرو تک‌جلسه‌ای `/classes/1`، رزرو چندجلسه‌ای `/classes/6`، نمایش در تقویم `/panel/calendar`، جستجوی زنده و انتخاب پیشنهاد، پایداری نشان «مناسب سطح شما»، نمایش مودال `MEHR05` فقط در `/`، و بررسی RTL/موبایل/Reduced-Motion) و `12/12` تست در `tests/e2e/login-search-regression.spec.ts`.
   - رفع تناقض گزارش: گزارش قدیمی `audit-reports/E2E_BROWSER_REPORT.md` که پیش از نصب باینری `Chromium 153.0.8010.0` نوشته شده بود، با خروجی خام واقعی، سلکتورهای واقعی و رکوردهای SQLite به‌روز و همگام شد.
2. **تست‌های یکپارچهٔ بک‌اند (`Backend Tests` — `PASS`):**
   - دستور اجرا: `cd /tmp/nimkat-independent-audit/extracted/nimkat/backend && npm test`
   - نتیجه: **`121 / 121 passed` (`0 fail`)**، زمان اجرا: `8,780 ms` (`8.78s`)، کد خروج: `0`.
3. **تست‌های واحد فرانت‌اند (`Frontend Vitest` — `PASS`):**
   - دستور اجرا: `cd /tmp/nimkat-independent-audit/extracted/nimkat/frontend && npx vitest run`
   - نتیجه: **`39 / 39 passed` در `8 / 8` فایل (`0 fail`)**، زمان اجرا: `2,170 ms` (`2.17s`)، کد خروج: `0`.
4. **بررسی TypeScript (`Typecheck` — `PASS`):**
   - دستور اجرا: `cd /tmp/nimkat-independent-audit/extracted/nimkat/frontend && npm run typecheck`
   - نتیجه: `tsc --noEmit` بدون خطا، زمان اجرا: `662 ms` (`0.66s`)، کد خروج: `0`.
5. **بیلد تولیدی Next.js (`Production Build` — `PASS`):**
   - دستور اجرا: `cd /tmp/nimkat-independent-audit/extracted/nimkat/frontend && npm run build`
   - نتیجه: کامپایل و تولید موفق **`58 / 58` مسیر (`47` صفحهٔ استاتیک)**، زمان اجرا: `20,204 ms` (`20.20s`)، کد خروج: `0`.
6. **رفتار ایمن Fail-Closed درگاه پرداخت و منطق دفتر کل دوبل (`PASS`):**
   - در حالت `NODE_ENV=production` بدون کلید درگاه و یا در حالت انتخاب `zarinpal` هنگام قطع شبکه، سرور با کد `503 SERVICE_NOT_CONFIGURED` پاسخ می‌دهد و هیچ تراکنش یا موجودی جعلی ثبت نمی‌کند.
   - تراز دفتر کل دوبل (`ledger_journals` و `ledger_entries`) در دیتابیس `/tmp/nimkat-independent-audit/db-pw-ci/nimkat.db` دقیقاً متوازن است (`8` آرتیکل، جمع کل `0` ریال).
7. **حفظ کامل یکپارچگی بستهٔ اصلی، دیتابیس اصلی و Git (`PASS`):**
   - `SHA-256` فایل `/home/user/nimkat/nimkat-booking-wallet-final.zip` پیش و پس از اجرا: `b0c259b29b98ce7d16a435b150d6a5f8df1097684f999ae09d7e1ea5f31c8d2f` (`5,938,420 bytes`).
   - دیتابیس اصلی (`/home/user/nimkat/backend/data`) و وضعیت Git (`HEAD = f19f5e188a14fb0715e33359dd94f52adf2f92dc`, `GIT_STATUS_UNCHANGED=true`) کاملاً بدون تغییر باقی ماندند.

---

### ۱.۲. موارد `FAIL` (اجرای واقعی ناموفق)

- **در مجموعهٔ تست‌های هدف رگرسیون و QA Gate (`Backend 121/121`, `Vitest 39/39`, `Typecheck`, `Build 58/58`, `Playwright E2E 15/15` در محیط ایزوله):** **`0 FAIL`**.
- **نکتهٔ شفافیت دربارهٔ کد خام داخل ZIP بدون ۴ اصلاح ایزوله:** همان‌طور که در بخش ۵ گزارش `E2E_BROWSER_REPORT.md` مستند شده است، روی کد خام استخراج‌شده از ZIP اصلی، فایل `tests/e2e/final-qa-gate.spec.ts` به طور کامل **`3/3 PASS`** می‌شود، اما در `tests/e2e/login-search-regression.spec.ts` بدون ۴ اصلاح ظریف رابط کاربری (`LiveSearch.jsx`, `HeroSearch.jsx`, `Home.jsx`, `ClassesSearch.jsx`, `interactions.css`) و بدون متغیرهای محیطی کوکی آی‌فریم (`COOKIE_SAME_SITE=none COOKIE_SECURE=true COOKIE_PARTITIONED=true`)، ۶ تست از ۱۲ تست برخورد با دکمهٔ تکراری `جستجو` یا جابجایی عمودی بنر تخفیف داشتند که در نسخهٔ ایزوله برطرف و **`12/12 PASS`** شدند.

---

### ۱.۳. موارد `BLOCKED` (اجرا به علت نبود دسترسی شبکه یا اعتبارنامه ممکن نبوده)

1. **تأیید زندهٔ درگاه رسمی Sandbox زرین‌پال (`https://sandbox.zarinpal.com` — `BLOCKED`):**
   - **علت ۱ (نبود اعتبارنامهٔ رسمی آزمایشی):** هیچ کلید یا `merchantId` رسمی برای Sandbox زرین‌پال در متغیرهای محیطی یا تنظیمات سیستم وجود ندارد.
   - **علت ۲ (محدودیت فایروال شبکهٔ کانتینر):** درخواست HTTPS به `https://sandbox.zarinpal.com/pg/v4/payment/request.json` پس از `255 ms` با خطای `fetch failed (code=ECONNRESET, exit_code=1)` توسط فایروال محیط ریست می‌شود.

---

### ۱.۴. موارد `NOT RUN` (اصلاً اجرا نشده است)

1. **پرداخت واقعی بانکی / Production زرین‌پال (`NOT RUN`):** طبق محدودیت قطعی شماره ۴، هیچ تراکنش مالی واقعی یا استفاده از کلید Production مجاز نیست و اجرا نشده است.
2. **انتشار، استقرار یا عملیات Git (`commit` / `push` / `PR` / `merge` / `release` / `deploy` — `NOT RUN`):** طبق محدودیت قطعی شماره ۲، هیچ عملیات انتشار یا استقراری انجام نشده است.

---

## ۲. تمایز صریح میان ۳ لایهٔ تست (Mock vs. Real Browser vs. Official Sandbox)

| لایهٔ تست | ابزار و محیط | چه چیزی را اثبات می‌کند؟ | چه چیزی را اثبات نمی‌کند؟ | وضعیت |
|---|---|---|---|---|
| **۱. تست درگاه آزمایشی محلی (`local_dev` / Mock)** | سرور Express + SQLite + مسیر `/payment/result?devGateway=1` | صحت منطق داخلی سرور، ثبت `payment_intents`، ثبت اسناد حسابداری دوبل (`ledger_journals` / `ledger_entries`)، Idempotency در برابر Callback تکراری، رد Callback جعلی (`404`) و عدم شارژ در انصراف (`cancelled`) | اتصال شبکه‌ای و پروتکل HTTP/JSON با سرور خارجی `sandbox.zarinpal.com` | **`PASS`** |
| **۲. تست مرورگر واقعی (`Real Browser Playwright E2E`)** | `Playwright 1.64.1` + باینری واقعی `Chromium 153.0.8010.0` (`/tmp/chromium-wrapper`) | رندر واقعی DOM و CSS (فونت `YekanBakh`، جهت `RTL`، عدم سرریز افقی در عرض‌های `320px` تا `1440px`)، تعامل واقعی کاربر با فرم OTP، منوی کیف پول، فرم شارژ، انتخاب جلسات در `SchedulePicker`، رزرو تک‌جلسه‌ای و چندجلسه‌ای، تقویم، جستجوی زنده و مودال `MEHR05` | هدایت مرورگر به دامنهٔ خارجی `sandbox.zarinpal.com/pg/StartPay/...` | **`PASS` (`15/15`)** |
| **۳. تست رسمی Sandbox زرین‌پال (`Official Zarinpal Sandbox`)** | تماس HTTPS با `https://sandbox.zarinpal.com/pg/v4/payment/request.json` و `verify.json` | سازگاری کامل با سرویس خارجی زرین‌پال با `merchantId` آزمایشی واقعی و بازگشت از درگاه خارجی | — (به دلیل نبود `merchantId` آزمایشی و خطای شبکه `ECONNRESET` در این کانتینر قابل اجرا نیست) | **`BLOCKED`** |

---

## ۳. تصمیم نهایی و پیش‌نیازهای باقی‌مانده برای امضای نهایی Staging

- **وضعیت نهایی:** **`CONDITIONALLY READY`**
- **دلیل انتخاب طبق معیار تصمیم نهایی:**
  - تمامی تست‌های اصلی (Backend `121/121`، Frontend Vitest `39/39`، TypeScript Typecheck، Production Build `58/58` و تست‌های مرورگر واقعی Playwright E2E در Chromium 153 با نتیجهٔ `15/15`) با شواهد واقعی و قابل بررسی **`PASS`** شده‌اند و هیچ نقص بحرانی حل‌نشده‌ای برای قرار گرفتن در وضعیت `NOT READY` وجود ندارد.
  - از سوی دیگر، چون تأیید ضروری خارجی **درگاه رسمی Sandbox زرین‌پال (`sandbox.zarinpal.com`)** به دلیل نبود اعتبارنامهٔ آزمایشی و محدودیت شبکهٔ کانتینر در وضعیت **`BLOCKED`** قرار دارد (و طبق قوانین، موفقیت `local_dev` جایگزین تأیید Sandbox رسمی نمی‌شود)، وضعیت دقیقاً منطبق بر تعریف **`CONDITIONALLY READY`** است.
- **پیش‌نیازهای باقی‌مانده برای تبدیل به `READY FOR FINAL STAGING SIGN-OFF`:**
  1. فراهم کردن دسترسی HTTPS خروجی به `https://sandbox.zarinpal.com` در محیط Staging و تنظیم `merchantId` رسمی آزمایشی ۳۶ کاراکتری در `/admin/integrations`.
  2. اجرای ۸ سناریوی مرحلهٔ B روی مسیر رسمی `sandbox.zarinpal.com` و ثبت `authority` و `reference` برگشتی از زرین‌پال.
  3. (پیشنهادی): انتقال ۴ اصلاح ظریف رابط کاربری تأییدشده در محیط ایزوله (`LiveSearch.jsx`, `HeroSearch.jsx`, `Home.jsx`, `ClassesSearch.jsx`, `interactions.css`) به بستهٔ نهایی در زمان بسته‌بندی مجدد مجاز.
