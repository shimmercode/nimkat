import { useState } from 'react';
import { IconHeadset, IconPlus, IconMinus } from './icons.jsx';

const ITEMS = [
  {
    q: 'اگر از استاد راضی نبودم چه می‌شود؟',
    a: 'تا پایان جلسهٔ اول می‌توانید درخواست تغییر استاد بدهید. مبلغ جلسات باقی‌مانده بدون کسر به کیف پول شما برمی‌گردد یا برای استاد جدید استفاده می‌شود.',
  },
  {
    q: 'کلاس‌های آنلاین روی چه بستری برگزار می‌شوند؟',
    a: 'همهٔ کلاس‌های آنلاین روی بستر کلاس آنلاین خود نیمکت برگزار می‌شود؛ با تختهٔ مشترک، ضبط جلسه و بخش پرسش و پاسخ. لینک ورود قبل از هر جلسه در پنل و پیامک ارسال می‌شود.',
  },
  {
    q: 'رزرو دوستانه چطور محاسبه می‌شود؟',
    a: 'در رزرو دوستانه تا ۵ نفر هزینهٔ یک جلسهٔ گروهی را با هم تقسیم می‌کنید؛ برای هر دوست پیامک دعوت می‌رود و پس از پیوستن، صندلی او در نقشهٔ کلاس رزرو می‌شود.',
  },
  {
    q: 'برای کلاس حضوری در منزل، استاد تا کجا می‌آید؟',
    a: 'در ثبت‌نام، محدودهٔ زمانی و آدرس خود را وارد می‌کنید؛ فقط استادانی که محدودهٔ آن‌ها با شما هم‌پوشانی دارد پیشنهاد می‌شوند. هزینهٔ ایاب و ذهاب در قیمت جلسه دیده شده است.',
  },
  {
    q: 'لغو کلاس تا چه زمانی رایگان است؟',
    a: 'تا ۲۴ ساعت قبل از شروع جلسه، لغو یا جابه‌جایی کاملاً رایگان است و مبلغ به کیف پول برمی‌گردد. کمتر از ۲۴ ساعت، هزینهٔ یک جلسه کسر می‌شود.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <div className="faq-intro">
          <span className="eyebrow plain">سوالات پرتکرار</span>
          <h2 className="section-title">قبل از رزرو بدانید</h2>
          <p>
            جواب سوالتان را پیدا نکردید؟ کارشناس‌های ما از ۸ صبح تا ۸ شب
            پاسخگو هستند.
          </p>

          <div className="support-card">
            <IconHeadset size={24} />
            <span>
              <b>پشتیبانی تلفنی</b>
              <span>۰۲۱-۹۱۰۰۴۵۶۰</span>
            </span>
            <span className="chat-badge">چت آنلاین</span>
          </div>
        </div>

        <div className="accordion">
          {ITEMS.map((item, i) => (
            <div className={`acc-item${open === i ? ' open' : ''}`} key={item.q}>
              <button
                className="acc-head"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span className="acc-q">{item.q}</span>
                <span className="acc-icon">
                  {open === i ? <IconMinus size={16} /> : <IconPlus size={16} />}
                </span>
              </button>
              {open === i && <div className="acc-body">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
