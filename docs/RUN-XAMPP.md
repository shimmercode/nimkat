# اجرای محلی در ویندوز و XAMPP

این نسخه Next.js + Express + SQLite است، نه PHP/Laravel یا MySQL. XAMPP به‌تنهایی برنامه را اجرا نمی‌کند؛ Apache فقط می‌تواند reverse proxy باشد. MySQL و phpMyAdmin لازم نیستند. این راهنما اجرای محلی توسعه/ارزیابی است، نه استقرار امن تولید.

## ۱. پیش‌نیازها

- Windows 10/11، Node.js نسخهٔ 22 LTS به‌همراه npm (ترجیحاً نسخهٔ 22.22 یا جدیدتر از شاخهٔ 22).
- بررسی در CMD: `node -v` و `npm -v`.
- اگر نصب better-sqlite3 خطای node-gyp داد: Python 3 و Visual Studio Build Tools با Desktop development with C++ و Windows SDK نصب کنید. اگر sharp خطا داد، optional dependencyها را حذف نکنید؛ از `npm ci` عادی استفاده کنید.
- فایل ZIP ریلیز را در پوشه‌ای مثل `C:\nimkat` استخراج کنید؛ پوشه‌ای که backend و frontend داخل آن هستند ریشهٔ پروژه است. قرار دادن در htdocs الزامی نیست.
- در صورت قرار دادن زیر htdocs، آن پوشه را مستقیم در وب منتشر نکنید؛ فایل‌های دیتابیس/کد/کلید نباید با Apache قابل دانلود شوند.

## ۲. روش ساده؛ بدون نیاز به Apache

CMD اول:

```bat
cd /d C:\nimkat\backend
set NODE_ENV=development
set COOKIE_SECURE=false
set COOKIE_SAME_SITE=lax
set COOKIE_PARTITIONED=false
set APP_ORIGINS=http://localhost:5173
npm ci
npm start
```

CMD دوم:

```bat
cd /d C:\nimkat\frontend
npm ci
npm run dev
```

سایت: http://localhost:5173 — سلامت API: http://localhost:5173/api/health

دو پنجره باید باز بمانند. خاموش کردن با Ctrl+C. فایل SQLite و کلید محلی تنظیمات در backend/data ایجاد می‌شوند. دیتابیس، کلید و node_modules همراه سورس ریلیز نیستند. دادهٔ اولیهٔ ایجادشده نمونه است، نه اطلاعات تجاری واقعی.

برای اجرای build به‌جای dev در ترمینال فرانت‌اند:

```bat
npm run build
npm start
```

بک‌اند همچنان با تنظیمات توسعهٔ بالا اجرا می‌شود؛ این کار به‌تنهایی کل سیستم را production-ready نمی‌کند. مقادیر API_INTERNAL_URL هنگام build باید به بک‌اند درست اشاره کنند؛ پیش‌فرض http://127.0.0.1:8000 است. برای localhost نیازی به تغییر آن نیست.

## ۳. اجرای سایت از آدرس Apache در XAMPP

### فایل hosts

Notepad را با Run as administrator باز و به این فایل اضافه کنید:

`C:\Windows\System32\drivers\etc\hosts`

```text
127.0.0.1 nimkat.local
```

### ماژول‌ها

در `C:\xampp\apache\conf\httpd.conf` مطمئن شوید خطوط زیر فعال‌اند؛ اگر موجودند، فقط # ابتدای آن‌ها را بردارید و خطوط تکراری نسازید:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
Include conf/extra/httpd-vhosts.conf
```

در `C:\xampp\apache\conf\extra\httpd-vhosts.conf` اضافه کنید:

```apache
<VirtualHost *:80>
    ServerName nimkat.local
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5173/
    ProxyPassReverse / http://127.0.0.1:5173/
</VirtualHost>
```

این VirtualHost کل سایت را proxy می‌کند؛ DocumentRoot را روی سورس backend یا data نگذارید. اگر XAMPP پورت دیگری مانند 8080 دارد، Listen و VirtualHost و آدرس‌های این راهنما باید متناسب تغییر کنند. تداخل پورت 80 با IIS/برنامهٔ دیگر را بررسی کنید.

برای این روش، اجرای frontend به‌صورت `npm run build` و سپس `npm start` ساده‌تر است؛ proxy websocket مربوط به HMR لازم نمی‌شود.

### اجرای دو سرویس Node

بک‌اند، CMD اول:

```bat
cd /d C:\nimkat\backend
set NODE_ENV=development
set COOKIE_SECURE=false
set COOKIE_SAME_SITE=lax
set COOKIE_PARTITIONED=false
set APP_ORIGINS=http://nimkat.local
npm ci
npm start
```

فرانت‌اند، CMD دوم:

```bat
cd /d C:\nimkat\frontend
npm ci
npm run build
npm start
```

Apache را از کنترل‌پنل XAMPP Restart کنید. سایت: http://nimkat.local و سلامت API: http://nimkat.local/api/health

تمام استفادهٔ مرورگر را با همان میزبان انجام دهید؛ بین localhost و nimkat.local جابه‌جا نشوید، چون کوکی‌ها میزبان‌محور هستند. متغیرهای COOKIE_SECURE=true / SameSite=none / Partitioned مربوط به پیش‌نمایش HTTPS را برای این HTTP محلی کپی نکنید. این تنظیمات HTTP مخصوص لوکال‌اند و برای تولید مجاز نیستند.

## ۴. ورود و ویرایشگر

- در حالت توسعه و پیامک غیرفعال، کد آزمایشی در جریان ورود قابل دریافت است؛ این پیامک واقعی نیست.
- حساب seed مدیریت با شمارهٔ `09120000000` شناخته می‌شود؛ این دادهٔ توسعه است، نه مجوز استفادهٔ تجاری یا رمز ثابت تولید. با OTP همان محیط وارد شوید.
- ویرایشگر مدیر: `/editor/home`؛ تنظیمات: `/admin/integrations`.
- درگاه، فروشگاه، گروه دوستانه و برخی خدمات پیش‌فرض غیرفعال‌اند. فقط برای دیدن صفحه نیازی به کلید تجاری نیست؛ انجام عملیات واقعی نیازمند پیکربندی و آزمون سرویس است.
- `.env` به‌صورت خودکار توسط Express این پروژه بارگذاری نمی‌شود. متغیرهای بک‌اند را در محیط CMD/سرویس تنظیم کنید؛ صرف ساختن فایل .env کافی نیست.

## ۵. خطاهای رایج

- **502 از Apache:** Node frontend روی 5173 اجرا نیست یا آدرس proxy اشتباه است.
- **خطای API/503:** بک‌اند 8000 یا سرویس خارجی/اسکنر موردنیاز فعال نیست.
- **ورود حفظ نمی‌شود:** میزبان و APP_ORIGINS، HTTP/HTTPS و تنظیمات کوکی را بررسی کنید. تست را در زبانهٔ مستقل باز کنید.
- **EADDRINUSE:** یکی از پورت‌های 8000 یا 5173 توسط اجرای قبلی اشغال است.
- **RSS غیرفعال:** بدون دامنهٔ canonical معتبر HTTPS، غیرفعال بودن آن در محیط عادی محلی قابل انتظار است؛ دامنهٔ واقعی را جعل نکنید.
- **تصاویر یا فونت‌های ناقص:** بخش‌هایی از محتوای نمونه/منابع عمومی هنوز نیازمند ممیزی و تکمیل‌اند؛ ریلیز پیش‌انتشار تأیید نهایی محتوا نیست.

## محدودیت

اجرای این راهنما در محیط Linux پروژه ساخته و تست شده است، اما اجرای همین بسته روی Windows/XAMPP در این جلسه انجام نشده است. راهنمای Apache/ویندوز دستور استقرار پیشنهادی مطابق معماری موجود است، نه ادعای پذیرش عملی روی دستگاه شما. وضعیت باقی‌مانده در docs/technical/OPERATIONS-STATUS.md و EDITOR-STATUS.md ثبت شده است.
