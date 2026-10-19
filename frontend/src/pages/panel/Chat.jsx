import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { IconPin2, IconSend2, IconLock2, IconFile } from '../../panelIcons.jsx';
import { IconHeadset } from '../../components/icons.jsx';

export default function Chat() {
  const [chats, setChats] = useState(null);
  const [active, setActive] = useState(1);
  const [room, setRoom] = useState(null);
  const [text, setText] = useState('');
  const [tab, setTab] = useState('همه');
  const endRef = useRef(null);

  const loadRoom = (id) => api(`/chats/${id}`).then(setRoom);

  useEffect(() => {
    api('/chats').then((d) => setChats(d.chats));
  }, []);
  useEffect(() => {
    loadRoom(active);
    const t = setInterval(() => loadRoom(active), 4000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const t = text;
    setText('');
    await api(`/chats/${active}/messages`, { method: 'POST', body: { text: t } });
    loadRoom(active);
  };

  return (
    <div className="chat-shell">
      <aside className="chat-list">
        <b>گپ‌ها</b>
        <span className="panel-search" style={{ margin: '10px 0' }}>
          <IconHeadset size={15} />
          <input placeholder="جستجوی گروه یا پیام" />
        </span>
        {chats?.map((c) => (
          <button key={c.id} className={`chat-item${active === c.id ? ' active' : ''}`} onClick={() => setActive(c.id)}>
            <span className={`test-avatar ${c.kind === 'group' ? 'green' : c.kind === 'invite' ? 'cream' : 'mint'}`}>
              {c.title[0]}
            </span>
            <span className="ci-body">
              <b>{c.title}</b>
              <em className="muted">{c.last}</em>
            </span>
            {c.unread > 0 && <span className="unread">{faNum(c.unread)}</span>}
          </button>
        ))}
      </aside>

      <section className="chat-room">
        {room && (
          <>
            <header className="chat-head">
              <div>
                <b>{room.chat.title}</b>
                <span className="muted">
                  {faNum(room.chat.online)} نفر آنلاین از {faNum(9)} عضو
                  {room.chat.invite_code && <> · کد دعوت: {room.chat.invite_code}</>}
                </span>
              </div>
              <div className="chips">
                <button className={`chip chip-btn${tab === 'همه' ? ' active' : ''}`} onClick={() => setTab('همه')}>همه</button>
                <button className={`chip chip-btn${tab === 'اعضا' ? ' active' : ''}`} onClick={() => setTab('اعضا')}>اعضا · ۹ نفر</button>
                <button className={`chip chip-btn${tab === 'فایل‌ها' ? ' active' : ''}`} onClick={() => setTab('فایل‌ها')}>فایل‌های گروه</button>
              </div>
            </header>

            {tab === 'همه' && (
              <div className="chat-msgs">
                {room.messages.map((m) =>
                  m.system ? (
                    <div className="sys-msg" key={m.id}>
                      <b>پیام سیستمی · دعوت‌نامهٔ اختصاصی</b>
                      <p>{m.text}</p>
                    </div>
                  ) : (
                    <div className={`msg${m.role === 'شما' ? ' mine' : ''}`} key={m.id}>
                      <span className={`test-avatar ${m.color}`}>{m.letter}</span>
                      <div className="msg-body">
                        <b>{m.author} {m.role === 'استاد' && <em className="chip chip-month">استاد</em>}</b>
                        <p>{m.text}</p>
                        {m.attachment && (
                          <span className="msg-file">
                            <IconFile size={15} />
                            {m.attachment.name} · {m.attachment.size}
                          </span>
                        )}
                        <em className="msg-time">{m.day} · {m.time}</em>
                      </div>
                    </div>
                  )
                )}
                <div className="typing muted">نگار در حال نوشتن…</div>
                <div ref={endRef} />
              </div>
            )}

            {tab === 'اعضا' && (
              <div className="chat-msgs">
                {room.chat.members.map((m) => (
                  <div className="msg" key={m.name}>
                    <span className={`test-avatar ${m.color}`}>{m.letter}</span>
                    <div className="msg-body">
                      <b>{m.name}</b>
                      <p className="muted">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'فایل‌ها' && (
              <div className="chat-msgs">
                {room.chat.files.map((f) => (
                  <div className="msg" key={f.type}>
                    <span className="file-type">{f.type === 'جزوه' ? 'PDF' : f.type === 'صوت' ? 'MP3' : 'IMG'}</span>
                    <div className="msg-body">
                      <b>{faNum(f.count)} {f.type}</b>
                      <p className="muted">فایل‌های به اشتراک گذاشته‌شده در گروه</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form className="chat-composer" onSubmit={send}>
              <button type="button" className="icon-btn" aria-label="پین"><IconPin2 size={17} /></button>
              <input className="cta-input" placeholder="پیام خود را بنویسید…" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn btn-primary" type="submit"><IconSend2 size={16} /> ارسال</button>
            </form>
          </>
        )}
      </section>

      <aside className="chat-info">
        <div className="card">
          <b>قوانین ارسال پیام</b>
          <p className="muted" style={{ marginTop: 8 }}>
            فقط شرکت‌کننده‌های کلاس پیام می‌فرستند. تا ۷۲ ساعت بعد از جلسهٔ آخر فعال است.
          </p>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <b>اعلان‌ها</b>
          <ul className="info-notifs">
            <li>نگار: کسی منبع تست حسابان خوب سراغ داره</li>
            <li>سارا محمدی: جواب تمرین ۷ را گذاشتم</li>
            <li className="muted">به‌زودی: یادآوری جلسهٔ بعد</li>
          </ul>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <span className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <IconLock2 size={14} /> گزارش تخلف در گروه
          </span>
        </div>
      </aside>
    </div>
  );
}
