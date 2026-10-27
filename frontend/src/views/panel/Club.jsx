'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { useInitialEntity } from '../../render/EntityContext.jsx';
import { Link } from '../../routing/navigation';
import { clubEventLabel } from '../../utils/club-events.js';
import { faNum, faPrice } from '../../utils/fa.js';
import {
  IconCrown, IconTarget, IconStar, IconGift, IconCoins, IconMedal, IconCheck, IconLock,
  IconArrowLeft, IconCalendar, IconUsers, IconBook, IconInfo, IconX, IconWallet, IconHeadset,
} from '../../components/icons.jsx';

const tabs = [
  ['overview', 'مسیر رشد'],
  ['missions', 'مأموریت‌ها'],
  ['rewards', 'جوایز'],
  ['medals', 'افتخارات'],
  ['history', 'کیف سکه'],
  ['benefits', 'مزایای من'],
  ['league', 'لیگ نیمکت'],
  ['reports', 'فعالیت و گزارش'],
];

const periods = {
  all: 'یک‌بار / همیشگی',
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  special: 'مناسبتی',
};

const states = {
  active: 'فعال',
  progress: 'در حال پیشرفت',
  completed: 'تکمیل‌شده',
  expired: 'متوقف / منقضی',
};

const tagsFa = {
  punctual: 'وقت‌شناسی',
  mastery: 'تسلط',
  kind: 'خوش‌برخوردی',
  followup: 'پیگیری',
  patient: 'حوصله',
  value: 'کیفیت نسبت به هزینه',
  innovative: 'نوآوری',
  focus: 'تمرکز',
  polite: 'ادب',
  active: 'فعالیت',
  prepared: 'آمادگی',
  order: 'نظم',
};

const CROWN_TONES = ['bronze', 'silver', 'gold', 'plat', 'gold'];

const date = (t) => new Date(t).toLocaleDateString('fa-IR');

function Progress({ value, label }) {
  return (
    <div
      className="lc-progress progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <i style={{ width: `${value}%` }} />
    </div>
  );
}

function Empty({ children }) {
  return <p className="lc-empty">{children}</p>;
}

function DiscountReceipt({ voucher }) {
  const [notice, setNotice] = useState('');
  return (
    <div className="lc-voucher">
      <p>
        {faNum(voucher.percent)}٪ تخفیف تا سقف {faPrice(voucher.cap_toman)} تومان ·{' '}
        {{
          available: 'آماده مصرف',
          reserved: 'در انتظار پرداخت رزرو',
          consumed: 'مصرف‌شده',
          expired: 'منقضی‌شده',
        }[voucher.status]}
      </p>
      <label>
        کد تخفیف اختصاصی
        <input className="input" readOnly dir="ltr" value={voucher.code} />
      </label>
      <p>
        فقط در همین حساب و یک رزرو قابل استفاده است. مهلت:{' '}
        {voucher.expires_at ? date(voucher.expires_at) : 'بدون انقضای تعیین‌شده'}
      </p>
      <button
        className="btn btn-outline"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(voucher.code);
            setNotice('کد تخفیف کپی شد.');
          } catch {
            setNotice('کد را از کادر بالا انتخاب و کپی کنید.');
          }
        }}
      >
        کپی کد تخفیف
      </button>
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}

export default function Club({ content = {}, preview = false }) {
  const initial = useInitialEntity();
  const [referralCode, setReferralCode] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [howClubModalOpen, setHowClubModalOpen] = useState(false);
  const [confirmClaimReward, setConfirmClaimReward] = useState(null);

  useEffect(() => {
    if (!howClubModalOpen && !confirmClaimReward) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setHowClubModalOpen(false);
        setConfirmClaimReward(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [howClubModalOpen, confirmClaimReward]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('section') === 'notifications') setNotificationsOpen(true);
    if (query.get('section') === 'reports') setTab('reports');
    const code = query.get('ref');
    if (/^[A-Fa-f0-9]{16}$/.test(code || '')) {
      setReferralCode(code.toUpperCase());
      setTab('reports');
    }
  }, []);

  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const [catalog, setCatalog] = useState(initial?.club || null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sessions, setSessions] = useState([]);
  const [academic, setAcademic] = useState(null);
  const [league, setLeague] = useState(null);
  const [leaguePeriod, setLeaguePeriod] = useState('monthly');

  const claimKeys = useRef({});
  const spinKey = useRef(null);
  const owner = useRef(null);
  owner.current = user?.id;

  const reload = async () => {
    if (!user || preview) return;
    const uid = user.id;
    const [d, s, a] = await Promise.all([api('/club'), api('/club/sessions'), api('/club/academic')]);
    if (owner.current === uid) {
      setData({ ...d, owner: uid });
      setSessions(s.sessions);
      setAcademic({ ...a, tags: s.tags });
    }
  };

  useEffect(() => {
    let alive = true;
    setData(null);
    setError('');
    setSessions([]);
    setAcademic(null);
    setLeague(null);
    api(`/club/catalog?role=${user?.role === 'teacher' ? 'teacher' : 'student'}`)
      .then((r) => {
        if (alive) setCatalog(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    if (user && !preview) {
      reload().catch((e) => {
        if (alive) setError(e.message);
      });
    }
    return () => {
      alive = false;
    };
  }, [user?.id, preview]);

  useEffect(() => {
    if (!user || preview) return;
    let active = true;
    let timer;
    let stream;
    const refresh = () =>
      reload().catch((e) => {
        if (active) setError(e.message);
      });
    function connect() {
      stream = new EventSource('/api/events');
      stream.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data);
          if (event.type === 'club.changed') {
            clearTimeout(timer);
            timer = setTimeout(() => {
              if (active) refresh();
            }, 150);
          }
          if (event.type === 'session-expired') {
            stream.close();
            api('/auth/me')
              .then(() => {
                if (active) {
                  connect();
                  refresh();
                }
              })
              .catch(() => {
                if (active) setError('نشست منقضی شد؛ دوباره وارد شوید.');
              });
          }
        } catch {}
      };
    }
    connect();
    return () => {
      active = false;
      clearTimeout(timer);
      stream?.close();
    };
  }, [user?.id, preview]);

  const live = data?.owner === user?.id && !preview ? data : null;

  async function mutate(path, body, method = 'POST') {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await api(path, { method, body });
      await reload();
      setNotice(
        r.claim
          ? `${r.claim.title}؛ ${r.claim.status === 'fulfilled' ? 'ثبت و تحویل شد' : 'در صف تحویل کارشناس'}`
          : 'ثبت شد.'
      );
      return r;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function claim(r) {
    const key = (claimKeys.current[r.id] ??= crypto.randomUUID());
    if (await mutate(`/club/rewards/${r.id}/claim`, { idempotencyKey: key })) {
      delete claimKeys.current[r.id];
      setConfirmClaimReward(null);
    }
  }

  function rewardButtonLabel(r) {
    if (!live) return 'ورود برای دریافت جایزه';
    if (r.type === 'coming') return 'به‌زودی';
    if (!r.enabled) return 'در انتظار فعال‌سازی مدیر';
    if ((r.remaining ?? r.stock) <= 0) return 'اتمام موجودی';
    if (live.account.points < (r.minPoints || 0)) return `نیازمند ${faNum(r.minPoints)} امتیاز سطح`;
    if (live.account.coins < r.cost) return `کمبود ${faNum(r.cost - live.account.coins)} سکه`;
    if (!r.eligible) return 'سقف دریافت یا بودجه تکمیل است';
    return 'دریافت جایزه';
  }

  const levels = live?.levels || catalog?.levels || [];
  const missions = live?.missions || catalog?.missions || [];
  const rewards = live?.rewards || catalog?.rewards || [];
  const medals = live?.medals || catalog?.medals || [];
  const rules = live?.rules || catalog?.rules || [];

  const nextMission = live?.missions.find((m) => ['active', 'progress'].includes(m.status));
  const title =
    content.title && content.title !== '۵۸۰ سکه تا نیمکت طلایی'
      ? content.title
      : 'نیمکت کلاب؛ مسیر رشد تو';
  const intro =
    content.intro && !content.intro.startsWith('دو جلسه‌ی رایگان')
      ? content.intro
      : 'فعالیت آموزشی واقعی، قدم‌به‌قدم به رشد تبدیل می‌شود. سکه را برای جایزه خرج کن؛ امتیاز برای سطح تو باقی می‌ماند.';

  async function loadLeague(e) {
    e?.preventDefault();
    setError('');
    const f = e ? new FormData(e.currentTarget) : null;
    const params = new URLSearchParams({ period: leaguePeriod });
    for (const key of ['country', 'province', 'city']) {
      if (f?.get(key)) params.set(key, f.get(key));
    }
    try {
      setLeague(await api(`/club/league?${params}`));
    } catch (err) {
      setError(err.message);
    }
  }

  const history = (live?.history || []).filter(
    (h) =>
      (historyFilter === 'all' || (historyFilter === 'earn' ? h.coins > 0 : h.coins < 0)) &&
      (!from || h.created_at >= new Date(from).getTime()) &&
      (!to || h.created_at < new Date(to).getTime() + 86400000)
  );

  function exportHistory() {
    const cell = (v) =>
      typeof v === 'number'
        ? String(v)
        : `"${String(v).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const csv =
      '\uFEFF' +
      [
        ['تاریخ', 'علت', 'سکه', 'امتیاز', 'مانده'],
        ...history.map((h) => [date(h.created_at), h.reason, h.coins, h.points, h.balance_after]),
      ]
        .map((row) => row.map(cell).join(','))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nimkat-club-history.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const currentLevelIdx = levels.findIndex((l) => l.id === live?.level?.id);
  const activeMissionsCount = missions.filter((m) => ['active', 'progress'].includes(m.status)).length || missions.length;

  return (
    <section className="loyalty-club" dir="rtl">
      {/* ---------- Hero (.club-hero from global.css + .lc-hero) ---------- */}
      <header
        className="club-hero lc-hero"
        style={
          live?.customization
            ? {
                borderTop: `4px solid ${{ primary: '#0A6847', fresh: '#21A878', orange: '#F28A3D' }[live.customization.style]}`,
              }
            : undefined
        }
      >
        <div>
          <span className="eyebrow on-dark lc-eyebrow">
            {content.eyebrow === 'نیمکت کلاب · باشگاه شاگردان'
              ? 'نیمکت کلاب · باشگاه شاگردان'
              : content.eyebrow || 'نیمکت کلاب · باشگاه شاگردان'}
          </span>
          <h1 style={{ marginTop: 12 }}>{title}</h1>
          <p>{intro}</p>

          <div style={{ maxWidth: 520, marginTop: 16 }}>
            <div className="progress on-dark">
              <i style={{ width: `${live ? live.progress : 42}%` }} />
            </div>
            <div
              className="num"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                marginTop: 8,
                opacity: 0.9,
              }}
            >
              <span>{live ? `سطح فعلی: ${live.level.name}` : 'برنزی · ۰ امتیاز'}</span>
              <b>{live ? `${faNum(live.account.coins)} سکه · ${faNum(live.account.points)} امتیاز` : 'مسیر ۵ سطحی نیمکت'}</b>
              <span>{live?.next ? `${live.next.name} · ${faNum(live.next.minPoints)}` : 'سفیر نیمکت'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
            {live ? (
              <div className="lc-identity">
                <span className="lc-avatar">{user.name?.[0] || 'ن'}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span>
                    سطح {live.level.name} · {live.role === 'teacher' ? 'مسیر استاد' : 'مسیر یادگیرنده'}
                  </span>
                </div>
              </div>
            ) : (
              <Link className="btn btn-orange" to="/login?next=/panel/club">
                ورود و دیدن مسیر من <IconArrowLeft size={20} />
              </Link>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{
                background: 'rgba(255,255,255,.14)',
                color: '#fff',
                borderColor: 'rgba(255,255,255,.3)',
              }}
              onClick={() => setHowClubModalOpen(true)}
            >
              <IconInfo size={16} /> چطور انتخاب می‌کنیم و قوانین کلاب چیست؟
            </button>
          </div>
        </div>

        {/* Left column in RTL: 3 .club-mini-stat boxes matching NIMKAT CLUB.pdf */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="club-mini-stat">
            <span style={{ fontSize: 13.5, opacity: 0.9 }}>سکه‌های قابل مصرف</span>
            <b className="num" style={{ fontSize: 20, fontWeight: 900 }}>
              {live ? `+${faNum(live.account.coins)}` : faNum(0)}
            </b>
          </div>
          <div className="club-mini-stat">
            <span style={{ fontSize: 13.5, opacity: 0.9 }}>مأموریت‌های فعال</span>
            <b className="num" style={{ fontSize: 20, fontWeight: 900 }}>
              {faNum(activeMissionsCount)}
            </b>
          </div>
          <div className="club-mini-stat">
            <span style={{ fontSize: 13.5, opacity: 0.9 }}>امتیاز سطح (غیرقابل مصرف)</span>
            <b className="num" style={{ fontSize: 20, fontWeight: 900 }}>
              {live ? faNum(live.account.points) : faNum(0)}
            </b>
          </div>
        </div>
      </header>

      {error && (
        <div className="lc-alert" role="alert">
          {error}
          <button onClick={() => reload().catch((e) => setError(e.message))}>تلاش دوباره</button>
        </div>
      )}
      {notice && (
        <p className="lc-notice" role="status">
          {notice}
        </p>
      )}
      {!live && !preview && user && (
        <p role="status">{loading ? 'در حال بررسی حساب…' : 'در حال دریافت حساب کلاب…'}</p>
      )}

      {live && (
        <>
          <div className="lc-kpis">
            {[
              [IconCoins, 'سکهٔ قابل مصرف', live.account.coins],
              [IconStar, 'امتیاز غیرقابل مصرف', live.account.points],
              [IconCalendar, 'هفتهٔ استمرار', live.streak.weeks],
              [IconMedal, 'مدال کسب‌شده', live.medals.filter((m) => m.earned).length],
            ].map(([Icon, label, value]) => (
              <div className="lc-kpi" key={label}>
                <Icon size={24} />
                <strong>{faNum(value)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <details
            className="lc-notifications"
            open={notificationsOpen}
            onToggle={(ev) => setNotificationsOpen(ev.currentTarget.open)}
          >
            <summary>
              اعلان‌های کلاب · {faNum(live.notifications.filter((n) => !n.read_at).length)} خوانده‌نشده
            </summary>
            <button
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() => mutate('/club/notifications/read', {})}
            >
              خواندن همه
            </button>
            {live.notifications.length ? (
              live.notifications.map((n) => (
                <article key={n.id}>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <small>{date(n.created_at)}</small>
                </article>
              ))
            ) : (
              <Empty>هنوز اعلانی ندارید.</Empty>
            )}
          </details>
        </>
      )}

      <nav className="lc-tabs" aria-label="بخش‌های کلاب">
        {tabs.map(([key, label]) => (
          <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <div className="lc-two">
            <section className="lc-card">
              <span className="lc-eyebrow">الان کجا هستم؟</span>
              <h2>{live ? `سطح ${live.level.name}` : 'پنج سطح، یک مسیر روشن'}</h2>
              {live ? (
                <>
                  <p>
                    {live.next
                      ? `${faNum(live.toNext)} امتیاز تا ${live.next.name}`
                      : 'به سطح سفیر نیمکت رسیده‌اید.'}
                  </p>
                  <Progress value={live.progress} label="پیشرفت سطح" />
                  <div className="lc-between">
                    <span>{faNum(live.account.points)} امتیاز</span>
                    <span>{live.next ? faNum(live.next.minPoints) : 'سفیر'}</span>
                  </div>
                </>
              ) : (
                <p>سطح با امتیاز تعیین می‌شود، نه موجودی سکه. دریافت جایزه امتیاز را کم نمی‌کند.</p>
              )}
            </section>
            <section className="lc-card lc-next">
              <span className="lc-eyebrow">قدم بعدی من چیست؟</span>
              <h2>{nextMission?.title || 'یک شروع واقعی'}</h2>
              <p>
                {nextMission
                  ? `پیشرفت ${faNum(nextMission.progress)}٪ · ${faNum(nextMission.coins)} سکه + ${faNum(nextMission.points)} امتیاز`
                  : 'پروفایل یادگیری را تکمیل کن، کلاس مناسب را پیدا کن و بعد از حضور تأییدشده پاداش بگیر.'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setTab(nextMission ? 'missions' : 'reports')}
              >
                چطور برسم؟ <IconArrowLeft size={18} />
              </button>
            </section>
          </div>

          {/* ---------- سطح‌های باشگاه (.level-card & .level-crown matching NIMKAT CLUB.pdf) ---------- */}
          <section className="lc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2>{content.levelsTitle || 'سطح‌های باشگاه'}</h2>
              <span className="t-caption t-muted">
                سطح با امتیاز تعیین می‌شود، نه موجودی سکه. دریافت جایزه امتیاز را کم نمی‌کند.
              </span>
            </div>

            <div className="lc-levels">
              {levels.map((l, i) => {
                const isNow = live?.level?.id === l.id;
                const isGoal = live ? i === currentLevelIdx + 1 : i === 2;
                const isLocked = live ? i > currentLevelIdx + 1 : i > 2;
                const cardStateClass = isNow
                  ? 'current is-now'
                  : isGoal
                    ? 'is-goal'
                    : isLocked
                      ? 'is-locked'
                      : '';
                const crownTone = CROWN_TONES[i] || 'gold';
                return (
                  <article className={`level-card ${cardStateClass}`} key={l.id} style={{ textAlign: 'right', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`level-crown lc-level-icon level-${i} ${crownTone}`}>
                        <IconCrown size={26} />
                      </span>
                      <span
                        className={`chip ${
                          isNow
                            ? 'soft-green'
                            : isGoal
                              ? 'soft-orange'
                              : 'outline'
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {isNow
                          ? 'سطح فعلی'
                          : isGoal
                            ? 'هدف بعدی'
                            : live && i < currentLevelIdx
                              ? 'گذرانده‌اید'
                              : `${faNum(l.giftCoins)} سکه ارتقا`}
                      </span>
                    </div>
                    <h3 style={{ marginTop: 6 }}>{l.name}</h3>
                    <p className="num" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      {faNum(l.minPoints)}
                      {levels[i + 1] ? ` تا ${faNum(levels[i + 1].minPoints - 1)}` : '+'} امتیاز
                    </p>
                    {Array.isArray(l.benefits) && l.benefits.length > 0 && (
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {l.benefits.slice(0, 2).map((b) => (
                          <li
                            key={b}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--n700)' }}
                          >
                            <IconCheck size={14} style={{ color: 'var(--primary)', flex: 'none' }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="lc-chip coin-pill" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                      {isNow ? 'شما اینجا هستید' : `هدیه ارتقا: ${faNum(l.giftCoins)} سکه`}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ---------- مأموریت‌های فعال + راه‌های کسب سکه (matching NIMKAT CLUB.pdf) ---------- */}
          <div className="lc-two">
            <section className="lc-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ marginBottom: 0 }}>{content.missionsTitle || 'مأموریت‌های فعال'}</h2>
                <button
                  type="button"
                  style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}
                  onClick={() => setTab('missions')}
                >
                  همهٔ مأموریت‌ها ←
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {missions.slice(0, 4).map((m) => {
                  const isDone = m.status === 'completed';
                  return (
                    <div key={m.id} className={`mission-card ${isDone ? 'is-done' : ''}`}>
                      <span className="ic">
                        {isDone ? <IconCheck size={20} /> : <IconTarget size={20} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <b style={{ fontSize: 14 }}>{m.title}</b>
                          <span className={`coin-pill ${isDone ? 'green' : ''}`}>
                            <IconCoins size={13} /> {faNum(m.coins)}
                          </span>
                        </div>
                        <div className="progress green" style={{ marginTop: 8 }}>
                          <i style={{ width: `${m.progress || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="lc-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ marginBottom: 0 }}>{content.earnTitle || 'راه‌های کسب سکه'}</h2>
                <button
                  type="button"
                  style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}
                  onClick={() => setTab('missions')}
                >
                  قوانین کامل ({faNum(rules.length)})
                </button>
              </div>
              <div>
                <div
                  className="earn-row"
                  style={{ background: 'var(--n50)', padding: '10px 12px', borderRadius: 'var(--r-sm)', fontWeight: 800, fontSize: 12, color: 'var(--muted)' }}
                >
                  <span>فعالیت</span>
                  <span>سکه</span>
                </div>
                {rules.slice(0, 7).map((r) => (
                  <div className="earn-row" key={r.id}>
                    <span>{r.title}</span>
                    <b className="num" style={{ color: 'var(--accent-800)' }}>
                      +{faNum(r.coins)}
                    </b>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ---------- جوایز قابل دریافت preview (matching NIMKAT CLUB.pdf) ---------- */}
          <section className="lc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ marginBottom: 0 }}>{content.rewardsTitle || 'جوایز قابل دریافت'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="t-caption t-muted num">
                  موجودی شما: <b style={{ color: 'var(--ink)' }}>{faNum(live?.account?.coins || 0)} سکه</b>
                </span>
                <button
                  type="button"
                  style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}
                  onClick={() => setTab('rewards')}
                >
                  مشاهده همه ({faNum(rewards.length)}) ←
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {rewards.slice(0, 4).map((r, idx) => {
                const IconComp = idx % 3 === 0 ? IconGift : idx % 3 === 1 ? IconWallet : IconHeadset;
                return (
                  <div key={r.id} className="reward-card">
                    <span className="ic">
                      <IconComp size={24} />
                    </span>
                    <b style={{ fontSize: 15 }}>{faNum(r.title)}</b>
                    <span className="t-caption t-muted">{faNum(r.description)}</span>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 'auto',
                        paddingTop: 8,
                      }}
                    >
                      <span className="coin-pill num">
                        <IconCoins size={13} /> {faNum(r.cost)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-soft-green btn-sm"
                        onClick={() => setTab('rewards')}
                      >
                        {live && r.eligible ? 'دریافت' : 'مشاهده'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------- زنجیره فعالیت و شانس طلایی ---------- */}
          <div className="lc-two">
            <section className="lc-card">
              <h2>زنجیرهٔ فعالیت</h2>
              <p>
                {live
                  ? `${faNum(live.streak.days)} روز و ${faNum(live.streak.weeks)} هفتهٔ متوالی در مسیر یادگیری`
                  : 'فعالیت معتبر در کلاس، نظرسنجی و نیم‌چت زنجیره را می‌سازد؛ ورود خالی پاداش ندارد.'}
              </p>
              {live && (
                <div className="lc-heatmap" aria-label="فعالیت ۲۸ روز اخیر">
                  {Array.from({ length: 28 }, (_, i) => {
                    const d = Date.now() - (27 - i) * 86400000;
                    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(d);
                    const active = live.streak.calendar.includes(key);
                    return (
                      <span
                        key={i}
                        className={active ? 'active' : ''}
                        title={`${date(d)} · ${active ? 'فعالیت معتبر' : 'بدون فعالیت'}`}
                        aria-label={`${date(d)} ${active ? 'فعال' : 'بدون فعالیت'}`}
                      />
                    );
                  })}
                </div>
              )}
              <small>هفته از شنبه و دورهٔ ماهانه بر مبنای تقویم شمسی و ساعت تهران است.</small>
            </section>

            <section className="lc-card lc-spin">
              <div className="lc-wheel" aria-hidden="true">
                <IconGift size={40} />
              </div>
              <h2>شانس طلایی نیمکت</h2>
              <p>{faNum(live?.spin.requirement || 'فرصتی ماهانه برای اعضای واجد شرایط؛ مکمل فروشگاه، نه جایگزین آن.')}</p>
              <button
                className="btn btn-orange"
                disabled={!live?.spin.eligible || busy}
                onClick={() =>
                  mutate('/club/spin', { idempotencyKey: (spinKey.current ??= crypto.randomUUID()) })
                }
              >
                امتحان شانس ماهانه
              </button>
              <small>
                {live?.spin.eligible
                  ? 'جایزه از موجودی فروشگاه و به‌صورت تصادفی سمت سرور انتخاب می‌شود.'
                  : 'هنوز واجد شرایط نیستید، این ماه استفاده شده یا گردونه/جوایز فعال نیست.'}
              </small>
            </section>
          </div>

          {live && (
            <section className="lc-card">
              <h2>آخرین دستاورد</h2>
              {live.medals.some((m) => m.earned) ? (
                <p>
                  {[...live.medals]
                    .filter((m) => m.earned)
                    .sort((a, b) => b.earned.created_at - a.earned.created_at)[0].title}
                </p>
              ) : (
                <Empty>هنوز مدالی کسب نشده؛ شرایط را در افتخارات ببین.</Empty>
              )}
            </section>
          )}
        </>
      )}

      {tab === 'missions' && (
        <section className="lc-card">
          <h2>{content.missionsTitle || 'مأموریت‌ها'}</h2>
          <div className="lc-filters">
            {[
              ['all', 'همه'],
              ['daily', 'روزانه'],
              ['weekly', 'هفتگی'],
              ['monthly', 'ماهانه'],
              ['special', 'مناسبتی'],
            ].map(([key, label]) => (
              <button aria-pressed={filter === key} key={key} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className="lc-grid">
            {missions
              .filter((m) => filter === 'all' || m.period === filter)
              .map((m) => (
                <article className="lc-mission" key={m.id}>
                  <IconTarget size={24} />
                  <span className="lc-chip">{live ? states[m.status] : periods[m.period]}</span>
                  <h3>{m.title}</h3>
                  {m.requirements.map((r) => (
                    <p key={r.event}>
                      {clubEventLabel(r.event)} · {faNum(r.done || 0)} از {faNum(r.target)}
                    </p>
                  ))}
                  <Progress value={m.progress || 0} label={m.title} />
                  <b>
                    {faNum(m.coins)} سکه + {faNum(m.points)} امتیاز
                  </b>
                  {m.endsAt && <small>تا {date(m.endsAt)}</small>}
                </article>
              ))}
          </div>
          {!missions.filter((m) => filter === 'all' || m.period === filter).length && (
            <Empty>در این دوره مأموریتی تعریف نشده است.</Empty>
          )}
          <h3 className="lc-subtitle">{content.earnTitle || 'قواعد کسب سکه و امتیاز'}</h3>
          <div className="table-scroll">
            <table className="lc-table table">
              <thead>
                <tr>
                  <th>فعالیت</th>
                  <th>سکه</th>
                  <th>امتیاز</th>
                  <th>سقف / دوره</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.title}
                      {r.every > 1 && ` · هر ${faNum(r.every)} رویداد`}
                    </td>
                    <td>{faNum(r.coins)}</td>
                    <td>{faNum(r.points)}</td>
                    <td>
                      {r.cap ? faNum(r.cap) : 'بدون سقف شمارشی'} · {periods[r.period]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'rewards' && (
        <>
          {live?.customization && (
            <section className="lc-card">
              <h2>ظاهر پروفایل کلاب فعال است</h2>
              <p>
                رنگ قاب پروفایل تا {date(live.customization.expires_at)} فعال است؛ این تنظیم فقط ظاهر کلاب خود شما را تغییر می‌دهد.
              </p>
            </section>
          )}
          {live?.commissionEntitlements?.length > 0 && (
            <section className="lc-card">
              <h2>معافیت‌های کمیسیون من</h2>
              {live.commissionEntitlements.map((e) => (
                <p key={e.claim_id}>
                  مانده: {faPrice(e.remaining_toman)} تومان · {faNum(e.remaining_sessions)} جلسه ·{' '}
                  {faNum(e.percent)}٪ · {e.expires_at ? date(e.expires_at) : 'بدون تاریخ انقضای تعیین‌شده'}
                </p>
              ))}
            </section>
          )}
          <section className="lc-card">
            <h2>{content.rewardsTitle || 'فروشگاه سکه'}</h2>
            <p>موجودی واقعی و بودجه پیش از دریافت بررسی می‌شود. امتیاز سطح شما مصرف نمی‌شود.</p>
            <div className="lc-grid">
              {rewards.map((r) => (
                <article className="lc-reward reward-card" data-reward-id={r.id} key={r.id}>
                  <img src={r.image} alt="" width="360" height="190" loading="lazy" />
                  <div>
                    <span className="lc-chip">
                      {r.type === 'coming' ? 'به‌زودی' : r.enabled ? 'فعال' : 'در انتظار فعال‌سازی'}
                    </span>
                    <h3>{faNum(r.title)}</h3>
                    <p>{faNum(r.description)}</p>
                    {r.type === 'discount' && (
                      <p>
                        {faNum(r.percent)}٪ تا سقف {faPrice(r.valueToman)} تومان؛ فقط همین حساب و یک رزرو. انقضای کد، سکه را خودکار برنمی‌گرداند.
                      </p>
                    )}
                    <strong className="coin-pill">{faNum(r.cost)} سکه</strong>
                    <small>
                      سقف دریافت هر عضو: {faNum(r.perUserLimit || 1)} · موجودی: {faNum(r.remaining ?? r.stock)} · امتیاز لازم: {faNum(r.minPoints)}
                    </small>
                    <small>{r.conditions}</small>
                    <small>انقضا: {r.expiresAt ? date(r.expiresAt) : 'بدون تاریخ تعیین‌شده'}</small>
                    {live && r.cost > live.account.coins && (
                      <small>فاصله تا جایزه: {faNum(r.cost - live.account.coins)} سکه</small>
                    )}
                    <button
                      className="btn btn-primary btn-block"
                      disabled={!live || !r.eligible || busy}
                      onClick={() => claim(r)}
                    >
                      {rewardButtonLabel(r)}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          {live && (
            <section className="lc-card">
              <h2>دریافت‌های من</h2>
              {live.claims.length ? (
                live.claims.map((c) => (
                  <article className="lc-receipt" key={c.id}>
                    <div>
                      <b>{faNum(c.title)}</b>
                      <p>
                        {date(c.created_at)} · {faNum(c.cost)} سکه
                      </p>
                    </div>
                    <span className="lc-chip">{c.status === 'fulfilled' ? 'تحویل‌شده' : 'در صف تحویل'}</span>
                    {c.voucher && <DiscountReceipt voucher={c.voucher} />}
                  </article>
                ))
              ) : (
                <Empty>هنوز جایزه‌ای دریافت نکرده‌اید.</Empty>
              )}
            </section>
          )}
        </>
      )}

      {tab === 'medals' && (
        <section className="lc-card">
          <h2>{content.medalsTitle || 'مدال‌ها و افتخارات'}</h2>
          <div className="lc-medals">
            {medals.map((m) => (
              <article key={m.id} className={`medal ${m.earned ? 'earned' : ''}`} style={{ width: 'auto' }}>
                <span className={`m-ic ${m.earned ? 'green' : 'off'}`}>
                  {m.earned ? <IconMedal size={30} /> : <IconLock size={24} />}
                </span>
                <h3>{m.title}</h3>
                <small>
                  {faNum(m.target)} {clubEventLabel(m.event)} · {periods[m.period || 'all']}
                  {m.minAverage ? ` · میانگین حداقل ${faNum(m.minAverage)}` : ''}
                </small>
                <p>{m.earned ? `کسب‌شده در ${date(m.earned.created_at)}` : 'در دسترس برای کسب'}</p>
                {m.earned && <small>{faNum(m.earned.reason)}</small>}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="lc-card">
          <h2>{content.historyTitle || 'کیف سکه و تاریخچه'}</h2>
          {live ? (
            <>
              <p>
                موجودی {faNum(live.account.coins)} سکه · امتیاز {faNum(live.account.points)} (غیرقابل مصرف)
              </p>
              <div className="lc-filters">
                <select
                  aria-label="نوع تراکنش"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                >
                  <option value="all">همه</option>
                  <option value="earn">دریافت</option>
                  <option value="spend">مصرف</option>
                </select>
                <label>
                  از تاریخ
                  <input
                    aria-label="از تاریخ"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </label>
                <label>
                  تا تاریخ
                  <input
                    aria-label="تا تاریخ"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
                <button className="btn btn-outline" onClick={exportHistory}>
                  خروجی CSV
                </button>
              </div>
              <div className="table-scroll">
                <table className="lc-table table">
                  <thead>
                    <tr>
                      <th>تاریخ</th>
                      <th>علت</th>
                      <th>سکه</th>
                      <th>امتیاز</th>
                      <th>موجودی پس از</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td>{date(h.created_at)}</td>
                        <td>{h.reason}</td>
                        <td>{faNum(h.coins)}</td>
                        <td>{faNum(h.points)}</td>
                        <td>{faNum(h.balance_after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!history.length && <Empty>تراکنشی در این بازه وجود ندارد.</Empty>}
              <small>۲۰۰ تراکنش اخیر؛ برای سوابق قدیمی‌تر با پشتیبانی تماس بگیرید.</small>
            </>
          ) : (
            <Empty>برای دیدن کیف شخصی وارد شوید. موجودی نمایشی به‌جای حساب واقعی نشان داده نمی‌شود.</Empty>
          )}
        </section>
      )}

      {tab === 'benefits' && (
        <section className="lc-card">
          <h2>مزایای من</h2>
          {live ? (
            <>
              <h3>شرایط سطح {live.level.name}</h3>
              <ul className="lc-benefits">
                {live.level.benefits.map((b) => (
                  <li key={b}>
                    <IconCheck size={20} />
                    {b}
                  </li>
                ))}
              </ul>
              <p>
                هدیهٔ سکهٔ ارتقا خودکار در کیف ثبت می‌شود. مزایای خدماتی این فهرست، شرایط سطح‌اند؛ تخفیف، دعوت رویداد و خدمت اختصاصی تا اتصال سرویس مربوط، خودکار فعال فرض نمی‌شوند.
              </p>
              <Link className="btn btn-outline" to="/blog">
                راهنماهای رایگان یادگیری
              </Link>
            </>
          ) : (
            <Empty>برای دیدن مزایای سطح خود وارد شوید.</Empty>
          )}
        </section>
      )}

      {tab === 'league' && (
        <section className="lc-card">
          <h2>لیگ نیمکت</h2>
          <p>
            شرکت اختیاری است. فقط نام نمایشیِ اعضای دارای رضایت و امتیاز فعالیت نمایش داده می‌شود؛ اطلاعات منفی یا شماره تماس منتشر نمی‌شود.
          </p>
          {live ? (
            <>
              <form className="lc-filters" onSubmit={loadLeague}>
                <select
                  aria-label="بازه لیگ"
                  value={leaguePeriod}
                  onChange={(e) => setLeaguePeriod(e.target.value)}
                >
                  {[
                    ['weekly', 'هفته'],
                    ['monthly', 'ماه'],
                    ['yearly', 'سال'],
                    ['all', 'کل'],
                  ].map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
                <input className="input" name="country" placeholder="کد کشور؛ مثلاً IR" aria-label="کشور لیگ" />
                <input className="input" name="province" placeholder="استان" aria-label="استان لیگ" />
                <input className="input" name="city" placeholder="شهر" aria-label="شهر لیگ" />
                <button className="btn btn-primary">نمایش لیگ</button>
              </form>
              {!live.account.league_opt_in && (
                <p>هنوز به لیگ نپیوسته‌اید؛ رضایت را در تب فعالیت و گزارش ثبت کنید.</p>
              )}
              {league &&
                (league.enabled ? (
                  <>
                    <p>
                      {league.current
                        ? `رتبهٔ شما ${faNum(league.current.rank)} · ${faNum(league.current.toNext)} امتیاز تا رتبهٔ بعد`
                        : 'در این فیلتر رتبه‌ای ندارید.'}
                    </p>
                    <ol className="lc-ranking">
                      {league.rows.map((r) => (
                        <li key={r.rank} className={r.isMe ? 'me' : ''}>
                          <b>{faNum(r.rank)}</b>
                          <span>{r.alias}</span>
                          <strong>{faNum(r.points)} امتیاز</strong>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <Empty>لیگ فعلاً از مدیریت غیرفعال است؛ زیرساخت رتبه‌بندی آماده است.</Empty>
                ))}
            </>
          ) : (
            <Empty>برای مشاهدهٔ لیگ و انتخاب حریم خصوصی وارد شوید.</Empty>
          )}
        </section>
      )}

      {tab === 'reports' && (
        <>
          {live ? (
            <>
              <section className="lc-card">
                <h2>پروفایل مسیر یادگیری</h2>
                {live.role === 'teacher' && (
                  <p>
                    این فرم، پروندهٔ حرفه‌ای استاد نیست و پاداش تکمیل پرونده را خودکار نمی‌دهد. پاداش آن پس از بررسی مستند مدیر ثبت می‌شود.
                  </p>
                )}
                <form
                  className="lc-form"
                  key={JSON.stringify(live.account.profile)}
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const f = new FormData(ev.currentTarget);
                    mutate(
                      '/club/profile',
                      {
                        alias: f.get('alias'),
                        city: f.get('city'),
                        province: f.get('province'),
                        goal: f.get('goal'),
                        country: f.get('country'),
                        leagueOptIn: f.get('leagueOptIn') === 'on',
                      },
                      'PUT'
                    );
                  }}
                >
                  {[
                    ['alias', 'نام نمایشی', 60],
                    ['country', 'کد کشور (IR)', 2],
                    ['province', 'استان', 80],
                    ['city', 'شهر', 80],
                    ['goal', 'هدف یادگیری (حداقل ۱۰ نویسه)', 500],
                  ].map(([key, label, max]) => (
                    <label key={key}>
                      {label}
                      <input
                        className="input"
                        name={key}
                        maxLength={max}
                        minLength={key === 'goal' ? 10 : 2}
                        required
                        defaultValue={live.account.profile[key] || (key === 'country' ? 'IR' : '')}
                      />
                    </label>
                  ))}
                  <label className="lc-consent">
                    <input
                      type="checkbox"
                      name="leagueOptIn"
                      defaultChecked={!!live.account.league_opt_in}
                    />
                    با نمایش نام مستعار و امتیازم در لیگ اختیاری موافقم.
                  </label>
                  <button className="btn btn-primary" disabled={busy}>
                    ذخیره پروفایل
                  </button>
                </form>
              </section>

              <section className="lc-card">
                <h2>دعوت دوستان</h2>
                <p>
                  کد شما: <b dir="ltr">{live.account.referral_code}</b>
                </p>
                <button
                  className="btn btn-outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${location.origin}/login?ref=${live.account.referral_code}`
                      );
                      setNotice('لینک دعوت کپی شد.');
                    } catch {
                      setNotice('کد دعوت را از متن بالا کپی کنید.');
                    }
                  }}
                >
                  کپی لینک دعوت
                </button>
                <p>
                  معرف در {faNum(live.referralWindowHours || 24)} ساعت اول ثبت‌نام قابل ثبت است. پاداش کلاس دوست فقط پس از حضور تأییدشده صادر می‌شود.
                </p>
                <form
                  className="lc-inline-form"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    mutate('/club/referrals/accept', { code: new FormData(ev.currentTarget).get('code') });
                  }}
                >
                  <input
                    className="input"
                    name="code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    aria-label="کد معرف"
                    placeholder="کد معرف شما"
                    required
                    maxLength={16}
                  />
                  <button className="btn btn-outline" disabled={busy}>
                    ثبت معرف
                  </button>
                </form>
              </section>

              <section className="lc-card">
                <h2>نظرسنجی دوسویهٔ معتبر</h2>
                <p>
                  فقط جلسه‌ای که برگزاری و حضورش تأیید شده قابل ارزیابی است. شاخص منفی فقط برای مدیر ذخیره می‌شود.
                </p>
                {sessions.length ? (
                  <SurveyForm
                    sessions={sessions}
                    teacher={live.role === 'teacher'}
                    tags={academic?.tags || []}
                    onSubmit={mutate}
                    busy={busy}
                  />
                ) : (
                  <Empty>جلسهٔ تأییدشده‌ای برای نظرسنجی ندارید.</Empty>
                )}
              </section>

              {live.role === 'teacher' ? (
                <section className="lc-card">
                  <h2>ثبت گزارش هشت‌شاخصی شاگرد</h2>
                  {sessions.length ? (
                    <AcademicForm
                      sessions={sessions}
                      indicators={academic?.indicators || []}
                      onSubmit={mutate}
                      busy={busy}
                    />
                  ) : (
                    <Empty>ابتدا جلسه و حضور شاگرد باید تأیید شود.</Empty>
                  )}
                </section>
              ) : (
                <section className="lc-card">
                  <h2>گزارش تحصیلی من</h2>
                  {academic?.reports.length ? (
                    <>
                      <svg
                        className="lc-chart"
                        viewBox="0 0 640 180"
                        role="img"
                        aria-label="روند میانگین هشت شاخص تحصیلی"
                      >
                        <path d="M20 10v150h600" fill="none" stroke="var(--n200)" strokeWidth="2" />
                        <polyline
                          points={academic.reports
                            .slice(0, 12)
                            .reverse()
                            .map((r, i, a) => `${20 + (i * 600) / Math.max(1, a.length - 1)},${160 - r.average * 1.4}`)
                            .join(' ')}
                          fill="none"
                          stroke="var(--primary)"
                          strokeWidth="3"
                        />
                        {academic.reports
                          .slice(0, 12)
                          .reverse()
                          .map((r, i, a) => (
                            <circle
                              key={r.occurrence_id}
                              cx={20 + (i * 600) / Math.max(1, a.length - 1)}
                              cy={160 - r.average * 1.4}
                              r="5"
                              fill="var(--accent)"
                            />
                          ))}
                      </svg>
                      <div className="table-scroll">
                        <table className="lc-table table">
                          <thead>
                            <tr>
                              <th>تاریخ</th>
                              {academic.indicators.map((i) => (
                                <th key={i}>{i}</th>
                              ))}
                              <th>میانگین</th>
                            </tr>
                          </thead>
                          <tbody>
                            {academic.reports.map((r) => (
                              <tr key={r.occurrence_id}>
                                <td>{date(r.created_at)}</td>
                                {r.scores.map((v, i) => (
                                  <td key={i}>{faNum(v)}</td>
                                ))}
                                <td>{faNum(r.average)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <Empty>هنوز گزارشی از مدرس ثبت نشده است؛ نمودار ساختگی نمایش داده نمی‌شود.</Empty>
                  )}
                </section>
              )}
            </>
          ) : (
            <section className="lc-card">
              <Empty>برای ثبت فعالیت معتبر، نظرسنجی و مشاهدهٔ گزارش شخصی وارد شوید.</Empty>
            </section>
          )}
        </>
      )}

      {user?.role === 'admin' && (
        <Link className="btn btn-outline" to="/admin/club">
          مدیریت نیمکت کلاب
        </Link>
      )}

      {howClubModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="club-how-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHowClubModalOpen(false);
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
          <div className="card" style={{ maxWidth: 580, width: '100%', padding: 28, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="club-how-modal-title" className="t-h3">
                چطور انتخاب می‌کنیم و قوانین نیمکت کلاب چیست؟
              </h2>
              <button
                type="button"
                className="btn-icon-round"
                aria-label="بستن"
                onClick={() => setHowClubModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <ul className="check-list" style={{ marginTop: 14 }}>
              <li>
                <IconCheck size={18} /> <b>تفکیک سکه و امتیاز سطح:</b> سکه برای دریافت جوایز از فروشگاه مصرف می‌شود، اما امتیاز سطح (در ۵ سطح برنزی، نقره‌ای، طلایی، پلاتینیوم و سفیر نیمکت) هرگز با خرج کردن سکه کاهش نمی‌یابد.
              </li>
              <li>
                <IconCheck size={18} /> <b>۱۹ قاعدهٔ کسب سکه و امتیاز:</b> تمام پاداش‌ها فقط بر اساس فعالیت‌های واقعی تأییدشده (تکمیل پروفایل، حضور تأییدشده در کلاس، نظرسنجی پایان جلسه، پیشرفت تحصیلی ماهانه و مشارکت مفید در نیم‌چت) صادر می‌شوند.
              </li>
              <li>
                <IconCheck size={18} /> <b>۱۳ جایزهٔ متنوع شاگردان:</b> شامل کدهای تخفیف اختصاصی ۵٪ تا ۵۰٪، شارژ کیف پول ۱۰۰ تا ۳۰۰ هزار تومان و جوایز ویژه با بررسی موجودی، سقف فردی و بودجهٔ کلاب.
              </li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={() => setHowClubModalOpen(false)}>
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClaimReward && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="club-claim-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmClaimReward(null);
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
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 26, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="club-claim-modal-title" className="t-h3">
                تأیید دریافت جایزه
              </h2>
              <button
                type="button"
                className="btn-icon-round"
                aria-label="بستن"
                onClick={() => setConfirmClaimReward(null)}
              >
                <IconX size={18} />
              </button>
            </div>
            <p className="t-small" style={{ marginTop: 12, lineHeight: 2 }}>
              آیا مایل به دریافت <b>«{faNum(confirmClaimReward.title)}»</b> با کسر{' '}
              <b>{faNum(confirmClaimReward.cost)} سکه</b> هستید؟ امتیاز سطح شما کم نمی‌شود.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" className="btn btn-outline" onClick={() => setConfirmClaimReward(null)}>
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => claim(confirmClaimReward)}
              >
                {busy ? 'در حال ثبت…' : 'تأیید و دریافت جایزه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SurveyForm({ sessions, teacher, tags, onSubmit, busy }) {
  const [selected, setSelected] = useState(String(sessions[0].occurrence_id));
  const session = sessions.find((s) => String(s.occurrence_id) === selected) || sessions[0];
  return (
    <form
      className="lc-form"
      onSubmit={(ev) => {
        ev.preventDefault();
        const f = new FormData(ev.currentTarget);
        onSubmit('/club/surveys', {
          occurrenceId: Number(selected),
          toUserId: teacher ? Number(f.get('toUserId')) : session.teacher_uid,
          stars: Number(f.get('stars')),
          positive: f.getAll('positive'),
          negative: f.getAll('negative'),
        });
      }}
    >
      <label>
        جلسه
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {sessions.map((s) => (
            <option key={s.occurrence_id} value={s.occurrence_id}>
              {s.title} · {date(s.ends_at)}
            </option>
          ))}
        </select>
      </label>
      {teacher && (
        <label>
          شاگرد
          <select name="toUserId" className="input">
            {session.present.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        امتیاز
        <select className="input" name="stars">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {faNum(n)} ستاره
            </option>
          ))}
        </select>
      </label>
      {['positive', 'negative'].map((key) => (
        <fieldset key={key}>
          <legend>{key === 'positive' ? 'شاخص مثبت' : 'نیازمند بهبود (فقط مدیر)'}</legend>
          {tags.map((t) => (
            <label className="lc-consent" key={t}>
              <input type="checkbox" name={key} value={t} />
              {tagsFa[t] || t}
            </label>
          ))}
        </fieldset>
      ))}
      <button className="btn btn-primary" disabled={busy}>
        ثبت نظرسنجی
      </button>
    </form>
  );
}

function AcademicForm({ sessions, indicators, onSubmit, busy }) {
  const [selected, setSelected] = useState(String(sessions[0].occurrence_id));
  const session = sessions.find((s) => String(s.occurrence_id) === selected) || sessions[0];
  return (
    <form
      className="lc-form"
      onSubmit={(ev) => {
        ev.preventDefault();
        const f = new FormData(ev.currentTarget);
        onSubmit('/club/academic', {
          occurrenceId: Number(selected),
          studentId: Number(f.get('studentId')),
          scores: indicators.map((_, i) => Number(f.get(`score${i}`))),
        });
      }}
    >
      <label>
        جلسه
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {sessions.map((s) => (
            <option key={s.occurrence_id} value={s.occurrence_id}>
              {s.title} · {date(s.ends_at)}
            </option>
          ))}
        </select>
      </label>
      <label>
        شاگرد
        <select name="studentId" className="input">
          {session.present.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {indicators.map((t, i) => (
        <label key={i}>
          {t}
          <input
            name={`score${i}`}
            type="number"
            className="input"
            required
            min="0"
            max="100"
            defaultValue="0"
          />
        </label>
      ))}
      <button className="btn btn-primary" disabled={busy}>
        ثبت گزارش تحصیلی
      </button>
    </form>
  );
}
