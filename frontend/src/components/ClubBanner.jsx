import { faNum } from '../utils/fa.js';
import { IconCrown, IconArrowLeft } from './icons.jsx';

const COINS = [
  { amount: 20, label: 'هر کلاس موفق' },
  { amount: 50, label: 'دعوت از دوست' },
  { amount: 15, label: 'نظرسنجی پایان کلاس' },
  { amount: 10, label: 'تکمیل پروفایل' },
];

const LEVELS = [
  { name: 'برنزی', from: 'از ۰ سکه', cls: 'bronze' },
  { name: 'نقره‌ای', from: 'از ۵۰۰ سکه', cls: '' },
  { name: 'طلایی', from: 'از ۱٬۰۰ سکه', cls: 'gold' },
  { name: 'پلاتینیوم', from: 'از ۴٬۰۰ سکه', cls: '' },
];

export default function ClubBanner() {
  return (
    <section className="section" id="club" style={{ paddingTop: 30 }}>
      <div className="container">
        <div className="club">
          <div className="club-grid">
            <div>
              <span className="eyebrow on-dark">نیمکت کلاب</span>
              <h2 className="club-title">هر کلاس، یک قدم تا نیمکت طلایی</h2>
              <p className="club-text">
                با شرکت در کلاس، نظر دادن و دعوت دوستانت سکه جمع کن. سطح طلایی دو
                جلسهٔ رایگان با برترین استاد پلتفرم دارد.
              </p>

              <div className="coin-grid">
                {COINS.map((c) => (
                  <div className="coin-card" key={c.label}>
                    <b>{faNum(c.amount)} سکه</b>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-orange">
                مشاهدهٔ ماموریت‌ها
                <IconArrowLeft size={17} />
              </button>
            </div>

            <div className="level-panel">
              <div className="levels">
                {LEVELS.map((l) => (
                  <div className={`level ${l.cls}`} key={l.name}>
                    <span className="level-icon">
                      <IconCrown size={22} />
                    </span>
                    <b>{l.name}</b>
                    <span>{l.from}</span>
                  </div>
                ))}
              </div>

              <div className="level-progress">
                <div className="labels">
                  <span>سطح فعلی شما: نقره‌ای · ۱٬۱۲۰ سکه</span>
                  <span>۳۸۰ سکه تا طلایی</span>
                </div>
                <div className="bar">
                  <div className="fill" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
