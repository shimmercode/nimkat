# گزارش بررسی و تأیید درگاه پرداخت (`STAGING_PAYMENT_VERIFICATION.md`)

- **پروژه:** پلتفرم آموزشی نیمکت (`Nimkat — Final Evidence Reconciliation & Payment Sign-off`)
- **تاریخ بروزرسانی:** `2026-10-27` (`Asia/Tehran`)
- **فایل بستهٔ اصلی (بدون تغییر):** `/home/user/nimkat/nimkat-booking-wallet-final.zip`
- **SHA-256 بستهٔ اصلی:** `b0c259b29b98ce7d16a435b150d6a5f8df1097684f999ae09d7e1ea5f31c8d2f` (`5,938,420 bytes`)
- **وضعیت کلی تأیید درگاه رسمی Sandbox زرین‌پال (`Stage B`):** **`BLOCKED`**

---

## ۱. بررسی واقعی پیکربندی زرین‌پال و دسترسی به Sandbox (بدون افشای اسرار)

در تاریخ `2026-10-27T13:57:00Z` بررسی مستقیم متغیرهای محیطی و اتصال HTTPS خروجی به درگاه رسمی Sandbox زرین‌پال انجام شد:

| بررسی | دستور اجرا‌شده | خروجی واقعی | کد خروج | وضعیت |
|---|---|---|---|---|
| **۱. بررسی وجود کلیدهای رسمی آزمایشی زرین‌پال در محیط** | `env \| grep -iE 'zarinpal\|merchant\|sandbox\|payment' \| sed 's/=.*/=<REDACTED>/'` | تنها متغیرهای زیرساختی کانتینر (`E2B_SANDBOX_ID`, `E2B_SANDBOX`) وجود دارند و **هیچ متغیر یا کلید `ZARINPAL` / `MERCHANT_ID` تعریف نشده است.** | `0` | **`BLOCKED`** |
| **۲. بررسی اتصال شبکه به `https://sandbox.zarinpal.com/pg/v4/payment/request.json`** | `fetch("https://sandbox.zarinpal.com/pg/v4/payment/request.json", { method: "POST", ... })` | `ZARINPAL_SANDBOX_ERROR=fetch failed code=ECONNRESET duration_ms=255` | `1` | **`BLOCKED`** |

### پیش‌نیازهای دقیق کمبود برای اجرای تست رسمی Sandbox زرین‌پال:
1. **دسترسی شبکهٔ خروجی (Outbound HTTPS Allowlist):** فایروال این محیط تنها دسترسی به ۶ دامنه (`github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`) را مجاز می‌داند و اتصال TLS به `https://sandbox.zarinpal.com` با `ECONNRESET` قطع می‌شود.
2. **اعتبارنامهٔ رسمی آزمایشی (`merchantId`):** یک شناسهٔ مرچنت ۳۶ کاراکتری معتبر برای Sandbox زرین‌پال (و `callbackOrigin` قابل دسترس در محیط Staging) در تنظیمات `/admin/integrations` (بخش `payment`) مورد نیاز است.

---

## ۲. جدول وضعیت ۸ سناریوی الزامی مرحلهٔ B (تفکیک صریح بین Sandbox رسمی، مرورگر واقعی با Mock و منطق سرور)

> **قاعدهٔ عدم جایگزینی:** موفقیت درگاه آزمایشی محلی (`local_dev` / Mock) به هیچ عنوان جایگزین تأیید درگاه رسمی `sandbox.zarinpal.com` محسوب نمی‌شود. در جدول زیر وضعیت هر سناریو در هر دو لایه به صورت کاملاً مجزا ثبت شده است:

| ردیف | سناریوی موردنیاز (Stage B) | وضعیت در درگاه رسمی Sandbox زرین‌پال (`sandbox.zarinpal.com`) | وضعیت در درگاه آزمایشی محلی (`local_dev`) + مرورگر واقعی Chromium 153 + تست بک‌اند | شواهد واقعی اجرا |
|---|---|---|---|---|
| **۱** | **ایجاد درخواست پرداخت آزمایشی از مسیر رسمی Sandbox** | **`BLOCKED`** (نبود کلید Sandbox و خطای شبکه `ECONNRESET` به `sandbox.zarinpal.com`) | **`PASS` (فقط در حالت `local_dev` و تست Fail-Closed)** | در حالت `zarinpal` با قطع شبکه، سرور به صورت ایمن `503 SERVICE_NOT_CONFIGURED` برمی‌گرداند. در حالت `local_dev`، درخواست `POST /api/payments/intents` رکورد `1a54c62f-...` (`amount_rial: 25000000`) را می‌سازد. |
| **۲** | **هدایت به درگاه آزمایشی و بازگشت از Callback** | **`BLOCKED`** (عدم دسترسی به `https://sandbox.zarinpal.com/pg/StartPay/...`) | **`PASS` (در مرورگر واقعی Chromium 153 با `local_dev`)** | هدایت مرورگر به `/payment/result?id=1a54c62f-...&devGateway=1&authority=LOCALDEV_...` و بازگشت از Callback (`GET /api/payments/callback/:id`). |
| **۳** | **اعتبارسنجی سمت سرور و تطبیق مبلغ و شناسهٔ پرداخت** | **`BLOCKED`** (عدم دسترسی به `https://sandbox.zarinpal.com/pg/v4/payment/verify.json`) | **`PASS` (منطق سرور + `local_dev`)** | در `backend/src/modules/settings/providers.js` متد `verifyPayment` مبلغ `amountRial` و `authority` را ارسال و کدهای `100` / `101` را بررسی می‌کند؛ در `local_dev` تطابق دقیق `authority` و `amount_rial` در سرور بررسی شد. |
| **۴** | **ثبت صحیح وضعیت پرداخت و دفتر کل دوطرفه** | **`BLOCKED`** (وابسته به بازگشت از Sandbox رسمی) | **`PASS` (تأییدشده در SQLite و Chromium 153)** | تغییر `status` به `'paid'`، ثبت `verified_at`، ثبت سند در `ledger_journals` (`9ac237be-...`) و ۲ آرتیکل متوازن در `ledger_entries` (`gateway:clearing = -25000000`, `user:108 = +25000000`, جمع کل `0`). |
| **۵** | **جلوگیری از دوبار شارژ شدن با Callback تکراری** | **`BLOCKED`** (در لایهٔ شبکهٔ خارجی Sandbox) | **`PASS` (تأییدشده در Chromium 153 و تست بک‌اند)** | کلیک روی دکمهٔ `ارسال مجدد Callback` در مرورگر واقعی و فراخوانی مجدد `GET /api/payments/callback/:id`؛ موجودی دقیقاً روی `2,500,000` تومان (`25,000,000` ریال) ثابت ماند و سند تکراری ثبت نشد. |
| **۶** | **رد Callback جعلی یا Authority نامعتبر** | **`BLOCKED`** (در لایهٔ شبکهٔ خارجی Sandbox) | **`PASS` (تأییدشده در Chromium 153 و تست بک‌اند)** | ارسال Callback جعلی به `/api/payments/callback/00000000-0000-0000-0000-000000000000?Status=OK&Authority=FORGED&format=json` با کد `404` رد شد؛ ارسال `Authority` مغایر نیز وضعیت را `paid` نمی‌کند. |
| **۷** | **عدم افزایش موجودی در پرداخت لغوشده یا ناموفق** | **`BLOCKED`** (در لایهٔ شبکهٔ خارجی Sandbox) | **`PASS` (تأییدشده در Chromium 153 و SQLite)** | ایجاد شارژ `100,000` تومانی (`efecf9fc-0532-...`) و کلیک روی `لغو پرداخت توسط کاربر` (`Status=NOK`)؛ وضعیت در دیتابیس `status = 'cancelled'` ثبت شد، هیچ سندی در `ledger_journals` نخورد و موجودی تغییر نکرد. |
| **۸** | **تطبیق موجودی کیف پول با تراکنش‌های ثبت‌شده** | **`BLOCKED`** (در لایهٔ شبکهٔ خارجی Sandbox) | **`PASS` (تأییدشده در Chromium 153 و SQLite)** | برای کاربر `108`: موجودی `25,000,000` ریال (`2,500,000` تومان)؛ برای کاربر `109`: شارژ `+30,000,000` ریال منهای رزرو تک‌جلسه‌ای `-1,800,000` ریال و رزرو ۴ جلسه‌ای `-19,760,000` ریال = ماندهٔ دقیق `8,440,000` ریال (`844,000` تومان). |

---

## ۳. جمع‌بندی وضعیت درگاه پرداخت

- **تست رسمی درگاه Sandbox زرین‌پال (`https://sandbox.zarinpal.com`):** **`BLOCKED`** (به علت نبود کلید رسمی آزمایشی و مسدود بودن اتصال HTTPS خروجی به `sandbox.zarinpal.com` در فایروال کانتینر).
- **تست درگاه آزمایشی محلی (`local_dev`) در مرورگر واقعی Chromium 153 و یکپارچگی دفتر کل دوبل در SQLite:** **`PASS`**.
- **تست رفتار ایمن Fail-Closed در حالت Production یا قطع شبکهٔ زرین‌پال (`503 SERVICE_NOT_CONFIGURED`):** **`PASS`**.
