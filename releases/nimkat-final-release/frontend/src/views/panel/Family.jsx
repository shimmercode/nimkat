'use client';
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { faNum } from '../../utils/fa.js';
import AcademicComparison from '../../components/AcademicComparison.jsx';
import { DsBadge } from '../../components/ui/design-system.jsx';
import { IconUsers, IconShield, IconCalendar, IconChart, IconFile } from '../../components/icons.jsx';

const labels = {
  schedule: 'برنامهٔ جلسات',
  reports: 'گزارش‌های تحصیلی',
  files: 'فایل‌های آموزشی',
};

const date = (t) =>
  new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(t);

export default function Family() {
  const { user } = useAuth();
  const parent = user?.role === 'parent';
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);

  const load = async () => setData(await api(`/family?offset=${offset}`));

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [offset]);

  async function act(fn) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await load();
      setNotice('تغییر با موفقیت ثبت شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function open(uid) {
    setError('');
    setDetail(null);
    try {
      setDetail(await api(`/parent/students/${uid}`));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="panel-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section className="p-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--r-md)',
                background: 'var(--secondary-50)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconUsers size={20} />
            </span>
            <div>
              <h1 className="t-h2">{parent ? 'پنل مستقل والد' : 'دسترسی خانواده'}</h1>
              <span className="t-caption t-muted">مدیریت امن اشتراک‌گذاری برنامه و کارنامه با والدین</span>
            </div>
          </div>
          <DsBadge tone="info">
            <IconShield size={14} /> دسترسی محدود به مجوز شاگرد
          </DsBadge>
        </div>

        <p className="t-small t-muted" style={{ marginTop: 12, lineHeight: 1.9 }}>
          فقط اطلاعاتی که شاگرد صریحاً اجازه داده نمایش داده می‌شود. دسترسی مالی، ورود به کلاس، گفت‌وگوی خصوصی و تغییر رزرو منتقل نمی‌شود. اتصال حساب‌ها به معنی احراز قانونی نسبت خانوادگی نیست.
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

        {parent ? (
          <form
            className="teaching-slot-form"
            style={{ marginTop: 16 }}
            onSubmit={(e) => {
              e.preventDefault();
              const token = new FormData(e.currentTarget).get('token').trim();
              act(() => api('/family/accept', { method: 'POST', body: { token } }));
            }}
          >
            <label style={{ flex: '1 1 260px' }}>
              کد دعوت یک‌بارمصرف شاگرد
              <input
                className="input"
                name="token"
                required
                maxLength={32}
                dir="ltr"
                autoComplete="off"
                placeholder="کد ۳۲ نویسه‌ای دریافت‌شده از شاگرد"
              />
            </label>
            <button className="btn btn-primary" disabled={busy}>
              {busy && <span className="nk-btn-spinner" aria-hidden="true" />}
              پذیرفتن دعوت
            </button>
          </form>
        ) : (
          <form
            style={{ marginTop: 16 }}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              act(async () => {
                setInvite(null);
                setInvite(
                  await api('/family/invitations', {
                    method: 'POST',
                    body: { scopes: f.getAll('scopes'), consent: f.get('consent') === 'on' },
                  })
                );
              });
            }}
          >
            <fieldset
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: '14px 18px',
                background: 'var(--n50)',
              }}
            >
              <legend style={{ fontWeight: 800, fontSize: 13.5, padding: '0 8px', color: 'var(--primary-900)' }}>
                اجازه‌های دعوت جدید
              </legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {Object.entries(labels).map(([k, v]) => (
                  <label
                    key={k}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--white)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13.5,
                    }}
                  >
                    <input type="checkbox" name="scopes" value={k} style={{ accentColor: 'var(--primary)' }} /> {v}
                  </label>
                ))}
              </div>
            </fieldset>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBlock: 16, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" name="consent" required style={{ accentColor: 'var(--primary)' }} /> با اشتراک‌گذاری موارد انتخاب‌شده با دریافت‌کنندهٔ کد موافقم.
            </label>
            <button className="btn btn-primary" disabled={busy}>
              {busy && <span className="nk-btn-spinner" aria-hidden="true" />}
              ساخت دعوت ۳۰ دقیقه‌ای
            </button>
          </form>
        )}

        {invite && (
          <aside className="nimchat-report" style={{ marginTop: 16, background: 'var(--secondary-50)', borderColor: 'rgba(10,104,71,0.3)' }}>
            <p className="t-small" style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
              این کد فقط همین بار نمایش داده می‌شود. آن را فقط برای والد موردنظر بفرستید؛ دعوت‌های مصرف‌نشدهٔ قبلی باطل شدند.
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 800, fontSize: 13 }}>
              کد دعوت
              <input
                className="input num"
                readOnly
                dir="ltr"
                value={invite.token}
                onFocus={(e) => e.target.select()}
                style={{ fontWeight: 800, letterSpacing: '0.04em' }}
              />
            </label>
            <p className="t-caption t-muted num">اعتبار تا {date(invite.expiresAt)}</p>
          </aside>
        )}
      </section>

      <section className="p-card">
        <h2 className="t-h3">دسترسی‌های خانواده</h2>
        {!data && !error && <p role="status">دریافت دسترسی‌ها…</p>}
        {data && !data.links.length && (
          <div className="nk-ds-empty" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>هنوز اتصال حسابی ثبت نشده است.</p>
          </div>
        )}
        {data?.links.map((l) => (
          <article className="nimchat-report" key={l.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16 }}>{l.name}</h3>
              <DsBadge tone={l.status === 'active' ? 'success' : 'neutral'}>
                {l.status === 'active' ? 'فعال' : 'لغوشده'}
              </DsBadge>
            </div>
            <p className="t-small t-muted">
              {l.scopes.map((s) => labels[s]).join('، ')} · {l.status === 'active' ? 'فعال' : 'لغوشده'}
            </p>
            {l.status === 'active' && (
              <div className="operations-actions">
                {parent && (
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => open(l.user_id)}>
                    مشاهدهٔ اطلاعات مجاز
                  </button>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api(`/family/links/${l.id}/revoke`, { method: 'POST', body: { version: l.version } });
                      setDetail(null);
                    })
                  }
                >
                  لغو دسترسی
                </button>
              </div>
            )}
          </article>
        ))}
        <div className="operations-actions" style={{ marginTop: 14 }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={busy || offset === 0}
            onClick={() => setOffset((v) => Math.max(0, v - 50))}
          >
            دسترسی‌های قبلی
          </button>
          <button
            className="btn btn-outline btn-sm"
            disabled={busy || !data?.hasMore}
            onClick={() => setOffset((v) => v + 50)}
          >
            دسترسی‌های بیشتر
          </button>
        </div>
      </section>

      {!parent && !!data?.invitations.length && (
        <section className="p-card">
          <h2 className="t-h3">دعوت‌ها</h2>
          {data.invitations.map((i) => (
            <article className="nimchat-report" key={i.id}>
              <p className="t-small">
                {i.scopes.map((s) => labels[s]).join('، ')} ·{' '}
                {i.used_at
                  ? 'مصرف‌شده'
                  : i.revoked_at
                    ? 'لغوشده'
                    : i.expires_at < Date.now()
                      ? 'منقضی'
                      : 'در انتظار پذیرش'}
              </p>
              {!i.used_at && !i.revoked_at && i.expires_at > Date.now() && (
                <div>
                  <button
                    disabled={busy}
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      act(async () => {
                        await api(`/family/invitations/${i.id}/revoke`, { method: 'POST', body: {} });
                        setInvite(null);
                      })
                    }
                  >
                    باطل کردن دعوت
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {detail && (
        <section className="p-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <h2 className="t-h3">{detail.student.name}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {detail.scopes.map((sc) => (
                <DsBadge key={sc} tone="success">
                  {labels[sc] || sc}
                </DsBadge>
              ))}
            </div>
          </div>

          {detail.scopes.includes('schedule') && (
            <div style={{ marginTop: 12 }}>
              <h3 className="t-h4" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IconCalendar size={18} style={{ color: 'var(--primary)' }} /> برنامهٔ جلسات
              </h3>
              {!detail.occurrences.length && <p className="t-small t-muted">رزرو قطعی ثبت نشده است.</p>}
              {detail.occurrences.map((o) => (
                <article className="nimchat-report" key={o.id}>
                  <h4>
                    {o.title} · جلسهٔ {faNum(o.id)}
                  </h4>
                  <p className="t-small t-muted">
                    {o.teacher_name} · {date(o.starts_at)} · {o.status === 'scheduled' ? 'برنامه‌ریزی‌شده' : 'لغوشده'}
                  </p>
                </article>
              ))}
            </div>
          )}

          {detail.scopes.includes('reports') && (
            <div style={{ marginTop: 18 }}>
              <h3 className="t-h4" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IconChart size={18} style={{ color: 'var(--primary)' }} /> گزارش‌های تحصیلی مجاز
              </h3>
              <AcademicComparison reports={detail.reports} />
            </div>
          )}

          {detail.scopes.includes('files') && (
            <div style={{ marginTop: 16 }}>
              <a className="btn btn-outline btn-sm" href="/parent/files">
                <IconFile size={16} /> فایل‌های مجاز
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
