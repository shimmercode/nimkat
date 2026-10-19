import { useState } from 'react';
import { Link } from 'react-router-dom';
import { faNum, faPrice } from '../utils/fa.js';
import {
  IconUser,
  IconClock,
  IconBook,
  IconGrid,
  IconUserPlus,
  IconHeart,
  IconArrowLeft,
  IconMinus,
  IconPlus,
} from './icons.jsx';

const CLASSES = [
  {
    id: 'phys12',
    title: 'حل تمرین فیزیک یازدهم',
    teacher: 'نگار سلطانی',
    time: 'پنجشنبه‌ها ۱۶:۰۰',
    sessions: 8,
    taken: 9,
    capacity: 12,
    seatsLeft: 3,
    meta: 'ظرفیت ۱۲ نفر · حضوری · آموزشگاه پارسه، خیابان کارگر شمالی',
    deadline: 'ثبت‌نام تا ۱۰ مهر',
  },
  {
    id: 'math9',
    title: 'جمع‌بندی ریاضی نهم',
    teacher: 'سارا محمدی',
    time: 'دوشنبه‌ها ۱۷:۳۰',
    sessions: 6,
    taken: 10,
    capacity: 10,
    seatsLeft: 0,
    meta: 'ظرفیت ۱۰ نفر · آنلاین · بستر کلاس آنلاین نیمکت',
    deadline: 'ظرفیت تکمیل',
  },
  {
    id: 'engB1',
    title: 'مکالمه انگلیسی سطح B1',
    teacher: 'نگار سلطانی',
    time: 'شنبه و سه‌شنبه ۱۹:۰۰',
    sessions: 12,
    taken: 4,
    capacity: 8,
    seatsLeft: 4,
    meta: 'ظرفیت ۸ نفر · آنلاین · بستر کلاس آنلاین نیمکت',
    deadline: 'ثبت‌نام تا ۲۰ مهر',
  },
];

/* seat map: 12 seats, rows of 4 (right-to-left numbering like a real class) */
const INITIAL_SEATS = {
  1: 'reserved', 2: 'reserved', 3: 'free', 4: 'reserved',
  5: 'reserved', 6: 'reserved', 7: 'selected', 8: 'free',
  9: 'reserved', 10: 'reserved', 11: 'hold', 12: 'reserved',
};

const PER_SESSION = 180000;

export default function GroupClasses() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0].id);
  const [seats, setSeats] = useState(INITIAL_SEATS);
  const [sessions, setSessions] = useState(8);
  const [referral, setReferral] = useState(false);

  const cls = CLASSES.find((c) => c.id === selectedClass);

  const toggleSeat = (n) =>
    setSeats((prev) => {
      const s = prev[n];
      if (s === 'free') return { ...prev, [n]: 'selected' };
      if (s === 'selected') return { ...prev, [n]: 'free' };
      return prev;
    });

  const discountRate = sessions >= 8 ? 0.1 : sessions >= 4 ? 0.05 : 0;
  const gross = PER_SESSION * sessions;
  const discount = gross * discountRate;
  const total = gross - discount;

  return (
    <section className="section" id="classes">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow green-text">کلاس‌های گروهی در حال ثبت‌نام</span>
            <h2 className="section-title">جای خودت را در کلاس انتخاب کن</h2>
          </div>
          <a className="link-green" href="#classes">
            همهٔ کلاس‌های گروهی
            <IconArrowLeft size={17} />
          </a>
        </div>

        <div className="classes-grid">
          {/* class list (right column in RTL) */}
          <div>
            {CLASSES.map((c) => {
              const full = c.seatsLeft === 0;
              return (
                <button
                  key={c.id}
                  className={`class-card${selectedClass === c.id ? ' selected' : ''}`}
                  onClick={() => setSelectedClass(c.id)}
                >
                  <div className="class-top">
                    <Link className="class-title" to={`/classes/${c.id}`}>{c.title}</Link>
                    <span className={`seat-badge${full ? ' full' : ''}`}>
                      {full ? 'تکمیل ظرفیت' : `${faNum(c.seatsLeft)} جای خالی`}
                    </span>
                  </div>
                  <div className="class-meta">
                    <span>
                      <IconUser size={14} />
                      {c.teacher}
                    </span>
                    <span>
                      <IconClock size={14} />
                      {c.time}
                    </span>
                    <span>
                      <IconBook size={14} />
                      {faNum(c.sessions)} جلسه
                    </span>
                  </div>
                  <div className="progress">
                    <span>
                      {faNum(c.taken)} از {faNum(c.capacity)}
                    </span>
                    <span className="progress-bar">
                      <span
                        className={`progress-fill${full ? ' gray' : ''}`}
                        style={{ width: `${(c.taken / c.capacity) * 100}%` }}
                      />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* booking widget (left column in RTL) */}
          <div className="book">
            <div className="book-head">
              <div>
                <h3 className="book-title">{cls.title}</h3>
                <p className="book-sub">{cls.meta}</p>
              </div>
              <span className="deadline">
                <IconClock size={14} />
                {cls.deadline}
              </span>
            </div>

            <div className="seatmap">
              <div className="seatmap-head">
                <IconGrid size={15} />
                نقشهٔ کلاس
              </div>
              <div className="board" />
              <div className="seats">
                {[4, 3, 2, 1, 8, 7, 6, 5, 12, 11, 10, 9].map((n) => (
                  <button
                    key={n}
                    className={`seat ${seats[n]}`}
                    onClick={() => toggleSeat(n)}
                    aria-label={`صندلی ${faNum(n)}`}
                  >
                    {faNum(n)}
                  </button>
                ))}
              </div>
              <div className="legend">
                <span>
                  <i style={{ background: '#e4f2e8', boxShadow: 'inset 0 0 0 1px #bfe0cc' }} />
                  آزاد
                </span>
                <span>
                  <i style={{ background: 'var(--green-700)' }} />
                  انتخاب شما
                </span>
                <span>
                  <i style={{ background: 'var(--orange-soft)' }} />
                  در حال رزرو
                </span>
                <span>
                  <i style={{ background: '#e7eae6' }} />
                  رزروشده
                </span>
              </div>
            </div>

            <div className="referral">
              <IconUserPlus size={22} />
              <span>
                <b>رزرو دوستانه</b>
                <p>تا ۵ نفر با یک پرداخت؛ برای هر دوست پیامک دعوت ارسال می‌شود</p>
              </span>
              <button
                className={`switch${referral ? ' on' : ''}`}
                role="switch"
                aria-checked={referral}
                aria-label="رزرو دوستانه"
                onClick={() => setReferral((v) => !v)}
              />
            </div>

            <div className="price-rows">
              <div className="price-row">
                <span className="lbl">هر جلسه</span>
                <span className="val">{faPrice(PER_SESSION)} تومان</span>
              </div>
              <div className="price-row">
                <span className="lbl">تعداد جلسات</span>
                <span className="stepper">
                  <button
                    aria-label="کم کردن"
                    onClick={() => setSessions((s) => Math.max(1, s - 1))}
                  >
                    <IconMinus size={16} />
                  </button>
                  <b>{faNum(sessions)}</b>
                  <button
                    aria-label="زیاد کردن"
                    onClick={() => setSessions((s) => Math.min(cls.sessions, s + 1))}
                  >
                    <IconPlus size={16} />
                  </button>
                </span>
              </div>
              {discountRate > 0 && (
                <div className="price-row">
                  <span className="lbl">تخفیف پلکانی {faNum(sessions)} جلسه</span>
                  <span className="val green">
                    -{faNum(discountRate * 100)}٪ ({faPrice(discount)} تومان)
                  </span>
                </div>
              )}
            </div>

            <div className="total-row">
              <span className="lbl">مبلغ قابل پرداخت</span>
              <b>{faPrice(total)} تومان</b>
            </div>

            <div className="book-actions">
              <button className="btn btn-primary">
                ادامه و پرداخت · نیم‌پى
                <IconArrowLeft size={17} />
              </button>
              <button className="btn btn-outline">
                <IconHeart size={17} />
                ذخیره
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
