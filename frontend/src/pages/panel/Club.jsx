import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { faNum, faPrice } from '../../utils/fa.js';
import { IconGift, IconLock2 } from '../../panelIcons.jsx';
import { IconCrown, IconCheck } from '../../components/icons.jsx';

export default function Club() {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/club').then(setD).catch(() => setD(null));
  }, []);

  const claim = async (id) => {
    try {
      await api(`/club/rewards/${id}/claim`, { method: 'POST' });
      setMsg('جایزه دریافت شد؛ جزئیات در اعلان‌ها.');
      api('/club').then(setD);
    } catch (e) { setMsg(e.message); }
  };

  if (!d) return <p>در حال بارگذاری…</p>;

  return (
    <div className="pd">
      <div className="card club-hero">
        <div>
          <span className="eyebrow">نیمکت کلاب · باشگاه شاگردان</span>
          <h2 style={{ marginTop: 12 }}>سطح فعلی: {d.level.name.replace('نیمکت ', '')}</h2>
          <p className="muted">
            {faNum(d.balance)} سکه · {faNum(d.level.coins_to_next)} سکه تا {d.level.next.replace('نیمکت ', '')}
          </p>
          <div className="progress" style={{ marginTop: 12 }}>
            <span className="progress-bar" style={{ height: 10 }}>
              <span className="progress-fill" style={{ width: `${Math.min(100, (d.balance / 1500) * 100)}%` }} />
            </span>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            دو جلسهٔ رایگان با برترین استاد پلتفرم در سطح طلایی منتظرت است. با همین سرعت، حدود ۳ هفتهٔ دیگر می‌رسی.
            سطح هر ۶ ماه بر اساس سکه‌های همان دوره بازبینی می‌شود.
          </p>
        </div>
        <div className="club-hero-side">
          <span className="coin-big"><IconCrown size={26} /> {faNum(d.balance)} سکه</span>
          <span className="muted">هدف بعدی: {d.level.next}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <b>سطح‌های باشگاه</b>
        <div className="levels-grid">
          {d.levels.map((l) => (
            <div className={`level-box ${l.state}`} key={l.name}>
              <span className="level-icon"><IconCrown size={20} /></span>
              <b>{l.name}</b>
              <em>{l.range}</em>
              <ul>
                {l.perks.map((p) => <li key={p}><IconCheck size={13} /> {p}</li>)}
              </ul>
              {l.state === 'locked' && <span className="lock-tag"><IconLock2 size={13} /> قفل</span>}
              {l.state === 'passed' && <span className="lock-tag ok">گذرانده‌اید</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="pd-two" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <b>مأموریت‌های فعال</b>
            <span className="seat-badge">چالش هفتگی · تا پایان مهر</span>
          </div>
          <ul className="mission-list">
            {d.missions.map((m) => (
              <li key={m.id}>
                <span>
                  <b>{m.title}</b>
                  {m.deadline && <em className="muted"> {m.deadline}</em>}
                </span>
                <span className="progress" style={{ width: 130 }}>
                  <span className="progress-bar"><span className="progress-fill" style={{ width: `${(m.done / m.target) * 100}%` }} /></span>
                  <em>{faNum(m.done)} از {faNum(m.target)}</em>
                </span>
                <span className="chip chip-month">+{faNum(m.coins)}</span>
              </li>
            ))}
          </ul>

          <b style={{ display: 'block', marginTop: 18 }}>راه‌های کسب سکه</b>
          <ul className="earn-list">
            {d.earn.map((x) => (
              <li key={x.title}><span>{x.title}</span><b>{faNum(x.coins)}</b></li>
            ))}
          </ul>
        </div>

        <div>
          <div className="card">
            <b>جوایز قابل دریافت</b>
            <ul className="reward-list">
              {d.rewards.map((r) => (
                <li key={r.id}>
                  <span className="rw-icon"><IconGift size={18} /></span>
                  <span className="rw-body">
                    <b>{r.title}</b>
                    <em className="muted">{r.desc}</em>
                  </span>
                  <span className="rw-cost">{faNum(r.cost)}</span>
                  <button className={`btn ${r.locked ? 'btn-outline' : 'btn-orange'}`} disabled={r.locked} onClick={() => claim(r.id)}>
                    {r.locked ? 'سطح طلایی' : r.tag}
                  </button>
                </li>
              ))}
            </ul>
            {msg && <p className="cta-msg ok">{msg}</p>}
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <b>تاریخچهٔ سکه‌ها</b>
            <table className="settle-table" style={{ marginTop: 10 }}>
              <thead><tr><th>شرح</th><th>سکه</th><th>تاریخ</th></tr></thead>
              <tbody>
                {d.history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.desc}</td>
                    <td className={h.amount >= 0 ? 'pos' : 'neg'}>{h.amount >= 0 ? '+' : '−'}{faNum(Math.abs(h.amount))}</td>
                    <td>{h.date_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
