'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { faNum } from '../../utils/fa.js';

export default function Materials() {
  const { user } = useAuth();
  const teacher = user?.role === 'teacher';
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState('all');
  const [items, setItems] = useState(null);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api('/materials/sessions')
      .then((d) => {
        if (active) setSessions(d.sessions || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadMaterials = useCallback(() => {
    let active = true;
    setReloading(true);
    setError('');
    if (!selected) {
      setItems([]);
      setReloading(false);
      return () => {};
    }
    const endpoint = selected === 'all' ? '/materials/mine' : `/materials?occurrenceId=${selected}`;
    api(endpoint)
      .then((d) => {
        if (active) {
          setItems(d.materials || []);
          setReloading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setReloading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selected]);

  useEffect(() => {
    const cleanup = loadMaterials();
    return cleanup;
  }, [loadMaterials]);

  const reload = async () => {
    const endpoint = selected === 'all' || !selected ? '/materials/mine' : `/materials?occurrenceId=${selected}`;
    setItems((await api(endpoint)).materials || []);
  };

  async function upload(e) {
    e.preventDefault();
    if (!selected || selected === 'all') {
      setError('ابتدا یک جلسهٔ مشخص را برای بارگذاری فایل انتخاب کنید.');
      return;
    }
    const form = e.currentTarget;
    const f = new FormData(form).get('file');
    if (!f?.size || f.size > 512 * 1024) {
      setError('فایل باید غیرخالی و حداکثر ۵۱۲ کیلوبایت باشد.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(`/materials/${selected}`, {
        method: 'POST',
        body: f,
        raw: true,
        headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(f.name) },
      });
      await reload();
      form.reset();
      setNotice('اسکن امنیتی موفق بود و فایل منتشر شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function download(e, m) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const blob = await api(`/materials/${m.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = m.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    setBusy(true);
    setError('');
    try {
      await api(`/materials/${id}/revoke`, { method: 'POST', body: {} });
      await reload();
      setNotice('دسترسی دانلود فایل لغو شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const fileBadge = (mime) => {
    if (mime === 'application/pdf') return 'PDF';
    if (mime === 'image/png') return 'PNG';
    if (mime === 'image/jpeg') return 'JPEG';
    return 'فایل';
  };

  return (
    <section className="p-card">
      <h1 className="t-h2">فایل‌ها و منابع امن</h1>
      <p className="t-small t-muted" style={{ marginTop: 4, marginBottom: 16 }}>
        فقط فایل جلسهٔ دارای رزرو قطعی یا دسترسی صریح خانواده قابل دریافت است. هر دریافت دوباره مجوزسنجی می‌شود. فایل‌ها عمومی نیستند و در PWA ذخیره نمی‌شوند.
      </p>
      {error && (
        <p role="alert" style={{ color: 'var(--error)', marginBottom: 12 }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: 'var(--primary)', marginBottom: 12 }}>
          {notice}
        </p>
      )}

      <label htmlFor="materials-session" className="field-label">
        انتخاب جلسه
      </label>
      <select
        id="materials-session"
        className="input"
        value={selected}
        disabled={busy}
        onChange={(e) => setSelected(e.target.value)}
        style={{ marginTop: 6, marginBottom: 16 }}
      >
        <option value="all">همهٔ جلسات مجاز من ({faNum(sessions.length)} جلسه)</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title} · جلسهٔ {faNum(s.id)}
          </option>
        ))}
      </select>

      {!sessions.length && (
        <p className="t-small t-muted" style={{ marginBottom: 12 }}>
          هنوز جلسهٔ مجازی برای فایل آموزشی ثبت نشده است. پس از رزرو قطعی کلاس، منابع جلسات شما در اینجا فعال می‌شود.
        </p>
      )}

      {teacher && selected && selected !== 'all' && (
        <form onSubmit={upload} style={{ marginBlock: 24 }}>
          <label className="field-label">
            فایل PDF، PNG یا JPEG · حداکثر ۵۱۲ کیلوبایت
            <input
              className="input"
              name="file"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              required
              disabled={busy}
              style={{ marginTop: 6 }}
            />
          </label>
          <p className="t-caption t-muted" style={{ marginBlock: 8 }}>
            فایل تنها بعد از پاسخ سالم اسکنر منتشر می‌شود. قطع یا پیکربندی‌نشدن اسکنر، انتشار را متوقف می‌کند.
          </p>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'در حال بررسی…' : 'بررسی و انتشار فایل'}
          </button>
        </form>
      )}

      {items === null && !error && <p role="status">دریافت فایل‌ها…</p>}
      {items?.length === 0 && (
        <div className="card-soft" style={{ padding: 20, marginTop: 12 }}>
          <p className="t-small t-muted">هنوز فایل بررسی‌شده‌ای برای این بخش منتشر نشده است.</p>
        </div>
      )}

      {items?.map((m) => (
        <article className="nimchat-report" key={m.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h2 className="t-h3">{m.name}</h2>
              <p className="t-small t-muted">
                {m.title ? `${m.title} · ` : ''}
                {faNum(Math.max(1, Math.ceil((m.size || 0) / 1024)))} کیلوبایت ·{' '}
                {new Date(m.created_at).toLocaleDateString('fa-IR')}
              </p>
            </div>
            <span className="chip soft-green">{fileBadge(m.mime)}</span>
          </div>
          <div className="operations-actions" style={{ marginTop: 12 }}>
            <a
              className="btn btn-primary"
              href={`/api/materials/${m.id}/download`}
              onClick={(e) => {
                if (!busy) download(e, m);
                else e.preventDefault();
              }}
              aria-disabled={busy}
            >
              دانلود فایل
            </a>
            {teacher && (
              <button className="btn btn-outline" disabled={busy} onClick={() => revoke(m.id)}>
                لغو انتشار
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
