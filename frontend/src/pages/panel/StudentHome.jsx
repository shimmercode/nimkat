import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../../api.js';
import { toast } from '../../utils/toast.js';
import {
  IconCrown, IconWallet, IconCheck, IconCalendar, IconLink, IconBell, IconFile,
  IconVideo, IconClock, IconArrowLeft, IconChat, IconWifi, IconBook, IconStar, IconInfo,
  IconDownload, IconCap,
} from '../../components/icons.jsx';
import { faNum, faPrice } from '../../utils/fa.js';

const NOTIFS = [
  { icon: IconFile, title: 'پرداخت موفق', desc: 'رزرو ۸ جلسه فیزیک یازدهم · ۲٬۰۱۶٬۰۰۰ تومان', time: 'دیروز' },
  { icon: IconFile, title: 'جزوه‌ی جدید', desc: 'سارا محمدی «میدان الکتریکی - تمرین‌ها» را فرستاد', time: '۲ روز پیش' },
  { icon: IconCrown, title: '۲۰+ سکه', desc: 'برای شرکت در جلسه‌ی ۲ فیزیک', time: '۲ روز پیش' },
  { icon: IconClock, title: 'تغییر زمان', desc: 'کلاس زبان شنبه از ۱۶ به ۱۷ منتقل شد', time: '۳ روز پیش' },
];

const UPCOMING = [
  {
    date: 'امروز', chip: '۴۵ دقیقه‌ی دیگر', title: 'فیزیک یازدهم', teacher: 'سارا محمدی · آنلاین',
    time: '۱۶:۰۰-۱۷:۳۰', bar: 'orange',
  },
  {
    date: 'پنجشنبه ۱۰ مهر', title: 'ریاضی یازدهم · حسابان', teacher: 'کاوه مرادی · آنلاین',
    time: '۱۰:۰۰-۱۱:۳۰', cancel: true, bar: '',
  },
  {
    date: 'شنبه ۱۲ مهر', title: 'زبان انگلیسی · مکالمه', teacher: 'نگار سلطانی · گروهی · ۶ نفر',
    time: '۱۴:۰۰-۱۵:۰۰', cancel: true, bar: '',
  },
  {
    date: 'سه‌شنبه ۱۵ مهر', title: 'فیزیک یازدهم', teacher: 'سارا محمدی · آنلاین',
    time: '۱۶:۰۰-۱۷:۳۰', cancel: true, bar: '',
  },
];

const CHART = [
  { m: 'مهر', v: 18, on: true },
  { m: 'شهریور', v: 15.5 },
  { m: 'مرداد', v: null, label: 'تعطیلات' },
  { m: 'تیر', v: null, label: 'تعطیلات' },
  { m: 'خرداد', v: 15 },
  { m: 'اردیبهشت', v: 15.5 },
  { m: 'فروردین', v: 14 },
];

const CHARTS = {
  'فیزیک': CHART,
  'ریاضی': [
    { m: 'مهر', v: 16.5, on: true }, { m: 'شهریور', v: 14 }, { m: 'مرداد', v: null, label: 'تعطیلات' },
    { m: 'تیر', v: null, label: 'تعطیلات' }, { m: 'خرداد', v: 14.5 }, { m: 'اردیبهشت', v: 15 }, { m: 'فروردین', v: 13.5 },
  ],
  'زبان': [
    { m: 'مهر', v: 19, on: true }, { m: 'شهریور', v: 18 }, { m: 'مرداد', v: null, label: 'تعطیلات' },
    { m: 'تیر', v: null, label: 'تعطیلات' }, { m: 'خرداد', v: 17.5 }, { m: 'اردیبهشت', v: 18 }, { m: 'فروردین', v: 17 },
  ],
};

const FILES = [
  { title: 'میدان الکتریکی - تمرین‌ها', meta: 'فیزیک · ۲٫۴ مگابایت', type: 'PDF', tone: 'soft-error' },
  { title: 'خلاصه‌ی قانون کولن', meta: 'فیزیک · ۸۵۰ کیلوبایت', type: 'PDF', tone: 'soft-error' },
  { title: 'Unit 2 - Listening', meta: 'زبان · ۱۲ مگابایت', type: 'MP3', tone: 'soft-green' },
];

export default function StudentHome() {
  const [notifs, setNotifs] = useState(NOTIFS.map((n, i) => ({ ...n, id: i + 1 })));
  const [upcoming, setUpcoming] = useState(UPCOMING);
  const [balance, setBalance] = useState(1240000);
  const [charging, setCharging] = useState(false);
  const [subject, setSubject] = useState('فیزیک');
  const [allNotifs, setAllNotifs] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('500000');

  useEffect(() => {
    if (!getToken()) return;
    api('/panel/student').then((d) => {
      if (typeof d.wallet === 'number') setBalance(d.wallet);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelNotif = async (id) => {
    if (!getToken()) { toast('برای این کار اول وارد شوید', 'err'); return; }
    try {
      await api(`/notifications/${id}/cancel`, { method: 'POST' });
      setNotifs((ns) => ns.filter((n) => n.id !== id));
      toast('اعلان لغو شد');
    } catch (e) {
      toast(e.message || 'خطا در لغو اعلان', 'err');
    }
  };

  const cancelUpcoming = (idx) => {
    setUpcoming((us) => us.filter((_, i) => i !== idx));
    toast('جلسه لغو شد؛ مبلغ به کیف پول برمی‌گردد');
  };

  const chargeWallet = async () => {
    const amount = Number(String(chargeAmount).replace(/[^\d]/g, ''));
    if (!amount || amount < 10000) { toast('مبلغ معتبر وارد کنید (حداقل ۱۰٬۰۰۰)', 'err'); return; }
    if (!getToken()) { toast('برای شارژ اول وارد شوید', 'err'); return; }
    try {
      const r = await api('/wallet/charge', { method: 'POST', body: { amount } });
      setBalance(typeof r.balance === 'number' ? r.balance : balance + amount);
      setCharging(false);
      toast(`کیف پول ${faNum(amount)} تومان شارژ شد ✓`);
    } catch (e) {
      toast(e.message || 'خطا در شارژ کیف پول', 'err');
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h3">سلام علی، عصر بخیر</h1>
          <p className="t-small t-muted num" style={{ marginTop: 6 }}>
            سه‌شنبه ۷ مهر ۱۴۰۵ · امروز یک کلاس داری
          </p>
        </div>
        <Link to="/classes" className="btn btn-primary">
          رزرو کلاس جدید +
        </Link>
      </div>

      {/* profile completion */}
      <div
        style={{
          background: 'var(--accent-50)', borderRadius: 'var(--r-xl)', padding: '22px 26px',
          display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 54, height: 54, borderRadius: 'var(--r-lg)', background: '#fff',
            display: 'grid', placeItems: 'center', color: 'var(--accent-800)', flex: 'none',
          }}
        >
          <IconLink size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <b style={{ fontSize: 15 }}>پروفایلت ۷۰٪ کامل است</b>
          <div className="t-small" style={{ color: 'var(--accent-800)', marginTop: 4 }}>
            مانده: انتخاب درس‌های مورد علاقه · شماره‌ی والدین · عکس پروفایل
          </div>
          <div className="progress" style={{ marginTop: 12, background: 'rgba(255,255,255,.65)' }}>
            <i style={{ width: '70%' }} />
          </div>
          <div className="t-caption" style={{ color: 'var(--accent-800)', marginTop: 6 }}>
            با تکمیلش ۱۰ سکه می‌گیری
          </div>
        </div>
        <button className="btn btn-orange" type="button" onClick={() => toast('فرم تکمیل پروفایل باز شد')}>تکمیل پروفایل</button>
      </div>

      {/* kpis + next class */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '340px 1fr' }}>
        <div className="p-grid-22" style={{ gap: 14 }}>
          <div className="kpi">
            <span className="ic orange"><IconCrown size={22} /></span>
            <span className="l">نیمکت کلاب</span>
            <span className="v num">۵٬۱۲۰</span>
            <span className="sub">سکه · سطح نقره‌ای</span>
          </div>
          <div className="kpi">
            <span className="ic"><IconWallet size={22} /></span>
            <span className="l">موجودی کیف پول</span>
            <span className="v num">{faPrice(balance)}</span>
            <button type="button" onClick={() => setCharging((v) => !v)} className="sub" style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
              افزایش موجودی
            </button>
            {charging && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, width: '100%' }}>
                <input className="input num" style={{ width: 110, fontSize: 12 }} value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} type="button" onClick={chargeWallet}>شارژ</button>
              </div>
            )}
            <span className="sub">تومان</span>
          </div>
          <div className="kpi">
            <span className="ic"><IconCheck size={22} /></span>
            <span className="l">حضور</span>
            <span className="v num">۱۰۰٪</span>
            <span className="sub">بدون غیبت در مهر</span>
          </div>
          <div className="kpi">
            <span className="ic gray"><IconCalendar size={22} /></span>
            <span className="l">جلسات این ماه</span>
            <span className="v num">۹</span>
            <span className="sub">از ۱۲ جلسه‌ی رزروشده</span>
          </div>
        </div>

        {/* next class */}
        <div className="next-class">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>فیزیک یازدهم · قانون کولن</h2>
              <div className="t-small num" style={{ opacity: 0.85, marginTop: 8 }}>
                امروز · ساعت ۱۶:۰۰ تا ۱۷:۳۰ · اسکای‌روم
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="chip" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
                <IconClock size={14} /> شروع تا ۴۵ دقیقه‌ی دیگر
              </span>
              <span className="chip" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
                جلسه‌ی ۳ از ۸
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '18px 0 4px' }}>
            <div className="avatar sq-52" style={{ background: 'var(--accent)', color: 'var(--n900)' }}>س</div>
            <div>
              <b style={{ fontSize: 15 }}>سارا محمدی</b>
              <div className="t-caption" style={{ opacity: 0.75 }}>دبیر فیزیک · متخصص</div>
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
            <button className="btn btn-orange" style={{ flex: 1, minWidth: 200 }} type="button" onClick={() => toast('در حال اتصال به کلاس مجازی…')}>
              <IconVideo size={19} /> ورود به کلاس
            </button>
            <button className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }} type="button" onClick={() => toast('تست میکروفون و دوربین موفق بود ✓')}>
              <IconWifi size={18} /> تست فنی
            </button>
            <Link to="/panel/chat" className="btn-icon-round" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.18)' }}>
              <IconChat size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* notifications + upcoming */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        <div className="p-card">
          <div className="head">
            <h3>اعلان‌ها</h3>
            <button type="button" className="link-more" style={{ fontSize: 13 }} onClick={() => { setAllNotifs(true); toast('همه‌ی اعلان‌ها نمایش داده شد'); }}>همه</button>
          </div>
          {notifs.map((n, i) => (
            <div className="notif-row" key={i}>
              <span className="ic"><n.icon size={18} /></span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13.5 }}>{n.title}</b>
                <div className="t-caption t-muted">{n.desc}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="t-caption t-muted">{n.time}</div>
                <button type="button" className="t-caption" style={{ color: 'var(--error)', marginTop: 4 }} onClick={() => cancelNotif(n.id)}>
                  لغو
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-card" id="upcoming">
          <div className="head">
            <h3>برنامه‌ی کلاس‌های پیش رو</h3>
            <button type="button" className="link-more" style={{ fontSize: 13 }} onClick={() => toast('تقویم کامل کلاس‌ها در پنل نمایش داده شد')}>
              تقویم کامل <IconArrowLeft size={15} />
            </button>
          </div>
          {upcoming.map((u, i) => (
            <div className="up-row" key={i}>
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
                <button type="button" className="t-caption t-muted" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }} onClick={() => cancelUpcoming(i)}>
                  ✕ لغو
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* report */}
      <div className="p-card" id="report">
        <div className="head">
          <div>
            <h3>گزارش تحصیلی · {subject}</h3>
            <div className="t-caption t-muted" style={{ marginTop: 4 }}>میانگین نمره‌ی آزمون‌ها از ۲۰</div>
          </div>
          <div className="segmented">
            {['فیزیک', 'ریاضی', 'زبان'].map((sb) => (
              <button key={sb} className={subject === sb ? 'is-active' : ''} type="button" onClick={() => setSubject(sb)}>{sb}</button>
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
                  <div style={{ height: 3, background: 'var(--n200)', borderRadius: 2, margin: '0 auto 6px', width: 32 }} />
                  <span className="lb">{c.label}</span>
                </div>
              )}
              <span className="lb">{c.m}</span>
            </div>
          ))}
        </div>

        <div className="card-soft" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', marginTop: 18 }}>
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
          <button type="button" className="link-more" style={{ fontSize: 13 }} onClick={() => toast('همه‌ی فایل‌ها و منابع نمایش داده شد')}>
            همه‌ی فایل‌ها <IconArrowLeft size={15} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {FILES.map((f) => (
            <div key={f.title} className="card-soft" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
              <button className="btn-icon-round" type="button" aria-label="دانلود" onClick={() => toast(`دانلود «${f.title}» شروع شد ↓`)}>
                <IconDownload size={17} />
              </button>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13.5 }}>{f.title}</b>
                <div className="t-caption t-muted">{f.meta}</div>
              </div>
              <span className={`chip ${f.tone}`}>{f.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
