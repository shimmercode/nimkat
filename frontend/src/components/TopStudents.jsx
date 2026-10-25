import { useRef } from 'react';
import { faNum } from '../utils/fa.js';
import { IconCrown, IconArrowLeft, IconArrowRight } from './icons.jsx';

const STUDENTS = [
  { name: 'آرمین رستمی', grade: 'پایه نهم', classes: 48, rate: '۴٫۹۵', color: 'orange', letter: 'آ', crown: true },
  { name: 'یستا کریمی', grade: 'پایه هشتم', classes: 42, rate: '۴٫۹', color: 'green', letter: 'ی', crown: true },
  { name: 'پرهام نوری', grade: 'پایه هفتم', classes: 37, rate: '۴٫۸۸', color: 'green', letter: 'پ', crown: true },
  { name: 'رضا سلطانی', grade: 'پایه ششم', classes: 35, rate: '۴٫۹۲', color: 'green', letter: 'ر' },
  { name: 'بردیا مهدوی', grade: 'پایه نهم', classes: 31, rate: '۴٫۸۵', color: 'orange', letter: 'ب' },
];

export default function TopStudents() {
  const scroller = useRef(null);
  const scroll = (dir) =>
    scroller.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <section className="section" id="students" style={{ paddingTop: 20 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">نوابغ ماه</span>
            <h2 className="section-title">
              دانش‌آموزان <span className="hl">برتر</span> این ماه
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

        <div className="cards-scroll" ref={scroller}>
          {STUDENTS.map((s) => (
            <article className="scard" key={s.name}>
              <span className={`savatar ${s.color}`}>
                {s.crown && (
                  <span className="crown">
                    <IconCrown size={14} />
                  </span>
                )}
                {s.letter}
              </span>
              <div className="scard-name">{s.name}</div>
              <div className="scard-sub">{s.grade}</div>
              <div className="scard-stats">
                <span className="stat">
                  <b>{faNum(s.classes)}</b>
                  <span>کلاس</span>
                </span>
                <span className="stat">
                  <b>{s.rate}</b>
                  <span>امتیاز</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
