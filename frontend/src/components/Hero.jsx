import { useState } from 'react';
import { Link } from 'react-router-dom';
import heroStudent from '../assets/hero-student.jpg';
import heroTeacher from '../assets/hero-teacher.jpg';
import { faNum } from '../utils/fa.js';
import {
  IconGlobe,
  IconPin,
  IconSearch,
  IconLock,
  IconRefresh,
  IconStar,
} from './icons.jsx';

export default function Hero() {
  const [mode, setMode] = useState('online');

  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div>
          <h1 className="hero-title">
            استاد مناسبِت را پیدا کن،
            <br />
            <span className="green">نیمکتت را رزرو کن.</span>
          </h1>
          <p className="hero-sub">
            کلاس خصوصی یا گروهی، آنلاین یا در خانهٔ خودتان. قیمت هر جلسه، ظرفیت
            باقی‌مانده و نظر شاگردهای قبلی را قبل از پرداخت می‌بینید.
          </p>

          <div className="search-card">
            <div className="search-tabs">
              <button
                className={`tab${mode === 'online' ? ' active' : ''}`}
                onClick={() => setMode('online')}
              >
                <IconGlobe size={17} />
                آنلاین
              </button>
              <button
                className={`tab${mode === 'offline' ? ' active' : ''}`}
                onClick={() => setMode('offline')}
              >
                <IconPin size={17} />
                حضوری
              </button>
              <span className="search-note">
                گام ۱ از ۲ · {faNum('1,200')} جلسهٔ برگزارشده این ماه
              </span>
            </div>

            <div className="search-fields">
              <div className="field">
                <label>نوع کلاس</label>
                <select defaultValue="خصوصی">
                  <option>خصوصی</option>
                  <option>گروهی</option>
                </select>
              </div>
              <div className="field">
                <label>مقطع</label>
                <select defaultValue="متوسطه دوم">
                  <option>ابتدایی</option>
                  <option>متوسطه اول</option>
                  <option>متوسطه دوم</option>
                  <option>کنکور</option>
                </select>
              </div>
              <div className="field">
                <label>درس</label>
                <select defaultValue="فیزیک">
                  <option>ریاضی</option>
                  <option>فیزیک</option>
                  <option>شیمی</option>
                  <option>زیست</option>
                  <option>ادبیات</option>
                  <option>زبان انگلیسی</option>
                </select>
              </div>
              <Link to="/classes" className="btn btn-primary">
                <IconSearch size={17} />
                جست‌وجو
              </Link>
            </div>
          </div>

          <div className="trust-row">
            <span className="trust-item">
              <span className="stars">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={15} />
                ))}
              </span>
              <b>۴٫۸</b> از {faNum('12,400')} نظر ثبت‌شده
            </span>
            <span className="trust-item">
              <IconLock size={16} />
              پرداخت امن بانکی
            </span>
            <span className="trust-item">
              <IconRefresh size={16} />
              بازگشت وجه تا ۲۴ ساعت قبل
            </span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="chat chat-1">توی درس ریاضی مشکل دارم</div>
          <div className="chat chat-2">میتونید کمکم کنید؟</div>
          <div className="chat dark chat-3">ما در نیمکت برای کمک به شما آماده ایم</div>
          <div className="chat dark chat-4">اولین کلاس خودتون رو رزرو کنید</div>

          <div className="blob blob-main">
            <img src={heroStudent} alt="دانش‌آموز نیمکت" />
          </div>
          <div className="blob blob-teacher">
            <img src={heroTeacher} alt="استاد نیمکت" />
          </div>

          <span className="spark" style={{ top: '46%', left: '38%' }}>●</span>
          <span className="spark" style={{ top: '52%', left: '34%', fontSize: 12 }}>＋</span>
          <span className="spark" style={{ top: '60%', left: '40%', fontSize: 10 }}>✕</span>
          <span className="spark" style={{ top: '70%', left: '36%', fontSize: 14 }}>＋</span>
        </div>
      </div>
    </section>
  );
}
