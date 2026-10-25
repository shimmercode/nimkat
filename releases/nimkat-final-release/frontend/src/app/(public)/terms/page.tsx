import Link from 'next/link';
import { seo } from '../../../server/seo';

export const metadata = seo(
  'قوانین و مقررات استفاده از نیمکت',
  'ضوابط برگزاری کلاس‌های آنلاین و حضوری، مقررات نیم‌چت، نیمکت کلاب و تعهدات شاگردان و اساتید.',
  '/terms'
);

export default function TermsPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">قوانین و مقررات</span>
        </div>

        <div className="card" style={{ padding: 32, borderRadius: 'var(--r-2xl)' }}>
          <span className="eyebrow">ضوابط سامانه</span>
          <h1 className="t-h2" style={{ marginTop: 10 }}>قوانین و مقررات نیمکت</h1>
          <div className="card-soft" style={{ marginTop: 14, padding: '12px 16px', fontSize: 13 }}>
            <b>وضعیت سند:</b> منطبق بر قوانین اجرایی پیاده‌سازی‌شده در هستهٔ سامانهٔ نیمکت (پیش‌نویس حقوقی جهت تصویب نهایی پیش از بهره‌برداری تجاری).
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 22, lineHeight: 2.1 }}>
            <section>
              <h2 className="t-h4">۱. رزرو جلسات و زمان‌بندی</h2>
              <p className="t-small t-muted">
                هر رزرو نیازمند انتخاب زمان‌های مشخص از تقویم منتشرشدهٔ مدرس تأییدشده است. در کلاس‌های حضوری، فاصلهٔ زمانی جابه‌جایی بین جلسات به‌صورت خودکار بررسی می‌شود تا تداخل زمانی ایجاد نشود.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۲. ورود به اتاق کلاس آنلاین و ثبت حضور</h2>
              <p className="t-small t-muted">
                لینک ورود امن به اتاق آنلاین از ۱۵ دقیقه قبل از شروع تا ۱۵ دقیقه پس از پایان جلسه برای اعضای دارای رزرو قطعی و مدرس جلسه فعال است. تأیید نهایی برگزاری جلسه و صدور امتیاز کلاب منوط به ثبت حضور واقعی است.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۳. ضوابط گفتگو در نیم‌چت</h2>
              <p className="t-small t-muted">
                گروه‌های کلاس برای هماهنگی آموزشی و رفع اشکال ایجاد می‌شوند و گفتگوهای خصوصی پس از پایان کلاس تا ۷۲ ساعت فعال می‌مانند. هرگونه پیام خارج از چارچوب آموزشی قابل گزارش به مدیر سامانه است.
              </p>
            </section>

            <section>
              <h2 className="t-h4">۴. قوانین نیمکت کلاب و کدهای تخفیف</h2>
              <p className="t-small t-muted">
                کدهای تخفیف دریافتی از نیمکت کلاب اختصاصیِ همان حساب کاربری بوده و برای یک رزرو معتبرند. در صورت لغو کامل رزرو پیش از شروع خدمت، کد تخفیف به حالت قابل استفاده بازمی‌گردد اما سکه‌ای خارج از ضوابط تولید نمی‌شود.
              </p>
            </section>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="/cancellation-policy" className="btn btn-outline btn-sm">
              مشاهده شرایط لغو و بازگشت وجه
            </Link>
            <Link href="/privacy" className="btn btn-outline btn-sm">
              مشاهده سیاست حریم خصوصی
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
