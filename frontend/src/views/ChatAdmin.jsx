'use client';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import PageAccess from '../components/PageAccess.jsx';
import { Link } from '../routing/navigation';
import { faNum } from '../utils/fa.js';

const statuses = {
  open: 'در انتظار بررسی',
  dismissed: 'گزارش ردشده',
  removed: 'پیام حذف‌شده',
  pending: 'در انتظار پاسخ',
  accepted: 'پذیرفته‌شده',
  declined: 'رد دعوت',
  revoked: 'پس‌گرفته‌شده',
};

function Desk() {
  const [policy, setPolicy] = useState(null);
  const [words, setWords] = useState('');
  const [bans, setBans] = useState([]);
  const [banUserId, setBanUserId] = useState('');
  const [banReason, setBanReason] = useState('نقض قوانین گفتگو');
  const [reports, setReports] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [roomPage, setRoomPage] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const loadReports = () => api(`/admin/chat/reports?status=${status}&page=${page}`).then(setReports);
  const loadRooms = () => api(`/admin/chat/rooms?page=${roomPage}`).then(setRooms);
  const loadBans = () => api('/admin/chat/bans').then((r) => setBans(r.bans || []));

  useEffect(() => {
    api('/admin/chat/moderation')
      .then((r) => {
        setPolicy(r.policy);
        setWords((r.policy?.words || []).join('\n'));
        if (r.bans) setBans(r.bans);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let alive = true;
    api(`/admin/chat/reports?status=${status}&page=${page}`)
      .then((r) => {
        if (alive) setReports(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [status, page]);

  useEffect(() => {
    loadRooms().catch((e) => setError(e.message));
  }, [roomPage]);

  async function run(path, body) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(path, { method: 'POST', body });
      await Promise.all([loadReports(), loadRooms(), loadBans()]);
      setNotice('عملیات با ثبت لاگ انجام شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container teaching-page" dir="rtl">
      <header className="teaching-header">
        <div>
          <h1 className="t-h2">مدیریت نیم‌چت</h1>
          <p>فیلتر کلمات ممنوعه، مسدودسازی (بن) کاربران متخلف، بررسی گزارش‌ها و مدیریت گروه‌ها.</p>
        </div>
        <Link className="btn btn-outline" to="/admin/integrations">
          تنظیمات مدیریت
        </Link>
      </header>
      {error && (
        <p role="alert" className="lc-alert">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="lc-notice">
          {notice}
        </p>
      )}

      <section className="teaching-card">
        <h2>قواعد واژگان گفتگو (فیلتر کلمات ممنوعه)</h2>
        <p>
          این فیلتر تطبیق عبارت با یکسان‌سازی حروف فارسی/عربی و حذف نویسه‌های پنهان است؛ پیام‌های حاوی این کلمات در تمام اتاق‌های گفتگو مسدود می‌شوند.
        </p>
        {policy ? (
          <form
            className="onboard-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                const r = await api('/admin/chat/moderation', {
                  method: 'PUT',
                  body: {
                    version: policy.version,
                    enabled: policy.enabled,
                    words: words
                      .split('\n')
                      .map((w) => w.trim())
                      .filter(Boolean),
                  },
                });
                setPolicy(r.policy);
                setWords(r.policy.words.join('\n'));
                setNotice('قواعد واژگان ذخیره شد؛ روی پیام‌های جدید اعمال می‌شود.');
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              عبارت‌های ممنوع (هر خط یک مورد)
              <textarea
                className="input"
                rows={6}
                value={words}
                maxLength={16200}
                onChange={(e) => setWords(e.target.value)}
              />
            </label>
            <label className="onboard-check">
              <input
                type="checkbox"
                checked={policy.enabled}
                onChange={(e) => setPolicy((p) => ({ ...p, enabled: e.target.checked }))}
              />
              فعال‌سازی فیلتر واژگان
            </label>
            <button className="btn btn-primary" disabled={busy}>
              ذخیره قواعد گفتگو
            </button>
          </form>
        ) : (
          <p>در حال دریافت…</p>
        )}
      </section>

      <section className="teaching-card">
        <h2>مسدودسازی (بن) کاربران در چت</h2>
        <p>کاربران مسدودشده امکان ارسال پیام در چت‌روم‌های نیمکت را نخواهند داشت.</p>
        <form
          className="onboard-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!banUserId) return;
            run('/admin/chat/bans', { userId: Number(banUserId), roomId: '*', reason: banReason });
            setBanUserId('');
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <label>
              شناسه کاربر (User ID)
              <input
                className="input"
                type="number"
                min={1}
                value={banUserId}
                onChange={(e) => setBanUserId(e.target.value)}
                placeholder="مثال: 1"
                required
              />
            </label>
            <label>
              دلیل مسدودسازی
              <input
                className="input"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
              />
            </label>
          </div>
          <button className="btn btn-primary" disabled={busy}>
            مسدود کردن (بن) کاربر
          </button>
        </form>
        {bans.length > 0 ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bans.map((b) => (
              <div
                key={`${b.user_id}-${b.room_id}`}
                className="nimchat-report"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
              >
                <div>
                  <b>{b.name || `کاربر #${faNum(b.user_id)}`}</b> (شناسه: {faNum(b.user_id)}) · علت: {b.reason}
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => run(`/admin/chat/bans/${b.user_id}/unban`, { roomId: b.room_id })}
                >
                  رفع مسدودیت (آن‌بن)
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="t-small t-muted" style={{ marginTop: 12 }}>
            در حال حاضر کاربری مسدود نشده است.
          </p>
        )}
      </section>

      <section className="teaching-card">
        <h2>گزارش‌های پیام</h2>
        <label>
          وضعیت گزارش
          <select
            className="input"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            {['open', 'dismissed', 'removed', 'all'].map((k) => (
              <option key={k} value={k}>
                {statuses[k] || 'همه'}
              </option>
            ))}
          </select>
        </label>
        {reports?.reports.map((r) => (
          <article className="nimchat-report" key={r.id}>
            <h3>
              گزارش {faNum(r.id)} · {r.room_title}
            </h3>
            <p>
              فرستنده: {r.sender_name} (شناسه {faNum(r.sender_id)}) · گزارش‌دهنده: {r.reporter_name} ·{' '}
              {statuses[r.status]}
            </p>
            <blockquote>{r.text}</blockquote>
            <p>علت گزارش: {r.reason}</p>
            {r.status === 'open' ? (
              <form
                className="onboard-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  run(`/admin/chat/reports/${r.id}/resolve`, {
                    status: f.get('status'),
                    note: f.get('note'),
                  });
                }}
              >
                <label>
                  نتیجه بررسی
                  <select className="input" name="status">
                    <option value="removed">حذف پیام و پذیرش گزارش</option>
                    <option value="dismissed">رد گزارش، پیام باقی بماند</option>
                  </select>
                </label>
                <label>
                  شرح رسیدگی
                  <textarea className="input" name="note" required minLength={10} maxLength={1000} />
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" disabled={busy}>
                    ثبت نتیجه بررسی پیام
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() =>
                      run('/admin/chat/bans', {
                        userId: Number(r.sender_id),
                        roomId: '*',
                        reason: `گزارش پیام #${r.id}: ${r.reason}`,
                      })
                    }
                  >
                    بن کردن فرستنده پیام
                  </button>
                </div>
              </form>
            ) : (
              <p>شرح رسیدگی: {r.review_note}</p>
            )}
          </article>
        ))}
        {reports && !reports.reports.length && <p>گزارشی در این فیلتر وجود ندارد.</p>}
        <div className="onboard-actions">
          <button className="btn btn-outline" disabled={page <= 1 || busy} onClick={() => setPage((p) => p - 1)}>
            گزارش‌های قبلی
          </button>
          <span>
            صفحه {faNum(page)} · {faNum(reports?.total || 0)} گزارش
          </span>
          <button
            className="btn btn-outline"
            disabled={!reports || page * 25 >= reports.total || busy}
            onClick={() => setPage((p) => p + 1)}
          >
            گزارش‌های بعدی
          </button>
        </div>
      </section>

      <section className="teaching-card">
        <h2>ایجاد گفتگوی مدیریت‌شده</h2>
        <p>
          اعضای اولیه با مسئولیت مدیر به گروه اضافه می‌شوند؛ افزودن نفرات بعدی از مسیر دعوت و پذیرش خود کاربر است.
        </p>
        <form
          className="onboard-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run('/admin/chat/rooms', {
              title: f.get('title'),
              kind: f.get('kind'),
              userIds: String(f.get('users'))
                .split(/[,،\s]+/)
                .filter(Boolean)
                .map(Number),
              classEndsAt: f.get('end') ? new Date(String(f.get('end'))).getTime() : null,
            });
          }}
        >
          <label>
            عنوان گفتگو
            <input className="input" name="title" minLength={2} maxLength={150} required />
          </label>
          <label>
            نوع گفتگو
            <select className="input" name="kind">
              <option value="group">گروه مدیریت‌شده</option>
              <option value="private">خصوصی با مهلت ۷۲ ساعت پس از پایان کلاس</option>
            </select>
          </label>
          <label>
            شناسه اعضای اولیه (جداشده با ویرگول)
            <input className="input" name="users" dir="ltr" maxLength={1000} required />
          </label>
          <label>
            زمان واقعی پایان کلاس (برای خصوصی الزامی)
            <input className="input" type="datetime-local" name="end" />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            ایجاد گفتگو
          </button>
        </form>
      </section>

      <section className="teaching-card">
        <h2>گروه‌ها و دعوت اعضا</h2>
        {rooms?.rooms.map((r) => (
          <article className="nimchat-report" key={r.id}>
            <h3>{r.title}</h3>
            <p>
              {r.closes_at ? `پایان فعالیت: ${new Date(r.closes_at).toLocaleString('fa-IR')}` : 'بدون پایان خودکار'} ·{' '}
              {faNum(r.members.length)} عضو
            </p>
            <details>
              <summary>اعضا و شناسه‌ها</summary>
              {r.members.map((m) => (
                <p key={m.user_id}>
                  {m.name} · {faNum(m.user_id)}{' '}
                  {m.role !== 'moderator' && (
                    <button
                      className="btn btn-outline"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('دسترسی این عضو حذف شود؟'))
                          run(`/admin/chat/rooms/${r.id}/members/${m.user_id}/remove`, {});
                      }}
                    >
                      حذف دسترسی عضو
                    </button>
                  )}
                </p>
              ))}
            </details>
            {r.invitations.map((i) => (
              <p key={i.user_id}>
                دعوت {faNum(i.user_id)}: {statuses[i.status]}{' '}
                {i.status === 'pending' && (
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => run(`/admin/chat/rooms/${r.id}/invitations/${i.user_id}/revoke`, {})}
                  >
                    لغو دعوت
                  </button>
                )}
              </p>
            ))}
            <form
              className="onboard-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(`/admin/chat/rooms/${r.id}/invitations`, {
                  userId: Number(new FormData(e.currentTarget).get('userId')),
                });
              }}
            >
              <label>
                شناسه کاربر برای دعوت
                <input className="input" type="number" name="userId" min={1} required />
              </label>
              <button
                className="btn btn-outline"
                disabled={busy || (!!r.closes_at && r.closes_at <= Date.now())}
              >
                ارسال دعوت به گفتگو
              </button>
            </form>
          </article>
        ))}
        <div className="onboard-actions">
          <button
            className="btn btn-outline"
            disabled={roomPage <= 1 || busy}
            onClick={() => setRoomPage((p) => p - 1)}
          >
            گفتگوهای قبلی
          </button>
          <span>
            صفحه {faNum(roomPage)} · {faNum(rooms?.total || 0)} گفتگو
          </span>
          <button
            className="btn btn-outline"
            disabled={!rooms || roomPage * 25 >= rooms.total || busy}
            onClick={() => setRoomPage((p) => p + 1)}
          >
            گفتگوهای بعدی
          </button>
        </div>
      </section>
    </main>
  );
}
export default function ChatAdmin() {
  return (
    <PageAccess role="admin">
      <Desk />
    </PageAccess>
  );
}
