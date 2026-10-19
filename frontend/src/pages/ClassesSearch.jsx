import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import {
  IconStar, IconClock, IconArrowLeft, IconUsers, IconBook, IconHeart,
  IconChevronDown, IconSearch, IconUser, IconUsers as IconGroup, IconHeart as IconFriendly,
} from '../components/icons.jsx';

const KINDS = [
  { id: 'private', title: 'کلاس خصوصی', sub: 'یک‌به‌یک با استاد', icon: IconUser },
  { id: 'group', title: 'کلاس گروهی', sub: 'دوره‌های ثبت‌نامی ۴ تا ۱۲ نفر', icon: IconGroup },
  { id: 'friendly', title: 'کلاس دوستانه', sub: 'تا ۵ نفر، تخفیف پلکانی ۲۰٪', icon: IconFriendly },
];
const SORTS = { 'پیشنهاد نیمکت': 0, 'بیشترین امتیاز': 1, 'کمترین قیمت': 2, 'نزدیک‌ترین زمان': 3 };
const DAY_CHIPS = ['ش', 'ی', 'د', 'س', 'چ', 'پ'];
const TIMES = ['صبح', 'ظهر', 'عصر', 'شب'];

export default function ClassesSearch() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [kind, setKind] = useState('private');
  const [mode, setMode] = useState('آنلاین');
  const [subject, setSubject] = useState('فیزیک');
  const [grade, setGrade] = useState('یازدهم');
  const [sort, setSort] = useState('پیشنهاد نیمکت');
  const [maxPrice, setMaxPrice] = useState(400000);
  const [days, setDays] = useState(['ش', 'د']);
  const [time, setTime] = useState('عصر');
  const [levels, setLevels] = useState(['متخصص', 'کارشناس']);
  const [openTeacher, setOpenTeacher] = useState(null);

  useEffect(() => {
    api(`/teachers?subject=${encodeURIComponent(subject)}`).then((d) => {
      setTeachers(d.teachers);
    });
    api('/classes').then((d) => {
      setClasses(d.classes);
      setSuggested(d.suggested);
    });
  }, [subject]);

  const list = useMemo(() => {
    let rows = teachers.filter((t) => t.price <= maxPrice + 100000);
    if (levels.length) rows = rows.filter((t) => levels.includes(t.level) || t.level === 'متخصص');
    if (sort === 'بیشترین امتیاز') rows = [...rows].sort((a, b) => b.rating - a.rating);
    if (sort === 'کمترین قیمت') rows = [...rows].sort((a, b) => a.price - b.price);
    return rows;
  }, [teachers, maxPrice, levels, sort]);

  const classesOf = (tid) => classes.filter((c) => c.teacher_id === tid && (!kind || c.kind === kind || kind === 'private'));

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div>
      {/* ===== hero band ===== */}
      <section className="cls-band">
        <div className="container">
          <nav className="crumbs">
            <Link to="/">خانه</Link> / <Link to="/classes">اساتید</Link> / <b>فیزیک · متوسطه دوم</b>
          </nav>
          <div className="cls-title-row">
            <div>
              <h1>کلاس فیزیک یازدهم</h1>
              <p className="muted">۴۶ استاد و ۹ کلاس گروهی با شرایط انتخابی شما پیدا شد.</p>
            </div>
            <div className="mode-tabs">
              {['آنلاین', 'حضوری', 'هر دو'].map((m) => (
                <button key={m} className={`tab${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="cls-filtercard">
            <div className="kind-row">
              {KINDS.map((k) => (
                <button key={k.id} className={`kind2${kind === k.id ? ' selected' : ''}`} onClick={() => setKind(k.id)}>
                  <span className="k2-icon"><k.icon size={20} /></span>
                  <span className="k2-body"><b>{k.title}</b><em>{k.sub}</em></span>
                  <span className="k2-radio" />
                </button>
              ))}
            </div>
            <div className="cls-selects">
              <label>مقطع<select className="cta-input" defaultValue="متوسطه دوم"><option>متوسطه اول</option><option>متوسطه دوم</option><option>کنکور</option></select></label>
              <label>رشته<select className="cta-input" defaultValue="ریاضی فیزیک"><option>ریاضی فیزیک</option><option>تجربی</option><option>انسانی</option></select></label>
              <label>پایه<select className="cta-input" value={grade} onChange={(e) => setGrade(e.target.value)}><option>دهم</option><option>یازدهم</option><option>دوازدهم</option></select></label>
              <label>درس<select className="cta-input" value={subject} onChange={(e) => setSubject(e.target.value)}><option>فیزیک</option><option>ریاضی</option><option>زبان انگلیسی</option><option>ادبیات</option></select></label>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <IconSearch size={16} />
                به‌روزرسانی
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== suggested teachers ===== */}
      <section className="cls-suggest">
        <div className="container">
          <div className="sec-head">
            <div>
              <b className="sec-title-sm">پیشنهاد نیمکت برای شما</b>
              <span className="muted">۳ استاد برتر این ماه و ۲ پیشنهاد بر اساس سطح و محل شما</span>
            </div>
            <span className="link-green">چطور انتخاب می‌کنیم؟</span>
          </div>
          <div className="suggest-grid">
            {(suggested.length ? suggested : []).concat(teachers.slice(3, 5)).slice(0, 5).map((t, i) => (
              <div className="sg-card" key={t.id}>
                <span className={`sg-badge ${i === 3 ? 'orange' : i === 4 ? 'orange' : 'dark'}`}>
                  {i === 3 ? 'نزدیک محل شما' : i === 4 ? 'مناسب سطح شما' : 'برتر ماه'}
                </span>
                <span className={`sg-avatar ${t.color || (i % 2 ? 'orange-soft' : 'green')}`}>{t.name[0]}</span>
                <b>{t.name}</b>
                <em className="muted">{t.subject} {t.level === 'متخصص' ? 'و ریاضی' : ''}</em>
                <span className="sg-rate"><IconStar size={13} /> {faNum(String(t.rating).replace('.', '٫'))}</span>
                <Link className="btn btn-outline-green btn-block" to={`/teachers/${t.id}`}>پروفایل و زمان‌ها</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== results ===== */}
      <section className="cls-results">
        <div className="container cls-grid">
          <aside className="card cls-side">
            <div className="filters-head">
              <b>فیلترها</b>
              <button className="link-green" onClick={() => { setLevels([]); setDays([]); setTime(''); setMaxPrice(500000); }}>
                پاک کردن همه
              </button>
            </div>
            <span className="muted" style={{ fontSize: 11 }}>{faNum(24)} فیلتر · پایه {grade}</span>

            <div className="fgroup">
              <b className="fg-title">قیمت هر جلسه <IconChevronDown size={14} /></b>
              <input type="range" min="100000" max="500000" step="10000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
              <div className="fg-range"><span>{faPrice(100000)} تومان</span><span>{faPrice(maxPrice)} تومان</span></div>
            </div>

            <div className="fgroup">
              <b className="fg-title">روزهای هفته <IconChevronDown size={14} /></b>
              <div className="day-chips">
                {DAY_CHIPS.map((x) => (
                  <button key={x} className={`day-chip${days.includes(x) ? ' active' : ''}`} onClick={() => toggle(days, setDays, x)}>{x}</button>
                ))}
              </div>
            </div>

            <div className="fgroup">
              <b className="fg-title">ساعت <IconChevronDown size={14} /></b>
              <div className="chips">
                {TIMES.map((x) => (
                  <button key={x} className={`chip chip-btn${time === x ? ' active' : ''}`} onClick={() => setTime(time === x ? '' : x)}>{x}</button>
                ))}
              </div>
            </div>

            <div className="fgroup">
              <b className="fg-title">امتیاز استاد <IconChevronDown size={14} /></b>
              <label className="check-row"><input type="checkbox" defaultChecked /> ۴٫۰ تا ۴٫۵ به بالا <em>۳۱</em></label>
              <label className="check-row"><input type="checkbox" /> ۴ به بالا <em>۲۲</em></label>
            </div>

            <div className="fgroup">
              <b className="fg-title">سطح استاد <IconChevronDown size={14} /></b>
              {[['استاد ارشد', 6], ['متخصص', 14], ['کارشناس', 19], ['مربی', 7]].map(([l, c]) => (
                <label className="check-row" key={l}>
                  <input type="checkbox" checked={levels.includes(l)} onChange={() => toggle(levels, setLevels, l)} />
                  {l} <em>{faNum(c)}</em>
                </label>
              ))}
            </div>

            <div className="fgroup">
              <b className="fg-title">بستر برگزاری <IconChevronDown size={14} /></b>
              {[['اسکای‌روم', 28, true], ['فنوتک', 9, false], ['گوگل‌میت', 4, false], ['حضوری', 12, false]].map(([p, c, ck]) => (
                <label className="check-row" key={p}><input type="checkbox" defaultChecked={ck} /> {p} <em>{faNum(c)}</em></label>
              ))}
            </div>

            <div className="fgroup">
              <b className="fg-title">جنسیت استاد <IconChevronDown size={14} /></b>
              <div className="seg3">
                <button className="active">فرقی ندارد</button>
                <button>خانم</button>
                <button>آقا</button>
              </div>
            </div>
          </aside>

          <div className="cls-list">
            <div className="sort-row">
              <div className="chips">
                {Object.keys(SORTS).map((s) => (
                  <button key={s} className={`chip chip-btn${sort === s ? ' active' : ''}`} onClick={() => setSort(s)}>{s}</button>
                ))}
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{faNum(list.length * 3)} نتیجه · صفحهٔ ۱ از ۳</span>
            </div>

            {list.map((t) => {
              const tc = classesOf(t.id);
              const open = openTeacher === t.id;
              return (
                <article className="card tresult" key={t.id}>
                  <div className="tr-head">
                    <span className="tr-avatar green">{t.name[0]}</span>
                    <div className="tr-id">
                      <div className="tp-badges">
                        {t.month_badge ? <span className="chip chip-mint">برتر ماه</span> : null}
                        <span className="chip">{t.level}</span>
                      </div>
                      <b>{t.name}</b>
                      <span className="tr-rate">
                        <IconStar size={13} /> {faNum(String(t.rating).replace('.', '٫'))}
                        <em className="muted">({faNum(t.reviews_count)} نظر)</em>
                        <em className="muted">· {t.badges[0] || t.subject}</em>
                      </span>
                    </div>
                    <div className="tr-price">
                      <span className="muted">هر جلسه</span>
                      <b>{faPrice(t.price)}</b>
                      <span className="muted">تومان</span>
                    </div>
                  </div>

                  <div className="tr-times">
                    <span className="muted">نزدیک‌ترین زمان‌ها:</span>
                    {tc[0] && <span className="chip">{tc[0].days} {tc[0].time}</span>}
                    <span className="chip">شنبه ۱۶:۰۰</span>
                    <span className="chip">چهارشنبه ۱۷:۰۰</span>
                  </div>

                  {open && (
                    <div className="tr-classes">
                      {tc.length === 0 && <span className="muted">این استاد کلاس فعال ثبت‌شده با این فیلتر ندارد؛ رزرو خصوصی باز است.</span>}
                      {tc.map((c) => (
                        <span className="tr-class" key={c.id}>
                          <em className={`chip ${c.kind === 'friendly' ? 'chip-month' : 'chip-mint'}`}>
                            {c.kind === 'group' ? 'گروهی' : c.kind === 'friendly' ? 'دوستانه' : 'خصوصی'}
                          </em>
                          <b>{c.title}</b>
                          <em className="muted">{c.days} {c.time} · {faNum(c.sessions)} جلسه</em>
                          <Link to={`/classes/${c.id}`} className="btn btn-primary">رزرو</Link>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="tr-actions">
                    <Link to={`/classes/${t.id === 1 ? 5 : 1}`} className="btn btn-primary">
                      شروع رزرو کلاس
                      <IconArrowLeft size={15} />
                    </Link>
                    <button className="btn btn-outline" onClick={() => setOpenTeacher(open ? null : t.id)}>
                      <IconBook size={15} />
                      دیدن کلاس‌ها و زمان‌ها ({faNum(tc.length)})
                    </button>
                    <Link to={`/teachers/${t.id}`} className="btn btn-outline">پروفایل و زمان‌ها</Link>
                    <button className="icon-btn" aria-label="علاقه‌مندی"><IconHeart size={16} /></button>
                  </div>
                </article>
              );
            })}

            <div className="card cta-mini">
              <div>
                <b>استاد مورد نظرتان را پیدا نکردید؟</b>
                <p className="muted">درخواست بدهید؛ حداکثر تا ۲۴ ساعت یک استاد مناسب به شما پیشنهاد می‌شود.</p>
              </div>
              <button className="btn btn-outline">پیشنهاد استاد</button>
            </div>

            <div className="pager">
              <button className="icon-btn">‹</button>
              {[1, 2, 3].map((p) => <button key={p} className={`page-btn${p === 1 ? ' active' : ''}`}>{faNum(p)}</button>)}
              <span className="muted">…</span>
              <button className="page-btn">{faNum(12)}</button>
              <button className="icon-btn">›</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
