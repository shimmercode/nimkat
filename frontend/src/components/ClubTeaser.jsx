'use client';
import { Link } from '../routing/navigation';
import { IconCrown, IconArrowLeft } from './icons.jsx';
import { faNum } from '../utils/fa.js';

export default function ClubTeaser({ content = {} }) {
  return (
    <section className="section-tight" id="club">
      <div className="container">
        <div className="club-band">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1.15fr', alignItems: 'center', gap: 40 }}>
            <div>
              <span className="eyebrow on-dark">{content.eyebrow || 'نیمکت کلاب'}</span>
              <h2 className="t-h2" style={{ marginTop: 16 }}>
                {content.title || 'هر کلاس، یک قدم تا نیمکت طلایی'}
              </h2>
              <p style={{ opacity: 0.85, lineHeight: 2.1, marginTop: 14, fontSize: 16 }}>
                {content.sub ||
                  'با شرکت در کلاس، نظر دادن و دعوت دوستان سکه جمع کن. سطح طلایی دو جلسه‌ی رایگان با برترین استاد پلتفرم دارد.'}
              </p>

              <div className="club-coins" style={{ marginTop: 26 }}>
                <div className="club-coin-box">
                  <div className="coins">{faNum(20)} سکه</div>
                  <div className="l">هر کلاس موفق</div>
                </div>
                <div className="club-coin-box">
                  <div className="coins">{faNum(50)} سکه</div>
                  <div className="l">دعوت از دوست</div>
                </div>
                <div className="club-coin-box">
                  <div className="coins">{faNum(15)} سکه</div>
                  <div className="l">نظرسنجی پایان کلاس</div>
                </div>
                <div className="club-coin-box">
                  <div className="coins">{faNum(10)} سکه</div>
                  <div className="l">تکمیل پروفایل</div>
                </div>
              </div>

              <Link
                to={content.ctaHref && content.ctaHref !== '/login' ? content.ctaHref : '/club'}
                className="btn btn-orange btn-lg"
                style={{ marginTop: 26 }}
              >
                {content.ctaLabel || 'مشاهده‌ی مأموریت‌ها'} <IconArrowLeft size={19} />
              </Link>
            </div>

            <div className="glass-dark" style={{ borderRadius: 'var(--r-xl)', padding: 26 }}>
              <div className="club-levels">
                <div className="club-level">
                  <div className="crown">
                    <IconCrown size={20} />
                  </div>
                  <b>برنزی</b>
                  <span>از ۰ سکه</span>
                </div>
                <div className="club-level">
                  <div className="crown">
                    <IconCrown size={20} />
                  </div>
                  <b>نقره‌ای</b>
                  <span>از ۵۰۰ سکه</span>
                </div>
                <div className="club-level is-now">
                  <div className="crown">
                    <IconCrown size={20} />
                  </div>
                  <b>طلایی</b>
                  <span>از ۱٬۵۰۰ سکه</span>
                </div>
                <div className="club-level">
                  <div className="crown">
                    <IconCrown size={20} />
                  </div>
                  <b>پلاتینیوم</b>
                  <span>از ۴٬۰۰۰ سکه</span>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    opacity: 0.9,
                    marginBottom: 8,
                  }}
                >
                  <span>سطح فعلی شما: نقره‌ای · {faNum(1120)} سکه</span>
                  <span>{faNum(380)} سکه تا طلایی</span>
                </div>
                <div className="progress on-dark">
                  <i style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
