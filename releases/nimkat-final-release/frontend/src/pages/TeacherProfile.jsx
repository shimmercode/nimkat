import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  IconStar, IconGlobe, IconMapPin, IconChat, IconShield, IconArrowLeft, IconClock,
  IconUserPlus, IconLock, IconRefresh, IconPlay, IconVideo, IconBook, IconMedal, IconCap,
  IconCheck, IconHeart, IconInfo, IconCalendar,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { toast } from '../utils/toast.js';

const TABS = ['معرفی', 'کلاس‌های فعال', 'زمان‌های آزاد', 'سوابق و مدارک', 'نظرات (۳۲۰)', 'پرسش و پاسخ', 'گزارش آموزشی'];

const WEEK = [
  { day: 'شنبه', date: '۵ مهر', times: [{ t: '۱۷:۰۰' }, { t: '۱۷:۳۰' }] },
  { day: 'یکشنبه', date: '۶', times: [{ t: '۱۷:۰۰' }] },
  { day: 'دوشنبه', date: '۷', times: [{ t: '۱۸:۰۰' }] },
  { day: 'سه‌شنبه', date: '۸', times: [{ t: '۱۹:۰۰', on: true }, { t: '۱۹:۰۰' }] },
  { day: 'چهارشنبه', date: '۹', times: [{ t: '۱۵:۳۰' }, { t: '۱۶:۳۰' }] },
  { day: 'پنجشنبه', date: '۱۰', times: [{ t: '۱۵:۰۰', full: true }, { t: '۱۶:۰۰' }, { t: '۲۲:۰۰' }] },
];

const REVIEWS = [
  {
    name: 'زهرا کریمی', letter: 'ز', color: 'green', role: 'فیزیک دهم · ۱۲ جلسه', date: 'دو هفته پیش',
    text: 'قبل از کلاس فکر می‌کردم فیزیک یعنی حفظ فرمول. خانم محمدی هر فرمول را اول با یک مثال توضیح می‌دهند. نمره‌ی نوبت اولم از ۱۴ به ۱۸ رسید.',
  },
  {
    name: 'مهدی صالحی', letter: 'م', color: 'tint-orange', role: 'پدر آرین، پایه یازدهم', date: 'یک ماه پیش',
    text: 'گزارش بعد از هر جلسه خیلی دقیق است؛ دقیقاً می‌نویسند کدام مبحث هنوز نیاز به تمرین دارد. یک جلسه هم که پسرم مریض بود بدون هزینه جابه‌جا شد.',
  },
];

export default function TeacherProfile() {
  const { id } = useParams();
  const [tab, setTab] = useState('معرفی');
  const [tier, setTier] = useState(8);
  const [teacher, setTeacher] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [asked, setAsked] = useState(false);
  const [helpful, setHelpful] = useState({});
  const [week, setWeek] = useState(0);
  const [slot, setSlot] = useState(null);
  const weekLabels = ['هفته‌ی ۵ مهر', 'هفته‌ی ۱۲ مهر', 'هفته‌ی ۱۹ مهر', 'هفته‌ی ۲۶ مهر'];
  const tName = teacher?.name || 'سارا محمدی';

  useEffect(() => {
    api(`/teachers/${id || 1}`).then((d) => { if (d.teacher) setTeacher(d.teacher); }).catch(() => {});
  }, [id]);

  const sendQuestion = async () => {
    if (!askText.trim()) { toast('متن سوال را بنویسید', 'err'); return; }
    try {
      await api('/questions', { method: 'POST', body: { teacher_id: Number(id) || 1, text: askText.trim() } });
      setAsked(true);
      setAskOpen(false);
      setAskText('');
      toast('سوال شما برای استاد ارسال شد ✓');
    } catch (e) {
      toast(e.message || 'خطا در ارسال سوال', 'err');
    }
  };

  return (
    <>
      {/* ---------- hero ---------- */}
      <div className="tp-hero">
        <div className="container">
          <div className="crumbs" style={{ margin: '18px 0 22px' }}>
            <Link to="/">خانه</Link>
            <span className="sep">›</span>
            <Link to="/classes">اساتید</Link>
            <span className="sep">›</span>
            <Link to="/classes">فیزیک</Link>
            <span className="sep">›</span>
            <span className="here">{tName}</span>
          </div>

          <div className="tp-card">
            <div style={{ position: 'relative' }}>
              <div className="avatar sq-88" style={{ width: 128, height: 128, fontSize: 46, borderRadius: 'var(--r-2xl)' }}>
                س
              </div>
              <span className="avatar-verified" style={{ width: 36, height: 36, bottom: -6, left: -6 }}>
                <IconShield size={19} />
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="chip dark">۲ برتر ماه</span>
                <span className="chip soft-green">سطح: متخصص</span>
                <span className="chip outline"><IconGlobe size={14} /> آنلاین و حضوری</span>
              </div>
              <h1 className="t-h2">{tName}</h1>
              <p className="t-muted" style={{ marginTop: 10 }}>
                دبیر فیزیک و ریاضی متوسطه دوم · کارشناسی ارشد فیزیک از دانشگاه صنعتی شریف
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {['فیزیک دهم تا دوازدهم', 'ریاضی نهم', 'حل تمرین', 'آمادگی امتحان نهایی', 'کنکور ریاضی'].map((c) => (
                  <span className="chip outline" key={c}>{c}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#book" className="btn btn-primary btn-lg btn-block">
                رزرو جلسه <IconArrowLeft size={19} />
              </a>
              <button className="btn btn-outline btn-block" type="button" onClick={() => setAskOpen((v) => !v)}>
                <IconChat size={18} /> پرسیدن سوال از استاد
              </button>
              {askOpen && (
                <div className="card-soft" style={{ padding: 12 }}>
                  <textarea className="input" rows={3} placeholder="سوال خود را بنویسید…" value={askText} onChange={(e) => setAskText(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
                  <button className="btn btn-primary btn-block" type="button" style={{ marginTop: 8 }} onClick={sendQuestion}>ارسال سوال</button>
                </div>
              )}
              {asked && !askOpen && (
                <div className="t-caption" style={{ color: 'var(--secondary)', fontWeight: 700, textAlign: 'center' }}>سوال شما ارسال شد ✓</div>
              )}
              <div className="field-hint" style={{ justifyContent: 'center' }}>
                <IconClock size={14} /> معمولاً کمتر از ۲ ساعت پاسخ می‌دهد
              </div>
            </div>
          </div>

          {/* stats */}
          <div className="tp-stats">
            <div className="cell">
              <div className="v num" style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                <IconStar size={16} style={{ color: 'var(--accent)' }} /> ۴٫۹
              </div>
              <div className="l">میانگین نظر</div>
            </div>
            <div className="cell">
              <div className="v num">۱٬۸۲۴</div>
              <div className="l">شاگرد</div>
            </div>
            <div className="cell">
              <div className="v num">۴۲۸</div>
              <div className="l">جلسه برگزارشده</div>
            </div>
            <div className="cell">
              <div className="v num">۹ سال</div>
              <div className="l">سابقه‌ی تدریس</div>
            </div>
            <div className="cell">
              <div className="v num">۹۸٪</div>
              <div className="l">حضور به‌موقع</div>
            </div>
          </div>

          {/* tabs */}
          <div className="tp-tabs">
            {TABS.map((t) => (
              <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- content ---------- */}
      <div className="container section-tight" style={{ paddingTop: 8 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 380px', alignItems: 'start' }}>
          {/* left sidebar: booking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, gridColumn: 2, gridRow: 1 }}>
            <div className="book-box" id="book">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="t-caption t-muted">هر جلسه‌ی ۹۰ دقیقه</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }} className="num">
                    {faPrice(280000)}
                  </div>
                  <div className="t-caption t-muted">تومان</div>
                </div>
                <span className="chip soft-green">جلسه‌ی اول با ضمانت</span>
              </div>

              <hr className="divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { s: 4, d: 5 },
                  { s: 8, d: 10 },
                  { s: 16, d: 15 },
                ].map((t) => (
                  <button key={t.s} type="button" className={`tier-row ${tier === t.s ? 'is-on' : ''}`} onClick={() => setTier(t.s)}>
                    <span>{faNum(t.s)} جلسه</span>
                    <span>{faNum(t.d)}٪ تخفیف</span>
                  </button>
                ))}
              </div>

              <a href="#slots" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16 }}>
                انتخاب زمان و رزرو
              </a>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <span className="field-hint"><IconRefresh size={15} /> لغو رایگان تا ۲۴ ساعت قبل از جلسه</span>
                <span className="field-hint"><IconUserPlus size={15} /> رزرو دوستانه تا ۵ نفر</span>
                <span className="field-hint"><IconLock size={15} /> پرداخت امن از درگاه بانکی</span>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16.5 }}>کلاس‌های گروهی فعال</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                <div className="gc-mini is-active">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <b style={{ fontSize: 14 }}>فیزیک یازدهم · نوبت اول</b>
                    <span className="chip soft-orange">۳ جای خالی</span>
                  </div>
                  <div className="t-small t-muted num">پنجشنبه‌ها ۱۶:۰۰ · ۸ جلسه</div>
                </div>
                <div className="gc-mini">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <b style={{ fontSize: 14 }}>جمع‌بندی ریاضی نهم</b>
                    <span className="chip">تکمیل</span>
                  </div>
                  <div className="t-small t-muted num">دوشنبه‌ها ۱۷:۰۰</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16.5 }}>مدارک</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {['مدرک ارشد', 'گواهی المپیاد', 'کارت ملی', 'سابقه‌ی بیمه'].map((d) => (
                  <span className="chip outline" key={d} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <IconBook size={14} /> {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, gridColumn: 1, gridRow: 1 }}>
            {/* about */}
            <div className="card" style={{ borderRadius: 'var(--r-2xl)', padding: 30 }}>
              <h2 className="t-h3">درباره‌ی من</h2>
              <div
                style={{
                  marginTop: 20, borderRadius: 'var(--r-xl)', overflow: 'hidden',
                  background: 'linear-gradient(135deg,#0a6847,#053d29)', height: 300,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
                  color: '#fff', position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 74, height: 74, borderRadius: '50%', background: '#fff', color: 'var(--primary)',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <IconPlay size={30} />
                </div>
                <b>ویدیوی معرفی · ۱ دقیقه و ۲۰ ثانیه</b>
                <span className="t-small" style={{ opacity: 0.75, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <IconVideo size={15} /> پخش از آپارات
                </span>
              </div>

              <p style={{ lineHeight: 2.3, marginTop: 20, textAlign: 'justify' }}>
                نه سال است فیزیک درس می‌دهم؛ پنج سال در دبیرستان‌های منطقه ۳ تهران و از ۱۴۰۱ به‌صورت آنلاین.
                کلاس‌هایم با یک سؤال از زندگی روزمره شروع می‌شود و بعد به فرمول می‌رسیم. برای هر شاگرد بعد از
                جلسه‌ی اول یک برنامه‌ی ۸ جلسه‌ای می‌نویسم و بعد از هر جلسه گزارش کوتاه برای خودش و والدینش
                می‌فرستم.
              </p>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 22, gap: 14 }}>
                <div className="info-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ic"><IconBook size={20} /></span>
                    <b style={{ fontSize: 13.5 }}>روش تدریس</b>
                  </div>
                  <span className="t-small t-muted">مفهومی + حل مسئله‌ی پله‌ای</span>
                </div>
                <div className="info-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ic"><IconVideo size={20} /></span>
                    <b style={{ fontSize: 13.5 }}>بستر آنلاین</b>
                  </div>
                  <span className="t-small t-muted">اسکای‌روم با قلم نوری</span>
                </div>
                <div className="info-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ic"><IconMapPin size={20} /></span>
                    <b style={{ fontSize: 13.5 }}>حضوری</b>
                  </div>
                  <span className="t-small t-muted">مناطق ۱، ۲، ۳ و ۶ تهران</span>
                </div>
              </div>
            </div>

            {/* slots */}
            <div className="card" id="slots" style={{ borderRadius: 'var(--r-2xl)', padding: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <h2 className="t-h3">زمان‌های آزاد هفته‌ی آینده</h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button className="btn-icon-round" type="button" onClick={() => setWeek((w) => Math.max(0, w - 1))}>‹</button>
                  <span className="t-small" style={{ fontWeight: 700 }}>{weekLabels[week]}</span>
                  <button className="btn-icon-round" type="button" onClick={() => setWeek((w) => Math.min(weekLabels.length - 1, w + 1))}>›</button>
                </div>
              </div>

              <div className="slot-grid" style={{ marginTop: 20 }}>
                {WEEK.map((d) => (
                  <div className="slot-day" key={d.day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'center' }}>
                    <div>
                      <b style={{ fontSize: 14 }}>{d.day}</b>
                      <div className="t-caption t-muted num">{d.date}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {d.times.map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { if (t.full) { toast('این ساعت قبلاً رزرو شده است', 'err'); return; } setSlot(`${d.day} ${t.t}`); toast(`ساعت ${t.t} روز ${d.day} انتخاب شد`); }}
                          className={`time-chip num ${slot ? (slot === `${d.day} ${t.t}` ? 'is-on' : '') : t.on ? 'is-on' : ''}${t.full ? ' is-full' : ''}`}
                          style={{ padding: '9px 18px', borderRadius: 'var(--r-md)' }}
                        >
                          {t.full ? 'پر شده' : t.t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="field-hint" style={{ marginTop: 16 }}>
                <IconInfo size={15} /> زمان‌ها به وقت تهران است. هر جلسه ۹۰ دقیقه.
              </div>
            </div>

            {/* credentials / history */}
            <div className="card" style={{ borderRadius: 'var(--r-2xl)', padding: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="t-h3">سوابق تحصیلی و حرفه‌ای</h2>
                <span className="chip soft-green"><IconShield size={14} /> مدارک توسط کارشناس نیمکت بررسی شده</span>
              </div>

              <div style={{ marginTop: 22 }}>
                {[
                  { icon: IconCap, title: 'کارشناسی ارشد فیزیک حالت جامد', org: 'دانشگاه صنعتی شریف · ۱۳۹۴', tag: 'مدرک' },
                  { icon: IconCap, title: 'کارشناسی فیزیک', org: 'دانشگاه تبریز · ۱۳۹۲', tag: 'مدرک' },
                  { icon: IconBook, title: 'دبیر فیزیک، دبیرستان علامه حلی ۳', org: '۱۳۹۷ تا ۱۴۰۰', tag: null },
                  { icon: IconMedal, title: 'مدرس برتر المپیاد فیزیک استان تهران', org: '۱۳۹۸', tag: 'گواهی' },
                ].map((h, i) => (
                  <div key={h.title} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span className="ic avatar sq-52 tint-green" style={{ borderRadius: 'var(--r-md)' }}>
                      <h.icon size={22} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>{h.title}</b>
                      <div className="t-small t-muted">{h.org}</div>
                    </div>
                    {h.tag && (
                      <span className="chip soft-green">
                        <IconCheck size={13} /> تأیید {h.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* reviews */}
            <div className="card" style={{ borderRadius: 'var(--r-2xl)', padding: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="t-h3">نظرات شاگردها</h2>
                <button type="button" className="link-more" onClick={() => toast('۳۲۰ نظر ثبت شده · نمایش محبوب‌ترین‌ها')}>همه‌ی ۳۲۰ نظر <IconArrowLeft size={16} /></button>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '220px 1fr', marginTop: 22, gap: 30 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--primary)' }} className="num">۴٫۹</div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar key={i} size={18} style={{ color: 'var(--accent)' }} />
                    ))}
                  </div>
                  <div className="t-small t-muted">۳۲۰ نظر</div>
                </div>

                <div>
                  <div className="review-bars">
                    {[
                      ['۵', 92], ['۴', 6], ['۳', 1], ['۲', 0.5], ['۱', 0.5],
                    ].map(([s, w]) => (
                      <div key={s} style={{ display: 'contents' }}>
                        <span className="num"><IconStar size={12} style={{ color: 'var(--accent)', display: 'inline' }} /> {s}</span>
                        <div className="mini-bar"><i style={{ width: `${w}%` }} /></div>
                        <span className="num t-muted">{faNum(Math.round(w * 3.12))}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                    {[
                      ['تسلط بر درس', '۴٫۹'], ['بیان و انتقال مفهوم', '۴٫۸'],
                      ['وقت‌شناسی', '۵٫۰'], ['برخورد با شاگرد', '۴٫۹'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--n50)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13 }}>
                        <span className="t-muted">{l}</span>
                        <b className="num">{v}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="divider" style={{ margin: '24px 0' }} />

              {REVIEWS.map((r, i) => (
                <div key={r.name} style={{ paddingTop: i ? 22 : 0, marginTop: i ? 22 : 0, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div className={`avatar sq-52 ${r.color}`}>{r.letter}</div>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 15 }}>{r.name}</b>
                      <div className="t-small t-muted">{r.role}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        {Array.from({ length: 5 }).map((_, k) => (
                          <IconStar key={k} size={13} style={{ color: 'var(--accent)' }} />
                        ))}
                      </div>
                      <div className="t-caption t-muted">{r.date}</div>
                    </div>
                  </div>
                  <p style={{ lineHeight: 2.2, marginTop: 12, color: 'var(--muted)' }}>{r.text}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <span className="chip outline-green"><IconCheck size={13} /> شاگرد تأییدشده</span>
                    <button type="button" onClick={() => setHelpful((h) => ({ ...h, [i]: !h[i] }))} className="t-caption t-muted" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: helpful[i] ? 'var(--primary)' : undefined, fontWeight: helpful[i] ? 800 : undefined }}>
                      <IconHeart size={13} /> مفید بود ({faNum(helpful[i] ? 25 : 24)})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
