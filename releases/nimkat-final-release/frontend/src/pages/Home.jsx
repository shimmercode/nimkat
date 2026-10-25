import { useState } from 'react';
import { Link } from 'react-router-dom';
import heroStudent from '../assets/hero-student.png';
import heroTeacher from '../assets/hero-teacher.png';
import {
  IconSearch, IconGlobe, IconMapPin, IconStar, IconLock, IconRefresh, IconCap, IconCrown,
  IconBulb, IconTag, IconBench, IconCoins, IconGift, IconUsers, IconUserPlus, IconCalendar,
  IconClock, IconCheck, IconArrowLeft, IconArrowRight, IconChevronDown, IconHeadset, IconVideo,
  IconBook, IconMedal, IconTarget, IconSparkle, IconChart, IconReceipt, IconHeart,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { toast } from '../utils/toast.js';

/* ---------------- data (per Home page.pdf) ---------------- */
const QUICK_LINKS = [
  { icon: IconCap, title: 'اساتید برتر', sub: 'پروفایل و امتیاز', to: '/classes', orange: false, pin: true },
  { icon: IconCrown, title: 'نوابغ نیمکت', sub: 'برترین‌های ماه', to: '/#top-students', orange: false, pin: true },
  { icon: IconTag, title: 'تخفیف‌ها', sub: 'پیشنهادهای ویژه', to: '/#group-classes', orange: false, pin: true },
  { icon: IconBench, title: 'نیمکت کلاب', sub: 'باشگاه مشتریان', to: '/#club', orange: false, pin: false },
  { icon: IconChart, title: 'رکوردها', sub: 'آمار نیمکت', to: '/#stats', orange: false, pin: true },
];

const SUBJECT_FILTERS = ['همه', 'ریاضی', 'فیزیک', 'زبان انگلیسی', 'ادبیات', 'عربی', 'علوم', 'برنامه‌نویسی'];

const TOP_TEACHERS = [
  {
    name: 'سارا محمدی', letter: 'س', color: 'orange', subject: 'ریاضی — متوسطه اول', rank: 1, rating: '۴٫۹',
    badges: ['پرفروش', 'وقت‌شناس'], classes: '۱٬۸۷۴', students: '۴۶۲', score: '۴٫۹', subjectKey: 'ریاضی',
  },
  {
    name: 'امیر رضایی', letter: 'ا', color: 'green', subject: 'فیزیک — کنکور', rank: 2, rating: '۴٫۹',
    badges: ['پرطرفدار', 'متخصص'], classes: '۱٬۳۱۱', students: '۴۰۸', score: '۴٫۸', subjectKey: 'فیزیک',
  },
  {
    name: 'نگار سلطانی', letter: 'ن', color: 'green', subject: 'زبان انگلیسی', rank: 3, rating: '۴٫۸',
    badges: ['مکالمه', 'کودکان'], classes: '۹۱۷', students: '۲۳۴', score: '۴٫۸', subjectKey: 'زبان انگلیسی',
  },
  {
    name: 'حسین نوری', letter: 'ح', color: 'green', subject: 'ریاضی — کنکور', rank: null, rating: '۵٫۰',
    badges: ['رتبه برتر', 'نخبه'], classes: '۷۴۱', students: '۲۹۸', score: '۵٫۰', subjectKey: 'ریاضی',
  },
  {
    name: 'مریم کاظمی', letter: 'م', color: 'orange', subject: 'ادبیات — متوسطه', rank: null, rating: '۴٫۹',
    badges: ['صبور', 'خلاق'], classes: '۲۸۹', students: '۱۵۶', score: '۴٫۹', subjectKey: 'ادبیات',
  },
];

const TOP_STUDENTS = [
  { name: 'آرمین رستمی', letter: 'آ', color: 'orange', grade: 'پایه نهم', score: '۲٬۹۵۰', classes: '۸۸', rank: 1 },
  { name: 'یسنا کریمی', letter: 'ی', color: 'green', grade: 'پایه هشتم', score: '۲٬۹۰۰', classes: '۸۲', rank: 2 },
  { name: 'پرهام نوری', letter: 'پ', color: 'green', grade: 'پایه هفتم', score: '۲٬۸۸۰', classes: '۷۸', rank: 3 },
  { name: 'رعنا سلطانی', letter: 'ر', color: 'green', grade: 'پایه ششم', score: '۲٬۹۶۰', classes: '۸۵', rank: null },
  { name: 'بردیا مهدوی', letter: 'ب', color: 'orange', grade: 'پایه نهم', score: '۲٬۸۵۰', classes: '۷۵', rank: null },
];

const TESTIMONIALS = [
  {
    text: 'قبلاً هر ترم دنبال معلم می‌گشتیم. این‌جا گزارش هر جلسه را می‌بینم و اگر جلسه‌ای لغو شود همان روز استاد جایگزین پیشنهاد می‌شود.',
    name: 'فاطمه احمدی', letter: 'ف', role: 'مادر هستی، پایه ششم', color: 'tint-orange',
  },
  {
    text: 'کلاس گروهی فیزیک با چهار نفر از بچه‌های مدرسه گرفتیم. هم ارزان‌تر درآمد هم رفع اشکال بعد کلاس در نیم‌چت خیلی کمک کرد.',
    name: 'حسین نوری', letter: 'ح', role: 'پشت کنکور تجربی', color: 'tint-green',
  },
  {
    text: 'از روی ویدیوی معرفی استاد انتخاب کردم. جلسه‌ی اول که حس کردم سطح کلاس بالاست، زمان را عوض کردند بدون هزینه.',
    name: 'زهرا کریمی', letter: 'ز', role: 'دانش‌آموز پایه دهم', color: 'green',
  },
];

const FAQS = [
  {
    q: 'اگر از استاد راضی نبودم چه می‌شود؟',
    a: 'تا پایان جلسه‌ی اول می‌توانید درخواست تغییر استاد بدهید. مبلغ جلسات باقی‌مانده بدون کسر به کیف پول شما برمی‌گردد یا برای استاد جدید استفاده می‌شود.',
  },
  {
    q: 'کلاس‌های آنلاین روی چه بستری برگزار می‌شوند؟',
    a: 'بیشتر کلاس‌ها روی اسکای‌روم با قلم نوری برگزار می‌شود. برای هر کلاس، بستر برگزاری در صفحه‌ی کلاس مشخص است و قبل از جلسه تست فنی رایگان دارید.',
  },
  {
    q: 'رزرو دوستانه چطور محاسبه می‌شود؟',
    a: 'در رزرو دوستانه تا ۵ نفر با یک پرداخت ثبت‌نام می‌کنند و تخفیف پلکانی و تخفیف گروهی روی مبلغ نهایی اعمال می‌شود. برای هر دوست پیامک دعوت با لینک کلاس ارسال می‌شود.',
  },
  {
    q: 'برای کلاس حضوری در منزل، استاد تا کجا می‌آید؟',
    a: 'در تهران مناطق ۱ تا ۶ پوشش داده می‌شود. در شهرهای دیگر کلاس حضوری در آموزشگاه‌های طرف قرارداد نیمکت برگزار می‌شود.',
  },
  {
    q: 'لغو کلاس تا چه زمانی رایگان است؟',
    a: 'لغو تا ۲۴ ساعت قبل از جلسه رایگان است و مبلغ به کیف پول برمی‌گردد. لغو کمتر از ۲۴ ساعت، ۵۰٪ مبلغ همان جلسه را کسر می‌کند.',
  },
];

const MAGAZINE = [
  {
    tag: 'مدیریت مطالعه', title: 'برنامه‌ریزی هفتگی برای کنکوری‌ها؛ از کجا شروع کنیم؟',
    meta: ['۸ دقیقه مطالعه', '۱۲ مهر'], grad: 'linear-gradient(135deg,#0a6847,#21a878)',
  },
  {
    tag: 'راهنمای والدین', title: 'چطور پیشرفت فرزندمان را جلسه به جلسه بسنجیم؟',
    meta: ['۶ دقیقه مطالعه', '۹ مهر'], grad: 'linear-gradient(135deg,#f28a3d,#f6b37a)',
  },
  {
    tag: 'معرفی رشته', title: 'فیزیک یازدهم؛ سخت‌ترین مفاهیم و راه سادهٔ یادگیری‌شان',
    meta: ['۱۰ دقیقه مطالعه', '۵ مهر'], grad: 'linear-gradient(135deg,#053d29,#0a6847)',
  },
];

/* ---------------- small pieces ---------------- */
function Stars({ n = 5 }) {
  return (
    <span className="stars">
      {Array.from({ length: n }).map((_, i) => (
        <IconStar key={i} />
      ))}
    </span>
  );
}

function TeacherCard({ t }) {
  return (
    <div className="t-card">
      <div className="head">
        {t.rank ? (
          <span className={`rank-pin ${t.rank > 1 ? 'green' : ''}`}>{faNum(t.rank)}</span>
        ) : null}
        <div style={{ flex: 1 }}>
          <div className="name">{t.name}</div>
          <div className="subject">{t.subject}</div>
        </div>
        <div className={`avatar sq-64 ${t.color}`}>{t.letter}</div>
      </div>
      <div className="badges">
        {t.badges.map((b) => (
          <span className="chip" key={b}>{b}</span>
        ))}
      </div>
      <div className="stats">
        <div>
          <div className="v">{t.classes}</div>
          <div className="l">کلاس</div>
        </div>
        <div>
          <div className="v">{t.students}</div>
          <div className="l">شاگرد</div>
        </div>
        <div>
          <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <IconStar size={13} style={{ color: 'var(--accent)' }} />
            {t.rating}
          </div>
          <div className="l">امتیاز</div>
        </div>
      </div>
      <Link to="/classes" className="btn btn-outline-green btn-block">
        مشاهده پروفایل
      </Link>
    </div>
  );
}

function StudentCard({ s }) {
  return (
    <div className="s-card">
      <div className="s-avatar-wrap">
        {s.rank && s.rank <= 3 && (
          <span className="s-crown">
            <IconCrown size={16} />
          </span>
        )}
        <div className={`s-avatar ${s.color === 'green' ? '' : ''}`} style={{ background: s.color === 'green' ? 'var(--secondary)' : 'var(--accent)' }}>
          {s.letter}
        </div>
      </div>
      <b style={{ fontSize: 15.5 }}>{s.name}</b>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{s.grade}</span>
      <div className="stats">
        <div>
          <div className="v">{s.score}</div>
          <div className="l">امتیاز</div>
        </div>
        <div>
          <div className="v">{s.classes}</div>
          <div className="l">کلاس</div>
        </div>
      </div>
    </div>
  );
}

function SeatGrid({ selected, onSelect, taken = [1, 2, 4, 5, 6, 9, 10, 12], booking = [11] }) {
  const rows = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ];
  return (
    <div className="seat-panel">
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <b style={{ fontSize: 13.5, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <IconBench size={17} /> چیدمان کلاس
        </b>
        <div className="board-line" style={{ margin: '10px auto 0' }} />
      </div>
      <div className="seat-grid">
        {rows.map((row, ri) => (
          <div className="seat-row" key={ri}>
            {row.map((n) => {
              const cls = taken.includes(n)
                ? 'taken'
                : booking.includes(n)
                ? 'booking'
                : selected === n
                ? 'selected'
                : 'free';
              return (
                <button
                  key={n}
                  className={`seat ${cls}`}
                  onClick={() => cls === 'free' && onSelect(n)}
                  type="button"
                >
                  {faNum(n)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="seat-legend" style={{ justifyContent: 'center', marginTop: 16 }}>
        <span><i style={{ background: 'var(--secondary-50)', border: '1px solid rgba(33,168,120,.4)' }} /> آزاد</span>
        <span><i style={{ background: 'var(--primary)' }} /> انتخاب شما</span>
        <span><i style={{ background: 'var(--accent-50)', border: '1px solid rgba(242,138,61,.5)' }} /> در حال رزرو</span>
        <span><i style={{ background: 'var(--n70)' }} /> رزروشده</span>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function Home() {
  const [subject, setSubject] = useState('همه');
  const [faqOpen, setFaqOpen] = useState(0);
  const [seat, setSeat] = useState(7);
  const [sessions, setSessions] = useState(8);
  const [friend, setFriend] = useState(false);
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('online');
  const [saved, setSaved] = useState(false);
  const [callbackSent, setCallbackSent] = useState(false);

  const requestCallback = async () => {
    const digits = String(phone).replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0)).replace(/[^\d]/g, '');
    if (digits.length !== 11 || !digits.startsWith('09')) { toast('شماره موبایل ۱۱ رقمی معتبر وارد کنید', 'err'); return; }
    try {
      await api('/callback', { method: 'POST', body: { phone: digits } });
      setCallbackSent(true);
      toast('درخواست تماس ثبت شد؛ به‌زودی تماس می‌گیریم ✓');
    } catch (e) {
      toast(e.message || 'خطا در ثبت درخواست', 'err');
    }
  };

  const perSession = 1500000;
  const discount = sessions >= 8 ? 0.1 : 0;
  const total = perSession * sessions * (1 - discount);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="container hero-grid hero-wide">
          <div>
            <h1>
              استاد مناسب را پیدا کن،
              <br />
              <span className="hl-green">نیمکت را رزرو کن.</span>
            </h1>
            <p className="lead">
              کلاس خصوصی یا گروهی، آنلاین یا در خانه‌ی خودتان. قیمت هر جلسه، ظرفیت باقی‌مانده و نظر
              شاگردان قبلی را قبل از پرداخت می‌بینید.
            </p>

            <div className="hero-search">
              <div className="top">
                <div className="segmented">
                  <button className={mode === 'online' ? 'is-active' : ''} type="button" onClick={() => setMode('online')}>
                    <IconGlobe size={17} /> آنلاین
                  </button>
                  <button className={mode === 'inperson' ? 'is-active' : ''} type="button" onClick={() => setMode('inperson')}>
                    <IconMapPin size={17} /> حضوری
                  </button>
                </div>
                <span className="note">گام ۱ از ۳ · شیوه‌ی برگزاری {mode === 'online' ? 'آنلاین' : 'حضوری'}</span>
              </div>

              <div className="search-bar">
                <div className="sfield">
                  <div className="sf-text">
                    <label className="sf-label">نوع کلاس</label>
                    <div className="sf-value">خصوصی</div>
                  </div>
                  <IconChevronDown size={16} className="chev" />
                </div>
                <div className="sfield">
                  <div className="sf-text">
                    <label className="sf-label">مقطع</label>
                    <div className="sf-value">متوسطه دوم</div>
                  </div>
                  <IconChevronDown size={16} className="chev" />
                </div>
                <div className="sfield">
                  <div className="sf-text">
                    <label className="sf-label">درس</label>
                    <div className="sf-value">فیزیک</div>
                  </div>
                  <IconChevronDown size={16} className="chev" />
                </div>
                <Link to="/classes" className="btn btn-primary hero-search-btn">
                  <IconSearch size={19} /> جستجو
                </Link>
              </div>
            </div>

            <div className="hero-trust">
              <span className="item">
                <Stars />
                <b style={{ color: 'var(--ink)' }}>۴٫۸</b> از ۵۰۰+ نظر ثبت‌شده
              </span>
              <span className="item">
                <IconLock size={17} /> پرداخت امن بانکی
              </span>
              <span className="item">
                <IconRefresh size={17} /> بازگشت وجه تا ۲۴ ساعت قبل
              </span>
            </div>
            <div className="hero-dash" />
          </div>

          <div className="hero-visual">
            <img className="hero-photo photo-1" src={heroStudent} alt="شاگرد نیمکت" />
            <img className="hero-photo photo-2" src={heroTeacher} alt="استاد نیمکت" />
            <div className="bubble b1">توی درس ریاضی مشکل دارم</div>
            <div className="bubble b2">می‌تونید کمکم کنید؟</div>
            <div className="bubble dark b3">ما در نیمکت برای کمک به شما<br />آماده‌ایم</div>
            <div className="bubble dark b4">اولین کلاس خودتون رو رزرو کنید</div>
          </div>
        </div>

        {/* quick links */}
        <div className="container quick-links hero-wide">
          {QUICK_LINKS.map((q) => (
            <Link to={q.to} className="quick-card" key={q.title}>
              <span className={`quick-icon ${q.orange ? 'orange' : ''}`}>
                <q.icon size={28} />
                {q.pin && <i className="pin">✦</i>}
              </span>
              <b>{q.title}</b>
              <span>{q.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ BOOKING PROCESS (visual steps) ============ */}
      <section className="section-tight" id="how">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">رزرو کوتاه و بی‌دردسر</span>
              <h2 className="section-title">در ۴ گام، نیمکتت رزرو می‌شود</h2>
              <p className="section-sub">
                از جست‌وجو تا ورود به کلاس؛ بدون تماس تلفنی و بدون هماهنگی طولانی.
              </p>
            </div>
            <Link to="/classes" className="btn btn-primary">
              شروع رزرو کلاس <IconArrowLeft size={18} />
            </Link>
          </div>
          <div className="steps">
            <div className="step">
              <span className="n">۱</span>
              <IconSearch size={26} className="ic" />
              <b>استاد و کلاس را پیدا کن</b>
              <span>فیلتر بر اساس درس، مقطع، قیمت، امتیاز و زمان‌های آزاد</span>
            </div>
            <div className="step orange">
              <span className="n">۲</span>
              <IconCalendar size={26} className="ic" />
              <b>زمان و تعداد جلسه را انتخاب کن</b>
              <span>تخفیف پلکانی خودکار اعمال می‌شود و ظرفیت را زنده می‌بینی</span>
            </div>
            <div className="step">
              <span className="n">۳</span>
              <IconLock size={26} className="ic" />
              <b>پرداخت امن بانکی</b>
              <span>مبلغ تا ۲۴ ساعت قبل از جلسه قابل بازگشت به کیف پول است</span>
            </div>
            <div className="step orange">
              <span className="n">۴</span>
              <IconVideo size={26} className="ic" />
              <b>ورود به کلاس و گزارش جلسه</b>
              <span>تست فنی قبل از کلاس + گزارش آموزشی بعد از هر جلسه</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PLATFORM STATS ============ */}
      <section className="section-tight" id="stats">
        <div className="container stats-band">
          <div className="stat-card">
            <span className="ic"><IconUsers size={24} /></span>
            <span className="v">۲۴۰+</span>
            <span className="l">استاد تأییدشده</span>
          </div>
          <div className="stat-card">
            <span className="ic orange"><IconBench size={24} /></span>
            <span className="v">۱۸٬۵۰۰</span>
            <span className="l">کلاس برگزارشده</span>
          </div>
          <div className="stat-card">
            <span className="ic"><IconStar size={24} /></span>
            <span className="v">۴٫۸ از ۵</span>
            <span className="l">میانگین رضایت از ۱۲٬۴۰۰ نظر</span>
          </div>
          <div className="stat-card">
            <span className="ic orange"><IconClock size={24} /></span>
            <span className="v">۷۲ ساعت</span>
            <span className="l">حداکثر زمان پاسخ‌گویی و تأیید</span>
          </div>
        </div>
      </section>

      {/* ============ TOP TEACHERS ============ */}
      <section className="section" id="top-teachers">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow orange">اساتید برتر هفته</span>
              <h2 className="section-title">
                اساتیدی که این هفته <span className="hl-orange">درخشیدند</span>
              </h2>
            </div>
            <div className="head-arrows" style={{ display: 'flex', gap: 10 }}>
              <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: 320, behavior: 'smooth' })}><IconArrowRight size={18} /></button>
              <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: -320, behavior: 'smooth' })}><IconArrowLeft size={18} /></button>
            </div>
          </div>

          <div className="sort-row" style={{ marginBottom: 22, justifyContent: 'flex-start' }}>
            {SUBJECT_FILTERS.map((s) => (
              <button key={s} type="button" className={`chip ${subject === s ? 'is-active' : 'outline'}`} onClick={() => setSubject(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="row-scroll">
            {TOP_TEACHERS.filter((t) => subject === 'همه' || t.subjectKey === subject).map((t) => (
              <TeacherCard t={t} key={t.name} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/classes" className="btn btn-orange btn-lg">
              شروع رزرو کلاس با این اساتید <IconArrowLeft size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ TOP STUDENTS ============ */}
      <section className="section-tight" id="top-students">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow orange">نوابغ ماه</span>
              <h2 className="section-title">
                دانش‌آموزان <span className="hl-orange">برتر</span> این ماه
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: 320, behavior: 'smooth' })}><IconArrowRight size={18} /></button>
              <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: -320, behavior: 'smooth' })}><IconArrowLeft size={18} /></button>
            </div>
          </div>
          <div className="row-scroll">
            {TOP_STUDENTS.map((s) => (
              <StudentCard s={s} key={s.name} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ GROUP CLASSES + SEAT BOOKING ============ */}
      <section className="section" id="group-classes">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">کلاس‌های گروهی در حال ثبت‌نام</span>
              <h2 className="section-title">جای خودت را در کلاس انتخاب کن</h2>
            </div>
            <a href="/classes" className="link-more">
              همه‌ی کلاس‌های گروهی <IconArrowLeft size={17} />
            </a>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1.7fr' }}>
            {/* main group class card */}
            <div className="card" style={{ borderRadius: 'var(--r-2xl)', padding: 28, gridColumn: 2, gridRow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                <div>
                  <h3 className="t-h4">حل تمرین فیزیک یازدهم</h3>
                  <p className="t-small t-muted" style={{ marginTop: 6 }}>
                    ظرفیت ۱۲ نفر · حضوری، آموزشگاه پارسه، خیابان کارگر شمالی
                  </p>
                </div>
                <span className="chip soft-orange"><IconClock size={14} /> ثبت‌نام تا ۱۰ مهر</span>
              </div>

              <div style={{ marginTop: 18 }}>
                <SeatGrid selected={seat} onSelect={setSeat} />
              </div>

              <div className="card-soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 18px', marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IconUserPlus size={22} style={{ color: 'var(--primary)' }} />
                  <div>
                    <b style={{ fontSize: 14.5 }}>رزرو دوستانه</b>
                    <div className="t-small t-muted">تا ۵ نفر با یک پرداخت؛ برای هر دوست پیامک دعوت ارسال می‌شود</div>
                  </div>
                </div>
                <button type="button" className={`toggle ${friend ? 'is-on' : ''}`} onClick={() => setFriend(!friend)} />
              </div>

              <hr className="divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="price-line">
                  <span className="l">هر جلسه</span>
                  <span className="v num">{faPrice(perSession)} تومان</span>
                </div>
                <div className="price-line">
                  <span className="l">تعداد جلسات</span>
                  <div className="stepper">
                    <button type="button" onClick={() => setSessions(Math.max(4, sessions - 1))}>−</button>
                    <span className="val num">{faNum(sessions)}</span>
                    <button type="button" onClick={() => setSessions(Math.min(16, sessions + 1))}>+</button>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="price-line">
                    <span className="l">تخفیف پلکانی {faNum(8)} جلسه</span>
                    <span className="v num" style={{ color: 'var(--secondary)' }}>
                      ٪{faNum(10)}− ({faPrice(perSession * sessions * 0.1)} تومان)
                    </span>
                  </div>
                )}
                <hr className="divider" />
                <div className="price-line price-total">
                  <span className="l" style={{ fontSize: 15 }}>مبلغ قابل پرداخت</span>
                  <span className="v num">{faPrice(total)} تومان</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <Link to="/classes/1" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                  ادامه و پرداخت · نیمکت {faNum(seat)} <IconArrowLeft size={19} />
                </Link>
                <button className="btn btn-outline btn-lg" type="button" onClick={() => { setSaved((v) => !v); toast(saved ? 'از ذخیره‌ها حذف شد' : 'کلاس ذخیره شد ✓'); }} style={saved ? { color: 'var(--error)', borderColor: 'var(--error)' } : undefined}>
                  <IconHeart size={19} /> {saved ? 'ذخیره شد ✓' : 'ذخیره'}
                </button>
              </div>
            </div>

            {/* mini group classes */}
            <div className="gc-list" style={{ gridColumn: 1, gridRow: 1 }}>
              <div className="gc-mini is-active">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 15.5 }}>حل تمرین فیزیک یازدهم</b>
                  <span className="chip soft-orange">۳ جای خالی</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconClock size={14} /> پنجشنبه‌ها ۱۶:۰۰</span>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconBook size={14} /> ۸ جلسه</span>
                </div>
                <div className="t-small t-muted">۹ از ۱۲</div>
                <div className="progress"><i style={{ width: '75%' }} /></div>
              </div>

              <div className="gc-mini">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 15.5 }}>جمع‌بندی ریاضی نهم</b>
                  <span className="chip">تکمیل ظرفیت</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconClock size={14} /> دوشنبه‌ها ۱۷:۰۰</span>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconBook size={14} /> ۶ جلسه</span>
                </div>
                <div className="t-small t-muted">۱۰ از ۱۰</div>
                <div className="progress"><i style={{ width: '100%', background: 'var(--n500)' }} /></div>
              </div>

              <div className="gc-mini">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 15.5 }}>مکالمه‌ی انگلیسی سطح B1</b>
                  <span className="chip soft-orange">۴ جای خالی</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconClock size={14} /> شنبه و سه‌شنبه ۱۹:۰۰</span>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconBook size={14} /> ۱۲ ججلسه</span>
                </div>
                <div className="t-small t-muted">۸ از ۱۲</div>
                <div className="progress"><i style={{ width: '66%' }} /></div>
              </div>

              <div className="gc-mini">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 15.5 }}>فیزیک پایه · مفهومی</b>
                  <span className="chip soft-green">۵ جای خالی</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconClock size={14} /> یکشنبه‌ها ۱۸:۰۰</span>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconBook size={14} /> ۱۰ جلسه</span>
                </div>
                <div className="t-small t-muted">۵ از ۱۰</div>
                <div className="progress green"><i style={{ width: '50%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CLUB BAND ============ */}
      <section className="section-tight" id="club">
        <div className="container">
          <div className="club-band">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1.15fr', alignItems: 'center', gap: 40 }}>
              <div>
                <span className="eyebrow on-dark">نیمکت کلاب</span>
                <h2 className="t-h2" style={{ marginTop: 16 }}>هر کلاس، یک قدم تا نیمکت طلایی</h2>
                <p style={{ opacity: 0.85, lineHeight: 2.1, marginTop: 14, fontSize: 16 }}>
                  با شرکت در کلاس، نظر دادن و دعوت دوستان سکه جمع کن. سطح طلایی دو جلسه‌ی رایگان با
                  برترین استاد پلتفرم دارد.
                </p>

                <div className="club-coins" style={{ marginTop: 26 }}>
                  <div className="club-coin-box">
                    <div className="coins"><IconCoins size={20} /> {faNum(50)} سکه</div>
                    <div className="l">هر کلاس موفق</div>
                  </div>
                  <div className="club-coin-box">
                    <div className="coins"><IconCoins size={20} /> {faNum(20)} سکه</div>
                    <div className="l">دعوت از دوست</div>
                  </div>
                  <div className="club-coin-box">
                    <div className="coins"><IconCoins size={20} /> {faNum(15)} سکه</div>
                    <div className="l">تکمیل پروفایل</div>
                  </div>
                  <div className="club-coin-box">
                    <div className="coins"><IconCoins size={20} /> {faNum(10)} سکه</div>
                    <div className="l">نظرسنجی پایان کلاس</div>
                  </div>
                </div>

                <Link to="/login" className="btn btn-orange btn-lg" style={{ marginTop: 26 }}>
                  مشاهده‌ی مأموریت‌ها <IconArrowLeft size={19} />
                </Link>
              </div>

              <div className="glass-dark" style={{ borderRadius: 'var(--r-xl)', padding: 26 }}>
                <div className="club-levels">
                  <div className="club-level">
                    <div className="crown"><IconCrown size={20} /></div>
                    <b>پلاتینیوم</b>
                    <span>از ۴٬۰۰۰ سکه</span>
                  </div>
                  <div className="club-level is-now">
                    <div className="crown"><IconCrown size={20} /></div>
                    <b>طلایی</b>
                    <span>از ۱٬۵۰۰ سکه</span>
                  </div>
                  <div className="club-level">
                    <div className="crown"><IconCrown size={20} /></div>
                    <b>نقره‌ای</b>
                    <span>از ۵۰۰ سکه</span>
                  </div>
                  <div className="club-level">
                    <div className="crown"><IconCrown size={20} /></div>
                    <b>برنزی</b>
                    <span>از ۰ سکه</span>
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.9, marginBottom: 8 }}>
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

      {/* ============ PROMO DUO ============ */}
      <section className="section-tight" id="parents">
        <div className="container grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="promo-dark" style={{ gridColumn: 2, gridRow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <span className="chip dark" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
                <IconCap size={15} /> برای اساتید
              </span>
            </div>
            <h3 className="t-h3">کلاس‌هایت را خودت قیمت‌گذاری کن</h3>
            <p style={{ opacity: 0.85, lineHeight: 2.1 }}>
              ثبت‌نام، بررسی مدارک و مصاحبه حداکثر ۷۲ ساعت طول می‌کشد. تسویه‌ی درآمد هر دو هفته یک‌بار
              به حساب شبای شما.
            </p>
            <div className="promo-stats">
              <div>
                <div className="v">۸۵٪</div>
                <div className="l">سهم استاد از هر جلسه</div>
              </div>
              <div>
                <div className="v">۷۲ ساعت</div>
                <div className="l">زمان بررسی درخواست</div>
              </div>
            </div>
            <div>
              <Link to="/login?mode=teacher" className="btn btn-orange">
                ثبت درخواست همکاری <IconArrowLeft size={18} />
              </Link>
            </div>
          </div>

          <div className="promo-orange" style={{ gridColumn: 1, gridRow: 1 }}>
            <div>
              <span className="chip outline-green" style={{ background: '#fff' }}>
                <IconUsers size={15} /> ویژه والدین
              </span>
            </div>
            <h3 className="t-h3">پیشرفت فرزندتان را جلسه به جلسه ببینید</h3>
            <p className="t-muted" style={{ lineHeight: 2.1 }}>
              گزارش حضور، تکلیف‌ها و نظر استاد بعد از هر جلسه به پنل شما می‌آید. پرداخت و لغو کلاس هم از
              همان‌جا انجام می‌شود.
            </p>
            <ul className="check-list">
              <li><IconCheck size={18} /> گزارش هفتگی</li>
              <li><IconCheck size={18} /> گروه والدین در نیم‌چت</li>
              <li><IconCheck size={18} /> مشاوره‌ی رایگان</li>
            </ul>
            <div>
              <Link to="/login" className="btn btn-primary">
                ساخت حساب والدین
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="section testi-band">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow green">نظر شاگردها و والدین</span>
              <h2 className="section-title">نظرات کاربران نیمکت از زبان خودشان</h2>
            </div>
            <div className="testi-score">
              <div style={{ textAlign: 'center' }}>
                <div className="big num">۴٫۸</div>
                <Stars />
                <div className="t-caption t-muted" style={{ marginTop: 4 }}>میانگین ۱۲٬۴۰۰ نظر</div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {TESTIMONIALS.map((t) => (
              <div className="testi-card" key={t.name}>
                <Stars />
                <p className="txt">{t.text}</p>
                <div className="testi-who">
                  <div className={`avatar sq-52 ${t.color}`}>{t.letter}</div>
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MAGAZINE ============ */}
      <section className="section" id="magazine">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">مجله نیمکت</span>
              <h2 className="section-title">برای بهتر درس خواندن بخوانید</h2>
              <p className="section-sub">راهنمای درس‌خواندن، مدیریت زمان و انتخاب رشته — کوتاه و کاربردی.</p>
            </div>
            <a href="#magazine" className="link-more">
              همه‌ی مطالب مجله <IconArrowLeft size={17} />
            </a>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {MAGAZINE.map((m) => (
              <a className="mag-card" href="#magazine" key={m.title}>
                <div className="mag-cover" style={{ background: m.grad }}>
                  <span className="tag chip dark">{m.tag}</span>
                  <IconBook size={54} style={{ color: 'rgba(255,255,255,.35)' }} />
                </div>
                <div className="mag-body">
                  <h4>{m.title}</h4>
                  <div className="mag-meta">
                    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                      <IconClock size={13} /> {m.meta[0]}
                    </span>
                    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                      <IconCalendar size={13} /> {m.meta[1]}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section-tight" id="faq">
        <div className="container grid" style={{ gridTemplateColumns: '1fr 1.75fr', alignItems: 'start' }}>
          <div style={{ gridColumn: 2, gridRow: 1 }}>
            {FAQS.map((f, i) => (
              <div className={`faq-item ${faqOpen === i ? 'is-open' : ''}`} key={f.q} style={{ marginBottom: 12 }}>
                <div className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <span className="pm">{faqOpen === i ? '−' : '+'}</span>
                </div>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>

          <div style={{ gridColumn: 1, gridRow: 1 }}>
            <span className="eyebrow">سوالات پرتکرار</span>
            <h2 className="t-h3" style={{ marginTop: 14 }}>قبل از رزرو بدانید</h2>
            <p className="t-small t-muted" style={{ lineHeight: 2.1, margin: '12px 0 20px' }}>
              جواب سوالتان را پیدا نکردید؟ کارشناس‌های ما از ۸ صبح تا ۸ شب پاسخگو هستند.
            </p>
            <div className="support-box">
              <div className="row">
                <IconHeadset size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <b style={{ fontSize: 14 }}>پشتیبانی تلفنی</b>
                  <div className="t-small t-muted num">۰۲۱-۹۱۰۰۴۵۶۰</div>
                </div>
                <span className="chip soft-green" style={{ marginRight: 'auto' }}>چت آنلاین</span>
              </div>
              <div className="row">
                <IconSparkle size={22} style={{ color: 'var(--accent-800)' }} />
                <div>
                  <b style={{ fontSize: 14 }}>پشتیبانی تلفنی</b>
                  <div className="t-small t-muted">شنبه تا پنجشنبه ۸ تا ۲۰</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CALLBACK ============ */}
      <section className="section-tight" id="callback">
        <div className="container">
          <div className="callback">
            <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', gap: 32 }}>
              <div>
                <h2 className="t-h3">نمی‌دانید از کجا شروع کنید؟</h2>
                <p className="t-muted" style={{ lineHeight: 2.1, marginTop: 12 }}>
                  شماره‌تان را بگذارید؛ مشاور تحصیلی نیمکت امروز تماس می‌گیرد و بر اساس سطح و هدف، استاد و
                  نوع کلاس پیشنهاد می‌دهد. رایگان.
                </p>
              </div>
              <div>
                {callbackSent ? (
                  <div className="card-soft" style={{ padding: 22, textAlign: 'center', borderColor: 'rgba(10,104,71,.4)', background: 'var(--secondary-50)' }}>
                    <b style={{ fontSize: 16, color: 'var(--primary)' }}>درخواست تماس شما ثبت شد ✓</b>
                    <div className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
                      مشاور تحصیلی نیمکت امروز با شماره‌ی <b className="num">{faNum(phone)}</b> تماس می‌گیرد.
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="field-label">شماره موبایل</label>
                    <div className="callback-form" style={{ marginTop: 8 }}>
                      <input
                        className="input num"
                        placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && requestCallback()}
                        style={{ direction: 'ltr', textAlign: 'right' }}
                      />
                      <button className="btn btn-primary" type="button" onClick={requestCallback}>درخواست تماس</button>
                    </div>
                    <div className="field-hint" style={{ marginTop: 10 }}>
                      <IconLock size={14} /> شماره‌ی شما فقط برای همین تماس استفاده می‌شود.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="section-tight">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 className="t-h3" style={{ color: '#fff' }}>همین حالا نیمکتت را رزرو کن</h2>
              <p style={{ opacity: 0.9, marginTop: 10, lineHeight: 2 }}>
                اولین جلسه با ضمانت تغییر استاد؛ پرداخت امن و بازگشت وجه تا ۲۴ ساعت قبل از کلاس.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/classes" className="btn btn-orange btn-lg">
                شروع رزرو کلاس <IconArrowLeft size={20} />
              </Link>
              <Link to="/login" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
                ثبت‌نام رایگان
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
