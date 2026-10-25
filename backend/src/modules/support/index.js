const crypto = require('node:crypto');
function supportModule(app, { db, auth, requireRole, settings, events,now=Date.now }) {
  db.exec(`CREATE TABLE IF NOT EXISTS support_threads (id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'bot',created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS support_posts (id INTEGER PRIMARY KEY AUTOINCREMENT,thread_id TEXT NOT NULL,author_id INTEGER,kind TEXT NOT NULL,text TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS support_articles (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,keywords TEXT NOT NULL,text TEXT NOT NULL,published INTEGER NOT NULL DEFAULT 1);`);
  if (!db.prepare('PRAGMA table_info(support_posts)').all().some(c => c.name === 'client_id')) db.exec('ALTER TABLE support_posts ADD COLUMN client_id TEXT');
  if (!db.prepare('PRAGMA table_info(support_articles)').all().some(c => c.name === 'version')) db.exec('ALTER TABLE support_articles ADD COLUMN version INTEGER NOT NULL DEFAULT 1');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS support_client_id ON support_posts(thread_id,client_id); CREATE INDEX IF NOT EXISTS support_post_thread ON support_posts(thread_id,id); CREATE INDEX IF NOT EXISTS support_user_threads ON support_threads(user_id,created_at);');
  for(const a of [
    {title:'پیدا کردن کلاس مناسب',keywords:'انتخاب کلاس، پیدا کردن، کلاس مناسب',text:'از صفحهٔ کلاس‌ها، نوع کلاس، درس و شیوهٔ آنلاین یا حضوری را انتخاب کنید. جزئیات مدرس و زمان جلسات را بررسی کنید. رزرو نهایی فقط برای مدرس تأییدشده، زمان معتبر و پس از تأیید پرداخت امکان‌پذیر است. اگر برنامه‌ای منتشر نشده باشد، رزرو تأیید نمی‌شود.'},
    {title:'راهنمای ورود',keywords:'ورود، کد، تایید، تأیید، لاگین',text:'شماره موبایل ۱۱رقمی با شروع ۰۹ وارد کنید و کد پنج‌رقمی را در زمان اعتبار آن بنویسید. کد را برای هیچ‌کس نفرستید. اگر بعد از ورود دوباره به صفحه ورود برمی‌گردید، پیش‌نمایش را در زبانهٔ مستقل باز کنید و تنظیمات کوکی مرورگر را بررسی کنید. در صورت ادامه مشکل، درخواست را به کارشناس ارجاع دهید.'},
    {title:'پیگیری رزرو و پرداخت',keywords:'رزرو، پرداخت، پیگیری، پول',text:'این دستیار به تراکنش یا اطلاعات حساب شما دسترسی ندارد و پرداخت را تأیید نمی‌کند. نتیجهٔ پرداخت را در صفحهٔ نتیجه و حساب شخصی بررسی کنید. برای پیگیری، درخواست را به کارشناس ارجاع دهید؛ فقط شناسهٔ درخواست را ارسال کنید، نه اطلاعات کارت یا کد ورود.'}
  ])if(!db.prepare('SELECT id FROM support_articles WHERE title=?').get(a.title))db.prepare('INSERT INTO support_articles(title,keywords,text) VALUES(?,?,?)').run(a.title,a.keywords,a.text);
  const notifyAdmins = () => events.emit(db.prepare("SELECT id FROM users WHERE role='admin'").all().map(u => u.id), 'support.inbox', {});
  function messages(id, before) {
    const cursor = Number(before) || Number.MAX_SAFE_INTEGER;
    const rows = db.prepare('SELECT id,kind,text,created_at FROM support_posts WHERE thread_id=? AND id<? ORDER BY id DESC LIMIT 51').all(id, cursor);
    return { messages: rows.slice(0,50).reverse(), hasMore: rows.length > 50 };
  }
  app.get('/api/support/articles', (req,res) => res.json({ articles: db.prepare('SELECT id,title,text FROM support_articles WHERE published=1 ORDER BY id DESC LIMIT 100').all() }));
  require('./guest').guestSupport(app,{db,auth,requireRole,settings});
  require('./workflow').workflowModule(app,{db,auth,requireRole,settings,now});
  const normalize = (s) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  const safe = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req, res)).catch(next);
  const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
  function thread(req) {
    const row = db.prepare('SELECT * FROM support_threads WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!row) fail('درخواست پیدا نشد.', 404); return row;
  }
  function post(id, author, kind, text, clientId = null) { db.prepare('INSERT INTO support_posts (thread_id,author_id,kind,text,created_at,client_id) VALUES (?,?,?,?,?,?)').run(id, author, kind, text, Date.now(), clientId); }
  app.get('/api/support/info', (req, res) => { const { config } = settings.get('support'); res.json({ enabled: config.enabled, greeting: config.greeting, engine: config.engine, humanOnline: false }); });
  app.get('/api/support/threads', auth, (req, res) => res.json({ threads: db.prepare('SELECT * FROM support_threads WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id) }));
  app.post('/api/support/threads', auth, (req, res) => {
    const id = crypto.randomUUID();
    const existing = db.prepare("SELECT * FROM support_threads WHERE user_id=? AND status!='closed' ORDER BY created_at DESC LIMIT 1").get(req.user.id);
    if (existing) return res.json({ thread: existing });
    db.prepare('INSERT INTO support_threads (id,user_id,created_at) VALUES (?,?,?)').run(id, req.user.id, Date.now());
    res.json({ thread: db.prepare('SELECT * FROM support_threads WHERE id=?').get(id) });
  });
  app.get('/api/support/threads/:id', auth, safe((req, res) => { const row = thread(req); res.json({ thread: row, ...messages(row.id, req.query.before) }); }));
  const busy = new Set(), limits = new Map();
  app.post('/api/support/threads/:id/messages', auth, safe(async (req, res) => {
    const row = thread(req), text = String(req.body?.text || '').trim();
    if (row.status === 'closed') fail('این درخواست بسته شده است.', 409);
    if (!text || text.length > 2000) fail('پیام باید بین ۱ تا ۲۰۰۰ نویسه باشد.');
    const clientId = req.body?.clientId;
    if (clientId !== undefined && !/^[a-zA-Z0-9_-]{16,100}$/.test(clientId)) fail('شناسه ارسال نامعتبر است.');
    if (clientId) {
      const old = db.prepare('SELECT * FROM support_posts WHERE thread_id=? AND client_id=?').get(row.id, clientId);
      if (old) { if (old.kind !== 'user' || old.text !== text) fail('شناسه برای پیام دیگری استفاده شده است.',409); return res.json({ok:true, duplicate:true}); }
    }
    const config = settings.get('support').config;
    if (!config.enabled) fail('پشتیبانی در حال حاضر غیرفعال است.', 503);
    if (busy.has(req.user.id)) fail('منتظر پاسخ قبلی بمانید.', 429);
    const limit = limits.get(req.user.id) || { count: 0, until: 0 };
    if (limit.until < Date.now()) { limit.count = 0; limit.until = Date.now() + 60000; }
    if (++limit.count > 10) fail('تعداد درخواست زیاد است؛ کمی صبر کنید.', 429);
    limits.set(req.user.id, limit); busy.add(req.user.id);
    try {
      post(row.id, req.user.id, 'user', text, clientId); notifyAdmins();
      if (row.status === 'bot') {
        const answer = await require('./answer')({db,settings,text});
        if (db.prepare('SELECT status FROM support_threads WHERE id=?').get(row.id)?.status === 'bot') post(row.id, null, 'bot', answer);
      }
      events.emit([req.user.id], 'support.message', { threadId: row.id }); res.json({ ok: true });
    } finally { busy.delete(req.user.id); }
  }));
  app.post('/api/support/threads/:id/escalate', auth, safe((req, res) => { const row = thread(req); if (row.status === 'closed') fail('درخواست بسته است.', 409); if (row.status === 'bot') db.prepare("UPDATE support_threads SET status='waiting' WHERE id=?").run(row.id); notifyAdmins(); events.emit([row.user_id], 'support.message', { threadId: row.id }); settings.audit(req.user.id, 'support.escalate', row.id); res.json({ ok: true, message: 'در صف بررسی قرار گرفت؛ حضور آنلاین کارشناس تضمین نمی‌شود.' }); }));
  app.get('/api/admin/support', auth, requireRole('admin'), safe((req, res) => {
    const status = String(req.query.status || ''), q = String(req.query.q || '').trim().slice(0,100), before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
    if (status && !['bot','waiting','human','closed'].includes(status)) fail('وضعیت نامعتبر است.');
    const escaped = q.replace(/[\\%_]/g, c => `\\${c}`);
    const rows = db.prepare(`SELECT t.*,u.name,
      COALESCE((SELECT MAX(p.id) FROM support_posts p WHERE p.thread_id=t.id),0) activity_id,
      (SELECT text FROM support_posts p WHERE p.thread_id=t.id ORDER BY p.id DESC LIMIT 1) preview
      FROM support_threads t JOIN users u ON u.id=t.user_id
      WHERE (?='' OR t.status=?) AND (?='' OR u.name LIKE ? ESCAPE '\\' OR t.id=?) AND t.rowid<?
      ORDER BY t.rowid DESC LIMIT 51`).all(status,status,q,`%${escaped}%`,q,before);
    res.json({ threads: rows.slice(0,50), hasMore: rows.length>50, nextCursor: rows.length ? db.prepare('SELECT rowid cursor FROM support_threads WHERE id=?').get(rows[Math.min(rows.length,50)-1].id).cursor : null,
      counts: db.prepare('SELECT status,COUNT(*) count FROM support_threads GROUP BY status').all(), articles: db.prepare('SELECT * FROM support_articles ORDER BY id DESC').all() });
  }));
  app.get('/api/admin/support/:id', auth, requireRole('admin'), safe((req, res) => {
    const row = db.prepare('SELECT t.*,u.name FROM support_threads t JOIN users u ON u.id=t.user_id WHERE t.id=?').get(req.params.id);
    if (!row) fail('درخواست پیدا نشد.',404);
    res.json({ thread: row, ...messages(row.id, req.query.before) });
  }));
  app.post('/api/admin/support/:id/reopen', auth, requireRole('admin'), safe((req,res) => {
    const row=db.prepare('SELECT * FROM support_threads WHERE id=?').get(req.params.id);
    if (!row) fail('درخواست پیدا نشد.',404);
    if (row.status !== 'closed') fail('فقط درخواست بسته را می‌توان باز کرد.',409);
    const other = db.prepare("SELECT id FROM support_threads WHERE user_id=? AND status!='closed' AND id!=?").get(row.user_id,row.id);
    if (other) fail('این کاربر درخواست باز دیگری دارد؛ از همان درخواست پیگیری کنید.',409);
    db.prepare("UPDATE support_threads SET status='human' WHERE id=?").run(row.id);
    settings.audit(req.user.id,'support.reopen',row.id); events.emit([row.user_id],'support.message',{threadId:row.id}); notifyAdmins(); res.json({ok:true});
  }));
  app.post('/api/admin/support/:id/reply', auth, requireRole('admin'), safe((req, res) => {
    const row = db.prepare('SELECT * FROM support_threads WHERE id=?').get(req.params.id), text = String(req.body?.text || '').trim();
    if (!row) fail('درخواست پیدا نشد.', 404);
    const clientId=req.body?.clientId;
    if (clientId !== undefined && !/^[a-zA-Z0-9_-]{16,100}$/.test(clientId)) fail('شناسه ارسال نامعتبر است.');
    if (clientId) {
      const old=db.prepare('SELECT * FROM support_posts WHERE thread_id=? AND client_id=?').get(row.id,clientId);
      if (old) { if (old.kind!=='agent' || old.author_id!==req.user.id || old.text!==text) fail('شناسه برای پاسخ دیگری استفاده شده است.',409); return res.json({ok:true,duplicate:true}); }
    }
    if (row.status==='closed') fail('ابتدا درخواست را بازگشایی کنید.',409);
    if (!text || text.length > 4000) fail('متن پاسخ نامعتبر است.');
    db.transaction(() => { post(row.id, req.user.id, 'agent', text, clientId); db.prepare("UPDATE support_threads SET status=? WHERE id=?").run(req.body.close === true ? 'closed' : 'human', row.id); settings.audit(req.user.id, 'support.reply', row.id); })();
    notifyAdmins(); events.emit([row.user_id], 'support.message', { threadId: row.id }); res.json({ ok: true });
  }));
  app.post('/api/admin/support/articles', auth, requireRole('admin'), safe((req, res) => {
    const { title, keywords, text } = req.body || {};
    if ([title, keywords, text].some((v) => typeof v !== 'string' || !v.trim()) || title.length > 150 || keywords.length > 1000 || text.length > 10000) fail('محتوای راهنما نامعتبر است.');
    const id = db.prepare('INSERT INTO support_articles (title,keywords,text) VALUES (?,?,?)').run(title.trim(), keywords.trim(), text.trim()).lastInsertRowid;
    settings.audit(req.user.id, 'support.article_create', String(id)); res.json({ id: Number(id) });
  }));
  app.put('/api/admin/support/articles/:id', auth, requireRole('admin'), safe((req,res) => {
    const {title,keywords,text,published,version}=req.body || {};
    if ([title,keywords,text].some(v=>typeof v!=='string'||!v.trim()) || title.length>150 || keywords.length>1000 || text.length>10000 || typeof published!=='boolean' || !Number.isSafeInteger(version)) fail('محتوای راهنما نامعتبر است.');
    const old=db.prepare('SELECT * FROM support_articles WHERE id=?').get(req.params.id);
    if (!old) fail('راهنما پیدا نشد.',404);
    const result=db.prepare('UPDATE support_articles SET title=?,keywords=?,text=?,published=?,version=version+1 WHERE id=? AND version=?').run(title.trim(),keywords.trim(),text.trim(),published?1:0,old.id,version);
    if (!result.changes) fail('این راهنما هم‌زمان ویرایش شده؛ دوباره دریافت کنید.',409);
    settings.audit(req.user.id,'support.article_update',String(old.id),{published}); res.json({ok:true});
  }));
}
module.exports = { supportModule };
