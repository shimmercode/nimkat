module.exports = function settingsRoutes(app, { auth, requireRole, settings, db }) {
  const admin = [auth, requireRole('admin')];
  app.get('/api/admin/integrations', ...admin, (req, res) => res.json({ services: Object.keys(settings.definitions).map(settings.publicValue) }));
  app.put('/api/admin/integrations/:service', ...admin, (req, res, next) => {
    try { res.json({ service: settings.update(req.params.service, req.body, req.user.id) }); } catch (e) { next(e); }
  });
  app.get('/api/admin/audit', ...admin, (req, res) => {
    const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
    res.json({ events: db.prepare('SELECT id,actor_id,action,subject,metadata,created_at FROM audit_events WHERE id<? ORDER BY id DESC LIMIT 100').all(before).map((row) => ({ ...row, metadata: JSON.parse(row.metadata) })) });
  });
  app.get('/api/admin/readiness', ...admin, (req, res) => {
    const services = Object.keys(settings.definitions).map((name) => {
      const state = settings.get(name);
      return { name, enabled: state.config.enabled, credentialsConfigured: settings.definitions[name].secrets.every((key) => !!state.secrets[key]) };
    });
    res.json({ productionReady: false, services, checks: [
      { key: 'storage', ok: false, detail: 'دیتابیس جاری SQLite است؛ مهاجرت PostgreSQL/Redis و آزمون بار باقی است.' },
      { key: 'https', ok: process.env.NODE_ENV === 'production', detail: 'Secure cookies و HTTPS باید در محیط واقعی بررسی شوند.' },
      { key: 'payment-domain', ok: !!process.env.PUBLIC_SITE_URL, detail: 'PUBLIC_SITE_URL برای بازگشت پرداخت لازم است.' },
      { key: 'provider-tests', ok: false, detail: 'ثبت کلید به‌معنای تأیید ارتباط واقعی، پرداخت آزمایشی یا تأیید قرارداد نیست.' },
    ] });
  });
};
