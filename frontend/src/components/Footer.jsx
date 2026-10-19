import { faNum } from '../utils/fa.js';
import {
  IconBench,
  IconPhone,
  IconPlay,
  IconCamera,
  IconSend,
  IconClock,
  IconShield,
  IconBuilding,
} from './icons.jsx';

const COLS = [
  {
    title: 'مقاطع تحصیلی',
    links: ['ابتدایی', 'متوسطه اول', 'متوسطه دوم', 'کنکور', 'مهارتی'],
  },
  {
    title: 'دسترسی سریع',
    links: ['جست‌وجوی کلاس', 'نیم‌چت', 'نیمکت کلاب', 'مجله نیمکت', 'استاد شوید'],
  },
  {
    title: 'پشتیبانی',
    links: [
      'سوالات متداول',
      'قوانین و مقررات',
      'حریم خصوصی',
      'شرایط لغو و بازگشت وجه',
      'تماس با ما',
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <span className="brand">
              <span className="brand-logo">
                <IconBench size={26} />
              </span>
              <span>
                <span className="brand-name">نیمکت</span>
                <br />
                <span className="brand-tag">پلتفرم آموزش آنلاین و حضوری</span>
              </span>
            </span>
            <p className="footer-about">
              نیمکت شاگرد و استاد را بر اساس مقطع، درس و هدف آموزشی به هم
              می‌رساند؛ از کلاس خصوصی آنلاین تا کلاس گروهی حضوری در مدرسهٔ
              خودتان.
            </p>
            <div className="socials">
              <a className="social" href="#top" aria-label="تلفن">
                <IconPhone size={18} />
              </a>
              <a className="social" href="#top" aria-label="ویدیو">
                <IconPlay size={18} />
              </a>
              <a className="social" href="#top" aria-label="اینستاگرام">
                <IconCamera size={18} />
              </a>
              <a className="social" href="#top" aria-label="تلگرام">
                <IconSend size={18} />
              </a>
            </div>
            <div className="footer-contact">
              <span>
                <IconPhone size={15} />
                ۰۲۱-۹۱۰۴۵۶
              </span>
              <span>
                <IconClock size={15} />
                شنبه تا پنجشنبه ۸ تا ۲۰
              </span>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul className="footer-links">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#top">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4>مجوزها</h4>
            <div className="license-boxes">
              <span className="license">
                <IconShield size={22} />
                نماد اعتماد
                <br />
                الکترونیکی
              </span>
              <span className="license">
                <IconBuilding size={22} />
                ساماندهی
                <br />
                کسب‌وکار مجازی
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {faNum(1405)} نیمکت. همهٔ حقوق محفوظ است.</span>
          <span className="footer-bottom-links">
            <a href="#top">قوانین</a>
            <a href="#top">حریم خصوصی</a>
            <a href="#top">نقشه سایت</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
