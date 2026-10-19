import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { faNum, faPrice } from '../../utils/fa.js';
import { IconArrowLeft, IconBook, IconStar, IconCheck } from '../../components/icons.jsx';
import { IconWallet, IconVideo, IconFile, IconGift } from '../../panelIcons.jsx';

export default function StudentHome() {
  const [d, setD] = useState(null);
  const [charge, setCharge] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/panel/student').then(setD).catch(() => setD(null));
  }, []);

  const doCharge = async (e) => {
    e.preventDefault();
    try {
      await api('/wallet/charge', { method: 'POST', body: { amount: Number(charge) } });
      setMsg('شارژ با موفقیت انجام شد.');
      api('/panel/student').then(setD);
    } catch (err) { setMsg(err.message); }
  };

  const cancelNotif = async (id) => {
    await api(`/notifications/${id}/cancel`, { method: 'POST' });
    api('/panel/student').then(setD);
  };

  if (!d) return <p>در حال بارگذاری…</p>;
  const maxV = Math.max(...d.report.months.map((m) => m.v || 0));

  return (
    <div className="pd">
      <div className="pd-greet card">
        <div>
          <h2>سلام {d.user.name.split(' ')[0]}، عصر بخیر</h2>
          <p className="muted">سه‌شنبه ۸ مهر ۴۰۵ · امروز یک کلاس داری</p>
        </div>
        <div className="pd-profile">
          <b>پروفایلت {faNum(d.stats.profile_percent)}٪ کامل است</b>
          <span className="muted">مانده: {d.stats.profile_missing}</span>
          <Link to="/panel/club" className="btn btn-outline">تکمیل پروفایل · +۱۰ سکه</Link>
        </div>
      </div>

      <div className="stat-cards">
        <div className="card stat-card" id="wallet">
          <span className="stat-icon"><IconWallet size={20} /></span>
          <b>{faPrice(d.wallet)}</b>
          <span className="muted">تومان · موجودی کیف پول</span>
          <form onSubmit={doCharge} className="cta-row" style={{ marginTop: 10 }}>
            <button className="btn btn-outline">افزایش موجودی</button>
            <input className="cta-input" placeholder="مبلغ به تومان" value={charge} onChange={(e) => setCharge(e.target.value)} />
          </form>
          {msg && <p className="cta-msg ok">{msg}</p>}
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><IconBook size={20} /></span>
          <b>{faNum(d.stats.month_sessions)}</b>
          <span className="muted">جلسات این ماه · {faNum(d.stats.booked - d.stats.month_sessions)} از {faNum(d.stats.booked)} جلسهٔ رزروشده</span>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><IconCheck size={20} /></span>
          <b>{d.stats.attendance}</b>
          <span className="muted">حضور · {d.stats.attendance_note}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><IconGift size={20} /></span>
          <b>{faNum(d.club_coins)}</b>
          <span className="muted">سکه · سطح نقره‌ای · <Link className="link-green" to="/panel/club">نیمکت کلاب</Link></span>
        </div>
      </div>

      <div className="pd-two">
        <div className="card next-class">
          <div className="nc-head">
            <div>
              <b>{d.next_class.title}</b>
              <span className="muted">{d.next_class.when}</span>
            </div>
            <span className="seat-badge">{d.next_class.session}</span>
          </div>
          <div className="nc-teacher">
            <span className="avatar green">س</span>
            <span>
              <b>{d.next_class.teacher}</b>
              <span className="muted">{d.next_class.teacher_title}</span>
            </span>
            <span className="seat-badge" style={{ marginInlineStart: 'auto' }}>{d.next_class.starts_in}</span>
          </div>
          <div className="nc-actions">
            <button className="btn btn-primary"><IconVideo size={17} /> ورود به کلاس</button>
            <button className="btn btn-outline">تست فنی</button>
          </div>
          <div className="nc-prep">
            <b>برای این جلسه آماده باش</b>
            <ul>
              {d.next_class.prep.map((p) => <li key={p}><IconCheck size={14} /> {p}</li>)}
            </ul>
          </div>
        </div>

        <div className="card notif-card">
          <b>اعلان‌ها</b>
          <ul>
            {d.notifications.map((n) => (
              <li key={n.id}>
                <span>
                  <b>{n.title}</b>
                  <span className="muted">{n.desc}</span>
                  <em>{n.time_label}</em>
                </span>
                {n.cancellable ? (
                  <button className="chip chip-btn" onClick={() => cancelNotif(n.id)}>لغو</button>
                ) : (
                  <span className="chip">خوانده شد</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card" id="upcoming" style={{ marginTop: 18 }}>
        <div className="card-head">
          <b>برنامهٔ کلاس‌های پیش رو</b>
          <span className="link-green">تقویم کامل</span>
        </div>
        <ul className="up-list">
          {d.upcoming.map((u) => (
            <li key={u.id}>
              <span className="up-date"><b>{u.date_label}</b><em>{u.time}</em></span>
              <span className="up-title">{u.title}<em className="muted">{u.teacher}</em></span>
              <Link to="/classes/1" className="btn btn-outline">جزئیات</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="pd-two" style={{ marginTop: 18 }}>
        <div className="card" id="report">
          <div className="card-head">
            <b>گزارش تحصیلی · {d.report.subject}</b>
            <div className="chips">
              <span className="chip chip-btn active">فیزیک</span>
              <span className="chip chip-btn">ریاضی</span>
              <span className="chip chip-btn">زبان</span>
            </div>
          </div>
          <div className="bars">
            {d.report.months.map((m) => (
              <span className="bar-col" key={m.m}>
                <i style={{ height: m.v ? `${(m.v / maxV) * 100}%` : 6, background: m.v ? 'var(--green-700)' : '#dfe5e1' }} />
                <em>{m.v ? faNum(m.v) : 'تعطیلات'}</em>
                <b>{m.m}</b>
              </span>
            ))}
          </div>
          <p className="report-note"><IconStar size={14} /> یادداشت استاد: {d.report.note}</p>
        </div>

        <div className="card" id="files">
          <div className="card-head">
            <b>فایل‌ها و منابع اخیر</b>
            <span className="link-green">همهٔ فایل‌ها</span>
          </div>
          <ul className="file-list">
            {d.files.map((f) => (
              <li key={f.id}>
                <span className="file-type">{f.type}</span>
                <span><b>{f.title}</b><em className="muted">{f.meta}</em></span>
                <IconFile size={18} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
