'use client';
import {safeMarkup} from './safe-markup.js';
/* Home page blocks — ported 1:1 from Home.jsx so visuals stay identical */
import { HeroFrame, HeroEyebrow } from '../components/ui/twenty-first/hero-frame.jsx';
import HeroSearch from '../components/HeroSearch.jsx';
import { useState } from 'react';
import { Link } from '../routing/navigation';
import heroStudent from '../assets/hero-student.png';
import heroTeacher from '../assets/hero-teacher.png';
import {
  IconSearch, IconGlobe, IconMapPin, IconStar, IconLock, IconRefresh, IconCap, IconCrown,
  IconBulb, IconTag, IconBench, IconCoins, IconUsers, IconUserPlus, IconCalendar,
  IconClock, IconCheck, IconArrowLeft, IconArrowRight, IconChevronDown, IconHeadset, IconVideo,
  IconBook, IconSparkle, IconChart, IconHeart,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { toast } from '../utils/toast.js';

const Ic = ({ name, size = 20, ...rest }) => {
  const map = {
    search: IconSearch, globe: IconGlobe, pin: IconMapPin, star: IconStar, lock: IconLock,
    refresh: IconRefresh, cap: IconCap, crown: IconCrown, bulb: IconBulb, tag: IconTag,
    bench: IconBench, coins: IconCoins, users: IconUsers, userPlus: IconUserPlus,
    calendar: IconCalendar, clock: IconClock, check: IconCheck, arrow: IconArrowLeft,
    arrowR: IconArrowRight, chevron: IconChevronDown, headset: IconHeadset, video: IconVideo,
    book: IconBook, sparkle: IconSparkle, chart: IconChart, heart: IconHeart,
  };
  const C = map[name] || IconStar;
  return <C size={size} {...rest} />;
};

function Stars({ n = 5 }) {
  return <span className="stars">{Array.from({ length: n }).map((_, i) => <IconStar key={i} />)}</span>;
}

/* ================= HERO ================= */
export function HeroBlock({ node, editorPreview = false }) {
  const d = node.props;
  const [mode, setMode] = useState('online');
  return (
    <HeroFrame editorPreview={editorPreview}>
      <div className="container hero-grid hero-wide">
        <div>
          <HeroEyebrow label={d.eyebrowLabel} href={d.eyebrowHref} />
          <h1>
            {d.titleLine1}
            <br />
            <span className="hl-green">{d.titleLine2}</span>
          </h1>
          <p className="lead">{d.lead}</p>

          <HeroSearch data={d} />

          <div className="hero-trust">
            {(d.trust || []).map((t, i) => (
              <span className="item" key={i}>
                {t.icon === 'stars' ? <Stars /> : <Ic name={t.icon} size={17} />}
                {t.bold ? <b style={{ color: 'var(--ink)' }}>{t.bold}</b> : null} {t.text}
              </span>
            ))}
          </div>
          <div className="hero-dash" />
        </div>

        <div className="hero-visual">
          <img className="hero-photo photo-1" src={heroStudent.src || heroStudent} alt="شاگرد نیمکت" />
          <img className="hero-photo photo-2" src={heroTeacher.src || heroTeacher} alt="استاد نیمکت" />
          <div className="bubble b1">{d.bubble1}</div>
          <div className="bubble b2">{d.bubble2}</div>
          <div className="bubble dark b3">{d.bubble3Line1}<br />{d.bubble3Line2}</div>
          <div className="bubble dark b4">{d.bubble4}</div>
        </div>
      </div>

      <div className="container quick-links hero-wide">
        {(d.quickLinks || []).map((q) => (
          <Link to={q.to} className="quick-card" key={q.title}>
            <span className={`quick-icon ${q.orange ? 'orange' : ''}`}>
              <Ic name={q.icon} size={28} />
              {q.pin && <i className="pin">✦</i>}
            </span>
            <b>{q.title}</b>
            <span>{q.sub}</span>
          </Link>
        ))}
      </div>
    </HeroFrame>
  );
}

export const heroSpec = {
  type: 'hero', label: 'هیرو صفحه اصلی', category: 'ویژه',
  defaults: {
    eyebrowLabel: 'یادگیری، با آدم‌های درست', eyebrowHref: '/#how',
    titleLine1: 'استاد مناسب را پیدا کن،', titleLine2: 'نیمکت را رزرو کن.',
    lead: 'کلاس خصوصی یا گروهی، آنلاین یا در خانه‌ی خودتان. قیمت هر جلسه، ظرفیت باقی‌مانده و نظر شاگردان قبلی را قبل از پرداخت می‌بینید.',
    modeOnlineLabel: 'آنلاین', modeInpersonLabel: 'حضوری', searchNote: 'گام ۱ از ۳ · شیوه‌ی برگزاری',
    searchFields: [
      { label: 'نوع کلاس', value: 'خصوصی' }, { label: 'مقطع', value: 'متوسطه دوم' }, { label: 'درس', value: 'فیزیک' },
    ],
    searchBtnLabel: 'جستجو', searchBtnHref: '/classes',
    trust: [
      { icon: 'stars', bold: '۴٫۸', text: 'از ۵۰۰+ نظر ثبت‌شده' },
      { icon: 'lock', text: 'پرداخت امن بانکی' },
      { icon: 'refresh', text: 'بازگشت وجه تا ۲۴ ساعت قبل' },
    ],
    bubble1: 'توی درس ریاضی مشکل دارم', bubble2: 'می‌تونید کمکم کنید؟',
    bubble3Line1: 'ما در نیمکت برای کمک به شما', bubble3Line2: 'آماده‌ایم', bubble4: 'اولین کلاس خودتون رو رزرو کنید',
    quickLinks: [
      { icon: 'cap', title: 'اساتید برتر', sub: 'پروفایل و امتیاز', to: '/classes', orange: false, pin: true },
      { icon: 'crown', title: 'نوابغ نیمکت', sub: 'برترین‌های ماه', to: '/#top-students', orange: false, pin: true },
      { icon: 'tag', title: 'تخفیف‌ها', sub: 'پیشنهادهای ویژه', to: '/#group-classes', orange: false, pin: true },
      { icon: 'bench', title: 'نیمکت کلاب', sub: 'باشگاه مشتریان', to: '/#club', orange: false, pin: false },
      { icon: 'chart', title: 'رکوردها', sub: 'آمار نیمکت', to: '/#stats', orange: false, pin: true },
    ],
  },
  fields: [
    { key: 'eyebrowLabel', label: 'متن نشان بالای هیرو', type: 'text' },
    { key: 'eyebrowHref', label: 'لینک نشان هیرو', type: 'text' },
    { key: 'titleLine1', label: 'عنوان (خط ۱)', type: 'text' },
    { key: 'titleLine2', label: 'عنوان (خط ۲ - سبز)', type: 'text' },
    { key: 'lead', label: 'توضیح زیر عنوان', type: 'textarea' },
    { key: 'modeOnlineLabel', label: 'برچسب آنلاین', type: 'text' },
    { key: 'modeInpersonLabel', label: 'برچسب حضوری', type: 'text' },
    { key: 'searchNote', label: 'متن گام', type: 'text' },
    { key: 'searchFields', label: 'فیلدهای جستجو', type: 'list', itemLabel: 'label', fields: [{ key: 'label', label: 'برچسب', type: 'text' }, { key: 'value', label: 'مقدار', type: 'text' }] },
    { key: 'searchBtnLabel', label: 'متن دکمه جستجو', type: 'text' },
    { key: 'searchBtnHref', label: 'لینک جستجو', type: 'text' },
    { key: 'bubble1', label: 'حباب ۱', type: 'text' },
    { key: 'bubble2', label: 'حباب ۲', type: 'text' },
    { key: 'bubble3Line1', label: 'حباب ۳ - خط ۱', type: 'text' },
    { key: 'bubble3Line2', label: 'حباب ۳ - خط ۲', type: 'text' },
    { key: 'bubble4', label: 'حباب ۴', type: 'text' },
    { key: 'trust', label: 'مورد اعتمادها', type: 'list', itemLabel: 'text', fields: [{ key: 'icon', label: 'آیکون', type: 'select', options: ['stars', 'lock', 'refresh', 'check', 'clock'] }, { key: 'bold', label: 'متن بولد', type: 'text' }, { key: 'text', label: 'متن', type: 'text' }] },
    { key: 'quickLinks', label: 'لینک‌های سریع', type: 'list', itemLabel: 'title', fields: [{ key: 'icon', label: 'آیکون', type: 'select', options: ['cap', 'crown', 'tag', 'bench', 'chart', 'star', 'coins'] }, { key: 'title', label: 'عنوان', type: 'text' }, { key: 'sub', label: 'زیرعنوان', type: 'text' }, { key: 'to', label: 'لینک', type: 'text' }, { key: 'orange', label: 'نارنجی', type: 'toggle' }, { key: 'pin', label: 'پین', type: 'toggle' }] },
  ],
};

/* ================= BOOKING STEPS ================= */
export function BookingStepsBlock({ node }) {
  const d = node.props;
  return (
    <section className="section-tight" id="how">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow">{d.eyebrow}</span>
            <h2 className="section-title">{d.title}</h2>
            <p className="section-sub">{d.sub}</p>
          </div>
          <Link to={d.ctaHref || '/classes'} className="btn btn-primary">
            {d.ctaLabel} <IconArrowLeft size={18} />
          </Link>
        </div>
        <div className="steps">
          {(d.steps || []).map((s) => (
            <div className={`step ${s.tone === 'orange' ? 'orange' : ''}`} key={s.n}>
              <span className="n">{s.n}</span>
              <Ic name={s.icon} size={26} className="ic" />
              <b>{s.title}</b>
              <span>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const bookingStepsSpec = {
  type: 'booking-steps', label: 'گام‌های رزرو', category: 'ویژه',
  defaults: {
    eyebrow: 'رزرو کوتاه و بی‌دردسر', title: 'در ۴ گام، نیمکتت رزرو می‌شود',
    sub: 'از جست‌وجو تا ورود به کلاس؛ بدون تماس تلفنی و بدون هماهنگی طولانی.',
    ctaLabel: 'شروع رزرو کلاس', ctaHref: '/classes',
    steps: [
      { n: '۱', icon: 'search', tone: '', title: 'استاد و کلاس را پیدا کن', desc: 'فیلتر بر اساس درس، مقطع، قیمت، امتیاز و زمان‌های آزاد' },
      { n: '۲', icon: 'calendar', tone: 'orange', title: 'زمان و تعداد جلسه را انتخاب کن', desc: 'تخفیف پلکانی خودکار اعمال می‌شود و ظرفیت را زنده می‌بینی' },
      { n: '۳', icon: 'lock', tone: '', title: 'پرداخت امن بانکی', desc: 'مبلغ تا ۲۴ ساعت قبل از جلسه قابل بازگشت به کیف پول است' },
      { n: '۴', icon: 'video', tone: 'orange', title: 'ورود به کلاس و گزارش جلسه', desc: 'تست فنی قبل از کلاس + گزارش آموزشی بعد از هر جلسه' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'sub', label: 'توضیح', type: 'textarea' },
    { key: 'ctaLabel', label: 'متن دکمه', type: 'text' },
    { key: 'ctaHref', label: 'لینک دکمه', type: 'text' },
    { key: 'steps', label: 'گام‌ها', type: 'list', itemLabel: 'title', fields: [{ key: 'n', label: 'شماره', type: 'text' }, { key: 'icon', label: 'آیکون', type: 'select', options: ['search', 'calendar', 'lock', 'video', 'check', 'star'] }, { key: 'tone', label: 'رنگ', type: 'select', options: ['', 'orange'] }, { key: 'title', label: 'عنوان', type: 'text' }, { key: 'desc', label: 'توضیح', type: 'textarea' }] },
  ],
};

/* ================= STATS BAND ================= */
export function StatsBandBlock({ node }) {
  const d = node.props;
  return (
    <section className="section-tight" id="stats">
      <div className="container stats-band">
        {(d.stats || []).map((s) => (
          <div className="stat-card" key={s.label}>
            <span className={`ic ${s.orange ? 'orange' : ''}`}><Ic name={s.icon} size={24} /></span>
            <span className="v">{s.value}</span>
            <span className="l">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export const statsBandSpec = {
  type: 'stats-band', label: 'نوار آمار', category: 'ویژه',
  defaults: {
    stats: [
      { icon: 'users', value: '۲۴۰+', label: 'استاد تأییدشده', orange: false },
      { icon: 'bench', value: '۱۸٬۵۰۰', label: 'کلاس برگزارشده', orange: true },
      { icon: 'star', value: '۴٫۸ از ۵', label: 'میانگین رضایت از ۱۲٬۴۰۰ نظر', orange: false },
      { icon: 'clock', value: '۷۲ ساعت', label: 'حداکثر زمان پاسخ‌گویی و تأیید', orange: true },
    ],
  },
  fields: [
    { key: 'stats', label: 'آمارها', type: 'list', itemLabel: 'label', fields: [{ key: 'icon', label: 'آیکون', type: 'select', options: ['users', 'bench', 'star', 'clock', 'book', 'crown'] }, { key: 'value', label: 'مقدار', type: 'text' }, { key: 'label', label: 'برچسب', type: 'text' }, { key: 'orange', label: 'نارنجی', type: 'toggle' }] },
  ],
};

/* ================= TOP TEACHERS ================= */
export function TopTeachersBlock({ node }) {
  const d = node.props;
  const [subject, setSubject] = useState('همه');
  const filters = d.filters || ['همه'];
  return (
    <section className="section" id="top-teachers">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow orange">{d.eyebrow}</span>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: safeMarkup(d.title) }} />
          </div>
          <div className="head-arrows" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: 320, behavior: 'smooth' })}><IconArrowRight size={18} /></button>
            <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: -320, behavior: 'smooth' })}><IconArrowLeft size={18} /></button>
          </div>
        </div>

        <div className="sort-row" style={{ marginBottom: 22, justifyContent: 'flex-start' }}>
          {filters.map((s) => (
            <button key={s} type="button" className={`chip ${subject === s ? 'is-active' : 'outline'}`} onClick={() => setSubject(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="row-scroll">
          {(d.teachers || []).filter((t) => subject === 'همه' || t.subjectKey === subject).map((t) => (
            <div className="t-card" key={t.name}>
              <div className="head">
                {t.rank ? <span className={`rank-pin ${Number(String(t.rank).replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x))) > 1 ? 'green' : ''}`}>{t.rank}</span> : null}
                <div style={{ flex: 1 }}>
                  <div className="name">{t.name}</div>
                  <div className="subject">{t.subject}</div>
                </div>
                <div className={`avatar sq-64 ${t.color}`}>{t.letter}</div>
              </div>
              <div className="badges">
                {(t.badges || []).map((b) => <span className="chip" key={b}>{b}</span>)}
              </div>
              <div className="stats">
                <div><div className="v">{t.classes}</div><div className="l">کلاس</div></div>
                <div><div className="v">{t.students}</div><div className="l">شاگرد</div></div>
                <div>
                  <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    <IconStar size={13} style={{ color: 'var(--accent)' }} />{t.rating}
                  </div>
                  <div className="l">امتیاز</div>
                </div>
              </div>
              <Link to={t.href || '/classes'} className="btn btn-outline-green btn-block">مشاهده پروفایل</Link>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to={d.ctaHref || '/classes'} className="btn btn-orange btn-lg">
            {d.ctaLabel} <IconArrowLeft size={19} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export const topTeachersSpec = {
  type: 'top-teachers', label: 'اساتید برتر', category: 'ویژه',
  defaults: {
    eyebrow: 'اساتید برتر هفته', title: 'اساتیدی که این هفته <span class="hl-orange">درخشیدند</span>',
    filters: ['همه', 'ریاضی', 'فیزیک', 'زبان انگلیسی', 'ادبیات', 'عربی', 'علوم', 'برنامه‌نویسی'],
    ctaLabel: 'شروع رزرو کلاس با این اساتید', ctaHref: '/classes',
    teachers: [
      { name: 'سارا محمدی', letter: 'س', color: 'orange', subject: 'ریاضی — متوسطه اول', rank: '۱', rating: '۴٫۹', badges: ['پرفروش', 'وقت‌شناس'], classes: '۱٬۸۷۴', students: '۴۶۲', subjectKey: 'ریاضی' },
      { name: 'امیر رضایی', letter: 'ا', color: 'green', subject: 'فیزیک — کنکور', rank: '۲', rating: '۴٫۹', badges: ['پرطرفدار', 'متخصص'], classes: '۱٬۳۱۱', students: '۴۰۸', subjectKey: 'فیزیک' },
      { name: 'نگار سلطانی', letter: 'ن', color: 'green', subject: 'زبان انگلیسی', rank: '۳', rating: '۴٫۸', badges: ['مکالمه', 'کودکان'], classes: '۹۱۷', students: '۲۳۴', subjectKey: 'زبان انگلیسی' },
      { name: 'حسین نوری', letter: 'ح', color: 'green', subject: 'ریاضی — کنکور', rank: '', rating: '۵٫۰', badges: ['رتبه برتر', 'نخبه'], classes: '۷۴۱', students: '۲۹۸', subjectKey: 'ریاضی' },
      { name: 'مریم کاظمی', letter: 'م', color: 'orange', subject: 'ادبیات — متوسطه', rank: '', rating: '۴٫۹', badges: ['صبور', 'خلاق'], classes: '۲۸۹', students: '۱۵۶', subjectKey: 'ادبیات' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان (HTML)', type: 'textarea' },
    { key: 'ctaLabel', label: 'متن دکمه انتها', type: 'text' },
    { key: 'ctaHref', label: 'لینک دکمه', type: 'text' },
    { key: 'filters', label: 'فیلترهای درس', type: 'list', itemLabel: 'value', fields: [{ key: 'value', label: 'نام فیلتر', type: 'text' }] },
    {
      key: 'teachers', label: 'کارت‌های استاد', type: 'list', itemLabel: 'name',
      fields: [
        { key: 'name', label: 'نام', type: 'text' }, { key: 'letter', label: 'حرف آواتار', type: 'text' },
        { key: 'color', label: 'رنگ آواتار', type: 'select', options: ['orange', 'green', ''] },
        { key: 'subject', label: 'درس', type: 'text' }, { key: 'subjectKey', label: 'کلید فیلتر', type: 'text' },
        { key: 'rank', label: 'رتبه (خالی = بدون)', type: 'text' }, { key: 'rating', label: 'امتیاز', type: 'text' },
        { key: 'classes', label: 'تعداد کلاس', type: 'text' }, { key: 'students', label: 'تعداد شاگرد', type: 'text' },
        { key: 'badges', label: 'نشان‌ها (با | جدا کنید)', type: 'text' },
      ],
    },
  ],
};

/* ================= TOP STUDENTS ================= */
export function TopStudentsBlock({ node }) {
  const d = node.props;
  return (
    <section className="section-tight" id="top-students">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow orange">{d.eyebrow}</span>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: safeMarkup(d.title) }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: 320, behavior: 'smooth' })}><IconArrowRight size={18} /></button>
            <button className="btn-icon-round" type="button" onClick={(e) => e.currentTarget.closest('.container')?.querySelector('.row-scroll')?.scrollBy({ left: -320, behavior: 'smooth' })}><IconArrowLeft size={18} /></button>
          </div>
        </div>
        <div className="row-scroll">
          {(d.students || []).map((s) => (
            <div className="s-card" key={s.name}>
              <div className="s-avatar-wrap">
                {s.rank && Number(String(s.rank).replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x))) <= 3 && (
                  <span className="s-crown"><IconCrown size={16} /></span>
                )}
                <div className="s-avatar" style={{ background: s.color === 'green' ? 'var(--secondary)' : 'var(--accent)' }}>{s.letter}</div>
              </div>
              <b style={{ fontSize: 15.5 }}>{s.name}</b>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{s.grade}</span>
              <div className="stats">
                <div><div className="v">{s.score}</div><div className="l">امتیاز</div></div>
                <div><div className="v">{s.classes}</div><div className="l">کلاس</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const topStudentsSpec = {
  type: 'top-students', label: 'نوابغ ماه', category: 'ویژه',
  defaults: {
    eyebrow: 'نوابغ ماه', title: 'دانش‌آموزان <span class="hl-orange">برتر</span> این ماه',
    students: [
      { name: 'آرمین رستمی', letter: 'آ', color: 'orange', grade: 'پایه نهم', score: '۲٬۹۵۰', classes: '۸۸', rank: '۱' },
      { name: 'یسنا کریمی', letter: 'ی', color: 'green', grade: 'پایه هشتم', score: '۲٬۹۰۰', classes: '۸۲', rank: '۲' },
      { name: 'پرهام نوری', letter: 'پ', color: 'green', grade: 'پایه هفتم', score: '۲٬۸۸۰', classes: '۷۸', rank: '۳' },
      { name: 'رعنا سلطانی', letter: 'ر', color: 'green', grade: 'پایه ششم', score: '۲٬۹۶۰', classes: '۸۵', rank: '' },
      { name: 'بردیا مهدوی', letter: 'ب', color: 'orange', grade: 'پایه نهم', score: '۲٬۸۵۰', classes: '۷۵', rank: '' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان (HTML)', type: 'textarea' },
    {
      key: 'students', label: 'کارت‌های دانش‌آموز', type: 'list', itemLabel: 'name',
      fields: [
        { key: 'name', label: 'نام', type: 'text' }, { key: 'letter', label: 'حرف آواتار', type: 'text' },
        { key: 'color', label: 'رنگ', type: 'select', options: ['orange', 'green'] },
        { key: 'grade', label: 'پایه', type: 'text' }, { key: 'score', label: 'امتیاز', type: 'text' },
        { key: 'classes', label: 'کلاس', type: 'text' }, { key: 'rank', label: 'رتبه (خالی = بدون)', type: 'text' },
      ],
    },
  ],
};
