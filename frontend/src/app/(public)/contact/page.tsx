'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../api.js';
import { faNum } from '../../../utils/fa.js';
import { toast } from '../../../utils/toast.js';
import { IconPhone, IconHeadset, IconClock, IconCheck, IconLock } from '../../../components/icons.jsx';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('مشاوره انتخاب استاد و کلاس');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = String(phone)
      .replace(/[\u06F0-\u06F9]/g, (x) => String(x.charCodeAt(0) - 0x06F0))
      .replace(/[^\d]/g, '');
    if (digits.length !== 11 || !digits.startsWith('09')) {
      setError('شماره موبایل ۱۱ رقمی معتبر با شروع ۰۹ وارد کنید.');
      return;
    }
    setBusy(true);
    try {
      const fullLabel = `${name.trim() || 'کاربر'} | ${topic}${note.trim() ? ` - ${note.trim()}` : ''}`.slice(0, 200);
      await api('/callback', {
        method: 'POST',
        body: { phone: digits, name: fullLabel },
      });
      setSent(true);
      toast('درخواست تماس و مشاوره شما ثبت شد ✓');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت درخواست تماس');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">تماس با ما</span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: 28, alignItems: 'start' }}>
          <div className="card" style={{ padding: 28, borderRadius: 'var(--r-2xl)' }}>
            <span className="eyebrow">ارتباط مستقیم</span>
            <h1 className="t-h2" style={{ marginTop: 10 }}>تماس با نیمکت</h1>
            <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
              تیم پشتیبانی و مشاوران آموزشی نیمکت برای انتخاب استاد، پیگیری رزروها و پاسخ به پرسش‌های فنی کنار شما هستند.
            </p>

            <div className="support-box" style={{ marginTop: 20 }}>
              <div className="row">
                <IconPhone size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <b style={{ fontSize: 14 }}>تلفن پشتیبانی</b>
                  <div className="t-small t-muted num">۰۲۱-۹۱۰۰۴۵۶۰</div>
                </div>
              </div>
              <div className="row">
                <IconClock size={22} style={{ color: 'var(--accent-800)' }} />
                <div>
                  <b style={{ fontSize: 14 }}>ساعات پاسخگویی</b>
                  <div className="t-small t-muted">شنبه تا پنجشنبه · ساعت ۸ الی ۲۰</div>
                </div>
              </div>
              <div className="row">
                <IconHeadset size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <b style={{ fontSize: 14 }}>گفتگوی آنلاین پشتیبانی</b>
                  <div className="t-small t-muted">پاسخگویی هوشمند + ارجاع به کارشناس</div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginRight: 'auto' }}
                  onClick={() => window.dispatchEvent(new Event('nimkat:open-support'))}
                >
                  شروع گفتگو
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28, borderRadius: 'var(--r-2xl)' }}>
            <h2 className="t-h3">فرم درخواست تماس و مشاوره رایگان</h2>
            <p className="t-small t-muted" style={{ marginTop: 6 }}>
              شمارهٔ همراه خود را ثبت کنید تا مشاوران نیمکت امروز با شما تماس بگیرند.
            </p>

            {sent ? (
              <div className="card-soft" style={{ marginTop: 20, padding: 24, textAlign: 'center', background: 'var(--secondary-50)' }}>
                <b style={{ fontSize: 16, color: 'var(--primary)' }}>درخواست تماس شما ثبت شد ✓</b>
                <p className="t-small t-muted" style={{ marginTop: 8 }}>
                  مشاوران نیمکت در ساعات کاری با شمارهٔ <b className="num">{faNum(phone)}</b> تماس می‌گیرند.
                </p>
                <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 14 }} onClick={() => setSent(false)}>
                  ثبت درخواست جدید
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                {error && (
                  <p role="alert" style={{ color: 'var(--error)', fontSize: 13, fontWeight: 700 }}>
                    {error}
                  </p>
                )}
                <label className="field-label">
                  نام و نام خانوادگی
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً فاطمه احمدی"
                    style={{ marginTop: 6 }}
                  />
                </label>
                <label className="field-label">
                  شماره موبایل (الزامی)
                  <input
                    className="input num"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09120000000"
                    style={{ marginTop: 6, textAlign: 'right' }}
                  />
                </label>
                <label className="field-label">
                  موضوع درخواست
                  <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} style={{ marginTop: 6 }}>
                    <option value="مشاوره انتخاب استاد و کلاس">مشاوره انتخاب استاد و کلاس</option>
                    <option value="پیگیری مالی و بازپرداخت">پیگیری مالی و بازپرداخت</option>
                    <option value="همکاری به عنوان استاد">همکاری به عنوان استاد</option>
                    <option value="پشتیبانی فنی کلاس آنلاین">پشتیبانی فنی کلاس آنلاین</option>
                  </select>
                </label>
                <label className="field-label">
                  توضیحات تکمیلی (اختیاری)
                  <textarea
                    className="input"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="مقطع، درس یا زمان دلخواه برای تماس…"
                    style={{ marginTop: 6 }}
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  <IconCheck size={17} /> {busy ? 'در حال ثبت…' : 'ثبت درخواست تماس'}
                </button>
                <div className="field-hint">
                  <IconLock size={14} /> شمارهٔ شما صرفاً برای پاسخگویی به همین درخواست استفاده می‌شود.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
