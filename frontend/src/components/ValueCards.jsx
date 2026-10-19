import { IconUsers, IconCap, IconCheck } from './icons.jsx';

export default function ValueCards() {
  return (
    <section className="section" style={{ paddingTop: 30 }}>
      <div className="container value-grid">
        <div className="value-card parents" id="parents">
          <span className="value-badge">
            <IconUsers size={15} />
            ویژه والدین
          </span>
          <h3 className="value-title">پیشرفت فرزندتان را جلسه به جلسه ببینید</h3>
          <p className="value-text">
            گزارش حضور، تکلیف‌ها و نظر استاد بعد از هر جلسه به پنل شما می‌آید.
            پرداخت و لغو کلاس هم از همان‌جا انجام می‌شود.
          </p>
          <ul className="value-list">
            <li>
              <IconCheck size={16} />
              گزارش هفتگی
            </li>
            <li>
              <IconCheck size={16} />
              گروه والدین در نیم‌چت
            </li>
            <li>
              <IconCheck size={16} />
              مشاورهٔ رایگان
            </li>
          </ul>
          <button className="btn btn-primary">ساخت حساب والدین</button>
        </div>

        <div className="value-card tutors">
          <span className="value-badge">
            <IconCap size={15} />
            برای اساتید
          </span>
          <h3 className="value-title">کلاس‌هایت را خودت قیمت‌گذاری کن</h3>
          <p className="value-text">
            ثبت‌نام، بررسی مدارک و مصاحبه حداکثر ۷۲ ساعت طول می‌کشد. تسویه هر دو
            هفته یک‌بار به حساب شماست.
          </p>
          <div className="value-stats">
            <span>
              <b>۸۵٪</b>
              <span>سهم استاد از هر جلسه</span>
            </span>
            <span>
              <b>۷۲ ساعت</b>
              <span>زمان بررسی درخواست</span>
            </span>
          </div>
          <button className="btn btn-orange">ثبت درخواست همکاری</button>
        </div>
      </div>
    </section>
  );
}
