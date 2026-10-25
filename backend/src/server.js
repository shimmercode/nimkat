/* Nimkat backend - Express API server */
const express = require('express');
const db = require('./db');

const app = express();
// Configure only for a controlled reverse proxy that overwrites forwarded headers.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);
const PORT = process.env.PORT || 8000;

app.use(express.json({ limit: '256kb',verify:(req,res,buf)=>{req.rawBody=buf;} }));

/* ---------- helpers ---------- */
const J = (s, fallback = null) => {
  try { return JSON.parse(s); } catch { return fallback; }
};
const settings = require('./modules/settings/store').settingsStore(db);
const providers = require('./modules/settings/providers').providers(settings);
const { auth, requireRole } = require('./modules/auth')(app, { db, sendOtp: providers.sendOtp });
require('./modules/settings/routes')(app, { db, auth, requireRole, settings });
require('./modules/blog').blogModule(app, { db, auth, requireRole, settings });
require('./modules/blog/editorial')(db);
const events = require('./modules/realtime').realtimeModule(app, { db, auth });
const chat = require('./modules/chat').chatModule(app, { db, auth, requireRole, settings, events });
require('./modules/support').supportModule(app, { db, auth, requireRole, settings, events });
const scheduling = require('./modules/scheduling').schedulingModule(app, { db, auth, requireRole, settings, onTeacherApproved:(uid,proof)=>{club.ingest(uid,'profile.completed','teacher-onboarding:v1',{actor:proof.actorId});if(proof.videoVerified)club.ingest(uid,'profile.video','teacher-onboarding-video:v1',{actor:proof.actorId});} });
require('./modules/classroom').classroomModule(app,{db,auth,requireRole,settings});
let earnings;
const finance = require('./modules/payments').paymentModule(app, { db, auth, settings, providers, scheduling, onConfirmed: chat.ensureClassRoom,onCreated:id=>earnings?.capture(id) });

require('./modules/payments/refunds').refundsModule(app,{db,auth,settings,finance});
const club = require('./modules/club').clubModule(app, { db, auth, requireRole, settings, finance, events });
earnings=require('./modules/commerce/earnings').earningsModule(app,{db,auth,requireRole,settings,finance,commissionBenefit:club.commissionBenefit});
require('./modules/commerce/shop').shopModule(app,{db,auth,requireRole,settings,finance});
const friendly=require('./modules/commerce/friendly').friendlyModule(app,{db,auth,requireRole,settings,finance,scheduling,capture:earnings.capture,onConfirmed:chat.ensureClassRoom});
const commerceJobs=setInterval(()=>{try{friendly.expire();earnings.settle();}catch(e){console.error('commerce job failed',e.message);}},60000);commerceJobs.unref();

require('./modules/education/availability').availabilityModule(app,{db});
require('./modules/education/reviews').reviewsModule(app,{db,auth,requireRole,settings});
const education=require('./modules/education').educationModule(app,{db,auth,requireRole,settings});
require('./modules/education/materials').materialsModule(app,{db,auth,requireRole,settings,education});
require('./modules/panel/analytics').analyticsModule(app,{db,auth,requireRole});
const panel=require('./modules/panel').panelModule(app,{db,auth,finance,club});
const teacherIdFor = (user) =>
  scheduling.teacherIdFor(user);
const faPrice = (n) => Math.round(n).toLocaleString('en-US');

const tierDiscount = (sessions) => (sessions >= 16 ? 0.15 : sessions >= 8 ? 0.1 : sessions >= 4 ? 0.05 : 0);

/* ---------- teachers ---------- */
const teacherCard = (t) => ({
  id: t.id, name: t.name, subject: t.subject, level: t.level, rating: t.rating,
  reviews_count: t.reviews_count, classes_held: t.classes_held, students: t.students,
  price: t.price, month_badge: t.month_badge, badges: J(t.badges, []),
});

app.get('/api/teachers', (req, res) => {
  const { subject, sort } = req.query;
  let rows = db.prepare('SELECT * FROM teachers').all();
  if (subject && subject !== 'همه') rows = rows.filter((t) => t.subject === subject);
  if (sort === 'rating') rows.sort((a, b) => b.rating - a.rating);
  if (sort === 'price') rows.sort((a, b) => a.price - b.price);
  if (sort === 'soon') rows.sort((a, b) => a.id - b.id);
  res.json({ teachers: rows.map(teacherCard) });
});

app.get('/api/teachers/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM teachers WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'استاد پیدا نشد' });
  res.json({
    teacher: {
      ...teacherCard(t),
      title: t.title, years: t.years, price: t.price, session_minutes: t.session_minutes,
      about: t.about, methods: t.methods, areas: t.areas, platform: t.platform, video: t.video,
      credentials: J(t.credentials, []), history: J(t.history, []), subratings: J(t.subratings, []),
      slots: J(t.slots, []),
    },
    reviews: db.prepare('SELECT * FROM reviews WHERE teacher_id=?').all(t.id),
    questions: db.prepare('SELECT * FROM questions WHERE teacher_id=?').all(t.id),
    groupClasses: db.prepare("SELECT id,title,days,time,sessions,capacity,taken,price FROM classes WHERE teacher_id=? AND kind!='private'").all(t.id),
  });
});

/* ---------- classes ---------- */
app.get('/api/classes', (req, res) => {
  const { kind, subject, grade, sort, maxPrice, minRating, mode } = req.query;
  let rows = db.prepare('SELECT * FROM classes').all();
  if (kind && kind !== 'همه') rows = rows.filter((c) => c.kind === kind);
  if (subject && subject !== 'همه') rows = rows.filter((c) => c.subject === subject);
  if (grade && grade !== 'همه') rows = rows.filter((c) => c.grade === grade);
  if (mode && mode !== 'هر دو') rows = rows.filter((c) => c.mode === mode);
  if (maxPrice) rows = rows.filter((c) => c.price <= Number(maxPrice));
  if (minRating) rows = rows.filter((c) => c.rating >= Number(minRating));
  if (sort === 'price') rows.sort((a, b) => a.price - b.price);
  else if (sort === 'rating') rows.sort((a, b) => b.rating - a.rating);
  else if (sort === 'soon') rows.sort((a, b) => a.taken / a.capacity - b.taken / b.capacity);
  const teachers = db.prepare('SELECT * FROM teachers').all();
  res.json({
    classes: rows.map((c) => ({
      ...c, badges: J(c.badges, []), syllabus: undefined, rules: undefined,
      teacher: teacherCard(teachers.find((t) => t.id === c.teacher_id) || {}),
    })),
    suggested: teachers.filter((t) => t.month_badge).slice(0, 3).map(teacherCard),
    totalTeachers: teachers.length,
  });
});

app.get('/api/classes/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM classes WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'کلاس پیدا نشد' });
  const t = db.prepare('SELECT * FROM teachers WHERE id=?').get(c.teacher_id);
  res.json({
    class: { ...c, badges: J(c.badges, []), syllabus: J(c.syllabus, []), rules: J(c.rules, []) },
    teacher: teacherCard(t),
    tiers: [
      { sessions: 4, percent: 5 }, { sessions: 8, percent: 10 }, { sessions: 16, percent: 15 },
    ],
  });
});

/* ---------- callback request ---------- */
app.post('/api/callback', (req, res) => {
  const { phone, name } = req.body || {};
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length !== 11 || !digits.startsWith('09')) return res.status(400).json({ error: 'شماره موبایل ۱۱ رقمی معتبر وارد کنید' });
  db.prepare('INSERT INTO callback_requests (phone, name) VALUES (?,?)').run(digits, String(name || ''));
  res.json({ ok: true });
});

/* ---------- content module: pages, versions and templates ---------- */
require('./modules/content/routes')(app, { db, auth, requireRole, J });
require('./modules/content/media')(app,{db,auth,requireRole});

/* ---------- student panel ---------- */
app.get('/api/panel/student',auth,requireRole('student','parent'),panel.overview);

app.post('/api/notifications/:id/cancel', auth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM notifications WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  if (Number.isSafeInteger(id)) {
    db.prepare('INSERT OR IGNORE INTO user_notification_dismissals(user_id, notification_id, created_at) VALUES (?,?,?)').run(
      req.user.id,
      id,
      Date.now()
    );
  }
  res.json({ ok: true });
});

/* ---------- teacher panel ---------- */
app.get('/api/panel/teacher',auth,requireRole('teacher'),panel.overview);

app.post('/api/teacher/course-requests', auth, requireRole('teacher'), (req, res) => {
  const b = req.body || {};
  const status = b.submit ? 'pending' : 'draft';
  const tid = teacherIdFor(req.user);
  if (!tid) return res.status(403).json({ error: 'ابتدا پروندهٔ مدرس باید تأیید و به پروفایل متصل شود.' });
  db.prepare('INSERT INTO course_requests (teacher_id,name,subject,start,duration,sessions,min_max,price_range,status) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(tid, b.name || '', b.subject || '', b.start || '', b.duration || '', b.sessions || 0, b.min_max || '', b.price_range || '', status);
  res.json({ ok: true, status });
});

app.post('/api/teacher/reviews/:id/reply', auth, requireRole('teacher'), (req, res) => {
  const text = (req.body?.text ?? req.body?.reply ?? '').trim();
  if (!text) return res.status(400).json({ error: 'متن پاسخ خالی است' });
  const rv = db.prepare('SELECT * FROM reviews WHERE id=?').get(req.params.id);
  if (!rv) return res.status(404).json({ error: 'نظر پیدا نشد' });
  if (rv.teacher_id !== teacherIdFor(req.user)) return res.status(403).json({ error: 'این نظر متعلق به مدرس دیگری است.' });
  db.prepare('UPDATE reviews SET replied=1, reply=? WHERE id=?').run(text, req.params.id);
  res.json({ ok: true });
});

/* ---------- misc ---------- */
app.post('/api/questions', auth, (req, res) => {
  const tid = Number(req.body?.teacherId ?? req.body?.teacher_id);
  const text = String(req.body?.text || '').trim();
  if (!Number.isSafeInteger(tid) || !text) return res.status(400).json({ error: 'استاد و متن سوال الزامی است.' });
  db.prepare('INSERT INTO questions (teacher_id,author,text,answer,date_label) VALUES (?,?,?,NULL,?)')
    .run(tid, req.user.name, text, 'هم‌اکنون');
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'nimkat-api', version: '1.0.0' }));

app.use((req, res) => res.status(404).json({ error: 'مسیر پیدا نشد' }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  if (status >= 500) console.error('API error:', err.code || err.name);
  res.status(status).json({ error: status >= 500 && status !== 503 ? 'خطای داخلی سرور؛ دوباره تلاش کنید.' : err.message });
});

if (require.main === module && process.env.NIMKAT_AUTO_LISTEN !== 'false') {
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`Nimkat API listening on http://0.0.0.0:${PORT}`));
  // Keep backend sockets alive longer than the frontend proxy pool's idle window.
  // Otherwise 6-second support polling can race the default 5-second socket close.
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 30000;
}

module.exports = { app, db };

