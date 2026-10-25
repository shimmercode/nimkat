import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { faNum, faPrice } from '../../utils/fa.js';
import { IconStar, IconCheck, IconArrowLeft, IconBulb } from '../../components/icons.jsx';
import { IconVideo, IconWallet } from '../../panelIcons.jsx';

export default function TeacherHome() {
  const [d, setD] = useState(null);
  const [replies, setReplies] = useState({});
  const [form, setForm] = useState({ name: '', subject: 'فیزیک دوازدهم', start: '', duration: '۹۰ دقیقه', sessions: 8, min_max: '۱۰ تا ۱۴ نفر', price_range: '۱۵۰ تا ۲۲۰ هزار' });
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => {
    api('/panel/teacher').then(setD).catch(() => setD(null));
  }, []);

  if (!d) return <p>در حال بارگذاری…</p>;

  const reply = async (id) => {
    const text = replies[id];
    if (!text) return;
    await api(`/teacher/reviews/${id}/reply`, { method: 'POST', body: { text } });
    api('/panel/teacher').then(setD);
  };

  const submitCourse = async (submit) => {
    const r = await api('/teacher/course-requests', { method: 'POST', body: { ...form, submit } });
    setFormMsg(submit ? 'درخواست برای بررسی مدیر آموزشی ارسال شد (معمولاً ۴۸ ساعت).' : 'پیش‌نویس ذخیره شد.');
    api('/panel/teacher').then(setD);
  };

  return (
    <div className="pd">
      <div className="pd-greet card">
        <div>
          <h2>خانم {d.user.name.split(' ')[1] || d.user.name}، روز خوبی داشته باشید</h2>
          <p className="muted">امروز {faNum(d.today.classes)} کلاس دارید · اولین کلاس ساعت ۱۶:۰۰</p>
        </div>
        <div className="pd-profile">
          <b>درآمد امروز: {faPrice(d.today.income)} تومان</b>
          <span className="muted">سهم شما {d.share || '۸۵٪'}</span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="card stat-card">
          <span className="stat-icon"><IconVideo size={20} /></span>
          <b>{faNum(d.month.sessions)}</b>
          <span className="muted">جلسات این ماه</span>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><IconStar size={20} /></span>
          <b>{faNum(String(d.month.rating).replace('.', '٫'))}</b>
          <span className="muted">میانگین امتیاز · از {faNum(d.month.reviews)} نظر</span>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><IconWallet size={20} /></span>
          <b>{faPrice(d.month.income)}</b>
          <span className="muted">درآمد مهر تا امروز · سهم شما ۸۵٪</span>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><IconCheck size={20} /></span>
          <b>{faNum(d.month.active_students)}</b>
          <span className="muted">شاگرد فعال · {faNum(d.month.new_students)} شاگرد جدید این هفته</span>
        </div>
      </div>

      <div className="pd-two">
        <div className="card" id="today">
          <div className="card-head">
            <b>کلاس‌های امروز · سه‌شنبه ۸ مهر</b>
            <span className="link-green">تقویم کاری</span>
          </div>
          <ul className="today-list">
            {d.today_classes.map((c) => (
              <li key={c.time}>
                <b className="t-time">{c.time}</b>
                <span className="up-title">{c.title}<em className="muted">{c.kind}</em></span>
                {c.state === 'done' ? (
                  <span className="chip">برگزار شد · گزارش جلسهٔ قبل ثبت شده</span>
                ) : c.state === 'live' ? (
                  <button className="btn btn-primary"><IconVideo size={16} /> ورود به کلاس</button>
                ) : (
                  <span className="chip chip-btn">جزئیات</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="card level-card" id="tip">
            <div className="card-head">
              <b>سطح و افتخارات</b>
              <span className="chip chip-month">{d.level.current}</span>
            </div>
            <div className="progress" style={{ marginTop: 6 }}>
              <span>{faNum(d.level.sessions_done)} از {faNum(d.level.sessions_need)} جلسه</span>
              <span className="progress-bar">
                <span className="progress-fill" style={{ width: `${(d.level.sessions_done / d.level.sessions_need) * 100}%` }} />
              </span>
              <span>تا {d.level.next}</span>
            </div>
            <ul className="rules-list" style={{ marginTop: 12 }}>
              {d.level.requirements.map((r) => <li key={r}><IconCheck size={14} /> {r}</li>)}
            </ul>
          </div>

          <div className="card tip-card" style={{ marginTop: 14 }}>
            <span className="tip-icon"><IconBulb size={20} /></span>
            <span>
              <b>{d.tip.title}</b>
              <p className="muted">{d.tip.text}</p>
            </span>
          </div>
        </div>
      </div>

      <div className="card" id="newcourse" style={{ marginTop: 18 }}>
        <div className="card-head">
          <b>درخواست برگزاری دورهٔ گروهی</b>
          <span className="muted">بعد از تأیید مدیر آموزشی در سایت منتشر می‌شود · معمولاً ۴۸ ساعت</span>
        </div>
        <div className="course-form">
          <label>نام دوره<input className="cta-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="جمع‌بندی نیمسال اول" /></label>
          <label>درس<select className="cta-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option>فیزیک دوازدهم</option><option>فیزیک یازدهم</option><option>فیزیک دهم</option></select></label>
          <label>شروع<input className="cta-input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} placeholder="۱ آبان" /></label>
          <label>مدت هر جلسه<select className="cta-input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}><option>۹۰ دقیقه</option><option>۶۰ دقیقه</option><option>۱۲۰ دقیقه</option></select></label>
          <label>تعداد جلسات<input className="cta-input" type="number" value={form.sessions} onChange={(e) => setForm({ ...form, sessions: Number(e.target.value) })} /></label>
          <label>حداقل / حداکثر فراگیر<input className="cta-input" value={form.min_max} onChange={(e) => setForm({ ...form, min_max: e.target.value })} /></label>
          <label>بازهٔ قیمت پیشنهادی<input className="cta-input" value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} /></label>
        </div>
        <p className="muted" style={{ fontSize: 12 }}>قیمت نهایی را مدیر آموزشی در همین بازه تعیین می‌کند.</p>
        <div className="cta-row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={() => submitCourse(true)}>ارسال برای بررسی</button>
          <button className="btn btn-outline" onClick={() => submitCourse(false)}>ذخیرهٔ پیش‌نویس</button>
        </div>
        {formMsg && <p className="cta-msg ok">{formMsg}</p>}
      </div>

      <div className="pd-two" style={{ marginTop: 18 }}>
        <div className="card" id="reviews">
          <div className="card-head">
            <b>نظرات جدید</b>
            <span className="seat-badge">۱ بی‌پاسخ</span>
          </div>
          {d.reviews.map((r) => (
            <div className="review-row" key={r.id}>
              <span className={`test-avatar ${r.color}`}>{r.letter}</span>
              <span className="rv-body">
                <b>{r.author} <em className="muted">· {r.class_label} · {r.date_label}</em></b>
                <p className="muted">{r.text}</p>
                {r.replied ? (
                  <p className="tp-reply">پاسخ داده‌اید: {r.reply}</p>
                ) : (
                  <div className="cta-row" style={{ marginTop: 8 }}>
                    <button className="btn btn-outline" onClick={() => reply(r.id)}>ارسال</button>
                    <input className="cta-input" placeholder="پاسخ کوتاه به این نظر…" value={replies[r.id] || ''} onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })} />
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="card" id="settlements">
          <div className="card-head">
            <b>تسویه‌حساب‌ها</b>
            <span className="muted">شبا: {d.sheba}</span>
          </div>
          <table className="settle-table">
            <thead>
              <tr><th>شرح</th><th>مبلغ (تومان)</th><th>وضعیت</th><th>تاریخ</th></tr>
            </thead>
            <tbody>
              {d.settlements.map((s) => (
                <tr key={s.id}>
                  <td>{s.desc}</td>
                  <td>{faPrice(s.amount)}</td>
                  <td><span className={`chip ${s.status === 'واریز شد' ? 'chip-btn active' : ''}`}>{s.status}</span></td>
                  <td>{s.date_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-outline btn-block" style={{ marginTop: 14 }}>
            مشاهدهٔ کامل امور مالی
            <IconArrowLeft size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
