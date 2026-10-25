import Link from 'next/link';
import { seo } from '../../../server/seo';
import { IconCheck, IconUsers, IconChart, IconWallet, IconArrowLeft } from '../../../components/icons.jsx';

export const metadata = seo(
  'راهنمای والدین در نیمکت',
  'نحوه مشاهده گزارش پیشرفت جلسه به جلسه، مدیریت مالی، دسترسی امن به فایل‌ها و ارتباط با اساتید برای والدین.',
  '/parent-guide'
);

export default function ParentGuidePage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">راهنمای والدین</span>
        </div>

        <div className="card" style={{ padding: 32, borderRadius: 'var(--r-2xl)' }}>
          <span className="eyebrow">همراهی آگاهانه خانواده</span>
          <h1 className="t-h2" style={{ marginTop: 10 }}>راهنمای والدین در نیمکت</h1>
          <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
            نیمکت به والدین امکان می‌دهد بدون نیاز به تماس‌های پراکنده، روند حضور، گزارش‌های هشت‌شاخصی پیشرفت، فایل‌های آموزشی و امور مالی فرزندشان را با مجوز شفاف دنبال کنند.
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 24 }}>
            <div className="card-soft" style={{ padding: 20 }}>
              <IconUsers size={24} style={{ color: 'var(--primary)' }} />
              <h2 className="t-h4" style={{ marginTop: 10 }}>۱. اتصال امن به حساب فرزند</h2>
              <p className="t-small t-muted" style={{ marginTop: 6, lineHeight: 2 }}>
                فرزند شما از بخش «دسترسی والدین» در پنل خود کد دعوت یک‌بارمصرف با دامنهٔ مجوز مشخص صادر می‌کند و شما در پنل والدین آن را فعال می‌کنید.
              </p>
            </div>

            <div className="card-soft" style={{ padding: 20 }}>
              <IconChart size={24} style={{ color: 'var(--accent-800)' }} />
              <h2 className="t-h4" style={{ marginTop: 10 }}>۲. کارنامهٔ هشت‌شاخصی هر جلسه</h2>
              <p className="t-small t-muted" style={{ marginTop: 6, lineHeight: 2 }}>
                پس از هر جلسهٔ تأییدشده، استاد شاخص‌های آمادگی، وقت‌شناسی، تعامل، تمرکز، تکلیف، درک مفاهیم، حل مسئله و استمرار را ثبت می‌کند.
              </p>
            </div>

            <div className="card-soft" style={{ padding: 20 }}>
              <IconWallet size={24} style={{ color: 'var(--primary)' }} />
              <h2 className="t-h4" style={{ marginTop: 10 }}>۳. مدیریت مالی و رزرو دوستانه</h2>
              <p className="t-small t-muted" style={{ marginTop: 6, lineHeight: 2 }}>
                شارژ کیف پول، مشاهدهٔ وضعیت رزروها، شرکت در رزروهای دوستانه و ثبت درخواست بازپرداخت طبق ضوابط ۲۴ ساعته از پنل والدین در دسترس است.
              </p>
            </div>
          </div>

          <ul className="check-list" style={{ marginTop: 24 }}>
            <li>
              <IconCheck size={18} /> تفکیک کامل حریم خصوصی هر فرزند در خانواده‌های دارای چند دانش‌آموز
            </li>
            <li>
              <IconCheck size={18} /> دسترسی به جزوه‌ها و منابع بررسی‌شدهٔ جلسات در صورت اعطای مجوز فایل‌ها
            </li>
            <li>
              <IconCheck size={18} /> امکان دریافت مشاورهٔ تحصیلی رایگان پیش از انتخاب استاد
            </li>
          </ul>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary">
              ورود به حساب والدین <IconArrowLeft size={17} />
            </Link>
            <Link href="/classes" className="btn btn-outline">
              مشاهده اساتید و کلاس‌ها
            </Link>
            <Link href="/contact" className="btn btn-outline">
              درخواست مشاوره تلفنی
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
