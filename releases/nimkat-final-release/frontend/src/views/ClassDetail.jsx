'use client';
import TechnicalCheck from '../components/TechnicalCheck.jsx';
import SchedulePicker from '../components/SchedulePicker.jsx';
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from '../routing/navigation';
import {
  IconGlobe, IconBook, IconClock, IconCap, IconCheck, IconInfo, IconRefresh, IconShield,
  IconUserPlus, IconX, IconWifi, IconMic, IconCamera, IconHeadset, IconChat, IconLock,
  IconStar, IconChevronDown, IconVideo,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { toast } from '../utils/toast.js';
import { useInitialEntity } from '../render/EntityContext.jsx';

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

export default function ClassDetail({ content = {}, preview = false, entityId } = {}) {
  const { user } = useAuth();
  const initialEntity = useInitialEntity();
  const params = useParams();
  const id = entityId || params.id;
  const navigate = useNavigate();
  const [classTitle, setClassTitle] = useState(initialEntity?.class?.title || 'فیزیک یازدهم؛ مفهومی و حل مسئله از پایه');
  const [classInfo, setClassInfo] = useState(initialEntity?.class || null);
  const [teacherInfo, setTeacherInfo] = useState(initialEntity?.teacher || null);
  const [notFoundError, setNotFoundError] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [payMethod, setPayMethod] = useState('gateway');
  const [level, setLevel] = useState('متوسط');
  const [goal, setGoal] = useState('امتحان نهایی');
  const [sessions, setSessions] = useState(1);
  const friend=false;
  const [classKind,setClassKind]=useState(initialEntity?.class?.kind);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [quote, setQuote] = useState(null);
  const [occurrenceIds,setOccurrenceIds]=useState([]);
  const [availableOccurrences, setAvailableOccurrences] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  useEffect(()=>{setOccurrenceIds([]);},[id]);
  const [paid, setPaid] = useState(null);
  const friends=[];

  const handleOccurrencesChange = (list, isLoading) => {
    setAvailableOccurrences(Array.isArray(list) ? list : []);
    setScheduleLoading(Boolean(isLoading));
    if (!isLoading && Array.isArray(list) && list.length > 0 && sessions > list.length) {
      setSessions(list.length);
    }
  };

  const people = friend ? Math.max(1, friends.length) : 1;
  const per = quote ? quote.gross / Math.max(1, sessions * people) : (classInfo?.price || 280000);
  const gross = quote ? quote.gross : per * sessions * people;
  const tierOff = quote ? quote.tier_percent / 100 : (sessions >= 8 ? 0.1 : sessions >= 4 ? 0.05 : 0);
  const friendOff = quote ? quote.friend_percent / 100 : (friend ? 0.2 : 0);
  const tierAmount = quote ? quote.tier_off : gross * tierOff;
  const friendAmount = quote ? quote.friend_off : (gross - tierAmount) * friendOff;
  const couponAmount = quote ? quote.coupon_off : 0;
  const total = quote ? quote.total : gross - tierAmount - friendAmount;
  const share = quote ? quote.per_person : total / people;

  useEffect(() => {
    setNotFoundError(false);
    api(`/classes/${id || 5}`).then((d) => {
      if (d.class) {
        setClassInfo(d.class);
        if (d.class.title) setClassTitle(d.class.title);
        setClassKind(d.class.kind);
      }
      if (d.teacher) setTeacherInfo(d.teacher);
    }).catch((err) => {
      if (err?.status === 404 || String(err?.message || '').includes('پیدا نشد')) setNotFoundError(true);
    });
  }, [id]);

  useEffect(() => {
    if (!user) { setWalletBalance(null); return; }
    api('/panel/overview').then((d) => {
      if (typeof d.wallet === 'number') setWalletBalance(d.wallet);
    }).catch(() => {});
  }, [user]);

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
          toast(`تخفیف ${faNum(q.coupon_percent)}٪ با رعایت سقف کد اعمال شد.`);
        } else {
          setAppliedCoupon(null);
          toast('کد تخفیف معتبر نیست', 'err');
        }
      })
      .catch(e => toast(e.message||'خطا در بررسی کد تخفیف', 'err'));
  };

  const [payBusy, setPayBusy] = useState(false);
  const [paymentAttempt, setPaymentAttempt] = useState(null);
  const payNow = async () => {
    if (payBusy) return;
    if (!user) {
      toast('برای پرداخت اول وارد شوید', 'err');
      navigate('/login');
      return;
    }
    if (!scheduleLoading && availableOccurrences.length === 0) {
      toast('در حال حاضر جلسهٔ آزادی برای رزرو این کلاس ثبت نشده است.', 'err');
      return;
    }
    const effectiveSessions = availableOccurrences.length > 0 ? Math.min(sessions, availableOccurrences.length) : sessions;
    const chosenIds =
      occurrenceIds.length === effectiveSessions
        ? occurrenceIds
        : availableOccurrences.length >= effectiveSessions
          ? availableOccurrences.slice(0, effectiveSessions).map((o) => o.id)
          : occurrenceIds;
    if (chosenIds.length !== effectiveSessions) {
      toast('ابتدا زمان همهٔ جلسات را انتخاب کنید.', 'err');
      return;
    }
    setPayBusy(true);
    const fingerprint = JSON.stringify([id, effectiveSessions, people, appliedCoupon, chosenIds, payMethod]);
    const key = paymentAttempt?.fingerprint === fingerprint ? paymentAttempt.key : crypto.randomUUID();
    setPaymentAttempt({ fingerprint, key });
    try {
      const r = await api('/bookings', {
        method: 'POST',
        body: {
          classId: Number(id) || 5,
          sessions: effectiveSessions,
          people,
          coupon: appliedCoupon || undefined,
          idempotencyKey: key,
          occurrenceIds: chosenIds,
          method: payMethod,
        },
      });
      if (r.status === 'confirmed') {
        setPaid(r);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('nk:wallet-updated'));
        toast('رزرو تأیید شد');
      } else if (r.payment?.redirectUrl && r.payment.status === 'pending') {
        if (r.payment.redirectUrl.startsWith('/')) {
          navigate(r.payment.redirectUrl);
        } else {
          window.location.assign(r.payment.redirectUrl);
        }
      } else if (['failed', 'expired'].includes(r.status)) {
        setPaymentAttempt(null);
        toast('درخواست قبلی بسته شده؛ دوباره تلاش کنید.', 'err');
      } else {
        toast('درخواست در حال بررسی است؛ هنوز رزرو تأیید نشده.', 'err');
      }
    } catch (e) {
      toast(e.message || 'خطا در ثبت رزرو', 'err');
    } finally {
      setPayBusy(false);
    }
  };

  if (notFoundError && !classInfo) {
    return (
      <div className="container section">
        <div className="card-soft" style={{ padding: 32, textAlign: 'center' }}>
          <h1 className="t-h2">کلاس مورد نظر پیدا نشد</h1>
          <p className="t-small t-muted" style={{ marginTop: 8 }}>
            ممکن است شناسهٔ کلاس اشتباه باشد یا این کلاس دیگر در فهرست فعال نباشد.
          </p>
          <Link to="/classes" className="btn btn-primary" style={{ marginTop: 16 }}>
            بازگشت به جستجوی کلاس‌ها
          </Link>
        </div>
      </div>
    );
  }


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
                  <button
                    type="button"
                    aria-label="افزایش تعداد جلسات"
                    disabled={!scheduleLoading && availableOccurrences.length === 0}
                    onClick={() =>
                      setSessions(
                        Math.min(
                          availableOccurrences.length > 0 ? availableOccurrences.length : 16,
                          sessions + 1
                        )
                      )
                    }
                  >
                    +
                  </button>
                  <span className="val num">{faNum(sessions)}</span>
                  <button
                    type="button"
                    aria-label="کاهش تعداد جلسات"
                    disabled={sessions <= 1}
                    onClick={() => setSessions(Math.max(1, sessions - 1))}
                  >
                    −
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }} role="group" aria-label="انتخاب سریع تعداد جلسات">
                {[
                  { n: 1, label: '۱ جلسه (تک‌جلسه)' },
                  { n: 4, label: '۴ جلسه (۵٪ تخفیف)' },
                  { n: 8, label: '۸ جلسه (۱۰٪ تخفیف)' },
                  { n: 16, label: '۱۶ جلسه (۱۵٪ تخفیف)' },
                ].map((opt) => {
                  const maxAllowed = availableOccurrences.length > 0 ? availableOccurrences.length : 16;
                  const disabledOpt = !scheduleLoading && availableOccurrences.length > 0 && opt.n > maxAllowed;
                  return (
                    <button
                      key={opt.n}
                      type="button"
                      disabled={disabledOpt}
                      className={`opt-chip ${sessions === opt.n ? 'is-on' : ''}`}
                      onClick={() => setSessions(Math.min(maxAllowed, opt.n))}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="field-hint" style={{ marginTop: 8 }}>
                امکان رزرو تک‌جلسه‌ای (۱ جلسه) یا پکیج چندجلسه‌ای با تخفیف پلکانی خودکار
              </div>
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

            {['friendly','دوستانه'].includes(classKind)&&<div className="card-soft" style={{padding:18}}><b>رزرو دوستانه با پرداخت مستقل</b><p className="t-small">گروه ۲ تا ۵ نفره بسازید؛ هر دوست دعوت خودش را می‌پذیرد و سهم خودش را پرداخت می‌کند.</p><Link className="btn btn-outline" to={`/panel/friendly?classId=${id}`}>ساخت گروه و دعوت واقعی دوستان</Link></div>}

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
                  aria-label="کد تخفیف رزرو"
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
              <>
                <SchedulePicker
                  classId={Number(id) || 5}
                  count={sessions}
                  selected={occurrenceIds}
                  onChange={setOccurrenceIds}
                  onOccurrencesChange={handleOccurrencesChange}
                />
                <div className="segmented" style={{ width: '100%' }} role="group" aria-label="روش پرداخت">
                  <button type="button" className={payMethod === 'gateway' ? 'is-active' : ''} onClick={() => setPayMethod('gateway')} style={{ flex: 1, justifyContent: 'center' }}>
                    درگاه بانکی
                  </button>
                  <button type="button" className={payMethod === 'wallet' ? 'is-active' : ''} onClick={() => setPayMethod('wallet')} style={{ flex: 1, justifyContent: 'center' }}>
                    کیف پول
                  </button>
                </div>
                <button
                  className="btn btn-primary btn-lg btn-block"
                  data-testid="pay-btn"
                  type="button"
                  onClick={payNow}
                  disabled={payBusy || (!scheduleLoading && availableOccurrences.length === 0)}
                >
                  {!scheduleLoading && availableOccurrences.length === 0
                    ? 'جلسه‌ای برای رزرو موجود نیست'
                    : `پرداخت کل رزرو · ${faPrice(quote?.total ?? share * people)} تومان`}
                </button>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="field-hint"><IconLock size={14} /> درگاه پرداخت شاپرک</span>
              <span className="field-hint num">
                {walletBalance !== null ? <>موجودی کیف پول: {faPrice(walletBalance)} تومان <IconWalletMini /></> : <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>ورود برای مشاهده کیف پول</Link>}
              </span>
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
            <button type="button" className="chip soft-green" style={{ cursor: 'pointer', border: 'none' }} onClick={() => window.dispatchEvent(new Event('nimkat:open-support'))}>چت پشتیبانی</button>
          </div>
        </aside>

        {/* ============ main ============ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, gridColumn: 1, gridRow: 1 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span className="chip soft-green">
                {classKind === 'group' ? 'کلاس گروهی' : classKind === 'friendly' ? 'کلاس دوستانه' : 'کلاس خصوصی'}
              </span>
              <span className="chip outline"><IconGlobe size={14} /> {classInfo?.mode || 'آنلاین'}</span>
            </div>
            <h1 className="t-h2">{classTitle}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
              <div className="avatar sq-64">{(teacherInfo?.name || 'س')[0]}</div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link to={`/teachers/${teacherInfo?.id || classInfo?.teacher_id || 1}`} style={{ fontWeight: 800, fontSize: 16 }}>
                    {teacherInfo?.name || 'سارا محمدی'}
                  </Link>
                  <span className="chip soft-green">{teacherInfo?.level || 'متخصص'}</span>
                </div>
                <div className="t-small t-muted" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <IconStar size={13} style={{ color: 'var(--accent)' }} /> {faNum(teacherInfo?.rating || classInfo?.rating || 4.9)} از {faNum(teacherInfo?.reviews_count || classInfo?.reviews_count || 320)} نظر ·
                  <Link to={`/teachers/${teacherInfo?.id || classInfo?.teacher_id || 1}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>مشاهده‌ی پروفایل کامل</Link>
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
            <h2 className="t-h4">{content.descriptionTitle ?? "توضیحات کلاس"}</h2>
            <p style={{ lineHeight: 2.3, marginTop: 14, textAlign: 'justify' }}>
              {content.description ?? "این کلاس برای شاگردهایی است که در فیزیک یازدهم با مفاهیم مشکل دارند یا برای امتحان نوبت اول آماده می‌شوند. هر جلسه ۳۰ دقیقه مرور مفهوم، ۴۵ دقیقه حل مسئله‌ی هم‌سطح امتحان و ۱۵ دقیقه جمع‌بندی و تکلیف دارد. جزوه و تمرین‌ها بعد از هر جلسه در بخش فایل‌های پنل شما قرار می‌گیرد."}
            </p>
          </div>

          {/* syllabus */}
          <div className="card" style={{ borderRadius: 'var(--r-xl)', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="t-h4">{content.syllabusTitle ?? "سرفصل‌ها"}</h2>
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
            <h2 className="t-h4">{content.rulesTitle ?? "قوانین لغو و حضور"}</h2>
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

          <TechnicalCheck title={content.technicalTitle} />
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
