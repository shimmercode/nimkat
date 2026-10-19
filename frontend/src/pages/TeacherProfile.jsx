import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import {
  IconStar, IconCheck, IconPlay, IconShield, IconClock, IconUsers, IconBook,
  IconArrowLeft, IconChatPlaceholder, IconPin, IconVideo, IconHeart,
} from '../components/icons.jsx';

const TABS = ['معرفی', 'کلاس‌های فعال', 'زمان‌های آزاد', 'نظرات', 'پرسش و پاسخ', 'سوابق و مدارک', 'گزارش آموزشی'];
const DAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];

export default function TeacherProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('معرفی');
  const [question, setQuestion] = useState('');
  const [day, setDay] = useState('دوشنبه');

  useEffect(() => {
    api(`/teachers/${id}`).then(setData).catch(() => setData(null));
  }, [id]);

  if (!data) return <div className="container section">در حال بارگذاری…</div>;
  const { teacher: t, reviews, questions, groupClasses } = data;

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    await api('/questions', { method: 'POST', body: { teacherId: t.id, text: question } });
    setQuestion('');
    alert('سؤال شما برای استاد ارسال شد؛ معمولاً کمتر از ۲ ساعت پاسخ می‌دهد.');
  };

  return (
    <div className="tp-page">
      <div className="tp-band">
        <div className="container">
          <nav className="crumbs">
            <Link to="/">خانه</Link> / <Link to="/classes">اساتید</Link> / <span>{t.subject}</span> / <b>{t.name}</b>
          </nav>

          <div className="tp-head2">
            <div className="tp-id">
              <span className="tp-avatar">{t.name[0]}<i><IconShield size={13} /></i></span>
              <div>
                <div className="tp-badges">
                  <span className="chip">{t.platform}</span>
                  <span className="chip">سطح: {t.level}</span>
                  {t.month_badge ? <span className="chip chip-dark">برتر ماه</span> : null}
                </div>
                <h1>{t.name}</h1>
                <p>{t.title}</p>
                <div className="tp-subject-chips">
                  {['فیزیک دهم تا دوازدهم', 'ریاضی نهم', 'حل تمرین', 'آمادگی امتحان نهایی', 'کنکور ریاضی'].slice(0, t.id === 1 ? 5 : 3).map((s) => (
                    <span className="chip" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="tp-cta">
              <Link to={`/classes/${t.id === 1 ? 5 : 1}`} className="btn btn-primary btn-block">
                شروع رزرو جلسه
                <IconArrowLeft size={16} />
              </Link>
              <Link to="/login?next=/panel/chat" className="btn btn-outline btn-block">
                <IconChatPlaceholder size={16} />
                پرسیدن سؤال از استاد
              </Link>
              <span className="muted tp-fast">معمولاً کمتر از ۲ ساعت پاسخ می‌دهد</span>
            </div>
          </div>

          <div className="tp-stats2">
            <span><b>{faNum(String(t.rating).replace('.', '٫'))}</b><em>از {faNum(t.reviews_count)} نظر</em></span>
            <span><b>{faNum(t.classes_held)}</b><em>جلسهٔ برگزارشده</em></span>
            <span><b>{faNum(t.students)}</b><em>شاگرد</em></span>
            <span><b>{faNum(t.years)} سال</b><em>سابقهٔ تدریس</em></span>
            <span><b>۹۸٪</b><em>حضور به‌موقع</em></span>
          </div>
        </div>
      </div>

      <div className="tp-tabsbar">
        <div className="container tp-tabs">
          {TABS.map((x) => (
            <button key={x} className={`tp-tab${tab === x ? ' active' : ''}`} onClick={() => setTab(x)}>
              {x}
              {x === 'نظرات' ? ` (${faNum(t.reviews_count)})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="container tp-grid">
        <div className="tp-content">
          {tab === 'معرفی' && (
            <>
              <section className="card tp-sec">
                <h3>دربارهٔ من</h3>
                <div className="tp-video2">
                  <button className="tp-play"><IconPlay size={22} /></button>
                  <b>ویدیوی معرفی · ۱ دقیقه و ۲۰ ثانیه</b>
                  <span>پخش از آپارات</span>
                </div>
                <p className="tp-about">{t.about}</p>
                <div className="tp-feats">
                  <span><i><IconBook size={18} /></i><b>{t.methods}</b><em>روش تدریس</em></span>
                  <span><i><IconVideo size={18} /></i><b>{t.platform}</b><em>بستر آنلاین</em></span>
                  <span><i><IconPin size={18} /></i><b>{t.areas}</b><em>حضوری</em></span>
                </div>
              </section>

              <section className="card tp-sec">
                <div className="card-head">
                  <h3>زمان‌های آزاد هفتهٔ آینده</h3>
                  <div className="head-arrows">
                    <button className="icon-btn">›</button>
                    <button className="icon-btn">‹</button>
                  </div>
                </div>
                <div className="slots-week">
                  {t.slots.map((s, i) => (
                    <button
                      className={`slot-col${day === s.day ? ' active' : ''}`}
                      key={s.day}
                      onClick={() => setDay(s.day)}
                    >
                      <b>{s.day}</b>
                      <em>{faNum(5 + i)} مهر</em>
                      <span className="slot-times">
                        {s.times.map((x) => (
                          <span className={`slot-t${x.full ? ' full' : ''}`} key={x.t}>{x.t}</span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="muted slot-note">همهٔ زمان‌ها به وقت تهران است. هر جلسه ۹۰ دقیقه.</p>
              </section>
            </>
          )}

          {tab === 'کلاس‌های فعال' && (
            <section className="tp-sec">
              {groupClasses.map((c) => (
                <Link to={`/classes/${c.id}`} className="card class-card" key={c.id} style={{ display: 'block', marginBottom: 12 }}>
                  <div className="class-top">
                    <span className="class-title">{c.title}</span>
                    <span className={`seat-badge${c.taken >= c.capacity ? ' full' : ''}`}>
                      {c.taken >= c.capacity ? 'تکمیل' : `${faNum(c.capacity - c.taken)} جای خالی`}
                    </span>
                  </div>
                  <div className="class-meta">
                    <span><IconClock size={14} /> {c.days} {c.time}</span>
                    <span><IconBook size={14} /> {faNum(c.sessions)} جلسه</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {tab === 'زمان‌های آزاد' && (
            <section className="card tp-sec">
              <h3>همهٔ زمان‌های آزاد</h3>
              <div className="slots-week" style={{ marginTop: 14 }}>
                {t.slots.map((s) => (
                  <span className="slot-col" key={s.day}>
                    <b>{s.day}</b>
                    <span className="slot-times">
                      {s.times.map((x) => (
                        <span className={`slot-t${x.full ? ' full' : ''}`} key={x.t}>{x.t}</span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {tab === 'نظرات' && (
            <section className="card tp-sec">
              <div className="card-head">
                <h3>نظرات شاگردها</h3>
                <span className="link-green">همهٔ {faNum(t.reviews_count)} نظر</span>
              </div>
              <div className="rate-summary">
                <div className="rs-score">
                  <b>{faNum(String(t.rating).replace('.', '٫'))}</b>
                  <span className="stars">{[...Array(5)].map((_, i) => <IconStar key={i} size={15} />)}</span>
                  <em>{faNum(t.reviews_count)} نظر</em>
                </div>
                <div className="rs-bars">
                  {t.subratings.map((s) => (
                    <span className="rs-row" key={s.label}>
                      <em>{s.label}</em>
                      <span className="progress-bar"><span className="progress-fill orange" style={{ width: `${(parseFloat(s.value.replace('٫', '.')) / 5) * 100}%` }} /></span>
                      <b>{s.value}</b>
                    </span>
                  ))}
                </div>
              </div>
              {reviews.map((r) => (
                <article className="review-card" key={r.id}>
                  <div className="test-user">
                    <span className={`test-avatar ${r.color}`}>{r.letter}</span>
                    <span><b>{r.author}</b><span>{r.role_label} · {r.date_label}</span></span>
                    <span className="stars" style={{ marginInlineStart: 'auto' }}>
                      {[...Array(r.rating)].map((_, i) => <IconStar key={i} size={14} />)}
                    </span>
                  </div>
                  <p className="test-text">{r.text}</p>
                  <div className="rv-foot">
                    <span className="chip"><IconCheck size={12} /> شاگرد تأییدشده</span>
                    <span className="chip">مفید بود ({faNum(r.helpful)})</span>
                    {r.replied && <span className="chip chip-mint">پاسخ استاد ثبت شده</span>}
                  </div>
                </article>
              ))}
            </section>
          )}

          {tab === 'پرسش و پاسخ' && (
            <section className="card tp-sec">
              <div className="card-head">
                <h3>سوابق تحصیلی و حرفه‌ای</h3>
                <span className="muted" style={{ fontSize: 12 }}>پاسخ‌های عمومی به پرسش‌های شما</span>
              </div>
              {questions.map((q) => (
                <div className="qa-row" key={q.id}>
                  <span className="qa-icon"><IconChatPlaceholder size={16} /></span>
                  <span className="qa-body">
                    <b>{q.text}</b>
                    <em className="muted">{q.author} · {q.date_label}</em>
                    {q.answer && <p>{q.answer}</p>}
                  </span>
                  <span className="chip chip-mint">✓ تأیید شده</span>
                </div>
              ))}
              <form onSubmit={ask} className="cta-row" style={{ marginTop: 14 }}>
                <button className="btn btn-primary">ارسال</button>
                <input className="cta-input" placeholder="پرسش خود را بنویسید…" value={question} onChange={(e) => setQuestion(e.target.value)} />
              </form>
            </section>
          )}

          {tab === 'سوابق و مدارک' && (
            <section className="card tp-sec">
              <h3>سوابق تحصیلی و حرفه‌ای</h3>
              {t.history.map((h) => (
                <div className="qa-row" key={h.title}>
                  <span className="qa-icon"><IconBook size={16} /></span>
                  <span className="qa-body"><b>{h.title}</b><em className="muted">{h.org} · {faNum(h.year)}</em></span>
                </div>
              ))}
              <h3 style={{ marginTop: 18 }}>مدارک</h3>
              <div className="cred-grid">
                {t.credentials.map((c) => (
                  <span className="cred" key={c.title}><IconShield size={16} /> {c.title}<em>{c.status}</em></span>
                ))}
              </div>
              <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>مدارک توسط کارشناس نیمکت بررسی شده است.</p>
            </section>
          )}

          {tab === 'گزارش آموزشی' && (
            <section className="card tp-sec">
              <h3>گزارش آموزشی</h3>
              <p className="muted">
                هر جلسه ۳۰ دقیقه مرور مفهوم و ۴۵ دقیقه حل مسئله دارد. بعد از هر جلسه گزارش
                کوتاه برای شاگرد و والدین ارسال می‌شود.
              </p>
            </section>
          )}
        </div>

        <aside className="tp-side">
          <div className="card book-side">
            <span className="muted" style={{ fontSize: 12 }}>هر جلسهٔ {faNum(t.session_minutes)} دقیقه</span>
            <b className="bs-price">{faPrice(t.price)} <em>تومان</em></b>
            <div className="bs-tiers">
              <span><em>۴ جلسه</em> ۵٪ تخفیف</span>
              <span><em>۸ جلسه</em> ۱۰٪ تخفیف</span>
              <span><em>۱۶ جلسه</em> ۱۵٪ تخفیف</span>
            </div>
            <Link to={`/classes/${t.id === 1 ? 5 : 1}`} className="btn btn-primary btn-block">
              انتخاب زمان و رزرو
              <IconArrowLeft size={16} />
            </Link>
            <ul className="tp-guarantees">
              <li><IconCheck size={15} /> جلسهٔ اول با ضمانت</li>
              <li><IconClock size={15} /> لغو رایگان تا ۲۴ ساعت قبل از جلسه</li>
              <li><IconUsers size={15} /> رزرو دوستانه تا ۵ نفر</li>
              <li><IconShield size={15} /> پرداخت امن از درگاه بانکی</li>
            </ul>
          </div>

          <div className="card book-side">
            <b>کلاس‌های گروهی فعال</b>
            {groupClasses.map((c) => (
              <Link to={`/classes/${c.id}`} className="bs-class" key={c.id}>
                <span><b>{c.title}</b><em className="muted">{c.days} {c.time} · {faNum(c.sessions)} جلسه</em></span>
                <span className={`seat-badge${c.taken >= c.capacity ? ' full' : ''}`}>
                  {c.taken >= c.capacity ? 'تکمیل' : `${faNum(c.capacity - c.taken)} جای خالی`}
                </span>
              </Link>
            ))}
          </div>

          <div className="card book-side">
            <b>مدارک</b>
            {t.credentials.map((c) => (
              <span className="bs-cred" key={c.title}><IconShield size={15} /> {c.title}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
