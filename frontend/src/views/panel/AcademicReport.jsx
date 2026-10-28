'use client';
import { useState, useEffect, useMemo } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import {
  IconChart,
  IconArrowLeft,
  IconCheck,
  IconMedal,
  IconStar,
  IconSparkle,
  IconCalendar,
  IconBook,
  IconClock,
} from '../../components/icons.jsx';
import { DsKpiCard } from '../../components/ui/design-system.jsx';

const formatDateFa = (t) => new Date(t).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });

const INDICATOR_META = {
  'آمادگی': {
    desc: 'مطالعه پیش‌نیاز و آمادگی علمی پیش از شروع جلسه',
    tone: 'green',
  },
  'وقت‌شناسی': {
    desc: 'حضور به‌موقع در کلاس و رعایت زمان‌بندی جلسه',
    tone: 'orange',
  },
  'تعامل': {
    desc: 'مشارکت فعال در پرسش‌وپاسخ و گفتگوهای کلاسی',
    tone: 'green',
  },
  'تمرکز': {
    desc: 'دقت، توجه مستمر و همراهی کامل در طول تدریس',
    tone: 'green',
  },
  'تکلیف': {
    desc: 'انجام دقیق و تحویل به‌موقع تمرین‌ها و تکالیف',
    tone: 'orange',
  },
  'درک مفاهیم': {
    desc: 'تسلط عمیق بر مفاهیم پایه و ارتباط بین مباحث',
    tone: 'green',
  },
  'حل مسئله': {
    desc: 'توانایی تحلیل سؤالات چالشی و کاربرد فرمول‌ها',
    tone: 'orange',
  },
  'استمرار': {
    desc: 'پیوستگی در تمرین هفتگی و حفظ روند رو‌به‌رشد',
    tone: 'green',
  },
};

export default function AcademicReport() {
  const [academic, setAcademic] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState('میانگین کل');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api('/club/academic'), api('/club/sessions')])
      .then(([a, s]) => {
        if (alive) {
          setAcademic(a);
          setSessions(s?.sessions || []);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message || 'خطا در دریافت گزارش تحصیلی');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const indicators = academic?.indicators || [
    'آمادگی',
    'وقت‌شناسی',
    'تعامل',
    'تمرکز',
    'تکلیف',
    'درک مفاهیم',
    'حل مسئله',
    'استمرار',
  ];
  const reports = academic?.reports || [];
  const indicatorIndex = indicators.indexOf(selectedIndicator);

  const overallAverage = useMemo(() => {
    if (!reports.length) return null;
    const sum = reports.reduce((acc, r) => acc + (Number(r.average) || 0), 0);
    return Math.round((sum / reports.length) * 10) / 10;
  }, [reports]);

  const indicatorAverages = useMemo(() => {
    const map = {};
    indicators.forEach((ind, idx) => {
      if (!reports.length) {
        map[ind] = null;
        return;
      }
      const valid = reports
        .map((r) => (Array.isArray(r.scores) ? Number(r.scores[idx]) : NaN))
        .filter((n) => Number.isFinite(n));
      map[ind] = valid.length
        ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
        : null;
    });
    return map;
  }, [indicators, reports]);

  if (loading) {
    return (
      <div className="p-card" role="status" style={{ padding: 36, textAlign: 'center' }}>
        در حال بارگذاری گزارش تحصیلی…
      </div>
    );
  }

  return (
    <div className="nk-reports-page">
      {/* 1. Hero Header Banner */}
      <section className="nk-reports-hero">
        <div className="nk-reports-hero__main">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span className="nk-reports-hero__badge">
                <IconChart size={14} /> کارنامه و تحلیل عملکرد
              </span>
              <span className="nk-reports-hero__badge nk-reports-hero__badge--amber">
                <IconSparkle size={13} /> ۸ شاخص استاندارد نیمکت
              </span>
            </div>
            <h1 className="t-h1" style={{ color: '#fff', margin: 0 }}>
              گزارش تحصیلی هشت‌شاخصی
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.86)', fontSize: 13.5, marginTop: 8, maxWidth: 640, lineHeight: 1.9 }}>
              این گزارش‌ها پس از برگزاری و تأیید حضور هر جلسه توسط استاد ثبت می‌شوند و مبنای واقعی سنجش پیشرفت ماهانه در نیمکت هستند.
            </p>
          </div>

          <div className="nk-reports-hero__actions">
            <div className="nk-reports-hero__score-pill">
              <span>میانگین کل کارنامه</span>
              <strong className="num">
                {overallAverage !== null ? `${faNum(overallAverage)} از ۱۰۰` : 'در انتظار ثبت استاد'}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to="/panel"
                className="btn btn-outline btn-sm"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}
              >
                بازگشت به پنل <IconArrowLeft size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--error-50)',
            color: 'var(--error)',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* 2. KPI Summary Row */}
      <div className="nk-ds-kpi-grid">
        <DsKpiCard
          label="میانگین کل شاخص‌ها"
          value={overallAverage !== null ? `${faNum(overallAverage)} / ۱۰۰` : 'ثبت نشده'}
          sub={reports.length ? `بر اساس ${faNum(reports.length)} جلسه ارزیابی‌شده` : 'پس از اولین ثبت استاد فعال می‌شود'}
          tone="primary"
          icon={<IconChart size={22} />}
        />
        <DsKpiCard
          label="جلسات ارزیابی‌شده"
          value={`${faNum(reports.length)} جلسه`}
          sub="گزارش‌های رسمی ثبت‌شده توسط استاد"
          tone="neutral"
          icon={<IconBook size={22} />}
        />
        <DsKpiCard
          label="آماده ثبت نظرسنجی"
          value={`${faNum(sessions.length)} جلسه`}
          sub="ثبت نظر و دریافت سکه باشگاه مشتریان"
          tone="accent"
          icon={<IconStar size={22} />}
        />
        <DsKpiCard
          label="پاداش رشد ماهانه"
          value={`+${faNum(50)} سکه`}
          sub="و ۳۰۰ امتیاز برای حداقل ۱۰٪ رشد ماهانه"
          tone="primary"
          icon={<IconMedal size={22} />}
        />
      </div>

      {/* 3. Eight Indicators Cards Grid */}
      <section className="p-card nk-reports-section">
        <div className="nk-reports-section__head">
          <div>
            <h2 className="t-h3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconSparkle size={19} style={{ color: 'var(--primary)' }} /> شاخص‌های هشت‌گانه ارزیابی تحصیلی
            </h2>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              روی هر شاخص کلیک کنید تا روند تغییرات آن را در نمودار زیر مشاهده کنید.
            </p>
          </div>
          <span className="pill green num">{faNum(indicators.length)} شاخص رسمی</span>
        </div>

        <div className="nk-reports-indicators-grid">
          {indicators.map((ind, idx) => {
            const meta = INDICATOR_META[ind] || { desc: 'شاخص ارزیابی عملکرد کلاسی', tone: 'green' };
            const avg = indicatorAverages[ind];
            const isSelected = selectedIndicator === ind;
            return (
              <button
                key={ind}
                type="button"
                className={`nk-indicator-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedIndicator(ind)}
                aria-pressed={isSelected}
              >
                <div className="nk-indicator-card__top">
                  <span className={`nk-indicator-card__num nk-indicator-card__num--${meta.tone} num`}>
                    {faNum(idx + 1)}
                  </span>
                  <strong className="nk-indicator-card__title">{ind}</strong>
                  <span className="nk-indicator-card__score num">
                    {avg !== null ? `${faNum(avg)} / ۱۰۰` : '— / ۱۰۰'}
                  </span>
                </div>
                <p className="nk-indicator-card__desc">{meta.desc}</p>
                <div className="nk-indicator-card__bar" aria-hidden="true">
                  <span style={{ width: `${avg !== null ? Math.min(100, Math.max(4, avg)) : 0}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Filter Pills + Trend Chart / Empty State */}
      <section className="p-card nk-reports-section">
        <div className="nk-reports-section__head">
          <div>
            <h2 className="t-h3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconChart size={19} style={{ color: 'var(--primary)' }} /> نمودار روند و جدول جلسات
            </h2>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              نمایش شاخص انتخاب‌شده: <b style={{ color: 'var(--primary)' }}>{selectedIndicator}</b>
            </p>
          </div>
        </div>

        {/* Clean Filter Pills with proper gap */}
        <div className="nk-reports-pills" role="group" aria-label="فیلتر شاخص گزارش تحصیلی">
          {['میانگین کل', ...indicators].map((ind) => (
            <button
              key={ind}
              type="button"
              className={`nk-reports-pill ${selectedIndicator === ind ? 'is-active' : ''}`}
              aria-pressed={selectedIndicator === ind}
              onClick={() => setSelectedIndicator(ind)}
            >
              {ind}
            </button>
          ))}
        </div>

        {reports.length > 0 ? (
          <>
            <div className="nk-reports-chart-box">
              <svg
                className="lc-chart"
                viewBox="0 0 640 180"
                role="img"
                aria-label={`روند ${selectedIndicator}`}
                style={{ width: '100%', maxHeight: 230 }}
              >
                <line x1="20" y1="40" x2="620" y2="40" stroke="var(--n200)" strokeDasharray="4 4" />
                <line x1="20" y1="90" x2="620" y2="90" stroke="var(--n200)" strokeDasharray="4 4" />
                <line x1="20" y1="140" x2="620" y2="140" stroke="var(--n200)" strokeDasharray="4 4" />
                <path d="M20 10v150h600" fill="none" stroke="var(--n200)" strokeWidth="2" />
                <polyline
                  points={reports
                    .slice(0, 12)
                    .reverse()
                    .map((r, i, arr) => {
                      const val = indicatorIndex >= 0 ? r.scores[indicatorIndex] ?? r.average : r.average;
                      return `${20 + (i * 600) / Math.max(1, arr.length - 1)},${160 - val * 1.4}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {reports
                  .slice(0, 12)
                  .reverse()
                  .map((r, i, arr) => {
                    const val = indicatorIndex >= 0 ? r.scores[indicatorIndex] ?? r.average : r.average;
                    return (
                      <circle
                        key={r.occurrence_id}
                        cx={20 + (i * 600) / Math.max(1, arr.length - 1)}
                        cy={160 - val * 1.4}
                        r="5.5"
                        fill="var(--accent)"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    );
                  })}
              </svg>
            </div>

            <div className="table-scroll" style={{ marginTop: 18 }}>
              <table className="lc-table">
                <thead>
                  <tr>
                    <th>تاریخ جلسه</th>
                    {indicators.map((ind) => (
                      <th key={ind}>{ind}</th>
                    ))}
                    <th>میانگین</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.occurrence_id}>
                      <td>{formatDateFa(r.created_at)}</td>
                      {r.scores.map((v, idx) => (
                        <td key={idx} className="num">{faNum(v)}</td>
                      ))}
                      <td className="num">
                        <b style={{ color: 'var(--primary)' }}>{faNum(Math.round(r.average * 10) / 10)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="nk-reports-empty">
            <div className="nk-reports-empty__visual" aria-hidden="true">
              <svg width="110" height="110" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="52" fill="#E3F4EC" stroke="#21A878" strokeWidth="1.5" strokeDasharray="4 4" />
                <polygon
                  points="60,18 90,32 102,60 88,88 60,100 32,88 18,60 30,32"
                  fill="rgba(10, 104, 71, 0.1)"
                  stroke="#0A6847"
                  strokeWidth="2"
                />
                <circle cx="60" cy="18" r="4" fill="#F28A3D" />
                <circle cx="90" cy="32" r="4" fill="#0A6847" />
                <circle cx="102" cy="60" r="4" fill="#F28A3D" />
                <circle cx="88" cy="88" r="4" fill="#0A6847" />
                <circle cx="60" cy="100" r="4" fill="#F28A3D" />
                <circle cx="32" cy="88" r="4" fill="#0A6847" />
                <circle cx="18" cy="60" r="4" fill="#F28A3D" />
                <circle cx="30" cy="32" r="4" fill="#0A6847" />
                <circle cx="60" cy="60" r="6" fill="#053D29" />
              </svg>
            </div>

            <div className="nk-reports-empty__body">
              <h3 className="t-h3" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                <IconChart size={20} style={{ color: 'var(--primary)' }} /> هنوز گزارش ثبت‌شده‌ای از استاد ندارید
              </h3>
              <p className="t-small" style={{ color: 'var(--n700)', marginTop: 8, lineHeight: 2 }}>
                پس از برگزاری جلسه و تأیید حضور، استاد نمرهٔ ۸ شاخص (آمادگی، وقت‌شناسی، تعامل، تمرکز، تکلیف، درک مفاهیم، حل مسئله و استمرار) را از ۰ تا ۱۰۰ ثبت می‌کند و نمودار پیشرفت شما در همین صفحه فعال می‌شود. هیچ عدد ساختگی پیش از ثبت واقعی نمایش داده نمی‌شود.
              </p>

              <div className="nk-reports-steps">
                <div className="nk-reports-step">
                  <span className="nk-reports-step__badge num">۱</span>
                  <div>
                    <b>رزرو و حضور در کلاس</b>
                    <small>شرکت در جلسه آنلاین یا حضوری</small>
                  </div>
                </div>
                <div className="nk-reports-step">
                  <span className="nk-reports-step__badge num">۲</span>
                  <div>
                    <b>ارزیابی ۸ شاخص توسط استاد</b>
                    <small>ثبت نمره واقعی از ۰ تا ۱۰۰</small>
                  </div>
                </div>
                <div className="nk-reports-step">
                  <span className="nk-reports-step__badge num">۳</span>
                  <div>
                    <b>فعال‌سازی نمودار و پاداش</b>
                    <small>دریافت ۵۰ سکه و ۳۰۰ امتیاز رشد</small>
                  </div>
                </div>
              </div>

              <div className="nk-reports-empty__actions">
                <Link to="/classes" className="btn btn-primary">
                  رزرو کلاس
                </Link>
                <Link to="/panel/club?section=reports" className="btn btn-outline">
                  ثبت نظرسنجی جلسات ({faNum(sessions.length)})
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. Club Academic Reward Conditions */}
      <section className="p-card nk-reports-reward-card">
        <div className="nk-reports-section__head" style={{ borderBottom: 'none', marginBottom: 8, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="nk-profile-section__icon nk-profile-section__icon--orange">
              <IconMedal size={22} />
            </div>
            <div>
              <h2 className="t-h3">شرایط پاداش پیشرفت تحصیلی در نیمکت کلاب</h2>
              <p className="t-small t-muted" style={{ marginTop: 2 }}>
                پاداش‌های خودکار باشگاه مشتریان بر اساس گزارش‌های رسمی اساتید
              </p>
            </div>
          </div>
          <Link to="/panel/club" className="btn btn-outline btn-sm">
            مشاهده نیمکت کلاب <IconArrowLeft size={14} />
          </Link>
        </div>

        <ul className="nk-reports-rules">
          <li>
            <span className="nk-reports-rules__icon">
              <IconCheck size={17} />
            </span>
            <span>
              در صورتی که میانگین گزارش‌های ثبت‌شدهٔ ماه جاری نسبت به ماه قبل حداقل ۱۰٪ رشد داشته باشد، <b>۵۰ سکه</b> و <b>۳۰۰ امتیاز پیشرفت تحصیلی ماهانه</b> به حساب کلاب شما اضافه می‌شود.
            </span>
          </li>
          <li>
            <span className="nk-reports-rules__icon">
              <IconCheck size={17} />
            </span>
            <span>
              والدین دارای مجوز «گزارش‌های تحصیلی» نیز می‌توانند این جدول را در پنل خانواده مشاهده کنند.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
