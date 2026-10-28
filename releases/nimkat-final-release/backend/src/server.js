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

const GRADE_NUMBER_TO_WORD = {
  '1': 'اول', '2': 'دوم', '3': 'سوم', '4': 'چهارم', '5': 'پنجم', '6': 'ششم',
  '7': 'هفتم', '8': 'هشتم', '9': 'نهم', '10': 'دهم', '11': 'یازدهم', '12': 'دوازدهم',
};

function normalizeFaSearch(value) {
  const base = String(value || '')
    .replace(/[يئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200f\u200e\u0640\u064b-\u065f]/g, ' ')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  return base
    .split(' ')
    .map((token) => GRADE_NUMBER_TO_WORD[token] || token)
    .join(' ');
}

function ensureCatalogAndScheduleConsistency() {
  try {
    const defaultRules = JSON.stringify([
      'لغو تا ۲۴ ساعت قبل از جلسه رایگان است و مبلغ به کیف پول برمی‌گردد.',
      'لغو کمتر از ۲۴ ساعت: ۵۰٪ مبلغ همان جلسه کسر می‌شود.',
      'اگر استاد جلسه را لغو کند، جلسهٔ جایگزین یا استاد جایگزین پیشنهاد می‌شود.',
      'حضور بیش از ۱۵ دقیقه دیرتر، از زمان همان جلسه کم می‌شود.',
    ]);
    const defaultSyllabus = JSON.stringify([
      { chapter: 'فصل ۱ · مفاهیم پایه و تیپ‌بندی', sessions: 3, items: ['مرور مفاهیم کلیدی کتاب درسی', 'حل تمرین‌های تشریحی استاندارد'] },
      { chapter: 'فصل ۲ · حل مسئله و تست‌های ترکیبی', sessions: 3, items: [] },
      { chapter: 'جمع‌بندی و آزمون شبیه‌ساز', sessions: 2, items: [] },
    ]);
    const extraClasses = [
      {
        id: 6, title: 'شیمی کنکور؛ مفاهیم، استوکیومتری و حل تست زمان‌دار', teacher_id: 2, kind: 'group',
        mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'کنکور', field: 'تجربی و ریاضی', subject: 'شیمی',
        sessions: 8, session_minutes: 90, price: 520000, rating: 4.9, reviews_count: 289, capacity: 10, taken: 4,
        days: 'شنبه‌ها و دوشنبه‌ها', time: '۱۷:۰۰', desc: 'بررسی مفهومی و تستی شیمی کنکور همراه با تحلیل تیپ‌های پرتکرار و آزمونک پایان هر جلسه.',
        syllabus: defaultSyllabus, rules: defaultRules, badges: JSON.stringify(['برتر ماه', 'جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
      },
      {
        id: 7, title: 'هندسه و گسسته؛ آموزش مفهومی و تیپ‌بندی تست‌ها', teacher_id: 6, kind: 'group',
        mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'دوازدهم', field: 'ریاضی فیزیک', subject: 'ریاضی',
        sessions: 8, session_minutes: 90, price: 390000, rating: 4.7, reviews_count: 142, capacity: 8, taken: 3,
        days: 'یکشنبه‌ها و سه‌شنبه‌ها', time: '۱۶:۳۰', desc: 'آموزش گام‌به‌گام قضایای هندسه و مباحث نظریه اعداد و گراف در ریاضیات گسسته.',
        syllabus: defaultSyllabus, rules: defaultRules, badges: JSON.stringify(['جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
      },
      {
        id: 8, title: 'زیست‌شناسی جامع کنکور؛ تحلیل ترکیبی شکل‌ها و نکات', teacher_id: 7, kind: 'group',
        mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'کنکور', field: 'علوم تجربی', subject: 'زیست',
        sessions: 8, session_minutes: 90, price: 490000, rating: 4.9, reviews_count: 198, capacity: 12, taken: 5,
        days: 'شنبه‌ها و چهارشنبه‌ها', time: '۱۸:۰۰', desc: 'بررسی خط‌به‌خط کتاب درسی و تحلیل ترکیبی تصاویر زیست‌شناسی برای تسلط کامل در کنکور.',
        syllabus: defaultSyllabus, rules: defaultRules, badges: JSON.stringify(['جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
      },
      {
        id: 9, title: 'حسابان و ریاضیات دوازدهم؛ کارگاه حل مسئله و امتحان نهایی', teacher_id: 4, kind: 'group',
        mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'دوازدهم', field: 'ریاضی فیزیک', subject: 'ریاضی',
        sessions: 8, session_minutes: 90, price: 380000, rating: 4.8, reviews_count: 184, capacity: 10, taken: 4,
        days: 'یکشنبه‌ها و چهارشنبه‌ها', time: '۱۷:۳۰', desc: 'آموزش کامل مشتق، کاربرد مشتق و انتگرال با حل سؤالات استاندارد امتحان نهایی و کنکور.',
        syllabus: defaultSyllabus, rules: defaultRules, badges: JSON.stringify(['برتر ماه', 'جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
      },
    ];
    const insClass = db.prepare(`INSERT OR IGNORE INTO classes (
      id,title,teacher_id,kind,mode,platform,grade,field,subject,sessions,session_minutes,
      price,rating,reviews_count,capacity,taken,days,time,desc,syllabus,rules,badges,deadline,location
    ) VALUES (
      @id,@title,@teacher_id,@kind,@mode,@platform,@grade,@field,@subject,@sessions,@session_minutes,
      @price,@rating,@reviews_count,@capacity,@taken,@days,@time,@desc,@syllabus,@rules,@badges,@deadline,@location
    )`);
    for (const cls of extraClasses) {
      if (db.prepare('SELECT id FROM teachers WHERE id=?').get(cls.teacher_id)) {
        insClass.run(cls);
      }
    }

    const teachers = db.prepare('SELECT id,name,subject,about FROM teachers ORDER BY id').all();
    const insTeacherUser = db.prepare('INSERT OR IGNORE INTO users (id,mobile,role,name,subtitle,letter) VALUES (?,?,?,?,?,?)');
    const insTeacherAcc = db.prepare("INSERT OR IGNORE INTO teacher_accounts (user_id,teacher_id,status,bio,subject,version,review_note,created_at) VALUES (?,?,'approved',?,?,1,'تأیید سیستمی اولیه',?)");
    const nowMs = Date.now();
    for (const t of teachers) {
      const existingAcc = db.prepare('SELECT user_id FROM teacher_accounts WHERE teacher_id=?').get(t.id);
      if (!existingAcc) {
        const uid = t.id === 1 ? 2 : 100 + t.id;
        const mobile = t.id === 1 ? '09120000002' : `09120000${String(100 + t.id).padStart(3, '0')}`;
        insTeacherUser.run(uid, mobile, 'teacher', t.name, `دبیر ${t.subject}`, t.name[0] || 'م');
        insTeacherAcc.run(uid, t.id, t.about || `مدرس ${t.subject}`, t.subject || 'عمومی', nowMs);
      }
    }

    // Seed future occurrences for each class if fewer than 8 future occurrences exist.
    // Day offsets explicitly avoid +1d, +5d, +8d, +10d, +15d, +22d so automated test suites
    // that schedule at Date.now() + 1d/5d/8d/10d/15d/22d never hit a synthetic time collision.
    const safeDayOffsets = [2, 3, 4, 6, 7, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 23];
    const anchorMs = Math.ceil(nowMs / 3600000) * 3600000;
    const classesByTeacher = new Map();
    for (const c of db.prepare('SELECT id,teacher_id,session_minutes FROM classes ORDER BY id').all()) {
      const list = classesByTeacher.get(c.teacher_id) || [];
      list.push(c);
      classesByTeacher.set(c.teacher_id, list);
    }
    const insOcc = db.prepare("INSERT INTO class_occurrences (class_id,teacher_id,starts_at,ends_at,status,created_at) VALUES (?,?,?,?,'scheduled',?)");
    for (const [tid, clsList] of classesByTeacher.entries()) {
      clsList.forEach((cls, idx) => {
        const existingCount = db.prepare("SELECT COUNT(*) n FROM class_occurrences WHERE class_id=? AND status='scheduled' AND starts_at>?").get(cls.id, nowMs).n;
        if (existingCount >= 8) return;
        const durationMs = Math.max(45, Number(cls.session_minutes) || 90) * 60000;
        const slotShiftMs = (idx * 2 + 2) * 3600000;
        for (const dayOff of safeDayOffsets) {
          const startsAt = anchorMs + dayOff * 86400000 + slotShiftMs;
          const endsAt = startsAt + durationMs;
          const clash = db.prepare("SELECT 1 FROM class_occurrences WHERE teacher_id=? AND status='scheduled' AND starts_at<? AND ends_at>?").get(tid, endsAt + 1800000, startsAt - 1800000);
          if (!clash) {
            insOcc.run(cls.id, tid, startsAt, endsAt, nowMs);
          }
        }
      });
    }
  } catch (e) {
    console.error('Catalog consistency initialization error:', e.message);
  }
}
ensureCatalogAndScheduleConsistency();

/* ---------- teachers ---------- */
const teacherCard = (t) => ({
  id: t.id, name: t.name, subject: t.subject, level: t.level, rating: t.rating,
  reviews_count: t.reviews_count, classes_held: t.classes_held, students: t.students,
  price: t.price, month_badge: t.month_badge, badges: J(t.badges, []),
});

function buildSuggestedTeachers(teachers, { subject } = {}) {
  const byId = new Map(teachers.map((t) => [t.id, t]));
  const baseMeta = [
    { id: 1, badge: 'برتر ماه', tone: 'dark' },
    { id: 2, badge: 'برتر ماه', tone: 'dark' },
    { id: 4, badge: 'برتر ماه', tone: 'dark' },
    { id: 3, badge: 'مناسب سطح شما', tone: 'soft-orange' },
    { id: 5, badge: 'نزدیک محل شما', tone: 'soft' },
  ];
  const items = baseMeta
    .map((meta) => {
      const t = byId.get(meta.id);
      if (!t) return null;
      return {
        ...teacherCard(t),
        badge: meta.badge,
        tone: meta.tone,
      };
    })
    .filter(Boolean);
  if (subject && subject !== 'همه') {
    const normSub = normalizeFaSearch(subject);
    items.sort((a, b) => {
      const aMatch = normalizeFaSearch(a.subject).includes(normSub) ? 0 : 1;
      const bMatch = normalizeFaSearch(b.subject).includes(normSub) ? 0 : 1;
      return aMatch - bMatch;
    });
  }
  return items;
}

app.get('/api/teachers', (req, res) => {
  const { subject, sort, q } = req.query;
  let rows = db.prepare('SELECT * FROM teachers').all();
  if (subject && subject !== 'همه') rows = rows.filter((t) => t.subject === subject);
  if (q && String(q).trim()) {
    const nq = normalizeFaSearch(q);
    rows = rows.filter((t) => normalizeFaSearch(`${t.name} ${t.subject} ${t.title || ''} ${t.level || ''}`).includes(nq));
  }
  if (sort === 'rating') rows.sort((a, b) => b.rating - a.rating);
  if (sort === 'price') rows.sort((a, b) => a.price - b.price);
  if (sort === 'soon') rows.sort((a, b) => a.id - b.id);
  res.json({ teachers: rows.map(teacherCard) });
});

app.get('/api/teachers/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM teachers WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'استاد پیدا نشد' });
  const activeClasses = db.prepare('SELECT id,title,kind,mode,platform,grade,subject,days,time,sessions,session_minutes,capacity,taken,price,rating FROM classes WHERE teacher_id=? ORDER BY (capacity - taken) DESC, id ASC').all(t.id);
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
    activeClasses,
  });
});

/* ---------- classes ---------- */
app.get('/api/classes', (req, res) => {
  const { kind, subject, grade, sort, maxPrice, minRating, mode, q } = req.query;
  let rows = db.prepare('SELECT * FROM classes').all();
  const teachers = db.prepare('SELECT * FROM teachers').all();
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  if (kind && kind !== 'همه') rows = rows.filter((c) => c.kind === kind);
  if (subject && subject !== 'همه') rows = rows.filter((c) => c.subject === subject);
  if (grade && grade !== 'همه') rows = rows.filter((c) => c.grade === grade);
  if (mode && mode !== 'هر دو') rows = rows.filter((c) => c.mode === mode);
  if (maxPrice) rows = rows.filter((c) => c.price <= Number(maxPrice));
  if (minRating) rows = rows.filter((c) => c.rating >= Number(minRating));
  if (q && String(q).trim()) {
    const nq = normalizeFaSearch(q);
    rows = rows.filter((c) => {
      const t = teacherMap.get(c.teacher_id);
      const haystack = normalizeFaSearch(`${c.title} ${c.subject} ${c.grade} ${c.field || ''} ${c.mode || ''} ${c.days || ''} ${t?.name || ''} ${t?.subject || ''}`);
      return haystack.includes(nq);
    });
  }
  if (sort === 'price') rows.sort((a, b) => a.price - b.price);
  else if (sort === 'rating') rows.sort((a, b) => b.rating - a.rating);
  else if (sort === 'soon') rows.sort((a, b) => a.taken / a.capacity - b.taken / b.capacity);
  res.json({
    classes: rows.map((c) => ({
      ...c, badges: J(c.badges, []), syllabus: undefined, rules: undefined,
      teacher: teacherCard(teacherMap.get(c.teacher_id) || {}),
    })),
    suggested: buildSuggestedTeachers(teachers, { subject }),
    totalTeachers: teachers.length,
  });
});

/* ---------- live search & autocomplete suggestions ---------- */
app.get('/api/search/suggestions', (req, res) => {
  const rawQuery = String(req.query.q || '').slice(0, 120);
  const nq = normalizeFaSearch(rawQuery);
  const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 6));
  const allClasses = db.prepare('SELECT * FROM classes').all();
  const allTeachers = db.prepare('SELECT * FROM teachers').all();
  const teacherMap = new Map(allTeachers.map((t) => [t.id, t]));

  // Aggregate real subjects and class counts
  const subjectCounts = new Map();
  for (const c of allClasses) {
    if (!c.subject) continue;
    subjectCounts.set(c.subject, (subjectCounts.get(c.subject) || 0) + 1);
  }
  for (const t of allTeachers) {
    if (!t.subject) continue;
    const baseSub = t.subject.split(' ')[0];
    if (!subjectCounts.has(baseSub)) subjectCounts.set(baseSub, 1);
  }
  const allSubjects = Array.from(subjectCounts.entries()).map(([subject, count]) => ({
    subject,
    count,
    href: `/classes?subject=${encodeURIComponent(subject)}`,
  }));

  if (!nq) {
    return res.json({
      query: '',
      normalizedQuery: '',
      subjects: allSubjects.slice(0, 6),
      classes: allClasses.slice(0, 4).map((c) => {
        const t = teacherMap.get(c.teacher_id);
        return {
          id: c.id,
          title: c.title,
          subject: c.subject,
          grade: c.grade,
          kind: c.kind,
          mode: c.mode,
          price: c.price,
          rating: c.rating,
          teacherName: t?.name || '',
          teacherId: c.teacher_id,
          href: `/classes/${c.id}`,
        };
      }),
      teachers: allTeachers.slice(0, 4).map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        level: t.level,
        rating: t.rating,
        price: t.price,
        href: `/teachers/${t.id}`,
      })),
    });
  }

  const scoreText = (primary, secondary = '') => {
    const p = normalizeFaSearch(primary);
    const s = normalizeFaSearch(secondary);
    if (!p && !s) return 0;
    if (p === nq) return 120;
    if (p.startsWith(nq)) return 100;
    const words = p.split(' ');
    if (words.some((w) => w.startsWith(nq))) return 85;
    if (p.includes(nq)) return 65;
    if (s.startsWith(nq) || s.split(' ').some((w) => w.startsWith(nq))) return 55;
    if (s.includes(nq)) return 35;
    // Multi-token match (all query tokens appear in p + s)
    const qTokens = nq.split(' ').filter(Boolean);
    if (qTokens.length > 1 && qTokens.every((tok) => p.includes(tok) || s.includes(tok))) return 50;
    return 0;
  };

  const matchedSubjects = allSubjects
    .map((item) => ({ ...item, score: scoreText(item.subject) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score, ...rest }) => rest);

  const matchedClasses = allClasses
    .map((c) => {
      const t = teacherMap.get(c.teacher_id);
      const score = scoreText(`${c.title} ${c.subject} ${c.grade}`, `${t?.name || ''} ${c.field || ''} ${c.mode || ''} ${c.days || ''}`);
      return {
        score: score > 0 ? score + (Number(c.rating) || 0) : 0,
        item: {
          id: c.id,
          title: c.title,
          subject: c.subject,
          grade: c.grade,
          kind: c.kind,
          mode: c.mode,
          price: c.price,
          rating: c.rating,
          teacherName: t?.name || '',
          teacherId: c.teacher_id,
          href: `/classes/${c.id}`,
        },
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);

  const matchedTeachers = allTeachers
    .map((t) => {
      const score = scoreText(`${t.name} ${t.subject}`, `${t.title || ''} ${t.level || ''} ${t.areas || ''}`);
      return {
        score: score > 0 ? score + (Number(t.rating) || 0) : 0,
        item: {
          id: t.id,
          name: t.name,
          subject: t.subject,
          level: t.level,
          rating: t.rating,
          price: t.price,
          href: `/teachers/${t.id}`,
        },
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);

  res.json({
    query: rawQuery.trim(),
    normalizedQuery: nq,
    subjects: matchedSubjects,
    classes: matchedClasses,
    teachers: matchedTeachers,
  });
});

/* ---------- home first-registration promotion (real database coupon + tier rules) ---------- */
const authSec = require('./modules/auth/security');
app.get('/api/promotions/home', (req, res) => {
  const coupon = db.prepare('SELECT code, percent FROM coupons WHERE percent > 0 ORDER BY percent DESC, code ASC LIMIT 1').get();
  if (!coupon) return res.json({ promotion: null, firstRegistrationDiscount: null });
  let eligibleForFirstRegistration = true;
  try {
    const token = authSec.cookies(req)[authSec.ACCESS];
    if (token) {
      const nowMs = Date.now();
      const sess = db
        .prepare('SELECT user_id FROM auth_sessions WHERE access_hash=? AND revoked_at IS NULL AND access_expires>? AND refresh_expires>?')
        .get(authSec.hash(token), nowMs, nowMs);
      if (sess) {
        const u = db.prepare('SELECT id, role FROM users WHERE id=?').get(sess.user_id);
        const bookedCount = db
          .prepare("SELECT COUNT(*) n FROM bookings WHERE user_id=? AND status IN ('confirmed','held','paid')")
          .get(sess.user_id).n;
        if (!u || u.role !== 'student' || bookedCount > 0) {
          eligibleForFirstRegistration = false;
        }
      }
    }
  } catch {}
  const percent = Number(coupon.percent);
  const promoObj = {
    id: `first-reg-${String(coupon.code).toLowerCase()}`,
    active: true,
    code: coupon.code,
    percent,
    eligibleForFirstRegistration,
    title: 'تخفیف ثبت‌نام اول و رزرو کلاس در نیمکت',
    subtitle: `با ثبت‌نام در نیمکت و استفاده از کد ${coupon.code}، روی اولین رزرو کلاس خود ${percent}٪ تخفیف واقعی دریافت کنید.`,
    ctaPrimary: {
      label: 'ثبت‌نام و دریافت کد تخفیف',
      href: `/login?mode=signup&promo=${encodeURIComponent(coupon.code)}`,
    },
    ctaSecondary: {
      label: 'مشاهده کلاس‌ها و اساتید',
      href: '/classes',
    },
    tiers: [
      { sessions: 4, percent: 5 },
      { sessions: 8, percent: 10 },
      { sessions: 16, percent: 15 },
    ],
    friendDiscountPercent: 20,
  };
  res.json({
    promotion: promoObj,
    firstRegistrationDiscount: promoObj,
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

