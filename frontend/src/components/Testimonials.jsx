import { faNum } from '../utils/fa.js';
import { IconStar } from './icons.jsx';

const TESTIMONIALS = [
  {
    text: 'قبلاً هر ترم دنبال معلم می‌گشتیم. این‌جا گزارش هر جلسه را می‌بینم و اگر جلسه‌ای لغو شود همان روز استاد جایگزین پیشنهاد می‌شود.',
    name: 'فاطمه احمدی',
    role: 'مادر هستی، پایه ششم',
    avatar: 'ف',
    color: 'cream',
  },
  {
    text: 'کلاس گروهی فیزیک با چهار نفر از بچه‌های مدرسه گرفтим. هم ارزون‌تر درآمد هم رفع اشکال بعد کلاس در نیم‌چت خیلی کمک کرد.',
    name: 'حسین نوری',
    role: 'پشت کنکور تجربی',
    avatar: 'ح',
    color: 'mint',
  },
  {
    text: 'از روی ویدیوی معرفی استاد انتخاب کردم. جلسهٔ اول که حس کردم سطح کلاس بالاست، زمان را عوض کردند بدون هزینه.',
    name: 'زهرا کریمی',
    role: 'دانش‌آموز پایه دهم',
    avatar: 'ز',
    color: 'green',
  },
];

export default function Testimonials() {
  return (
    <section className="section tests">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow plain">نظر شاگردها و والدین</span>
            <h2 className="section-title">نظرات کاربران نیمکت از زبان خودشان</h2>
          </div>
          <div className="rating-block">
            <div className="rating-big">۴٫۸</div>
            <span className="stars">
              {[...Array(5)].map((_, i) => (
                <IconStar key={i} size={16} />
              ))}
            </span>
            <div className="rating-sub">میانگین {faNum('12,400')} نظر</div>
          </div>
        </div>

        <div className="test-grid">
          {TESTIMONIALS.map((t) => (
            <article className="test-card" key={t.name}>
              <span className="stars">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={16} />
                ))}
              </span>
              <p className="test-text">{t.text}</p>
              <div className="test-user">
                <span className={`test-avatar ${t.color}`}>{t.avatar}</span>
                <span>
                  <b>{t.name}</b>
                  <span>{t.role}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
