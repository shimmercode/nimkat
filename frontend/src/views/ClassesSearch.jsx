'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from '../routing/navigation';
import {
  IconGlobe, IconMapPin, IconStar, IconCheck, IconClock, IconCalendar,
  IconArrowLeft, IconChevronLeft, IconChevronRight, IconInfo, IconUsers, IconShield, IconX,
  IconSearch, IconFilter, IconSparkle, IconHeart, IconUser, IconUserPlus,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { api } from '../api.js';
import { toast } from '../utils/toast.js';
import { useInitialEntity } from '../render/EntityContext.jsx';
import LiveSearch, { normalizePersianQuery } from '../components/LiveSearch.jsx';
import {
  SEGMENTS,
  fieldsForSegment,
  gradesForSegment,
  subjectsForSegment,
  matchesSegment,
} from '../utils/curriculum.js';

const PAGE_SIZE = 4;

const KIND_MAP = { group: 'گروهی', friendly: 'دوستانه', private: 'خصوصی' };

const FEMALE_NAMES = ['سارا', 'نگار', 'مریم', 'زهرا', 'فاطمه', 'نیلوفر', 'الهام', 'نازنین', 'مهسا', 'شیرین'];

function inferTeacherGender(item) {
  if (item.teacherGender === 'خانم' || item.teacherGender === 'آقا') return item.teacherGender;
  const first = String(item.teacher || '').trim().split(/\s+/)[0];
  return FEMALE_NAMES.includes(first) ? 'خانم' : 'آقا';
}

function mapApiClass(c) {
  const t = c.teacher || {};
  const isPrivate = c.kind === 'private';
  return {
    id: c.id,
    teacherId: t.id || c.teacher_id || 1,
    kind: KIND_MAP[c.kind] || c.kind || 'گروهی',
    mode: c.mode || 'آنلاین',
    platform: c.platform || (c.mode === 'حضوری' ? 'منزل شاگرد' : 'اسکای‌روم'),
    grade: c.grade || 'یازدهم',
    field: c.field || 'ریاضی فیزیک',
    subject: c.subject || 'فیزیک',
    teacher: t.name || 'سارا محمدی',
    teacherGender: c.teacher_gender || t.gender || undefined,
    letter: (t.name || 'س')[0],
    color: c.id % 2 ? 'green' : 'tint-green',
    role: `${t.level || 'متخصص'} · دبیر ${c.subject || 'فیزیک'}`,
    level: t.level || 'متخصص',
    badges: Array.isArray(c.badges) ? c.badges : [],
    rating: faNum(c.rating || 4.8),
    ratingNum: Number(c.rating || 4.8),
    reviews: faNum(c.reviews_count || 0),
    title: c.title || 'کلاس آموزشی نیمکت',
    subtitle: isPrivate ? c.title : undefined,
    meta: isPrivate
      ? `${c.mode || 'آنلاین'} · ${c.platform || 'اسکای‌روم'} · جلسات ${faNum(c.session_minutes || 90)} دقیقه‌ای`
      : [
          `ظرفیت ${faNum(c.capacity || 10)} نفر`,
          `${c.days || ''} ${c.time || ''}`.trim(),
          `${faNum(c.sessions || 8)} جلسه · ${c.platform || c.mode}`,
        ],
    tags: isPrivate ? ['امتحان نهایی', 'تقویتی', 'کنکور'] : undefined,
    slots: isPrivate
      ? ['شنبه ۱۶:۰۰', 'دوشنبه ۱۸:۰۰', 'چهارشنبه ۱۷:۰۰']
      : [`${c.days || 'پنجشنبه'} ${c.time || '۱۶:۰۰'}`.trim()],
    seatsLeft: Math.max(0, (c.capacity || 0) - (c.taken || 0)),
    progress: c.capacity ? Math.min(100, Math.round(((c.taken || 0) / c.capacity) * 100)) : 0,
    capacityText: `${faNum(c.taken || 0)} از ${faNum(c.capacity || 0)} نفر ثبت‌نام کرده‌اند`,
    price: c.price || 280000,
    unit: isPrivate ? 'هر جلسه' : 'هر نفر / جلسه',
    discount: isPrivate ? '۱۰٪ تخفیف ۸ جلسه' : '۲۰٪ تخفیف دوستانه تا ۵ نفر',
    full: c.capacity ? (c.taken || 0) >= c.capacity : false,
  };
}

function parseClassHourBucket(c) {
  const raw = Array.isArray(c.meta) ? c.meta.join(' ') : String(c.meta || '') + ' ' + (c.slots || []).join(' ');
  const normalized = raw.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const match = normalized.match(/(\d{1,2}):\d{2}/);
  if (!match) return ['ظهر', 'عصر'];
  const h = Number(match[1]);
  if (h < 12) return ['صبح'];
  if (h < 15) return ['ظهر'];
  if (h < 19) return ['عصر'];
  return ['شب'];
}

function parseClassDays(c) {
  const raw = Array.isArray(c.meta) ? c.meta.join(' ') : String(c.meta || '') + ' ' + (c.slots || []).join(' ');
  const days = [];
  if (raw.includes('یکشنبه')) days.push('ی');
  if (raw.includes('دوشنبه')) days.push('د');
  if (raw.includes('سه‌شنبه') || raw.includes('سه شنبه')) days.push('س');
  if (raw.includes('چهارشنبه')) days.push('چ');
  if (raw.includes('پنجشنبه')) days.push('پ');
  if (raw.includes('جمعه')) days.push('ج');
  if (raw.replace(/یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنجشنبه/g, '').includes('شنبه')) days.push('ش');
  return days.length ? days : ['ش', 'د', 'پ'];
}

export default function ClassesSearch({ content = {}, preview = false } = {}) {
  const initialEntity = useInitialEntity();
  const { search } = useLocation();

  const [kind, setKind] = useState('همه');
  const [mode, setMode] = useState('هر دو');
  const [segment, setSegment] = useState('همه');
  const [field, setField] = useState('همه');
  const [gradeLevel, setGradeLevel] = useState('همه');
  const [lesson, setLesson] = useState('همه');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('پیشنهاد نیمکت');
  const [price, setPrice] = useState(600000);
  const [days, setDays] = useState([]);
  const [hour, setHour] = useState('');
  const [levels, setLevels] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [gender, setGender] = useState('فرقی ندارد');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);

  const [catalog, setCatalog] = useState(() =>
    initialEntity?.classes?.length ? initialEntity.classes.map(mapApiClass) : []
  );
  const [suggested, setSuggested] = useState(() => initialEntity?.suggested || []);
  const [loading, setLoading] = useState(!initialEntity?.classes?.length);
  const [catalogError, setCatalogError] = useState('');

  // Modals state
  const [howModalOpen, setHowModalOpen] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ name: '', phone: '', topic: '', note: '' });
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestDone, setSuggestDone] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  const mountedRef = useRef(true);
  const hydratedQueryRef = useRef(false);
  const syncingFromSearchRef = useRef(true);
  const catalogReqSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const rawSearch = typeof window !== 'undefined' ? (window.location.search || search || '') : (search || '');
    const params = new URLSearchParams(rawSearch);
    const qKind = params.get('kind');
    const qMode = params.get('mode');
    const qGrade = params.get('grade');
    const qSubject = params.get('subject');
    const qField = params.get('field');
    const qGradeLevel = params.get('gradeLevel');
    const qSearch = params.get('q');

    if (qKind && ['همه', 'خصوصی', 'گروهی', 'دوستانه'].includes(qKind)) setKind(qKind);
    if (qMode && ['هر دو', 'آنلاین', 'حضوری'].includes(qMode)) setMode(qMode);
    if (qGrade) {
      if (SEGMENTS.includes(qGrade)) {
        setSegment(qGrade);
      } else {
        setGradeLevel(qGrade);
      }
    }
    if (qField) setField(qField);
    if (qGradeLevel) setGradeLevel(qGradeLevel);
    if (qSubject) setLesson(qSubject);
    if (qSearch !== null) setQuery(qSearch);
    setPage(1);
    syncingFromSearchRef.current = true;
    hydratedQueryRef.current = true;
  }, [search]);

  useEffect(() => {
    if (!hydratedQueryRef.current || preview || typeof window === 'undefined') return;
    if (syncingFromSearchRef.current) {
      syncingFromSearchRef.current = false;
      return;
    }
    if (window.location.pathname !== '/classes') return;
    const params = new URLSearchParams();
    if (kind !== 'همه') params.set('kind', kind);
    if (mode !== 'هر دو') params.set('mode', mode);
    if (segment !== 'همه') params.set('grade', segment);
    if (field !== 'همه') params.set('field', field);
    if (gradeLevel !== 'همه') params.set('gradeLevel', gradeLevel);
    if (lesson !== 'همه') params.set('subject', lesson);
    if (query.trim()) params.set('q', query.trim());
    const qs = params.toString();
    const nextUrl = qs ? `/classes?${qs}` : '/classes';
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [kind, mode, segment, field, gradeLevel, lesson, query, preview]);

  const loadCatalog = useCallback((silent = false) => {
    const seq = ++catalogReqSeqRef.current;
    if (!silent) setLoading(true);
    setCatalogError('');
    api('/classes')
      .then((d) => {
        if (!mountedRef.current || seq !== catalogReqSeqRef.current) return;
        if (Array.isArray(d.classes)) {
          setCatalog(d.classes.map(mapApiClass));
        }
        if (Array.isArray(d.suggested) && d.suggested.length > 0) {
          setSuggested(d.suggested);
        }
      })
      .catch((e) => {
        if (!mountedRef.current || seq !== catalogReqSeqRef.current) return;
        setCatalogError(e.message || 'دریافت فهرست کلاس‌ها ممکن نشد.');
      })
      .finally(() => {
        if (mountedRef.current && seq === catalogReqSeqRef.current) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadCatalog(Boolean(initialEntity?.classes?.length));
  }, [loadCatalog, initialEntity?.classes?.length]);

  // Close modals on Escape
  useEffect(() => {
    if (!howModalOpen && !suggestModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setHowModalOpen(false);
        setSuggestModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [howModalOpen, suggestModalOpen]);

  const validFields = useMemo(() => fieldsForSegment(segment), [segment]);
  const validGrades = useMemo(() => gradesForSegment(segment), [segment]);
  const validSubjects = useMemo(() => subjectsForSegment(segment, true), [segment]);

  const handleSegmentChange = (nextSegment) => {
    setSegment(nextSegment);
    const nextFields = fieldsForSegment(nextSegment);
    const nextGrades = gradesForSegment(nextSegment);
    const nextSubjects = subjectsForSegment(nextSegment, true);
    if (!nextFields.includes(field)) setField('همه');
    if (!nextGrades.includes(gradeLevel)) setGradeLevel('همه');
    if (!nextSubjects.includes(lesson)) setLesson('همه');
    setPage(1);
  };

  const toggleDay = (d) => {
    setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));
    setPage(1);
  };
  const toggleLevel = (l) => {
    setLevels((ls) => (ls.includes(l) ? ls.filter((x) => x !== l) : [...ls, l]));
    setPage(1);
  };
  const togglePlatform = (p) => {
    setPlatforms((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));
    setPage(1);
  };

  const clearFilters = () => {
    setKind('همه');
    setMode('هر دو');
    setSegment('همه');
    setField('همه');
    setGradeLevel('همه');
    setLesson('همه');
    setQuery('');
    setDays([]);
    setHour('');
    setLevels([]);
    setPlatforms([]);
    setGender('فرقی ندارد');
    setRating('');
    setPrice(600000);
    setSort('پیشنهاد نیمکت');
    setPage(1);
    toast('همه‌ی فیلترها پاک شد');
  };

  const filtered = useMemo(() => {
    const q = normalizePersianQuery(query);
    return catalog.filter((c) => {
      if (kind !== 'همه' && c.kind !== kind) return false;
      if (mode !== 'هر دو' && c.mode !== mode) return false;
      if (!matchesSegment(c, segment)) return false;
      if (field !== 'همه' && c.field && c.field !== field) return false;
      if (gradeLevel !== 'همه' && c.grade && c.grade !== gradeLevel) return false;
      if (lesson !== 'همه' && c.subject !== lesson) return false;
      if (c.price > price) return false;
      if (levels.length && !levels.some((l) => c.role.includes(l) || c.level === l)) return false;
      if (platforms.length && !platforms.some((p) => (c.platform || '').includes(p))) return false;
      if (gender !== 'فرقی ندارد' && inferTeacherGender(c) !== gender) return false;
      if (rating === '۴٫۵ به بالا' && c.ratingNum < 4.5) return false;
      if (rating === '۴ به بالا' && c.ratingNum < 4.0) return false;
      if (days.length) {
        const classDays = parseClassDays(c);
        if (!days.some((d) => classDays.includes(d))) return false;
      }
      if (hour) {
        const buckets = parseClassHourBucket(c);
        if (!buckets.includes(hour)) return false;
      }
      if (q) {
        const hay = normalizePersianQuery(
          [c.title, c.subtitle, c.teacher, c.subject, c.grade, c.field, c.platform]
            .filter(Boolean)
            .join(' ')
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [catalog, kind, mode, segment, field, gradeLevel, lesson, price, levels, platforms, gender, rating, days, hour, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === 'کمترین قیمت') return a.price - b.price;
      if (sort === 'بالاترین امتیاز' || sort === 'بیشترین امتیاز') return b.ratingNum - a.ratingNum;
      if (sort === 'نزدیک‌ترین جلسه' || sort === 'نزدیک‌ترین زمان') return (a.seatsLeft ?? 99) - (b.seatsLeft ?? 99);
      return 0;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Dynamic facet counts from catalog
  const facetCounts = useMemo(() => {
    const rate45 = catalog.filter((c) => c.ratingNum >= 4.5).length;
    const rate40 = catalog.filter((c) => c.ratingNum >= 4.0).length;
    const countLevel = (l) => catalog.filter((c) => c.level === l || (c.role || '').includes(l)).length;
    const countPlatform = (p) => catalog.filter((c) => (c.platform || '').includes(p)).length;
    return { rate45, rate40, countLevel, countPlatform };
  }, [catalog]);

  const dynamicHeading = useMemo(() => {
    if (content.title && lesson === 'همه' && segment === 'همه' && gradeLevel === 'همه') return content.title;
    const parts = ['کلاس'];
    if (lesson !== 'همه') parts.push(lesson);
    if (gradeLevel !== 'همه') parts.push(gradeLevel);
    else if (segment !== 'همه') parts.push(segment);
    if (kind !== 'همه') parts.push(`(${kind})`);
    return parts.length > 1 ? parts.join(' ') : 'کلاس فیزیک یازدهم';
  }, [content.title, lesson, gradeLevel, segment, kind]);

  const submitTeacherSuggestion = async (e) => {
    e.preventDefault();
    setSuggestError('');
    const digits = String(suggestForm.phone)
      .replace(/[\u06F0-\u06F9]/g, (x) => String(x.charCodeAt(0) - 0x06F0))
      .replace(/[^\d]/g, '');
    if (suggestForm.name.trim().length < 2) {
      setSuggestError('نام و نام خانوادگی را وارد کنید (حداقل ۲ حرف).');
      return;
    }
    if (digits.length !== 11 || !digits.startsWith('09')) {
      setSuggestError('شماره موبایل ۱۱ رقمی معتبر با شروع ۰۹ وارد کنید.');
      return;
    }
    setSuggestBusy(true);
    try {
      const summaryName = `${suggestForm.name.trim()} | پیشنهاد استاد: ${suggestForm.topic.trim() || `${lesson !== 'همه' ? lesson : 'عمومی'} - ${segment}`} ${suggestForm.note.trim() ? `(${suggestForm.note.trim()})` : ''}`.slice(0, 200);
      await api('/callback', {
        method: 'POST',
        body: { phone: digits, name: summaryName },
      });
      setSuggestDone(true);
      toast('درخواست پیشنهاد استاد با موفقیت ثبت شد ✓');
    } catch (err) {
      setSuggestError(err.message || 'خطا در ثبت درخواست؛ دوباره تلاش کنید.');
    } finally {
      setSuggestBusy(false);
    }
  };

  const DEFAULT_SUGGESTED = [
    { id: 1, name: 'سارا محمدی', subject: 'فیزیک و ریاضی', level: 'متخصص', rating: 4.9, reviews_count: 312, price: 450000, badge: 'برتر ماه', tone: 'dark' },
    { id: 2, name: 'امیر رضایی', subject: 'فیزیک کنکور', level: 'متخصص', rating: 4.9, reviews_count: 221, price: 520000, badge: 'برتر ماه', tone: 'dark' },
    { id: 4, name: 'کاوه مرادی', subject: 'فیزیک یازدهم', level: 'کارشناس', rating: 4.8, reviews_count: 148, price: 350000, badge: 'برتر ماه', tone: 'dark' },
    { id: 3, name: 'نگار سلطانی', subject: 'فیزیک پایه', level: 'متخصص', rating: 4.8, reviews_count: 180, price: 220000, badge: 'مناسب سطح شما', tone: 'soft-orange' },
    { id: 5, name: 'رضا جعفری', subject: 'حل تمرین', level: 'کارشناس', rating: 4.7, reviews_count: 96, price: 350000, badge: 'نزدیک محل شما', tone: 'soft' },
  ];

  const suggestedItems = useMemo(() => {
    if (!suggested.length) return DEFAULT_SUGGESTED;
    const byId = new Map(suggested.map((s) => [Number(s.id), s]));
    const merged = DEFAULT_SUGGESTED.map((d) => {
      const apiItem = byId.get(Number(d.id));
      return apiItem ? { ...d, ...apiItem, badge: apiItem.badge || d.badge, tone: apiItem.tone || d.tone } : d;
    });
    for (const s of suggested) {
      if (!merged.some((m) => Number(m.id) === Number(s.id))) merged.push(s);
    }
    return merged;
  }, [suggested]);

  return (
    <>
      {/* ---------- page-head (matches CLASSES.pdf & global.css) ---------- */}
      <div className="page-head">
        <div className="container">
          <div className="crumbs" style={{ marginBottom: 14 }}>
            <Link to="/">خانه</Link>
            <span className="sep">›</span>
            <Link to="/classes">کلاس‌ها</Link>
            <span className="sep">›</span>
            <span className="here">
              {lesson !== 'همه' ? lesson : 'فیزیک'} · {segment !== 'همه' ? segment : 'متوسطه دوم'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1 className="t-h2">{dynamicHeading}</h1>
              <p className="t-small t-muted num" style={{ marginTop: 6 }}>
                {faNum(sorted.length)} استاد و کلاس فعال با شرایط انتخابی شما پیدا شد.
              </p>
            </div>

            <div className="segmented" role="group" aria-label="شیوه برگزاری">
              {['آنلاین', 'حضوری', 'هر دو'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={mode === m ? 'is-active' : ''}
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m);
                    setPage(1);
                  }}
                >
                  {m === 'آنلاین' && <IconGlobe size={15} />}
                  {m === 'حضوری' && <IconMapPin size={15} />}
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Kind Switch Box */}
          <div
            className="card"
            style={{
              marginTop: 22,
              padding: 20,
              borderRadius: 'var(--r-2xl)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="kind-switch" role="group" aria-label="نوع کلاس">
              {[
                { key: 'خصوصی', title: 'کلاس خصوصی', sub: 'یک‌به‌یک با استاد', icon: IconUser },
                { key: 'گروهی', title: 'کلاس گروهی', sub: 'دوره‌های ثبت‌نامی ۴ تا ۱۲ نفر', icon: IconUsers },
                { key: 'دوستانه', title: 'کلاس دوستانه', sub: 'تا ۵ نفر · تخفیف پلکانی', icon: IconUserPlus },
              ].map((item) => {
                const isActive = kind === item.key;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={isActive}
                    className={`radio-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setKind((cur) => (cur === item.key ? 'همه' : item.key));
                      setPage(1);
                    }}
                  >
                    <span
                      className="avatar sq-40 tint-green"
                      style={{
                        background: isActive ? 'var(--primary)' : 'var(--n50)',
                        color: isActive ? '#fff' : 'var(--primary)',
                      }}
                    >
                      <IconComp size={19} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <b style={{ display: 'block', fontSize: 14.5 }}>{item.title}</b>
                      <span className="t-caption t-muted">{item.sub}</span>
                    </div>
                    <span className="radio-dot" />
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>جستجوی زنده درس، استاد یا عنوان کلاس</div>
              <LiveSearch
                variant="catalog"
                value={query}
                onChange={(val) => {
                  setQuery(val);
                  setPage(1);
                }}
                onSubmitQuery={(val) => {
                  setQuery(val);
                  setPage(1);
                }}
                placeholder="نام درس، موضوع یا نام استاد را بنویسید (مثلاً: فیزیک، شیمی، سارا محمدی)…"
              />
            </div>

            <div
              className="search-fields"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
                alignItems: 'end',
                marginTop: 16,
              }}
            >
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>مقطع</div>
                <select
                  aria-label="مقطع"
                  className="select"
                  value={segment}
                  onChange={(e) => handleSegmentChange(e.target.value)}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'همه' ? 'همهٔ مقاطع' : s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>رشته</div>
                <select
                  aria-label="رشته"
                  className="select"
                  value={field}
                  onChange={(e) => {
                    setField(e.target.value);
                    setPage(1);
                  }}
                >
                  {validFields.map((f) => (
                    <option key={f} value={f}>
                      {f === 'همه' ? 'همهٔ رشته‌ها' : f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>پایه</div>
                <select
                  aria-label="پایه"
                  className="select"
                  value={gradeLevel}
                  onChange={(e) => {
                    setGradeLevel(e.target.value);
                    setPage(1);
                  }}
                >
                  {validGrades.map((g) => (
                    <option key={g} value={g}>
                      {g === 'همه' ? 'همهٔ پایه‌ها' : g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>درس</div>
                <select
                  aria-label="درس"
                  className="select"
                  value={lesson}
                  onChange={(e) => {
                    setLesson(e.target.value);
                    setPage(1);
                  }}
                >
                  {validSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s === 'همه' ? 'همهٔ دروس' : s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ height: 48 }}
                onClick={() => setPage(1)}
              >
                <IconSearch size={17} /> به‌روزرسانی
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- suggested teachers ("پیشنهاد نیمکت برای شما") ---------- */}
      <section className="section-tight" style={{ paddingBottom: 12 }}>
        <div className="container">
          <div className="section-head" style={{ marginBottom: 18 }}>
            <div className="titles">
              <h2 className="t-h4" style={{ fontSize: 20 }}>
                {content.suggestionsTitle ?? content.suggestedTitle ?? 'پیشنهاد نیمکت برای شما'}
              </h2>
              <p className="t-caption t-muted">
                ۳ استاد برتر این ماه و پیشنهاد بر اساس سطح و محل شما
              </p>
            </div>
            <button
              type="button"
              className="link-more"
              onClick={() => setHowModalOpen(true)}
              aria-haspopup="dialog"
              style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 13.5 }}
            >
              <IconInfo size={16} /> چطور انتخاب می‌کنیم؟
            </button>
          </div>

          <div className="row-scroll">
            {suggestedItems.map((s, idx) => {
              const badgeText = s.badge || 'برتر ماه';
              const badgeClass =
                s.tone === 'soft-orange'
                  ? 'soft-orange'
                  : s.tone === 'soft'
                    ? 'outline'
                    : 'dark';
              return (
                <div
                  key={s.id || s.name}
                  className="sugg-card"
                  style={{
                    borderColor: idx === 2 ? 'var(--accent)' : undefined,
                  }}
                >
                  <span className={`chip ${badgeClass}`} style={{ fontSize: 11.5 }}>
                    {badgeText}
                  </span>
                  <div
                    className={`avatar sq-64 ${
                      idx === 0
                        ? ''
                        : idx === 1
                          ? 'green'
                          : idx === 2
                            ? 'tint-green'
                            : idx === 3
                              ? 'tint-orange'
                              : 'gray'
                    }`}
                  >
                    {(s.name || 'س')[0]}
                  </div>
                  <b style={{ fontSize: 15 }}>{s.name}</b>
                  <span className="t-caption t-muted">
                    {s.subject || 'فیزیک'} {s.level ? `· ${s.level}` : ''}
                  </span>
                  <div
                    className="num"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    <IconStar size={14} style={{ color: 'var(--accent)' }} /> {faNum(s.rating || 4.8)}
                  </div>
                  <Link
                    to={`/teachers/${s.id || 1}`}
                    className="btn btn-outline btn-sm btn-block"
                    style={{ marginTop: 4 }}
                  >
                    پروفایل و زمان‌ها
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- main filter-layout ---------- */}
      <section className="section-tight" style={{ paddingTop: 18 }}>
        <div className="container filter-layout">
          {/* ============ sidebar filters (.filter-side) ============ */}
          <aside className="filter-side">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 14,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <b style={{ fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <IconFilter size={17} /> {content.filtersTitle ?? 'فیلترها'}
              </b>
              <button
                type="button"
                onClick={clearFilters}
                style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                پاک کردن همه
              </button>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>جستجوی نام استاد یا کلاس</span>
              </div>
              <input
                type="search"
                className="input"
                aria-label="جستجوی نام استاد یا کلاس"
                placeholder="مثلاً سارا محمدی یا کولن…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>قیمت هر جلسه</span>
              </div>
              <input
                type="range"
                aria-label="حداکثر قیمت هر جلسه"
                min={100000}
                max={600000}
                step={20000}
                value={price}
                onChange={(e) => {
                  setPrice(Number(e.target.value));
                  setPage(1);
                }}
              />
              <div className="range-row">
                <span className="num">۱۰۰٬۰۰۰</span>
                <b className="num" style={{ color: 'var(--ink)' }}>
                  {faPrice(price)} تومان
                </b>
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>روزهای هفته</span>
              </div>
              <div className="day-chips">
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={days.includes(d)}
                    className={`day-chip ${days.includes(d) ? 'is-on' : ''}`}
                    onClick={() => toggleDay(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>ساعت</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {['صبح', 'ظهر', 'عصر', 'شب'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={hour === h}
                    className={`opt-chip ${hour === h ? 'is-on' : ''}`}
                    style={{ padding: '7px 8px', fontSize: 12.5 }}
                    onClick={() => {
                      setHour((cur) => (cur === h ? '' : h));
                      setPage(1);
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>امتیاز استاد</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: '۴٫۵ به بالا', n: faNum(facetCounts.rate45) },
                  { l: '۴ به بالا', n: faNum(facetCounts.rate40) },
                ].map((r) => {
                  const on = rating === r.l;
                  return (
                    <div
                      key={r.l}
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      className={`check-row ${on ? 'is-on' : ''}`}
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => {
                        setRating((cur) => (cur === r.l ? '' : r.l));
                        setPage(1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setRating((cur) => (cur === r.l ? '' : r.l));
                          setPage(1);
                        }
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span className="checkbox">{on && <IconCheck size={12} />}</span>
                        <span>{r.l}</span>
                      </span>
                      <span className="t-caption t-muted num">{r.n}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>سطح استاد</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'استاد ارشد', n: faNum(facetCounts.countLevel('استاد ارشد')) },
                  { l: 'متخصص', n: faNum(facetCounts.countLevel('متخصص')) },
                  { l: 'کارشناس', n: faNum(facetCounts.countLevel('کارشناس')) },
                  { l: 'مربی', n: faNum(facetCounts.countLevel('مربی')) },
                ].map((lv) => {
                  const on = levels.includes(lv.l);
                  return (
                    <div
                      key={lv.l}
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      className={`check-row ${on ? 'is-on' : ''}`}
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => toggleLevel(lv.l)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleLevel(lv.l);
                        }
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span className="checkbox">{on && <IconCheck size={12} />}</span>
                        <span>{lv.l}</span>
                      </span>
                      <span className="t-caption t-muted num">{lv.n}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>بستر برگزاری</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['اسکای‌روم', 'فنوتک', 'گوگل‌میت', 'منزل شاگرد'].map((p) => {
                  const on = platforms.includes(p);
                  return (
                    <div
                      key={p}
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      className={`check-row ${on ? 'is-on' : ''}`}
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => togglePlatform(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          togglePlatform(p);
                        }
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span className="checkbox">{on && <IconCheck size={12} />}</span>
                        <span>{p}</span>
                      </span>
                      <span className="t-caption t-muted num">{faNum(facetCounts.countPlatform(p))}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">
                <span>جنسیت استاد</span>
              </div>
              <div className="segmented" style={{ width: '100%' }}>
                {['فرقی ندارد', 'خانم', 'آقا'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={gender === g}
                    className={gender === g ? 'is-active' : ''}
                    style={{ flex: 1, justifyContent: 'center', padding: '8px 6px', fontSize: 12.5 }}
                    onClick={() => {
                      setGender(g);
                      setPage(1);
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ============ results column ============ */}
          <div style={{ minWidth: 0 }}>
            <div
              className="sort-row"
              style={{ justifyContent: 'space-between', marginBottom: 18 }}
            >
              <span className="t-small t-muted num">
                <b style={{ color: 'var(--ink)' }}>{faNum(sorted.length)} نتیجه</b> · صفحه‌ی{' '}
                {faNum(currentPage)} از {faNum(totalPages)}
              </span>

              <div className="sort-row">
                <span className="t-small t-muted">مرتب‌سازی:</span>
                {[
                  { key: 'پیشنهاد نیمکت', label: 'پیشنهاد نیمکت' },
                  { key: 'بالاترین امتیاز', label: 'بیشترین امتیاز' },
                  { key: 'کمترین قیمت', label: 'کمترین قیمت' },
                  { key: 'نزدیک‌ترین جلسه', label: 'نزدیک‌ترین زمان' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={sort === s.key}
                    className={`opt-chip ${sort === s.key ? 'is-on' : ''}`}
                    onClick={() => {
                      setSort(s.key);
                      setPage(1);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="card-soft" role="status" style={{ padding: 24, marginBottom: 16 }}>
                در حال دریافت فهرست کلاس‌ها و اساتید…
              </div>
            )}

            {!loading && catalogError && (
              <div
                className="card-soft"
                role="alert"
                style={{
                  padding: 20,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span>{catalogError}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={loadCatalog}>
                  تلاش مجدد
                </button>
              </div>
            )}

            {!loading && !catalogError && sorted.length === 0 && (
              <div className="card-soft" style={{ padding: 28, marginBottom: 18, textAlign: 'center' }}>
                <b style={{ fontSize: 16 }}>با فیلترهای انتخابی کلاسی پیدا نشد</b>
                <p className="t-small t-muted" style={{ marginTop: 8 }}>
                  فیلترهای درس، مقطع، محدودهٔ قیمت یا بستر برگزاری را تغییر دهید یا همه‌ی فیلترها را پاک کنید.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" onClick={clearFilters}>
                    پاک کردن همه فیلترها
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSuggestDone(false);
                      setSuggestError('');
                      setSuggestModalOpen(true);
                    }}
                  >
                    درخواست پیشنهاد استاد
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paginated.map((c) => (
                <ResultCard key={c.id} c={c} />
              ))}
            </div>

            {/* bottom helper banner (matches CLASSES.pdf) */}
            <div
              className="card-soft"
              style={{
                marginTop: 22,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
                borderRadius: 'var(--r-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  className="avatar sq-40 tint-orange"
                  style={{ borderRadius: 'var(--r-md)' }}
                >
                  <IconSparkle size={19} />
                </span>
                <div>
                  <b style={{ fontSize: 15 }}>استاد مورد نظرتان را پیدا نکردید؟</b>
                  <div className="t-caption t-muted" style={{ marginTop: 3 }}>
                    درخواست بدهید؛ حداکثر تا ۲۴ ساعت یک استاد مناسب به شما پیشنهاد می‌شود.
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setSuggestDone(false);
                  setSuggestError('');
                  setSuggestModalOpen(true);
                }}
              >
                پیشنهاد استاد
              </button>
            </div>

            {/* pagination (.pager from global.css) */}
            {sorted.length > 0 && (
              <nav
                className="pager"
                aria-label="صفحه‌بندی نتایج"
                style={{ marginTop: 26 }}
              >
                <button
                  type="button"
                  aria-label="صفحه قبل"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronRight size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-current={currentPage === p ? 'page' : undefined}
                    className={`num ${currentPage === p ? 'is-on' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {faNum(p)}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="صفحه بعد"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <IconChevronLeft size={16} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>

      {/* ============ Modal: چطور انتخاب می‌کنیم؟ ============ */}
      {howModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-we-select-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHowModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23,33,30,.55)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 580, width: '100%', padding: 28, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 id="how-we-select-title" className="t-h3" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconShield size={22} style={{ color: 'var(--primary)' }} /> چطور اساتید پیشنهادی را انتخاب می‌کنیم؟
              </h2>
              <button
                type="button"
                className="btn-icon-round"
                aria-label="بستن پنجره"
                onClick={() => setHowModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <p className="t-small t-muted" style={{ marginTop: 12, lineHeight: 2 }}>
              فهرست اساتید پیشنهادی نیمکت بر پایهٔ چهار شاخص واقعی و قابل راستی‌آزمایی از عملکرد آموزشی هر ماه تعیین می‌شود:
            </p>
            <ul className="check-list" style={{ marginTop: 16 }}>
              <li>
                <IconCheck size={18} /> <b>احراز هویت و مدارک علمی:</b> بررسی کامل مدارک تحصیلی، سوابق تدریس و مصاحبهٔ علمی در فرآیند ۱۲ مرحله‌ای جذب اساتید.
              </li>
              <li>
                <IconCheck size={18} /> <b>میانگین رضایت جلسات تأییدشده:</b> فقط نظرسنجی شاگردانی که حضور واقعی‌شان در کلاس ثبت شده در امتیاز استاد محاسبه می‌شود.
              </li>
              <li>
                <IconCheck size={18} /> <b>نظم و حضور به‌موقع:</b> عدم لغو یک‌طرفهٔ جلسات و رعایت کامل زمان‌بندی کلاس‌های آنلاین و حضوری.
              </li>
              <li>
                <IconCheck size={18} /> <b>ثبت گزارش آموزشی هشت‌شاخصی:</b> ارسال منظم بازخورد پیشرفت برای شاگرد و والدین پس از جلسات.
              </li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button type="button" className="btn btn-primary" onClick={() => setHowModalOpen(false)}>
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Modal: پیشنهاد استاد ============ */}
      {suggestModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="suggest-teacher-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSuggestModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23,33,30,.55)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 28, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 id="suggest-teacher-title" className="t-h3">
                درخواست پیشنهاد استاد متناسب با هدف شما
              </h2>
              <button
                type="button"
                className="btn-icon-round"
                aria-label="بستن فرم پیشنهاد استاد"
                onClick={() => setSuggestModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>

            {suggestDone ? (
              <div className="card-soft" style={{ marginTop: 18, padding: 20, textAlign: 'center', background: 'var(--secondary-50)' }}>
                <b style={{ fontSize: 16, color: 'var(--primary)' }}>درخواست شما در سامانه ثبت شد ✓</b>
                <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
                  کارشناسان آموزشی نیمکت با شمارهٔ <b className="num">{faNum(suggestForm.phone)}</b> تماس می‌گیرند و اساتید متناسب با مقطع و هدف شما را معرفی می‌کنند.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 14 }}
                  onClick={() => setSuggestModalOpen(false)}
                >
                  بستن
                </button>
              </div>
            ) : (
              <form onSubmit={submitTeacherSuggestion} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                {suggestError && (
                  <p role="alert" style={{ color: 'var(--error)', fontSize: 13, fontWeight: 700 }}>
                    {suggestError}
                  </p>
                )}
                <label className="field-label">
                  نام و نام خانوادگی
                  <input
                    className="input"
                    required
                    value={suggestForm.name}
                    onChange={(e) => setSuggestForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="مثلاً علی رضایی"
                    style={{ marginTop: 6 }}
                  />
                </label>
                <label className="field-label">
                  شماره موبایل (۱۱ رقمی)
                  <input
                    className="input num"
                    required
                    dir="ltr"
                    value={suggestForm.phone}
                    onChange={(e) => setSuggestForm((s) => ({ ...s, phone: e.target.value }))}
                    placeholder="09120000000"
                    style={{ marginTop: 6, textAlign: 'right' }}
                  />
                </label>
                <label className="field-label">
                  درس و مقطع مورد نظر
                  <input
                    className="input"
                    value={suggestForm.topic}
                    onChange={(e) => setSuggestForm((s) => ({ ...s, topic: e.target.value }))}
                    placeholder={`مثلاً ${lesson !== 'همه' ? lesson : 'فیزیک'} · ${segment !== 'همه' ? segment : 'متوسطه دوم'}`}
                    style={{ marginTop: 6 }}
                  />
                </label>
                <label className="field-label">
                  زمان‌های دلخواه یا هدف آموزشی (اختیاری)
                  <textarea
                    className="input"
                    rows={3}
                    value={suggestForm.note}
                    onChange={(e) => setSuggestForm((s) => ({ ...s, note: e.target.value }))}
                    placeholder="مثلاً روزهای زوج عصر، آمادگی امتحان نهایی…"
                    style={{ marginTop: 6 }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setSuggestModalOpen(false)}>
                    انصراف
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={suggestBusy}>
                    {suggestBusy ? 'در حال ثبت…' : 'ثبت درخواست مشاوره و پیشنهاد استاد'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ResultCard({ c }) {
  const isPrivate = c.kind === 'خصوصی';
  return (
    <div className="result-card" style={c.full ? { opacity: 0.78 } : undefined}>
      {/* right column (auto): teacher avatar + level badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Link to={`/teachers/${c.teacherId || 1}`} className={`avatar sq-72 ${c.color}`}>
          {c.letter}
        </Link>
        <span className="chip soft-green" style={{ fontSize: 11.5, padding: '3px 10px' }}>
          {c.level}
        </span>
      </div>

      {/* middle column (.info): badges, title, teacher meta, nearest times */}
      <div className="info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {c.badges.map((b) => (
            <span
              key={b}
              className={`chip ${
                b.includes('برتر')
                  ? 'dark'
                  : b.includes('دوستانه') || b.includes('تخفیف')
                    ? 'soft-orange'
                    : 'soft-green'
              }`}
              style={{ fontSize: 11.5 }}
            >
              {b}
            </span>
          ))}
          {c.kind === 'دوستانه' && (
            <span className="chip soft-orange" style={{ fontSize: 11.5 }}>
              دوستانه
            </span>
          )}
          {c.mode === 'حضوری' && (
            <span className="chip" style={{ fontSize: 11.5 }}>
              حضوری
            </span>
          )}
        </div>

        <h3>
          <Link to={`/classes/${c.id}`}>{c.title || c.subtitle}</Link>
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            marginTop: 6,
            fontSize: 13,
            color: 'var(--muted)',
          }}
        >
          <Link
            to={`/teachers/${c.teacherId || 1}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--ink)' }}
          >
            <IconUser size={14} /> {c.teacher}
          </Link>
          <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, color: 'var(--ink)' }}>
            <IconStar size={13} style={{ color: 'var(--accent)' }} /> {c.rating}{' '}
            <span className="t-muted" style={{ fontWeight: 500 }}>
              ({c.reviews} نظر)
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {c.mode === 'حضوری' ? <IconMapPin size={14} /> : <IconGlobe size={14} />}
            {c.mode} · {c.platform}
          </span>
        </div>

        {Array.isArray(c.slots) && c.slots.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <span className="t-caption t-muted">نزدیک‌ترین زمان‌ها:</span>
            {c.slots.map((s) => (
              <span key={s} className="time-chip num">
                {s}
              </span>
            ))}
          </div>
        )}

        {!isPrivate && (
          <div style={{ marginTop: 12, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span className="t-muted">{c.capacityText}</span>
              {c.full ? (
                <b style={{ color: 'var(--error)' }}>تکمیل ظرفیت</b>
              ) : (
                <b style={{ color: 'var(--accent-800)' }}>{faNum(c.seatsLeft)} نیمکت خالی</b>
              )}
            </div>
            <div className={`progress ${c.full ? '' : c.seatsLeft <= 3 ? '' : 'green'}`}>
              <i style={{ width: `${c.progress}%`, background: c.full ? 'var(--n500)' : undefined }} />
            </div>
          </div>
        )}
      </div>

      {/* left column (.price-col): price & CTA */}
      <div className="price-col">
        <div>
          <div className="t-caption t-muted">{c.unit}</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>
            {faPrice(c.price)}
          </div>
          <div className="t-caption t-muted">تومان</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to={`/classes/${c.id}`}
            className={`btn ${c.full ? 'btn-outline' : 'btn-primary'}`}
            style={{ flex: 1, padding: '10px 14px' }}
          >
            {c.full ? 'جزئیات' : 'رزرو'}
          </Link>
          <Link
            to={`/teachers/${c.teacherId || 1}`}
            className="btn-icon-round"
            aria-label={`پروفایل ${c.teacher}`}
            title={`پروفایل ${c.teacher}`}
            style={{ width: 42, height: 42 }}
          >
            <IconHeart size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
