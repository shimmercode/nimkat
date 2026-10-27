# گزارش جامع تست‌ها و اثبات رفع باگ‌ها (TEST_REPORT)

این گزارش نتایج واقعی اجرای تست‌ها، اثبات ۱۰ مرحله‌ای شارژ کیف پول (`0.4`)، اثبات ۸ مرحله‌ای رزرو کلاس (`0.5`)، و وضعیت دسته‌بندی‌شدهٔ هر بخش را مستند می‌کند.

---

## ۱. خلاصهٔ نتایج اجرای تست‌ها و بیلد تولید

| مجموعه تست / بررسی | دستور اجرا | تعداد کل | موفق | ناموفق | وضعیت |
|---|---|---:|---:|---:|---|
| تست‌های یکپارچه و امنیتی بک‌اند (شامل تست‌های جدید کیف پول، رزرو، جستجو و پروموشن) | `cd backend && npm test` | `121` | `121` | `0` | `FIXED AND VERIFIED` |
| تست‌های واحد و کامپوننت‌های فرانت‌اند (Vitest) | `cd frontend && npx vitest run` | `39` (`8` فایل) | `39` | `0` | `FIXED AND VERIFIED` |
| بیلد کامل تولید Next.js + TypeScript | `cd frontend && npm run build` | `58` مسیر | `58` | `0` | `FIXED AND VERIFIED` |
| ممیزی امنیتی وابستگی‌ها | `npm audit` (backend & frontend) | `201` پکیج | `0` آسیب‌پذیری | `0` | `FIXED AND VERIFIED` |
| اجرای مرورگر واقعی Playwright (Chromium Binary) | `npx playwright test` | — | — | — | `BLOCKED` (باینری Chromium در کانتینر نصب نیست) |

---

## ۲. اثبات ۱۰ مرحله‌ای رفع باگ شارژ کیف پول (`0.4` — تأییدشده با Mock درگاه محلی)

> **شفاف‌سازی مهم:** از آنجا که کلید تجاری واقعی درگاه خارجی (زرین‌پال Production) در این محیط قرار ندارد، اثبات زیر با درگاه کنترل‌شدهٔ محلی (`local_dev` / Mock Gateway) و دیتابیس ایزولهٔ واقعی SQLite اجرا شده و به‌عنوان **«تأییدشده با Mock»** گزارش می‌شود.

1. **موجودی اولیهٔ کیف پول کاربر (`user_id = 108`):**
   - `GET /api/wallet` -> `balance: 0` تومان (`balanceRial: 0` ریال).
2. **ایجاد درخواست شارژ معتبر (`250,000` تومان = `2,500,000` ریال):**
   - `POST /api/wallet/charge` با `{"amount": 250000, "idempotencyKey": "proof-wallet-topup-250k"}`
   - پاسخ `200 OK`:
     - `payment.id`: `6c4c1f41-b8af-4675-a841-8174531eb34d`
     - `payment.status`: `pending`
     - `payment.redirectUrl`: `/payment/result?id=6c4c1f41-b8af-4675-a841-8174531eb34d&devGateway=1&authority=LOCALDEV_6c4c1f41-b8af-4675-a841-8174531eb34d`
3. **اجرای نتیجهٔ درگاه Mock (`Status=OK`):**
   - ارسال callback به `/api/payments/callback/6c4c1f41-b8af-4675-a841-8174531eb34d?Authority=LOCALDEV_6c4c1f41-b8af-4675-a841-8174531eb34d&Status=OK&format=json`.
4. **Verify سمت سرور:**
   - بررسی تطابق `Authority` و وضعیت در `providers.verifyPaymentRequest` -> `verified: true`, `refId: "dev:local_dev:6c4c1f41-b8af-4675-a841-8174531eb34d"`.
5. **ثبت وضعیت نهایی پرداخت و رکوردهای لجر دوطرفه در SQLite:**
   - `payment_intents.status`: `paid`
   - `ledger_journals`:
     - `id`: `689c139c-d08c-4f36-9732-706ce69821c3`
     - `reference`: `payment:6c4c1f41-b8af-4675-a841-8174531eb34d`
     - `kind`: `wallet`
   - `ledger_entries` (تراز صفر ریالی):
     - `account: "gateway:clearing"`, `amount_rial: -2500000`
     - `account: "user:108"`, `amount_rial: +2500000`
6. **موجودی کیف پول بعد از پرداخت:**
   - `GET /api/wallet` -> `balance: 250000` تومان (`balanceRial: 2500000` ریال).
7. **مقایسهٔ موجودی قبل و بعد:**
   - `0` تومان -> `250,000` تومان (`Delta = +250,000` تومان دقیقاً برابر مبلغ شارژ).
8. **بررسی نمایش تراکنش در تاریخچهٔ کیف پول (`/api/finance/mine`):**
   - تراکنش در `wallet.transactions` و `payments` با وضعیت `paid` و مبلغ `250000` ثبت و بازگردانده شده است.
9. **تست تکرار همان Callback (Idempotency):**
   - ارسال مجدد همان درخواست callback -> `HTTP 200`, `idempotent: true`, `walletBalance: 250000` (بدون دوبارشارژ شدن).
10. **تست سناریوی پرداخت ناموفق/لغوشده (`Status=NOK`):**
    - ایجاد شارژ `100,000` تومانی (`id: 099267bc-b71d-46ac-8bcc-47fca4e0ba80`) و ارسال `Status=NOK` -> وضعیت پرداخت `cancelled` و موجودی کیف پول بدون تغییر روی `250,000` تومان باقی ماند.

---

## ۳. اثبات ۸ مرحله‌ای رفع باگ رزرو کلاس (`0.5`)

1. **بررسی کلاس فعال و جلسات معتبر:**
   - `GET /api/classes/1/schedule` -> `16` جلسهٔ زمان‌بندی‌شدهٔ فعال (`id: 1`, `starts_at: 1793203200000`, `ends_at: 1793208600000`).
   - برای هر ۷ استاد (`id = 1..7`)، `GET /api/teachers/:id` دارای `activeClasses.length > 0` و `GET /api/teachers/:id/availability` دارای جلسات واقعی قابل رزرو است.
2. **اجرای رزرو تک‌جلسه‌ای از `/classes/1`:**
   - `POST /api/bookings` با `{"classId": 1, "sessions": 1, "people": 1, "occurrenceIds": [1], "method": "wallet", "idempotencyKey": "proof-book-single-class1"}` -> `HTTP 200 OK`, `{"ok": true, "bookingId": 1, "status": "confirmed", "sessions": 1, "total": 180000}`.
3. **اجرای رزرو چندجلسه‌ای (`4` جلسه) از کلاس `6`:**
   - `POST /api/bookings` با `sessions: 4` و ۴ شناسهٔ جلسهٔ معتبر -> `HTTP 200 OK`, `status: "confirmed"`, `sessions: 4`.
4. **ثبت رکورد رزرو در دیتابیس و ارتباط با دانش‌آموز، مدرس، کلاس و زمان:**
   - جدول `bookings`: `{"id": 1, "user_id": 108, "class_id": 1, "sessions": 1, "total": 180000, "status": "confirmed"}`
   - جدول `booking_occurrences`: `[{"booking_id": 1, "occurrence_id": 1}]`
5. **نمایش رزرو در تقویم دانش‌آموز و تقویم استاد:**
   - `GET /api/calendar` برای دانش‌آموز و استاد هر دو شامل جلسهٔ رزروشده (`occurrence_id = 1`) است.
6. **جلوگیری از رزرو تکراری همان زمان و تداخل زمانی شاگرد:**
   - ارسال مجدد رزرو برای همان `occurrenceIds: [1]` با کلید جدید -> `HTTP 409 Conflict` (`{"error": "زمان با رزرو یا فاصلهٔ رفت‌وآمد شاگرد تداخل دارد."}`).
7. **جلوگیری از رزرو کلاس تکمیل‌ظرفیت (`classId = 2`):**
   - ارسال درخواست رزرو روی کلاس تکمیل‌ظرفیت -> `HTTP 409 Conflict`.
8. **پایداری وضعیت پس از بارگذاری مجدد:**
   - استعلام مجدد `/api/bookings`، `/api/calendar` و `/api/promotions/home` نشان می‌دهد رزرو پایدار است و `eligibleForFirstRegistration` برای کاربر از `true` به `false` تغییر یافته است.
