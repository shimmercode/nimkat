'use client';
import { useState, useEffect, useCallback } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { IconBell, IconCheck, IconArrowLeft } from '../../components/icons.jsx';

const CATEGORIES = [
  ['all', 'همهٔ اعلان‌ها'],
  ['club', 'کلاب و جوایز'],
  ['academic', 'آموزشی و گزارش‌ها'],
  ['financial', 'مالی و رزرو'],
  ['system', 'سیستمی'],
];

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api('/notifications')
      .then((d) => setItems(Array.isArray(d.notifications) ? d.notifications : []))
      .catch((e) => setError(e.message || 'خطا در دریافت اعلان‌ها'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id) => {
    setBusy(true);
    try {
      await api(`/notifications/${id}/read`, { method: 'POST', body: {} });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || Date.now() } : n)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    setNotice('');
    try {
      await api('/notifications/read-all', { method: 'POST', body: {} });
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || Date.now() })));
      setNotice('همهٔ اعلان‌ها به حالت خوانده‌شده درآمدند.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async (id) => {
    setBusy(true);
    setNotice('');
    try {
      const r = await api(`/notifications/${id}/dismiss`, { method: 'POST', body: {} });
      setItems((prev) => prev.filter((n) => n.id !== id));
      setNotice(r.note || 'اعلان بسته شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const filtered = items.filter((n) => {
    if (category !== 'all' && (n.category || 'system') !== category) return false;
    if (onlyUnread && n.read_at) return false;
    return true;
  });

  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <section className="p-card">
      <div className="head" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="t-h2">همهٔ اعلان‌ها ({faNum(items.length)})</h1>
          <p className="t-small t-muted" style={{ marginTop: 4 }}>
            بستن اعلان فقط نمایش آن را از این فهرست جمع می‌کند و هیچ تراکنش مالی، رزرو یا سابقهٔ آموزشی را حذف نمی‌کند.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={markAllRead}>
              <IconCheck size={16} /> خواندن همه ({faNum(unreadCount)})
            </button>
          )}
          <Link to="/panel" className="btn btn-outline btn-sm">
            بازگشت به پنل <IconArrowLeft size={15} />
          </Link>
        </div>
      </div>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="فیلتر دسته‌بندی اعلان">
          {CATEGORIES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={category === key}
              className={`chip ${category === key ? 'is-active' : 'outline'}`}
              onClick={() => setCategory(key)}
              style={{ cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
          فقط خوانده‌نشده‌ها ({faNum(unreadCount)})
        </label>
      </div>

      {loading && <p role="status">در حال دریافت اعلان‌ها…</p>}

      {!loading && filtered.length === 0 && (
        <div className="card-soft" style={{ padding: 24, textAlign: 'center' }}>
          <p className="t-small t-muted">اعلانی با این فیلتر وجود ندارد.</p>
        </div>
      )}

      {!loading &&
        filtered.map((n) => (
          <div className="notif-row" key={n.id} style={n.read_at ? { opacity: 0.78 } : undefined}>
            <span className="ic">
              <IconBell size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 14 }}>{n.title}</b>
                {!n.read_at && <span className="chip soft-orange">خوانده‌نشده</span>}
              </div>
              <div className="t-small t-muted" style={{ marginTop: 4 }}>
                {n.body}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className="t-caption t-muted">{new Date(n.created_at).toLocaleDateString('fa-IR')}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {!n.read_at && (
                  <button
                    type="button"
                    className="t-caption"
                    style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                    disabled={busy}
                    onClick={() => markRead(n.id)}
                  >
                    علامت خوانده‌شده
                  </button>
                )}
                <button
                  type="button"
                  className="t-caption"
                  style={{ color: 'var(--error)', fontWeight: 700, cursor: 'pointer' }}
                  disabled={busy}
                  onClick={() => dismiss(n.id)}
                >
                  بستن اعلان
                </button>
              </div>
            </div>
          </div>
        ))}
    </section>
  );
}
