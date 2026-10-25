'use client';
import { useState, useEffect } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { IconChart, IconArrowLeft, IconCheck } from '../../components/icons.jsx';

const formatDateFa = (t) => new Date(t).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });

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
          setSessions(s.sessions || []);
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

  if (loading) return <p role="status">در حال بارگذاری گزارش تحصیلی…</p>;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section className="p-card">
        <div className="head" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="t-h2">گزارش تحصیلی هشت‌شاخصی</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              این گزارش‌ها پس از برگزاری و تأیید حضور هر جلسه توسط استاد ثبت می‌شوند و مبنای واقعی سنجش پیشرفت ماهانه در نیمکت هستند.
            </p>
          </div>
          <Link to="/panel" className="btn btn-outline btn-sm">
            بازگشت به پنل <IconArrowLeft size={15} />
          </Link>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--error)', marginBottom: 14 }}>
            {error}
          </p>
        )}

        <div className="segmented" style={{ flexWrap: 'wrap', marginBottom: 18 }}>
          {['میانگین کل', ...indicators].map((ind) => (
            <button
              key={ind}
              type="button"
              className={selectedIndicator === ind ? 'is-active' : ''}
              aria-pressed={selectedIndicator === ind}
              onClick={() => setSelectedIndicator(ind)}
            >
              {ind}
            </button>
          ))}
        </div>

        {reports.length > 0 ? (
          <>
            <svg
              className="lc-chart"
              viewBox="0 0 640 180"
              role="img"
              aria-label={`روند ${selectedIndicator}`}
              style={{ width: '100%', maxHeight: 220, marginBottom: 18 }}
            >
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
                strokeWidth="3"
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
                      r="5"
                      fill="var(--accent)"
                    />
                  );
                })}
            </svg>

            <div className="table-scroll">
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
                        <td key={idx}>{faNum(v)}</td>
                      ))}
                      <td>
                        <b>{faNum(Math.round(r.average * 10) / 10)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card-soft" style={{ padding: 24 }}>
            <h2 className="t-h4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconChart size={20} style={{ color: 'var(--primary)' }} /> هنوز گزارش ثبت‌شده‌ای از استاد ندارید
            </h2>
            <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
              پس از برگزاری جلسه و تأیید حضور، استاد نمرهٔ ۸ شاخص (آمادگی، وقت‌شناسی، تعامل، تمرکز، تکلیف، درک مفاهیم، حل مسئله و استمرار) را از ۰ تا ۱۰۰ ثبت می‌کند و نمودار پیشرفت شما در همین صفحه فعال می‌شود. هیچ عدد ساختگی پیش از ثبت واقعی نمایش داده نمی‌شود.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Link to="/classes" className="btn btn-primary btn-sm">
                رزرو کلاس
              </Link>
              <Link to="/panel/club?section=reports" className="btn btn-outline btn-sm">
                ثبت نظرسنجی جلسات ({faNum(sessions.length)})
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="p-card">
        <h2 className="t-h3">شرایط پاداش پیشرفت تحصیلی در نیمکت کلاب</h2>
        <ul className="check-list" style={{ marginTop: 12 }}>
          <li>
            <IconCheck size={18} /> در صورتی که میانگین گزارش‌های ثبت‌شدهٔ ماه جاری نسبت به ماه قبل حداقل ۱۰٪ رشد داشته باشد، ۵۰ سکه و ۳۰۰ امتیاز پیشرفت تحصیلی ماهانه به حساب کلاب شما اضافه می‌شود.
          </li>
          <li>
            <IconCheck size={18} /> والدین دارای مجوز «گزارش‌های تحصیلی» نیز می‌توانند این جدول را در پنل خانواده مشاهده کنند.
          </li>
        </ul>
      </section>
    </div>
  );
}
