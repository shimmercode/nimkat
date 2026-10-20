/* Content domain: transport routes; DB/auth helpers injected by the application. */
const { validSchema } = require('./schema');
module.exports = function registerContentRoutes(app, { db, auth, requireRole, verify, J }) {
/* ---------- page builder ---------- */
const validSlug = (x) => /^[a-z0-9][a-z0-9-]{1,63}$/.test(String(x || ''));

const snapshot = (slug, schema, label, uid) =>
  db.prepare('INSERT INTO page_versions (page_slug, schema_json, label, created_by) VALUES (?,?,?,?)')
    .run(slug, JSON.stringify(schema), label || '', uid || null).lastInsertRowid;

app.get('/api/pages/:slug', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { slug } = req.params;
  const row = db.prepare('SELECT * FROM pages WHERE slug=?').get(slug);
  const wantsDraft = req.query.preview === '1';
  if (wantsDraft) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = token && verify(token);
    const user = payload && db.prepare('SELECT role FROM users WHERE id=?').get(payload.uid);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'پیش‌نمایش پیش‌نویس فقط برای مدیر' });
    return res.json({ page: row ? { slug: row.slug, title: row.title, schema: J(row.schema_json, {}), status: row.status, updated_at: row.updated_at } : null });
  }
  if (!row || row.status !== 'published') return res.json({ page: null });
  res.json({ page: { slug: row.slug, title: row.published_title, schema: J(row.published_schema_json, {}), status: row.status, updated_at: row.updated_at } });
});

app.get('/api/pages', auth, requireRole('admin'), (req, res) => {
  res.json({ pages: db.prepare('SELECT slug, title, status, updated_at FROM pages ORDER BY slug').all() });
});

app.put('/api/pages/:slug', auth, requireRole('admin'), (req, res) => {
  const { slug } = req.params;
  if (!validSlug(slug)) return res.status(400).json({ error: 'اسلاگ نامعتبر است' });
  const { schema, title } = req.body || {};
  if (!validSchema(schema)) return res.status(400).json({ error: 'اسکیمای صفحه لازم است' });
  const row = db.prepare('SELECT * FROM pages WHERE slug=?').get(slug);
  const json = JSON.stringify(schema);
  db.transaction(() => {
  if (row) {
    db.prepare("UPDATE pages SET schema_json=?, title=?, updated_at=datetime('now','localtime'), updated_by=? WHERE slug=?")
      .run(json, title ?? row.title, req.user.id, slug);
  } else {
    db.prepare('INSERT INTO pages (slug, title, schema_json, status, updated_by) VALUES (?,?,?,?,?)')
      .run(slug, title || slug, json, 'draft', req.user.id);
  }
  snapshot(slug, schema, 'ذخیره خودکار', req.user.id);
  })();
  const fresh = db.prepare('SELECT * FROM pages WHERE slug=?').get(slug);
  res.json({ ok: true, page: { slug: fresh.slug, title: fresh.title, status: fresh.status, updated_at: fresh.updated_at } });
});

app.post('/api/pages/:slug/publish', auth, requireRole('admin'), (req, res) => {
  const { slug } = req.params;
  const row = db.prepare('SELECT * FROM pages WHERE slug=?').get(slug);
  if (!row) return res.status(404).json({ error: 'صفحه پیدا نشد' });
  db.transaction(() => {
  db.prepare("UPDATE pages SET status='published', published_schema_json=schema_json, published_title=title, updated_at=datetime('now','localtime'), updated_by=? WHERE slug=?").run(req.user.id, slug);
  snapshot(slug, J(row.schema_json, {}), 'انتشار', req.user.id);
  })();
  res.json({ ok: true, status: 'published' });
});

app.post('/api/pages/:slug/unpublish', auth, requireRole('admin'), (req, res) => {
  const { slug } = req.params;
  const row = db.prepare('SELECT * FROM pages WHERE slug=?').get(slug);
  if (!row) return res.status(404).json({ error: 'صفحه پیدا نشد' });
  db.prepare("UPDATE pages SET status='draft', updated_at=datetime('now','localtime'), updated_by=? WHERE slug=?").run(req.user.id, slug);
  res.json({ ok: true, status: 'draft' });
});

app.get('/api/pages/:slug/versions', auth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT id, label, created_at, created_by FROM page_versions WHERE page_slug=? ORDER BY id DESC LIMIT 50').all(req.params.slug);
  res.json({ versions: rows });
});

app.get('/api/pages/:slug/versions/:vid', auth, requireRole('admin'), (req, res) => {
  const row = db.prepare('SELECT * FROM page_versions WHERE id=? AND page_slug=?').get(req.params.vid, req.params.slug);
  if (!row) return res.status(404).json({ error: 'نسخه پیدا نشد' });
  res.json({ version: { id: row.id, label: row.label, created_at: row.created_at, schema: J(row.schema_json, {}) } });
});

app.post('/api/pages/:slug/versions', auth, requireRole('admin'), (req, res) => {
  const row = db.prepare('SELECT * FROM pages WHERE slug=?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'صفحه پیدا نشد' });
  const id = snapshot(req.params.slug, J(row.schema_json, {}), String(req.body?.label || 'نسخه دستی'), req.user.id);
  res.json({ ok: true, id });
});

app.post('/api/pages/:slug/versions/:vid/restore', auth, requireRole('admin'), (req, res) => {
  const v = db.prepare('SELECT * FROM page_versions WHERE id=? AND page_slug=?').get(req.params.vid, req.params.slug);
  if (!v) return res.status(404).json({ error: 'نسخه پیدا نشد' });
  db.prepare("UPDATE pages SET schema_json=?, updated_at=datetime('now','localtime'), updated_by=? WHERE slug=?")
    .run(v.schema_json, req.user.id, req.params.slug);
  snapshot(req.params.slug, J(v.schema_json, {}), `بازگردانی نسخه ${v.id}`, req.user.id);
  res.json({ ok: true, schema: J(v.schema_json, {}) });
});

app.get('/api/templates', auth, requireRole('admin'), (req, res) => {
  res.json({ templates: db.prepare('SELECT id, name, category, schema_json, created_at FROM templates ORDER BY id').all().map((t) => ({ ...t, schema: J(t.schema_json, {}) })) });
});

app.post('/api/templates', auth, requireRole('admin'), (req, res) => {
  const { name, category, schema } = req.body || {};
  if (!name || !validSchema(schema)) return res.status(400).json({ error: 'نام و اسکیما لازم است' });
  const id = db.prepare('INSERT INTO templates (name, category, schema_json) VALUES (?,?,?)')
    .run(String(name), String(category || 'عمومی'), JSON.stringify(schema)).lastInsertRowid;
  res.json({ ok: true, id });
});

app.delete('/api/templates/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM templates WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/pages/from-template', auth, requireRole('admin'), (req, res) => {
  const { templateId, slug, title } = req.body || {};
  if (!validSlug(slug)) return res.status(400).json({ error: 'اسلاگ نامعتبر است' });
  const t = db.prepare('SELECT * FROM templates WHERE id=?').get(templateId);
  if (!t) return res.status(404).json({ error: 'قالب پیدا نشد' });
  if (db.prepare('SELECT slug FROM pages WHERE slug=?').get(slug)) return res.status(400).json({ error: 'این اسلاگ قبلاً ثبت شده است' });
  db.prepare('INSERT INTO pages (slug, title, schema_json, status, updated_by) VALUES (?,?,?,?,?)')
    .run(slug, title || t.name, t.schema_json, 'draft', req.user.id);
  res.json({ ok: true, slug });
});


};
