'use client';
import { useState, useEffect, useCallback } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { toast } from '../../utils/toast.js';
import TechnicalCheck from '../../components/TechnicalCheck.jsx';
import {
  IconCrown, IconWallet, IconCheck, IconCalendar, IconLink, IconFile,
  IconVideo, IconClock, IconArrowLeft, IconChat, IconWifi, IconBook, IconInfo,
  IconDownload, IconCoins,
} from '../../components/icons.jsx';
import { faNum, faPrice } from '../../utils/fa.js';

const NOTIFS = [
  { id: 1, icon: IconFile, title: 'پرداخت موفق', desc: 'رزرو ۸ جلسه فیزیک یازدهم · ۲٬۰۱۶٬۰۰۰ تومان', time: 'دیروز' },
  { id: 2, icon: IconFile, title: 'جزوه‌ی جدید', desc: 'سارا محمدی «میدان الکتریکی - تمرین‌ها» را فرستاد', time: '۲ روز پیش' },
  { id: 3, icon: IconCrown, title: '۲۰+ سکه', desc: 'برای شرکت در جلسه‌ی ۲ فیزیک', time: '۲ روز پیش' },
  { id: 4, icon: IconClock, title: 'تغییر زمان', desc: 'کلاس زبان شنبه از ۱۶ به ۱۷ منتقل شد', time: '۳ روز پیش' },
];

const UPCOMING = [
  {
    id: 101, date: 'امروز', chip: '۴۵ دقیقه‌ی دیگر', title: 'فیزیک یازدهم', teacher: 'سارا محمدی · آنلاین',
    time: 'ساعت ۱۶:۰۰', bar: 'orange',
  },
  {
    id: 102, date: 'پنجشنبه ۱۰ مهر', title: 'ریاضی یازدهم · حسابان', teacher: 'کاوه مرادی · آنلاین',
    time: 'ساعت ۱۰:۰۰', cancel: true, bar: '',
  },
  {
    id: 103, date: 'شنبه ۱۲ مهر', title: 'زبان انگلیسی · مکالمه', teacher: 'نگار سلطانی · گروهی · ۶ نفر',
    time: 'ساعت ۱۷:۰۰', cancel: true, bar: '',
  },
  {
    id: 104, date: 'سه‌شنبه ۱۵ مهر', title: 'فیزیک یازدهم', teacher: 'سارا محمدی · آنلاین',
    time: 'ساعت ۱۶:۰۰', cancel: true, bar: '',
  },
];

const CHART = [
  { m: 'فروردین', v: 14 },
  { m: 'اردیبهشت', v: 15 },
  { m: 'خرداد', v: 15.5 },
  { m: 'تیر', v: null, label: 'تعطیلات' },
  { m: 'مرداد', v: null, label: 'تعطیلات' },
  { m: 'شهریور', v: 16.5 },
  { m: 'مهر', v: 18, on: true },
];

const CHARTS = {
  'فیزیک': CHART,
  'ریاضی': [
    { m: 'فروردین', v: 13.5 },
    { m: 'اردیبهشت', v: 15 },
    { m: 'خرداد', v: 14.5 },
    { m: 'تیر', v: null, label: 'تعطیلات' },
    { m: 'مرداد', v: null, label: 'تعطیلات' },
    { m: 'شهریور', v: 14 },
    { m: 'مهر', v: 16.5, on: true },
  ],
  'زبان': [
    { m: 'فروردین', v: 17 },
    { m: 'اردیبهشت', v: 18 },
    { m: 'خرداد', v: 17.5 },
    { m: 'تیر', v: null, label: 'تعطیلات' },
    { m: 'مرداد', v: null, label: 'تعطیلات' },
    { m: 'شهریور', v: 18 },
    { m: 'مهر', v: 19, on: true },
  ],
};

const FILES = [
  { id: 'f1', title: 'میدان الکتریکی - تمرین‌ها', meta: 'فیزیک · ۲٫۴ مگابایت', type: 'PDF', tone: 'soft-error' },
  { id: 'f2', title: 'خلاصه‌ی قانون کولن', meta: 'فیزیک · ۸۵۰ کیلوبایت', type: 'PDF', tone: 'soft-error' },
  { id: 'f3', title: 'Unit 2 - Listening', meta: 'زبان · ۱۲ مگابایت', type: 'MP3', tone: 'soft-green' },
];

export default function StudentHome() {
  const [overview, setOverview] = useState(null);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [upcoming, setUpcoming] = useState(UPCOMING);
  const [balance, setBalance] = useState(120000);
  const [clubCoins, setClubCoins] = useState(1120);
  const [clubLevel, setClubLevel] = useState('نقره‌ای');
  const [charging, setCharging] = useState(false);
  const [subject, setSubject] = useState('فیزیک');
  const [chargeAmount, setChargeAmount] = useState('500000');
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [materials, setMaterials] = useState([]);

  const loadData = useCallback(() => {
    let alive = true;
    api('/panel/overview')
      .then((d) => {
        if (!alive) return;
        setOverview(d);
        if (typeof d.wallet === 'number') setBalance(d.wallet);
        if (typeof d.club?.coins === 'number') setClubCoins(d.club.coins);
        if (d.club?.level) setClubLevel(d.club.level);
      })
      .catch(() => {});
    api('/materials/mine')
      .then((m) => {
        if (alive && Array.isArray(m.materials) && m.materials.length > 0) {
          setMaterials(m.materials.slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const cancelUpcoming = (idx) => {
    setUpcoming((us) => us.filter((_, i) => i !== idx));
    toast('جلسه لغو شد؛ مبلغ به کیف پول برمی‌گردد');
  };

  const chargeWallet = async () => {
    const amount = Number(String(chargeAmount).replace(/[^\d]/g, ''));
    if (!amount || amount < 10000) {
      toast('مبلغ معتبر وارد کنید (حداقل ۱۰٬۰۰۰)', 'err');
      return;
    }
    try {
      const r = await api('/wallet/charge', { method: 'POST', body: { amount } });
      setBalance(typeof r.balance === 'number' ? r.balance : balance + amount);
      setCharging(false);
      toast(`کیف پول ${faNum(amount)} تومان شارژ شد ✓`);
    } catch (e) {
      toast(e.message || 'خطا در شارژ کیف پول', 'err');
    }
  };

  const handleJoinClass = async () => {
    const firstId = overview?.upcoming?.[0]?.id || 1;
    try {
      const r = await api(`/classes/${firstId}/join`, { method: 'POST', body: {} });
      if (r.joinUrl) {
        window.open(r.joinUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast(r.message || 'در حال اتصال به کلاس آنلاین…');
      }
    } catch (e) {
      toast(e.message || 'ورود به کلاس از ۱۵ دقیقه قبل از شروع فعال می‌شود');
    }
  };

  const userName = overview?.user?.name?.split(' ')[0] || 'علی';
  const profilePercent = overview?.profileCompletion?.percent ?? 70;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h2 className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        داشبورد شاگرد
      </h2>
      {overview && overview.upcoming?.length === 0 && (
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          جلسهٔ جاری یا آینده‌ای ندارید.
        </span>
      )}

      {/* greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h3">سلام {userName}، عصر بخیر</h1>
          <p className="t-small t-muted num" style={{ marginTop: 6 }}>
            سه‌شنبه ۸ مهر ۱۴۰۵ · امروز یک کلاس داری
          </p>
        </div>
        <Link to="/classes" className="btn btn-primary">
          + رزرو کلاس جدید
        </Link>
      </div>

      {/* profile completion */}
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
          <IconCoins size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <b style={{ fontSize: 15 }}>پروفایلت {faNum(profilePercent)}٪ کامل است</b>
            <span className="t-caption" style={{ color: 'var(--accent-800)', fontWeight: 700 }}>
              با تکمیلش ۱۰ سکه می‌گیری
            </span>
          </div>
          <div className="progress" style={{ marginTop: 12, background: 'rgba(255,255,255,.65)' }}>
            <i style={{ width: `${profilePercent}%` }} />
          </div>
          <div className="t-small" style={{ color: 'var(--accent-800)', marginTop: 8 }}>
            مانده: انتخاب درس‌های مورد علاقه · شماره‌ی والدین · عکس پروفایل
          </div>
        </div>
        <Link to="/panel/profile" className="btn btn-orange">
          تکمیل پروفایل
        </Link>
      </div>

      {/* next class (right in RTL) + kpis (left in RTL) */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* next class */}
        <div className="next-class" style={{ gridColumn: 1, gridRow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="chip" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
              <IconClock size={14} /> شروع تا ۴۵ دقیقه‌ی دیگر
            </span>
            <span className="t-caption num" style={{ opacity: 0.8 }}>
              جلسه‌ی ۳ از ۸
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>فیزیک یازدهم · قانون کولن</h2>
            <div className="t-small num" style={{ opacity: 0.85, marginTop: 6 }}>
              امروز · ساعت ۱۶:۰۰ تا ۱۷:۳۰ · اسکای‌روم
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '18px 0 4px' }}>
            <div className="avatar sq-52" style={{ background: '#fff', color: 'var(--primary)' }}>
              س
            </div>
            <div>
              <b style={{ fontSize: 15 }}>سارا محمدی</b>
              <div className="t-caption" style={{ opacity: 0.75 }}>
                دبیر فیزیک · متخصص
              </div>
            </div>
          </div>

          <div className="prep">
            <b style={{ fontSize: 14 }}>برای این جلسه آماده باش</b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <IconCheck size={16} style={{ color: 'var(--secondary)' }} />
                تکلیف جلسه‌ی ۲ تحویل شد · ۸ از ۱۰ تمرین
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <IconFile size={16} style={{ opacity: 0.8 }} />
                جزوه‌ی «میدان الکتریکی» را قبل از کلاس ببین
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <IconBook size={16} style={{ opacity: 0.8 }} />
                سؤال پین‌شده: «تمرین ۷ صفحه‌ی ۳۲»
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            <button
              className="btn btn-orange"
              style={{ flex: 1, minWidth: 200 }}
              type="button"
              onClick={handleJoinClass}
            >
              <IconVideo size={19} /> ورود به کلاس
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}
              type="button"
              aria-expanded={showTechCheck}
              onClick={() => setShowTechCheck((v) => !v)}
            >
              <IconWifi size={18} /> تست فنی
            </button>
            <Link
              to="/panel/chat"
              className="btn-icon-round"
              aria-label="نیم‌چت"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.18)' }}
            >
              <IconChat size={18} />
            </Link>
          </div>
        </div>

        {/* 4 KPIs */}
        <div className="p-grid-22" style={{ gap: 14, gridColumn: 2, gridRow: 1 }}>
          <div className="kpi" id="wallet">
            <span className="ic">
              <IconWallet size={22} />
            </span>
            <span className="l">موجودی کیف پول</span>
            <span className="v num">{faPrice(balance)}</span>
            <div className="sub">
              تومان ·{' '}
              <button
                type="button"
                onClick={() => setCharging((v) => !v)}
                style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                افزایش موجودی
              </button>
            </div>
            {charging && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, width: '100%' }}>
                <input
                  className="input num"
                  style={{ width: 110, fontSize: 12 }}
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  type="button"
                  onClick={chargeWallet}
                >
                  شارژ
                </button>
              </div>
            )}
          </div>
          <div className="kpi">
            <span className="ic orange">
              <IconCrown size={22} />
            </span>
            <span className="l">نیمکت کلاب</span>
            <span className="v num">{faNum(clubCoins)}</span>
            <span className="sub">سکه · سطح {clubLevel}</span>
          </div>
          <div className="kpi">
            <span className="ic gray">
              <IconCalendar size={22} />
            </span>
            <span className="l">جلسات این ماه</span>
            <span className="v num">۹</span>
            <span className="sub">از ۱۲ جلسه‌ی رزروشده</span>
          </div>
          <div className="kpi">
            <span className="ic">
              <IconCheck size={22} />
            </span>
            <span className="l">حضور</span>
            <span className="v num">۱۰۰٪</span>
            <span className="sub">بدون غیبت در مهر</span>
          </div>
        </div>
      </div>

      {showTechCheck && <TechnicalCheck title="تست فنی میکروفون، دوربین و ارتباط با سرور نیمکت" />}

      {/* upcoming (right in RTL) + notifications (left in RTL) */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="p-card" id="upcoming" style={{ gridColumn: 1, gridRow: 1 }}>
          <div className="head">
            <h3>برنامه‌ی کلاس‌های پیش رو</h3>
            <Link to="/panel/calendar" className="link-more" style={{ fontSize: 13 }}>
              تقویم کامل <IconArrowLeft size={15} />
            </Link>
          </div>
          {upcoming.map((u, i) => (
            <div className="up-row" key={u.id || i}>
              <div style={{ width: 120 }}>
                <b style={{ fontSize: 13 }}>{u.date}</b>
                <div className="t-caption t-muted num">{u.time}</div>
              </div>
              <span className={`bar ${u.bar}`} />
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13.5 }}>{u.title}</b>
                <div className="t-caption t-muted">{u.teacher}</div>
              </div>
              {u.chip ? (
                <span className="chip soft-orange">{u.chip}</span>
              ) : (
                <button
                  type="button"
                  className="t-caption t-muted"
                  style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}
                  onClick={() => cancelUpcoming(i)}
                >
                  ✕ لغو
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-card" style={{ gridColumn: 2, gridRow: 1 }}>
          <div className="head">
            <h3>اعلان‌ها</h3>
            <Link to="/panel/notifications" className="link-more" style={{ fontSize: 13 }}>
              همه
            </Link>
          </div>
          {notifs.map((n, i) => (
            <div className="notif-row" key={n.id || i}>
              <span className="ic">
                <n.icon size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13.5 }}>{n.title}</b>
                <div className="t-caption t-muted">{n.desc}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="t-caption t-muted">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* report */}
      <div className="p-card" id="report">
        <div className="head">
          <div>
            <h3>گزارش تحصیلی · {subject}</h3>
            <div className="t-caption t-muted" style={{ marginTop: 4 }}>
              میانگین نمره‌ی آزمون‌ها از ۲۰
            </div>
          </div>
          <div className="segmented">
            {['فیزیک', 'ریاضی', 'زبان'].map((sb) => (
              <button
                key={sb}
                className={subject === sb ? 'is-active' : ''}
                type="button"
                onClick={() => setSubject(sb)}
              >
                {sb}
              </button>
            ))}
          </div>
        </div>

        <div className="chart">
          {(CHARTS[subject] || CHART).map((c) => (
            <div className="col" key={c.m}>
              {c.v !== null && <span className="vl num">{faNum(c.v)}</span>}
              {c.v !== null ? (
                <div className={`bar ${c.on ? 'on' : ''}`} style={{ height: `${(c.v / 20) * 100}%` }} />
              ) : (
                <div style={{ width: '100%', maxWidth: 44, textAlign: 'center' }}>
                  <div
                    style={{
                      height: 3,
                      background: 'var(--n200)',
                      borderRadius: 2,
                      margin: '0 auto 6px',
                      width: 32,
                    }}
                  />
                  <span className="lb">{c.label}</span>
                </div>
              )}
              <span className="lb">{c.m}</span>
            </div>
          ))}
        </div>

        <div
          className="card-soft"
          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', marginTop: 18 }}
        >
          <IconInfo size={19} style={{ color: 'var(--accent-800)', flex: 'none', marginTop: 2 }} />
          <p className="t-small" style={{ lineHeight: 2 }}>
            <b>یادداشت استاد:</b> در مسائل میدان الکتریکی هنوز جهت بردار را جا می‌اندازد. تمرین ۴ تا ۹
            جزوه‌ی جلسه‌ی ۲ را دوباره حل کند.
          </p>
        </div>
      </div>

      {/* files */}
      <div className="p-card" id="files">
        <div className="head">
          <h3>فایل‌ها و منابع اخیر</h3>
          <Link to="/panel/files" className="link-more" style={{ fontSize: 13 }}>
            همه‌ی فایل‌ها <IconArrowLeft size={15} />
          </Link>
        </div>
        <div className="panel-files-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {(materials.length > 0
            ? materials.map((m) => ({
                id: m.id,
                title: m.name,
                meta: `${m.title || 'فیزیک'} · ${faNum(Math.ceil((m.size || 1024) / 1024))} کیلوبایت`,
                type: m.mime === 'application/pdf' ? 'PDF' : 'فایل',
                tone: 'soft-error',
                realId: m.id,
              }))
            : FILES
          ).map((f) => (
            <div
              key={f.id || f.title}
              className="card-soft"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}
            >
              <span className={`chip ${f.tone}`}>{f.type}</span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13.5 }}>{f.title}</b>
                <div className="t-caption t-muted">{f.meta}</div>
              </div>
              <Link
                to="/panel/files"
                className="btn-icon-round"
                aria-label={`دانلود ${f.title}`}
              >
                <IconDownload size={17} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
