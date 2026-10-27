'use client';
import { useEffect, useState } from 'react';
import PageAccess from '../components/PageAccess.jsx';
import { api } from '../api.js';
import { DsBadge } from '../components/ui/design-system.jsx';

function Settings() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api('/admin/integrations')
      .then((r) => setServices(r.services))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function save(e, service) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const data = new FormData(e.currentTarget);
    const config = {};
    const secrets = {};
    for (const [key, value] of Object.entries(service.config)) {
      config[key] =
        typeof value === 'boolean'
          ? data.get(key) === 'on'
          : typeof value === 'number'
            ? Number(data.get(key))
            : String(data.get(key) ?? value);
    }
    for (const key of Object.keys(service.secrets)) {
      if (data.get(`remove:${key}`) === 'on') secrets[key] = null;
      else if (data.get(key)) secrets[key] = data.get(key);
    }
    try {
      await api(`/admin/integrations/${service.service}`, {
        method: 'PUT',
        body: { version: service.version, config, secrets },
      });
      await load();
      e.target.reset();
      setNotice('تنظیمات ذخیره شد؛ اتصال واقعی به ارائه‌دهنده هنوز باید آزمایش شود.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const labels = {
    shippingToman: 'هزینهٔ ارسال هر سفارش (تومان)',
    discount2: 'تخفیف گروه دونفره (درصد)',
    discount3: 'تخفیف گروه سه‌نفره (درصد)',
    discount4: 'تخفیف گروه چهارنفره (درصد)',
    discount5: 'تخفیف گروه پنج‌نفره (درصد)',
    holdMinutes: 'مهلت نگهداری گروه (دقیقه)',
    budgetMb: 'بودجهٔ کل فایل (مگابایت؛ شامل فایل لغوشده)',
    perOwnerMb: 'سهم هر مدرس (مگابایت)',
    slaMinutes: 'مهلت رسیدگی پشتیبانی (دقیقه)',
    enabled: 'فعال',
    provider: 'ارائه‌دهنده',
    template: 'نام الگوی OTP',
    sandbox: 'درگاه آزمایشی (پول واقعی نیست)',
    domain: 'نام حساب کلاس آنلاین',
    engine: 'موتور: knowledge یا ollama',
    model: 'مدل میزبانی‌شده',
    greeting: 'پیام خوشامد',
    webhookSecret: 'کلید امضای حضور (حداقل ۳۲ نویسه)',
    travelBufferMinutes: 'فاصلهٔ رفت‌وآمد (دقیقه)',
    apiKey: 'کلید API',
    merchantId: 'شناسه پذیرنده',
  };

  return (
    <main className="container section" dir="rtl">
      <h1 className="t-h2">تنظیمات سرویس‌ها</h1>
      <nav className="nk-admin-nav-grid" aria-label="ناوبری بخش‌های مدیریت">
        <a className="btn btn-primary btn-sm" href="/editor/home">ویرایشگر بصری صفحات</a>
        <a className="btn btn-outline btn-sm" href="/admin/earnings">درآمد، برداشت و همکاری مالی</a>
        <a className="btn btn-outline btn-sm" href="/admin/shop">فروشگاه، موجودی و سفارش‌ها</a>
        <a className="btn btn-outline btn-sm" href="/admin/reviews">بررسی انتشار رضایت‌ها</a>
        <a className="btn btn-outline btn-sm" href="/admin/analytics">تحلیل خرید و بازگشت مشتری</a>
        <a className="btn btn-outline btn-sm" href="/admin/finance">مدیریت بازپرداخت‌ها</a>
        <a className="btn btn-outline btn-sm" href="/admin/chat">مدیریت نیم‌چت</a>
        <a className="btn btn-outline btn-sm" href="/admin/club">مدیریت نیمکت کلاب</a>
        <a className="btn btn-outline btn-sm" href="/admin/blog">تحریریه و سئوی مقاله‌ها</a>
        <a className="btn btn-outline btn-sm" href="/admin/support">میز پشتیبانی و دانش دستیار</a>
        <a className="btn btn-outline btn-sm" href="/admin/teaching">مدیریت مدرس و برنامه جلسات</a>
      </nav>
      <p className="t-small t-muted" style={{ lineHeight: 1.9 }}>
        کلیدها رمزگذاری می‌شوند و دوباره در مرورگر نمایش داده نمی‌شوند. آداپتور ورود کلاس آماده است؛ فعال‌سازی نیاز به حساب سرویس و آزمون واقعی دارد. دریافت حضور از قرارداد پل امضاشده استفاده می‌کند و به اتصال ارائه‌دهنده نیاز دارد.
      </p>
      {error && (
        <p role="alert" className="nk-ds-alert nk-ds-alert--error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="nk-ds-alert nk-ds-alert--success">
          {notice}
        </p>
      )}
      <div style={{ display: 'grid', gap: 24, marginTop: 24 }}>
        {services.map((service) => (
          <form
            key={`${service.service}:${service.version}`}
            onSubmit={(e) => save(e, service)}
            className="p-card"
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <h2 className="t-h3">{service.label}</h2>
              <DsBadge tone={service.config?.enabled ? 'success' : 'neutral'}>
                {service.config?.enabled ? 'فعال' : 'غیرفعال'}
              </DsBadge>
            </div>
            {Object.entries(service.config).map(([key, value]) => (
              <label key={key} style={{ display: 'block', margin: '14px 0', fontWeight: 700, fontSize: 13.5 }}>
                {labels[key] || key}{' '}
                {typeof value === 'boolean' ? (
                  <input name={key} type="checkbox" defaultChecked={value} style={{ accentColor: 'var(--primary)' }} />
                ) : (
                  <input
                    name={key}
                    className="input"
                    defaultValue={value}
                    style={{ display: 'block', width: '100%', marginTop: 6 }}
                  />
                )}
              </label>
            ))}
            {Object.entries(service.secrets).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--n50)',
                  border: '1px solid var(--border)',
                  marginTop: 12,
                }}
              >
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>
                  {labels[key]} · {value.configured ? 'ثبت شده' : 'ثبت نشده'}
                  <input
                    className="input"
                    type="password"
                    name={key}
                    autoComplete="new-password"
                    placeholder="خالی = بدون تغییر"
                    style={{ display: 'block', width: '100%', marginTop: 6 }}
                  />
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5 }}>
                  <input type="checkbox" name={`remove:${key}`} /> حذف کلید ذخیره‌شده
                </label>
              </div>
            ))}
            <button className="btn btn-primary" disabled={busy} style={{ marginTop: 16 }}>
              {busy && <span className="nk-btn-spinner" aria-hidden="true" />}
              ذخیره امن
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}

export default function Integrations() {
  return (
    <PageAccess role="admin">
      <Settings />
    </PageAccess>
  );
}
