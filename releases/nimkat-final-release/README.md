# نیمکت (Nimkat)

پلتفرم فارسی رزرو کلاس، پروفایل استاد، پنل شاگرد و استاد، نیم‌چت و نیمکت کلاب.
طراحی: RTL، یکان‌بخ FaNum خودمیزبان، توکن‌های برند مطابق PDFهای تأییدشده.

## اجرای محلی

Node.js **22** توصیه می‌شود (حداقل 20.9 برای Next.js).

```bash
# ترمینال اول
cd backend
npm ci
npm start                 # API :8000، SQLite با seed خودکار

# ترمینال دوم
cd frontend
npm ci
npm run dev               # Next.js :5173
```

یا `bash run-local.sh` / `run-local.bat`.
فرانت‌اند روی `0.0.0.0` اجرا می‌شود و `/api` را از طریق rewrite به بک‌اند می‌فرستد؛
مرورگر کاربر هرگز مستقیم به localhost بک‌اند درخواست نمی‌دهد.

```bash
# بیلد و اجرای تولیدی (بک‌اند باید در حال اجرا باشد)
cd frontend
npm run build
npm start
```

تنظیمات: `frontend/.env.example`؛ `API_INTERNAL_URL` فقط سمت سرور و `SITE_URL`
برای آدرس اصلی sitemap. استقرار استاتیک `dist` دیگر معتبر نیست؛ Next.js به سرویس Node نیاز دارد.

## ورود آزمایشی

OTP توسعه در صفحهٔ ورود نمایش داده می‌شود؛ کد در لاگ چاپ نمی‌شود و این سرویس هنوز پیامک واقعی نیست.
ورود با کوکی HttpOnly انجام می‌شود؛ کاربران نسخهٔ قدیمی باید دوباره وارد شوند.

| نقش | شماره | مسیر |
|---|---|---|
| مدیر | `09120000000` | `/admin/analytics` و `/editor/home` |
| شاگرد | `09120000001` | `/panel` |
| استاد | `09120000002` | `/teacher` |
| والدین | `09120000003` | `/parent` (پنل مستقل والدین با کنترل دسترسی اسکوپ‌محور) |

## ویرایشگر زنده

از انتخاب‌گر بالای ویرایشگر یا این آدرس‌ها استفاده کنید:

- `/editor/home`: بلوک‌های صفحه اصلی
- `/editor/classes`: جستجو و فیلتر کلاس‌ها
- `/editor/teacher-profile`: قالب عمومی پروفایل استاد
- `/editor/class-detail`: قالب عمومی جزئیات کلاس
- `/editor/club`: کلاب (در `/club` و پنل‌ها)
- `/editor/teacher-2` یا `/editor/class-5`: محتوای اختصاصی یک رکورد
- `/editor/my-page`: صفحه سفارشی؛ پس از انتشار در `/p/my-page`

چهار صفحهٔ کاربردی جدید به‌صورت widgetهای stateful عرضه شده‌اند، نه شکستن تمام
فیلترها و کارت‌های رزرو به قطعات مستقل. متن‌ها در inspector قابل تغییرند و بلوک‌های
عمومی را می‌توان قبل/بعد آن‌ها افزود یا جابه‌جا کرد. قیمت، ظرفیت، شناسه و موجودی از
دادهٔ محتوا جدا و در اختیار API هستند. پیش‌نمایش widgetها inert است تا خرید یا
دریافت جایزهٔ ناخواسته انجام نشود.

ذخیره = پیش‌نویس؛ انتشار = ثبت snapshot مستقل برای سایت زنده. ذخیره یا بازگردانی
نسخهٔ قدیمی، نسخهٔ منتشرشده را تغییر نمی‌دهد تا دوباره «انتشار» زده شود.
Undo/Redo، breakpointها، نسخه‌ها و قالب‌ها برای همهٔ این اسکیماها مشترک‌اند.

## ساختار

```text
frontend/src/
  app/                    # Next App Router؛ entryها و layoutهای TypeScript
    (public)/             # خانه، classes، teachers، club، p — SSR
    (auth)/               # login
    (student)/panel/      # پنل شاگرد
    (teacher)/teacher/    # پنل استاد
    (admin)/editor/       # ویرایشگر با کنترل نقش
  views/                  # کامپوننت‌های قبلی JSX؛ مهاجرت تدریجی به TS
  routing/navigation.tsx  # adapter کوچک Next؛ بدون react-router یا SPA ثانویه
  blocks/                 # registry، اسکیماها و widgetهای کاربردی
  editor/                 # inspector، تاریخچه و رابط ویرایشگر
  render/                 # رندر مشترک، انتخاب قالب عمومی/اختصاصی
  server/                 # دریافت عمومیِ بدون credential برای SSR
  types/                  # قرارداد تایپ‌شده PageSchema
backend/src/
  modules/content/        # صفحات، انتشار، نسخه‌ها، قالب‌ها و اعتبارسنجی اسکیما
  server.js               # Express و سایر دامنه‌ها (هنوز به‌طور کامل ماژولار نشده)
  db.js                   # SQLite، seed و migration افزایشی انتشار مستقل
```

UI/UX Pro Max در `.claude/skills` نصب است. تصمیم‌های برند و قواعد منتخب در
`design-system/nimkat/MASTER.md` ثبت شده‌اند؛ توصیه‌های متعارض با PDF، فونت و برند
اعمال نشده‌اند.

## تست

```bash
cd backend && npm test
cd ../frontend
npm test
npm run build
npm run typecheck
npx playwright install chromium
# API و فرانت‌اند باید روی پورت‌های بالا روشن باشند؛ فقط DB آزمایشی!
npm run test:e2e
```

تست مرورگر draftهای آزمایشی و snapshot می‌سازد؛ برای دیتابیس تولید اجرا نشود.
`CHROMIUM_EXECUTABLE_PATH` برای استفاده از Chromium نصب‌شده پشتیبانی می‌شود.

## مرز وضعیت فعلی (نسخهٔ ۱.۷.۰)

مسیریابی و زیرساخت فرانت‌اند بر پایهٔ Next.js 16 (App Router + SSR) و TypeScript/React 19 است. بک‌اند بر پایهٔ Express 5 و SQLite (در حالت WAL با تراکنش‌های اتمیک) پیاده‌سازی شده است.
امکانات پیاده‌سازی‌شده و فعال در نسخهٔ ۱.۷.۰:
- احراز هویت OTP با هش HMAC-SHA256، نشست HttpOnly، چرخش توکن Refresh، ابطال سمت سرور، محافظت CSRF/Origin و محدودسازی نرخ درخواست.
- دفتر کل مالی دوطرفهٔ Append-Only (`ledger_journals` و `ledger_entries`) با تریگرهای عدم تغییر/حذف در SQLite، شارژ کیف پول، رزرو تک‌جلسه‌ای و چندجلسه‌ای، بازپرداخت و آداپتور زرین‌پال نسخه ۴ و پیامک کاوه‌نگار (با ذخیرهٔ رمزنگاری‌شدهٔ AES-256-GCM در `provider_settings`).
- پنل مستقل والدین (`/parent`) با دعوت‌نامهٔ ۳۰ دقیقه‌ای و مجوزهای تفکیک‌شده (`schedule`, `reports`, `files`).
- نیمکت کلاب (۵ سطح، ۱۹ قانون امتیازدهی، ۱۳ جایزه)، نیم‌چت، پشتیبانی هوشمند و انسانی، رویدادهای بلادرنگ SSE (`/api/events`) و اسکن ClamAV برای فایل‌های آموزشی.
برای استقرار تولیدی، متغیرهای `NIMKAT_SECRET` (حداقل ۳۲ کاراکتر) و `NIMKAT_SETTINGS_KEY` (۶۴ کاراکتر هگزادسیمال) الزامی هستند (نگاه کنید به `.env.example` و `docker-compose.yml`).
