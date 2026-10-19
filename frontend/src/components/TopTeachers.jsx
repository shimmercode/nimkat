import { useRef, useState } from 'react';
import { faNum } from '../utils/fa.js';
import { IconStar, IconArrowLeft, IconArrowRight } from './icons.jsx';

const SUBJECTS = ['همه', 'ریاضی', 'فیزیک', 'زبان انگلیسی', 'ادبیات', 'عربی', 'علوم', 'برنامه‌نویسی'];

const TEACHERS = [
  {
    name: 'سارا محمدی',
    subject: 'ریاضی',
    level: 'متوسطه اول',
    rate: '۴٫۹',
    tags: ['پرفروش', 'وقت‌شناس'],
    stats: { classes: 184, students: 392, rate: '۴٫۹' },
    color: 'orange',
    letter: 'س',
    rank: 1,
  },
  {
    name: 'امیر رضایی',
    subject: 'فیزیک',
    level: 'کنکور',
    rate: '۴٫۹۵',
    tags: ['پرطرفدار', 'متخصص'],
    stats: { classes: 221, students: 508, rate: '۴٫۹۵' },
    color: 'green',
    letter: 'ا',
    rank: 2,
  },
  {
    name: 'نگار سلطانی',
    subject: 'زبان انگلیسی',
    level: 'کودکان',
    rate: '۴٫۸۷',
    tags: ['مکالمه', 'کودکان'],
    stats: { classes: 167, students: 342, rate: '۴٫۸۷' },
    color: 'green',
    letter: 'ن',
    rank: 3,
  },
  {
    name: 'حسین نوری',
    subject: 'ریاضی',
    level: 'کنکور',
    rate: '۵',
    tags: ['رتبه برتر', 'نخبه'],
    stats: { classes: 298, students: 741, rate: '۵' },
    color: 'green',
    letter: 'ح',
  },
  {
    name: 'مریم کاظمی',
    subject: 'ادبیات',
    level: 'متوسطه',
    rate: '۴٫۹۲',
    tags: ['خلاق', 'صبور'],
    stats: { classes: 156, students: 289, rate: '۴٫۹۲' },
    color: 'orange',
    letter: 'م',
  },
];

export default function TopTeachers() {
  const [filter, setFilter] = useState('همه');
  const scroller = useRef(null);

  const list =
    filter === 'همه' ? TEACHERS : TEACHERS.filter((t) => t.subject === filter);

  const scroll = (dir) =>
    scroller.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  return (
    <section className="section" id="teachers">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">اساتید برتر هفته</span>
            <h2 className="section-title">
              اساتیدی که این هفته <span className="hl">درخشیدند</span>
            </h2>
          </div>
          <div className="head-arrows">
            <button className="icon-btn" aria-label="قبلی" onClick={() => scroll(-1)}>
              <IconArrowRight size={18} />
            </button>
            <button className="icon-btn" aria-label="بعدی" onClick={() => scroll(1)}>
              <IconArrowLeft size={18} />
            </button>
          </div>
        </div>

        <div className="filters">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              className={`chip chip-btn${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="empty-note">
            این هفته استادی در این درس ثبت نشده؛ درس‌های دیگر را ببینید.
          </p>
        ) : (
          <div className="cards-scroll" ref={scroller}>
            {list.map((t) => (
              <article className="tcard" key={t.name}>
                <div className="tcard-top">
                  <span className={`avatar ${t.color}`}>
                    {t.letter}
                    {t.rank && <span className="rank">{faNum(t.rank)}</span>}
                  </span>
                  <span>
                    <span className="tcard-name">{t.name}</span>
                    <br />
                    <span className="tcard-sub">
                      {t.subject} — {t.level}
                    </span>
                  </span>
                </div>

                <span className="tcard-rate">
                  <IconStar size={15} />
                  {t.rate}
                </span>

                <div className="chips">
                  {t.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="tcard-stats">
                  <span className="stat">
                    <b>{faNum(t.stats.classes)}</b>
                    <span>کلاس</span>
                  </span>
                  <span className="stat">
                    <b>{faNum(t.stats.students)}</b>
                    <span>شاگرد</span>
                  </span>
                  <span className="stat">
                    <b>{t.stats.rate}</b>
                    <span>امتیاز</span>
                  </span>
                </div>

                <button className="btn btn-outline-green btn-block">
                  مشاهده پروفایل
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
