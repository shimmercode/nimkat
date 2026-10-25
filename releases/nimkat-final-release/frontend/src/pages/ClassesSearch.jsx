import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconSearch, IconGlobe, IconMapPin, IconStar, IconChevronDown, IconInfo, IconUserPlus,
  IconUsers, IconUser, IconClock, IconBook, IconHeart, IconArrowLeft, IconBulb, IconX,
} from '../components/icons.jsx';
import { faNum, faPrice } from '../utils/fa.js';
import { toast } from '../utils/toast.js';

/* ---------- data per CLASSES.pdf ---------- */
const SUGGESTIONS = [
  { name: 'سارا محمدی', letter: 'س', color: '', tag: 'برتر ماه', tagType: 'dark', subject: 'فیزیک و ریاضی', rating: '۴٫۹', id: 1 },
  { name: 'امیر رضایی', letter: 'ا', color: 'green', tag: 'برتر ماه', tagType: 'dark', subject: 'فیزیک کنکور', rating: '۴٫۹', id: 2 },
  { name: 'کاوه مرادی', letter: 'ک', color: 'tint-green', tag: 'برتر ماه', tagType: 'dark', subject: 'فیزیک پایه', rating: '۴٫۸', id: 4 },
  { name: 'نگار سلطانی', letter: 'ن', color: 'tint-orange', tag: 'مناسب سطح شما', tagType: 'soft-orange', subject: 'فیزیک پایه', rating: '۴٫۸', id: 3 },
  { name: 'رضا جعفری', letter: 'ر', color: 'gray', tag: 'نزدیک محل شما', tagType: 'soft-orange', subject: 'حل تمرین', rating: '۴٫۷', id: 5 },
];

const RESULTS = [
  {
    id: 1, letter: 'س', color: '', level: 'متخصص', teacher: 'سارا محمدی',
    title: 'فیزیک یازدهم؛ مفهومی و حل مسئله از پایه',
    tags: ['برتر ماه', 'جلسه‌ی اول با ضمانت'], tagTypes: ['dark', 'soft-green'],
    mode: 'آنلاین · اسکای‌روم', reviews: '۳۲۰ نظر', rating: '۴٫۹',
    times: ['شنبه ۱۷:۰۰', 'دوشنبه ۱۸:۰۰', 'چهارشنبه ۱۲:۰۰'],
    price: 280000, offer: 'جلسه‌ی اول با ضمانت', kind: 'خصوصی',
  },
  {
    id: 4, letter: 'ک', color: 'tint-green', level: 'کارشناس', teacher: 'کاوه مرادی',
    title: 'حل تمرین فیزیک یازدهم برای امتحانات نوبت اول',
    tags: ['٪۱۲ تخفیف ۸ جلسه'], tagTypes: ['soft-orange'],
    mode: 'آنلاین · اسکای‌روم', reviews: '۱۴۸ نظر', rating: '۴٫۸',
    times: ['یکشنبه ۱۹:۰۰', 'سه‌شنبه ۱۹:۰۰'],
    price: 210000, oldPrice: 240000, kind: 'خصوصی',
  },
  {
    id: 5, letter: 'ر', color: 'gray', level: 'کارشناس', teacher: 'رضا جعفری',
    title: 'فیزیک یازدهم در منزل؛ مناطق ۱ تا ۶ تهران',
    tags: ['حضوری'], tagTypes: ['outline'],
    mode: 'حضوری · منزل شاگرد', reviews: '۹۶ نظر', rating: '۴٫۷',
    times: ['شنبه ۱۴:۳۰', 'چهارشنبه ۱۶:۰۰'],
    price: 350000, kind: 'حضوری',
  },
  {
    id: 3, letter: 'ن', color: 'tint-orange', level: 'متخصص', teacher: 'نگار سلطانی',
    title: 'فیزیک یازدهم دوستانه؛ مناسب گروه‌های ۲ تا ۵ نفره',
    tags: ['دوستانه', 'پیشنهاد استاد'], tagTypes: ['soft-green', 'soft-orange'],
    mode: 'آنلاین · فنوتک', reviews: '۲۲۱ نظر', rating: '۴٫۸',
    times: ['دوشنبه ۱۵:۰۰', 'پنجشنبه ۱۰:۰۰'],
    price: 190000, kind: 'دوستانه',
  },
];

const DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function SuggCard({ s }) {
  return (
    <div className="sugg-card">
      <span className={`chip ${s.tagType}`}>{s.tag}</span>
      <div className={`avatar sq-64 ${s.color}`}>{s.letter}</div>
      <b style={{ fontSize: 15 }}>{s.name}</b>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{s.subject}</span>
      <span className="rate-num" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
        <IconStar size={13} style={{ color: 'var(--accent)' }} /> {s.rating}
      </span>
      <Link to={`/teachers/${s.id}`} className="btn btn-outline-green btn-block btn-sm" style={{ marginTop: 6 }}>
        پروفایل و زمان‌ها
      </Link>
    </div>
  );
}

function ResultCard({ r }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="result-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <div className={`avatar sq-88 ${r.color}`} style={{ position: 'relative' }}>
          {r.letter}
        </div>
        <span className={`chip ${r.level === 'متخصص' ? 'soft-green' : 'outline'}`} style={{ fontSize: 11.5 }}>
          {r.level}
        </span>
      </div>

      <div className="info" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {r.tags.map((t, i) => (
            <span key={t} className={`chip ${r.tagTypes[i]}`}>{t}</span>
          ))}
        </div>
        <h3>
          <Link to={`/classes/${r.id}`}>{r.title}</Link>
        </h3>
        <div className="t-small t-muted" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 700, color: 'var(--ink)' }}>
            <span className={`avatar ${r.color}`} style={{ width: 22, height: 22, fontSize: 10, borderRadius: 6 }}>{r.letter}</span>
            {r.teacher}
          </span>
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <IconStar size={13} style={{ color: 'var(--accent)' }} /> {r.rating}
          </span>
          <span className="num">({r.reviews})</span>
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            {r.mode.includes('حضوری') ? <IconMapPin size={14} /> : <IconGlobe size={14} />} {r.mode}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="t-caption t-muted">نزدیک‌ترین زمان‌ها:</span>
          {r.times.map((t) => (
            <span key={t} className="time-chip num">{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="chip outline">درس‌ها و گزینه‌های استاد</span>
          <span className="chip outline">فیزیک یازدهم</span>
          <span className="chip outline">ریاضی نهم</span>
          <span className="chip outline">آمادگی امتحان نهایی</span>
        </div>
      </div>

      <div className="price-col">
        {r.oldPrice && (
          <span className="t-caption t-muted num" style={{ textDecoration: 'line-through' }}>
            {faPrice(r.oldPrice)}
          </span>
        )}
        <div>
          <div className="t-caption t-muted">هر جلسه</div>
          <div style={{ fontSize: 19, fontWeight: 900 }} className="num">
            {faPrice(r.price)}
          </div>
          <div className="t-caption t-muted">تومان</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/classes/${r.id}`} className="btn btn-primary" style={{ flex: 1 }}>
            رزرو
          </Link>
          <button className="btn-icon-round" type="button" aria-label="ذخیره" onClick={() => { setSaved((v) => !v); }} style={saved ? { color: 'var(--error)', borderColor: 'var(--error)', background: 'rgba(180,42,72,.08)' } : undefined}>
            <IconHeart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesSearch() {
  const [kind, setKind] = useState('خصوصی');
  const [mode, setMode] = useState('آنلاین');
  const [days, setDays] = useState(['ش', 'د']);
  const [hour, setHour] = useState('عصر');
  const [levels, setLevels] = useState(['متخصص', 'کارشناس']);
  const [gender, setGender] = useState('فرقی ندارد');
  const [rating, setRating] = useState('۴٫۵ به بالا');
  const [price, setPrice] = useState(400000);
  const [sort, setSort] = useState('پیشنهاد نیمکت');
  const [page, setPage] = useState(1);

  const toFaDigit = (d) => String(d).replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);
  const toEn = (t) => String(t).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const dayLetter = (t) => ({ 'شنبه': 'ش', 'یکشنبه': 'ی', 'دوشنبه': 'د', 'سه‌شنبه': 'س', 'چهارشنبه': 'چ', 'پنجشنبه': 'پ', 'جمعه': 'ج' }[String(t).slice(0, String(t).indexOf(' '))] || '');
  const hourBucket = (t) => {
    const m = String(t).match(/(\d{1,2}):/);
    const h = m ? Number(toEn(m[1])) : 12;
    return h < 12 ? 'صبح' : h < 15 ? 'ظهر' : h < 19 ? 'عصر' : 'شب';
  };

  const filtered = RESULTS.filter((r) => {
    if (!(kind === 'خصوصی' ? r.kind === 'خصوصی' || r.kind === 'حضوری' : r.kind === kind)) return false;
    if (mode !== 'هر دو' && !r.mode.startsWith(mode)) return false;
    if (levels.length && !levels.includes(r.level)) return false;
    if (r.price > price) return false;
    const rv = Number(toEn(r.rating).replace('٫', '.'));
    if (rating.startsWith('۴٫۵') && rv < 4.5) return false;
    if (rating === '۴ به بالا' && rv < 4) return false;
    if (days.length && !r.times.some((t) => days.includes(dayLetter(t)))) return false;
    if (hour && !r.times.some((t) => hourBucket(t) === hour)) return false;
    return true;
  });

  const isDefaultView =
    kind === 'خصوصی' && mode === 'آنلاین' && days.join() === ['ش', 'د'].join() && hour === 'عصر' &&
    levels.join() === ['متخصص', 'کارشناس'].join() && gender === 'فرقی ندارد' && rating === '۴٫۵ به بالا' && price === 400000;

  const sorted = [...(isDefaultView ? RESULTS : filtered)].sort((a, b) => {
    if (sort === 'بیشترین امتیاز') return Number(toEn(b.rating).replace('٫', '.')) - Number(toEn(a.rating).replace('٫', '.'));
    if (sort === 'کمترین قیمت') return a.price - b.price;
    if (sort === 'نزدیک‌ترین زمان') return a.times[0].localeCompare(b.times[0], 'fa');
    return 0;
  });

  const clearFilters = () => {
    setKind('خصوصی');
    setMode('آنلاین');
    setDays(['ش', 'د']);
    setHour('عصر');
    setLevels(['متخصص', 'کارشناس']);
    setGender('فرقی ندارد');
    setRating('۴٫۵ به بالا');
    setPrice(400000);
    setSort('پیشنهاد نیمکت');
    toast('فیلترها پاک شدند');
  };

  const toggle = (arr, setArr, v) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <>
      {/* ---------- head ---------- */}
      <div className="page-head">
        <div className="container">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">خانه</Link>
            <span className="sep">›</span>
            <Link to="/classes">کلاس‌ها</Link>
            <span className="sep">›</span>
            <span className="here">فیزیک · متوسطه دوم</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h1 className="t-h2">کلاس فیزیک یازدهم</h1>
              <p className="t-muted" style={{ marginTop: 8 }}>
                ۴۶ استاد و ۹ کلاس گروهی با شرایط انتخابی شما پیدا شد.
              </p>
            </div>
            <div className="segmented">
              <button className={mode === 'آنلاین' ? 'is-active' : ''} onClick={() => setMode('آنلاین')} type="button">
                <IconGlobe size={16} /> آنلاین
              </button>
              <button className={mode === 'حضوری' ? 'is-active' : ''} onClick={() => setMode('حضوری')} type="button">
                <IconMapPin size={16} /> حضوری
              </button>
              <button className={mode === 'هر دو' ? 'is-active' : ''} onClick={() => setMode('هر دو')} type="button">
                هر دو
              </button>
            </div>
          </div>

          {/* search card */}
          <div className="card-flat" style={{ marginTop: 26, padding: 24 }}>
            <div className="kind-switch">
              {[
                { k: 'خصوصی', icon: IconUser, t: 'کلاس خصوصی', s: 'یک‌به‌یک با استاد' },
                { k: 'گروهی', icon: IconUsers, t: 'کلاس گروهی', s: 'دوره‌های ثبت‌نامی ۴ تا ۱۲ نفر' },
                { k: 'دوستانه', icon: IconUserPlus, t: 'کلاس دوستانه', s: 'تا ۵ نفر، تخفیف پلکانی' },
              ].map(({ k, icon: Ic, t, s }) => (
                <button key={k} type="button" className={`radio-card ${kind === k ? 'is-active' : ''}`} onClick={() => setKind(k)}>
                  <span className="radio-dot" />
                  <span style={{ flex: 1 }}>
                    <b style={{ display: 'block', fontSize: 15 }}>{t}</b>
                    <span className="t-small t-muted">{s}</span>
                  </span>
                  <span
                    className="avatar sq-40"
                    style={{ background: kind === k ? 'var(--primary)' : 'var(--n70)', color: kind === k ? '#fff' : 'var(--muted)' }}
                  >
                    <Ic size={19} />
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 14, alignItems: 'end', marginTop: 20 }}>
              {[
                { label: 'مقطع', val: 'متوسطه دوم', opts: ['ابتدایی', 'متوسطه اول', 'متوسطه دوم', 'کنکور'] },
                { label: 'رشته', val: 'ریاضی فیزیک', opts: ['ریاضی فیزیک', 'تجربی', 'انسانی'] },
                { label: 'پایه', val: 'یازدهم', opts: ['دهم', 'یازدهم', 'دوازدهم'] },
                { label: 'درس', val: 'فیزیک', opts: ['فیزیک', 'ریاضی', 'شیمی'] },
              ].map((f) => (
                <div className="field" key={f.label}>
                  <label className="field-label">{f.label}</label>
                  <div className="select-wrap">
                    <select className="select" defaultValue={f.val}>
                      {f.opts.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                    <IconChevronDown size={16} className="chev" />
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" style={{ height: 50 }} type="button" onClick={() => toast(`نتایج به‌روزرسانی شد · ${faNum(sorted.length)} کلاس`)} >
                <IconSearch size={18} /> به‌روزرسانی
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- nimkat suggestions ---------- */}
      <section className="section-tight">
        <div className="container">
          <div className="section-head" style={{ marginBottom: 22 }}>
            <div className="titles">
              <h2 className="t-h3">پیشنهاد نیمکت برای شما</h2>
              <p className="section-sub">۳ استاد برتر این ماه و ۲ پیشنهاد بر اساس سطح و محل شما</p>
            </div>
            <span className="link-more">
              <IconInfo size={17} /> چطور انتخاب می‌کنیم؟
            </span>
          </div>
          <div className="row-scroll">
            {SUGGESTIONS.map((s) => (
              <SuggCard s={s} key={s.name} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- results + filters ---------- */}
      <section className="section-tight" style={{ paddingTop: 10 }}>
        <div className="container filter-layout">
          {/* filters (right side in RTL) */}
          <aside className="filter-side">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17 }}>فیلترها</h3>
              <button type="button" className="btn-ghost btn-sm" onClick={clearFilters} style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <IconX size={14} /> پاک کردن همه
              </button>
            </div>
            <div className="t-caption t-muted num" style={{ marginTop: 4 }}>۱۴۴ نتیجه · صفحه‌ی ۱ از ۱۴</div>

            <div className="filter-block">
              <div className="ft">قیمت هر جلسه</div>
              <input type="range" min="100000" max="600000" step="50000" value={price} onChange={(e) => setPrice(+e.target.value)} />
              <div className="range-row">
                <span className="num">{faPrice(price)} تومان</span>
                <span className="num">۱۰۰٬۰۰۰ تومان</span>
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">روزهای هفته</div>
              <div className="day-chips">
                {DAYS.map((d) => (
                  <button key={d} type="button" className={`day-chip ${days.includes(d) ? 'is-on' : ''}`} onClick={() => toggle(days, setDays, d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">ساعت</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['صبح', 'ظهر', 'عصر', 'شب'].map((h) => (
                  <button key={h} type="button" className={`chip ${hour === h ? 'is-active' : 'outline'}`} onClick={() => setHour(h)}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="ft">امتیاز استاد</div>
              {['۴٫۵ به بالا', '۴ به بالا'].map((rv) => (
                <label key={rv} className={`check-row ${rating === rv ? 'is-on' : ''}`} style={{ marginBottom: 10 }} onClick={() => setRating(rv)}>
                  <span className="checkbox">{rating === rv ? '✓' : ''}</span>
                  {rv}
                  <span className="t-caption t-muted num" style={{ marginRight: 'auto' }}>
                    {rv === '۴٫۵ به بالا' ? '۱۲۱' : '۲۴۲'}
                  </span>
                </label>
              ))}
            </div>

            <div className="filter-block">
              <div className="ft">سطح استاد</div>
              {[
                ['مربی', '۵'], ['کارشناس', '۳۴'], ['متخصص', '۱۹'], ['استاد ارشد', '۷'],
              ].map(([lv, cnt]) => (
                <label key={lv} className={`check-row ${levels.includes(lv) ? 'is-on' : ''}`} style={{ marginBottom: 10 }} onClick={() => toggle(levels, setLevels, lv)}>
                  <span className="checkbox">{levels.includes(lv) ? '✓' : ''}</span>
                  {lv}
                  <span className="t-caption t-muted num" style={{ marginRight: 'auto' }}>{cnt}</span>
                </label>
              ))}
            </div>

            <div className="filter-block">
              <div className="ft">بستر برگزاری</div>
              {[
                ['اسکای‌روم', '۳۸'], ['فنوتک', '۱۱'], ['گوگل‌میت', '۹'],
              ].map(([p, cnt]) => (
                <label key={p} className="check-row is-on" style={{ marginBottom: 10 }}>
                  <span className="checkbox">✓</span>
                  {p}
                  <span className="t-caption t-muted num" style={{ marginRight: 'auto' }}>{cnt}</span>
                </label>
              ))}
            </div>

            <div className="filter-block">
              <div className="ft">جنسیت استاد</div>
              <div className="segmented" style={{ width: '100%' }}>
                {['فرقی ندارد', 'خانم', 'آقا'].map((g) => (
                  <button key={g} type="button" className={gender === g ? 'is-active' : ''} onClick={() => setGender(g)} style={{ flex: 1, justifyContent: 'center' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div className="sort-row">
                <span className="t-caption t-muted" style={{ fontWeight: 800 }}>مرتب‌سازی:</span>
                {['پیشنهاد نیمکت', 'بیشترین امتیاز', 'کمترین قیمت', 'نزدیک‌ترین زمان'].map((s) => (
                  <button key={s} type="button" className={`chip ${sort === s ? 'is-active' : 'outline'}`} onClick={() => setSort(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="card-soft" style={{ padding: 34, textAlign: 'center' }}>
                <b style={{ fontSize: 16 }}>نتیجه‌ای با این فیلترها پیدا نشد</b>
                <div className="t-small t-muted" style={{ marginTop: 8 }}>فیلترها را تغییر دهید یا «پاک کردن همه» را بزنید.</div>
                <button className="btn btn-outline" type="button" style={{ marginTop: 14 }} onClick={clearFilters}>پاک کردن فیلترها</button>
              </div>
            ) : (
              sorted.map((r) => (
                <ResultCard r={r} key={r.id} />
              ))
            )}

            {/* bottom CTA */}
            <div className="card-soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '22px 26px', borderStyle: 'dashed' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <IconBulb size={26} style={{ color: 'var(--accent-800)' }} />
                <div>
                  <b style={{ fontSize: 15.5 }}>استاد مورد نظرتان را پیدا نکردید؟</b>
                  <div className="t-small t-muted" style={{ marginTop: 4 }}>
                    درخواست بدهید؛ حداکثر تا ۲۴ ساعت یک استاد مناسب به شما پیشنهاد می‌شود.
                  </div>
                </div>
              </div>
              <button className="btn btn-outline" type="button" onClick={() => toast('درخواست شما ثبت شد؛ حداکثر تا ۲۴ ساعت استاد پیشنهاد می‌شود ✓')}>پیشنهاد استاد</button>
            </div>

            {/* pager */}
            <div className="pager" style={{ marginTop: 10 }}>
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>›</button>
              <button type="button" className={`num ${page === 14 ? 'is-on' : ''}`} onClick={() => setPage(14)}>۱۴</button>
              <button type="button" onClick={() => setPage(5)}>…</button>
              <button type="button" className={`num ${page === 3 ? 'is-on' : ''}`} onClick={() => setPage(3)}>۳</button>
              <button type="button" className={`num ${page === 2 ? 'is-on' : ''}`} onClick={() => setPage(2)}>۲</button>
              <button type="button" className={`num ${page === 1 ? 'is-on' : ''}`} onClick={() => setPage(1)}>۱</button>
              <button type="button" onClick={() => setPage((p) => Math.min(14, p + 1))}>‹</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
