'use client';
import { useEffect, useRef, useState } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { faNum } from '../../utils/fa.js';
import {
  IconSearch, IconSend, IconFlag, IconClip, IconDots, IconX, IconCheck, IconFile, IconBell, IconLock,
} from '../../components/icons.jsx';

const TABS = [
  ['all', 'همه'],
  ['private', 'استادها'],
  ['community', 'گپ‌ها'],
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

function roleLabel(role, isMe) {
  if (isMe) return 'شما';
  if (role === 'teacher') return 'استاد';
  if (role === 'admin') return 'مدیر';
  if (role === 'parent') return 'والد';
  return 'شاگرد';
}

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [available, setAvailable] = useState([]);
  const [active, setActive] = useState('');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
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
  const lastTypingSentRef = useRef(0);
  const mountedRef = useRef(true);
  const retryKey = useRef({ room: '', text: '', key: '' });
  activeRef.current = active;
  searchRef.current = q;

  async function loadRooms(pickFirst = false) {
    const seq = ++roomsLoadSeq.current;
    try {
      const d = await api('/chats');
      if (!mountedRef.current || seq !== roomsLoadSeq.current) return;
      setRooms(d.chats || []);
      setInvitations(d.invitations || []);
      setAvailable(d.available || []);
      if ((pickFirst || !activeRef.current) && d.chats?.[0]) {
        selectRoom(d.chats[0].id, '');
      }
    } catch (e) {
      if (mountedRef.current && seq === roomsLoadSeq.current) {
        setError(e.message || 'خطا در دریافت فهرست گفتگوها');
      }
    }
  }

  async function selectRoom(id, search = searchRef.current) {
    if (!id) return;
    const seq = ++roomLoadSeq.current;
    setActive(id);
    try {
      const d = await api(`/chats/${id}?q=${encodeURIComponent(search)}`);
      if (!mountedRef.current || seq !== roomLoadSeq.current) return;
      setRoom({ ...d.chat, closed: d.closed });
      setMessages(d.messages || []);
      setHasMore(!!d.hasMore);
      setMembers(d.members || []);
      if (d.settings) setChatSettings(d.settings);
      const last = d.messages?.at(-1);
      if (last) {
        await api(`/chats/${id}/read`, { method: 'POST', body: { messageId: last.id } }).catch(() => {});
        if (!mountedRef.current) return;
        setRooms((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, unread: 0, last_read_id: Math.max(r.last_read_id || 0, last.id) } : r
          )
        );
      }
    } catch (e) {
      if (mountedRef.current && seq === roomLoadSeq.current) {
        setError(e.message || 'خطا در دریافت پیام‌های گفتگو');
      }
    }
  }

  async function loadOlderMessages() {
    if (!active || !messages.length || busy) return;
    const oldestId = messages[0]?.id;
    if (!oldestId) return;
    setBusy(true);
    try {
      const d = await api(`/chats/${active}?before=${oldestId}&q=${encodeURIComponent(q)}`);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const older = (d.messages || []).filter((m) => !existingIds.has(m.id));
        return [...older, ...prev];
      });
      setHasMore(!!d.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let alive = true;
    mountedRef.current = true;
    let stream;
    loadRooms(true);
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
      mountedRef.current = false;
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
    if (tab === 'private' && r.kind !== 'private') return false;
    if (tab === 'community' && !['community', 'group', 'class', 'invite'].includes(r.kind)) return false;
    const rq = roomSearch.trim().toLowerCase();
    if (rq) {
      const hay = `${r.title || ''} ${r.last || ''}`.toLowerCase();
      if (!hay.includes(rq)) return false;
    }
    return true;
  });

  const onlineMembersCount = members.filter((m) => m.online).length;
  const attachmentCount = messages.filter((m) => parseAttachmentFromText(m.text).attachment).length;

  return (
    <div className="chat-wrap">
      {/* ============ Column 1 (Right in RTL): Conversations & Tabs ============ */}
      <aside className="chat-side-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="t-h4" style={{ fontSize: 18 }}>نیم‌چت</h1>
          <span
            className={`chip ${connState === 'connected' ? 'soft-green' : 'soft-orange'}`}
            style={{ fontSize: 11 }}
          >
            {connState === 'connected' ? 'متصل' : 'در حال اتصال…'}
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
              style={{ flex: '1 1 auto', justifyContent: 'center', fontSize: 12, padding: '7px 8px' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Room Search */}
        <div className="panel-search" style={{ maxWidth: 'none', padding: '8px 12px' }}>
          <IconSearch size={15} style={{ color: 'var(--n500)' }} />
          <input
            type="search"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            aria-label="جستجوی نام گروه یا گفتگو"
            placeholder="جستجوی گروه یا پیام…"
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
                  <div
                    key={i.room_id}
                    className="nimchat-invite"
                    style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}
                  >
                    <b>{i.title}</b>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        disabled={busy}
                        className="btn btn-primary btn-sm"
                        onClick={() => respondInvite(i.room_id, true)}
                      >
                        پذیرش دعوت
                      </button>
                      <button
                        disabled={busy}
                        className="btn btn-outline btn-sm"
                        onClick={() => respondInvite(i.room_id, false)}
                      >
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
            {filteredRooms.map((r, idx) => (
              <button
                key={r.id}
                type="button"
                className={`conv ${active === r.id ? 'is-active' : ''}`}
                onClick={() => selectRoom(r.id)}
              >
                <div
                  className={`avatar sq-40 ${
                    r.kind === 'community'
                      ? 'gray'
                      : idx % 2 === 0
                        ? ''
                        : 'green'
                  }`}
                >
                  {r.title?.[0] || 'گ'}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <b
                      style={{
                        fontSize: 13.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.title}
                    </b>
                    {r.unread > 0 && <span className="side-badge">{faNum(r.unread)}</span>}
                  </div>
                  <span
                    className="t-caption t-muted"
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}
                  >
                    {r.last || 'بدون پیام'}
                  </span>
                </div>
              </button>
            ))}

            {invitations.map((i) => (
              <div className="card-soft nimchat-invite" key={i.room_id} style={{ padding: 12, marginTop: 8 }}>
                <b style={{ fontSize: 13 }}>دعوت به {i.title}</b>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    disabled={busy}
                    className="btn btn-primary btn-sm"
                    onClick={() => respondInvite(i.room_id, true)}
                  >
                    پذیرش دعوت
                  </button>
                  <button
                    disabled={busy}
                    className="btn btn-outline btn-sm"
                    onClick={() => respondInvite(i.room_id, false)}
                  >
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
                className="btn btn-outline btn-sm btn-block"
                style={{ marginTop: 8 }}
                onClick={() => join(a.id)}
              >
                پیوستن به {a.title}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ============ Column 2 (Center): Main Chat Area ============ */}
      <section className="chat-main">
        {room ? (
          <>
            <header className="chat-head" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="avatar sq-40">{room.title?.[0] || 'گ'}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <h2 className="t-h4" style={{ fontSize: 15.5 }}>
                  {room.title}
                </h2>
                <div className="t-caption t-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="dot-online" />
                  <span>
                    {faNum(onlineMembersCount)} نفر آنلاین از {faNum(members.length)} عضو
                    {room.closed ? ' · مهلت فعالیت این گفتگو پایان یافته' : ''}
                  </span>
                </div>
              </div>

              <span className="chip outline" style={{ fontSize: 11.5 }}>
                <IconLock size={12} /> {room.kind === 'community' ? 'عمومی' : 'حضور-محور'}
              </span>

              <div className="panel-search" style={{ maxWidth: 190, padding: '6px 12px' }}>
                <IconSearch size={14} />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    selectRoom(active, e.target.value);
                  }}
                  aria-label="جستجو در پیام‌های این گفتگو"
                  placeholder="جستجو در پیام‌ها…"
                  style={{ fontSize: 12.5 }}
                />
              </div>

              <button
                type="button"
                className="btn-icon-round"
                aria-label="تنظیمات گپ و اعلان‌ها"
                title="تنظیمات گپ و اعلان‌ها"
                onClick={() => setSettingsOpen(true)}
                style={{ width: 38, height: 38 }}
              >
                <IconDots size={16} />
              </button>
            </header>

            {error && (
              <p role="alert" style={{ padding: '8px 18px', color: 'var(--error)', fontWeight: 700, fontSize: 13 }}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" style={{ padding: '8px 18px', color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                {notice}
              </p>
            )}

            <div className="chat-body nimchat-messages">
              {hasMore && (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy}
                    onClick={loadOlderMessages}
                  >
                    نمایش ۵۰ پیام قدیمی‌تر
                  </button>
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <span className="chip outline" style={{ fontSize: 11.5 }}>
                  امروز · گفتگوهای رسمی نیم‌چت
                </span>
              </div>

              {messages.length === 0 && (
                <p className="t-small t-muted" style={{ textAlign: 'center', padding: 24 }}>
                  هنوز پیامی در این گفتگو ثبت نشده است.
                </p>
              )}

              {messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                const { cleanText, attachment } = parseAttachmentFromText(m.text);
                return (
                  <article key={m.id} className={`msg ${isMe ? 'me' : 'other'}`}>
                    {!isMe && (
                      <div className="who">
                        {m.name}
                        {m.role && <span className="role">{roleLabel(m.role, false)}</span>}
                      </div>
                    )}

                    <div className="bubble-m">{cleanText}</div>

                    {attachment && (
                      <div className="file-msg">
                        <span
                          className="chip soft-error"
                          style={{ borderRadius: 'var(--r-sm)', padding: '6px 10px', fontSize: 11.5 }}
                        >
                          PDF
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: 13 }}>{attachment.name}</b>
                          <span className="t-caption t-muted">فایل بررسی‌شدهٔ جلسه</span>
                        </div>
                        <a
                          href={attachment.url}
                          className="btn-icon-round"
                          target="_blank"
                          rel="noreferrer"
                          title="دریافت فایل"
                          style={{ width: 36, height: 36 }}
                        >
                          <IconFile size={16} />
                        </a>
                      </div>
                    )}

                    <div className="meta">
                      <span className="num">
                        {new Date(m.created_at).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && (
                        <span style={{ color: 'var(--primary)' }}>
                          {m.id <= maxRead ? '✓✓ خوانده شد' : '✓ ارسال شد'}
                        </span>
                      )}

                      {!m.deleted_at && (
                        <>
                          {!isMe && (
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
                              style={{ cursor: 'pointer', color: 'var(--muted)' }}
                            >
                              {m.liked ? 'پسندیده' : 'پسندیدن'} ({faNum(m.likes || 0)})
                            </button>
                          )}
                          {!isMe && (
                            <button
                              type="button"
                              className="t-caption"
                              onClick={async () => {
                                if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
                                  const reason = window.prompt(
                                    'دلیل گزارش این پیام را بنویسید:',
                                    REPORT_REASONS[0]
                                  );
                                  if (reason === null) return;
                                  if (reason.trim().length < 3) {
                                    setError('لطفاً دلیل گزارش را (حداقل ۳ نویسه) وارد کنید.');
                                    return;
                                  }
                                  setBusy(true);
                                  try {
                                    await api(`/chats/${active}/messages/${m.id}/report`, {
                                      method: 'POST',
                                      body: { reason: reason.trim() },
                                    });
                                    setNotice('گزارش پیام برای بررسی مدیر ثبت شد ✓');
                                  } catch (err) {
                                    setError(err.message || 'خطا در ثبت گزارش');
                                  } finally {
                                    setBusy(false);
                                  }
                                } else {
                                  setReportTarget(m);
                                  setReportCategory(REPORT_REASONS[0]);
                                  setReportNote('');
                                }
                              }}
                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <IconFlag size={11} /> گزارش
                            </button>
                          )}
                          {(user?.role === 'admin' || isMe) && (
                            <button
                              type="button"
                              className="t-caption"
                              onClick={() => remove(m.id)}
                              style={{ color: 'var(--error)', cursor: 'pointer' }}
                            >
                              حذف
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {invitations.length > 0 && (
                <div className="sys-msg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <b style={{ color: 'var(--accent)', fontSize: 13.5 }}>دعوت‌نامه‌ی اختصاصی</b>
                    <span className="chip soft-orange" style={{ fontSize: 11 }}>پیام سیستمی</span>
                  </div>
                  <p>
                    شما به گفتگوی «{invitations[0].title}» دعوت شده‌اید. در صورت تمایل می‌توانید به این گپ بپیوندید.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <button
                      type="button"
                      disabled={busy}
                      className="btn btn-orange btn-sm"
                      onClick={() => respondInvite(invitations[0].room_id, true)}
                    >
                      پیوستن به گپ
                    </button>
                    <span className="t-caption" style={{ opacity: 0.75 }}>
                      دعوت‌نامهٔ رسمی نیم‌چت
                    </span>
                  </div>
                </div>
              )}

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
                style={{ width: 42, height: 42 }}
              >
                <IconClip size={18} />
              </button>
              <input
                aria-label="متن پیام"
                value={text}
                disabled={room.closed}
                onChange={(e) => {
                  setText(e.target.value);
                  const nowTs = Date.now();
                  if (nowTs - lastTypingSentRef.current >= 1500) {
                    lastTypingSentRef.current = nowTs;
                    api(`/chats/${active}/typing`, { method: 'POST', body: {} }).catch(() => {});
                  }
                }}
                placeholder={room.closed ? 'این گفتگو بسته شده است' : 'پیام خود را بنویسید…'}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || room.closed || !text.trim()}
                style={{ padding: '11px 18px' }}
              >
                <IconSend size={17} /> ارسال
              </button>
            </form>
          </>
        ) : (
          <div style={{ padding: 24 }}>یک گفتگو را انتخاب کنید یا به گفتگوی عمومی بپیوندید.</div>
        )}
      </section>

      {/* ============ Column 3 (Left in RTL): Room Info & Members Panel ============ */}
      <aside className="chat-side-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <div className="avatar sq-64">{room?.title?.[0] || 'ن'}</div>
          <b style={{ fontSize: 15.5 }}>{room?.title || 'نیم‌چت'}</b>
          <span className="t-caption t-muted">
            {room?.kind === 'community'
              ? 'گفتگوی عمومی اعضای نیمکت'
              : 'ساخته‌شده خودکار برای شرکت‌کنندگان کلاس'}
          </span>
        </div>

        <div className="card-soft" style={{ padding: 14 }}>
          <b style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>قوانین ارسال پیام</b>
          <p className="t-caption t-muted" style={{ lineHeight: 1.9, fontWeight: 500 }}>
            فقط شرکت‌کننده‌های کلاس پیام می‌فرستند. تا ۷۲ ساعت بعد از جلسه‌ی آخر فعال است.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <b style={{ fontSize: 13.5 }}>اعضا · {faNum(members.length)} نفر</b>
            <span className="t-caption" style={{ color: 'var(--primary)' }}>همه</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 240, overflowY: 'auto' }}>
            {members.map((m, idx) => {
              const isMe = m.id === user?.id;
              return (
                <div key={m.id} className="member-row">
                  <div
                    className={`avatar sq-40 ${
                      m.role === 'teacher' ? '' : idx % 2 === 0 ? 'green' : 'tint-orange'
                    }`}
                    style={{ width: 36, height: 36, fontSize: 14 }}
                  >
                    {m.name?.[0] || 'ک'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 13 }}>{m.name}</b>
                    <span className="t-caption t-muted">
                      {m.role === 'teacher'
                        ? 'استاد · مدیر گروه'
                        : roleLabel(m.role, isMe)}
                    </span>
                  </div>
                  <span className={m.online ? 'dot-online' : 'dot-offline'} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <b style={{ fontSize: 13.5, display: 'block', marginBottom: 10 }}>فایل‌های گروه</b>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="chip outline num"
              style={{ fontSize: 11.5, cursor: 'pointer' }}
              onClick={openAttachmentPicker}
            >
              <IconFile size={13} /> {faNum(Math.max(attachmentCount, materials.length))} جزوه
            </button>
            <Link
              to={user?.role === 'teacher' ? '/teacher/files' : '/panel/files'}
              className="chip outline"
              style={{ fontSize: 11.5 }}
            >
              منابع جلسه
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {room && messages.some((m) => m.sender_id !== user?.id) && (
            <button
              type="button"
              style={{
                color: 'var(--error)',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'center',
                padding: '6px 0',
              }}
              onClick={() => {
                const target = messages.find((m) => m.sender_id !== user?.id) || messages[0];
                if (target) {
                  setReportTarget(target);
                  setReportCategory(REPORT_REASONS[0]);
                  setReportNote('');
                }
              }}
            >
              <IconFlag size={14} /> گزارش تخلف در گروه
            </button>
          )}
          {room && room.member_role !== 'moderator' && (
            <button
              disabled={busy}
              className="btn btn-outline btn-sm btn-block"
              type="button"
              onClick={leaveRoom}
            >
              خروج از گفتگو
            </button>
          )}
        </div>
      </aside>

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
