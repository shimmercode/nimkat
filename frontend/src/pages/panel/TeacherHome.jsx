import { useState } from 'react';
import { api, getToken } from '../../api.js';
import { toast } from '../../utils/toast.js';
import {
  IconWallet, IconBook, IconStar, IconUsers, IconBulb, IconUpload, IconPlus,
  IconArrowLeft, IconVideo, IconCheck, IconInfo, IconCap, IconMedal, IconTarget,
  IconCrown, IconBook as BookIcon,
} from '../../components/icons.jsx';
import { faNum, faPrice } from '../../utils/fa.js';

const TODAY = [
  {
    time: '۱۰:۰۰', end: '۱۱:۳۰', title: 'ریاضی نهم · جمع‌بندی', sub: 'گروهی · ۱۰ نفر',
    state: 'done', note: 'گزارش جلسه‌ی قبل ثبت شده',
  },
  {
    time: '۱۲:۰۰', end: '۱۳:۳۰', title: 'فیزیک دوازدهم · آرین صالحی', sub: 'آنلاین',
    state: 'done', note: 'گزارش جلسه‌ی قبل ثبت شده',
  },
  {
    time: '۱۵:۳۰', end: '۱۷:۰۰', title: 'فیزیک یازدهم · علی رضایی', sub: 'خصوصی · آنلاین',
    state: 'next', action: true,
  },
  {
    time: '۱۷:۳۰', end: '۱۹:۰۰', title: 'فیزیک یازدهم · دوستانه ۳ نفر', sub: 'آنلاین',
    state: 'soon',
  },
  {
    time: '۱۹:۳۰', end: '۲۱:۰۰', title: 'رفع اشکال · هستی احمدی', sub: 'حضوری · منطقه ۳',
    state: 'soon',
  },
];

const REVIEWS = [
  {
    name: 'زهرا کریمی', letter: 'ز', color: 'green', role: 'فیزیک دهم', stars: 4, answered: false,
    text: 'نمره‌ی نوبت اولم از ۱۴ به ۱۸ رسید. فقط کاش جزوه‌ها زودتر فرستاده شوند.',
  },
  {
    name: 'مهدی صالحی', letter: 'م', color: 'tint-orange', role: 'والد', stars: 5, answered: true,
    text: 'گزارش بعد از هر جلسه خیلی دقیق است.',
  },
];

const SETTLEMENTS = [
  { date: '۱۵ آذر ۱۴۰۴', desc: 'تسویه‌ی دوره‌ای · ۲۴ جلسه', amount: 5120000, status: 'واریز شد' },
  { date: '۵ آذر ۱۴۰۴', desc: 'تسویه‌ی دوره‌ای · در حال محاسبه', amount: 7780000, status: 'در انتظار' },
  { date: '۵ آبان ۱۴۰۴', desc: 'تسویه‌ی دوره‌ای · ۲۱ جلسه', amount: 6985000, status: 'واریز شد' },
];

export default function TeacherHome() {
  const [tipOpen, setTipOpen] = useState(true);
  const [reqStatus, setReqStatus] = useState('پیش‌نویس');
  const [replied, setReplied] = useState({});
  const [replyText, setReplyText] = useState({});
  const [reqForm, setReqForm] = useState({
    'درس': 'فیزیک دوازدهم',
    'نام دوره': 'جمع‌بندی نیمسال اول',
    'تعداد جلسات': '۶',
    'شروع': '۱۴ آذر ۱۴۰۴',
    'حداقل / حداکثر فراگیر': '۸ تا ۱۴ نفر',
    'مدت هر جلسه': '۹۰ دقیقه',
    'بازه‌ی قیمت پیشنهادی': '۱۵۰ تا ۲۲۰ هزار',
  });

  const submitRequest = async (status) => {
    if (!getToken()) { toast('برای ثبت درخواست اول وارد شوید', 'err'); return; }
    try {
      await api('/teacher/course-requests', {
        method: 'POST',
        body: {
          subject: reqForm['درس'],
          title: reqForm['نام دوره'],
          sessions: reqForm['تعداد جلسات'],
          start_date: reqForm['شروع'],
          capacity: reqForm['حداقل / حداکثر فراگیر'],
          duration: reqForm['مدت هر جلسه'],
          price_range: reqForm['بازه‌ی قیمت پیشنهادی'],
          status,
        },
      });
      setReqStatus(status === 'submitted' ? 'در حال بررسی' : 'پیش‌نویس ذخیره شد');
      toast(status === 'submitted' ? 'درخواست دوره برای بررسی ارسال شد ✓' : 'پیش‌نویس ذخیره شد ✓');
    } catch (e) {
      toast(e.message || 'خطا در ثبت درخواست', 'err');
    }
  };

  const sendReply = async (i) => {
    const text = (replyText[i] || '').trim();
    if (!text) { toast('متن پاسخ را بنویسید', 'err'); return; }
    try {
      await api(`/teacher/reviews/${i + 1}/reply`, { method: 'POST', body: { text } });
      setReplied((r) => ({ ...r, [i + 1]: true }));
      toast('پاسخ شما ثبت شد ✓');
    } catch (e) {
      toast(e.message || 'خطا در ثبت پاسخ', 'err');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h3">خانم محمدی، روز خوبی داشته باشید</h1>
          <p className="t-small t-muted num" style={{ marginTop: 6 }}>
            ۲ کلاس امروز داری · جلسه‌ی بعدی ساعت ۱۶:۰۰ · فیزیک یازدهم · علی رضایی
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" type="button" onClick={() => document.getElementById('handout-file')?.click()}>
            <IconUpload size={18} /> آپلود جزوه
          </button>
          <input id="handout-file" type="file" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && toast(`جزوه‌ی «${e.target.files[0].name}» آپلود شد ✓`)} />
          <button className="btn btn-primary" type="button" onClick={() => document.getElementById('course-request')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            درخواست دوره‌ی جدید + <IconPlus size={16} />
          </button>
        </div>
      </div>

      {/* نیم‌پند */}
      {tipOpen && (
        <div className="tip-band" id="tip">
          <div className="bulb"><IconBulb size={28} /></div>
          <div style={{ flex: 1 }}>
            <span className="chip dark" style={{ background: 'rgba(255,255,255,.12)', color: 'var(--accent)', marginBottom: 8, display: 'inline-flex' }}>
              نیم‌پند روز · نکته‌ی ۴۲
            </span>
            <b style={{ display: 'block', fontSize: 16, lineHeight: 2 }}>
              پنج دقیقه‌ی اول را به سؤال شاگرد بدهید، نه به درس جدید.
            </b>
            <p style={{ opacity: 0.8, fontSize: 13.5, marginTop: 6, lineHeight: 2 }}>
              شاگردی که احساس کند سؤال جلسه‌ی قبلش شنیده شده، ۳ برابر بیشتر کلاس را تمدید می‌کند.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <button className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }} type="button" onClick={() => toast('بانک نکات: ۴۲ نکته‌ی تدریس · به‌زودی کامل‌تر می‌شود')}>
              <BookIcon size={17} /> بانک نکات
            </button>
            <button type="button" style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }} onClick={() => setTipOpen(false)}>
              بستن ✕
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="p-grid-4">
        <div className="kpi">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="ic"><IconWallet size={22} /></span>
            <span className="coin-pill green">امروز ۱۸+٪</span>
          </div>
          <span className="l">درآمد مهر تا امروز</span>
          <span className="v num">۱۲٬۴۵۰٬۰۰۰</span>
          <span className="sub">تومان · سهم شما ۷۸٪</span>
        </div>
        <div className="kpi">
          <span className="ic orange"><IconBook size={22} /></span>
          <span className="l">جلسات این ماه</span>
          <span className="v num">۲۳</span>
          <span className="sub">۹ جلسه‌ی امروز</span>
        </div>
        <div className="kpi">
          <span className="ic gray"><IconStar size={22} /></span>
          <span className="l">میانگین امتیاز</span>
          <span className="v num">۴٫۹</span>
          <span className="sub">از ۳۲۰ نظر</span>
        </div>
        <div className="kpi">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="ic"><IconUsers size={22} /></span>
            <span className="coin-pill green">امروز ۴+</span>
          </div>
          <span className="l">شاگرد فعال</span>
          <span className="v num">۲۸</span>
          <span className="sub">۴ شاگرد جدید این هفته</span>
        </div>
      </div>

      {/* level + today's classes */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* levels */}
        <div className="p-card" style={{ gridColumn: 2, gridRow: 1 }}>
          <div className="head">
            <h3>سطح و افتخارات</h3>
            <span className="chip soft-green">متخصص</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            {[
              ['مربی', IconCap], ['کارشناس', IconCap], ['متخصص', IconMedal], ['استاد ارشد', IconStar], ['هیئت علمی', IconCrown],
            ].map(([l, Ic], i) => (
              <div key={l} style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: 46, height: 46, borderRadius: 'var(--r-md)', margin: '0 auto 8px',
                    display: 'grid', placeItems: 'center',
                    background: i === 2 ? 'var(--primary)' : i < 2 ? 'var(--secondary-50)' : 'var(--n70)',
                    color: i === 2 ? '#fff' : i < 2 ? 'var(--primary)' : 'var(--n500)',
                  }}
                >
                  <Ic size={20} />
                </div>
                <span className="t-caption" style={{ color: i === 2 ? 'var(--primary)' : 'var(--muted)' }}>{l}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
              <span className="t-muted">تا استاد ارشد</span>
              <span className="num">۱۴۸ از ۲۰۰ جلسه</span>
            </div>
            <div className="progress green" style={{ marginTop: 8 }}>
              <i style={{ width: '74%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {[
              ['میانگین امتیاز بالای ۴٫۷', true],
              ['حضور به‌موقع بالای ۹۵٪', true],
              ['۲۰۰ جلسه‌ی موفق', false],
              ['یک دوره‌ی گروهی تأییدشده', false],
            ].map(([t, done]) => (
              <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
                {done ? (
                  <IconCheck size={17} style={{ color: 'var(--secondary)' }} />
                ) : (
                  <IconInfo size={16} style={{ color: 'var(--n500)' }} />
                )}
                <span style={{ color: done ? 'var(--ink)' : 'var(--muted)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* today */}
        <div className="p-card" id="today" style={{ gridColumn: 1, gridRow: 1 }}>
          <div className="head">
            <h3>کلاس‌های امروز · شنبه ۷ مهر</h3>
            <button type="button" className="link-more" style={{ fontSize: 13 }} onClick={() => toast('تقویم کاری: شنبه تا چهارشنبه · ۹ تا ۱۹')}>
              تقویم کاری <IconArrowLeft size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TODAY.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: i < TODAY.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 84, textAlign: 'center' }}>
                  <b className="num" style={{ fontSize: 13.5 }}>{c.time}</b>
                  <div className="t-caption t-muted num">{c.end}</div>
                </div>
                <span
                  style={{
                    width: 10, height: 10, borderRadius: '50%', flex: 'none',
                    background: c.state === 'next' ? 'var(--accent)' : c.state === 'done' ? 'var(--n200)' : 'var(--secondary)',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>{c.title}</b>
                  <div className="t-caption t-muted">{c.sub}</div>
                </div>
                {c.action ? (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => toast('در حال اتصال به کلاس مجازی…')}>
                    <IconVideo size={15} /> ورود به کلاس
                  </button>
                ) : c.state === 'done' ? (
                  <div style={{ textAlign: 'left' }}>
                    <span className="chip">برگزار شد</span>
                    <div className="t-caption t-muted" style={{ marginTop: 4 }}>{c.note}</div>
                  </div>
                ) : (
                  <span className="chip soft-green">به‌زودی</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* course request */}
      <div className="p-card" id="course-request">
        <div className="head">
          <div>
            <h3>درخواست برگزاری دوره‌ی گروهی</h3>
            <div className="t-caption t-muted" style={{ marginTop: 4 }}>
              بعد از تأیید مدیر آموزشی در سایت منتشر می‌شود · معمولاً ۴۸ ساعت
            </div>
          </div>
          <span className="chip soft-orange">{reqStatus}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            ['درس', 'فیزیک دوازدهم'],
            ['نام دوره', 'جمع‌بندی نیمسال اول'],
            ['تعداد جلسات', '۶'],
            ['شروع', '۱۴ آذر ۱۴۰۴'],
            ['حداقل / حداکثر فراگیر', '۸ تا ۱۴ نفر'],
            ['مدت هر جلسه', '۹۰ دقیقه'],
            ['بازه‌ی قیمت پیشنهادی', '۱۵۰ تا ۲۲۰ هزار'],
          ].map(([l, v]) => (
            <label key={l} className="field">
              <span className="field-label">{l}</span>
              <input className="input" defaultValue={v} onChange={(e) => setReqForm((f) => ({ ...f, [l]: e.target.value }))} />
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" type="button" onClick={() => submitRequest('submitted')}>ارسال برای بررسی</button>
            <button className="btn btn-outline-green" type="button" onClick={() => submitRequest('draft')}>ذخیره‌ی پیش‌نویس</button>
          </div>
          <span className="field-hint">
            <IconInfo size={14} /> قیمت نهایی را مدیر آموزشی در همین بازه تعیین می‌کند.
          </span>
        </div>
      </div>

      {/* reviews + settlements */}
      <div className="p-grid-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="p-card" id="reviews" style={{ gridColumn: 2, gridRow: 1 }}>
          <div className="head">
            <h3>نظرات جدید</h3>
            <span className="chip soft-orange">۱ بی‌پاسخ</span>
          </div>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{ paddingTop: i ? 18 : 0, marginTop: i ? 18 : 0, borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className={`avatar sq-52 ${r.color}`}>{r.letter}</div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{r.name}</b>
                  <div className="t-caption t-muted">{r.role}</div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <IconStar key={k} size={13} style={{ color: k < r.stars ? 'var(--accent)' : 'var(--n200)' }} />
                  ))}
                </div>
              </div>
              <p className="t-small" style={{ lineHeight: 2, marginTop: 10, color: 'var(--muted)' }}>{r.text}</p>
              {(r.answered || replied[i + 1]) ? (
                <div className="t-caption" style={{ color: 'var(--secondary)', display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 10 }}>
                  <IconCheck size={14} /> پاسخ داده‌اید
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <input className="input" placeholder="پاسخ کوتاه به این نظر…" style={{ flex: 1 }} value={replyText[i + 1] || ''} onChange={(e) => setReplyText((t) => ({ ...t, [i + 1]: e.target.value }))} />
                  <button className="btn btn-soft-green" type="button" onClick={() => sendReply(i)}>ارسال</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-card" id="settlements" style={{ gridColumn: 1, gridRow: 1 }}>
          <div className="head">
            <h3>تسویه‌حساب‌ها</h3>
            <span className="t-caption t-muted num">شبا: IR۰۶ ۰۱۷۰ ···· ۴۲۱۸ · بانک ملی</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>شرح</th>
                <th>مبلغ (تومان)</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {SETTLEMENTS.map((s) => (
                <tr key={s.date}>
                  <td className="num t-muted">{s.date}</td>
                  <td>{s.desc}</td>
                  <td className="num"><b>{faPrice(s.amount)}</b></td>
                  <td>
                    <span className={`chip ${s.status === 'واریز شد' ? 'soft-green' : 'soft-orange'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
