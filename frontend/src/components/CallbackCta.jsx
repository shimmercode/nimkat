import { useState } from 'react';
import { faNum } from '../utils/fa.js';
import { IconLock } from './icons.jsx';

export default function CallbackCta() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('idle');

  const submit = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) setState('ok');
    else setState('err');
  };

  return (
    <section className="section" style={{ paddingTop: 10 }}>
      <div className="container">
        <div className="cta-band">
          <div>
            <h2 className="cta-title">نمی‌دانید از کجا شروع کنید؟</h2>
            <p className="cta-text">
              شماره‌تان را بگذارید؛ مشاور تحصیلی نیمکت امروز تماس می‌گیرد و بر
              اساس سطح و هدف، استاد و نوع کلاس پیشنهاد می‌دهد. رایگان.
            </p>
          </div>

          <form className="cta-form" onSubmit={submit}>
            <label htmlFor="phone">شماره موبایل</label>
            <div className="cta-row">
              <button className="btn btn-primary" type="submit">
                درخواست تماس
              </button>
              <input
                id="phone"
                className="cta-input"
                type="tel"
                inputMode="tel"
                placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setState('idle');
                }}
              />
            </div>
            {state === 'ok' && (
              <p className="cta-msg ok">
                شمارهٔ شما ثبت شد؛ امروز تا پایان روز تماس می‌گیریم.
              </p>
            )}
            {state === 'err' && (
              <p className="cta-msg err">شمارهٔ موبایل معتبر وارد کنید.</p>
            )}
            <p className="cta-note">
              <IconLock size={13} />
              شمارهٔ شما فقط برای همین تماس استفاده می‌شود.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
