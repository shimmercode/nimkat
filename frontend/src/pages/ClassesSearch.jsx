import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import { IconStar, IconClock, IconArrowLeft, IconUsers } from '../components/icons.jsx';

const KINDS = [
  { id: 'private', title: 'کلاس خصوصی', sub: 'یک‌به‌یک با استاد' },
  { id: 'group', title: 'کلاس گروهی', sub: 'دوره‌های ثبت‌نامی ۴ تا ۱۲ نفر' },
  { id: 'friendly', title: 'کلاس دوستانه', sub: 'تا ۵ نفر، تخفیف پلکانی' },
];
const SORTS = { 'پیشنهاد نیمکت': 'nimkat', 'بیشترین امتیاز': 'rating', 'کمترین قیمت': 'price', 'نزدیک‌ترین زمان': 'soon' };
const TIMES = ['صبح', 'ظهر', 'عصر', 'شب'];
const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];

export default function ClassesSearch() {
  const [data, setData] = useState(null);
  const [kind, setKind] = useState('');
  const [mode, setMode] = useState('هر دو');
  const [subject, setSubject] = useState('فیزیک');
  const [grade, setGrade] = useState('یازدهم');
  const [sort, setSort] = useState('پیشنهاد نیمکت');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [time, setTime] = useState('');
  const [day, setDay] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (kind) p.set('kind', kind);
    if (mode !== 'هر دو') p.set('mode', mode);
    if (subject) p.set('subject', subject);
    if (grade) p.set('grade', grade);
    p.set('sort', SORTS[sort]);
    p.set('maxPrice', maxPrice);
    return p.toString();
  }, [kind, mode, subject, grade, sort, maxPrice]);

  useEffect(() => {
    api(`/classes?${query}`).then(setData).catch(() => setData(null));
  }, [query]);

  const clearAll = () => {
    setKind(''); setMode('هر دو'); setSubject(''); setGrade('');
    setSort('پیشنهاد نیمکت'); setMaxPrice(500000); setTime(''); setDay('');
  };

  return (
    <section className="section" style={{ paddingTop: 30 }}>
      <div className="container">
        <nav className="crumbs">
          <Link to="/">خانه</Link> / <b>کلاس‌ها</b>
        </nav>
        <h1 className="section-title" style={{ marginTop: 8 }}>کلاس فیزیک یازدهم</h1>
        <p className="muted" style={{ margin: '8px 0 22px' }}>
          {data ? `${faNum(46)} استاد و ${faNum(data.classes.length)} کلاس گروهی با شرایط انتخابی شما پیدا شد.` : '…'}
          <button className="link-green" style={{ marginInlineStart: 12 }} onClick={() => window.location.reload()}>
            به‌روزرسانی
          </button>
        </p>

        <div className="search-grid">
          <aside className="card filters-card">
            <div className="filters-head">
              <b>فیلترها</b>
              <button className="link-green" onClick={clearAll}>پاک کردن همه</button>
            </div>

            <div className="kind-list">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  className={`kind-card${kind === k.id ? ' selected' : ''}`}
                  onClick={() => setKind(kind === k.id ? '' : k.id)}
                >
                  <b>{k.title}</b>
                  <span>{k.sub}</span>
                </button>
              ))}
            </div>

            <label className="f-label">درس</label>
            <select className="cta-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">همه</option>
              <option>فیزیک</option>
              <option>ریاضی</option>
              <option>زبان انگلیسی</option>
              <option>ادبیات</option>
            </select>

            <label className="f-label">پایه</label>
            <select className="cta-input" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">همه</option>
              <option>دهم</option>
              <option>یازدهم</option>
              <option>دوازدهم</option>
            </select>

            <label className="f-label">رشته</label>
            <select className="cta-input" defaultValue="ریاضی فیزیک">
              <option>ریاضی فیزیک</option>
              <option>تجربی</option>
              <option>انسانی</option>
            </select>

            <label className="f-label">مقطع</label>
            <select className="cta-input" defaultValue="متوسطه دوم">
              <option>متوسطه اول</option>
              <option>متوسطه دوم</option>
              <option>کنکور</option>
            </select>

            <label className="f-label">بستر برگزاری</label>
            <div className="chips">
              {['هر دو', 'آنلاین', 'حضوری'].map((m) => (
                <button key={m} className={`chip chip-btn${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>

            <label className="f-label">ساعت</label>
            <div className="chips">
              {TIMES.map((x) => (
                <button key={x} className={`chip chip-btn${time === x ? ' active' : ''}`} onClick={() => setTime(time === x ? '' : x)}>
                  {x}
                </button>
              ))}
            </div>

            <label className="f-label">روزهای هفته</label>
            <div className="chips">
              {DAYS.map((x) => (
                <button key={x} className={`chip chip-btn${day === x ? ' active' : ''}`} onClick={() => setDay(day === x ? '' : x)}>
                  {x}
                </button>
              ))}
            </div>

            <label className="f-label">قیمت هر جلسه تا {faPrice(maxPrice)} تومان</label>
            <input
              type="range" min="100000" max="500000" step="10000"
              value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
            />

            <label className="f-label">امتیاز استاد</label>
            <div className="chips">
              <span className="chip">۴٫۵ به بالا</span>
              <span className="chip">۴ به بالا</span>
            </div>

            <label className="f-label">سطح استاد</label>
            <div className="chips">
              {['متخصص', 'استاد ارشد', 'کارشناس', 'مربی'].map((x) => (
                <span className="chip" key={x}>{x}</span>
              ))}
            </div>

            <label className="f-label">جنسیت استاد</label>
            <div className="chips">
              {['فرقی ندارد', 'خانم', 'آقا'].map((x) => (
                <span className="chip" key={x}>{x}</span>
              ))}
            </div>

            <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>چطور انتخاب می‌کنیم؟ نزدیک محل شما، مناسب سطح شما</p>
          </aside>

          <div>
            <div className="sort-row">
              <span className="muted">مرتب‌سازی:</span>
              <select className="cta-input" style={{ width: 190 }} value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {data && (
              <div className="card suggest-card">
                <b>پیشنهاد نیمکت برای شما</b>
                <span className="muted">۳ استاد برتر این ماه و ۲ پیشنهاد بر اساس سطح و محل شما</span>
                <div className="suggest-row">
                  {data.suggested.map((t) => (
                    <Link to={`/teachers/${t.id}`} className="suggest-item" key={t.id}>
                      <span className="avatar green">{t.name[0]}</span>
                      <span>
                        <b>{t.name}</b>
                        <span className="muted">{t.subject} · {t.level}</span>
                      </span>
                      <em className="chip chip-month">{t.month_badge ? 'برتر ماه' : 'پیشنهاد'}</em>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data?.classes.map((c) => (
              <article className="card result-card" key={c.id}>
                <div className="result-head">
                  <div>
                    <div className="tp-badges">
                      {c.badges.map((b) => <span className="chip chip-month" key={b}>{b}</span>)}
                      <span className="chip">{c.kind === 'friendly' ? 'دوستانه' : c.kind === 'group' ? 'گروهی' : 'خصوصی'}</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p className="muted">
                      <Link to={`/teachers/${c.teacher_id}`} className="link-green">{c.teacher?.name}</Link>
                      {' '}· {c.mode} · {c.platform} · ({faNum(c.reviews_count)} نظر)
                    </p>
                  </div>
                  <div className="result-price">
                    <b>{faPrice(c.price)}</b>
                    <span>تومان · هر جلسه</span>
                    <Link to={`/classes/${c.id}`} className="btn btn-primary">
                      رزرو
                      <IconArrowLeft size={15} />
                    </Link>
                  </div>
                </div>
                <div className="result-meta">
                  <span><IconStar size={14} /> {faNum(String(c.rating).replace('.', '٫'))}</span>
                  <span><IconClock size={14} /> {c.days} {c.time}</span>
                  <span><IconUsers size={14} /> {faNum(c.sessions)} جلسه · {c.taken >= c.capacity ? 'تکمیل' : `${faNum(c.capacity - c.taken)} جای خالی`}</span>
                  <span className="muted">نزدیک‌ترین زمان‌ها: {c.days} {c.time}</span>
                </div>
              </article>
            ))}

            <div className="card cta-mini">
              <div>
                <b>استاد مورد نظرتان را پیدا نکردید؟</b>
                <p className="muted">درخواست بدهید؛ حداکثر تا ۲۴ ساعت یک استاد مناسب به شما پیشنهاد می‌شود.</p>
              </div>
              <button className="btn btn-orange">ثبت درخواست</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
