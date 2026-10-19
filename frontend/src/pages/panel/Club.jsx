import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { IconCheck } from '../../components/icons.jsx';
import {
  IconCrown, IconGift, IconLock2, IconCoin, IconMedal, IconHeart2,
  IconTarget, IconTrend, IconDownload,
} from '../../panelIcons.jsx';

const LEVEL_STYLE = {
  passed: { cls: 'passed', icon: 'bronze' },
  current: { cls: 'current', icon: 'silver' },
  next: { cls: 'next', icon: 'gold' },
  locked: { cls: 'locked', icon: 'plat' },
};
const STATE_TAG = { passed: 'گذرانده‌اید', current: 'سطح فعلی', next: 'هدف بعدی', locked: 'قفل' };

export default function Club() {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState('');
  const [likes, setLikes] = useState({});
  const [openMission, setOpenMission] = useState(null);

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
      {/* hero */}
      <div className="club-hero2">
        <div className="ch-main">
          <span className="eyebrow on-dark">نیمکت کلاب · باشگاه شاگردان</span>
          <h2>{faNum(d.level.coins_to_next)} سکه تا {d.level.next.replace('نیمکت ', '')}</h2>
          <p>
            دو جلسهٔ رایگان با برترین استاد پلتفرم در سطح طلایی منتظرت است. با همین سرعت،
            حدود ۳ هفتهٔ دیگر می‌رسی.
          </p>
          <div className="ch-progress">
            <span className="progress-bar"><span className="progress-fill" style={{ width: `${Math.min(100, (d.balance / 1500) * 100)}%` }} /></span>
            <div className="ch-labels">
              <span>برنزی · ۵۰۰</span>
              <b>{faNum(d.balance)} سکه</b>
              <span>طلایی · ۱٬۵۰۰</span>
            </div>
          </div>
        </div>
        <div className="ch-side">
          <span className="ch-stat"><b>+{faNum(185)}</b> سکه‌های این ماه</span>
          <span className="ch-stat"><b>{faNum(d.missions.length)}</b> مأموریت‌های فعال</span>
          <span className="ch-stat"><b>{faNum(33)}</b> رتبه در پایه یازدهم</span>
        </div>
      </div>

      {/* medals strip (کارفرما: نمایش مدال‌های کسب‌شده) */}
      <div className="medals-strip">
        <b>مدال‌ها و افتخارات شما</b>
        <div className="medals">
          <span className="medal got"><IconMedal size={22} /><em>حضور کامل مهر</em></span>
          <span className="medal got"><IconMedal size={22} /><em>۱۰ کلاس موفق</em></span>
          <span className="medal got"><IconMedal size={22} /><em>دعوت دوست</em></span>
          <span className="medal"><IconLock2 size={20} /><em>سه کلاس ۵ ستاره</em></span>
          <span className="medal"><IconLock2 size={20} /><em>چالش مهر</em></span>
        </div>
      </div>

      {/* levels */}
      <div className="sec-head">
        <b>سطح‌های باشگاه</b>
        <span className="muted">سطح هر ۶ ماه بر اساس سکه‌های همان دوره بازبینی می‌شود</span>
      </div>
      <div className="levels-grid2">
        {d.levels.map((l) => {
          const st = LEVEL_STYLE[l.state];
          return (
            <div className={`lvl2 ${st.cls}`} key={l.name}>
              <span className={`lvl2-icon ${st.icon}`}><IconCrown size={22} /></span>
              <span className="lvl2-tag">{STATE_TAG[l.state]}</span>
              <b>{l.name}</b>
              <em>{l.range}</em>
              <ul>{l.perks.map((p) => <li key={p}><IconCheck size={13} /> {p}</li>)}</ul>
            </div>
          );
        })}
      </div>

      <div className="pd-two">
        {/* missions - کارت‌های تعاملی */}
        <div className="card">
          <div className="card-head">
            <b>مأموریت‌های فعال</b>
            <span className="muted" style={{ fontSize: 12 }}>تا پایان مهر · ۲۲ روز</span>
          </div>
          <div className="mission-cards">
            {d.missions.map((m, i) => (
              <button
                className={`mission2${openMission === m.id ? ' open' : ''}`}
                key={m.id}
                onClick={() => setOpenMission(openMission === m.id ? null : m.id)}
              >
                <span className={`m2-icon ${i === 3 ? 'done' : ''}`}>
                  {i === 0 ? <IconTarget size={18} /> : i === 1 ? <IconMedal size={18} /> : i === 2 ? <IconTrend size={18} /> : <IconCheck size={18} />}
                </span>
                <span className="m2-body">
                  <b>{m.title}</b>
                  <span className="progress">
                    <span className="progress-bar"><span className={`progress-fill${m.done >= m.target ? '' : ' orange'}`} style={{ width: `${(m.done / m.target) * 100}%` }} /></span>
                  </span>
                </span>
                <span className="m2-meta">
                  <em>{faNum(m.done)} از {faNum(m.target)}</em>
                  <span className="coin-chip"><IconCoin size={13} /> +{faNum(m.coins)}</span>
                </span>
                {openMission === m.id && (
                  <span className="m2-hint">
                    با انجام این مأموریت {faNum(m.coins)} سکه می‌گیری؛ پیشرفتت خودکار ثبت می‌شود.
                    {m.deadline && <> {m.deadline}</>}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* earn table */}
        <div className="card">
          <div className="card-head">
            <b>راه‌های کسب سکه</b>
            <span className="link-green">قوانین کامل</span>
          </div>
          <table className="settle-table earn-table">
            <thead><tr><th>فعالیت</th><th>سکه</th></tr></thead>
            <tbody>
              {d.earn.map((x) => (
                <tr key={x.title}>
                  <td>{x.title}</td>
                  <td><span className="coin-chip"><IconCoin size={13} /> {faNum(x.coins)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* rewards */}
      <div className="sec-head" style={{ marginTop: 22 }}>
        <b>جوایز قابل دریافت</b>
        <span className="muted">موجودی شما: {faNum(d.balance)} سکه</span>
      </div>
      <div className="reward-grid">
        {d.rewards.map((r) => (
          <div className={`reward2${r.locked ? ' locked' : ''}`} key={r.id}>
            <span className="rw2-icon"><IconGift size={20} /></span>
            <b>{r.title}</b>
            <em>{r.desc}</em>
            <div className="rw2-foot">
              <span className="coin-chip"><IconCoin size={14} /> {faNum(r.cost)}</span>
              <button className={`btn ${r.locked ? 'btn-outline' : 'btn-mint'}`} disabled={r.locked} onClick={() => claim(r.id)}>
                {r.locked ? <><IconLock2 size={14} /> سطح طلایی</> : 'دریافت'}
              </button>
            </div>
            <button
              className="rw2-like"
              onClick={() => setLikes({ ...likes, [r.id]: (likes[r.id] || 12) + 1 })}
            >
              <IconHeart2 size={14} /> {likes[r.id] || 12}
            </button>
          </div>
        ))}
      </div>
      {msg && <p className="cta-msg ok">{msg}</p>}

      {/* history */}
      <div className="card" style={{ marginTop: 22 }}>
        <div className="card-head">
          <b>تاریخچهٔ سکه‌ها</b>
          <span className="link-green"><IconDownload size={14} /> خروجی</span>
        </div>
        <table className="settle-table">
          <thead><tr><th>تاریخ</th><th>شرح</th><th>سکه</th><th>مانده</th></tr></thead>
          <tbody>
            {d.history.reduce((acc, h) => {
              const prev = acc.length ? acc[acc.length - 1].rem : d.balance;
              acc.push({ h, rem: prev - h.amount });
              return acc;
            }, []).map(({ h, rem }) => (
              <tr key={h.id}>
                <td>{h.date_label}</td>
                <td>{h.desc}</td>
                <td className={h.amount >= 0 ? 'pos' : 'neg'}>{h.amount >= 0 ? `+${faNum(h.amount)}` : `−${faNum(Math.abs(h.amount))}`}</td>
                <td className="muted">{faNum(rem)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
