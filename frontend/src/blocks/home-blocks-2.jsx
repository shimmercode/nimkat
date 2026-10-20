/* Home page blocks — part 2: group classes, club, promos, testimonials, magazine, FAQ, callback */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconSearch, IconStar, IconLock, IconCap, IconCrown, IconBench, IconCoins, IconUsers,
  IconUserPlus, IconCalendar, IconClock, IconCheck, IconArrowLeft, IconHeadset, IconVideo,
  IconBook, IconSparkle, IconHeart,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { toast } from '../utils/toast.js';

const Ic = ({ name, size = 20, ...rest }) => {
  const map = {
    search: IconSearch, star: IconStar, lock: IconLock, cap: IconCap, crown: IconCrown,
    bench: IconBench, coins: IconCoins, users: IconUsers, userPlus: IconUserPlus,
    calendar: IconCalendar, clock: IconClock, check: IconCheck, arrow: IconArrowLeft,
    headset: IconHeadset, video: IconVideo, book: IconBook, sparkle: IconSparkle, heart: IconHeart,
  };
  const C = map[name] || IconStar;
  return <C size={size} {...rest} />;
};

function Stars({ n = 5 }) {
  return <span className="stars">{Array.from({ length: n }).map((_, i) => <IconStar key={i} />)}</span>;
}

function SeatGrid({ selected, onSelect, taken = [], booking = [] }) {
  const rows = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]];
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
              const isTaken = taken.includes(n);
              const isBooking = booking.includes(n);
              const isSel = selected === n;
              return (
                <button
                  key={n}
                  type="button"
                  className={`seat ${isTaken ? 'taken' : ''} ${isBooking ? 'booking' : ''} ${isSel ? 'sel' : ''}`}
                  onClick={() => !isTaken && onSelect(n)}
                >
                  <span className="num">{faNum(n)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= GROUP CLASSES + SEAT BOOKING ================= */
export function GroupClassesBlock({ node }) {
  const d = node.props;
  const [seat, setSeat] = useState(3);
  const [friend, setFriend] = useState(true);
  const [sessions, setSessions] = useState(8);
  const [saved, setSaved] = useState(false);
  const perSession = Number(d.perSession) || 1500000;
  const discount = sessions >= 8 ? 0.1 : 0;
  const total = perSession * sessions * (1 - discount);
  return (
    <section className="section" id="group-classes">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow">{d.eyebrow}</span>
            <h2 className="section-title">{d.title}</h2>
          </div>
          <a href={d.moreHref || '/classes'} className="link-more">
            {d.moreLabel} <IconArrowLeft size={17} />
          </a>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1.7fr' }}>
          <div className="card" style={{ borderRadius: 'var(--r-2xl)', padding: 28, gridColumn: 2, gridRow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
              <div>
                <h3 className="t-h4">{d.main.title}</h3>
                <p className="t-small t-muted" style={{ marginTop: 6 }}>{d.main.desc}</p>
              </div>
              <span className="chip soft-orange"><IconClock size={14} /> {d.main.deadline}</span>
            </div>

            <div style={{ marginTop: 18 }}>
              <SeatGrid selected={seat} onSelect={setSeat} taken={d.main.taken || []} booking={d.main.booking || []} />
            </div>

            <div className="card-soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 18px', marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IconUserPlus size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <b style={{ fontSize: 14.5 }}>{d.friendTitle}</b>
                  <div className="t-small t-muted">{d.friendDesc}</div>
                </div>
              </div>
              <button type="button" className={`toggle ${friend ? 'is-on' : ''}`} onClick={() => setFriend(!friend)} />
            </div>

            <hr className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="price-line">
                <span className="l">{d.pricePerLabel}</span>
                <span className="v num">{faPrice(perSession)} تومان</span>
              </div>
              <div className="price-line">
                <span className="l">{d.sessionsLabel}</span>
                <div className="stepper">
                  <button type="button" onClick={() => setSessions(Math.max(4, sessions - 1))}>−</button>
                  <span className="val num">{faNum(sessions)}</span>
                  <button type="button" onClick={() => setSessions(Math.min(16, sessions + 1))}>+</button>
                </div>
              </div>
              {discount > 0 && (
                <div className="price-line">
                  <span className="l">{d.discountLabel}</span>
                  <span className="v num" style={{ color: 'var(--secondary)' }}>
                    ٪{faNum(10)}− ({faPrice(perSession * sessions * 0.1)} تومان)
                  </span>
                </div>
              )}
              <hr className="divider" />
              <div className="price-line price-total">
                <span className="l" style={{ fontSize: 15 }}>{d.totalLabel}</span>
                <span className="v num">{faPrice(total)} تومان</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Link to={d.payHref || '/classes/1'} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                {d.payLabel} · {d.seatLabel} {faNum(seat)} <IconArrowLeft size={19} />
              </Link>
              <button className="btn btn-outline btn-lg" type="button" onClick={() => { setSaved((v) => !v); toast(saved ? 'از ذخیره‌ها حذف شد' : 'کلاس ذخیره شد ✓'); }} style={saved ? { color: 'var(--error)', borderColor: 'var(--error)' } : undefined}>
                <IconHeart size={19} /> {saved ? 'ذخیره شد ✓' : 'ذخیره'}
              </button>
            </div>
          </div>

          <div className="gc-list" style={{ gridColumn: 1, gridRow: 1 }}>
            {(d.minis || []).map((m, i) => (
              <div className={`gc-mini ${i === 0 ? 'is-active' : ''}`} key={m.title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 15.5 }}>{m.title}</b>
                  <span className={`chip ${m.tone === 'green' ? 'soft-green' : m.tone === 'gray' ? '' : 'soft-orange'}`}>{m.badge}</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconClock size={14} /> {m.time}</span>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconBook size={14} /> {m.sessions}</span>
                </div>
                <div className="t-small t-muted">{m.progressLabel}</div>
                <div className={`progress ${m.tone === 'green' ? 'green' : ''}`}><i style={{ width: m.progress, background: m.tone === 'gray' ? 'var(--n500)' : undefined }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const groupClassesSpec = {
  type: 'group-classes', label: 'کلاس‌های گروهی + نقشه صندلی', category: 'ویژه',
  defaults: {
    eyebrow: 'کلاس‌های گروهی در حال ثبت‌نام', title: 'جای خودت را در کلاس انتخاب کن',
    moreLabel: 'همه‌ی کلاس‌های گروهی', moreHref: '/classes',
    main: {
      title: 'حل تمرین فیزیک یازدهم', desc: 'ظرفیت ۱۲ نفر · حضوری، آموزشگاه پارسه، خیابان کارگر شمالی',
      deadline: 'ثبت‌نام تا ۱۰ مهر', taken: [1, 2, 4, 5, 6, 9, 10, 12], booking: [11],
    },
    friendTitle: 'رزرو دوستانه', friendDesc: 'تا ۵ نفر با یک پرداخت؛ برای هر دوست پیامک دعوت ارسال می‌شود',
    pricePerLabel: 'هر جلسه', sessionsLabel: 'تعداد جلسات', discountLabel: 'تخفیف پلکانی ۸ جلسه',
    totalLabel: 'مبلغ قابل پرداخت', perSession: 1500000,
    payLabel: 'ادامه و پرداخت', seatLabel: 'نیمکت', payHref: '/classes/1',
    minis: [
      { title: 'حل تمرین فیزیک یازدهم', badge: '۳ جای خالی', tone: 'orange', time: 'پنجشنبه‌ها ۱۶:۰۰', sessions: '۸ جلسه', progressLabel: '۹ از ۱۲', progress: '75%' },
      { title: 'جمع‌بندی ریاضی نهم', badge: 'تکمیل ظرفیت', tone: 'gray', time: 'دوشنبه‌ها ۱۷:۰۰', sessions: '۶ جلسه', progressLabel: '۱۰ از ۱۰', progress: '100%' },
      { title: 'مکالمه‌ی انگلیسی سطح B1', badge: '۴ جای خالی', tone: 'orange', time: 'شنبه و سه‌شنبه ۱۹:۰۰', sessions: '۱۲ جلسه', progressLabel: '۸ از ۱۲', progress: '66%' },
      { title: 'فیزیک پایه · مفهومی', badge: '۵ جای خالی', tone: 'green', time: 'یکشنبه‌ها ۱۸:۰۰', sessions: '۱۰ جلسه', progressLabel: '۵ از ۱۰', progress: '50%' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'moreLabel', label: 'متن لینک بیشتر', type: 'text' },
    { key: 'moreHref', label: 'لینک بیشتر', type: 'text' },
    { key: 'main.title', label: 'عنوان کلاس اصلی', type: 'text' },
    { key: 'main.desc', label: 'توضیح کلاس اصلی', type: 'text' },
    { key: 'main.deadline', label: 'مهلت ثبت‌نام', type: 'text' },
    { key: 'friendTitle', label: 'عنوان رزرو دوستانه', type: 'text' },
    { key: 'friendDesc', label: 'توضیح رزرو دوستانه', type: 'text' },
    { key: 'perSession', label: 'قیمت هر جلسه (تومان)', type: 'number' },
    { key: 'payLabel', label: 'متن دکمه پرداخت', type: 'text' },
    { key: 'seatLabel', label: 'برچسب صندلی', type: 'text' },
    {
      key: 'minis', label: 'کلاس‌های کناری', type: 'list', itemLabel: 'title',
      fields: [
        { key: 'title', label: 'عنوان', type: 'text' }, { key: 'badge', label: 'نشان', type: 'text' },
        { key: 'tone', label: 'رنگ', type: 'select', options: ['orange', 'green', 'gray'] },
        { key: 'time', label: 'زمان', type: 'text' }, { key: 'sessions', label: 'تعداد جلسه', type: 'text' },
        { key: 'progressLabel', label: 'متن پیشرفت', type: 'text' }, { key: 'progress', label: 'درصد نوار', type: 'text' },
      ],
    },
  ],
};

/* ================= CLUB BAND ================= */
export function ClubBandBlock({ node }) {
  const d = node.props;
  return (
    <section className="section-tight" id="club">
      <div className="container">
        <div className="club-band">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1.15fr', alignItems: 'center', gap: 40 }}>
            <div>
              <span className="eyebrow on-dark">{d.eyebrow}</span>
              <h2 className="t-h2" style={{ marginTop: 16 }}>{d.title}</h2>
              <p style={{ opacity: 0.85, lineHeight: 2.1, marginTop: 14, fontSize: 16 }}>{d.sub}</p>

              <div className="club-coins" style={{ marginTop: 26 }}>
                {(d.coins || []).map((c) => (
                  <div className="club-coin-box" key={c.label}>
                    <div className="coins"><IconCoins size={20} /> {c.value}</div>
                    <div className="l">{c.label}</div>
                  </div>
                ))}
              </div>

              <Link to={d.ctaHref || '/login'} className="btn btn-orange btn-lg" style={{ marginTop: 26 }}>
                {d.ctaLabel} <IconArrowLeft size={19} />
              </Link>
            </div>

            <div className="glass-dark" style={{ borderRadius: 'var(--r-xl)', padding: 26 }}>
              <div className="club-levels">
                {(d.levels || []).map((l) => (
                  <div className={`club-level ${l.now ? 'is-now' : ''}`} key={l.name}>
                    <div className="crown"><IconCrown size={20} /></div>
                    <b>{l.name}</b>
                    <span>{l.range}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.9, marginBottom: 8 }}>
                  <span>{d.progressLeft}</span>
                  <span>{d.progressRight}</span>
                </div>
                <div className="progress on-dark">
                  <i style={{ width: d.progressWidth || '72%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const clubBandSpec = {
  type: 'club-band', label: 'بنر نیمکت کلاب', category: 'ویژه',
  defaults: {
    eyebrow: 'نیمکت کلاب', title: 'هر کلاس، یک قدم تا نیمکت طلایی',
    sub: 'با شرکت در کلاس، نظر دادن و دعوت دوستان سکه جمع کن. سطح طلایی دو جلسه‌ی رایگان با برترین استاد پلتفرم دارد.',
    coins: [
      { value: '۵۰ سکه', label: 'هر کلاس موفق' }, { value: '۲۰ سکه', label: 'دعوت از دوست' },
      { value: '۱۵ سکه', label: 'تکمیل پروفایل' }, { value: '۱۰ سکه', label: 'نظرسنجی پایان کلاس' },
    ],
    ctaLabel: 'مشاهده‌ی مأموریت‌ها', ctaHref: '/login',
    levels: [
      { name: 'پلاتینیوم', range: 'از ۴٬۰۰۰ سکه', now: false }, { name: 'طلایی', range: 'از ۱٬۵۰۰ سکه', now: true },
      { name: 'نقره‌ای', range: 'از ۵۰۰ سکه', now: false }, { name: 'برنزی', range: 'از ۰ سکه', now: false },
    ],
    progressLeft: 'سطح فعلی شما: نقره‌ای · ۱٬۱۲۰ سکه', progressRight: '۳۸۰ سکه تا طلایی', progressWidth: '72%',
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'sub', label: 'توضیح', type: 'textarea' },
    { key: 'ctaLabel', label: 'متن دکمه', type: 'text' },
    { key: 'ctaHref', label: 'لینک دکمه', type: 'text' },
    { key: 'coins', label: 'جعبه‌های سکه', type: 'list', itemLabel: 'label', fields: [{ key: 'value', label: 'مقدار', type: 'text' }, { key: 'label', label: 'برچسب', type: 'text' }] },
    { key: 'levels', label: 'سطح‌ها', type: 'list', itemLabel: 'name', fields: [{ key: 'name', label: 'نام', type: 'text' }, { key: 'range', label: 'بازه', type: 'text' }, { key: 'now', label: 'سطح فعلی', type: 'toggle' }] },
    { key: 'progressLeft', label: 'متن چپ نوار', type: 'text' },
    { key: 'progressRight', label: 'متن راست نوار', type: 'text' },
    { key: 'progressWidth', label: 'عرض نوار (٪)', type: 'text' },
  ],
};

/* ================= PROMO DUO ================= */
export function PromoDuoBlock({ node }) {
  const d = node.props;
  return (
    <section className="section-tight" id="parents">
      <div className="container grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="promo-dark" style={{ gridColumn: 2, gridRow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <span className="chip dark" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
              <IconCap size={15} /> {d.teacherChip}
            </span>
          </div>
          <h3 className="t-h3">{d.teacherTitle}</h3>
          <p style={{ opacity: 0.85, lineHeight: 2.1 }}>{d.teacherText}</p>
          <div className="promo-stats">
            {(d.teacherStats || []).map((s) => (
              <div key={s.label}><div className="v">{s.value}</div><div className="l">{s.label}</div></div>
            ))}
          </div>
          <div>
            <Link to={d.teacherBtnHref || '/login?mode=teacher'} className="btn btn-orange">
              {d.teacherBtnLabel} <IconArrowLeft size={18} />
            </Link>
          </div>
        </div>

        <div className="promo-orange" style={{ gridColumn: 1, gridRow: 1 }}>
          <div>
            <span className="chip outline-green" style={{ background: '#fff' }}>
              <IconUsers size={15} /> {d.parentChip}
            </span>
          </div>
          <h3 className="t-h3">{d.parentTitle}</h3>
          <p className="t-muted" style={{ lineHeight: 2.1 }}>{d.parentText}</p>
          <ul className="check-list">
            {(d.parentChecks || []).map((c) => <li key={c}><IconCheck size={18} /> {c}</li>)}
          </ul>
          <div>
            <Link to={d.parentBtnHref || '/login'} className="btn btn-primary">{d.parentBtnLabel}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export const promoDuoSpec = {
  type: 'promo-duo', label: 'دو بنر اساتید/والدین', category: 'ویژه',
  defaults: {
    teacherChip: 'برای اساتید', teacherTitle: 'کلاس‌هایت را خودت قیمت‌گذاری کن',
    teacherText: 'ثبت‌نام، بررسی مدارک و مصاحبه حداکثر ۷۲ ساعت طول می‌کشد. تسویه‌ی درآمد هر دو هفته یک‌بار به حساب شبای شما.',
    teacherStats: [{ value: '۸۵٪', label: 'سهم استاد از هر جلسه' }, { value: '۷۲ ساعت', label: 'زمان بررسی درخواست' }],
    teacherBtnLabel: 'ثبت درخواست همکاری', teacherBtnHref: '/login?mode=teacher',
    parentChip: 'ویژه والدین', parentTitle: 'پیشرفت فرزندتان را جلسه به جلسه ببینید',
    parentText: 'گزارش حضور، تکلیف‌ها و نظر استاد بعد از هر جلسه به پنل شما می‌آید. پرداخت و لغو کلاس هم از همان‌جا انجام می‌شود.',
    parentChecks: ['گزارش هفتگی', 'گروه والدین در نیم‌چت', 'مشاوره‌ی رایگان'],
    parentBtnLabel: 'ساخت حساب والدین', parentBtnHref: '/login',
  },
  fields: [
    { key: 'teacherChip', label: 'نشان اساتید', type: 'text' },
    { key: 'teacherTitle', label: 'عنوان اساتید', type: 'text' },
    { key: 'teacherText', label: 'متن اساتید', type: 'textarea' },
    { key: 'teacherStats', label: 'آمار اساتید', type: 'list', itemLabel: 'label', fields: [{ key: 'value', label: 'مقدار', type: 'text' }, { key: 'label', label: 'برچسب', type: 'text' }] },
    { key: 'teacherBtnLabel', label: 'دکمه اساتید', type: 'text' },
    { key: 'teacherBtnHref', label: 'لینک دکمه اساتید', type: 'text' },
    { key: 'parentChip', label: 'نشان والدین', type: 'text' },
    { key: 'parentTitle', label: 'عنوان والدین', type: 'text' },
    { key: 'parentText', label: 'متن والدین', type: 'textarea' },
    { key: 'parentChecks', label: 'موارد تیک‌دار (با | جدا کنید)', type: 'text' },
    { key: 'parentBtnLabel', label: 'دکمه والدین', type: 'text' },
    { key: 'parentBtnHref', label: 'لینک دکمه والدین', type: 'text' },
  ],
};

/* ================= TESTIMONIALS ================= */
export function TestimonialsBlock({ node }) {
  const d = node.props;
  return (
    <section className="section testi-band">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow green">{d.eyebrow}</span>
            <h2 className="section-title">{d.title}</h2>
          </div>
          <div className="testi-score">
            <div style={{ textAlign: 'center' }}>
              <div className="big num">{d.score}</div>
              <Stars />
              <div className="t-caption t-muted" style={{ marginTop: 4 }}>{d.scoreLabel}</div>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {(d.items || []).map((t) => (
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
  );
}

export const testimonialsSpec = {
  type: 'testimonials', label: 'نظرات کاربران', category: 'ویژه',
  defaults: {
    eyebrow: 'نظر شاگردها و والدین', title: 'نظرات کاربران نیمکت از زبان خودشان',
    score: '۴٫۸', scoreLabel: 'میانگین ۱۲٬۴۰۰ نظر',
    items: [
      { text: 'قبلاً هر ترم دنبال معلم می‌گشتیم. این‌جا گزارش هر جلسه را می‌بینم و اگر جلسه‌ای لغو شود همان روز استاد جایگزین پیشنهاد می‌شود.', name: 'فاطمه احمدی', letter: 'ف', role: 'مادر هستی، پایه ششم', color: 'tint-orange' },
      { text: 'کلاس گروهی فیزیک با چهار نفر از بچه‌های مدرسه گرفتیم. هم ارزان‌تر درآمد هم رفع اشکال بعد کلاس در نیم‌چت خیلی کمک کرد.', name: 'حسین نوری', letter: 'ح', role: 'پشت کنکور تجربی', color: 'tint-green' },
      { text: 'از روی ویدیوی معرفی استاد انتخاب کردم. جلسه‌ی اول که حس کردم سطح کلاس بالاست، زمان را عوض کردند بدون هزینه.', name: 'زهرا کریمی', letter: 'ز', role: 'دانش‌آموز پایه دهم', color: 'green' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'score', label: 'امتیاز کل', type: 'text' },
    { key: 'scoreLabel', label: 'زیر امتیاز', type: 'text' },
    {
      key: 'items', label: 'نظرها', type: 'list', itemLabel: 'name',
      fields: [
        { key: 'text', label: 'متن نظر', type: 'textarea' }, { key: 'name', label: 'نام', type: 'text' },
        { key: 'letter', label: 'حرف آواتار', type: 'text' }, { key: 'role', label: 'نقش', type: 'text' },
        { key: 'color', label: 'رنگ', type: 'select', options: ['tint-orange', 'tint-green', 'green'] },
      ],
    },
  ],
};

/* ================= MAGAZINE ================= */
export function MagazineBlock({ node }) {
  const d = node.props;
  return (
    <section className="section" id="magazine">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow">{d.eyebrow}</span>
            <h2 className="section-title">{d.title}</h2>
            <p className="section-sub">{d.sub}</p>
          </div>
          <a href={d.moreHref || '#magazine'} className="link-more">
            {d.moreLabel} <IconArrowLeft size={17} />
          </a>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {(d.items || []).map((m) => (
            <a className="mag-card" href={m.href || '#magazine'} key={m.title}>
              <div className="mag-cover" style={{ background: m.grad }}>
                <span className="tag chip dark">{m.tag}</span>
                <IconBook size={54} style={{ color: 'rgba(255,255,255,.35)' }} />
              </div>
              <div className="mag-body">
                <h4>{m.title}</h4>
                <div className="mag-meta">
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconClock size={13} /> {m.meta0}</span>
                  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconCalendar size={13} /> {m.meta1}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export const magazineSpec = {
  type: 'magazine', label: 'مجله نیمکت', category: 'ویژه',
  defaults: {
    eyebrow: 'مجله نیمکت', title: 'برای بهتر درس خواندن بخوانید',
    sub: 'راهنمای درس‌خواندن، مدیریت زمان و انتخاب رشته — کوتاه و کاربردی.',
    moreLabel: 'همه‌ی مطالب مجله', moreHref: '#magazine',
    items: [
      { tag: 'مدیریت مطالعه', title: 'برنامه‌ریزی هفتگی برای کنکوری‌ها؛ از کجا شروع کنیم؟', meta0: '۸ دقیقه مطالعه', meta1: '۱۲ مهر', grad: 'linear-gradient(135deg,#0a6847,#21a878)' },
      { tag: 'راهنمای والدین', title: 'چطور پیشرفت فرزندمان را جلسه به جلسه بسنجیم؟', meta0: '۶ دقیقه مطالعه', meta1: '۹ مهر', grad: 'linear-gradient(135deg,#f28a3d,#f6b37a)' },
      { tag: 'معرفی رشته', title: 'فیزیک یازدهم؛ سخت‌ترین مفاهیم و راه سادهٔ یادگیری‌شان', meta0: '۱۰ دقیقه مطالعه', meta1: '۵ مهر', grad: 'linear-gradient(135deg,#053d29,#0a6847)' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'sub', label: 'توضیح', type: 'textarea' },
    { key: 'moreLabel', label: 'متن لینک', type: 'text' },
    {
      key: 'items', label: 'مقالات', type: 'list', itemLabel: 'title',
      fields: [
        { key: 'tag', label: 'برچسب', type: 'text' }, { key: 'title', label: 'عنوان', type: 'textarea' },
        { key: 'meta0', label: 'زمان مطالعه', type: 'text' }, { key: 'meta1', label: 'تاریخ', type: 'text' },
        { key: 'grad', label: 'گرادیان کاور (CSS)', type: 'text' },
      ],
    },
  ],
};

/* ================= FAQ ================= */
export function FaqBlock({ node }) {
  const d = node.props;
  const [open, setOpen] = useState(0);
  return (
    <section className="section-tight" id="faq">
      <div className="container grid" style={{ gridTemplateColumns: '1fr 1.75fr', alignItems: 'start' }}>
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          {(d.items || []).map((f, i) => (
            <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={f.q} style={{ marginBottom: 12 }}>
              <div className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="pm">{open === i ? '−' : '+'}</span>
              </div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>

        <div style={{ gridColumn: 1, gridRow: 1 }}>
          <span className="eyebrow">{d.eyebrow}</span>
          <h2 className="t-h3" style={{ marginTop: 14 }}>{d.title}</h2>
          <p className="t-small t-muted" style={{ lineHeight: 2.1, margin: '12px 0 20px' }}>{d.sub}</p>
          <div className="support-box">
            {(d.support || []).map((s, si) => (
              <div className="row" key={si}>
                <Ic name={s.icon} size={22} style={{ color: s.tone === 'accent' ? 'var(--accent-800)' : 'var(--primary)' }} />
                <div>
                  <b style={{ fontSize: 14 }}>{s.title}</b>
                  <div className={`t-small t-muted ${s.num ? 'num' : ''}`}>{s.desc}</div>
                </div>
                {s.chip ? <span className="chip soft-green" style={{ marginRight: 'auto' }}>{s.chip}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const faqSpec = {
  type: 'faq', label: 'سوالات پرتکرار', category: 'ویژه',
  defaults: {
    eyebrow: 'سوالات پرتکرار', title: 'قبل از رزرو بدانید',
    sub: 'جواب سوالتان را پیدا نکردید؟ کارشناس‌های ما از ۸ صبح تا ۸ شب پاسخگو هستند.',
    support: [
      { icon: 'headset', title: 'پشتیبانی تلفنی', desc: '۰۲۱-۹۱۰۰۴۵۶۰', num: true, chip: 'چت آنلاین' },
      { icon: 'sparkle', title: 'پشتیبانی تلفنی', desc: 'شنبه تا پنجشنبه ۸ تا ۲۰', num: false, tone: 'accent' },
    ],
    items: [
      { q: 'اگر از استاد راضی نبودم چه می‌شود؟', a: 'تا پایان جلسه‌ی اول می‌توانید درخواست تغییر استاد بدهید. مبلغ جلسات باقی‌مانده بدون کسر به کیف پول شما برمی‌گردد یا برای استاد جدید استفاده می‌شود.' },
      { q: 'کلاس‌های آنلاین روی چه بستری برگزار می‌شوند؟', a: 'بیشتر کلاس‌ها روی اسکای‌روم با قلم نوری برگزار می‌شود. برای هر کلاس، بستر برگزاری در صفحه‌ی کلاس مشخص است و قبل از جلسه تست فنی رایگان دارید.' },
      { q: 'رزرو دوستانه چطور محاسبه می‌شود؟', a: 'در رزرو دوستانه تا ۵ نفر با یک پرداخت ثبت‌نام می‌کنند و تخفیف پلکانی و تخفیف گروهی روی مبلغ نهایی اعمال می‌شود. برای هر دوست پیامک دعوت با لینک کلاس ارسال می‌شود.' },
      { q: 'برای کلاس حضوری در منزل، استاد تا کجا می‌آید؟', a: 'در تهران مناطق ۱ تا ۶ پوشش داده می‌شود. در شهرهای دیگر کلاس حضوری در آموزشگاه‌های طرف قرارداد نیمکت برگزار می‌شود.' },
      { q: 'لغو کلاس تا چه زمانی رایگان است؟', a: 'لغو تا ۲۴ ساعت قبل از جلسه رایگان است و مبلغ به کیف پول برمی‌گردد. لغو کمتر از ۲۴ ساعت، ۵۰٪ مبلغ همان جلسه را کسر می‌کند.' },
    ],
  },
  fields: [
    { key: 'eyebrow', label: 'عنوان کوچک', type: 'text' },
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'sub', label: 'توضیح', type: 'textarea' },
    { key: 'items', label: 'سوال‌ها', type: 'list', itemLabel: 'q', fields: [{ key: 'q', label: 'سوال', type: 'text' }, { key: 'a', label: 'پاسخ', type: 'textarea' }] },
    { key: 'support', label: 'جعبه پشتیبانی', type: 'list', itemLabel: 'title', fields: [{ key: 'icon', label: 'آیکون', type: 'select', options: ['headset', 'sparkle', 'clock', 'check'] }, { key: 'title', label: 'عنوان', type: 'text' }, { key: 'desc', label: 'توضیح', type: 'text' }, { key: 'chip', label: 'نشان', type: 'text' }] },
  ],
};

/* ================= CALLBACK ================= */
export function CallbackBlock({ node }) {
  const d = node.props;
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const requestCallback = async () => {
    const digits = String(phone).replace(/[\u06F0-\u06F9]/g, (x) => String(x.charCodeAt(0) - 0x06F0)).replace(/[^\d]/g, '');
    if (digits.length !== 11 || !digits.startsWith('09')) { toast('شماره موبایل ۱۱ رقمی معتبر وارد کنید', 'err'); return; }
    try {
      await api('/callback', { method: 'POST', body: { phone: digits } });
      setSent(true);
      toast('درخواست تماس ثبت شد ✓');
    } catch (e) { toast(e.message || 'خطا در ثبت درخواست', 'err'); }
  };
  return (
    <section className="section-tight" id="callback">
      <div className="container">
        <div className="callback">
          <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', gap: 32 }}>
            <div>
              <h2 className="t-h3">{d.title}</h2>
              <p className="t-muted" style={{ lineHeight: 2.1, marginTop: 12 }}>{d.sub}</p>
            </div>
            <div>
              {sent ? (
                <div className="card-soft" style={{ padding: 22, textAlign: 'center', borderColor: 'rgba(10,104,71,.4)', background: 'var(--secondary-50)' }}>
                  <b style={{ fontSize: 16, color: 'var(--primary)' }}>{d.successTitle}</b>
                  <div className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
                    {d.successText} <b className="num">{faNum(phone)}</b> {d.successText2}
                  </div>
                </div>
              ) : (
                <>
                  <label className="field-label">{d.inputLabel}</label>
                  <div className="callback-form" style={{ marginTop: 8 }}>
                    <input className="input num" placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰" value={phone} onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && requestCallback()} style={{ direction: 'ltr', textAlign: 'right' }} />
                    <button className="btn btn-primary" type="button" onClick={requestCallback}>{d.btnLabel}</button>
                  </div>
                  <div className="field-hint" style={{ marginTop: 10 }}>
                    <IconLock size={14} /> {d.hint}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const callbackSpec = {
  type: 'callback', label: 'فرم درخواست تماس', category: 'ویژه',
  defaults: {
    title: 'نمی‌دانید از کجا شروع کنید؟',
    sub: 'شماره‌تان را بگذارید؛ مشاور تحصیلی نیمکت امروز تماس می‌گیرد و بر اساس سطح و هدف، استاد و نوع کلاس پیشنهاد می‌دهد. رایگان.',
    inputLabel: 'شماره موبایل', btnLabel: 'درخواست تماس', hint: 'شماره‌ی شما فقط برای همین تماس استفاده می‌شود.',
    successTitle: 'درخواست تماس شما ثبت شد ✓',
    successText: 'مشاور تحصیلی نیمکت امروز با شماره‌ی', successText2: 'تماس می‌گیرد.',
  },
  fields: [
    { key: 'title', label: 'عنوان', type: 'text' }, { key: 'sub', label: 'توضیح', type: 'textarea' },
    { key: 'inputLabel', label: 'برچسب ورودی', type: 'text' }, { key: 'btnLabel', label: 'متن دکمه', type: 'text' },
    { key: 'hint', label: 'متن راهنما', type: 'text' },
    { key: 'successTitle', label: 'عنوان موفقیت', type: 'text' },
    { key: 'successText', label: 'متن موفقیت (قبل شماره)', type: 'text' },
    { key: 'successText2', label: 'متن موفقیت (بعد شماره)', type: 'text' },
  ],
};
