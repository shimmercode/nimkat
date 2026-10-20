'use client';
import { Link } from '../routing/navigation';
import {
  IconBench, IconPhone, IconShield, IconCap, IconSend, IconCamera, IconVideo,
} from './icons.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-logo">
                <IconBench size={26} />
                <i className="dot" />
              </span>
              <span>
                <span className="brand-name">نیمکت</span>
                <span className="brand-tag" style={{ display: 'block' }}>
                  پلتفرم آموزش آنلاین و حضوری
                </span>
              </span>
            </div>
            <p className="footer-desc">
              نیمکت شاگرد و استاد را بر اساس مقطع، درس و هدف آموزشی به هم می‌رساند؛ از کلاس خصوصی
              آنلاین تا کلاس گروهی حضوری در محله‌ی خودتان.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="اینستاگرام"><IconCamera size={19} /></a>
              <a href="#" aria-label="آپارات"><IconVideo size={19} /></a>
              <a href="#" aria-label="تلگرام"><IconSend size={19} /></a>
              <a href="#" aria-label="تماس"><IconPhone size={19} /></a>
            </div>
            <div className="footer-tel">
              <IconPhone size={17} />
              <span>۰۲۱-۹۱۰۰۴۵۶۰</span>
              <span style={{ opacity: 0.6 }}>·</span>
              <span style={{ fontSize: 12.5 }}>شنبه تا پنجشنبه ۸ تا ۲۰</span>
            </div>
          </div>

          <div>
            <h4>مقاطع تحصیلی</h4>
            <a href="/classes">ابتدایی</a>
            <a href="/classes">متوسطه اول</a>
            <a href="/classes">متوسطه دوم</a>
            <a href="/classes">کنکور</a>
            <a href="/classes">مهارتی</a>
          </div>

          <div>
            <h4>دسترسی سریع</h4>
            <a href="/classes">جستجوی کلاس</a>
            <a href="/panel/chat">نیم‌چت</a>
            <a href="/panel/club">نیمکت کلاب</a>
            <a href="/#magazine">مجله نیمکت</a>
            <a href="/login?mode=teacher">استاد شوید</a>
          </div>

          <div>
            <h4>پشتیبانی</h4>
            <a href="/#faq">سوالات متداول</a>
            <a href="#">قوانین و مقررات</a>
            <a href="#">حریم خصوصی</a>
            <a href="#">شرایط لغو و بازگشت وجه</a>
            <a href="/#callback">تماس با ما</a>
          </div>

          <div>
            <h4>مجله نیمکت</h4>
            <a href="/#magazine">آموزش</a>
            <a href="/#magazine">مدیریت مطالعه</a>
            <a href="/#magazine">راهنمای والدین</a>
            <a href="/#magazine">معرفی رشته‌ها</a>
            <a href="/#magazine">همه مطالب</a>
          </div>

          <div>
            <h4>مجوزها</h4>
            <div className="footer-badges" style={{ flexDirection: 'column' }}>
              <div className="footer-badge" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right' }}>
                <IconShield size={26} style={{ flex: 'none', margin: 0 }} />
                <span>
                  نماد اعتماد
                  <br />
                  الکترونیکی
                </span>
              </div>
              <div className="footer-badge" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right' }}>
                <IconCap size={26} style={{ flex: 'none', margin: 0 }} />
                <span>
                  ساماندهی
                  <br />
                  کسب‌وکار مجازی
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>© ۱۴۰۵ نیمکت. همه‌ی حقوق محفوظ است.</span>
          </div>
          <div className="links">
            <a href="#">نقشه سایت</a>
            <a href="#">حریم خصوصی</a>
            <a href="#">قوانین</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
