import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import {
  IconStar, IconCheck, IconMinus, IconPlus, IconArrowLeft, IconUserPlus,
  IconClock,
} from '../components/icons.jsx';
import { IconVideo, IconMic, IconWifi, IconChatPlaceholder } from '../panelIcons.jsx';

const LEVELS = ['عالی', 'خوب', 'متوسط', 'ضعیف'];
const GOALS = ['امتحان نهایی', 'کنکور', 'رفع اشکال', 'تقویت پایه'];

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState(8);
  const [friends, setFriends] = useState(['محمدرضا تقوی', 'پارسا کیانی']);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null);
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [openChapter, setOpenChapter] = useState(0);
  const [tech, setTech] = useState({ net: true, cam: true, mic: true });
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/classes/${id}`).then(setData).catch(() => setData(null));
  }, [id]);

  const people = friends.length + 1;

  const quote = useMemo(() => {
    if (!data) return null;
    const gross = data.class.price * sessions * people;
    const tier = sessions >= 16 ? 0.15 : sessions >= 8 ? 0.1 : sessions >= 4 ? 0.05 : 0;
    const tierOff = gross * tier;
    const friendOff = people >= 2 ? (gross - tierOff) * 0.2 : 0;
    const couponOff = applied ? (gross - tierOff - friendOff) * (applied / 100) : 0;
    const total = gross - tierOff - friendOff - couponOff;
    return { gross, tier: tier * 100, tierOff, friendOff, couponOff, total, per: total / people };
  }, [data, sessions, people, applied]);

  if (!data || !quote) return <div className="container section">در حال بارگذاری…</div>;
  const { class: c, teacher: t, tiers } = data;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'MEHR05') { setApplied(5); setError(''); }
    else { setApplied(null); setError('کد تخفیف معتبر نیست'); }
  };

  const addFriend = () => {
    if (friends.length >= 4) return;
    setFriends([...friends, `دوست ${faNum(friends.length + 2)}`]);
  };

  const pay = async () => {
    if (!user) { navigate(`/login?next=/classes/${id}`); return; }
    try {
      const r = await api('/bookings', {
        method: 'POST',
        body: { classId: c.id, sessions, people, friends, coupon: applied ? 'MEHR05' : null },
      });
      setDone(r);
    } catch (e) { setError(e.message); }
  };

  return (
    <section className="section" style={{ paddingTop: 30 }}>
      <div className="container">
        <nav className="crumbs">
          <Link to="/">خانه</Link> / <Link to="/classes">کلاس‌ها</Link> / <span>{c.subject} {c.grade} · {c.kind === 'private' ? 'خصوصی' : 'گروهی'}</span>
        </nav>
        <span className="chip" style={{ margin: '10px 0' }}>گام ۲ از ۳ · رزرو کلاس</span>

        <div className="cd-grid">
          <div>
            <div className="card tp-section">
              <div className="tp-badges">
                {c.badges.map((b) => <span className="chip chip-month" key={b}>{b}</span>)}
                <span className="chip">{c.mode} · {c.platform}</span>
              </div>
              <h1 style={{ fontSize: 26, marginTop: 10 }}>{c.title}</h1>
              <p className="muted" style={{ marginTop: 8 }}>
                <Link to={`/teachers/${t.id}`} className="link-green">{t.name}</Link>
                {' '}· {t.level} · {faNum(String(t.rating).replace('.', '٫'))} از {faNum(t.reviews_count)} نظر · مشاهدهٔ پروفایل کامل
              </p>
              <div className="cd-facts">
                <span><b>مقطع و پایه</b>{c.grade === 'یازدهم' ? 'متوسطه دوم · یازدهم' : c.grade}</span>
                <span><b>رشته</b>{c.field}</span>
                <span><b>مدت هر جلسه</b>{faNum(c.session_minutes)} دقیقه</span>
                <span><b>بستر</b>{c.platform}</span>
              </div>
              <h3 style={{ marginTop: 20 }}>توضیحات کلاس</h3>
              <p className="muted" style={{ marginTop: 8 }}>{c.desc}</p>

              <h3 style={{ marginTop: 22 }}>سرفصل‌ها</h3>
              <div className="accordion" style={{ marginTop: 10 }}>
                {c.syllabus.map((s, i) => (
                  <div className={`acc-item${openChapter === i ? ' open' : ''}`} key={s.chapter}>
                    <button className="acc-head" onClick={() => setOpenChapter(openChapter === i ? -1 : i)}>
                      <span className="acc-q">{s.chapter} · {faNum(s.sessions)} جلسه</span>
                      <span className="acc-icon">{openChapter === i ? <IconMinus size={15} /> : <IconPlus size={15} />}</span>
                    </button>
                    {openChapter === i && s.items.length > 0 && (
                      <div className="acc-body">
                        <ul style={{ listStyle: 'disc', paddingInlineStart: 18 }}>
                          {s.items.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: 22 }}>قوانین لغو و حضور</h3>
              <ul className="rules-list">
                {c.rules.map((r, i) => <li key={i}><IconCheck size={15} /> {r}</li>)}
              </ul>

              <h3 style={{ marginTop: 22 }}>تست فنی قبل از ورود به کلاس</h3>
              <div className="tech-row">
                <span className={`tech${tech.net ? ' ok' : ''}`}>
                  <IconWifi size={18} /> اینترنت · ۸٫۴ مگابیت
                  <em>{tech.net ? 'سالم' : 'قطع'}</em>
                </span>
                <span className={`tech${tech.cam ? ' ok' : ''}`}>
                  <IconVideo size={18} /> دوربین
                  <em>{tech.cam ? 'سالم' : 'قطع'}</em>
                </span>
                <span className={`tech${tech.mic ? ' ok' : ''}`}>
                  <IconMic size={18} /> میکروفون
                  <em>{tech.mic ? 'سالم' : 'قطع'}</em>
                </span>
                <button className="btn btn-outline" onClick={() => setTech({ net: true, cam: true, mic: true })}>
                  اجرای دوباره
                </button>
              </div>

              <div className="cd-prechat">
                <IconChatPlaceholder size={20} />
                <span>
                  <b>سوالی قبل از رزرو دارید؟</b>
                  <span className="muted"> معمولاً کمتر از ۲ ساعت پاسخ می‌دهیم.</span>
                </span>
                <Link to="/login?next=/panel/chat" className="btn btn-outline">چت</Link>
              </div>
            </div>
          </div>

          <aside className="card book">
            <div className="price-rows" style={{ marginTop: 0 }}>
              <div className="price-row">
                <span className="lbl">تعداد جلسات</span>
                <span className="stepper">
                  <button onClick={() => setSessions((s) => Math.max(1, s - 1))}><IconMinus size={15} /></button>
                  <b>{faNum(sessions)}</b>
                  <button onClick={() => setSessions((s) => Math.min(16, s + 1))}><IconPlus size={15} /></button>
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12 }}>تخفیف پلکانی خودکار اعمال می‌شود</p>
              <div className="tp-tiers">
                {tiers.map((x) => (
                  <span className={`chip${sessions >= x.sessions ? ' chip-btn active' : ''}`} key={x.sessions}>
                    {faNum(x.sessions)} جلسه · {faNum(x.percent)}٪ تخفیف
                  </span>
                ))}
              </div>
            </div>

            <div className="referral">
              <IconUserPlus size={22} />
              <span>
                <b>رزرو دوستانه</b>
                <p>{faNum(people)} نفر · تخفیف ۲۰٪ برای همه</p>
              </span>
            </div>
            <div className="friends-list">
              <span className="chip chip-btn active">شما{user ? ` · ${user.name}` : ''}</span>
              {friends.map((f, i) => (
                <span className="chip" key={f}>
                  {f}
                  <button onClick={() => setFriends(friends.filter((_, x) => x !== i))} style={{ marginInlineStart: 6 }}>✕</button>
                </span>
              ))}
              {friends.length < 4 && (
                <button className="chip chip-btn" onClick={addFriend}>افزودن دوست ({faNum(4 - friends.length)} جای دیگر)</button>
              )}
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>برای هر دوست پیامک دعوت با لینک کلاس ارسال می‌شود.</p>

            <div className="price-rows">
              <div className="price-row">
                <span className="lbl">کل مبلغ کلاس</span>
                <span className="val">{faPrice(quote.gross)} تومان</span>
              </div>
              <div className="price-row">
                <span className="lbl">تخفیف پلکانی {faNum(quote.tier)}٪</span>
                <span className="val green">−{faPrice(quote.tierOff)}</span>
              </div>
              {quote.friendOff > 0 && (
                <div className="price-row">
                  <span className="lbl">تخفیف دوستانه ۲۰٪</span>
                  <span className="val green">−{faPrice(quote.friendOff)}</span>
                </div>
              )}
              {quote.couponOff > 0 && (
                <div className="price-row">
                  <span className="lbl">کد تخفیف MEHR05</span>
                  <span className="val green">−{faPrice(quote.couponOff)}</span>
                </div>
              )}
              <div className="price-row">
                <span className="lbl">سهم هر نفر</span>
                <b>{faPrice(quote.per)} تومان</b>
              </div>
            </div>

            <div className="cta-row" style={{ marginTop: 12 }}>
              <button className="btn btn-outline" onClick={applyCoupon}>اعمال</button>
              <input className="cta-input" placeholder="کد تخفیف دارم" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            </div>
            {error && <p className="cta-msg err">{error}</p>}

            <label className="f-label" style={{ marginTop: 14 }}>سطح فعلی شما در این درس؟</label>
            <div className="chips">
              {LEVELS.map((x) => (
                <button key={x} className={`chip chip-btn${level === x ? ' active' : ''}`} onClick={() => setLevel(x)}>{x}</button>
              ))}
            </div>
            <label className="f-label">هدف شما از کلاس؟</label>
            <div className="chips">
              {GOALS.map((x) => (
                <button key={x} className={`chip chip-btn${goal === x ? ' active' : ''}`} onClick={() => setGoal(x)}>{x}</button>
              ))}
            </div>
            <label className="f-label">زمان جلسهٔ اول</label>
            <select className="cta-input" defaultValue="پنجشنبه ۱۶:۰۰">
              <option>پنجشنبه ۱۶:۰۰</option>
              <option>شنبه ۱۶:۳۰</option>
              <option>سه‌شنبه ۱۹:۰۰</option>
            </select>

            {done ? (
              <p className="cta-msg ok" style={{ marginTop: 14 }}>
                رزرو ثبت شد و از کیف پول پرداخت شد. جزئیات در پنل شماست.
              </p>
            ) : (
              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={pay}>
                پرداخت سهم من · {faPrice(quote.per)} تومان
                <IconArrowLeft size={16} />
              </button>
            )}
            <p className="muted" style={{ fontSize: 11, marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
              <IconClock size={13} /> درگاه پرداخت شاپرک (شبیه‌سازی‌شده در حالت لوکال)
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
