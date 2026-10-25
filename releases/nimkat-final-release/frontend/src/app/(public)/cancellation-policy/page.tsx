import Link from 'next/link';
import { seo } from '../../../server/seo';

export const metadata = seo(
  'شرایط لغو کلاس و بازگشت وجه',
  'ضوابط لغو جلسات، بازپرداخت به کیف پول، رزروهای دوستانه و تغییر زمان جلسات در نیمکت.',
  '/cancellation-policy'
);

export default function CancellationPolicyPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">شرایط لغو و بازگشت وجه</span>
        </div>

        <div className="card" style={{ padding: 32, borderRadius: 'var(--r-2xl)' }}>
          <span className="eyebrow">مقررات مالی و برنامه</span>
          <h1 className="t-h2" style={{ marginTop: 10 }}>شرایط لغو کلاس و بازگشت وجه</h1>
          <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
            در نیمکت تمامی تراکنش‌های رزرو و بازپرداخت در دفتر کل مالی تغییرناپذیر (Append-only Ledger) ثبت می‌شوند.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22, lineHeight: 2.1 }}>
            <div className="card-soft" style={{ padding: 18 }}>
              <b style={{ fontSize: 15, color: 'var(--primary)' }}>۱. لغو تا ۲۴ ساعت قبل از شروع جلسه</b>
              <p className="t-small t-muted" style={{ marginTop: 6 }}>
                لغو جلسه تا ۲۴ ساعت پیش از زمان شروع بدون کسر جریمه انجام می‌شود و مبلغ پرداخت‌شده پس از ثبت و تأیید درخواست بازپرداخت، به کیف پول واقعی شما در نیمکت واریز می‌گردد.
              </p>
            </div>

            <div className="card-soft" style={{ padding: 18 }}>
              <b style={{ fontSize: 15, color: 'var(--accent-800)' }}>۲. لغو کمتر از ۲۴ ساعت مانده به جلسه</b>
              <p className="t-small t-muted" style={{ marginTop: 6 }}>
                در صورت درخواست لغو در فاصلهٔ کمتر از ۲۴ ساعت تا شروع جلسه، مطابق قوانین کلاس ۵۰٪ مبلغ همان جلسه کسر می‌شود.
              </p>
            </div>

            <div className="card-soft" style={{ padding: 18 }}>
              <b style={{ fontSize: 15 }}>۳. لغو یا تغییر زمان از سوی استاد</b>
              <p className="t-small t-muted" style={{ marginTop: 6 }}>
                پیشنهاد تغییر زمان جلسه توسط استاد برای همهٔ اعضای کلاس ارسال می‌شود و تا زمان پذیرش همگی، زمان قبلی معتبر است. در صورت لغو جلسه توسط استاد، جلسهٔ جایگزین یا بازپرداخت کامل مبلغ به کیف پول انجام می‌شود.
              </p>
            </div>

            <div className="card-soft" style={{ padding: 18 }}>
              <b style={{ fontSize: 15 }}>۴. رزروهای دوستانه منقضی‌شده</b>
              <p className="t-small t-muted" style={{ marginTop: 6 }}>
                در رزرو دوستانه، اگر همهٔ اعضای گروه تا پایان مهلت تعیین‌شده سهم خود را پرداخت نکنند، گروه منقضی شده و مبالغ پرداختی اعضا به‌صورت خودکار و دقیقاً یک‌بار به کیف پول هر عضو بازگردانده می‌شود.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="/panel/finance" className="btn btn-primary btn-sm">
              ثبت و پیگیری بازپرداخت در پنل مالی
            </Link>
            <Link href="/contact" className="btn btn-outline btn-sm">
              ارتباط با پشتیبانی مالی
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
