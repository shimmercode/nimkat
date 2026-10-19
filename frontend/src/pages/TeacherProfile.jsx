import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import {
  IconStar, IconCheck, IconPlay, IconShield, IconClock, IconUsers, IconBook,
  IconArrowLeft,
} from '../components/icons.jsx';
import { IconVideo, IconMic, IconWifi, IconChatPlaceholder } from '../panelIcons.jsx';

const TABS = ['معرفی', 'کلاس‌های فعال', 'زمان‌های آزاد', 'نظرات', 'پرسش و پاسخ', 'سوابق و مدارک', 'گزارش آموزشی'];

export default function TeacherProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('معرفی');
  const [question, setQuestion] = useState('');

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
    <section className="section" style={{ paddingTop: 30 }}>
      <div className="container">
        <nav className="crumbs">
          <Link to="/">خانه</Link> / <Link to="/classes">اساتید</Link> / <span>{t.subject}</span> / <b>{t.name}</b>
        </nav>

        <div className="tp-grid">
          <div>
            <div className="tp-head card">
              <span className="avatar green" style={{ width: 84, height: 84, fontSize: 32, borderRadius: 22 }}>
                {t.name[0]}
              </span>
              <div className="tp-head-info">
                <div className="tp-badges">
                  {t.month_badge ? <span className="chip chip-month">برتر ماه</span> : null}
                  <span className="chip">سطح: {t.level}</span>
                  <span className="chip">{t.badges[1] || 'وقت‌شناس'}</span>
                </div>
                <h1>{t.name}</h1>
                <p>{t.title}</p>
                <div className="tp-rate">
                  <span className="stars">
                    {[...Array(5)].map((_, i) => <IconStar key={i} size={15} />)}
                  </span>
                  <b>{faNum(String(t.rating).replace('.', '٫'))}</b>
                  <span className="muted">{faNum(t.reviews_count)} نظر</span>
                </div>
                <div className="tp-stats">
                  <span><b>{faNum(t.years)}</b> سال سابقهٔ تدریس</span>
                  <span><b>{faNum(t.students)}</b> شاگرد</span>
                  <span><b>{faNum(t.classes_held)}</b> جلسهٔ برگزارشده</span>
                </div>
              </div>
            </div>

            <div className="tp-tabs">
              {TABS.map((x) => (
                <button key={x} className={`chip chip-btn${tab === x ? ' active' : ''}`} onClick={() => setTab(x)}>
                  {x}
                  {x === 'نظرات' ? ` (${faNum(t.reviews_count)})` : ''}
                </button>
              ))}
            </div>

            {tab === 'معرفی' && (
              <div className="card tp-section">
                <h3>دربارهٔ من</h3>
                <p className="muted">{t.about}</p>
                <div className="tp-methods">
                  <span><IconBook size={16} /> روش تدریس: {t.methods}</span>
                  <span><IconVideo size={16} /> بستر: {t.platform}</span>
                  <span><IconUsers size={16} /> حضوری: {t.areas}</span>
                </div>
                {t.video && (
                  <div className="tp-video">
                    <span className="tp-video-play"><IconPlay size={18} /></span>
                    <span>
                      <b>{t.video}</b>
                      <span className="muted"> پخش از آپارات</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === 'کلاس‌های فعال' && (
              <div className="tp-section">
                <h3 style={{ marginBottom: 14 }}>کلاس‌های گروهی فعال</h3>
                {groupClasses.map((c) => (
                  <Link to={`/classes/${c.id}`} className="card class-card" key={c.id} style={{ display: 'block' }}>
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
              </div>
            )}

            {tab === 'زمان‌های آزاد' && (
              <div className="card tp-section">
                <h3>زمان‌های آزاد هفتهٔ آینده</h3>
                <p className="muted" style={{ marginBottom: 14 }}>همهٔ زمان‌ها به وقت تهران است. هر جلسه ۹۰ دقیقه.</p>
                <div className="slots-grid">
                  {t.slots.map((s) => (
                    <div className="slot-day" key={s.day}>
                      <b>{s.day}</b>
                      {s.times.map((x) => (
                        <span className={`slot-time${x.full ? ' full' : ''}`} key={x.t}>
                          {x.t}
                          {x.full && <em>پر شده</em>}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'نظرات' && (
              <div className="tp-section">
                <div className="card tp-subratings">
                  <div>
                    <b className="rating-big">{faNum(String(t.rating).replace('.', '٫'))}</b>
                    <span className="muted"> از {faNum(t.reviews_count)} نظر</span>
                  </div>
                  {t.subratings.map((s) => (
                    <span key={s.label} className="subrate">
                      {s.label}
                      <b>{s.value}</b>
                    </span>
                  ))}
                </div>
                {reviews.map((r) => (
                  <article className="card test-card" key={r.id} style={{ marginBottom: 12 }}>
                    <div className="test-user" style={{ marginTop: 0 }}>
                      <span className={`test-avatar ${r.color}`}>{r.letter}</span>
                      <span>
                        <b>{r.author}</b>
                        <span>{r.role_label} · {r.class_label} · {r.date_label}</span>
                      </span>
                      <span className="stars" style={{ marginInlineStart: 'auto' }}>
                        {[...Array(r.rating)].map((_, i) => <IconStar key={i} size={14} />)}
                      </span>
                    </div>
                    <p className="test-text">{r.text}</p>
                    {r.replied ? (
                      <p className="tp-reply">پاسخ استاد: {r.reply}</p>
                    ) : (
                      <span className="chip">مفید بود ({faNum(r.helpful)})</span>
                    )}
                  </article>
                ))}
              </div>
            )}

            {tab === 'پرسش و پاسخ' && (
              <div className="card tp-section">
                <h3>پرسش و پاسخ</h3>
                <p className="muted">معمولاً کمتر از ۲ ساعت پاسخ می‌دهد.</p>
                {questions.map((q) => (
                  <div className="qa-item" key={q.id}>
                    <b>س: {q.text}</b>
                    <span className="muted">{q.author} · {q.date_label}</span>
                    {q.answer && <p>ج: {q.answer}</p>}
                  </div>
                ))}
                <form onSubmit={ask} className="cta-row" style={{ marginTop: 14 }}>
                  <button className="btn btn-primary">ارسال</button>
                  <input
                    className="cta-input"
                    placeholder="پرسش خود را بنویسید…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </form>
              </div>
            )}

            {tab === 'سوابق و مدارک' && (
              <div className="card tp-section">
                <h3>سوابق تحصیلی و حرفه‌ای</h3>
                {t.history.map((h) => (
                  <div className="qa-item" key={h.title}>
                    <b>{h.title}</b>
                    <span className="muted">{h.org} · {faNum(h.year)}</span>
                  </div>
                ))}
                <h3 style={{ marginTop: 18 }}>مدارک</h3>
                <div className="cred-grid">
                  {t.credentials.map((c) => (
                    <span className="cred" key={c.title}>
                      <IconShield size={16} />
                      {c.title}
                      <em>{c.status}</em>
                    </span>
                  ))}
                </div>
                <p className="muted" style={{ marginTop: 12 }}>مدارک توسط کارشناس نیمکت بررسی شده است.</p>
              </div>
            )}

            {tab === 'گزارش آموزشی' && (
              <div className="card tp-section">
                <h3>گزارش آموزشی</h3>
                <p className="muted">
                  نمونهٔ گزارش بعد از هر جلسه: مرور مفهوم ۳۰ دقیقه، حل مسئله ۴۵ دقیقه،
                  جمع‌بندی و تکلیف ۱۵ دقیقه. گزارش کامل برای شاگرد و والدین ارسال می‌شود.
                </p>
              </div>
            )}
          </div>

          <aside className="tp-book card">
            <div className="tp-price">
              <b>{faPrice(t.price)}</b>
              <span>تومان · هر جلسهٔ {faNum(t.session_minutes)} دقیقه</span>
            </div>
            <ul className="tp-guarantees">
              <li><IconCheck size={15} /> جلسهٔ اول با ضمانت</li>
              <li><IconCheck size={15} /> لغو رایگان تا ۲۴ ساعت قبل از جلسه</li>
              <li><IconCheck size={15} /> رزرو دوستانه تا ۵ نفر</li>
              <li><IconCheck size={15} /> پرداخت امن از درگاه بانکی</li>
            </ul>
            <div className="tp-tiers">
              <span className="chip">۴ جلسه · ۵٪ تخفیف</span>
              <span className="chip">۸ جلسه · ۱۰٪ تخفیف</span>
              <span className="chip">۱۶ جلسه · ۱۵٪ تخفیف</span>
            </div>
            <Link to="/classes/5" className="btn btn-primary btn-block">
              انتخاب زمان و رزرو
              <IconArrowLeft size={16} />
            </Link>
            <Link to="/panel/chat" className="btn btn-outline btn-block">
              <IconChatPlaceholder size={16} />
              پرسیدن سؤال از استاد
            </Link>
            <div className="tp-tech">
              <span><IconWifi size={16} /> تست فنی قبل از کلاس</span>
              <span><IconMic size={16} /> ضبط جلسه با اجازه</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
