'use client';
import { Link } from '../routing/navigation';
import { Brand } from './Header.jsx';
import { IconSend, IconCamera, IconVideo, IconPhone, IconShield, IconCap } from './icons.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div className="footer-brand">
            <Brand dark />
            <p className="footer-desc">
              نیمکت شاگرد و استاد را بر اساس مقطع، درس و هدف آموزشی به هم می‌رساند؛ از کلاس خصوصی
              آنلاین تا کلاس گروهی حضوری در محله‌ی خودتان.
            </p>
            <div className="footer-socials">
              <Link to="/contact" aria-label="تلگرام">
                <IconSend size={18} />
              </Link>
              <Link to="/contact" aria-label="اینستاگرام">
                <IconCamera size={18} />
              </Link>
              <Link to="/classes" aria-label="ویدیوهای آموزشی">
                <IconVideo size={18} />
              </Link>
              <a href="tel:02191004560" aria-label="تماس تلفنی">
                <IconPhone size={18} />
              </a>
            </div>
            <div className="footer-tel num">
              <IconPhone size={16} />
              <span>۰۲۱-۹۱۰۰۴۵۶۰</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>شنبه تا پنجشنبه ۸ تا ۲۰</span>
            </div>
          </div>

          <div>
            <h4>مقاطع تحصیلی</h4>
            <Link to="/classes?grade=ابتدایی">ابتدایی</Link>
            <Link to="/classes?grade=متوسطه اول">متوسطه اول</Link>
            <Link to="/classes?grade=متوسطه دوم">متوسطه دوم</Link>
            <Link to="/classes?grade=کنکور">کنکور</Link>
            <Link to="/classes?q=مهارتی">مهارتی</Link>
          </div>

          <div>
            <h4>دسترسی سریع</h4>
            <Link to="/classes">جستجوی کلاس</Link>
            <Link to="/panel/chat">نیم‌چت</Link>
            <Link to="/club">نیمکت کلاب</Link>
            <Link to="/blog">مجله نیمکت</Link>
            <Link to="/login?mode=teacher">استاد شوید</Link>
          </div>

          <div>
            <h4>پشتیبانی</h4>
            <Link to="/faq">سوالات متداول</Link>
            <Link to="/terms">قوانین و مقررات</Link>
            <Link to="/privacy">حریم خصوصی</Link>
            <Link to="/cancellation-policy">شرایط لغو و بازگشت وجه</Link>
            <Link to="/contact">تماس با ما</Link>
          </div>

          <div>
            <h4>مجوزها</h4>
            <div className="footer-badges">
              <div className="footer-badge">
                <IconShield size={24} />
                نماد اعتماد
                <br />
                الکترونیکی
              </div>
              <div className="footer-badge">
                <IconCap size={24} />
                ساماندهی
                <br />
                کسب‌وکار مجازی
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© ۱۴۰۵ نیمکت. همه‌ی حقوق محفوظ است.</span>
          <div className="links">
            <Link to="/terms">قوانین</Link>
            <Link to="/privacy">حریم خصوصی</Link>
            <Link to="/sitemap">نقشه سایت</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
