import { Link } from 'react-router-dom';
import { faNum } from '../utils/fa.js';
import {
  IconSearch, IconStar, IconShield, IconBook, IconUsers, IconArrowLeft, IconMedal, IconClock, IconBulb,
} from './icons.jsx';
import { IconCalendar, IconWallet, IconVideo } from '../panelIcons.jsx';

export function BookingProcess() {
  const steps = [
    { icon: IconSearch, title: 'جست‌وجو و انتخاب استاد', sub: 'بر اساس درس، مقطع، سطح و محل شما' },
    { icon: IconCalendar, title: 'انتخاب روز و صندلی', sub: 'زمان‌های آزاد واقعی + نقشهٔ کلاس' },
    { icon: IconWallet, title: 'پرداخت امن', sub: 'کیف پول، تخفیف پلکانی و بازگشت وجه' },
    { icon: IconVideo, title: 'کلاس و گزارش جلسه', sub: 'آنلاین یا حضوری + گزارش برای والدین' },
  ];
  return (
    <section className="section process-sec">
      <div className="container">
        <div className="sec-head center">
          <span className="eyebrow">فرایند رزرو</span>
          <h2 className="section-title">رزرو نیمکت، در <span className="hl">چهار قدم</span> ساده</h2>
          <p className="muted">از جست‌وجو تا اولین کلاس، معمولاً کمتر از ۱۰ دقیقه.</p>
        </div>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div className="step-card" key={s.title}>
              <span className="step-num">{faNum(i + 1)}</span>
              <span className="step-icon"><s.icon size={26} /></span>
              <b>{s.title}</b>
              <p>{s.sub}</p>
              {i < 3 && <span className="step-arrow">‹</span>}
            </div>
          ))}
        </div>
        <div className="process-cta">
          <Link to="/classes" className="btn btn-primary btn-lg">
            شروع رزرو کلاس
            <IconArrowLeft size={18} />
          </Link>
          <span className="muted">جلسهٔ اول با ضمانت بازگشت وجه</span>
        </div>
      </div>
    </section>
  );
}

export function PlatformStats() {
  const stats = [
    { b: '+۳۸۰', e: 'استاد تأییدشده', icon: IconShield },
    { b: '+۱۲٬۴۰۰', e: 'کلاس برگزارشده', icon: IconBook },
    { b: '۹۸٪', e: 'رضایت شاگردها', icon: IconStar },
    { b: '۲۴/۷', e: 'پشتیبانی هر هفته', icon: IconUsers },
  ];
  return (
    <section className="stats-band">
      <div className="container sb-grid">
        {stats.map((s) => (
          <span className="sb-item" key={s.e}>
            <s.icon size={22} />
            <b>{s.b}</b>
            <em>{s.e}</em>
          </span>
        ))}
      </div>
    </section>
  );
}

export function TeacherSpotlight() {
  const spots = [
    {
      name: 'سارا محمدی', letter: 'س', title: 'دبیر فیزیک و ریاضی متوسطه دوم',
      resume: ['کارشناسی ارشد فیزیک حالت جامد · دانشگاه صنعتی شریف', 'دبیر فیزیک دبیرستان علامه حلی ۳ · از ۱۴۰۰', 'مدرس برتر المپیاد فیزیک استان تهران · ۱۳۹۸'],
      stats: [['۴٫۹', 'از ۳۱۲ نظر'], ['۶۴۸', 'جلسه'], ['۹ سال', 'سابقه']],
      creds: ['برتر ماه', 'وقت‌شناس', 'حضور به‌موقع'], id: 1,
    },
    {
      name: 'حسین نوری', letter: 'ح', title: 'دبیر ریاضی کنکور · رتبه‌ساز',
      resume: ['دکترای ریاضی کاربردی · دانشگاه تهران', 'مؤلف ۳ کتاب کمک‌درسی کنکور', 'مشاور آموزشی ۲ مدرسهٔ منطقهٔ ۱'],
      stats: [['۵٫۰', 'از ۲۹ نظر'], ['۷۴۱', 'جلسه'], ['۱۲ سال', 'سابقه']],
      creds: ['رتبه برتر', 'نخبه', 'تضمینی'], id: 6,
    },
  ];
  return (
    <section className="section spotlight-sec">
      <div className="container">
        <div className="sec-head">
          <div>
            <span className="eyebrow">رزومه و آمار اساتید</span>
            <h2 className="section-title">اساتید نیمکت را <span className="hl">بشناسید</span></h2>
          </div>
          <Link to="/classes" className="link-green">همهٔ اساتید <IconArrowLeft size={16} /></Link>
        </div>
        <div className="spot-grid">
          {spots.map((t) => (
            <article className="spot-card" key={t.name}>
              <div className="spot-head">
                <span className="avatar green">{t.letter}</span>
                <span>
                  <b>{t.name}</b>
                  <em className="muted">{t.title}</em>
                </span>
                <span className="chip chip-month"><IconMedal size={13} /> برتر ماه</span>
              </div>
              <div className="spot-stats">
                {t.stats.map(([b, e]) => (
                  <span key={e}><b>{b}</b><em>{e}</em></span>
                ))}
              </div>
              <ul className="spot-resume">
                {t.resume.map((r) => <li key={r}><IconBulb size={14} /> {r}</li>)}
              </ul>
              <div className="chips">
                {t.creds.map((c) => <span className="chip" key={c}>{c}</span>)}
              </div>
              <div className="spot-actions">
                <Link to={`/classes/${t.id === 1 ? 5 : 1}`} className="btn btn-primary">شروع رزرو کلاس</Link>
                <Link to={`/teachers/${t.id}`} className="btn btn-outline">پروفایل کامل</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Magazine() {
  const posts = [
    { cat: 'روش مطالعه', title: 'چطور فیزیک را مفهومی بخوانیم؟', meta: '۶ دقیقه مطالعه', g: 'g1' },
    { cat: 'کنکور ۱۴۰۶', title: 'برنامهٔ ۸ هفته‌ای جمع‌بندی ریاضی', meta: '۹ دقیقه مطالعه', g: 'g2' },
    { cat: 'والدین', title: 'گزارش جلسه را چطور با فرزندم مرور کنم؟', meta: '۴ دقیقه مطالعه', g: 'g3' },
  ];
  return (
    <section className="section magazine-sec">
      <div className="container">
        <div className="sec-head">
          <div>
            <span className="eyebrow">مجله نیمکت</span>
            <h2 className="section-title">مطالب آموزشی و <span className="hl">تجربهٔ یادگیری</span></h2>
          </div>
          <span className="link-green">همهٔ مطالب <IconArrowLeft size={16} /></span>
        </div>
        <div className="mag-grid">
          {posts.map((p) => (
            <article className={`mag-card ${p.g}`} key={p.title}>
              <span className="mag-cat">{p.cat}</span>
              <b className="mag-title">{p.title}</b>
              <span className="mag-meta"><IconClock size={13} /> {p.meta}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container fc-inner">
        <div>
          <h2>آماده‌ای؟ نیمکتت منتظرت است.</h2>
          <p>همین حالا استادت را انتخاب کن؛ جلسهٔ اول با ضمانت بازگشت وجه.</p>
        </div>
        <div className="fc-actions">
          <Link to="/classes" className="btn btn-orange btn-lg">شروع رزرو کلاس</Link>
          <Link to="/teachers/1" className="btn btn-ghost-lg">استاد شوید</Link>
        </div>
      </div>
    </section>
  );
}
