const { EventEmitter } = require('node:events');
function realtimeModule(app, { db, auth }) {
  const bus = new EventEmitter(); bus.setMaxListeners(0);
  const online = new Map();
  const emit = (userIds, type, payload) => { for (const id of new Set(userIds)) bus.emit(`user:${id}`, { type, ...payload }); };
  app.get('/api/events', auth, (req, res) => {
    const uid = req.user.id;
    if ((online.get(uid) || 0) >= 5) return res.status(429).json({ error: 'تعداد اتصال‌های هم‌زمان این حساب زیاد است.' });
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
    online.set(uid, (online.get(uid) || 0) + 1);
    const listener = (event) => { if (res.writableLength > 65536) return res.end(); send(event); };
    bus.on(`user:${uid}`, listener);
    send({ type: 'connected', time: Date.now() });
    const heartbeat = setInterval(() => {
      const session = db.prepare('SELECT revoked_at,access_expires,access_hash FROM auth_sessions WHERE id=?').get(req.authSession.id);
      if (!session || session.revoked_at || session.access_expires <= Date.now() || session.access_hash !== req.authSession.access_hash) { send({ type: 'session-expired' }); return res.end(); }
      res.write(': heartbeat\n\n');
    }, 15000);
    heartbeat.unref();
    req.on('close', () => { clearInterval(heartbeat); bus.off(`user:${uid}`, listener); const n = (online.get(uid) || 1) - 1; if (n) online.set(uid, n); else online.delete(uid); });
  });
  return { emit, isOnline: (uid) => online.has(uid) };
}
module.exports = { realtimeModule };
