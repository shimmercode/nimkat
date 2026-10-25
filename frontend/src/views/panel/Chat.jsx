'use client';
import { useEffect, useRef, useState } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { faNum } from '../../utils/fa.js';
import {
  IconSearch, IconSend, IconFlag, IconClip, IconDots, IconX, IconCheck, IconFile, IconBell,
} from '../../components/icons.jsx';

const TABS = [
  ['all', 'همه'],
  ['class', 'کلاس‌ها'],
  ['private', 'اساتید و خصوصی'],
  ['community', 'گروه‌ها'],
  ['notifications', 'اعلان‌ها'],
];

const REPORT_REASONS = [
  'محتوای نامناسب یا خارج از چارچوب آموزشی',
  'تبلیغات، اسپم یا لینک غیرمرتبط',
  'رفتار نامحترمانه یا مزاحمت',
  'سایر موارد',
];

function parseAttachmentFromText(text = '') {
  const match = String(text).match(/\[پیوست فایل:\s*([^\]]+)\]\((\/api\/materials\/[a-zA-Z0-9_-]+\/download)\)/);
  if (!match) return { cleanText: text, attachment: null };
  const cleanText = String(text).replace(match[0], '').trim();
  return {
    cleanText: cleanText || `فایل پیوست‌شده: ${match[1]}`,
    attachment: { name: match[1], url: match[2] },
  };
}

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [available, setAvailable] = useState([]);
  const [active, setActive] = useState('');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [typing, setTyping] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [connState, setConnState] = useState('connecting');

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    notifyAll: true,
    sound: true,
    preview: true,
    teacherOnly: false,
  });

  // Report modal state
  const [reportTarget, setReportTarget] = useState(null);
  const [reportCategory, setReportCategory] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');

  // Attachment picker state
  const [attachOpen, setAttachOpen] = useState(false);
  const [materials, setMaterials] = useState([]);

  const activeRef = useRef('');
  const searchRef = useRef('');
  const roomLoadSeq = useRef(0);
  const roomsLoadSeq = useRef(0);
  const typingTimer = useRef(null);
  const retryKey = useRef({ room: '', text: '', key: '' });
  activeRef.current = active;
  searchRef.current = q;

  async function loadRooms(pickFirst = false) {
    const seq = ++roomsLoadSeq.current;
    const d = await api('/chats');
    if (seq !== roomsLoadSeq.current) return;
    setRooms(d.chats || []);
    setInvitations(d.invitations || []);
    setAvailable(d.available || []);
    if ((pickFirst || !activeRef.current) && d.chats?.[0]) {
      selectRoom(d.chats[0].id, '');
    }
  }

  async function selectRoom(id, search = searchRef.current) {
    if (!id) return;
    const seq = ++roomLoadSeq.current;
    setActive(id);
    const d = await api(`/chats/${id}?q=${encodeURIComponent(search)}`);
    if (seq !== roomLoadSeq.current) return;
    setRoom({ ...d.chat, closed: d.closed });
    setMessages(d.messages || []);
    setMembers(d.members || []);
    if (d.settings) setChatSettings(d.settings);
    const last = d.messages?.at(-1);
    if (last) {
      await api(`/chats/${id}/read`, { method: 'POST', body: { messageId: last.id } }).catch(() => {});
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, unread: 0, last_read_id: Math.max(r.last_read_id || 0, last.id) } : r)));
    }
  }

  useEffect(() => {
    let alive = true;
    let stream;
    loadRooms(true).catch((e) => {
      if (alive) setError(e.message);
    });
    function connect() {
      setConnState('connecting');
      stream = new EventSource('/api/events');
      stream.onopen = () => {
        if (alive) setConnState('connected');
      };
      stream.onerror = () => {
        if (alive) setConnState('reconnecting');
      };
      stream.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data);
          if (event.type === 'connected') setConnState('connected');
          if (event.type === 'session-expired') {
            stream.close();
            api('/auth/me')
              .then(() => {
                if (alive) {
                  connect();
                  loadRooms();
                  if (activeRef.current) selectRoom(activeRef.current);
                }
              })
              .catch(() => {
                if (alive) setError('نشست شما منقضی شد؛ دوباره وارد شوید.');
              });
          }
          if (event.type === 'chat.rooms') loadRooms().catch(() => {});
          if (
            (event.type === 'chat.message' || event.type === 'chat.read') &&
            event.roomId === activeRef.current
          ) {
            selectRoom(activeRef.current).catch(() => {});
          }
          if (event.type === 'chat.typing' && event.roomId === activeRef.current) {
            setTyping(`${event.name} در حال نوشتن…`);
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setTyping(''), Math.max(500, event.expiresAt - Date.now()));
          }
        } catch {}
      };
    }
    connect();
    return () => {
      alive = false;
      clearTimeout(typingTimer.current);
      stream?.close();
    };
  }, []);

  // Close modals on Escape
  useEffect(() => {
    if (!settingsOpen && !reportTarget && !attachOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setReportTarget(null);
        setAttachOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, reportTarget, attachOpen]);

  async function send(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !active || busy) return;
    setBusy(true);
    setError('');
    const key =
      retryKey.current.room === active && retryKey.current.text === clean
        ? retryKey.current.key
        : crypto.randomUUID();
    retryKey.current = { room: active, text: clean, key };
    try {
      await api(`/chats/${active}/messages`, { method: 'POST', body: { text: clean, clientId: key } });
      retryKey.current = { room: '', text: '', key: '' };
      setText('');
      await selectRoom(active);
      await loadRooms();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    if (!active || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await api(`/chats/${active}/settings`, {
        method: 'PUT',
        body: chatSettings,
      });
      if (r.settings) setChatSettings(r.settings);
      try {
        localStorage.setItem(`nimkat_chat_settings_${active}`, JSON.stringify(chatSettings));
      } catch {}
      setSettingsOpen(false);
      setNotice('تنظیمات اعلان و گفتگوی این اتاق ذخیره شد ✓');
    } catch (err) {
      setError(err.message || 'خطا در ذخیره تنظیمات گفتگو');
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!reportTarget || !active || busy) return;
    const fullReason = `${reportCategory}${reportNote.trim() ? ` — ${reportNote.trim()}` : ''}`.trim();
    if (fullReason.length < 3) {
      setError('لطفاً دلیل گزارش را مشخص کنید.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(`/chats/${active}/messages/${reportTarget.id}/report`, {
        method: 'POST',
        body: { reason: fullReason },
      });
      setReportTarget(null);
      setReportNote('');
      setNotice('گزارش پیام برای بررسی مدیر ثبت شد ✓');
    } catch (err) {
      setError(err.message || 'خطا در ثبت گزارش');
    } finally {
      setBusy(false);
    }
  }

  async function remove(messageId) {
    setBusy(true);
    try {
      await api(`/chats/${active}/messages/${messageId}`, { method: 'DELETE' });
      await selectRoom(active);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function join(id) {
    setBusy(true);
    try {
      await api(`/chats/${id}/join`, { method: 'POST', body: {} });
      await loadRooms();
      await selectRoom(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function respondInvite(id, accept) {
    setBusy(true);
    try {
      await api(`/chats/${id}/invitation`, { method: 'POST', body: { accept } });
      await loadRooms(true);
      if (accept) await selectRoom(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function leaveRoom() {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/chats/${active}/leave`, { method: 'POST', body: {} });
      setActive('');
      setRoom(null);
      setMessages([]);
      await loadRooms(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openAttachmentPicker() {
    setAttachOpen(true);
    try {
      const d = await api('/materials/mine');
      setMaterials(Array.isArray(d.materials) ? d.materials : []);
    } catch {
      setMaterials([]);
    }
  }

  function insertMaterialAttachment(m) {
    const tag = `[پیوست فایل: ${m.name}](/api/materials/${m.id}/download)`;
    setText((prev) => (prev ? `${prev} ${tag}` : tag));
    setAttachOpen(false);
  }

  const maxRead = Math.max(0, ...members.filter((m) => m.id !== user?.id).map((m) => m.last_read_id || 0));

  const filteredRooms = rooms.filter((r) => {
    if (tab === 'class' && r.kind !== 'class') return false;
    if (tab === 'private' && r.kind !== 'private') return false;
    if (tab === 'community' && !['community', 'group', 'invite'].includes(r.kind)) return false;
    const rq = roomSearch.trim().toLowerCase();
    if (rq) {
      const hay = `${r.title || ''} ${r.last || ''}`.toLowerCase();
      if (!hay.includes(rq)) return false;
    }
    return true;
  });

  return (
    <div className="chat-wrap">
      {/* ============ Sidebar: Conversations & Tabs ============ */}
      <aside className="chat-side-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="t-h3">نیم‌چت</h1>
          <span
            className={`chip ${connState === 'connected' ? 'soft-green' : 'soft-orange'}`}
            style={{ fontSize: 11 }}
          >
            {connState === 'connected' ? 'متصل (زنده)' : 'در حال اتصال…'}
          </span>
        </div>

        {/* Category Tabs */}
        <div className="segmented" style={{ width: '100%', flexWrap: 'wrap' }} role="tablist" aria-label="فیلتر گفتگوها">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={tab === key ? 'is-active' : ''}
              onClick={() => setTab(key)}
              style={{ flex: '1 1 auto', justifyContent: 'center', fontSize: 12, padding: '6px 8px' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Room Search */}
        <div className="panel-search" style={{ maxWidth: 'none' }}>
          <IconSearch size={16} style={{ color: 'var(--n500)' }} />
          <input
            type="search"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            aria-label="جستجوی نام گروه یا گفتگو"
            placeholder="جستجوی گروه یا گفتگو…"
          />
        </div>

        {tab === 'notifications' ? (
          <div className="conv-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card-soft" style={{ padding: 14 }}>
              <b style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconBell size={16} /> دعوت‌نامه‌ها و اعلان‌های گفتگو
              </b>
              {invitations.length === 0 ? (
                <p className="t-caption t-muted" style={{ marginTop: 6 }}>
                  دعوت‌نامهٔ فعالی در انتظار پاسخ نیست.
                </p>
              ) : (
                invitations.map((i) => (
                  <div key={i.room_id} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <b>{i.title}</b>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button disabled={busy} className="btn btn-primary btn-sm" onClick={() => respondInvite(i.room_id, true)}>
                        پذیرش
                      </button>
                      <button disabled={busy} className="btn btn-outline btn-sm" onClick={() => respondInvite(i.room_id, false)}>
                        رد
                      </button>
                    </div>
                  </div>
                ))
              )}
              <Link to="/panel/notifications" className="btn btn-outline btn-sm btn-block" style={{ marginTop: 12 }}>
                مشاهده همهٔ اعلان‌های سامانه
              </Link>
            </div>
          </div>
        ) : (
          <div className="conv-list">
            {filteredRooms.length === 0 && (
              <p className="t-caption t-muted" style={{ padding: '12px 4px' }}>
                گفتگویی در این بخش پیدا نشد.
              </p>
            )}
            {filteredRooms.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`conv ${active === r.id ? 'is-active' : ''}`}
                onClick={() => selectRoom(r.id)}
              >
                <div className="avatar sq-44 green">{r.title?.[0] || 'گ'}</div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  <b style={{ display: 'block', fontSize: 13.5 }}>{r.title}</b>
                  <span className="t-caption t-muted" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.last || 'بدون پیام'}
                  </span>
                </div>
                {r.unread > 0 && <span className="side-badge">{faNum(r.unread)}</span>}
              </button>
            ))}

            {invitations.map((i) => (
              <div className="card-soft" key={i.room_id} style={{ padding: 12, marginTop: 8 }}>
                <b>دعوت به {i.title}</b>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button disabled={busy} className="btn btn-primary btn-sm" onClick={() => respondInvite(i.room_id, true)}>
                    پذیرش
                  </button>
                  <button disabled={busy} className="btn btn-outline btn-sm" onClick={() => respondInvite(i.room_id, false)}>
                    رد
                  </button>
                </div>
              </div>
            ))}

            {available.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={busy}
                className="btn btn-outline btn-block"
                style={{ marginTop: 8 }}
                onClick={() => join(a.id)}
              >
                پیوستن به {a.title}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ============ Main Chat Area ============ */}
      <section className="chat-main">
        {room ? (
          <>
            <header className="chat-head" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <b>{room.title}</b>
                <div className="t-caption t-muted">
                  {faNum(members.filter((m) => m.online).length)} آنلاین از {faNum(members.length)} عضو
                  {room.closed ? ' · مهلت فعالیت این گفتگو پایان یافته' : ''}
                </div>
              </div>

              <div className="panel-search" style={{ maxWidth: 220 }}>
                <IconSearch size={15} />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    selectRoom(active, e.target.value);
                  }}
                  aria-label="جستجو در پیام‌های این گفتگو"
                  placeholder="جستجو در پیام‌ها…"
                />
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                aria-label="تنظیمات گپ و اعلان‌ها"
                onClick={() => setSettingsOpen(true)}
              >
                <IconDots size={16} /> تنظیمات گپ
              </button>

              {room.member_role !== 'moderator' && (
                <button disabled={busy} className="btn btn-outline btn-sm" type="button" onClick={leaveRoom}>
                  خروج از گفتگو
                </button>
              )}
            </header>

            {error && (
              <p role="alert" style={{ padding: '8px 18px', color: 'var(--error)', fontWeight: 700 }}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" style={{ padding: '8px 18px', color: 'var(--primary)', fontWeight: 700 }}>
                {notice}
              </p>
            )}

            <div className="chat-body">
              {messages.length === 0 && (
                <p className="t-small t-muted" style={{ textAlign: 'center', padding: 24 }}>
                  هنوز پیامی در این گفتگو ثبت نشده است.
                </p>
              )}

              {messages.map((m) => {
                const { cleanText, attachment } = parseAttachmentFromText(m.text);
                return (
                  <article key={m.id} className={`msg ${m.sender_id === user?.id ? 'me' : ''}`}>
                    <div className="bubble-msg">
                      {m.sender_id !== user?.id && (
                        <div className="who">
                          {m.name} · <span className="role">{m.role}</span>
                        </div>
                      )}
                      <div>{cleanText}</div>

                      {attachment && (
                        <div
                          className="card-soft"
                          style={{
                            marginTop: 8,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                            <IconFile size={15} /> {attachment.name}
                          </span>
                          <a href={attachment.url} className="btn btn-outline btn-sm" target="_blank" rel="noreferrer">
                            دریافت فایل
                          </a>
                        </div>
                      )}

                      <div className="time">
                        {new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        {m.sender_id === user?.id && (m.id <= maxRead ? ' · خوانده شد' : ' · ارسال شد')}
                      </div>

                      {!m.deleted_at && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
                          {m.sender_id !== user?.id && (
                            <button
                              type="button"
                              className="t-caption"
                              disabled={busy || room.closed}
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  await api(`/chats/${active}/messages/${m.id}/like`, {
                                    method: 'POST',
                                    body: { liked: !m.liked },
                                  });
                                  await selectRoom(active);
                                } catch (e) {
                                  setError(e.message);
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {m.liked ? 'پسندیده' : 'پسندیدن'} ({faNum(m.likes || 0)})
                            </button>
                          )}
                          {m.sender_id !== user?.id && (
                            <button
                              type="button"
                              className="t-caption"
                              onClick={() => {
                                setReportTarget(m);
                                setReportCategory(REPORT_REASONS[0]);
                                setReportNote('');
                              }}
                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <IconFlag size={12} /> گزارش تخلف
                            </button>
                          )}
                          {(user?.role === 'admin' || m.sender_id === user?.id) && (
                            <button
                              type="button"
                              className="t-caption"
                              onClick={() => remove(m.id)}
                              style={{ color: 'var(--error)', cursor: 'pointer' }}
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {typing && <div className="t-caption t-muted">{typing}</div>}
            </div>

            <form className="chat-input" onSubmit={send}>
              <button
                type="button"
                className="btn-icon-round"
                aria-label="پیوست فایل یا جزوه جلسه"
                title="پیوست فایل یا جزوه جلسه"
                disabled={room.closed || busy}
                onClick={openAttachmentPicker}
              >
                <IconClip size={18} />
              </button>
              <input
                value={text}
                disabled={room.closed}
                onChange={(e) => {
                  setText(e.target.value);
                  api(`/chats/${active}/typing`, { method: 'POST', body: {} }).catch(() => {});
                }}
                placeholder={room.closed ? 'این گفتگو بسته شده است' : 'پیام خود را بنویسید…'}
              />
              <button className="btn btn-primary" disabled={busy || room.closed || !text.trim()}>
                <IconSend size={17} /> ارسال
              </button>
            </form>
          </>
        ) : (
          <div style={{ padding: 24 }}>یک گفتگو را انتخاب کنید یا به گفتگوی عمومی بپیوندید.</div>
        )}
      </section>

      {/* ============ Modal: تنظیمات گپ و اعلان‌ها ============ */}
      {settingsOpen && room && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-settings-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsOpen(false);
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
              <h2 id="chat-settings-modal-title" className="t-h3">
                تنظیمات گپ و اعلان‌ها · {room.title}
              </h2>
              <button type="button" className="btn-icon-round" aria-label="بستن تنظیمات" onClick={() => setSettingsOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={chatSettings.notifyAll}
                  onChange={(e) => setChatSettings((s) => ({ ...s, notifyAll: e.target.checked }))}
                />
                دریافت اعلان برای پیام‌های جدید این گفتگو
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={chatSettings.sound}
                  onChange={(e) => setChatSettings((s) => ({ ...s, sound: e.target.checked }))}
                />
                پخش صدای اعلان هنگام دریافت پیام جدید
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={chatSettings.preview}
                  onChange={(e) => setChatSettings((s) => ({ ...s, preview: e.target.checked }))}
                />
                نمایش پیش‌نمایش متن پیام در اعلان‌ها
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={chatSettings.teacherOnly}
                  onChange={(e) => setChatSettings((s) => ({ ...s, teacherOnly: e.target.checked }))}
                />
                فقط دریافت اعلان برای پیام‌های استاد و مدیر گروه
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSettingsOpen(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  <IconCheck size={16} /> ذخیره تنظیمات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ Modal: گزارش تخلف پیام ============ */}
      {reportTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-report-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReportTarget(null);
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
              <h2 id="chat-report-modal-title" className="t-h3">
                گزارش پیام به مدیر نیم‌چت
              </h2>
              <button type="button" className="btn-icon-round" aria-label="بستن فرم گزارش" onClick={() => setReportTarget(null)}>
                <IconX size={18} />
              </button>
            </div>
            <p className="t-caption t-muted" style={{ marginTop: 8 }}>
              پیام انتخابی از «{reportTarget.name}»: {String(reportTarget.text || '').slice(0, 80)}
            </p>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <label className="field-label">
                علت گزارش
                <select
                  className="select"
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  style={{ marginTop: 6 }}
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                توضیحات تکمیلی (اختیاری)
                <textarea
                  className="input"
                  rows={3}
                  maxLength={800}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="توضیح کوتاه برای بررسی سریع‌تر توسط مدیر…"
                  style={{ marginTop: 6 }}
                />
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setReportTarget(null)}>
                  انصراف
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  ثبت گزارش تخلف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ Modal: پیوست فایل / جزوه جلسه ============ */}
      {attachOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-attach-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAttachOpen(false);
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
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 26, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="chat-attach-modal-title" className="t-h3">
                پیوست فایل از منابع بررسی‌شدهٔ جلسه
              </h2>
              <button type="button" className="btn-icon-round" aria-label="بستن" onClick={() => setAttachOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
              برای امنیت اعضا، فقط فایل‌هایی که از اسکنر امنیتی نیمکت عبور کرده‌اند در گفتگو قابل اشتراک‌گذاری هستند.
            </p>
            {materials.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, maxHeight: 240, overflowY: 'auto' }}>
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="card-soft"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}
                  >
                    <div>
                      <b style={{ fontSize: 13.5 }}>{m.name}</b>
                      <div className="t-caption t-muted">{m.title}</div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => insertMaterialAttachment(m)}>
                      افزودن به پیام
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-soft" style={{ padding: 16, marginTop: 14 }}>
                <p className="t-small t-muted">هنوز فایل منتشرشده‌ای در جلسات شما ثبت نشده است.</p>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
              <Link to={user?.role === 'teacher' ? '/teacher/files' : '/panel/files'} className="btn btn-outline btn-sm">
                مدیریت فایل‌ها و منابع امن
              </Link>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAttachOpen(false)}>
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
