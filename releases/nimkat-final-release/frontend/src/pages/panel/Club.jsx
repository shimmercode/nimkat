import { useState } from 'react';
import {
  IconCrown, IconTarget, IconStar, IconUsers, IconCheck, IconGift, IconWallet,
  IconBook, IconHeadset, IconLock, IconDownload, IconHeart, IconMedal, IconCoins,
  IconSparkle, IconInfo,
} from '../../components/icons.jsx';
import { faNum } from '../../utils/fa.js';
import { api, getToken } from '../../api.js';
import { toast } from '../../utils/toast.js';

const LEVELS = [
  {
    name: 'نیمکت برنزی', range: '۰ تا ۴۹۹ سکه', cls: 'bronze', state: 'گذرانده‌اید',
    benefits: ['٪۵ تخفیف کلاس گروهی'],
  },
  {
    name: 'نیمکت نقره‌ای', range: '۵۰۰ تا ۲٬۹۹۹ سکه', cls: 'silver', state: 'سطح فعلی', now: true,
    benefits: ['٪۱۰ تخفیف کلاس گروهی', 'اولویت در گپ‌های اختصاصی'],
  },
  {
    name: 'نیمکت طلایی', range: '۳٬۰۰۰ تا ۴٬۹۹۹ سکه', cls: 'gold', state: 'هدف بعدی', goal: true,
    benefits: ['دو جلسه‌ی رایگان با برترین استاد', 'یک لوح تقدیر نیمکت', 'مشاوره‌ی تخصصی رایگان'],
  },
  {
    name: 'نیمکت پلاتینیوم', range: 'از ۴٬۰۰۰ سکه', cls: 'plat', state: 'قفل',
    benefits: ['کارت نخبگان نیمکت', 'شارژ ۵۰۰ هزار تومانی کیف پول'], locked: true,
  },
];

const MISSIONS = [
  { icon: IconTarget, title: 'شرکت در بیش از ۱۰ کلاس', done: 7, target: 10, coins: 50 },
  { icon: IconStar, title: 'سه کلاس ۵ ستاره', done: 2, target: 3, coins: 20 },
  { icon: IconUsers, title: 'شرکت در یک کلاس گروهی', done: 0, target: 1, coins: 30 },
  { icon: IconCheck, title: 'فعالیت ماهانه در نیم‌چت', done: 1, target: 1, coins: 10 },
];

const EARN = [
  ['تکمیل پروفایل', '۱۰'],
  ['کد معرف (به ازای هر دوست)', '۲۰'],
  ['اولین کلاس برگزارشده', '۳۰'],
  ['هر کلاس موفق', '۱۵'],
  ['شرکت در نظرسنجی پایان کلاس', '۱۰'],
  ['شرکت در کلاس گروهی', '۳۰'],
  ['چالش هفتگی', '۵۰'],
  ['پرسش و پاسخ در پروفایل استاد', '۵ تا ۱۰ مورد'],
];

const REWARDS = [
  { id: 1, icon: IconGift, title: 'دو جلسه‌ی رایگان با استاد برتر', desc: 'ویژه‌ی سطح طلایی', cost: 5500, locked: 'سطح طلایی' },
  { id: 2, icon: IconWallet, title: 'شارژ ۱۰۰ هزار تومانی کیف پول', desc: 'قابل استفاده برای هر کلاس', cost: 500 },
  { id: 3, icon: IconBook, title: 'پک لوازم‌التحریر نیمکت', desc: 'ارسال رایگان به سراسر ایران', cost: 700 },
  { id: 4, icon: IconHeadset, title: 'یک جلسه مشاوره‌ی تحصیلی', desc: '۴۵ دقیقه، آنلاین', cost: 400 },
];

const HISTORY = [
  { date: '۸ مهر', desc: 'حضور در جلسه‌ی ۲ فیزیک یازدهم', amount: 50, rest: 1120 },
  { date: '۷ مهر', desc: 'نظرسنجی پایان کلاس زبان', amount: 15, rest: 1070 },
  { date: '۵ مهر', desc: 'دعوت پارسا کیانی', amount: 50, rest: 1055 },
  { date: '۱ مهر', desc: 'دریافت پک لوازم‌التحریر', amount: -700, rest: 1005 },
];

const MEDALS = [
  { title: 'اولین کلاس', icon: IconStar, cls: '', earned: true },
  { title: '۱۰ کلاس موفق', icon: IconMedal, cls: 'green', earned: true },
  { title: 'منظم ماه', icon: IconCheck, cls: 'green', earned: true },
  { title: 'دعوت‌گر طلایی', icon: IconUsers, cls: '', earned: true },
  { title: 'نخبه‌ی نیم‌چت', icon: IconSparkle, cls: 'dark', earned: true },
  { title: 'سطح طلایی', icon: IconCrown, cls: 'off', earned: false },
];

export default function Club() {
  const [likes, setLikes] = useState({});
  const [claimed, setClaimed] = useState({});
  const [walletCoins, setWalletCoins] = useState(1120);

  const toggleLike = (i) => setLikes((l) => ({ ...l, [i]: !l[i] }));

  const claimReward = async (r) => {
    if (!getToken()) { toast('برای دریافت جایزه اول وارد شوید', 'err'); return; }
    try {
      await api(`/club/rewards/${r.id}/claim`, { method: 'POST', body: {} });
      setClaimed((c) => ({ ...c, [r.id]: true }));
      setWalletCoins((v) => Math.max(0, v - r.cost));
      toast(`«${r.title}» دریافت شد ✓`);
    } catch (e) {
      toast(e.message || 'خطا در دریافت جایزه', 'err');
    }
  };

  const exportHistory = () => {
    const rows = [['تاریخ', 'شرح', 'سکه', 'مانده'], ...HISTORY.map((h) => [h.date, h.desc, h.amount, h.rest])];
    const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nimkat-club-history.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('تاریخچه‌ی سکه‌ها دانلود شد ✓');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* hero */}
      <div className="club-hero">
        <div>
          <span className="eyebrow on-dark">نیمکت کلاب · باشگاه شاگردان</span>
          <h1 style={{ fontSize: 38, fontWeight: 900, marginTop: 14 }}>۵۸۰ سکه تا نیمکت طلایی</h1>
          <p style={{ opacity: 0.88, lineHeight: 2.1, marginTop: 12 }}>
            دو جلسه‌ی رایگان با برترین استادان با نظارت پیشرفته در سطح طلایی منتظر شماست. با همین سرعت، هدف
            ۳ هفته‌ای دیگر می‌رسی.
          </p>

          <div style={{ marginTop: 24 }}>
            <div className="progress on-dark" style={{ height: 12 }}>
              <i style={{ width: '62%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.85, marginTop: 8 }}>
              <span>نقره‌ای · ۵۰۰</span>
              <span className="num">۲٬۴۲۰ سکه</span>
              <span>طلایی · ۳٬۰۰۰</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="club-mini-stat">
            <span style={{ fontSize: 13, opacity: 0.85 }}>سکه‌های این ماه</span>
            <b className="num" style={{ fontSize: 21, color: 'var(--accent)' }}>۵۸۰+</b>
          </div>
          <div className="club-mini-stat">
            <span style={{ fontSize: 13, opacity: 0.85 }}>مأموریت‌های فعال</span>
            <b className="num" style={{ fontSize: 21, color: 'var(--accent)' }}>۴</b>
          </div>
          <div className="club-mini-stat">
            <span style={{ fontSize: 13, opacity: 0.85 }}>رتبه در پایه یازدهم</span>
            <b className="num" style={{ fontSize: 21, color: 'var(--accent)' }}>۳۲۱</b>
          </div>
        </div>
      </div>

      {/* levels */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="t-h3">سطح‌های باشگاه</h2>
          <span className="t-caption t-muted">سطح هر ۶ ماه بر اساس سکه‌های همان دوره بازبینی می‌شود</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 18 }}>
          {LEVELS.map((l) => (
            <div key={l.name} className={`level-card ${l.now ? 'is-now' : l.goal ? 'is-goal' : l.locked ? 'is-locked' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className={`chip ${l.now ? 'soft-green' : l.goal ? 'soft-orange' : l.state === 'قفل' ? '' : 'soft-green'}`}
                >
                  {l.locked && <IconLock size={12} />} {l.state}
                </span>
                <span className={`level-crown ${l.cls}`}>
                  <IconCrown size={26} />
                </span>
              </div>
              <div>
                <b style={{ fontSize: 17 }}>{l.name}</b>
                <div className="t-caption t-muted num" style={{ marginTop: 4 }}>{l.range}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {l.benefits.map((b) => (
                  <span key={b} className="t-small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <IconCheck size={15} style={{ color: l.locked ? 'var(--n500)' : 'var(--secondary)' }} />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* missions + earn */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="p-card">
          <div className="head">
            <h3>مأموریت‌های فعال</h3>
            <span className="t-caption t-muted">تا پایان مهر · ۲۲ روز</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MISSIONS.map((m, i) => {
              const complete = m.done >= m.target;
              return (
                <div key={m.title} className={`mission-card ${complete ? 'is-done' : ''} mission-interactive`}>
                  <span className="ic" style={complete ? { background: 'var(--secondary-50)', borderColor: 'rgba(33,168,120,.35)' } : undefined}>
                    <m.icon size={21} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <b style={{ fontSize: 14 }}>{m.title}</b>
                      <span className="coin-pill"><IconCoins size={13} /> {faNum(m.coins)}+ سکه</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                      <div className="progress" style={{ flex: 1 }}>
                        <i
                          style={{
                            width: `${Math.min(100, (m.done / m.target) * 100)}%`,
                            background: complete ? 'var(--primary)' : 'var(--accent)',
                          }}
                        />
                      </div>
                      <span className="t-caption t-muted num">{faNum(m.done)} از {faNum(m.target)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-round"
                    onClick={() => toggleLike(i)}
                    style={likes[i] ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                    aria-label="علاقه‌مندی"
                  >
                    <IconHeart size={17} filled={!!likes[i]} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-card">
          <div className="head">
            <h3>راه‌های کسب سکه</h3>
            <button type="button" className="link-more" style={{ fontSize: 12.5 }} onClick={() => toast('قوانین: سکه‌ها با فعالیت ماهانه بازنشانی نمی‌شوند؛ جوایز ظرف ۷۲ ساعت ارسال می‌شوند.')}>قوانین کامل</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>فعالیت</th>
                <th style={{ width: 90 }}>سکه</th>
              </tr>
            </thead>
            <tbody>
              {EARN.map(([a, c]) => (
                <tr key={a}>
                  <td className="t-small">{a}</td>
                  <td>
                    <span className="coin-pill">{c}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* medals */}
      <div className="p-card">
        <div className="head">
          <h3>مدال‌ها و افتخارات</h3>
          <span className="t-caption t-muted">مدال‌های بیشتر، سکه و امتیاز وفاداری بیشتر</span>
        </div>
        <div className="medal-row" style={{ justifyContent: 'space-between', padding: '6px 10px' }}>
          {MEDALS.map((m) => (
            <div className="medal" key={m.title}>
              <span className={`m-ic ${m.cls}`} title={m.title}>
                <m.icon size={28} />
              </span>
              <span>{m.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* rewards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="t-h3">جوایز قابل دریافت</h2>
          <span className="t-small t-muted">
            موجودی شما: <b className="num" style={{ color: 'var(--accent-800)' }}>{faNum(walletCoins)} سکه</b>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 18 }}>
          {REWARDS.map((r) => (
            <div key={r.title} className="reward-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ic"><r.icon size={24} /></span>
                <span className="coin-pill num">‌{faNum(r.cost)} <IconCoins size={13} /></span>
              </div>
              <b style={{ fontSize: 14.5, lineHeight: 2 }}>{r.title}</b>
              <span className="t-caption t-muted">{r.desc}</span>
              <div style={{ marginTop: 'auto' }}>
                {r.locked ? (
                  <button className="btn btn-outline btn-block" type="button" disabled>
                    <IconLock size={14} /> {r.locked}
                  </button>
                ) : claimed[r.id] ? (
                  <button className="btn btn-outline btn-block" type="button" disabled style={{ color: 'var(--secondary)' }}>
                    دریافت‌شده ✓
                  </button>
                ) : (
                  <button className="btn btn-soft-green btn-block" type="button" onClick={() => claimReward(r)}>دریافت</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* history */}
      <div className="p-card">
        <div className="head">
          <h3>تاریخچه‌ی سکه‌ها</h3>
          <button type="button" className="link-more" style={{ fontSize: 13 }} onClick={exportHistory}>
            <IconDownload size={15} /> خروجی
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>شرح</th>
              <th>سکه</th>
              <th>مانده</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h) => (
              <tr key={h.date}>
                <td className="num t-muted">{h.date}</td>
                <td className="t-small">{h.desc}</td>
                <td>
                  <b className="num" style={{ color: h.amount > 0 ? 'var(--secondary)' : 'var(--error)' }}>
                    {h.amount > 0 ? `+${faNum(h.amount)}` : `−${faNum(Math.abs(h.amount))}`}
                  </b>
                </td>
                <td className="num">{faNum(h.rest)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
