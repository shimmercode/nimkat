'use client';
import { useState } from 'react';
import Link from 'next/link';
import { IconHeadset, IconArrowLeft } from '../../../components/icons.jsx';

const FAQ_ITEMS = [
  {
    cat: 'رزرو و اساتید',
    q: 'اگر از استاد راضی نبودم چه می‌شود؟',
    a: 'تا پایان جلسه‌ی اول می‌توانید درخواست تغییر استاد بدهید. مبلغ جلسات باقی‌مانده بدون کسر به کیف پول شما برمی‌گردد یا برای استاد جدید استفاده می‌شود.',
  },
  {
    cat: 'رزرو و اساتید',
    q: 'کلاس‌های آنلاین روی چه بستری برگزار می‌شوند؟',
    a: 'کلاس‌های آنلاین روی اسکای‌روم، فنوتک یا گوگل‌میت برگزار می‌شوند. برای هر کلاس، بستر برگزاری در صفحه‌ی کلاس مشخص است و قبل از جلسه تست فنی رایگان میکروفون، دوربین و شبکه در دسترس شماست.',
  },
  {
    cat: 'مالی و تخفیف‌ها',
    q: 'رزرو دوستانه چطور محاسبه می‌شود؟',
    a: 'در رزرو دوستانه، گروه ۲ تا ۵ نفره ساخته می‌شود و هر عضو سهم مستقل خود را با تخفیف پلکانی و تخفیف دوستانه ۲۰٪ پرداخت می‌کند. پس از تکمیل پرداخت همهٔ اعضا در مهلت مقرر، رزرو نهایی می‌شود.',
  },
  {
    cat: 'مالی و تخفیف‌ها',
    q: 'لغو کلاس تا چه زمانی رایگان است؟',
    a: 'لغو تا ۲۴ ساعت قبل از شروع جلسه رایگان است و مبلغ به کیف پول واقعی شما در نیمکت برمی‌گردد. لغو کمتر از ۲۴ ساعت مشمول کسر ۵۰٪ مبلغ همان جلسه است.',
  },
  {
    cat: 'نیمکت کلاب',
    q: 'تفاوت سکه و امتیاز در نیمکت کلاب چیست؟',
    a: 'سکه واحد قابل مصرف برای دریافت جوایز و کدهای تخفیف از فروشگاه کلاب است؛ اما امتیاز سطح (در ۵ سطح برنزی، نقره‌ای، طلایی، پلاتینیوم و سفیر نیمکت) غیرقابل مصرف بوده و با خرج کردن سکه کاهش پیدا نمی‌کند.',
  },
  {
    cat: 'والدین و امنیت',
    q: 'دسترسی والدین به اطلاعات فرزند چگونه است؟',
    a: 'دسترسی والدین فقط با دعوت‌نامهٔ رمزنگاری‌شده، تک‌بارمصرف و محدود به دامنه‌های انتخابی (مانند گزارش تحصیلی، تقویم یا فایل‌ها) فعال می‌شود و در هر لحظه توسط شاگرد یا والد قابل لغو است.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState(0);
  const [cat, setCat] = useState('همه');
  const [q, setQ] = useState('');

  const categories = ['همه', 'رزرو و اساتید', 'مالی و تخفیف‌ها', 'نیمکت کلاب', 'والدین و امنیت'];
  const filtered = FAQ_ITEMS.filter((it) => {
    if (cat !== 'همه' && it.cat !== cat) return false;
    if (q.trim() && !`${it.q} ${it.a}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <section className="section">
      <div className="container">
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">سؤالات متداول</span>
        </div>

        <header style={{ maxWidth: 720, marginBottom: 24 }}>
          <span className="eyebrow">راهنمای سریع</span>
          <h1 className="t-h2" style={{ marginTop: 10 }}>سؤالات متداول نیمکت</h1>
          <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
            پاسخ پرسش‌های رایج دربارهٔ نحوهٔ انتخاب استاد، رزرو خصوصی و دوستانه، شرایط لغو و بازپرداخت، نیمکت کلاب و دسترسی والدین.
          </p>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cat === c}
                className={`chip ${cat === c ? 'is-active' : 'outline'}`}
                onClick={() => setCat(c)}
                style={{ cursor: 'pointer' }}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="input"
            style={{ maxWidth: 320 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="جستجو در سؤالات متداول"
            placeholder="جستجو در سؤالات…"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((f, i) => (
            <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={f.q}>
              <div className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="pm">{open === i ? '−' : '+'}</span>
              </div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>

        <div className="card-soft" style={{ marginTop: 28, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconHeadset size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <b>پاسخ سؤال خود را پیدا نکردید؟</b>
              <div className="t-small t-muted">پشتیبانی نیمکت از شنبه تا پنجشنبه ساعت ۸ تا ۲۰ پاسخگوی شماست.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn btn-primary">
              تماس با ما و مشاوره <IconArrowLeft size={16} />
            </Link>
            <button type="button" className="btn btn-outline" onClick={() => window.dispatchEvent(new Event('nimkat:open-support'))}>
              گفتگوی آنلاین پشتیبانی
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
