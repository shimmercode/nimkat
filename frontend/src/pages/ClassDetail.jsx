import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  IconGlobe, IconBook, IconClock, IconCap, IconCheck, IconInfo, IconRefresh, IconShield,
  IconUserPlus, IconX, IconWifi, IconMic, IconCamera, IconHeadset, IconChat, IconLock,
  IconStar, IconChevronDown, IconVideo,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api, getToken } from '../api.js';
import { toast } from '../utils/toast.js';

const RULES = [
  { icon: IconRefresh, text: 'لغو تا ۲۴ ساعت قبل از جلسه رایگان است و مبلغ به کیف پول برمی‌گردد.', tone: 'green' },
  { icon: IconInfo, text: 'لغو کمتر از ۲۴ ساعت: ۵۰٪ مبلغ همان جلسه کسر می‌شود.', tone: 'orange' },
  { icon: IconShield, text: 'اگر استاد جلسه را لغو کند، جلسه‌ی جایگزین یا استاد جایگزین پیشنهاد می‌شود.', tone: 'green' },
  { icon: IconClock, text: 'حضور بیش از ۱۵ دقیقه دیرتر، از زمان همان جلسه کم می‌شود.', tone: 'orange' },
];

const CHAPTERS = [
  {
    n: 1, title: 'فصل ۱ · الکتریسیته‌ی ساکن', meta: '۳ جلسه · بار، قانون کولن، میدان و پتانسیل',
    items: ['مفهوم بار و روش‌های باردار کردن', 'قانون کولن با ۱۲ مسئله‌ی پله‌ای', 'میدان الکتریکی و خطوط میدان'],
  },
  { n: 2, title: 'فصل ۲ · جریان الکتریکی و مدارها', meta: '۲ جلسه', items: ['مدارهای سری و موازی', 'قانون اهم و توان'] },
  { n: 3, title: 'فصل ۳ · مغناطیس', meta: '۲ جلسه', items: ['میدان مغناطیسی و نیروی لورنتس'] },
  { n: 4, title: 'جمع‌بندی و آزمون شبیه‌ساز', meta: '۱ جلسه', items: ['آزمون جامع و رفع اشکال'] },
];

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [level, setLevel] = useState('متوسط');
  const [goal, setGoal] = useState('امتحان نهایی');
  const [sessions, setSessions] = useState(8);
  const [friend, setFriend] = useState(true);
  const [coupon, setCoupon] = useState('MEHR05');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [quote, setQuote] = useState(null);
  const [paid, setPaid] = useState(null);
  const [friends, setFriends] = useState([
    { n: 1, name: 'شما · علی رضایی', phone: '—', me: true },
    { n: 2, name: 'محمدرضا تقوی', phone: '۰۹۱۲ ۳۳۳ ۰۹۱۹' },
    { n: 3, name: 'پارسا کیانی', phone: '۰۹۳۵ ۵۷۵ ۶۸۹۰' },
  ]);

  const people = friend ? Math.max(1, friends.length) : 1;
  const per = quote ? quote.gross / Math.max(1, sessions * people) : 280000;
  const gross = quote ? quote.gross : per * sessions * people;
  const tierOff = quote ? quote.tier_percent / 100 : (sessions >= 8 ? 0.1 : sessions >= 4 ? 0.05 : 0);
  const friendOff = quote ? quote.friend_percent / 100 : (friend ? 0.2 : 0);
  const tierAmount = quote ? quote.tier_off : gross * tierOff;
  const friendAmount = quote ? quote.friend_off : (gross - tierAmount) * friendOff;
  const couponAmount = quote ? quote.coupon_off : 0;
  const total = quote ? quote.total : gross - tierAmount - friendAmount;
  const share = quote ? quote.per_person : total / people;

  useEffect(() => {
    api(`/classes/${id || 5}`).then((d) => {
      if (d.class?.title) {
        const h1 = document.querySelector('.sc-layout h1');
        if (h1) h1.textContent = d.class.title;
      }
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    let alive = true;
    api(`/bookings/quote?classId=${id || 5}`, {
      method: 'POST',
      body: { classId: Number(id) || 5, sessions, people, coupon: appliedCoupon || undefined },
    }).then((q) => { if (alive) setQuote(q); }).catch(() => { if (alive) setQuote(null); });
    return () => { alive = false; };
  }, [id, sessions, people, appliedCoupon]);

  const applyCoupon = () => {
    const code = (coupon || '').trim();
    if (!code) { setAppliedCoupon(null); toast('کد تخفیف را وارد کنید', 'err'); return; }
    api('/bookings/quote', { method: 'POST', body: { classId: Number(id) || 5, sessions, people, coupon: code } })
      .then((q) => {
        if (q.coupon_percent > 0) {
          setAppliedCoupon(code.toUpperCase());
          toast(`کد ${code.toUpperCase()} اعمال شد · ${faNum(q.coupon_percent)}٪ تخفیف`);
        } else {
          setAppliedCoupon(null);
          toast('کد تخفیف معتبر نیست', 'err');
        }
      })
      .catch(() => toast('خطا در بررسی کد تخفیف', 'err'));
  };

  const payNow = async () => {
    if (!getToken()) {
      toast('برای پرداخت اول وارد شوید', 'err');
      navigate('/login');
      return;
    }
    try {
      const r = await api('/bookings', {
        method: 'POST',
        body: { classId: Number(id) || 5, sessions, people, coupon: appliedCoupon || undefined, seats: [7] },
      });
      setPaid(r);
      toast('رزرو با موفقیت انجام شد ✓');
    } catch (e) {
      toast(e.message || 'خطا در ثبت رزرو', 'err');
    }
  };

  const removeFriend = (n) => setFriends((fs) => fs.filter((f) => f.n !== n));
  const addFriend = () => {
    if (friends.length >= 3) { toast('حداکثر ۳ نفر برای رزرو دوستانه', 'err'); return; }
    setFriends((fs) => {
      const nextN = fs.reduce((mx, f) => Math.max(mx, f.n), 0) + 1;
      return [...fs, { n: nextN, name: `دوست ${nextN}`, phone: '—' }];
    });
    toast('ردیف دوست اضافه شد؛ شماره را ویرایش کنید');
  };

  return (
    <div className="container section-tight">
      <div className="crumbs" style={{ margin: '10px 0 22px' }}>
        <Link to="/">خانه</Link>
        <span className="sep">›</span>
        <Link to="/classes">کلاس‌ها</Link>
        <span className="sep">›</span>
        <span className="here">فیزیک یازدهم · خصوصی</span>
      </div>

      <div className="sc-layout">
        {/* ============ booking sidebar ============ */}
        <aside className="booking-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 21 }}>رزرو کلاس</h2>
            <span className="t-caption t-muted">گام ۲ از ۳</span>
          </div>
          <div className="booking-steps">
            <i className="done" />
            <i className="now" />
            <i />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div className="field-label" style={{ marginBottom: 10 }}>سطح فعلی شما در این درس؟</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['ضعیف', 'متوسط', 'خوب', 'عالی'].map((v) => (
                  <button key={v} type="button" className={`opt-chip ${level === v ? 'is-on' : ''}`} onClick={() => setLevel(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="field-label" style={{ marginBottom: 10 }}>هدف شما از کلاس؟</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['رفع اشکال', 'امتحان نهایی', 'تقویت پایه', 'کنکور'].map((v) => (
                  <button key={v} type="button" className={`opt-chip ${goal === v ? 'is-on' : ''}`} onClick={() => setGoal(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="field-label" style={{ marginBottom: 10 }}>زمان جلسه‌ی اول</div>
              <div className="card-soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 700, fontSize: 14 }}>
                  <IconClock size={17} style={{ color: 'var(--primary)' }} />
                  <span className="num">شنبه ۵ مهر · ساعت ۱۶:۰۰</span>
                </span>
                <button type="button" onClick={() => navigate('/classes')} style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 13 }}>تغییر</button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="field-label">تعداد جلسات</div>
                <div className="stepper">
                  <button type="button" onClick={() => setSessions(Math.min(16, sessions + 1))}>+</button>
                  <span className="val num">{faNum(sessions)}</span>
                  <button type="button" onClick={() => setSessions(Math.max(3, sessions - 1))}>−</button>
                </div>
              </div>
              <div className="field-hint" style={{ marginTop: 8 }}>تخفیف پلکانی خودکار اعمال می‌شود</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { r: '۱–۳', d: 0 }, { r: '۴–۷', d: 5 }, { r: '۸–۱۵', d: 10 }, { r: '۱۶+', d: 15 },
              ].map((t) => {
                const on = (t.d === 10 && sessions >= 8 && sessions <= 15) || (t.d === 5 && sessions >= 4 && sessions < 8) || (t.d === 0 && sessions < 4) || (t.d === 15 && sessions >= 16);
                return (
                  <div
                    key={t.r}
                    style={{
                      borderRadius: 'var(--r-md)', padding: '10px 6px', textAlign: 'center',
                      background: on ? 'var(--primary)' : 'var(--n50)', color: on ? '#fff' : 'var(--muted)',
                      border: on ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    }}
                  >
                    <b className="num" style={{ display: 'block', fontSize: 12.5 }}>{t.r}</b>
                    <span className="num" style={{ fontSize: 11.5 }}>{faNum(t.d)}٪</span>
                  </div>
                );
              })}
            </div>

            {/* friends */}
            <div className="card-soft" style={{ padding: 18, borderColor: friend ? 'rgba(10,104,71,.35)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <IconUserPlus size={21} style={{ color: 'var(--primary)' }} />
                  <div>
                    <b style={{ fontSize: 14.5 }}>رزرو دوستانه</b>
                    <div className="t-caption t-muted">۲-۳ نفر · تخفیف ۲۰٪ برای همه</div>
                  </div>
                </div>
                <button type="button" className={`toggle ${friend ? 'is-on' : ''}`} onClick={() => setFriend(!friend)} />
              </div>

              {friend && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  {friends.map((f) => (
                    <div className="friend-row" key={f.n} style={f.me ? { background: 'var(--secondary-50)' } : undefined}>
                      <span className="t-caption t-muted num" style={{ width: 16 }}>{faNum(f.n)}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{f.name}</span>
                      <span className="num" style={{ fontSize: 12, color: 'var(--muted)', direction: 'ltr' }}>{f.phone}</span>
                      {!f.me && (
                        <button type="button" data-testid="friend-remove" style={{ color: 'var(--muted)' }} onClick={() => removeFriend(f.n)}>
                          <IconX size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn-ghost" onClick={addFriend} style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 13, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    + افزودن دوست ({faNum(Math.max(0, 3 - friends.length))} جای دیگر)
                  </button>
                  <div className="field-hint">برای هر دوست پیامک دعوت با لینک کلاس ارسال می‌شود.</div>
                </div>
              )}
            </div>

            {/* prices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="price-line">
                <span className="l">{faNum(sessions)} جلسه × {faPrice(per)} × {faNum(people)} نفر</span>
                <span className="v num">{faPrice(gross)} تومان</span>
              </div>
              {tierOff > 0 && (
                <div className="price-line">
                  <span className="l">تخفیف پلکانی {faNum(tierOff * 100)}٪</span>
                  <span className="v num" style={{ color: 'var(--secondary)' }}>−{faPrice(tierAmount)}</span>
                </div>
              )}
              {friend && (
                <div className="price-line">
                  <span className="l">تخفیف دوستانه ۲۰٪</span>
                  <span className="v num" style={{ color: 'var(--secondary)' }}>−{faPrice(friendAmount)}</span>
                </div>
              )}
              {couponAmount > 0 && (
                <div className="price-line">
                  <span className="l">کد تخفیف {appliedCoupon} {faNum(quote?.coupon_percent || 5)}٪</span>
                  <span className="v num" style={{ color: 'var(--secondary)' }}>−{faPrice(couponAmount)}</span>
                </div>
              )}
              <hr className="divider" style={{ margin: '6px 0' }} />
              <div className="price-line">
                <span className="l" style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--ink)' }}>کل مبلغ کلاس</span>
                <span className="num" style={{ fontSize: 21, fontWeight: 900 }}>{faPrice(total)} تومان</span>
              </div>
              {friend && (
                <div className="price-line">
                  <span className="l">سهم هر نفر</span>
                  <span className="v num" style={{ color: 'var(--accent-800)', background: 'var(--accent-50)', padding: '6px 12px', borderRadius: 'var(--r-sm)' }}>
                    {faPrice(share)} تومان
                  </span>
                </div>
              )}
            </div>

            {/* coupon */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <IconCheck size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--secondary)' }} />
                <input
                  className="input num"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="کد تخفیف دارم"
                  style={{ paddingRight: 38, direction: 'ltr', textAlign: 'right' }}
                />
              </div>
              <button className="btn btn-outline-green" type="button" onClick={applyCoupon}>اعمال</button>
            </div>

            {paid ? (
              <div className="card-soft" style={{ padding: 18, borderColor: 'rgba(10,104,71,.4)', background: 'var(--secondary-50)', textAlign: 'center' }}>
                <b style={{ fontSize: 15, color: 'var(--primary)' }}>رزرو شما با موفقیت ثبت شد ✓</b>
                <div className="t-small t-muted" style={{ marginTop: 6 }}>کد رزرو {faNum(paid.bookingId)} · مبلغ {faPrice(paid.total)} تومان</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                  <Link className="btn btn-primary" to="/panel">پنل من</Link>
                  <button className="btn btn-outline" type="button" onClick={() => setPaid(null)}>رزرو جدید</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg btn-block" data-testid="pay-btn" type="button" onClick={payNow}>
                پرداخت سهم من · {faPrice(share)} تومان
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="field-hint"><IconLock size={14} /> درگاه پرداخت شاپرک</span>
              <span className="field-hint num">موجودی کیف پول: {faPrice(1240000)} <IconWalletMini /></span>
            </div>
          </div>

          <div className="card-soft" style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <IconHeadset size={21} style={{ color: 'var(--primary)' }} />
              <div>
                <b style={{ fontSize: 13.5 }}>سوالی قبل از رزرو دارید؟</b>
                <div className="t-caption t-muted num">پشتیبانی ۰۲۱-۹۱۰۰۴۵۶۰</div>
              </div>
            </div>
            <span className="chip soft-green" style={{ cursor: 'pointer' }}>چت</span>
          </div>
        </aside>

        {/* ============ main ============ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, gridColumn: 1, gridRow: 1 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span className="chip soft-green">کلاس خصوصی</span>
              <span className="chip outline"><IconGlobe size={14} /> آنلاین</span>
            </div>
            <h1 className="t-h2">فیزیک یازدهم؛ مفهومی و حل مسئله از پایه</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
              <div className="avatar sq-64">س</div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link to="/teachers/1" style={{ fontWeight: 800, fontSize: 16 }}>سارا محمدی</Link>
                  <span className="chip soft-green">متخصص</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <IconStar size={13} style={{ color: 'var(--accent)' }} /> ۴٫۹ از ۳۲۰ نظر ·
                  <Link to="/teachers/1" style={{ color: 'var(--primary)', fontWeight: 700 }}>مشاهده‌ی پروفایل کامل</Link>
                </div>
              </div>
            </div>
          </div>

          {/* info strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { icon: IconCap, l: 'مقطع و پایه', v: 'متوسطه دوم · یازدهم' },
              { icon: IconBook, l: 'رشته', v: 'ریاضی فیزیک' },
              { icon: IconClock, l: 'مدت هر جلسه', v: '۹۰ دقیقه' },
              { icon: IconVideo, l: 'بستر', v: 'اسکای‌روم' },
            ].map((c) => (
              <div key={c.l} className="card-soft" style={{ padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: 'var(--primary)' }}><c.icon size={21} /></span>
                <div>
                  <div className="t-caption t-muted">{c.l}</div>
                  <b style={{ fontSize: 14 }}>{c.v}</b>
                </div>
              </div>
            ))}
          </div>

          {/* description */}
          <div className="card" style={{ borderRadius: 'var(--r-xl)', padding: 28 }}>
            <h2 className="t-h4">توضیحات کلاس</h2>
            <p style={{ lineHeight: 2.3, marginTop: 14, textAlign: 'justify' }}>
              این کلاس برای شاگردهایی است که در فیزیک یازدهم با مفاهیم مشکل دارند یا برای امتحان نوبت اول
              آماده می‌شوند. هر جلسه ۳۰ دقیقه مرور مفهوم، ۴۵ دقیقه حل مسئله‌ی هم‌سطح امتحان و ۱۵ دقیقه
              جمع‌بندی و تکلیف دارد. جزوه و تمرین‌ها بعد از هر جلسه در بخش فایل‌های پنل شما قرار می‌گیرد.
            </p>
          </div>

          {/* syllabus */}
          <div className="card" style={{ borderRadius: 'var(--r-xl)', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="t-h4">سرفصل‌ها</h2>
              <span className="t-small t-muted">۸ جلسه · پیشنهاد استاد</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
              {CHAPTERS.map((ch) => (
                <details className="chapter" key={ch.n} open={ch.n === 1}>
                  <summary>
                    <span className="num-box">{faNum(ch.n)}</span>
                    <span style={{ flex: 1 }}>
                      <b style={{ display: 'block', fontSize: 15 }}>{ch.title}</b>
                      <span className="t-caption t-muted">{ch.meta}</span>
                    </span>
                    <IconChevronDown size={18} style={{ color: 'var(--muted)' }} />
                  </summary>
                  <div className="body">
                    {ch.items.map((it) => (
                      <div key={it} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                        <IconCheck size={16} style={{ color: 'var(--secondary)' }} />
                        {it}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* rules */}
          <div className="card" style={{ borderRadius: 'var(--r-xl)', padding: 28 }}>
            <h2 className="t-h4">قوانین لغو و حضور</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
              {RULES.map((r) => (
                <div key={r.text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', flex: 'none',
                      background: r.tone === 'green' ? 'var(--secondary-50)' : 'var(--accent-50)',
                      color: r.tone === 'green' ? 'var(--primary)' : 'var(--accent-800)',
                    }}
                  >
                    <r.icon size={18} />
                  </span>
                  <p style={{ lineHeight: 2, paddingTop: 6, fontSize: 15 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* tech test */}
          <div className="tech-test">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="t-h4">تست فنی قبل از ورود به کلاس</h2>
              <button type="button" className="btn btn-outline-green" onClick={() => toast('تست فنی دوباره اجرا شد ✓')}>اجرای دوباره</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 18 }}>
              {[
                { icon: IconMic, t: 'میکروفون', v: 'سالم' },
                { icon: IconCamera, t: 'دوربین', v: 'سالم' },
                { icon: IconWifi, t: 'اینترنت', v: '۸٫۴ مگابیت' },
              ].map((t) => (
                <div className="tech-card" key={t.t}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary)' }}><t.icon size={21} /></span>
                    <div>
                      <b style={{ display: 'block', fontSize: 14 }}>{t.t}</b>
                      <span className="t-caption t-muted">{t.v}</span>
                    </div>
                  </div>
                  <IconCheck size={20} style={{ color: 'var(--secondary)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconWalletMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline' }}>
      <rect x="2" y="6" width="20" height="14" rx="3" />
      <path d="M2 10h20" />
    </svg>
  );
}
