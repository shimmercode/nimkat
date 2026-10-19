import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { faNum, faPrice } from '../../utils/fa.js';
import { IconCheck, IconStar, IconChatPlaceholder } from '../../components/icons.jsx';
import {
  IconWallet, IconVideo, IconFile, IconClub, IconCalendar, IconCoin,
  IconDownload, IconBell, IconBulb, IconClock,
} from '../../panelIcons.jsx';

export default function StudentHome() {
  const [d, setD] = useState(null);
  const [charge, setCharge] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/panel/student').then(setD).catch(() => setD(null));
  }, []);

  const reload = () => api('/panel/student').then(setD);

  const doCharge = async (e) => {
    e.preventDefault();
    try {
      await api('/wallet/charge', { method: 'POST', body: { amount: Number(charge) } });
      setMsg('شارژ با موفقیت انجام شد.');
      setCharge('');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const cancelNotif = async (id) => {
    await api(`/notifications/${id}/cancel`, { method: 'POST' });
    reload();
  };

  if (!d) return <p>در حال بارگذاری…</p>;
  const maxV = Math.max(...d.report.months.map((m) => m.v || 0));

  return (
    <div className="pd">
      <div className="pd-greet">
        <div>
          <h2>سلام {d.user.name.split(' ')[0]}، عصر بخیر</h2>
          <p className="muted">سه‌شنبه ۸ مهر ۱۴۰۵ · امروز یک کلاس داری</p>
        </div>
        <Link to="/classes" className="btn btn-primary">+ رزرو کلاس جدید</Link>
      </div>

      <div className="profile-banner">
        <span className="pb-icon"><IconCoin size={22} /></span>
        <div className="pb-body">
          <b>پروفایلت {faNum(d.stats.profile_percent)}٪ کامل است</b>
          <div className="progress"><span className="progress-bar"><span className="progress-fill orange" style={{ width: `${d.stats.profile_percent}%` }} /></span></div>
          <span className="pb-missing">مانده: {d.stats.profile_missing}</span>
        </div>
        <div className="pb-cta">
          <em>با تکمیلش ۱۰ سکه می‌گیری</em>
          <button className="btn btn-orange">تکمیل پروفایل</button>
        </div>
      </div>

      <div className="sd-grid">
        <div className="next-class-dark">
          <div className="nc-top">
            <span className="nc-soon"><IconClock size={14} /> {d.next_class.starts_in}</span>
            <span className="nc-session">جلسهٔ ۳ از ۸</span>
          </div>
          <h3>{d.next_class.title}</h3>
          <p className="nc-when">{d.next_class.when}</p>
          <div className="nc-teacher">
            <span className="avatar orange">س</span>
            <span><b>{d.next_class.teacher}</b><span>{d.next_class.teacher_title}</span></span>
          </div>
          <div className="nc-prep-dark">
            <b>برای این جلسه آماده باش</b>
            <ul>
              {d.next_class.prep.map((p) => <li key={p}><IconCheck size={14} /> {p}</li>)}
            </ul>
          </div>
          <div className="nc-actions">
            <button className="btn btn-orange nc-enter"><IconVideo size={18} /> ورود به کلاس</button>
            <button className="btn nc-tech">تست فنی</button>
            <button className="icon-btn nc-chat" aria-label="چت"><IconChatPlaceholder size={18} /></button>
          </div>
        </div>

        <div className="sd-stats">
          <div className="card stat-card">
            <span className="stat-icon green"><IconWallet size={20} /></span>
            <b>{faPrice(d.wallet)}</b>
            <span className="muted">تومان · موجودی کیف پول</span>
            <form onSubmit={doCharge} className="cta-row" style={{ marginTop: 8 }}>
              <button className="btn btn-outline">افزایش موجودی</button>
              <input className="cta-input" placeholder="مبلغ به تومان" value={charge} onChange={(e) => setCharge(e.target.value)} />
            </form>
            {msg && <p className="cta-msg ok">{msg}</p>}
          </div>
          <div className="card stat-card">
            <span className="stat-icon orange"><IconClub size={20} /></span>
            <b>{faNum(d.club_coins)}</b>
            <span className="muted">سکه · سطح نقره‌ای · <Link className="link-green" to="/panel/club">نیمکت کلاب</Link></span>
          </div>
          <div className="card stat-card">
            <span className="stat-icon green"><IconCalendar size={20} /></span>
            <b>{faNum(d.stats.month_sessions)}</b>
            <span className="muted">جلسات این ماه · از {faNum(d.stats.booked)} جلسهٔ رزروشده</span>
          </div>
          <div className="card stat-card">
            <span className="stat-icon green"><IconCheck size={20} /></span>
            <b>{d.stats.attendance}</b>
            <span className="muted">حضور · {d.stats.attendance_note}</span>
          </div>
        </div>
      </div>

      <div className="pd-two">
        <div className="card" id="upcoming">
          <div className="card-head">
            <b>برنامهٔ کلاس‌های پیش رو</b>
            <span className="link-green">تقویم کامل</span>
          </div>
          <ul className="up-list">
            {d.upcoming.map((u, i) => (
              <li key={u.id}>
                <span className="up-date"><b>{u.date_label}</b><em>ساعت {u.time}</em></span>
                <span className={`up-bar ${i === 0 ? 'hot' : ''}`} />
                <span className="up-title">{u.title}<em className="muted">{u.teacher}</em></span>
                {i === 0
                  ? <span className="seat-badge">۴۵ دقیقهٔ دیگر</span>
                  : <button className="up-cancel" onClick={() => {}}>✕ لغو</button>}
              </li>
            ))}
          </ul>
        </div>

        <div className="card notif-card">
          <div className="card-head">
            <b>اعلان‌ها</b>
            <span className="link-green">همه</span>
          </div>
          <ul>
            {d.notifications.map((n) => (
              <li key={n.id}>
                <span className="nt-icon"><IconBell size={16} /></span>
                <span className="nt-body">
                  <b>{n.title}</b>
                  <span className="muted">{n.desc}</span>
                </span>
                <span className="nt-time">{n.time_label}</span>
                {n.cancellable && <button className="up-cancel" onClick={() => cancelNotif(n.id)}>لغو</button>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card" id="report" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <b>گزارش تحصیلی · {d.report.subject}</b>
            <span className="muted" style={{ fontSize: 12 }}> میانگین نمرهٔ آزمونک‌ها از ۲۰</span>
          </div>
          <div className="seg-tabs">
            <button className="active">فیزیک</button>
            <button>ریاضی</button>
            <button>زبان</button>
          </div>
        </div>
        <div className="bars">
          {[...d.report.months].reverse().map((m) => (
            <span className="bar-col" key={m.m}>
              <em className="bar-val">{m.v ? faNum(String(m.v).replace('.', '٫')) : ''}</em>
              <i style={{ height: m.v ? `${(m.v / maxV) * 120}px` : 8, background: m.v ? (m.v === maxV ? 'var(--green-700)' : '#d8ece0') : '#e6eae7' }} />
              <b>{m.m}</b>
              {m.v === null && <em className="bar-val">تعطیلات</em>}
            </span>
          ))}
        </div>
        <p className="report-note"><IconBulb size={16} /> <b>یادداشت استاد:</b> {d.report.note}</p>
      </div>

      <div className="card" id="files" style={{ marginTop: 16 }}>
        <div className="card-head">
          <b>فایل‌ها و منابع اخیر</b>
          <span className="link-green">همهٔ فایل‌ها</span>
        </div>
        <div className="file-row">
          {d.files.map((f) => (
            <span className="file-item" key={f.id}>
              <span className={`file-type ${f.type === 'MP3' ? 'mint' : 'pink'}`}>{f.type}</span>
              <span className="fi-body"><b>{f.title}</b><em className="muted">{f.meta}</em></span>
              <span className="icon-btn"><IconDownload size={16} /></span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
