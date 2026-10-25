'use client';
import { useState, useEffect } from 'react';
import { Link, useParams } from '../routing/navigation';
import {
  IconStar, IconGlobe, IconMapPin, IconChat, IconShield, IconArrowLeft, IconClock,
  IconUserPlus, IconLock, IconRefresh, IconPlay, IconVideo, IconBook, IconMedal, IconCap,
  IconCheck, IconHeart, IconInfo, IconCalendar,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { toast } from '../utils/toast.js';
import PublicTeacherSchedule from '../components/PublicTeacherSchedule.jsx';
import PublicTeacherReviews from '../components/PublicTeacherReviews.jsx';
import { useInitialEntity } from '../render/EntityContext.jsx';

const TABS = ['معرفی', 'کلاس‌های فعال', 'زمان‌های آزاد', 'سوابق و مدارک', 'رضایت‌های منتشرشده', 'پرسش و پاسخ', 'گزارش آموزشی'];

export default function TeacherProfile({ content = {}, preview = false, entityId } = {}) {
  const initialEntity = useInitialEntity();
  const params = useParams();
  const id = entityId || params.id;
  const [tab, setTab] = useState('معرفی');
  const [tier, setTier] = useState(8);
  const [reviewData,setReviewData]=useState(initialEntity?.reviews||null);
  const [teacher, setTeacher] = useState(initialEntity?.teacher || null);
  const [questions, setQuestions] = useState(initialEntity?.questions || []);
  const [notFoundError, setNotFoundError] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [asked, setAsked] = useState(false);
  const tName = teacher?.name || 'سارا محمدی';

  useEffect(() => {
    setNotFoundError(false);
    api(`/teachers/${id || 1}/reviews`).then(setReviewData).catch(()=>setReviewData(null));
    api(`/teachers/${id || 1}`).then((d) => {
      if (d.teacher) setTeacher(d.teacher);
      if (Array.isArray(d.questions)) setQuestions(d.questions);
    }).catch((err) => {
      if (err?.status === 404 || String(err?.message || '').includes('پیدا نشد')) setNotFoundError(true);
    });
  }, [id]);

  const sendQuestion = async () => {
    if (!askText.trim()) { toast('متن سوال را بنویسید', 'err'); return; }
    try {
      await api('/questions', { method: 'POST', body: { teacherId: Number(id) || 1, teacher_id: Number(id) || 1, text: askText.trim() } });
      setAsked(true);
      setAskOpen(false);
      setAskText('');
      toast('سوال شما برای استاد ارسال شد ✓');
      api(`/teachers/${id || 1}`).then((d) => { if (Array.isArray(d.questions)) setQuestions(d.questions); }).catch(() => {});
    } catch (e) {
      toast(e.message || 'خطا در ارسال سوال', 'err');
    }
  };

  if (notFoundError && !teacher) {
    return (
      <div className="container section">
        <div className="card-soft" style={{ padding: 32, textAlign: 'center' }}>
          <h1 className="t-h2">استاد مورد نظر پیدا نشد</h1>
          <p className="t-small t-muted" style={{ marginTop: 8 }}>
            ممکن است شناسهٔ استاد اشتباه باشد یا پروفایل ایشان دیگر فعال نباشد.
          </p>
          <Link to="/classes" className="btn btn-primary" style={{ marginTop: 16 }}>
            بازگشت به فهرست اساتید و کلاس‌ها
          </Link>
        </div>
      </div>
    );
  }

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
                {tName[0] || 'س'}
              </div>
              <span className="avatar-verified" style={{ width: 36, height: 36, bottom: -6, left: -6 }}>
                <IconShield size={19} />
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="chip dark">۲ برتر ماه</span>
                <span className="chip soft-green">سطح: {teacher?.level || 'متخصص'}</span>
                <span className="chip outline"><IconGlobe size={14} /> آنلاین و حضوری</span>
              </div>
              <h1 className="t-h2">{tName}</h1>
              <p className="t-muted" style={{ marginTop: 10 }}>
                {teacher?.title || 'دبیر فیزیک و ریاضی متوسطه دوم · کارشناسی ارشد فیزیک از دانشگاه صنعتی شریف'}
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
                <IconStar size={16} style={{ color: 'var(--accent)' }} /> {reviewData?.summary.average==null?'—':faNum(Math.round(reviewData.summary.average*10)/10)}
              </div>
              <div className="l">میانگین رضایت‌های منتشرشده</div>
            </div>
            <div className="cell">
              <div className="v num">{reviewData?faNum(reviewData.summary.verifiedStudents):'—'}</div>
              <div className="l">شاگرد</div>
            </div>
            <div className="cell">
              <div className="v num">{reviewData?faNum(reviewData.summary.verifiedSessions):'—'}</div>
              <div className="l">جلسه برگزارشده</div>
            </div>
            <div className="cell">
              <div className="v num">{teacher?.years?`${faNum(teacher.years)} سال`:'ثبت نشده'}</div>
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
                  <div className="t-caption t-muted">هر جلسه‌ی {faNum(teacher?.session_minutes || 90)} دقیقه</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }} className="num">
                    {faPrice(teacher?.price || 280000)}
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
              <h3 style={{ fontSize: 16.5 }}>{content.classesTitle ?? "کلاس‌های گروهی فعال"}</h3>
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
              <h2 className="t-h3">{content.aboutTitle ?? "درباره‌ی من"}</h2>
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
              {content.bio ?? "نه سال است فیزیک درس می‌دهم؛ پنج سال در دبیرستان‌های منطقه ۳ تهران و از ۱۴۰۱ به‌صورت آنلاین. کلاس‌هایم با یک سؤال از زندگی روزمره شروع می‌شود و بعد به فرمول می‌رسیم. برای هر شاگرد بعد از جلسه‌ی اول یک برنامه‌ی ۸ جلسه‌ای می‌نویسم و بعد از هر جلسه گزارش کوتاه برای خودش و والدینش می‌فرستم."}
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

            <PublicTeacherSchedule teacherId={id||1} initialData={initialEntity?.availability||null} title={content.availabilityTitle||'زمان‌های منتشرشدهٔ مدرس'}/>

            {/* credentials / history */}
            <div className="card" style={{ borderRadius: 'var(--r-2xl)', padding: 30 }}>
              <div className="tp-section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="t-h3">{content.credentialsTitle ?? "سوابق تحصیلی و حرفه‌ای"}</h2>
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

            <PublicTeacherReviews teacherId={id||1} initialData={reviewData}/>

            {questions.length > 0 && (
              <div className="card" id="qa" style={{ borderRadius: 'var(--r-2xl)', padding: 30 }}>
                <h2 className="t-h3">پرسش و پاسخ با استاد ({faNum(questions.length)})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                  {questions.map((q) => (
                    <div key={q.id || q.text} className="card-soft" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <b>{q.author || 'شاگرد'}</b>
                        <span className="t-muted">{q.date_label || ''}</span>
                      </div>
                      <p style={{ marginTop: 6, fontSize: 14 }}>{q.text}</p>
                      {q.answer && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13.5, color: 'var(--primary)' }}>
                          <b>پاسخ استاد:</b> {q.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
