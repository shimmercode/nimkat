import Link from 'next/link';
import { seo } from '../../../server/seo';

export const metadata = seo(
  'حریم خصوصی و امنیت داده‌ها',
  'سیاست حریم خصوصی، نگهداری داده‌ها، مجوزهای دسترسی والدین و امنیت فایل‌ها در پلتفرم آموزشی نیمکت.',
  '/privacy'
);

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">حریم خصوصی</span>
        </div>

        <div className="card" style={{ padding: 32, borderRadius: 'var(--r-2xl)' }}>
          <span className="eyebrow">امنیت و محرمانگی</span>
          <h1 className="t-h2" style={{ marginTop: 10 }}>سیاست حریم خصوصی نیمکت</h1>
          <div className="card-soft" style={{ marginTop: 14, padding: '12px 16px', fontSize: 13 }}>
            <b>وضعیت سند:</b> منطبق بر سازوکارهای فنی پیاده‌سازی‌شده در سامانهٔ نیمکت (پیش‌نویس حقوقی جهت تصویب نهایی پیش از بهره‌برداری تجاری).
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 22, lineHeight: 2.1 }}>
            <section>
              <h2 className="t-h4">۱. احراز هویت و نشست‌های امن</h2>
              <p className="t-small t-muted">
                ورود به نیمکت با رمز یک‌بارمصرف (OTP) هش‌شده و کوکی‌های <code>HttpOnly</code> انجام می‌شود. کدهای تأیید یا توکن‌های نشست هرگز به‌صورت متن ساده در پایگاه داده یا حافظهٔ مرورگر ذخیره نمی‌شوند و شما در هر لحظه امکان خروج از همهٔ نشست‌های فعال خود را دارید.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۲. تست فنی دوربین و میکروفون</h2>
              <p className="t-small t-muted">
                ابزار «تست فنی» فقط با اجازهٔ مستقیم مرورگر شما در دسترس قرار گرفتن میکروفون و دوربین را بررسی کرده و بلافاصله جریان رسانه را آزاد می‌کند؛ هیچ صدا یا تصویری در این مرحله ضبط یا به سرور ارسال نمی‌شود.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۳. دسترسی محدود و مبتنی بر رضایت والدین</h2>
              <p className="t-small t-muted">
                اتصال حساب والد به شاگرد فقط با صدور کد دعوت تک‌بارمصرف و تعیین دقیق دامنهٔ مجوز (گزارش تحصیلی، برنامهٔ جلسات، فایل‌ها یا امور مالی) انجام می‌شود. هر یک از طرفین می‌تواند در هر زمان این دسترسی را فوراً لغو کند.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۴. حریم خصوصی در نیمکت کلاب و لیگ</h2>
              <p className="t-small t-muted">
                شرکت در جدول رتبه‌بندی «لیگ نیمکت» کاملاً اختیاری (Opt-in) است و فقط نام نمایشی انتخابی و امتیاز فعالیت اعضا نمایش داده می‌شود؛ شماره موبایل یا بازخوردهای منفی نظرسنجی‌ها هرگز به صورت عمومی منتشر نمی‌شوند.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۵. فایل‌ها و منابع آموزشی</h2>
              <p className="t-small t-muted">
                جزوه‌ها و فایل‌های جلسات عمومی نیستند، در حافظهٔ کش مرورگر (PWA) ذخیره نمی‌شوند و در هر بار دانلود، عضویت قطعی شاگرد یا مجوز والد دوباره توسط سرور بررسی می‌شود.
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
