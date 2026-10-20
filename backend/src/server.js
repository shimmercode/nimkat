/* Nimkat backend - Express API server */
const express = require('express');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;
const SECRET = process.env.NIMKAT_SECRET || 'nimkat-dev-secret';

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------- helpers ---------- */
const J = (s, fallback = null) => {
  try { return JSON.parse(s); } catch { return fallback; }
};
const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};
const verify = (token) => {
  try {
    const [body, sig] = token.split('.');
    const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    if (sig !== expect) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
};
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verify(token);
  if (!payload) return res.status(401).json({ error: 'نیاز به ورود دارید' });
  req.user = db.prepare('SELECT * FROM users WHERE id=?').get(payload.uid);
  if (!req.user) return res.status(401).json({ error: 'کاربر پیدا نشد' });
  next();
};
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'دسترسی برای این نقش مجاز نیست' });
  next();
};
const teacherIdFor = (user) =>
  db.prepare('SELECT id FROM teachers WHERE name=?').get(user.name)?.id || null;
const faPrice = (n) => Math.round(n).toLocaleString('en-US');

const tierDiscount = (sessions) => (sessions >= 16 ? 0.15 : sessions >= 8 ? 0.1 : sessions >= 4 ? 0.05 : 0);

/* ---------- auth (OTP) ---------- */
app.post('/api/auth/otp/request', (req, res) => {
  const { mobile } = req.body || {};
  if (!/^09\d{9}$/.test(String(mobile))) return res.status(400).json({ error: 'شماره موبایل ۱۱ رقم است' });
  const code = String(Math.floor(10000 + Math.random() * 90000));
  db.prepare('INSERT INTO otp (mobile, code, expires_at, attempts) VALUES (?,?,?,0) ON CONFLICT(mobile) DO UPDATE SET code=excluded.code, expires_at=excluded.expires_at, attempts=0')
    .run(mobile, code, Date.now() + 2 * 60 * 1000);
  console.log(`[OTP] ${mobile} -> ${code}`);
  res.json({ ok: true, devCode: code, expires_in: 120, max_attempts: 5 });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { mobile, code, role } = req.body || {};
  const row = db.prepare('SELECT * FROM otp WHERE mobile=?').get(mobile);
  if (!row) return res.status(400).json({ error: 'اول کد را درخواست کنید' });
  if (row.expires_at < Date.now()) return res.status(400).json({ error: 'کد منقضی شده؛ دوباره ارسال کنید' });
  if (row.attempts >= 5) return res.status(400).json({ error: 'حداکثر ۵ بار می‌توانید کد را وارد کنید' });
  if (row.code !== String(code)) {
    db.prepare('UPDATE otp SET attempts=attempts+1 WHERE mobile=?').run(mobile);
    return res.status(400).json({ error: 'کد تأیید درست نیست' });
  }
  db.prepare('DELETE FROM otp WHERE mobile=?').run(mobile);

  let user = db.prepare('SELECT * FROM users WHERE mobile=?').get(mobile);
  if (!user) {
    const chosen = ['student', 'teacher', 'parent'].includes(role) ? role : 'student';
    const info = db.prepare('INSERT INTO users (mobile, name, role, subtitle, letter) VALUES (?,?,?,?,?)')
      .run(mobile, 'کاربر نیمکت', chosen, 'پروفایل کامل نشده', 'ک');
    user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  }
  const token = sign({ uid: user.id, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  res.json({ ok: true, token, user });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

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

/* ---------- pricing + booking ---------- */
app.post('/api/bookings/quote', (req, res) => {
  const { classId, sessions = 1, people = 1, coupon } = req.body || {};
  const c = db.prepare('SELECT * FROM classes WHERE id=?').get(classId);
  if (!c) return res.status(404).json({ error: 'کلاس پیدا نشد' });
  const gross = c.price * sessions * people;
  const tier = tierDiscount(sessions);
  const tierOff = gross * tier;
  const friendOff = people >= 2 ? (gross - tierOff) * 0.2 : 0;
  let couponOff = 0;
  let couponCode = null;
  if (coupon) {
    const cp = db.prepare('SELECT * FROM coupons WHERE code=?').get(String(coupon).toUpperCase());
    if (cp) { couponOff = (gross - tierOff - friendOff) * (cp.percent / 100); couponCode = cp.code; }
  }
  const total = gross - tierOff - friendOff - couponOff;
  res.json({
    gross, tier_percent: tier * 100, tier_off: tierOff,
    friend_percent: people >= 2 ? 20 : 0, friend_off: friendOff,
    coupon_percent: couponCode ? 5 : 0, coupon_off: couponOff,
    total, per_person: people ? total / people : total,
  });
});

app.post('/api/bookings', auth, (req, res) => {
  const { classId, sessions = 1, people = 1, friends = [], coupon, seats = [] } = req.body || {};
  const c = db.prepare('SELECT * FROM classes WHERE id=?').get(classId);
  if (!c) return res.status(404).json({ error: 'کلاس پیدا نشد' });
  const gross = c.price * sessions * people;
  const tier = tierDiscount(sessions);
  const tierOff = gross * tier;
  const friendOff = people >= 2 ? (gross - tierOff) * 0.2 : 0;
  let couponOff = 0;
  if (coupon) {
    const cp = db.prepare('SELECT * FROM coupons WHERE code=?').get(String(coupon).toUpperCase());
    if (cp) couponOff = (gross - tierOff - friendOff) * (cp.percent / 100);
  }
  const total = gross - tierOff - friendOff - couponOff;
  const per = total / people;

  const info = db.prepare('INSERT INTO bookings (user_id,class_id,sessions,people,seats,friends,gross,discount,total,per_person,coupon) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(req.user.id, classId, sessions, people, JSON.stringify(seats), JSON.stringify(friends), gross, tierOff + friendOff + couponOff, total, per, coupon || null);
  const walletBefore = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM wallet_tx WHERE user_id=?').get(req.user.id).s;
  if (walletBefore < per) {
    db.prepare('INSERT INTO wallet_tx (user_id,desc,amount,date_label) VALUES (?,?,?,?)')
      .run(req.user.id, 'پرداخت آنلاین (درگاه شبیه‌سازی‌شده)', per, 'امروز');
  }
  db.prepare('INSERT INTO wallet_tx (user_id,desc,amount,date_label) VALUES (?,?,?,?)')
    .run(req.user.id, `رزرو ${sessions} جلسه ${c.title}`, -per, 'امروز');
  db.prepare('INSERT INTO club_history (user_id,desc,amount,date_label) VALUES (?,?,?,?)')
    .run(req.user.id, 'رزرو کلاس جدید', 10, 'امروز');
  db.prepare('INSERT INTO notifications (user_id,title,desc,time_label,cancellable) VALUES (?,?,?,?,1)')
    .run(req.user.id, 'پرداخت موفق', `رزرو ${sessions} جلسه ${c.title} · ${faPrice(per)} تومان`, 'هم‌اکنون');
  res.json({ ok: true, bookingId: info.lastInsertRowid, total, per_person: per });
});

/* ---------- chats ---------- */
app.get('/api/chats', auth, (req, res) => {
  res.json({ chats: db.prepare('SELECT id,title,kind,subtitle,last,unread FROM chats').all() });
});
app.get('/api/chats/:id', auth, (req, res) => {
  const chat = db.prepare('SELECT * FROM chats WHERE id=?').get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'گپ پیدا نشد' });
  res.json({
    chat: { ...chat, members: J(chat.members, []), files: J(chat.files, []) },
    messages: db.prepare('SELECT * FROM messages WHERE chat_id=? ORDER BY id').all(chat.id),
  });
});
app.post('/api/chats/:id/messages', auth, (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'متن پیام خالی است' });
  const info = db.prepare('INSERT INTO messages (chat_id,author,role,letter,color,text,time,day,attachment,system) VALUES (?,?,?,?,?,?,?,?,?,0)')
    .run(req.params.id, req.user.name, 'شما', req.user.letter, 'orange', text, 'هم‌اکنون', 'امروز', null);
  res.json({ ok: true, message: db.prepare('SELECT * FROM messages WHERE id=?').get(info.lastInsertRowid) });
});

/* ---------- club ---------- */
app.get('/api/club', auth, (req, res) => {
  const balance = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM club_history WHERE user_id=?').get(req.user.id).s;
  res.json({
    balance,
    level: { name: 'نیمکت نقره‌ای', next: 'نیمکت طلایی', coins_to_next: Math.max(0, 3000 - balance) },
    levels: [
      { name: 'نیمکت برنزی', range: '۰ تا ۴۹۹ سکه', perks: ['۵٪ تخفیف کلاس گروهی'], state: 'passed' },
      { name: 'نیمکت نقره‌ای', range: '۵۰۰ تا ۲٬۹۹۹ سکه', perks: ['۱۰٪ تخفیف کلاس گروهی', 'اولویت در گپ‌های اختصاصی'], state: 'current' },
      { name: 'نیمکت طلایی', range: '۳٬۰۰۰ تا ۴٬۹۹۹ سکه', perks: ['دو جلسه‌ی رایگان با برترین استاد', 'لوح تقدیر', 'مشاوره رایگان'], state: 'next' },
      { name: 'نیمکت پلاتینیوم', range: 'از ۴٬۰۰۰ سکه', perks: ['شارژ ۵۰۰ هزار تومانی کیف پول', 'کارت نخبگان نیمکت'], state: 'locked' },
    ],
    earn: [
      { title: 'تکمیل پروفایل', coins: 10 }, { title: 'کد معرف (به ازای هر دوست)', coins: 50 },
      { title: 'اولین کلاس برگزارشده', coins: 30 }, { title: 'هر کلاس موفق', coins: 20 },
      { title: 'شرکت در نظرسنجی پایان کلاس', coins: 15 }, { title: 'شرکت در کلاس گروهی', coins: 30 },
      { title: 'چالش هفتگی', coins: 50 }, { title: 'پرسش و پاسخ در پروفایل استاد', coins: 10 },
    ],
    missions: db.prepare('SELECT * FROM club_missions').all(),
    rewards: db.prepare('SELECT * FROM club_rewards').all(),
    history: db.prepare('SELECT * FROM club_history WHERE user_id=? ORDER BY id DESC').all(req.user.id),
  });
});
app.post('/api/club/rewards/:id/claim', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM club_rewards WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'جایزه پیدا نشد' });
  if (r.locked) return res.status(400).json({ error: 'این جایزه ویژهٔ سطح طلایی است' });
  const balance = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM club_history WHERE user_id=?').get(req.user.id).s;
  if (balance < r.cost) return res.status(400).json({ error: 'سکهٔ کافی ندارید' });
  const already = db.prepare('SELECT id FROM club_history WHERE user_id=? AND desc=?').get(req.user.id, `دریافت ${r.title}`);
  if (already) return res.status(400).json({ error: 'این جایزه قبلاً دریافت شده است' });
  db.prepare('INSERT INTO club_history (user_id,desc,amount,date_label) VALUES (?,?,?,?)')
    .run(req.user.id, `دریافت ${r.title}`, -r.cost, 'امروز');
  res.json({ ok: true, claimed: r.title, cost: r.cost });
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
require('./modules/content/routes')(app, { db, auth, requireRole, verify, J });

/* ---------- student panel ---------- */
app.get('/api/panel/student', auth, requireRole('student', 'parent'), (req, res) => {
  const uid = req.user.id;
  const wallet = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM wallet_tx WHERE user_id=?').get(uid).s;
  const club = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM club_history WHERE user_id=?').get(uid).s;
  res.json({
    user: req.user,
    wallet,
    club_coins: club,
    stats: { month_sessions: 9, booked: 12, attendance: '۱۰۰٪', attendance_note: 'بدون غیبت در مهر', profile_percent: 70, profile_missing: 'انتخاب درس‌های مورد علاقه · شمارهٔ والدین · عکس پروفایل' },
    next_class: {
      title: 'فیزیک یازدهم · قانون کولن', teacher: 'سارا محمدی', teacher_title: 'دبیر فیزیک · متخصص',
      when: 'امروز · ساعت ۱۶:۰۰ تا ۱۷:۳۰ · اسکای‌روم', session: 'جلسهٔ ۳ از ۸', starts_in: 'شروع تا ۴۵ دقیقهٔ دیگر',
      prep: [
        'تکلیف جلسهٔ ۲ تحویل شد · ۸ از ۱۰ تمرین',
        'جزوهٔ «میدان الکتریکی» را قبل از کلاس ببین',
        'سؤال پین‌شده: «تمرین ۷ صفحهٔ ۳۲»',
      ],
    },
    notifications: db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC').all(uid),
    upcoming: db.prepare('SELECT * FROM upcoming WHERE user_id=?').all(uid),
    report: {
      subject: 'فیزیک',
      months: [
        { m: 'فروردین', v: null }, { m: 'اردیبهشت', v: null }, { m: 'خرداد', v: 12 },
        { m: 'تیر', v: 14 }, { m: 'مرداد', v: null }, { m: 'شهریور', v: 16 }, { m: 'مهر', v: 18 },
      ],
      note: 'در مسائل میدان الکتریکی هنوز جهت بردار را جا می‌اندازد. تمرین ۴ تا ۹ جزوهٔ جلسهٔ ۲ را دوباره حل کند.',
    },
    files: db.prepare('SELECT * FROM files WHERE user_id=?').all(uid),
    wallet_tx: db.prepare('SELECT * FROM wallet_tx WHERE user_id=? ORDER BY id DESC').all(uid),
  });
});

app.post('/api/wallet/charge', auth, (req, res) => {
  const amount = Number(req.body?.amount);
  if (!amount || amount < 10000) return res.status(400).json({ error: 'حداقل شارژ ۱۰٬۰۰۰ تومان است' });
  db.prepare('INSERT INTO wallet_tx (user_id,desc,amount,date_label) VALUES (?,?,?,?)')
    .run(req.user.id, 'شارژ کیف پول (درگاه شبیه‌سازی‌شده)', amount, 'امروز');
  const balance = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM wallet_tx WHERE user_id=?').get(req.user.id).s;
  res.json({ ok: true, balance });
});

app.post('/api/notifications/:id/cancel', auth, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

/* ---------- teacher panel ---------- */
app.get('/api/panel/teacher', auth, requireRole('teacher'), (req, res) => {
  const tid = teacherIdFor(req.user) || 1;
  res.json({
    user: req.user,
    today: { classes: 9, income: 1850000, share: '۷۸٪', growth: '۱۸+٪' },
    month: { sessions: 23, income: 12450000, rating: 4.9, reviews: 320, active_students: 28, new_students: 4 },
    level: {
      current: 'متخصص', next: 'استاد ارشد', sessions_done: 148, sessions_need: 200,
      requirements: ['۲۰۰ جلسهٔ موفق', 'حضور به‌موقع بالای ۹۵٪', 'یک دورهٔ گروهی تأییدشده'],
    },
    tip: { title: 'نیم‌پند', text: 'پنج دقیقهٔ اول را به سؤال شاگرد بدهید، نه به درس جدید. شاگردی که احساس کند سؤال جلسهٔ قبلش شنیده شده، ۳ برابر بیشتر کلاس را تمدید می‌کند.' },
    today_classes: [
      { time: '۰۸:۰۰', title: 'فیزیک دهم · مریم کاظمی', kind: 'خصوصی · آنلاین', state: 'done' },
      { time: '۱۱:۳۰', title: 'فیزیک یازدهم · گروه مدرسهٔ نیکان', kind: 'گروهی · آنلاین', state: 'done' },
      { time: '۱۶:۰۰', title: 'فیزیک یازدهم · علی رضایی', kind: 'خصوصی · آنلاین', state: 'live' },
      { time: '۱۷:۳۰', title: 'فیزیک یازدهم · دوستانه ۳ نفر', kind: 'آنلاین', state: 'next' },
      { time: '۱۹:۰۰', title: 'رفع اشکال · هستی احمدی', kind: 'آنلاین', state: 'next' },
      { time: '۲۰:۳۰', title: 'رفع اشکال · منطقه ۳', kind: 'حضوری · منطقه ۳', state: 'next' },
    ],
    reviews: db.prepare('SELECT * FROM reviews WHERE teacher_id=?').all(tid),
    settlements: db.prepare('SELECT * FROM settlements WHERE teacher_id=?').all(tid),
    sheba: 'IR06 0170 **** 4218 · بانک ملی',
    course_requests: db.prepare('SELECT * FROM course_requests WHERE teacher_id=?').all(tid),
  });
});

app.post('/api/teacher/course-requests', auth, requireRole('teacher'), (req, res) => {
  const b = req.body || {};
  const status = b.submit ? 'pending' : 'draft';
  const tid = teacherIdFor(req.user) || 1;
  db.prepare('INSERT INTO course_requests (teacher_id,name,subject,start,duration,sessions,min_max,price_range,status) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(tid, b.name || '', b.subject || '', b.start || '', b.duration || '', b.sessions || 0, b.min_max || '', b.price_range || '', status);
  res.json({ ok: true, status });
});

app.post('/api/teacher/reviews/:id/reply', auth, requireRole('teacher'), (req, res) => {
  const text = (req.body?.text ?? req.body?.reply ?? '').trim();
  if (!text) return res.status(400).json({ error: 'متن پاسخ خالی است' });
  const rv = db.prepare('SELECT * FROM reviews WHERE id=?').get(req.params.id);
  if (!rv) return res.status(404).json({ error: 'نظر پیدا نشد' });
  db.prepare('UPDATE reviews SET replied=1, reply=? WHERE id=?').run(text, req.params.id);
  res.json({ ok: true });
});

/* ---------- misc ---------- */
app.post('/api/questions', auth, (req, res) => {
  const { teacherId, text } = req.body || {};
  db.prepare('INSERT INTO questions (teacher_id,author,text,answer,date_label) VALUES (?,?,?,NULL,?)')
    .run(teacherId, req.user.name, text, 'هم‌اکنون');
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'nimkat-api', version: '1.0.0' }));

app.use((req, res) => res.status(404).json({ error: 'مسیر پیدا نشد' }));

app.listen(PORT, '0.0.0.0', () => console.log(`Nimkat API listening on http://0.0.0.0:${PORT}`));
