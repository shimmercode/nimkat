'use client';
import { useState, useRef, useEffect } from 'react';
import {
  IconSearch, IconPlus, IconDots, IconLock, IconSend, IconClip, IconFile, IconShield,
  IconFlag, IconUsers, IconChat, IconBell, IconCheck,
} from '../../components/icons.jsx';
import { faNum } from '../../utils/fa.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { toast } from '../../utils/toast.js';

const CONVS = [
  {
    group: 'کلاس‌های من',
    items: [
      { id: 1, letter: 'ف', color: '', title: 'فیزیک یازدهم · گروه کلاس', last: 'سارا محمدی: تمرین رو گذا…', time: '۱۳:۲۲', unread: '۱۳', lock: true, active: true },
      { id: 2, letter: 'ز', color: 'green', title: 'زبان B1 · شنبه‌ها', last: 'پارسا: Unit 3 رو کسی داره؟', time: '۱۱:۱۰', lock: true },
    ],
  },
  {
    group: 'مقطع تحصیلی',
    items: [
      { id: 3, letter: 'م', color: 'tint-green', title: 'متوسطه دوم · ریاضی', last: 'نگار: کسی منبع تست حسابان خوب سراغ داره', time: '۱۳:۰۹', unread: '۱۲' },
    ],
  },
  {
    group: 'دعوت‌محور',
    items: [
      { id: 4, letter: 'ک', color: 'tint-orange', title: 'کنکوری‌های ۱۴۰۴', last: 'برنامه‌ی هفتگی جدید پین شد', time: 'دیروز', lock: true },
      { id: 5, letter: 'ش', color: 'dark', title: 'گپ اختصاصی شب امتحان', last: 'دعوت‌نامه برای شما ارسال شده', time: '۱ روز' },
    ],
  },
  {
    group: 'عمومی',
    items: [
      { id: 6, letter: 'ن', color: 'gray', title: 'گپ عمومی نیمکت', last: 'قوانین جدید گروه‌ها را بخوانید', time: '۱۲ روز' },
    ],
  },
];

const MEMBERS = [
  { name: 'سارا محمدی', letter: 'س', color: '', role: 'استاد · مدیر گروه', online: true },
  { name: 'حسین نوری', letter: 'ح', color: 'green', role: 'شاگرد', online: true },
  { name: 'نگار کاظمی', letter: 'ن', color: 'tint-orange', role: 'شاگرد', online: true },
  { name: 'پارسا کیانی', letter: 'پ', color: 'tint-green', role: 'شاگرد', online: false },
  { name: 'علی رضایی', letter: 'ع', color: 'tint-green', role: 'شما', online: true },
];

const INITIAL = [
  { kind: 'day', text: 'امروز، سه‌شنبه ۷ مهر' },
  {
    kind: 'other', who: 'حسین نوری', letter: 'ح', color: 'green', time: '۱۳:۲۹',
    text: 'بچه‌ها تمرین ۷ صفحه‌ی ۳۲ رو کسی حل کرد؟ جهت میدان رو نمی‌فهمم',
  },
  {
    kind: 'me', time: '۱۳:۳۲',
    text: 'من حل کردم ولی مطمئن نیستم، بار منفی جهت رو عوض می‌کنه دیگه؟',
  },
  {
    kind: 'other', who: 'سارا محمدی', role: 'استاد', letter: 'س', color: '', time: '۱۳:۴۰',
    text: 'دقیقاً. بردار میدان همیشه از دید بار مثبت آزمون تعریف می‌شه. جواب کامل رو گذاشتم، اول خودتون یک بار دیگه امتحان کنید.',
    file: { name: 'جواب تمرین‌های ۱ تا ۱۸.pdf', meta: '۲ مگابایت · PDF' },
  },
  {
    kind: 'me', time: '۱۳:۴۵',
    text: 'ممنون خانم محمدی، الان فهمیدم کجا رو اشتباه می‌رفتم',
  },
  {
    kind: 'system',
    title: 'دعوت‌نامه‌ی اختصاصی',
    text: 'علی عزیز، به پاس حضور منظم و امتیاز وفاداری بالای شما، به «گپ اختصاصی شب امتحان فیزیک» با حضور خانم محمدی دعوت شده‌اید. مرور نکات کلیدی و سؤالات احتمالی نوبت اول.',
    code: 'NK-8F421',
  },
  { kind: 'typing', who: 'نگار', letter: 'ن', color: 'tint-orange' },
];

export default function Chat() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState(INITIAL);
  const [text, setText] = useState('');
  const [conv, setConv] = useState(1);
  const [tab, setTab] = useState('گپ‌ها');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const [joined, setJoined] = useState(false);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m.filter((x) => x.kind !== 'typing'), { kind: 'me', time: 'همین حالا', text: t }]);
    if (user) {
      api(`/chats/${conv || 1}/messages`, { method: 'POST', body: { text: t } }).catch(() => {});
    }
    setText('');
  };

  return (
    <div className="chat-wrap">
      {/* conversations (right) */}
      <div className="chat-side-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 'calc(100vh - 140px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 19 }}>نیم‌چت</h3>
          <button className="btn-icon-round" type="button" aria-label="گفتگوی جدید" onClick={() => toast('برای ساخت گپ جدید با مدیر گروه در تماس باشید')}>
            <IconPlus size={18} />
          </button>
        </div>

        <div className="segmented" style={{ width: '100%' }}>
          {['گپ‌ها', 'اساتید‌ها', 'اعلان‌ها'].map((t) => (
            <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)} style={{ flex: 1, justifyContent: 'center' }}>
              {t}
            </button>
          ))}
        </div>

        <div className="panel-search" style={{ maxWidth: 'none' }}>
          <IconSearch size={16} style={{ color: 'var(--n500)' }} />
          <input id="chat-search" placeholder="جستجوی گروه یا پیام" />
        </div>

        <div className="conv-list">
          {CONVS.map((g) => (
            <div key={g.group}>
              <div className="side-group" style={{ padding: '10px 4px 6px' }}>{g.group}</div>
              {g.items.map((c) => (
                <div key={c.id} className={`conv ${conv === c.id ? 'is-active' : ''}`} onClick={() => setConv(c.id)}>
                  <div className={`avatar sq-52 ${c.color}`}>{c.letter}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</b>
                      {c.lock && <IconLock size={12} style={{ color: 'var(--n500)', flex: 'none' }} />}
                    </div>
                    <div className="t-caption t-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                  </div>
                  <div style={{ textAlign: 'left', flex: 'none' }}>
                    <div className="t-caption t-muted num">{c.time}</div>
                    {c.unread && <span className="side-badge" style={{ marginTop: 6 }}>{c.unread}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* chat main */}
      <div className="chat-main">
        <div className="chat-head">
          <div className="avatar sq-52">ف</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 15 }}>فیزیک یازدهم · گروه کلاس</b>
            <div className="t-caption t-muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="dot-online" /> ۴ نفر آنلاین از ۹ عضو
            </div>
          </div>
          <span className="chip outline"><IconLock size={13} /> خصوصی-محور</span>
          <button className="btn-icon-round" type="button" onClick={() => document.getElementById('chat-search')?.focus()}><IconSearch size={17} /></button>
          <button className="btn-icon-round" type="button" onClick={() => toast('تنظیمات گپ: اعلان‌ها، اعضا و گزارش‌ها')}><IconDots size={17} /></button>
        </div>

        <div className="chat-body">
          {msgs.map((m, i) => {
            if (m.kind === 'day') {
              return (
                <div key={i} className="t-caption t-muted" style={{ alignSelf: 'center', fontWeight: 700 }}>
                  {m.text}
                </div>
              );
            }
            if (m.kind === 'system') {
              return (
                <div key={i} className="sys-msg">
                  <b style={{ color: 'var(--accent)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <IconFile size={16} /> {m.title}
                  </b>
                  <p style={{ lineHeight: 2.1 }}>{m.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                    <span className="t-caption num">کد دعوت: {m.code}</span>
                    <span className="t-caption" style={{ opacity: 0.7 }}>ظرفیت باقی‌مانده: ۵ نفر</span>
                    {joined ? (
                      <span className="chip soft-green">به گپ پیوستید ✓</span>
                    ) : (
                      <button className="btn btn-orange btn-sm" type="button" onClick={() => { setJoined(true); toast('به گپ پیوستید ✓'); }}>
                        پیوستن به گپ
                      </button>
                    )}
                  </div>
                </div>
              );
            }
            if (m.kind === 'typing') {
              return (
                <div key={i} className="msg other" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end' }}>
                  <div className={`avatar sq-40 ${m.color}`}>{m.letter}</div>
                  <span className="t-caption t-muted">{m.who} در حال نوشتن…</span>
                </div>
              );
            }
            return (
              <div key={i} className={`msg ${m.kind === 'me' ? 'me' : 'other'}`}>
                {m.kind === 'other' && (
                  <div className="who">
                    {m.who}
                    {m.role && <span className="role">{m.role}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  {m.kind === 'other' && <div className={`avatar sq-40 ${m.color}`}>{m.letter}</div>}
                  <div>
                    <div className="bubble-m">{m.text}</div>
                    {m.file && (
                      <div className="file-msg" style={{ marginTop: 8 }}>
                        <IconFile size={22} style={{ color: 'var(--error)' }} />
                        <div style={{ flex: 1 }}>
                          <b style={{ fontSize: 13 }}>{m.file.name}</b>
                          <div className="t-caption t-muted">{m.file.meta}</div>
                        </div>
                        <button className="btn-icon-round" type="button" onClick={() => toast('دانلود فایل شروع شد ↓')}>↓</button>
                      </div>
                    )}
                  </div>
                  {m.kind === 'me' && <div className="avatar sq-40 tint-green">ع</div>}
                </div>
                <div className="meta">
                  {m.kind === 'me' && <IconCheck size={12} style={{ color: 'var(--secondary)' }} />}
                  <span className="num">{m.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="chat-input">
          <button className="btn-icon-round round-full" style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }} type="button" onClick={send}>
            <IconSend size={18} />
          </button>
          <input
            placeholder="پیام خود را بنویسید…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn-icon-round round-full" type="button" onClick={() => document.getElementById('chat-attach')?.click()}>
            <IconClip size={18} />
          </button>
          <input id="chat-attach" type="file" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && toast(`پیوست «${e.target.files[0].name}» ارسال شد ✓`)} />
        </div>
      </div>

      {/* group info (left) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="chat-side-panel" style={{ textAlign: 'center' }}>
          <div className="avatar sq-88" style={{ margin: '6px auto 12px', fontSize: 30 }}>ف</div>
          <b style={{ fontSize: 15 }}>فیزیک یازدهم · گروه کلاس</b>
          <div className="t-caption t-muted" style={{ marginTop: 6, lineHeight: 1.9 }}>
            ساخته‌شده خودکار برای ۹ شرکت‌کننده‌ی کلاس
          </div>

          <div
            className="card-soft"
            style={{ marginTop: 16, padding: 16, textAlign: 'right' }}
          >
            <b style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--primary)' }}>
              <IconShield size={16} /> قوانین ارسال پیام
            </b>
            <p className="t-caption t-muted" style={{ lineHeight: 2.1, marginTop: 8 }}>
              فقط شرکت‌کننده‌های کلاس پیام می‌فرستند. تا <b style={{ color: 'var(--accent-800)' }}>۷۲ ساعت بعد از
              جلسه‌ی آخر</b> فعال است.
            </p>
            <div className="progress" style={{ marginTop: 10 }}>
              <i style={{ width: '55%' }} />
            </div>
            <div className="t-caption t-muted" style={{ marginTop: 6 }}>۳۹ ساعت باقی‌مانده</div>
          </div>
        </div>

        <div className="chat-side-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <b style={{ fontSize: 14.5 }}>اعضا · ۹ نفر</b>
            <button type="button" className="chip" onClick={() => toast('اعضای آنلاین: ۴ نفر از ۹ نفر')}>همه</button>
          </div>
          <div style={{ marginTop: 10 }}>
            {MEMBERS.map((m) => (
              <div className="member-row" key={m.name}>
                <span className={m.online ? 'dot-online' : 'dot-offline'} />
                <div className={`avatar sq-40 ${m.color}`}>{m.letter}</div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 12.5 }}>{m.name}</b>
                  <div className="t-caption t-muted">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-side-panel">
          <b style={{ fontSize: 14.5 }}>فایل‌های گروه</b>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <span className="chip outline"><IconFile size={13} /> ۴ جزوه</span>
            <span className="chip outline"><IconFile size={13} /> ۲ صوت</span>
            <span className="chip outline"><IconFile size={13} /> ۷ عکس</span>
          </div>
          <button type="button" className="t-caption" style={{ color: 'var(--error)', display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 16, fontWeight: 700 }} onClick={() => toast('گزارش تخلف ثبت شد؛ تیم پشتیبانی بررسی می‌کند ✓')}>
            <IconFlag size={14} /> گزارش تخلف در گروه
          </button>
        </div>
      </div>
    </div>
  );
}
