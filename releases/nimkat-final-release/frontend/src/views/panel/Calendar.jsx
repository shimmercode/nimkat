'use client';
import { useEffect, useState, useCallback } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { persianMonthBounds } from '../../utils/persian-calendar.js';
import TechnicalCheck from '../../components/TechnicalCheck.jsx';
import { IconWifi, IconX, IconRefresh } from '../../components/icons.jsx';

const date = (t) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(t);

export default function Calendar() {
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);

  const bounds = useCallback(() => persianMonthBounds(month), [month]);

  const load = useCallback(async () => {
    const { from, to } = bounds();
    try {
      setError('');
      setData(await api(`/calendar?from=${from}&to=${to}&offset=${offset}`));
    } catch (e) {
      setError(e.message);
    }
  }, [bounds, offset]);

  useEffect(() => {
    let active = true;
    const { from, to } = bounds();
    setData(null);
    api(`/calendar?from=${from}&to=${to}&offset=${offset}`)
      .then((d) => {
        if (active) {
          setData(d);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [bounds, offset]);

  async function respond(id, decision) {
    setBusy(true);
    setError('');
    try {
      await api(`/schedule/proposals/${id}/respond`, { method: 'POST', body: { decision } });
      await load();
      setNotice('پاسخ شما به پیشنهاد تغییر زمان ثبت شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function join(id) {
    setBusy(true);
    setError('');
    try {
      const r = await api(`/classroom/${id}/join`, { method: 'POST', body: {} });
      window.location.assign(r.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const occurrences = (data?.occurrences || []).filter((o) => {
    if (statusFilter === 'scheduled') return o.status === 'scheduled';
    if (statusFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  return (
    <section className="teaching-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h2">تقویم و کلاس‌های من</h1>
          <p className="t-small t-muted" style={{ marginTop: 4 }}>
            تاریخ شمسی و ساعت تهران. ورود به اتاق فقط در بازهٔ مجاز (۱۵ دقیقه قبل تا ۱۵ دقیقه بعد از جلسه) و با عضویت قطعی فعال است.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-green btn-sm"
          aria-expanded={showTechCheck}
          onClick={() => setShowTechCheck((v) => !v)}
        >
          <IconWifi size={16} /> تست فنی قبل از کلاس
        </button>
      </div>

      {showTechCheck && (
        <div style={{ marginTop: 16 }}>
          <TechnicalCheck />
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--error)', marginTop: 12 }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: 'var(--primary)', marginTop: 12 }}>
          {notice}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBlock: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setMonth((m) => m - 1);
              setOffset(0);
            }}
          >
            بازهٔ قبل
          </button>
          <strong>
            {date(bounds().from)} تا {date(bounds().to - 1)}
          </strong>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setMonth((m) => m + 1);
              setOffset(0);
            }}
          >
            بازهٔ بعد
          </button>
          {month !== 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setMonth(0);
                setOffset(0);
              }}
            >
              ماه جاری
            </button>
          )}
        </div>

        <div className="segmented" role="group" aria-label="فیلتر وضعیت جلسات">
          {[
            ['all', 'همه'],
            ['scheduled', 'برنامه‌ریزی‌شده'],
            ['cancelled', 'لغوشده'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={statusFilter === k}
              className={statusFilter === k ? 'is-active' : ''}
              onClick={() => setStatusFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {data?.changes?.map((p) => (
        <article className="nimchat-report" key={p.id}>
          <h2 className="t-h3">پیشنهاد تغییر زمان</h2>
          <p>{p.reason}</p>
          <p>
            قبلی: {date(p.old_start)}
            <br />
            جدید: {date(p.starts_at)} تا {date(p.ends_at)}
          </p>
          <p>مهلت پاسخ: {date(p.expires_at)}؛ تا پذیرش همهٔ اعضا زمان قبلی معتبر است.</p>
          {p.decision === 'pending' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button disabled={busy} className="btn btn-primary" onClick={() => respond(p.id, 'accepted')}>
                پذیرش زمان جدید
              </button>
              <button disabled={busy} className="btn btn-outline" onClick={() => respond(p.id, 'rejected')}>
                رد پیشنهاد
              </button>
            </div>
          ) : (
            <p>پاسخ شما ثبت شده؛ در انتظار سایر اعضا.</p>
          )}
        </article>
      ))}

      {!data && !error && <p role="status">دریافت برنامه…</p>}
      {data && !occurrences.length && (
        <div className="card-soft" style={{ padding: 22 }}>
          <p>در این بازه جلسه‌ای ثبت نشده است.</p>
          <Link to="/classes" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
            رزرو کلاس جدید
          </Link>
        </div>
      )}

      {occurrences.map((o) => (
        <article className="nimchat-report" key={o.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 className="t-h3">{o.title}</h2>
              <p className="t-small t-muted">
                {o.teacher_name} · {o.mode}
              </p>
              <p className="num" style={{ marginTop: 4 }}>
                {date(o.starts_at)} تا {date(o.ends_at)}
              </p>
            </div>
            <span className={`chip ${o.status === 'cancelled' ? '' : 'soft-green'}`}>
              {o.status === 'cancelled' ? 'لغوشده' : 'برنامه‌ریزی‌شده'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {o.status === 'scheduled' && !['حضوری', 'in-person'].includes(o.mode) && (
              <button
                disabled={busy || clock < o.starts_at - 15 * 60000 || clock > o.ends_at + 15 * 60000}
                className="btn btn-primary"
                onClick={() => join(o.id)}
              >
                ورود امن به کلاس
              </button>
            )}
            {o.status === 'scheduled' && o.starts_at > clock && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCancelModal(o)}
              >
                <IconRefresh size={16} /> شرایط لغو و بازپرداخت
              </button>
            )}
            <a
              className="btn btn-outline"
              href="#support"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event('nimkat:open-support'));
              }}
            >
              پشتیبانی کلاس
            </a>
          </div>
        </article>
      ))}

      <div style={{ display: 'flex', gap: 12 }}>
        {offset > 0 && (
          <button className="btn btn-outline" onClick={() => setOffset((n) => Math.max(0, n - 100))}>
            صفحهٔ قبل
          </button>
        )}
        {data?.hasMore && (
          <button className="btn btn-outline" onClick={() => setOffset((n) => n + 100)}>
            جلسات بیشتر
          </button>
        )}
      </div>

      {/* Modal: شرایط لغو و بازپرداخت */}
      {cancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-session-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelModal(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23,33,30,.55)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 26, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="cancel-session-modal-title" className="t-h3">
                لغو و بازپرداخت جلسه «{cancelModal.title}»
              </h2>
              <button type="button" className="btn-icon-round" aria-label="بستن" onClick={() => setCancelModal(null)}>
                <IconX size={18} />
              </button>
            </div>
            <p className="t-small t-muted" style={{ marginTop: 12, lineHeight: 2 }}>
              بر اساس قوانین مالی نیمکت، لغو جلسه و بازگشت وجه به کیف پول فقط از طریق ثبت درخواست رسمی بازپرداخت انجام می‌شود:
            </p>
            <ul className="check-list" style={{ marginTop: 12 }}>
              <li>لغو تا ۲۴ ساعت قبل از شروع جلسه بدون جریمه است و مبلغ پس از تأیید به کیف پول واقعی شما برمی‌گردد.</li>
              <li>بازپرداخت کاملِ خدمت شروع‌نشده، رزرو و صندلی جلسه را به‌طور خودکار آزاد می‌کند.</li>
              <li>هیچ جلسهٔ دارای رزرو فعال بدون ثبت سند مالی بازپرداخت به صورت یک‌طرفه حذف نمی‌شود.</li>
            </ul>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-outline" onClick={() => setCancelModal(null)}>
                انصراف
              </button>
              <Link to="/panel/finance" className="btn btn-primary" onClick={() => setCancelModal(null)}>
                رفتن به امور مالی و ثبت بازپرداخت ({faNum(cancelModal.id)})
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
