'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from '../routing/navigation';
import {
  IconStar, IconGlobe, IconMapPin, IconChat, IconShield, IconArrowLeft, IconClock,
  IconUserPlus, IconLock, IconRefresh, IconPlay, IconVideo, IconBook, IconMedal, IconCap,
  IconCheck, IconInfo, IconCalendar, IconChart,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { toast } from '../utils/toast.js';
import PublicTeacherSchedule from '../components/PublicTeacherSchedule.jsx';
import PublicTeacherReviews from '../components/PublicTeacherReviews.jsx';
import { useInitialEntity } from '../render/EntityContext.jsx';

const TAB_CONFIG = [
  { label: 'معرفی', hash: '#about', sectionId: 'about' },
  { label: 'کلاس‌های فعال', hash: '#active-classes', sectionId: 'active-classes' },
  { label: 'زمان‌های آزاد', hash: '#slots', sectionId: 'slots' },
  { label: 'سوابق و مدارک', hash: '#credentials', sectionId: 'credentials' },
  { label: 'رضایت‌های منتشرشده', hash: '#reviews', sectionId: 'reviews' },
  { label: 'پرسش و پاسخ', hash: '#qa', sectionId: 'qa' },
  { label: 'گزارش آموزشی', hash: '#academic-report', sectionId: 'academic-report' },
];

const TABS = TAB_CONFIG.map((t) => t.label);

const HASH_TO_TAB = {
  '#about': 'معرفی',
  '#active-classes': 'کلاس‌های فعال',
  '#classes': 'کلاس‌های فعال',
  '#slots': 'زمان‌های آزاد',
  '#book': 'زمان‌های آزاد',
  '#credentials': 'سوابق و مدارک',
  '#reviews': 'رضایت‌های منتشرشده',
  '#public-reviews': 'رضایت‌های منتشرشده',
  '#qa': 'پرسش و پاسخ',
  '#academic-report': 'گزارش آموزشی',
};

const ACADEMIC_INDICATORS = [
  'تسلط مفهومی بر مباحث جلسه',
  'مهارت حل مسئله و تحلیل گام‌به‌گام',
  'دقت و سرعت در تمرین‌های کلاسی',
  'مشارکت فعال و پرسش‌گری هدفمند',
  'انجام تکالیف و مرور بین جلسات',
  'نظم و حضور به‌موقع در جلسه',
  'آمادگی برای آزمون و امتحانات مدرسه',
  'پیشرفت نسبت به جلسات گذشته',
];

export default function TeacherProfile({ content = {}, preview = false, entityId } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialEntity = useInitialEntity();
  const params = useParams();
  const id = entityId || params.id || '1';
  const numericTeacherId = Number(id) || 1;

  const [tab, setTab] = useState('معرفی');
  const [tier, setTier] = useState(1);
  const [reviewData, setReviewData] = useState(initialEntity?.reviews || null);
  const [teacher, setTeacher] = useState(initialEntity?.teacher || null);
  const [groupClasses, setGroupClasses] = useState(initialEntity?.groupClasses || []);
  const [teacherClasses, setTeacherClasses] = useState(initialEntity?.activeClasses || initialEntity?.groupClasses || []);
  const [classOccurrences, setClassOccurrences] = useState([]);
  const [questions, setQuestions] = useState(initialEntity?.questions || []);
  const [notFoundError, setNotFoundError] = useState(false);

  // Q&A state
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [askBusy, setAskBusy] = useState(false);
  const [asked, setAsked] = useState(false);

  // Schedule & Booking state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedOccurrenceIds, setSelectedOccurrenceIds] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [availabilityState, setAvailabilityState] = useState({
    data: initialEntity?.availability || null,
    loading: !initialEntity?.availability,
    error: '',
    week: 0,
  });
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('gateway');
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const bookingAttemptRef = useRef(null);

  const tName = teacher?.name || 'سارا محمدی';

  const scrollToSection = useCallback((sectionId, smooth = true) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(sectionId);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
  }, []);

  const syncFromLocationHash = useCallback(
    (smooth = false) => {
      if (typeof window === 'undefined') return;
      const rawHash = window.location.hash || '';
      if (!rawHash) {
        setTab('معرفی');
        return;
      }
      const mappedTab = HASH_TO_TAB[rawHash];
      if (mappedTab) {
        setTab(mappedTab);
      }
      const targetId = rawHash.replace(/^#/, '');
      if (targetId) {
        setTimeout(() => scrollToSection(targetId, smooth), 40);
      }
    },
    [scrollToSection]
  );

  useEffect(() => {
    syncFromLocationHash(false);
    const onHashOrPop = () => syncFromLocationHash(true);
    window.addEventListener('hashchange', onHashOrPop);
    window.addEventListener('popstate', onHashOrPop);
    return () => {
      window.removeEventListener('hashchange', onHashOrPop);
      window.removeEventListener('popstate', onHashOrPop);
    };
  }, [syncFromLocationHash]);

  const handleTabSelect = (tabLabel, pushHash = true) => {
    setTab(tabLabel);
    const cfg = TAB_CONFIG.find((item) => item.label === tabLabel);
    if (!cfg) return;
    if (pushHash && typeof window !== 'undefined') {
      if (window.location.hash !== cfg.hash) {
        window.history.pushState(null, '', cfg.hash);
      }
    }
    scrollToSection(cfg.sectionId, true);
  };

  useEffect(() => {
    let alive = true;
    setNotFoundError(false);
    setBookingError('');
    setBookingSuccess(null);
    setSelectedOccurrenceIds([]);

    api(`/teachers/${numericTeacherId}/reviews`)
      .then((d) => {
        if (alive) setReviewData(d);
      })
      .catch(() => {
        if (alive) setReviewData(null);
      });

    api(`/teachers/${numericTeacherId}`)
      .then((d) => {
        if (!alive) return;
        if (d.teacher) {
          setTeacher(d.teacher);
          const firstDay = Array.isArray(d.teacher.slots)
            ? d.teacher.slots.find((s) => Array.isArray(s.times) && s.times.some((tm) => !tm.full))
            : null;
          if (firstDay) {
            const firstTime = firstDay.times.find((tm) => !tm.full);
            if (firstTime) setSelectedSlot({ day: firstDay.day, time: firstTime.t });
          }
        }
        if (Array.isArray(d.groupClasses)) setGroupClasses(d.groupClasses);
        if (Array.isArray(d.activeClasses) && d.activeClasses.length > 0) {
          setTeacherClasses(d.activeClasses);
        }
        if (Array.isArray(d.questions)) setQuestions(d.questions);
      })
      .catch((err) => {
        if (!alive) return;
        if (err?.status === 404 || String(err?.message || '').includes('پیدا نشد')) {
          setNotFoundError(true);
        }
      });

    api('/classes')
      .then((d) => {
        if (!alive) return;
        const all = Array.isArray(d.classes) ? d.classes : [];
        const mine = all.filter(
          (c) => Number(c.teacher_id || c.teacher?.id) === numericTeacherId
        );
        if (mine.length > 0) setTeacherClasses(mine);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [numericTeacherId]);

  // Combine teacherClasses and groupClasses into a unified list of active classes for this teacher
  const allActiveClasses = (() => {
    const map = new Map();
    for (const c of teacherClasses) {
      map.set(c.id, {
        id: c.id,
        title: c.title,
        kind: c.kind || 'group',
        mode: c.mode || 'آنلاین',
        platform: c.platform || 'اسکای‌روم',
        days: c.days || 'به انتخاب شما',
        time: c.time || 'زمان‌های آزاد',
        sessions: c.sessions || 8,
        capacity: c.capacity || 10,
        taken: c.taken || 0,
        price: c.price || teacher?.price || 280000,
      });
    }
    for (const g of groupClasses) {
      if (!map.has(g.id)) {
        map.set(g.id, {
          id: g.id,
          title: g.title,
          kind: 'group',
          mode: 'آنلاین',
          platform: teacher?.platform || 'اسکای‌روم',
          days: g.days || '',
          time: g.time || '',
          sessions: g.sessions || 8,
          capacity: g.capacity || 10,
          taken: g.taken || 0,
          price: g.price || teacher?.price || 280000,
        });
      }
    }
    return Array.from(map.values());
  })();

  // Keep selectedClassId synced with available classes or occurrences
  useEffect(() => {
    if (selectedClassId && allActiveClasses.some((c) => c.id === selectedClassId)) return;
    const openClass = allActiveClasses.find((c) => (c.capacity || 0) > (c.taken || 0));
    if (openClass) {
      setSelectedClassId(openClass.id);
    } else if (allActiveClasses[0]) {
      setSelectedClassId(allActiveClasses[0].id);
    } else {
      setSelectedClassId(null);
    }
  }, [allActiveClasses, selectedClassId]);

  // Load upcoming schedule occurrences for the currently selected class
  useEffect(() => {
    if (!selectedClassId) {
      setClassOccurrences([]);
      return;
    }
    let alive = true;
    api(`/classes/${selectedClassId}/schedule`)
      .then((r) => {
        if (!alive) return;
        const list = Array.isArray(r.occurrences) ? r.occurrences : [];
        setClassOccurrences(list);
      })
      .catch(() => {
        if (alive) setClassOccurrences([]);
      });
    return () => {
      alive = false;
    };
  }, [selectedClassId]);

  const effectiveSessions =
    selectedOccurrenceIds.length > 0 ? selectedOccurrenceIds.length : Number(tier) || 1;

  // Fetch real server quote when classId, tier, or selected occurrences change
  useEffect(() => {
    if (!selectedClassId) {
      setQuote(null);
      return;
    }
    let alive = true;
    setQuoteLoading(true);
    api(`/bookings/quote?classId=${selectedClassId}`, {
      method: 'POST',
      body: {
        classId: Number(selectedClassId),
        sessions: effectiveSessions,
        people: 1,
      },
    })
      .then((q) => {
        if (alive) setQuote(q);
      })
      .catch(() => {
        if (alive) setQuote(null);
      })
      .finally(() => {
        if (alive) setQuoteLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedClassId, effectiveSessions]);

  const handleToggleOccurrence = (occ) => {
    setBookingError('');
    if (occ.class_id && occ.class_id !== selectedClassId) {
      setSelectedClassId(occ.class_id);
      setSelectedOccurrenceIds([occ.id]);
      setTier(1);
      return;
    }
    setSelectedOccurrenceIds((prev) => {
      const next = prev.includes(occ.id) ? prev.filter((x) => x !== occ.id) : [...prev, occ.id];
      if (next.length > 0) setTier(next.length);
      return next;
    });
  };

  const handleBookNow = async () => {
    if (bookingBusy) return;
    setBookingError('');
    setBookingSuccess(null);

    const bookableOccurrences = (availabilityState.data?.occurrences || []).filter(
      (o) => o.seatsLeft > 0 && !o.rescheduling
    );

    const targetClassId =
      selectedOccurrenceIds.length > 0
        ? (availabilityState.data?.occurrences || []).find((o) => o.id === selectedOccurrenceIds[0])?.class_id ||
          selectedClassId
        : selectedClassId || bookableOccurrences[0]?.class_id || allActiveClasses[0]?.id || null;

    if (!targetClassId) {
      handleTabSelect('زمان‌های آزاد', true);
      setBookingError('برای این استاد هنوز کلاس فعالی جهت رزرو ثبت نشده است.');
      toast('کلاس فعالی برای رزرو یافت نشد', 'err');
      return;
    }

    const desiredCount = Math.max(1, Number(tier) || 1);
    let chosenIds = [...selectedOccurrenceIds];
    if (chosenIds.length !== desiredCount) {
      const pool =
        classOccurrences.length > 0
          ? classOccurrences.map((o) => o.id)
          : bookableOccurrences.filter((o) => o.class_id === Number(targetClassId)).map((o) => o.id);
      if (pool.length >= desiredCount) {
        chosenIds = pool.slice(0, desiredCount);
        setSelectedOccurrenceIds(chosenIds);
      } else if (pool.length > 0 && chosenIds.length === 0) {
        chosenIds = pool;
        setSelectedOccurrenceIds(chosenIds);
        setTier(pool.length);
      }
    }

    if (chosenIds.length === 0) {
      handleTabSelect('زمان‌های آزاد', true);
      setBookingError('در حال حاضر جلسهٔ آزادی برای رزرو این کلاس ثبت نشده است.');
      toast('جلسهٔ آزادی برای رزرو یافت نشد', 'err');
      return;
    }

    if (!user) {
      const msg = 'برای تکمیل رزرو جلسه ابتدا وارد حساب کاربری خود شوید.';
      setBookingError(msg);
      toast(msg, 'err');
      navigate(`/login?next=${encodeURIComponent(`/teachers/${numericTeacherId}#slots`)}`);
      return;
    }

    const sessionsCount = chosenIds.length;

    setBookingBusy(true);
    const fingerprint = JSON.stringify([
      targetClassId,
      sessionsCount,
      chosenIds,
      payMethod,
    ]);
    const idempotencyKey =
      bookingAttemptRef.current?.fingerprint === fingerprint
        ? bookingAttemptRef.current.key
        : crypto.randomUUID();
    bookingAttemptRef.current = { fingerprint, key: idempotencyKey };

    try {
      const r = await api('/bookings', {
        method: 'POST',
        body: {
          classId: Number(targetClassId),
          sessions: sessionsCount,
          people: 1,
          occurrenceIds: chosenIds,
          method: payMethod,
          idempotencyKey,
        },
      });
      if (r.status === 'confirmed') {
        setBookingSuccess(r);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('nk:wallet-updated'));
        toast('رزرو شما با موفقیت ثبت و تأیید شد ✓');
      } else if (r.payment?.redirectUrl && r.payment.status === 'pending') {
        if (r.payment.redirectUrl.startsWith('/')) {
          navigate(r.payment.redirectUrl);
        } else {
          window.location.assign(r.payment.redirectUrl);
        }
      } else if (['failed', 'expired'].includes(r.status)) {
        bookingAttemptRef.current = null;
        const msg = 'درخواست قبلی منقضی شده است؛ لطفاً دوباره تلاش کنید.';
        setBookingError(msg);
        toast(msg, 'err');
      } else {
        setBookingSuccess(r);
        toast('درخواست رزرو ثبت شد و در انتظار تکمیل پرداخت است.');
      }
    } catch (err) {
      const msg = err?.message || 'خطا در ثبت رزرو؛ لطفاً زمان‌های منتشرشدهٔ استاد را بررسی کنید.';
      setBookingError(msg);
      toast(msg, 'err');
    } finally {
      setBookingBusy(false);
    }
  };

  const sendQuestion = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (askBusy) return;
    if (!askText.trim()) {
      toast('متن سوال را بنویسید', 'err');
      return;
    }
    if (!user) {
      toast('برای ارسال سوال به استاد ابتدا وارد حساب کاربری شوید', 'err');
      navigate(`/login?next=${encodeURIComponent(`/teachers/${numericTeacherId}#qa`)}`);
      return;
    }
    setAskBusy(true);
    try {
      await api('/questions', {
        method: 'POST',
        body: {
          teacherId: numericTeacherId,
          teacher_id: numericTeacherId,
          text: askText.trim(),
        },
      });
      setAsked(true);
      setAskOpen(false);
      setAskText('');
      toast('سوال شما برای استاد ارسال شد ✓');
      api(`/teachers/${numericTeacherId}`)
        .then((d) => {
          if (Array.isArray(d.questions)) setQuestions(d.questions);
        })
        .catch(() => {});
    } catch (err) {
      toast(err.message || 'خطا در ارسال سوال', 'err');
    } finally {
      setAskBusy(false);
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

  const basePrice = teacher?.price || 280000;
  const sessionMinutes = teacher?.session_minutes || 90;
  const selectedClassObj = allActiveClasses.find((c) => c.id === selectedClassId) || allActiveClasses[0] || null;
  const selectedClassFull = selectedClassObj
    ? (selectedClassObj.taken || 0) >= (selectedClassObj.capacity || 10)
    : false;

  const credentialsList =
    Array.isArray(teacher?.credentials) && teacher.credentials.length > 0
      ? teacher.credentials.map((c) => ({
          icon: IconCap,
          title: c.title,
          org: c.org || 'تأییدشده در پروندهٔ علمی استاد',
          tag: c.status || 'تأیید مدرک',
        }))
      : [
          { icon: IconCap, title: 'کارشناسی ارشد فیزیک حالت جامد', org: 'دانشگاه صنعتی شریف · ۱۳۹۴', tag: 'تأیید مدرک' },
          { icon: IconCap, title: 'کارشناسی فیزیک', org: 'دانشگاه تبریز · ۱۳۹۲', tag: 'تأیید مدرک' },
          { icon: IconBook, title: 'دبیر فیزیک، دبیرستان علامه حلی ۳', org: '۱۳۹۷ تا ۱۴۰۰', tag: null },
          { icon: IconMedal, title: 'مدرس برتر المپیاد فیزیک استان تهران', org: '۱۳۹۸', tag: 'تأیید گواهی' },
        ];

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
            <Link to={`/classes?subject=${encodeURIComponent(teacher?.subject || 'فیزیک')}`}>
              {teacher?.subject || 'فیزیک'}
            </Link>
            <span className="sep">›</span>
            <span className="here">{tName}</span>
          </div>

          <div className="tp-card">
            <div style={{ position: 'relative' }}>
              <div
                className="avatar sq-88"
                style={{ width: 128, height: 128, fontSize: 46, borderRadius: 'var(--r-2xl)' }}
              >
                {tName[0] || 'س'}
              </div>
              <span className="avatar-verified" style={{ width: 36, height: 36, bottom: -6, left: -6 }}>
                <IconShield size={19} />
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {teacher?.month_badge ? (
                  <span className="chip dark">برتر ماه</span>
                ) : (
                  <span className="chip dark">استاد منتخب</span>
                )}
                <span className="chip soft-green">سطح: {teacher?.level || 'متخصص'}</span>
                <span className="chip outline">
                  <IconGlobe size={14} /> {teacher?.areas || 'آنلاین و حضوری'}
                </span>
              </div>
              <h1 className="t-h2">{tName}</h1>
              <p className="t-muted" style={{ marginTop: 10 }}>
                {teacher?.title || 'دبیر فیزیک و ریاضی متوسطه دوم · کارشناسی ارشد فیزیک از دانشگاه صنعتی شریف'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {(Array.isArray(teacher?.badges) && teacher.badges.length > 0
                  ? teacher.badges
                  : ['فیزیک دهم تا دوازدهم', 'ریاضی نهم', 'حل تمرین', 'آمادگی امتحان نهایی', 'کنکور ریاضی']
                ).map((c) => (
                  <span className="chip outline" key={c}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={() => {
                  handleTabSelect('زمان‌های آزاد', true);
                  scrollToSection('book', true);
                }}
              >
                رزرو جلسه <IconArrowLeft size={19} />
              </button>
              <button
                className="btn btn-outline btn-block"
                type="button"
                onClick={() => {
                  setAskOpen((v) => !v);
                  handleTabSelect('پرسش و پاسخ', true);
                }}
              >
                <IconChat size={18} /> پرسیدن سوال از استاد
              </button>
              {askOpen && (
                <div className="card-soft" style={{ padding: 12 }}>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="سوال خود را بنویسید…"
                    value={askText}
                    onChange={(e) => setAskText(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                  <button
                    className="btn btn-primary btn-block"
                    type="button"
                    disabled={askBusy}
                    style={{ marginTop: 8 }}
                    onClick={sendQuestion}
                  >
                    {askBusy ? 'در حال ارسال…' : 'ارسال سوال'}
                  </button>
                </div>
              )}
              {asked && !askOpen && (
                <div
                  className="t-caption"
                  style={{ color: 'var(--secondary)', fontWeight: 700, textAlign: 'center' }}
                >
                  سوال شما ارسال شد ✓
                </div>
              )}
              <div className="field-hint" style={{ justifyContent: 'center' }}>
                <IconClock size={14} /> معمولاً کمتر از ۲ ساعت پاسخ می‌دهد
              </div>
            </div>
          </div>

          {/* stats */}
          <div className="tp-stats">
            <div className="cell">
              <div
                className="v num"
                style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}
              >
                <IconStar size={16} style={{ color: 'var(--accent)' }} />{' '}
                {reviewData?.summary?.average == null
                  ? '—'
                  : faNum(Math.round(reviewData.summary.average * 10) / 10)}
              </div>
              <div className="l">میانگین رضایت‌های منتشرشده</div>
            </div>
            <div className="cell">
              <div className="v num">
                {reviewData ? faNum(reviewData.summary.verifiedStudents) : '—'}
              </div>
              <div className="l">شاگرد</div>
            </div>
            <div className="cell">
              <div className="v num">
                {reviewData ? faNum(reviewData.summary.verifiedSessions) : '—'}
              </div>
              <div className="l">جلسه برگزارشده</div>
            </div>
            <div className="cell">
              <div className="v num">
                {teacher?.years ? `${faNum(teacher.years)} سال` : 'ثبت نشده'}
              </div>
              <div className="l">سابقه‌ی تدریس</div>
            </div>
            <div className="cell">
              <div className="v num">۹۸٪</div>
              <div className="l">حضور به‌موقع</div>
            </div>
          </div>

          {/* tabs */}
          <div className="tp-tabs" role="tablist" aria-label="بخش‌های پروفایل استاد">
            {TAB_CONFIG.map((item) => {
              const isActive = tab === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? 'is-active' : ''}
                  onClick={() => handleTabSelect(item.label, true)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- content ---------- */}
      <div className="container section-tight" style={{ paddingTop: 8 }}>
        <div className="sc-layout">
          {/* main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* 1. معرفی (#about) */}
            <section
              id="about"
              className="card"
              style={{
                borderRadius: 'var(--r-2xl)',
                padding: 30,
                scrollMarginTop: 112,
                borderColor: tab === 'معرفی' ? 'var(--primary)' : undefined,
              }}
            >
              <h2 className="t-h3">{content.aboutTitle ?? 'درباره‌ی من'}</h2>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setVideoPlaying((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setVideoPlaying((v) => !v);
                  }
                }}
                style={{
                  marginTop: 20,
                  borderRadius: 'var(--r-xl)',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg,#0a6847,#053d29)',
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  color: '#fff',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: '50%',
                    background: '#fff',
                    color: 'var(--primary)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IconPlay size={30} />
                </div>
                <b>{teacher?.video || 'ویدیوی معرفی · ۱ دقیقه و ۲۰ ثانیه'}</b>
                <span
                  className="t-small"
                  style={{ opacity: 0.85, display: 'inline-flex', gap: 6, alignItems: 'center' }}
                >
                  <IconVideo size={15} />{' '}
                  {videoPlaying
                    ? `پیش‌نمایش معرفی صوتی و تصویری ${tName} فعال شد`
                    : 'پخش از آپارات'}
                </span>
              </div>

              <p style={{ lineHeight: 2.3, marginTop: 20, textAlign: 'justify' }}>
                {content.bio ??
                  teacher?.about ??
                  'نه سال است فیزیک درس می‌دهم؛ پنج سال در دبیرستان‌های منطقه ۳ تهران و از ۱۴۰۱ به‌صورت آنلاین. کلاس‌هایم با یک سؤال از زندگی روزمره شروع می‌شود و بعد به فرمول می‌رسیم. برای هر شاگرد بعد از جلسه‌ی اول یک برنامه‌ی ۸ جلسه‌ای می‌نویسم و بعد از هر جلسه گزارش کوتاه برای خودش و والدینش می‌فرستم.'}
              </p>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 22, gap: 14 }}>
                <div className="info-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ic">
                      <IconBook size={20} />
                    </span>
                    <b style={{ fontSize: 13.5 }}>روش تدریس</b>
                  </div>
                  <span className="t-small t-muted">
                    {teacher?.methods || 'مفهومی + حل مسئله‌ی پله‌ای'}
                  </span>
                </div>
                <div className="info-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ic">
                      <IconVideo size={20} />
                    </span>
                    <b style={{ fontSize: 13.5 }}>بستر آنلاین</b>
                  </div>
                  <span className="t-small t-muted">
                    {teacher?.platform ? `${teacher.platform} با قلم نوری` : 'اسکای‌روم با قلم نوری'}
                  </span>
                </div>
                <div className="info-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ic">
                      <IconMapPin size={20} />
                    </span>
                    <b style={{ fontSize: 13.5 }}>حضوری و پوشش</b>
                  </div>
                  <span className="t-small t-muted">
                    {teacher?.areas || 'مناطق ۱، ۲، ۳ و ۶ تهران'}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. کلاس‌های فعال (#active-classes) */}
            <section
              id="active-classes"
              className="card"
              style={{
                borderRadius: 'var(--r-2xl)',
                padding: 30,
                scrollMarginTop: 112,
                borderColor: tab === 'کلاس‌های فعال' ? 'var(--primary)' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 className="t-h3">کلاس‌های فعال استاد ({faNum(allActiveClasses.length)})</h2>
                  <p className="t-small t-muted" style={{ marginTop: 4 }}>
                    دوره‌های خصوصی، گروهی و دوستانهٔ ثبت‌شده برای {tName} با ظرفیت واقعی سرور
                  </p>
                </div>
                <Link to={`/classes?q=${encodeURIComponent(tName)}`} className="btn btn-outline btn-sm">
                  مشاهده در فهرست کلاس‌ها
                </Link>
              </div>

              {allActiveClasses.length === 0 ? (
                <div className="card-soft" style={{ padding: 20, marginTop: 16 }}>
                  <p className="t-small t-muted">
                    در حال حاضر کلاس فعالی برای این استاد در فهرست دوره‌ها ثبت نشده است.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                  {allActiveClasses.map((c) => {
                    const seatsLeft = Math.max(0, (c.capacity || 0) - (c.taken || 0));
                    const isFull = seatsLeft <= 0;
                    const isSelected = selectedClassId === c.id;
                    return (
                      <div
                        key={c.id}
                        className="card-soft"
                        style={{
                          padding: '18px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                          borderColor: isSelected ? 'var(--primary)' : undefined,
                          background: isSelected ? 'var(--secondary-50)' : undefined,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <b style={{ fontSize: 16 }}>{c.title}</b>
                            <span className={`chip ${isFull ? '' : 'soft-green'}`}>
                              {isFull ? 'تکمیل ظرفیت' : `${faNum(seatsLeft)} نیمکت خالی از ${faNum(c.capacity)}`}
                            </span>
                          </div>
                          <div className="t-small t-muted num" style={{ marginTop: 6 }}>
                            برنامه: {c.days} ساعت {c.time} · {faNum(c.sessions || 8)} جلسه · هر جلسه{' '}
                            {faPrice(c.price)} تومان
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-soft-green' : 'btn-outline'}`}
                            onClick={() => {
                              setSelectedClassId(c.id);
                              scrollToSection('book', true);
                            }}
                          >
                            {isSelected ? 'انتخاب‌شده در فرم رزرو ✓' : 'انتخاب در فرم رزرو'}
                          </button>
                          <Link to={`/classes/${c.id}`} className="btn btn-primary btn-sm">
                            {isFull ? 'مشاهده جزئیات' : 'صفحه کلاس و رزرو'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. زمان‌های آزاد (#slots) */}
            <div
              style={{
                borderRadius: 'var(--r-2xl)',
                outline: tab === 'زمان‌های آزاد' ? '1.5px solid var(--primary)' : 'none',
              }}
            >
              <PublicTeacherSchedule
                teacherId={numericTeacherId}
                initialData={initialEntity?.availability || null}
                title={content.availabilityTitle || 'زمان‌های آزاد هفته‌ی آینده'}
                slots={teacher?.slots || []}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => {
                  setSelectedSlot(slot);
                  setBookingError('');
                }}
                selectedOccurrenceIds={selectedOccurrenceIds}
                onToggleOccurrence={handleToggleOccurrence}
                onAvailabilityChange={setAvailabilityState}
                onSelectClassId={setSelectedClassId}
                activeClassesCount={allActiveClasses.length}
                sessionMinutes={sessionMinutes}
              />
            </div>

            {/* 4. سوابق و مدارک (#credentials) */}
            <section
              id="credentials"
              className="card"
              style={{
                borderRadius: 'var(--r-2xl)',
                padding: 30,
                scrollMarginTop: 112,
                borderColor: tab === 'سوابق و مدارک' ? 'var(--primary)' : undefined,
              }}
            >
              <div
                className="tp-section-head"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}
              >
                <h2 className="t-h3">{content.credentialsTitle ?? 'سوابق تحصیلی و حرفه‌ای'}</h2>
                <span className="chip soft-green">
                  <IconShield size={14} /> مدارک توسط کارشناس نیمکت بررسی شده
                </span>
              </div>

              <div style={{ marginTop: 22 }}>
                {credentialsList.map((h, i) => (
                  <div
                    key={`${h.title}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 0',
                      borderBottom: i < credentialsList.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span className="ic avatar sq-52 tint-green" style={{ borderRadius: 'var(--r-md)' }}>
                      <h.icon size={22} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>{h.title}</b>
                      <div className="t-small t-muted">{h.org}</div>
                    </div>
                    {h.tag && (
                      <span className="chip soft-green">
                        <IconCheck size={13} /> {h.tag.startsWith('تأیید') ? h.tag : `تأیید ${h.tag}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 5. رضایت‌های منتشرشده (#reviews & #public-reviews) */}
            <div
              id="reviews"
              style={{
                scrollMarginTop: 112,
                borderRadius: 'var(--r-2xl)',
                outline: tab === 'رضایت‌های منتشرشده' ? '1.5px solid var(--primary)' : 'none',
              }}
            >
              <PublicTeacherReviews teacherId={numericTeacherId} initialData={reviewData} />
            </div>

            {/* 6. پرسش و پاسخ (#qa) */}
            <section
              id="qa"
              className="card"
              style={{
                borderRadius: 'var(--r-2xl)',
                padding: 30,
                scrollMarginTop: 112,
                borderColor: tab === 'پرسش و پاسخ' ? 'var(--primary)' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 className="t-h3">پرسش و پاسخ با استاد ({faNum(questions.length)})</h2>
                  <p className="t-small t-muted" style={{ marginTop: 4 }}>
                    سوال‌های آموزشی یا هماهنگی پیش از رزرو را مستقیماً از {tName} بپرسید.
                  </p>
                </div>
              </div>

              <form onSubmit={sendQuestion} className="card-soft" style={{ padding: 18, marginTop: 16 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>
                  سوال جدید از استاد
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="سوال خود را دربارهٔ سطح کلاس، منابع یا زمان جلسات بنویسید…"
                    value={askText}
                    onChange={(e) => setAskText(e.target.value)}
                    style={{ marginTop: 8, width: '100%', resize: 'vertical' }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="t-caption t-muted">
                    {user ? `ارسال با نام ${user.name}` : 'برای ثبت سوال نیاز به ورود به حساب کاربری دارید.'}
                  </span>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={askBusy}>
                    {askBusy ? 'در حال ارسال…' : 'ثبت و ارسال سوال'}
                  </button>
                </div>
              </form>

              {questions.length === 0 ? (
                <p className="t-small t-muted" style={{ marginTop: 16 }}>
                  هنوز پرسشی برای این استاد ثبت نشده است؛ اولین سوال را شما بپرسید.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                  {questions.map((q) => (
                    <div key={q.id || q.text} className="card-soft" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <b>{q.author || 'شاگرد'}</b>
                        <span className="t-muted">{q.date_label || ''}</span>
                      </div>
                      <p style={{ marginTop: 6, fontSize: 14 }}>{q.text}</p>
                      {q.answer && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: '1px solid var(--border)',
                            fontSize: 13.5,
                            color: 'var(--primary)',
                          }}
                        >
                          <b>پاسخ استاد:</b> {q.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 7. گزارش آموزشی (#academic-report) */}
            <section
              id="academic-report"
              className="card"
              style={{
                borderRadius: 'var(--r-2xl)',
                padding: 30,
                scrollMarginTop: 112,
                borderColor: tab === 'گزارش آموزشی' ? 'var(--primary)' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 className="t-h3">گزارش آموزشی هشت‌شاخصی</h2>
                  <p className="t-small t-muted" style={{ marginTop: 4 }}>
                    پس از هر جلسهٔ تأییدشده، استاد روند پیشرفت شاگرد را در ۸ شاخص استاندارد نیمکت ثبت می‌کند.
                  </p>
                </div>
                <span className="chip soft-green">
                  <IconChart size={14} /> ارسال به پنل شاگرد و والد
                </span>
              </div>

              {Array.isArray(teacher?.subratings) && teacher.subratings.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  {teacher.subratings.map((sr) => (
                    <div key={sr.label} className="card-soft" style={{ padding: '14px 16px' }}>
                      <div className="t-caption t-muted">{sr.label}</div>
                      <div className="num" style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
                        {faNum(sr.value)} <small style={{ fontSize: 12, color: 'var(--muted)' }}>از ۵</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  marginTop: 18,
                }}
              >
                {ACADEMIC_INDICATORS.map((ind, idx) => (
                  <div
                    key={ind}
                    className="card-soft"
                    style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}
                  >
                    <span
                      className="num"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--secondary-50)',
                        color: 'var(--primary)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: 12,
                        flex: 'none',
                      }}
                    >
                      {faNum(idx + 1)}
                    </span>
                    <span>{ind}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span className="t-caption t-muted">
                  گزارش‌های واقعی شاگردان فقط برای خود شاگرد و والد دارای مجوز قابل مشاهده است.
                </span>
                <Link to="/panel/reports" className="btn btn-outline btn-sm">
                  مشاهده کارنامه و گزارش‌های من
                </Link>
              </div>
            </section>
          </div>

          {/* left sidebar: booking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="book-box" id="book" style={{ scrollMarginTop: 112 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="t-caption t-muted">
                    هر جلسه‌ی {faNum(sessionMinutes)} دقیقه
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900 }} className="num">
                    {faPrice(selectedClassObj?.price || basePrice)}
                  </div>
                  <div className="t-caption t-muted">تومان</div>
                </div>
                <span className="chip soft-green">جلسه‌ی اول با ضمانت</span>
              </div>

              <hr className="divider" />

              {allActiveClasses.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>
                    انتخاب کلاس استاد
                    <select
                      className="select"
                      aria-label="انتخاب کلاس استاد"
                      value={selectedClassId || ''}
                      onChange={(e) => {
                        setSelectedClassId(Number(e.target.value));
                        setSelectedOccurrenceIds([]);
                        setBookingError('');
                      }}
                      style={{ marginTop: 6, padding: '10px 12px', fontSize: 13.5 }}
                    >
                      {allActiveClasses.map((c) => {
                        const seatsLeft = Math.max(0, (c.capacity || 0) - (c.taken || 0));
                        return (
                          <option key={c.id} value={c.id}>
                            {c.title} ({seatsLeft > 0 ? `${faNum(seatsLeft)} ظرفیت خالی` : 'تکمیل ظرفیت'})
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="field-label" style={{ fontSize: 13 }}>تعداد جلسات رزرو</span>
                  <div className="stepper">
                    <button
                      type="button"
                      aria-label="افزایش تعداد جلسات در پروفایل استاد"
                      onClick={() => {
                        const next = Math.min(16, (Number(tier) || 1) + 1);
                        setTier(next);
                        if (classOccurrences.length >= next) {
                          setSelectedOccurrenceIds(classOccurrences.slice(0, next).map((o) => o.id));
                        }
                        setBookingError('');
                      }}
                    >
                      +
                    </button>
                    <span className="val num">{faNum(effectiveSessions)}</span>
                    <button
                      type="button"
                      aria-label="کاهش تعداد جلسات در پروفایل استاد"
                      disabled={effectiveSessions <= 1}
                      onClick={() => {
                        const next = Math.max(1, effectiveSessions - 1);
                        setTier(next);
                        if (selectedOccurrenceIds.length > next) {
                          setSelectedOccurrenceIds(selectedOccurrenceIds.slice(0, next));
                        }
                        setBookingError('');
                      }}
                    >
                      −
                    </button>
                  </div>
                </div>
                {[
                  { s: 1, d: 0, label: '۱ جلسه (تک‌جلسه)' },
                  { s: 4, d: 5, label: '۴ جلسه' },
                  { s: 8, d: 10, label: '۸ جلسه' },
                  { s: 16, d: 15, label: '۱۶ جلسه' },
                ].map((t) => (
                  <button
                    key={t.s}
                    type="button"
                    aria-pressed={effectiveSessions === t.s}
                    className={`tier-row ${effectiveSessions === t.s ? 'is-on' : ''}`}
                    onClick={() => {
                      setTier(t.s);
                      if (classOccurrences.length >= t.s) {
                        setSelectedOccurrenceIds(classOccurrences.slice(0, t.s).map((o) => o.id));
                      } else {
                        setSelectedOccurrenceIds([]);
                      }
                      setBookingError('');
                    }}
                  >
                    <span>{t.label}</span>
                    <span>{t.d > 0 ? `${faNum(t.d)}٪ تخفیف` : 'قیمت پایه'}</span>
                  </button>
                ))}
              </div>

              {/* Selected slot / occurrence summary */}
              <div
                className="card-soft"
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="t-muted">زمان انتخابی:</span>
                  {selectedOccurrenceIds.length > 0 ? (
                    <b className="num" style={{ color: 'var(--primary)' }}>
                      {faNum(selectedOccurrenceIds.length)} جلسهٔ تقویمی انتخاب شده
                    </b>
                  ) : selectedSlot ? (
                    <b className="num" style={{ color: 'var(--primary)' }}>
                      {selectedSlot.day} · ساعت {selectedSlot.time}
                    </b>
                  ) : (
                    <button
                      type="button"
                      style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12.5 }}
                      onClick={() => handleTabSelect('زمان‌های آزاد', true)}
                    >
                      انتخاب از زمان‌های آزاد ↓
                    </button>
                  )}
                </div>
                {quote && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px dashed var(--border)',
                      paddingTop: 6,
                    }}
                  >
                    <span className="t-muted">
                      مبلغ {faNum(effectiveSessions)} جلسه پس از تخفیف:
                    </span>
                    <b className="num">{faPrice(quote.total)} تومان</b>
                  </div>
                )}
                {quoteLoading && (
                  <span className="t-caption t-muted">در حال محاسبهٔ قیمت سرور…</span>
                )}
              </div>

              <div
                className="segmented"
                style={{ width: '100%', marginTop: 12 }}
                role="group"
                aria-label="روش پرداخت رزرو"
              >
                <button
                  type="button"
                  className={payMethod === 'gateway' ? 'is-active' : ''}
                  onClick={() => setPayMethod('gateway')}
                  style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                >
                  درگاه بانکی
                </button>
                <button
                  type="button"
                  className={payMethod === 'wallet' ? 'is-active' : ''}
                  onClick={() => setPayMethod('wallet')}
                  style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                >
                  کیف پول
                </button>
              </div>

              {bookingError && (
                <div
                  role="alert"
                  className="card-soft"
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    background: 'var(--error-50)',
                    color: 'var(--error)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    lineHeight: 1.8,
                  }}
                >
                  {bookingError}
                </div>
              )}

              {bookingSuccess && (
                <div
                  role="status"
                  className="card-soft"
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    background: 'var(--secondary-50)',
                    color: 'var(--primary)',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  <b>رزرو شما با موفقیت ثبت شد ✓</b>
                  <div className="t-caption t-muted num" style={{ marginTop: 4 }}>
                    کد رزرو: {faNum(bookingSuccess.bookingId)} · مبلغ: {faPrice(bookingSuccess.total)} تومان
                  </div>
                  <Link to="/panel" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    مشاهده در پنل من
                  </Link>
                </div>
              )}

              <button
                type="button"
                data-testid="teacher-book-btn"
                disabled={bookingBusy || availabilityState.loading}
                onClick={handleBookNow}
                className="btn btn-primary btn-block btn-lg"
                style={{ marginTop: 14 }}
              >
                {bookingBusy
                  ? 'در حال ثبت رزرو…'
                  : availabilityState.loading
                    ? 'در حال بررسی زمان‌های آزاد…'
                    : 'انتخاب زمان و رزرو'}
              </button>

              {selectedClassObj && (
                <Link
                  to={`/classes/${selectedClassObj.id}`}
                  className="btn btn-outline btn-sm btn-block"
                  style={{ marginTop: 8 }}
                >
                  {selectedClassFull
                    ? 'مشاهده جزئیات کلاس (تکمیل ظرفیت)'
                    : 'مشاهده صفحهٔ کامل کلاس و سرفصل‌ها'}
                </Link>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <span className="field-hint">
                  <IconRefresh size={15} /> لغو رایگان تا ۲۴ ساعت قبل از جلسه
                </span>
                <span className="field-hint">
                  <IconUserPlus size={15} /> رزرو دوستانه تا ۵ نفر
                </span>
                <span className="field-hint">
                  <IconLock size={15} /> پرداخت امن از درگاه بانکی
                </span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16.5 }}>{content.classesTitle ?? 'کلاس‌های گروهی فعال'}</h3>
                <button
                  type="button"
                  style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}
                  onClick={() => handleTabSelect('کلاس‌های فعال', true)}
                >
                  مشاهده همه
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                {allActiveClasses.length > 0 ? (
                  allActiveClasses.map((c) => {
                    const seatsLeft = Math.max(0, (c.capacity || 0) - (c.taken || 0));
                    const isSelected = selectedClassId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`gc-mini ${isSelected ? 'is-active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedClassId(c.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <b style={{ fontSize: 14 }}>{c.title}</b>
                          {seatsLeft > 0 ? (
                            <span className="chip soft-orange">{faNum(seatsLeft)} جای خالی</span>
                          ) : (
                            <span className="chip">تکمیل</span>
                          )}
                        </div>
                        <div className="t-small t-muted num">
                          {c.days} {c.time} · {faNum(c.sessions || 8)} جلسه
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="t-caption num" style={{ fontWeight: 800 }}>
                            {faPrice(c.price)} تومان
                          </span>
                          <Link
                            to={`/classes/${c.id}`}
                            className="t-caption"
                            style={{ color: 'var(--primary)', fontWeight: 800 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            صفحه کلاس ←
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="t-small t-muted">در حال حاضر کلاس گروهی فعالی برای این استاد ثبت نشده است.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16.5 }}>مدارک</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {['مدرک ارشد', 'گواهی المپیاد', 'کارت ملی', 'سابقه‌ی بیمه'].map((d) => (
                  <span
                    className="chip outline"
                    key={d}
                    style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
                  >
                    <IconBook size={14} /> {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
