const crypto = require('node:crypto');
const error = (message, status = 400) => Object.assign(new Error(message), { status });
function chatModule(app, { db, auth, requireRole, settings, events, now = Date.now }) {
  db.exec(`CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,title TEXT NOT NULL,kind TEXT NOT NULL,source_key TEXT UNIQUE,created_by INTEGER,closes_at INTEGER,created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chat_members (
    room_id TEXT NOT NULL,user_id INTEGER NOT NULL,role TEXT NOT NULL DEFAULT 'member',last_read_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(room_id,user_id)
  );
  CREATE TABLE IF NOT EXISTS chat_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,room_id TEXT NOT NULL,sender_id INTEGER NOT NULL,text TEXT NOT NULL,client_id TEXT NOT NULL,created_at INTEGER NOT NULL,deleted_at INTEGER,UNIQUE(room_id,sender_id,client_id)
  );
  CREATE TABLE IF NOT EXISTS chat_reactions(message_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(message_id,user_id));
  CREATE INDEX IF NOT EXISTS chat_posts_room ON chat_posts(room_id,id);
  CREATE TABLE IF NOT EXISTS chat_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,message_id INTEGER NOT NULL,reporter_id INTEGER NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at INTEGER NOT NULL,UNIQUE(message_id,reporter_id)
  );
  CREATE TABLE IF NOT EXISTS chat_user_settings (
    user_id INTEGER NOT NULL,room_id TEXT NOT NULL,notify_all INTEGER NOT NULL DEFAULT 1,sound INTEGER NOT NULL DEFAULT 1,preview INTEGER NOT NULL DEFAULT 1,teacher_only INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,PRIMARY KEY(user_id,room_id)
  );`);
  db.prepare("INSERT OR IGNORE INTO chat_rooms (id,title,kind,source_key,created_at) VALUES ('community','گپ عمومی نیمکت','community','community',?)").run(now());
  require('./membership').membershipModule(app,{db,auth,requireRole,settings,events,now});
  const members = (room) => db.prepare('SELECT user_id FROM chat_members WHERE room_id=?').all(room).map((r) => r.user_id);
  const moderation=require('./moderation').moderationModule(app,{db,auth,requireRole,settings,events,members,now});
  function roomFor(id, uid) {
    const room = db.prepare('SELECT r.*,m.role member_role,m.last_read_id FROM chat_rooms r JOIN chat_members m ON m.room_id=r.id WHERE r.id=? AND m.user_id=?').get(id, uid);
    if (!room) throw error('گفتگو پیدا نشد یا شما عضو آن نیستید.', 404);
    return room;
  }
  const safe = (fn) => (req, res, next) => { try { fn(req, res); } catch (e) { next(e); } };
  app.get('/api/chats', auth, (req, res) => {
    const rooms = db.prepare(`SELECT r.*,m.last_read_id,
      (SELECT COUNT(*) FROM chat_posts p WHERE p.room_id=r.id AND p.id>m.last_read_id AND p.sender_id!=?) unread,
      (SELECT CASE WHEN p.deleted_at IS NULL THEN p.text ELSE 'پیام حذف شده' END FROM chat_posts p WHERE p.room_id=r.id ORDER BY p.id DESC LIMIT 1) last
      FROM chat_rooms r JOIN chat_members m ON m.room_id=r.id WHERE m.user_id=? ORDER BY r.created_at DESC`).all(req.user.id, req.user.id);
    res.json({ chats: rooms, invitations:moderation.invitations(req.user.id), available: db.prepare("SELECT id,title,kind FROM chat_rooms WHERE kind='community' AND id NOT IN (SELECT room_id FROM chat_members WHERE user_id=?)").all(req.user.id) });
  });
  app.post('/api/chats/:id/join', auth, safe((req, res) => {
    const room = db.prepare("SELECT * FROM chat_rooms WHERE id=? AND kind='community'").get(req.params.id);
    if (!room) throw error('این گفتگو عمومی نیست؛ دعوت مدیر لازم است.', 403);
    db.prepare('INSERT OR IGNORE INTO chat_members (room_id,user_id,role) VALUES (?,?,?)').run(room.id, req.user.id, 'member');
    events.emit([req.user.id], 'chat.rooms', {}); res.json({ ok: true });
  }));
  app.get('/api/chats/:id', auth, safe((req, res) => {
    const room = roomFor(req.params.id, req.user.id);
    const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
    const query = String(req.query.q || '').trim().slice(0, 100);
    const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
    const posts = db.prepare(`SELECT p.id,p.sender_id,p.text,p.created_at,p.deleted_at,u.name,u.role,(SELECT COUNT(*) FROM chat_reactions cr WHERE cr.message_id=p.id) likes, EXISTS(SELECT 1 FROM chat_reactions cr WHERE cr.message_id=p.id AND cr.user_id=?) liked FROM chat_posts p JOIN users u ON u.id=p.sender_id WHERE p.room_id=? AND p.id<? AND (p.text LIKE ? ESCAPE '\\' OR ?='') ORDER BY p.id DESC LIMIT 50`).all(req.user.id, room.id, before, `%${escaped}%`, query).reverse().map((post) => ({ ...post, text: post.deleted_at ? 'این پیام حذف شده است.' : post.text }));
    const people = db.prepare('SELECT u.id,u.name,u.role,m.last_read_id,m.role room_role FROM chat_members m JOIN users u ON u.id=m.user_id WHERE m.room_id=?').all(room.id).map((row) => ({ ...row, online: events.isOnline(row.id) }));
    const prefs = db.prepare('SELECT notify_all,sound,preview,teacher_only FROM chat_user_settings WHERE user_id=? AND room_id=?').get(req.user.id, room.id) || { notify_all: 1, sound: 1, preview: 1, teacher_only: 0 };
    res.json({ chat: room, messages: posts, members: people, settings: { notifyAll: !!prefs.notify_all, sound: !!prefs.sound, preview: !!prefs.preview, teacherOnly: !!prefs.teacher_only }, hasMore: posts.length === 50, closed: !!room.closes_at && room.closes_at <= now() });
  }));
  app.put('/api/chats/:id/settings', auth, safe((req, res) => {
    const room = roomFor(req.params.id, req.user.id);
    const b = req.body || {};
    const notifyAll = b.notifyAll !== false ? 1 : 0;
    const sound = b.sound !== false ? 1 : 0;
    const preview = b.preview !== false ? 1 : 0;
    const teacherOnly = b.teacherOnly === true ? 1 : 0;
    db.prepare('INSERT INTO chat_user_settings (user_id,room_id,notify_all,sound,preview,teacher_only,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,room_id) DO UPDATE SET notify_all=excluded.notify_all,sound=excluded.sound,preview=excluded.preview,teacher_only=excluded.teacher_only,updated_at=excluded.updated_at').run(req.user.id, room.id, notifyAll, sound, preview, teacherOnly, now());
    res.json({ ok: true, settings: { notifyAll: !!notifyAll, sound: !!sound, preview: !!preview, teacherOnly: !!teacherOnly } });
  }));
  const sendLimits = new Map(), typingLimits = new Map();
  app.post('/api/chats/:id/messages', auth, safe((req, res) => {
    const room = roomFor(req.params.id, req.user.id);
    if (room.closes_at && room.closes_at <= now()) throw error('مهلت فعالیت این گفتگو تمام شده است.', 403);
    const text = String(req.body?.text || '').trim(), clientId = req.body?.clientId;
    if (!text || text.length > 4000 || !/^[a-zA-Z0-9_-]{16,100}$/.test(clientId || '')) throw error('متن پیام یا شناسهٔ ارسال نامعتبر است.');
    const existing = db.prepare('SELECT * FROM chat_posts WHERE room_id=? AND sender_id=? AND client_id=?').get(room.id, req.user.id, clientId);
    if (existing) { if (existing.text !== text) throw error('شناسهٔ ارسال برای پیام دیگری استفاده شده است.', 409); return res.json({ ok: true, message: { ...existing, name: req.user.name } }); }
    const limit = sendLimits.get(req.user.id) || { count: 0, until: 0 };
    if (limit.until <= now()) { limit.count = 0; limit.until = now() + 60000; }
    if (++limit.count > 60) throw error('سرعت ارسال پیام زیاد است؛ کمی صبر کنید.', 429);
    sendLimits.set(req.user.id, limit);
    moderation.checkText(text,req.user.id,room.id);
    const id = db.prepare('INSERT INTO chat_posts (room_id,sender_id,text,client_id,created_at) VALUES (?,?,?,?,?)').run(room.id, req.user.id, text, clientId, now()).lastInsertRowid;
    db.prepare('UPDATE chat_members SET last_read_id=? WHERE room_id=? AND user_id=?').run(id, room.id, req.user.id);
    events.emit(members(room.id), 'chat.message', { roomId: room.id });
    res.json({ ok: true, message: { id: Number(id), sender_id: req.user.id, name: req.user.name, text, created_at: now() } });
  }));
  app.post('/api/chats/:id/read', auth, safe((req, res) => {
    const room = roomFor(req.params.id, req.user.id), id = req.body?.messageId;
    if (!Number.isSafeInteger(id) || !db.prepare('SELECT id FROM chat_posts WHERE room_id=? AND id=?').get(room.id, id)) throw error('پیام نامعتبر است.');
    if(id<=room.last_read_id)return res.json({ok:true});
    db.prepare('UPDATE chat_members SET last_read_id=MAX(last_read_id,?) WHERE room_id=? AND user_id=?').run(id, room.id, req.user.id);
    events.emit(members(room.id).filter((uid) => uid !== req.user.id), 'chat.read', { roomId: room.id });
    res.json({ ok: true });
  }));
  app.post('/api/chats/:id/typing', auth, safe((req, res) => {
    const room = roomFor(req.params.id, req.user.id), key = `${req.user.id}:${room.id}`;
    if (room.closes_at && room.closes_at <= now()) throw error('گفتگو بسته است.', 403);
    if (now() - (typingLimits.get(key) || 0) >= 1500) { typingLimits.set(key, now()); events.emit(members(room.id).filter((uid) => uid !== req.user.id), 'chat.typing', { roomId: room.id, name: req.user.name, expiresAt: now() + 5000 }); }
    res.json({ ok: true });
  }));
  app.post('/api/chats/:id/messages/:messageId/report', auth, safe((req, res) => {
    roomFor(req.params.id, req.user.id);
    const message = db.prepare('SELECT * FROM chat_posts WHERE id=? AND room_id=?').get(req.params.messageId, req.params.id);
    const reason = String(req.body?.reason || '').trim();
    if (!message || reason.length < 3 || reason.length > 1000) throw error('پیام یا دلیل گزارش نامعتبر است.');
    db.prepare('INSERT OR IGNORE INTO chat_reports (message_id,reporter_id,reason,created_at) VALUES (?,?,?,?)').run(message.id, req.user.id, reason, now());
    settings.audit(req.user.id, 'chat.report', String(message.id)); res.json({ ok: true });
  }));
  app.delete('/api/chats/:id/messages/:messageId', auth, safe((req, res) => {
    roomFor(req.params.id, req.user.id);
    const message = db.prepare('SELECT * FROM chat_posts WHERE id=? AND room_id=?').get(req.params.messageId, req.params.id);
    if (!message) throw error('پیام پیدا نشد.', 404);
    if (req.user.role !== 'admin' && (message.sender_id !== req.user.id || now() - message.created_at > 10 * 60000)) throw error('حذف این پیام مجاز نیست.', 403);
    db.prepare('UPDATE chat_posts SET deleted_at=? WHERE id=?').run(now(), message.id);
    settings.audit(req.user.id, 'chat.delete', String(message.id)); events.emit(members(req.params.id), 'chat.message', { roomId: req.params.id, deleted:true }); res.json({ ok: true });
  }));
  app.post('/api/admin/chat/rooms', auth, requireRole('admin'), safe((req, res) => {
    const { title, userIds, kind = 'group', classEndsAt } = req.body || {};
    if (typeof title !== 'string' || title.trim().length < 2 || title.length > 150 || !['group', 'private'].includes(kind) || !Array.isArray(userIds) || userIds.length < 1 || userIds.length > 50 || userIds.some((id) => !Number.isSafeInteger(id) || !db.prepare('SELECT id FROM users WHERE id=?').get(id))) throw error('عنوان یا اعضای گفتگو نامعتبرند.');
    if (kind === 'private' && (!Number.isSafeInteger(classEndsAt) || classEndsAt < now() - 72 * 3600000)) throw error('زمان واقعی پایان کلاس برای محاسبهٔ مهلت ۷۲ساعته لازم است.');
    const id = crypto.randomUUID(), ids = [...new Set([...userIds, req.user.id])];
    if(ids.length>50)throw error('حداکثر ۵۰ عضو شامل سازنده مجاز است.');
    db.transaction(() => {
      db.prepare('INSERT INTO chat_rooms (id,title,kind,created_by,closes_at,created_at) VALUES (?,?,?,?,?,?)').run(id, title.trim(), kind, req.user.id, kind === 'private' ? classEndsAt + 72 * 3600000 : null, now());
      for (const uid of ids) db.prepare('INSERT INTO chat_members (room_id,user_id,role) VALUES (?,?,?)').run(id, uid, uid === req.user.id ? 'moderator' : 'member');
      settings.audit(req.user.id, 'chat.create', id, { memberCount: ids.length, kind });
    })();
    events.emit(ids, 'chat.rooms', {}); res.json({ id });
  }));

  return {
    roomFor,
    ensureClassRoom(bookingId) {
      const booking = db.prepare("SELECT b.*,c.title FROM bookings b JOIN classes c ON c.id=b.class_id WHERE b.id=? AND b.status='confirmed' AND b.schema_version=2").get(bookingId);
      if (!booking) return;
      const source = `class:${booking.class_id}`, id = crypto.randomUUID();
      db.transaction(() => {
        db.prepare("INSERT OR IGNORE INTO chat_rooms (id,title,kind,source_key,created_at) VALUES (?,?,'class',?,?)").run(id, booking.title, source, now());
        const room = db.prepare('SELECT id FROM chat_rooms WHERE source_key=?').get(source);
        db.prepare("INSERT OR IGNORE INTO chat_members (room_id,user_id,role) VALUES (?,?,'member')").run(room.id, booking.user_id);
        if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='class_occurrences'").get()) {
          const end = db.prepare("SELECT MAX(ends_at) ends FROM class_occurrences WHERE class_id=? AND status='scheduled'").get(booking.class_id)?.ends;
          if (end) db.prepare('UPDATE chat_rooms SET closes_at=? WHERE id=?').run(end + 72 * 3600000, room.id);
          const teacher = db.prepare("SELECT a.user_id FROM teacher_accounts a JOIN classes c ON c.teacher_id=a.teacher_id WHERE c.id=? AND a.status='approved'").get(booking.class_id);
          if (teacher) db.prepare("INSERT OR IGNORE INTO chat_members(room_id,user_id,role) VALUES (?,?,'moderator')").run(room.id,teacher.user_id);
        }

      })();
      events.emit([booking.user_id], 'chat.rooms', {});
    },
  };
}
module.exports = { chatModule };
