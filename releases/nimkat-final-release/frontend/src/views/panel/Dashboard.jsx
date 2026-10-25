'use client';
import { useEffect, useState, useCallback } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum, faPrice } from '../../utils/fa.js';
import TechnicalCheck from '../../components/TechnicalCheck.jsx';
import {
  IconWallet, IconCoins, IconCheck, IconCalendar, IconLink, IconBell, IconFile,
  IconVideo, IconClock, IconArrowLeft, IconChat, IconWifi, IconBook, IconDownload,
  IconChart,
} from '../../components/icons.jsx';

const formatDateTimeFa = (t) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(t);

const formatTodayFa = () =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(Date.now());

export default function Dashboard({ teacher = false }) {
  const [data, setData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinNotice, setJoinNotice] = useState('');
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [notifCategory, setNotifCategory] = useState('all');
  const [notifBusy, setNotifBusy] = useState(false);

  const loadOverview = useCallback(() => {
    let active = true;
    setError('');
    api('/panel/overview')
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message || 'خطا در دریافت اطلاعات پنل');
      });
    api('/materials/mine')
      .then((m) => {
        if (active && Array.isArray(m.materials)) setMaterials(m.materials.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = loadOverview();
    return cleanup;
  }, [loadOverview]);

  const handleJoinClass = async (occId) => {
    if (joinBusy) return;
    setJoinBusy(true);
    setJoinNotice('');
    try {
      const r = await api(`/classroom/${occId}/join`, { method: 'POST', body: {} });
      if (r.url) window.location.assign(r.url);
    } catch (e) {
      setJoinNotice(e.message || 'امکان ورود به کلاس در این لحظه وجود ندارد.');
    } finally {
      setJoinBusy(false);
    }
  };

  const handleDismissNotification = async (id) => {
    if (notifBusy) return;
    setNotifBusy(true);
    try {
      await api(`/notifications/${id}/dismiss`, { method: 'POST', body: {} });
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: (prev.notifications || []).filter((n) => n.id !== id),
            }
          : prev
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setNotifBusy(false);
    }
  };

  const handleReadAllNotifications = async () => {
    if (notifBusy) return;
    setNotifBusy(true);
    try {
      await api('/notifications/read-all', { method: 'POST', body: {} });
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: (prev.notifications || []).map((n) => ({ ...n, read_at: n.read_at || Date.now() })),
            }
          : prev
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setNotifBusy(false);
    }
  };

  const handleDownloadFile = async (e, m) => {
    e.preventDefault();
    try {
      const blob = await api(`/materials/${m.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = m.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || 'خطا در دانلود فایل');
    }
  };

  if (error && !data) {
    return (
      <div className="p-card" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={loadOverview}>
          تلاش مجدد
        </button>
      </div>
    );
  }
  if (!data) return <p role="status">دریافت اطلاعات واقعی حساب…</p>;

  const profileCompletion = data.profileCompletion || { percent: 40, missing: [], rewardClaimed: false };
  const nextSession = data.upcoming?.[0] || null;
  const filteredNotifs = (data.notifications || []).filter(
    (n) => notifCategory === 'all' || (n.category || 'system') === notifCategory
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {error && (
        <div className="p-card" role="alert" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {/* ============ Greeting Header ============ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h3">سلام {data.user.name}</h1>
          <p className="t-small t-muted num" style={{ marginTop: 6 }}>
            {formatTodayFa()} ·{' '}
            {data.upcoming.length > 0
              ? `${faNum(data.upcoming.length)} جلسهٔ برنامه‌ریزی‌شده در پیش دارید`
              : 'امروز جلسهٔ برنامه‌ریزی‌شده‌ای ندارید'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {teacher ? (
            <Link to="/teacher/teaching" className="btn btn-primary">
              مدیریت پرونده و زمان‌های آزاد
            </Link>
          ) : (
            <Link to="/classes" className="btn btn-primary">
              رزرو کلاس جدید +
            </Link>
          )}
        </div>
      </div>

      {/* ============ Profile Completion Banner (Student) ============ */}
      {!teacher && (
        <div
          style={{
            background: 'var(--accent-50)',
            borderRadius: 'var(--r-xl)',
            padding: '22px 26px',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 'var(--r-lg)',
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent-800)',
              flex: 'none',
            }}
          >
            <IconLink size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <b style={{ fontSize: 15 }}>پروفایل شما {faNum(profileCompletion.percent)}٪ کامل است</b>
            <div className="t-small" style={{ color: 'var(--accent-800)', marginTop: 4 }}>
              {profileCompletion.missing?.length > 0
                ? `مانده: ${profileCompletion.missing.join(' · ')}`
                : 'همهٔ اطلاعات اصلی پروفایل شما تکمیل شده است ✓'}
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-label="درصد تکمیل پروفایل"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={profileCompletion.percent}
              style={{ marginTop: 12, background: 'rgba(255,255,255,.65)' }}
            >
              <i style={{ width: `${profileCompletion.percent}%` }} />
            </div>
            <div className="t-caption" style={{ color: 'var(--accent-800)', marginTop: 6 }}>
              {profileCompletion.rewardClaimed
                ? 'پاداش تکمیل پروفایل (۱۰ سکه و ۵۰ امتیاز) در کیف کلاب شما ثبت شده است.'
                : 'با تکمیل کامل پروفایل، ۱۰ سکه و ۵۰ امتیاز در نیمکت کلاب می‌گیرید.'}
            </div>
          </div>
          <Link to="/panel/profile" className="btn btn-orange">
            {profileCompletion.percent < 100 ? 'تکمیل پروفایل' : 'ویرایش پروفایل'}
          </Link>
        </div>
      )}

      {/* ============ Teacher Onboarding Warning ============ */}
      {teacher && !data.teacherApproved && (
        <section className="p-card">
          <h2 className="t-h4">تکمیل پروندهٔ استادی</h2>
          <p className="t-small t-muted" style={{ marginTop: 6 }}>
            برای انتشار زمان‌های آزاد و دریافت شاگرد، پروندهٔ حرفه‌ای ۱۲ مرحله‌ای خود را ثبت کنید تا توسط کارشناس بررسی شود.
          </p>
          <Link className="btn btn-primary" style={{ marginTop: 12 }} to="/teacher/teaching">
            ثبت پرونده و زمان‌های آزاد
          </Link>
        </section>
      )}

      {/* ============ KPIs + Next Class Card ============ */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '340px 1fr' }}>
        <div className="p-grid-22" style={{ gap: 14 }}>
          <div className="kpi">
            <span className="ic">
              <IconWallet size={22} />
            </span>
            <span className="l">موجودی کیف پول</span>
            <span className="v num">{faPrice(data.wallet)}</span>
            <Link
              to={teacher ? '/teacher/finance' : '/panel/finance'}
              className="sub"
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              تومان · مدیریت مالی
            </Link>
          </div>
          <div className="kpi">
            <span className="ic orange">
              <IconCoins size={22} />
            </span>
            <span className="l">سکه و سطح کلاب</span>
            <span className="v num">{faNum(data.club.coins)}</span>
            <Link
              to={teacher ? '/teacher/club' : '/panel/club'}
              className="sub"
              style={{ color: 'var(--accent-800)', fontWeight: 700 }}
            >
              سطح {data.club.level} · {faNum(data.club.points)} امتیاز
            </Link>
          </div>
          <div className="kpi">
            <span className="ic">
              <IconCheck size={22} />
            </span>
            <span className="l">جلسات تأییدشده</span>
            <span className="v num">{faNum(data.stats.verifiedSessions)}</span>
            <span className="sub">بر اساس حضور ثبت‌شده</span>
          </div>
          <div className="kpi">
            <span className="ic gray">
              <IconCalendar size={22} />
            </span>
            <span className="l">کلاس‌های پیش رو</span>
            <span className="v num">{faNum(data.upcoming.length)}</span>
            <Link
              to={teacher ? '/teacher/calendar' : '/panel/calendar'}
              className="sub"
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              مشاهده تقویم
            </Link>
          </div>
        </div>

        {/* Next Class Card */}
        <div className="next-class">
          {nextSession ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900 }}>{nextSession.title}</h2>
                  <div className="t-small num" style={{ opacity: 0.9, marginTop: 8 }}>
                    {formatDateTimeFa(nextSession.starts_at)} تا {formatDateTimeFa(nextSession.ends_at)} ·{' '}
                    {nextSession.platform || nextSession.mode || 'آنلاین'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="chip" style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>
                    <IconClock size={14} /> ورود از ۱۵ دقیقه قبل از شروع
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '18px 0 4px' }}>
                <div className="avatar sq-52" style={{ background: 'var(--accent)', color: 'var(--n900)' }}>
                  {(nextSession.teacher_name || 'ا')[0]}
                </div>
                <div>
                  <b style={{ fontSize: 15 }}>{nextSession.teacher_name}</b>
                  <div className="t-caption" style={{ opacity: 0.8 }}>
                    مدرس جلسه · {nextSession.mode || 'آنلاین'}
                  </div>
                </div>
              </div>

              <div className="prep">
                <b style={{ fontSize: 14 }}>آمادگی پیش از جلسه</b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  <Link
                    to={data.filesUrl}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#fff', textDecoration: 'underline' }}
                  >
                    <IconFile size={16} /> مشاهده و دانلود جزوه‌ها و فایل‌های جلسه در بخش منابع
                  </Link>
                  <Link
                    to={teacher ? '/teacher/chat' : '/panel/chat'}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#fff', textDecoration: 'underline' }}
                  >
                    <IconBook size={16} /> هماهنگی و پرسش‌های جلسه در گروه کلاس (نیم‌چت)
                  </Link>
                </div>
              </div>

              {joinNotice && (
                <div
                  role="alert"
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255,255,255,.16)',
                    color: '#fff',
                    fontSize: 13,
                  }}
                >
                  {joinNotice}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-orange"
                  style={{ flex: 1, minWidth: 180 }}
                  type="button"
                  disabled={joinBusy}
                  onClick={() => handleJoinClass(nextSession.id)}
                >
                  <IconVideo size={19} /> {joinBusy ? 'در حال بررسی مجوز ورود…' : 'ورود به کلاس'}
                </button>
                <button
                  className="btn"
                  style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}
                  type="button"
                  aria-expanded={showTechCheck}
                  onClick={() => setShowTechCheck((v) => !v)}
                >
                  <IconWifi size={18} /> تست فنی
                </button>
                <Link
                  to={teacher ? '/teacher/chat' : '/panel/chat'}
                  aria-label="نیم‌چت کلاس"
                  className="btn-icon-round"
                  style={{ background: 'rgba(255,255,255,.14)', color: '#fff', borderColor: 'rgba(255,255,255,.22)' }}
                >
                  <IconChat size={18} />
                </Link>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>هنوز جلسهٔ فعالی در برنامه ندارید</h2>
                <p className="t-small" style={{ opacity: 0.88, marginTop: 8, lineHeight: 2 }}>
                  پس از رزرو قطعی کلاس، اطلاعات جلسهٔ بعدی، لینک ورود امن به اتاق آنلاین، شمارش معکوس و جزوه‌های پیش از جلسه در این کارت نمایش داده می‌شود.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/classes" className="btn btn-orange">
                  جستجو و رزرو کلاس <IconArrowLeft size={18} />
                </Link>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}
                  aria-expanded={showTechCheck}
                  onClick={() => setShowTechCheck((v) => !v)}
                >
                  <IconWifi size={18} /> تست فنی دستگاه
                </button>
                <Link
                  to={teacher ? '/teacher/chat' : '/panel/chat'}
                  className="btn"
                  style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}
                >
                  <IconChat size={18} /> نیم‌چت
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ Expandable Technical Check ============ */}
      {showTechCheck && <TechnicalCheck title="تست فنی میکروفون، دوربین و ارتباط با سرور نیمکت" />}

      {/* ============ Notifications + Upcoming Schedule ============ */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <section className="p-card">
          <div className="head" style={{ flexWrap: 'wrap', gap: 8 }}>
            <h3>اعلان‌های اخیر</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {data.notifications.some((n) => !n.read_at) && (
                <button
                  type="button"
                  className="t-caption"
                  style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                  disabled={notifBusy}
                  onClick={handleReadAllNotifications}
                >
                  خواندن همه
                </button>
              )}
              <Link
                className="link-more"
                style={{ fontSize: 13 }}
                to={teacher ? '/teacher/club?section=notifications' : '/panel/notifications'}
              >
                همه <IconArrowLeft size={15} />
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              ['all', 'همه'],
              ['club', 'کلاب و جوایز'],
              ['academic', 'آموزشی'],
              ['system', 'سیستمی'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={notifCategory === key}
                className={`chip ${notifCategory === key ? 'is-active' : 'outline'}`}
                onClick={() => setNotifCategory(key)}
                style={{ cursor: 'pointer', fontSize: 12 }}
              >
                {label}
              </button>
            ))}
          </div>

          {!filteredNotifs.length ? (
            <p className="t-small t-muted">اعلان فعالی در این دسته وجود ندارد.</p>
          ) : (
            filteredNotifs.slice(0, 6).map((n) => (
              <div className="notif-row" key={n.id} style={n.read_at ? { opacity: 0.78 } : undefined}>
                <span className="ic">
                  <IconBell size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b style={{ fontSize: 13.5 }}>{n.title}</b>
                    {!n.read_at && <span className="chip soft-orange" style={{ fontSize: 10.5, padding: '2px 6px' }}>جدید</span>}
                  </div>
                  <div className="t-caption t-muted">{n.body}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="t-caption t-muted">{new Date(n.created_at).toLocaleDateString('fa-IR')}</div>
                  <button
                    type="button"
                    className="t-caption"
                    style={{ color: 'var(--error)', marginTop: 4, cursor: 'pointer' }}
                    disabled={notifBusy}
                    onClick={() => handleDismissNotification(n.id)}
                  >
                    بستن
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="p-card" id="upcoming">
          <div className="head">
            <h3>برنامهٔ کلاس‌های پیش رو</h3>
            <Link className="link-more" style={{ fontSize: 13 }} to={teacher ? '/teacher/calendar' : '/panel/calendar'}>
              تقویم کامل <IconArrowLeft size={15} />
            </Link>
          </div>
          {!data.upcoming.length ? (
            <p className="t-small t-muted">جلسهٔ آینده‌ای با رزرو قطعی ثبت نشده است.</p>
          ) : (
            data.upcoming.map((u, idx) => (
              <div className="up-row" key={u.id}>
                <div style={{ minWidth: 135 }}>
                  <b style={{ fontSize: 13 }}>{formatDateTimeFa(u.starts_at)}</b>
                </div>
                <span className={`bar ${idx === 0 ? 'orange' : ''}`} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>{u.title}</b>
                  <div className="t-caption t-muted">{u.teacher_name}</div>
                </div>
                <Link
                  to={teacher ? '/teacher/calendar' : '/panel/calendar'}
                  className="btn btn-outline btn-sm"
                >
                  مدیریت جلسه
                </Link>
              </div>
            ))
          )}
        </section>
      </div>

      {/* ============ Files & Academic Report Preview ============ */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <section className="p-card" id="files">
          <div className="head">
            <h3>فایل‌ها و منابع آموزشی</h3>
            <Link className="link-more" style={{ fontSize: 13 }} to={data.filesUrl}>
              همهٔ فایل‌ها <IconArrowLeft size={15} />
            </Link>
          </div>
          {materials.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="card-soft"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}
                >
                  <a
                    href={`/api/materials/${m.id}/download`}
                    onClick={(e) => handleDownloadFile(e, m)}
                    className="btn-icon-round"
                    aria-label={`دانلود ${m.name}`}
                  >
                    <IconDownload size={17} />
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13.5, display: 'block' }}>{m.name}</b>
                    <span className="t-caption t-muted">
                      {m.title} · {faNum(Math.ceil((m.size || 1024) / 1024))} کیلوبایت
                    </span>
                  </div>
                  <span className="chip soft-green">
                    {m.mime === 'application/pdf' ? 'PDF' : m.mime === 'image/png' ? 'PNG' : 'JPG'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="t-small t-muted">
              فایل‌های آموزشی خصوصی‌اند و با بررسی مجوز هر جلسه در صفحهٔ{' '}
              <Link to={data.filesUrl} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                فایل‌ها و منابع امن
              </Link>{' '}
              در دسترس قرار می‌گیرند.
            </p>
          )}
        </section>

        {!teacher && (
          <section className="p-card" id="report">
            <div className="head">
              <h3>گزارش تحصیلی و آزمون‌ها</h3>
              <Link className="link-more" style={{ fontSize: 13 }} to="/panel/reports">
                مشاهده گزارش کامل <IconArrowLeft size={15} />
              </Link>
            </div>
            <p className="t-small t-muted" style={{ lineHeight: 2 }}>
              گزارش هشت‌شاخصی پیشرفت تحصیلی شما پس از هر جلسهٔ تأییدشده توسط استاد ثبت می‌شود و بدون عدد ساختگی در صفحهٔ گزارش تحصیلی قابل مشاهده است.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <Link to="/panel/reports" className="btn btn-outline btn-sm">
                <IconChart size={16} /> گزارش تحصیلی من
              </Link>
              <Link to="/panel/exams" className="btn btn-outline btn-sm">
                آزمون‌ها و تمرین‌ها
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
