/* Nimkat backend - database schema + seed data (from design PDFs) */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.NIMKAT_DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'nimkat.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,             -- student | teacher | parent
  subtitle TEXT,
  letter TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS otp (
  mobile TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY,
  name TEXT, title TEXT, subject TEXT, level TEXT,
  rating REAL, reviews_count INTEGER, classes_held INTEGER, students INTEGER,
  years INTEGER, price INTEGER, session_minutes INTEGER,
  badges TEXT, about TEXT, methods TEXT, areas TEXT, platform TEXT,
  video TEXT, credentials TEXT, history TEXT, subratings TEXT, slots TEXT,
  month_badge INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY,
  title TEXT, teacher_id INTEGER, kind TEXT, mode TEXT, platform TEXT,
  grade TEXT, field TEXT, subject TEXT, sessions INTEGER, session_minutes INTEGER,
  price INTEGER, rating REAL, reviews_count INTEGER, capacity INTEGER, taken INTEGER,
  days TEXT, time TEXT, desc TEXT, syllabus TEXT, rules TEXT, badges TEXT,
  deadline TEXT, location TEXT
);
CREATE TABLE IF NOT EXISTS callback_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER, author TEXT, role_label TEXT, letter TEXT, color TEXT,
  rating INTEGER, text TEXT, date_label TEXT, helpful INTEGER,
  class_label TEXT, replied INTEGER DEFAULT 0, reply TEXT
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER, author TEXT, text TEXT, answer TEXT, date_label TEXT
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, class_id INTEGER, sessions INTEGER, people INTEGER,
  seats TEXT, friends TEXT, gross INTEGER, discount INTEGER, total INTEGER,
  per_person INTEGER, coupon TEXT, status TEXT DEFAULT 'confirmed',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY,
  title TEXT, kind TEXT, subtitle TEXT, members TEXT, online INTEGER,
  invite_code TEXT, last TEXT, unread INTEGER DEFAULT 0, files TEXT, rules TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER, author TEXT, role TEXT, letter TEXT, color TEXT,
  text TEXT, time TEXT, day TEXT, attachment TEXT, system INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS club_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, done INTEGER, target INTEGER, coins INTEGER, deadline TEXT
);
CREATE TABLE IF NOT EXISTS club_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, desc TEXT, cost INTEGER, tag TEXT, locked INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS club_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, desc TEXT, amount INTEGER, date_label TEXT
);
CREATE TABLE IF NOT EXISTS wallet_tx (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, desc TEXT, amount INTEGER, date_label TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, title TEXT, desc TEXT, time_label TEXT, cancellable INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS upcoming (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, title TEXT, teacher TEXT, mode TEXT, date_label TEXT, time TEXT
);
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, title TEXT, meta TEXT, type TEXT
);
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER, desc TEXT, amount INTEGER, status TEXT, date_label TEXT
);
CREATE TABLE IF NOT EXISTS course_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER, name TEXT, subject TEXT, start TEXT, duration TEXT,
  sessions INTEGER, min_max TEXT, price_range TEXT, status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, percent INTEGER);
`);

/* ---------- page builder (editor) ---------- */
db.exec(`CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  schema_json TEXT NOT NULL,
  status TEXT DEFAULT 'draft',            -- draft | published
  updated_at TEXT DEFAULT (datetime('now','localtime')),
  updated_by INTEGER
)`);

// Additive migration: published content is a separate immutable-until-publish snapshot.
// Existing published pages are backfilled exactly once, not on every startup.
if (!db.prepare('PRAGMA table_info(pages)').all().some((c) => c.name === 'published_schema_json')) {
  db.transaction(() => {
  db.exec('ALTER TABLE pages ADD COLUMN published_schema_json TEXT');
  db.exec('ALTER TABLE pages ADD COLUMN published_title TEXT');
  db.exec("UPDATE pages SET published_schema_json=schema_json, published_title=title WHERE status='published'");
  })();
}

db.exec(`CREATE TABLE IF NOT EXISTS page_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_slug TEXT NOT NULL,
  schema_json TEXT NOT NULL,
  label TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  created_by INTEGER
)`);

db.exec(`CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'عمومی',
  schema_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime'))
)`);

/* admin user for the page editor (idempotent) */
db.prepare('INSERT OR IGNORE INTO users (id, mobile, name, role, subtitle, letter) VALUES (?,?,?,?,?,?)')
  .run(10, '09120000000', 'مدیر نیمکت', 'admin', 'مدیر محتوای سایت', 'م');

const count = db.prepare('SELECT COUNT(*) c FROM teachers').get().c;
if (count === 0) seed();

function seed() {
  const J = JSON.stringify;

  const insUser = db.prepare('INSERT INTO users (id, mobile, name, role, subtitle, letter) VALUES (?,?,?,?,?,?)');
  insUser.run(1, '09120000001', 'علی رضایی', 'student', 'پایه یازدهم · ریاضی', 'ع');
  insUser.run(2, '09120000002', 'سارا محمدی', 'teacher', 'دبیر فیزیک · متخصص', 'س');
  insUser.run(3, '09120000003', 'فاطمه احمدی', 'parent', 'مادر هستی، پایه ششم', 'ف');

  const insT = db.prepare(`INSERT INTO teachers
    (id,name,title,subject,level,rating,reviews_count,classes_held,students,years,price,session_minutes,badges,about,methods,areas,platform,video,credentials,history,subratings,slots,month_badge)
    VALUES (@id,@name,@title,@subject,@level,@rating,@reviews_count,@classes_held,@students,@years,@price,@session_minutes,@badges,@about,@methods,@areas,@platform,@video,@credentials,@history,@subratings,@slots,@month_badge)`);

  insT.run({
    id: 1, name: 'سارا محمدی', title: 'دبیر فیزیک و ریاضی متوسطه دوم · کارشناسی ارشد فیزیک از دانشگاه صنعتی شریف',
    subject: 'فیزیک', level: 'متخصص', rating: 4.9, reviews_count: 312, classes_held: 648, students: 184,
    years: 9, price: 450000, session_minutes: 90, badges: J(['برتر ماه', 'وقت‌شناس', 'حضور به‌موقع']),
    about: 'نه سال است فیزیک درس می‌دهم؛ پنج سال در دبیرستان‌های منطقه ۳ تهران و از ۱۴۰۱ به‌صورت آنلاین. کلاس‌هایم با یک سؤال از زندگی روزمره شروع می‌شود و بعد به فرمول می‌رسیم. برای هر شاگرد بعد از جلسهٔ اول یک برنامهٔ ۸ جلسه‌ای می‌نویسم و بعد از هر جلسه گزارش کوتاه برای خودش و والدینش می‌فرستم.',
    methods: 'مفهومی + حل مسئلهٔ پله‌ای', areas: 'مناطق ۱، ۲، ۳ و ۶ تهران', platform: 'اسکای‌روم با قلم نوری',
    video: 'ویدیوی معرفی · ۱ دقیقه و ۲۰ ثانیه',
    credentials: J([
      { title: 'کارت ملی', status: 'تأیید مدرک' },
      { title: 'مدرک ارشد', status: 'تأیید مدرک' },
      { title: 'گواهی المپیاد', status: 'تأیید گواهی' },
      { title: 'سابقهٔ بیمه', status: 'تأیید شده' },
    ]),
    history: J([
      { title: 'کارشناسی ارشد فیزیک حالت جامد', org: 'دانشگاه صنعتی شریف', year: '۱۳۹۴' },
      { title: 'کارشناسی فیزیک', org: 'دانشگاه تبریز', year: '۱۳۹۲' },
      { title: 'دبیر فیزیک، دبیرستان علامه حلی ۳', org: 'آموزش و پرورش', year: '۱۴۰۰' },
      { title: 'مدرس برتر المپیاد فیزیک استان تهران', org: 'المپیاد', year: '۱۳۹۸' },
    ]),
    subratings: J([
      { label: 'تسلط بر درس', value: '۴٫۹' },
      { label: 'بیان و انتقال مفهوم', value: '۴٫۸' },
      { label: 'وقت‌شناسی', value: '۵٫۰' },
      { label: 'برخورد با شاگرد', value: '۴٫۹' },
    ]),
    slots: J([
      { day: 'شنبه', times: [{ t: '۱۶:۰۰' }, { t: '۱۸:۳۰' }] },
      { day: 'یکشنبه', times: [{ t: '۱۷:۰۰' }] },
      { day: 'دوشنبه', times: [{ t: '۱۸:۰۰' }] },
      { day: 'سه‌شنبه', times: [{ t: '۱۶:۰۰' }, { t: '۱۹:۰۰' }] },
      { day: 'چهارشنبه', times: [{ t: '۱۵:۳۰' }] },
      { day: 'پنجشنبه', times: [{ t: '۱۵:۰۰', full: true }, { t: '۱۶:۳۰' }] },
    ]),
    month_badge: 1,
  });
  insT.run({
    id: 2, name: 'امیر رضایی', title: 'دبیر فیزیک کنکور · رتبهٔ برتر منطقهٔ یک', subject: 'فیزیک', level: 'متخصص',
    rating: 4.95, reviews_count: 221, classes_held: 508, students: 221, years: 11, price: 520000,
    session_minutes: 90, badges: J(['پرطرفدار', 'متخصص']), about: 'مشاور و دبیر فیزیک کنکور؛ کلاس‌ها با تست‌زمان‌دار و تحلیل آزمون پیش می‌رود.',
    methods: 'تست‌محور + تحلیل آزمون', areas: 'آنلاین', platform: 'اسکای‌روم', video: 'ویدیوی معرفی · ۲ دقیقه',
    credentials: J([{ title: 'مدرک ارشد فیزیک', status: 'تأیید مدرک' }]),
    history: J([{ title: 'کارشناسی ارشد فیزیک', org: 'دانشگاه تهران', year: '۱۳۹۰' }]),
    subratings: J([{ label: 'تسلط بر درس', value: '۵٫۰' }, { label: 'وقت‌شناسی', value: '۴٫۹' }]),
    slots: J([{ day: 'شنبه', times: [{ t: '۱۷:۰۰' }] }, { day: 'دوشنبه', times: [{ t: '۱۷:۰۰' }] }]),
    month_badge: 1,
  });
  insT.run({
    id: 3, name: 'نگار سلطانی', title: 'مدرس زبان انگلیسی کودکان و مکالمه', subject: 'زبان انگلیسی', level: 'کارشناس',
    rating: 4.87, reviews_count: 148, classes_held: 342, students: 167, years: 6, price: 320000,
    session_minutes: 60, badges: J(['مکالمه', 'کودکان']), about: 'کلاس‌های مکالمه با بازی و داستان؛ مخصوص کودکان و نوجوانان.',
    methods: 'CLIL + بازی', areas: 'آنلاین', platform: 'گوگل‌میت', video: 'ویدیوی معرفی · ۱ دقیقه',
    credentials: J([{ title: 'مدرک CELTA', status: 'تأیید گواهی' }]),
    history: J([{ title: 'کارشناسی زبان انگلیسی', org: 'دانشگاه الزهرا', year: '۱۳۹۶' }]),
    subratings: J([{ label: 'بیان و انتقال مفهوم', value: '۴٫۹' }]),
    slots: J([{ day: 'شنبه', times: [{ t: '۱۹:۰۰' }] }, { day: 'سه‌شنبه', times: [{ t: '۱۹:۰۰' }] }]),
    month_badge: 0,
  });
  insT.run({
    id: 4, name: 'کاوه مرادی', title: 'دبیر فیزیک متوسطه دوم', subject: 'فیزیک', level: 'کارشناس',
    rating: 4.8, reviews_count: 148, classes_held: 260, students: 120, years: 7, price: 350000,
    session_minutes: 90, badges: J(['حل تمرین']), about: 'حل تمرین قدم‌به‌قدم با جزوهٔ اختصاصی.',
    methods: 'حل مسئله', areas: 'آنلاین', platform: 'اسکای‌روم', video: 'ویدیوی معرفی · ۵۰ ثانیه',
    credentials: J([{ title: 'مدرک کارشناسی فیزیک', status: 'تأیید مدرک' }]),
    history: J([]), subratings: J([{ label: 'تسلط بر درس', value: '۴٫۸' }]),
    slots: J([{ day: 'سه‌شنبه', times: [{ t: '۱۷:۰۰' }] }, { day: 'پنجشنبه', times: [{ t: '۱۷:۰۰' }] }]),
    month_badge: 1,
  });
  insT.run({
    id: 5, name: 'رضا جعفری', title: 'دبیر فیزیک · آموزش در منزل', subject: 'فیزیک', level: 'مربی',
    rating: 4.7, reviews_count: 96, classes_held: 180, students: 84, years: 5, price: 190000,
    session_minutes: 90, badges: J(['حل تمرین']), about: 'کلاس حضوری در منزل شاگرد؛ مناطق ۱ تا ۶ تهران.',
    methods: 'ترکیبی', areas: 'مناطق ۱ تا ۶ تهران', platform: 'حضوری', video: '',
    credentials: J([{ title: 'مدرک کارشناسی', status: 'تأیید مدرک' }]),
    history: J([]), subratings: J([{ label: 'وقت‌شناسی', value: '۴٫۸' }]),
    slots: J([{ day: 'شنبه', times: [{ t: '۱۲:۰۰' }] }, { day: 'دوشنبه', times: [{ t: '۱۶:۰۰' }] }]),
    month_badge: 0,
  });
  insT.run({
    id: 6, name: 'حسین نوری', title: 'دبیر ریاضی کنکور', subject: 'ریاضی', level: 'متخصص',
    rating: 5, reviews_count: 298, classes_held: 741, students: 298, years: 12, price: 480000,
    session_minutes: 90, badges: J(['رتبه برتر', 'نخبه']), about: 'ریاضی کنکور با روش خلاصه‌نویسی و تست‌زنی مرحله‌ای.',
    methods: 'خلاصه‌نویسی + تست', areas: 'آنلاین', platform: 'اسکای‌روم', video: '',
    credentials: J([{ title: 'دکترای ریاضی', status: 'تأیید مدرک' }]),
    history: J([]), subratings: J([{ label: 'تسلط بر درس', value: '۵٫۰' }]),
    slots: J([{ day: 'یکشنبه', times: [{ t: '۱۶:۰۰' }] }]),
    month_badge: 0,
  });
  insT.run({
    id: 7, name: 'مریم کاظمی', title: 'دبیر ادبیات متوسطه', subject: 'ادبیات', level: 'کارشناس',
    rating: 4.92, reviews_count: 156, classes_held: 289, students: 156, years: 8, price: 300000,
    session_minutes: 75, badges: J(['خلاق', 'صبور']), about: 'ادبیات با روایت و داستان؛ نه فقط حفظ آرایه.',
    methods: 'روایی', areas: 'آنلاین', platform: 'اسکای‌روم', video: '',
    credentials: J([{ title: 'مدرک ارشد ادبیات', status: 'تأیید مدرک' }]),
    history: J([]), subratings: J([{ label: 'برخورد با شاگرد', value: '۵٫۰' }]),
    slots: J([{ day: 'چهارشنبه', times: [{ t: '۱۷:۰۰' }] }]),
    month_badge: 0,
  });

  const insC = db.prepare(`INSERT INTO classes
    (id,title,teacher_id,kind,mode,platform,grade,field,subject,sessions,session_minutes,price,rating,reviews_count,capacity,taken,days,time,desc,syllabus,rules,badges,deadline,location)
    VALUES (@id,@title,@teacher_id,@kind,@mode,@platform,@grade,@field,@subject,@sessions,@session_minutes,@price,@rating,@reviews_count,@capacity,@taken,@days,@time,@desc,@syllabus,@rules,@badges,@deadline,@location)`);

  const rules = J([
    'لغو تا ۲۴ ساعت قبل از جلسه رایگان است و مبلغ به کیف پول برمی‌گردد.',
    'لغو کمتر از ۲۴ ساعت: ۵۰٪ مبلغ همان جلسه کسر می‌شود.',
    'اگر استاد جلسه را لغو کند، جلسهٔ جایگزین یا استاد جایگزین پیشنهاد می‌شود.',
    'حضور بیش از ۱۵ دقیقه دیرتر، از زمان همان جلسه کم می‌شود.',
  ]);
  const syllabus = J([
    { chapter: 'فصل ۱ · الکتریسیتهٔ ساکن', sessions: 3, items: ['مفهوم بار و روش‌های باردار کردن', 'قانون کولن با ۱۲ مسئلهٔ پله‌ای', 'میدان الکتریکی و خطوط میدان'] },
    { chapter: 'فصل ۲ · جریان الکتریکی و مدارها', sessions: 2, items: [] },
    { chapter: 'فصل ۳ · مغناطیس', sessions: 2, items: [] },
    { chapter: 'جمع‌بندی و آزمون شبیه‌ساز', sessions: 1, items: [] },
  ]);

  insC.run({
    id: 1, title: 'حل تمرین فیزیک یازدهم برای امتحانات نوبت اول', teacher_id: 1, kind: 'group',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'یازدهم', field: 'ریاضی فیزیک', subject: 'فیزیک',
    sessions: 8, session_minutes: 90, price: 180000, rating: 4.9, reviews_count: 312, capacity: 12, taken: 9,
    days: 'پنجشنبه‌ها', time: '۱۶:۰۰', desc: 'این کلاس برای شاگردهایی است که در فیزیک یازدهم با مفاهیم مشکل دارند یا برای امتحان نوبت اول آماده می‌شوند. هر جلسه ۳۰ دقیقه مرور مفهوم، ۴۵ دقیقه حل مسئلهٔ هم‌سطح امتحان و ۱۵ دقیقه جمع‌بندی و تکلیف دارد. جزوه و تمرین‌ها بعد از هر جلسه در بخش فایل‌های پنل شما قرار می‌گیرد.',
    syllabus, rules, badges: J(['برتر ماه', 'جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام تا ۱۰ مهر',
    location: 'حضوری، آموزشگاه پارسه، خیابان کارگر شمالی',
  });
  insC.run({
    id: 2, title: 'فیزیک یازدهم؛ مفهومی + حل مسئله', teacher_id: 4, kind: 'group',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'یازدهم', field: 'ریاضی فیزیک', subject: 'فیزیک',
    sessions: 8, session_minutes: 90, price: 350000, rating: 4.8, reviews_count: 148, capacity: 10, taken: 10,
    days: 'سه‌شنبه‌ها', time: '۱۷:۰۰', desc: 'دورهٔ مفهومی با تست‌های سطح امتحان نهایی.',
    syllabus, rules, badges: J(['جلسهٔ اول با ضمانت']), deadline: 'ظرفیت تکمیل', location: 'آنلاین',
  });
  insC.run({
    id: 3, title: 'فیزیک یازدهم دوستانه؛ مناسب گروه‌های ۲ تا ۵ نفره', teacher_id: 3, kind: 'friendly',
    mode: 'آنلاین', platform: 'فنوتک', grade: 'یازدهم', field: 'ریاضی فیزیک', subject: 'فیزیک',
    sessions: 12, session_minutes: 90, price: 220000, rating: 4.8, reviews_count: 221, capacity: 8, taken: 4,
    days: 'شنبه و سه‌شنبه', time: '۱۹:۰۰', desc: 'با دوستانت یک کلاس بساز؛ تخفیف پلکانی و دوستانه روی سهم هر نفر اعمال می‌شود.',
    syllabus, rules, badges: J(['دوستانه']), deadline: 'ثبت‌نام تا ۲۰ مهر', location: 'آنلاین',
  });
  insC.run({
    id: 4, title: 'فیزیک یازدهم در منزل؛ مناطق ۱ تا ۶ تهران', teacher_id: 5, kind: 'group',
    mode: 'حضوری', platform: 'منزل شاگرد', grade: 'یازدهم', field: 'ریاضی فیزیک', subject: 'فیزیک',
    sessions: 6, session_minutes: 90, price: 190000, rating: 4.7, reviews_count: 96, capacity: 6, taken: 2,
    days: 'شنبه‌ها', time: '۱۲:۰۰', desc: 'کلاس حضوری در منزل شاگرد با رعایت چهارچوب نیمکت.',
    syllabus, rules, badges: J([]), deadline: 'ثبت‌نام تا ۱۵ مهر', location: 'منزل شاگرد',
  });
  insC.run({
    id: 5, title: 'فیزیک یازدهم؛ مفهومی و حل مسئله از پایه', teacher_id: 1, kind: 'private',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'یازدهم', field: 'ریاضی فیزیک', subject: 'فیزیک',
    sessions: 8, session_minutes: 90, price: 280000, rating: 4.9, reviews_count: 312, capacity: 5, taken: 0,
    days: 'به انتخاب شما', time: 'زمان‌های آزاد', desc: 'این کلاس برای شاگردهایی است که در فیزیک یازدهم با مفاهیم مشکل دارند یا برای امتحان نوبت اول آماده می‌شوند. هر جلسه ۳۰ دقیقه مرور مفهوم، ۴۵ دقیقه حل مسئلهٔ هم‌سطح امتحان و ۱۵ دقیقه جمع‌بندی و تکلیف دارد. جزوه و تمرین‌ها بعد از هر جلسه در بخش فایل‌های پنل شما قرار می‌گیرد.',
    syllabus, rules, badges: J(['جلسهٔ اول با ضمانت']), deadline: '', location: 'آنلاین · اسکای‌روم',
  });
  insC.run({
    id: 6, title: 'شیمی کنکور؛ مفاهیم، استوکیومتری و حل تست زمان‌دار', teacher_id: 2, kind: 'group',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'کنکور', field: 'تجربی و ریاضی', subject: 'شیمی',
    sessions: 8, session_minutes: 90, price: 520000, rating: 4.9, reviews_count: 289, capacity: 10, taken: 4,
    days: 'شنبه‌ها و دوشنبه‌ها', time: '۱۷:۰۰', desc: 'بررسی مفهومی و تستی شیمی کنکور همراه با تحلیل تیپ‌های پرتکرار و آزمونک پایان هر جلسه.',
    syllabus, rules, badges: J(['برتر ماه', 'جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
  });
  insC.run({
    id: 7, title: 'هندسه و گسسته؛ آموزش مفهومی و تیپ‌بندی تست‌ها', teacher_id: 6, kind: 'group',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'دوازدهم', field: 'ریاضی فیزیک', subject: 'ریاضی',
    sessions: 8, session_minutes: 90, price: 390000, rating: 4.7, reviews_count: 142, capacity: 8, taken: 3,
    days: 'یکشنبه‌ها و سه‌شنبه‌ها', time: '۱۶:۳۰', desc: 'آموزش گام‌به‌گام قضایای هندسه و مباحث نظریه اعداد و گراف در ریاضیات گسسته.',
    syllabus, rules, badges: J(['جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
  });
  insC.run({
    id: 8, title: 'زیست‌شناسی جامع کنکور؛ تحلیل ترکیبی شکل‌ها و نکات', teacher_id: 7, kind: 'group',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'کنکور', field: 'علوم تجربی', subject: 'زیست',
    sessions: 8, session_minutes: 90, price: 490000, rating: 4.9, reviews_count: 198, capacity: 12, taken: 5,
    days: 'شنبه‌ها و چهارشنبه‌ها', time: '۱۸:۰۰', desc: 'بررسی خط‌به‌خط کتاب درسی و تحلیل ترکیبی تصاویر زیست‌شناسی برای تسلط کامل در کنکور.',
    syllabus, rules, badges: J(['جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
  });
  insC.run({
    id: 9, title: 'حسابان و ریاضیات دوازدهم؛ کارگاه حل مسئله و امتحان نهایی', teacher_id: 4, kind: 'group',
    mode: 'آنلاین', platform: 'اسکای‌روم', grade: 'دوازدهم', field: 'ریاضی فیزیک', subject: 'ریاضی',
    sessions: 8, session_minutes: 90, price: 380000, rating: 4.8, reviews_count: 184, capacity: 10, taken: 4,
    days: 'یکشنبه‌ها و چهارشنبه‌ها', time: '۱۷:۳۰', desc: 'آموزش کامل مشتق، کاربرد مشتق و انتگرال با حل سؤالات استاندارد امتحان نهایی و کنکور.',
    syllabus, rules, badges: J(['برتر ماه', 'جلسهٔ اول با ضمانت']), deadline: 'ثبت‌نام فعال', location: 'آنلاین · اسکای‌روم',
  });

  const insR = db.prepare('INSERT INTO reviews (teacher_id,author,role_label,letter,color,rating,text,date_label,helpful,class_label,replied,reply) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  insR.run(1, 'زهرا کریمی', 'شاگرد تأییدشده', 'ز', 'green', 5, 'قبل از کلاس فکر می‌کردم فیزیک یعنی حفظ فرمول. خانم محمدی هر فرمول را اول با یک مثال توضیح می‌دهند. نمرهٔ نوبت اولم از ۱۴ به ۱۸ رسید.', 'دو هفته پیش', 24, 'فیزیک دهم · ۱۲ جلسه', 0, null);
  insR.run(1, 'مهدی صالحی', 'پدر آرین، پایه یازدهم', 'م', 'cream', 5, 'گزارش بعد از هر جلسه خیلی دقیق است؛ دقیقاً می‌نویسند کدام مبحث هنوز نیاز به تمرین دارد. یک جلسه هم که پسرم مریض بود بدون هزینه جابه‌جا شد.', 'یک ماه پیش', 24, 'فیزیک یازدهم · ۸ جلسه', 1, 'ممنون از اعتماد شما؛ آرزوی سلامتی برای آرین.');
  insR.run(1, 'سامان تقوی', 'شاگرد تأییدشده', 'س', 'mint', 4, 'کلاس منظم و جزوه‌ها عالی؛ فقط کاش ظرفیت گروهی زودتر پر نشود.', 'دو ماه پیش', 11, 'فیزیک یازدهم · گروهی', 0, null);

  const insQ = db.prepare('INSERT INTO questions (teacher_id,author,text,answer,date_label) VALUES (?,?,?,?,?)');
  insQ.run(1, 'پارسا کیانی', 'برای امتحان نهایی هم درس مفهومی می‌خوانید یا فقط تست؟', 'هر دو؛ نیمسال اول مفهومی با حل مسئله و از اسفند تمرکز روی تست‌های نهایی.', '۳ روز پیش');
  insQ.run(1, 'نگار کاظمی', 'جزوهٔ جلسه قبل را کجا پیدا کنیم؟', 'در پنل شما، بخش فایل‌ها و منابع. بعد از هر جلسه آپلود می‌شود.', '۱ هفته پیش');

  const insChat = db.prepare('INSERT INTO chats (id,title,kind,subtitle,members,online,invite_code,last,unread,files,rules) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  insChat.run(1, 'فیزیک یازدهم · گروه کلاس', 'group', 'ساخته‌شده خودکار برای ۹ شرکت‌کنندهٔ کلاس',
    J([
      { name: 'سارا محمدی', role: 'استاد · مدیر گروه', letter: 'س', color: 'green' },
      { name: 'حسین نوری', role: 'شاگرد', letter: 'ح', color: 'mint' },
      { name: 'نگار کاظمی', role: 'شاگرد', letter: 'ن', color: 'cream' },
      { name: 'پارسا کیانی', role: 'شاگرد', letter: 'پ', color: 'mint' },
      { name: 'علی رضایی', role: 'شما', letter: 'ع', color: 'orange' },
    ]),
    4, 'NK-4821', 'سارا محمدی: جواب تمرین ۷ را گذاشتم', 0,
    J([{ type: 'جزوه', count: 4 }, { type: 'عکس', count: 7 }, { type: 'صوت', count: 2 }]),
    'فقط شرکت‌کننده‌های کلاس پیام می‌فرستند. تا ۷۲ ساعت بعد از جلسهٔ آخر فعال است.');
  insChat.run(2, 'زبان B1 · شنبه‌ها', 'group', 'گروه کلاس گروهی زبان', J([]), 2, '', 'پارسا: Unit 3 رو کسی داره؟', 2, J([]), '');
  insChat.run(3, 'گپ اختصاصی شب امتحان', 'invite', 'دعوت‌نامه برای شما ارسال شده', J([]), 6, '', 'دعوت‌نامهٔ اختصاصی', 1, J([]), '');
  insChat.run(4, 'گپ عمومی نیمکت', 'public', 'همهٔ کاربرها', J([]), 38, '', 'قوانین جدید گروه‌ها را بخوانید', 0, J([]), '');

  const insM = db.prepare('INSERT INTO messages (chat_id,author,role,letter,color,text,time,day,attachment,system) VALUES (?,?,?,?,?,?,?,?,?,?)');
  insM.run(1, 'سیستم', 'system', '', '', 'علی عزیز، به پاس حضور منظم و امتیاز وفاداری بالای شما، به «گپ اختصاصی شب امتحان فیزیک» با حضور خانم محمدی دعوت شده‌اید. مرور نکات کلیدی و سؤالات احتمالی نوبت اول.', '۰۸:۳۰', '۳ روز پیش', null, 1);
  insM.run(1, 'حسین نوری', 'شاگرد', 'ح', 'mint', 'بچه‌ها تمرین ۷ صفحهٔ ۲ رو کسی حل کرد؟ جهت میدان رو نمی‌فهمم', '۱۶:۳۲', 'دیروز', null, 0);
  insM.run(1, 'نگار کاظمی', 'شاگرد', 'ن', 'cream', 'من حل کردم ولی مطمئن نیستم، بار منفی جهت رو عوض می‌کنه دیگه؟', '۱۶:۳۴', 'دیروز', null, 0);
  insM.run(1, 'سارا محمدی', 'استاد', 'س', 'green', 'دقیقاً. بردار میدان همیشه از دید بار مثبت آزمون تعریف می‌شه. جواب کامل رو گذاشتم، اول خودتون یک بار دیگه امتحان کنید.', '۱۶:۴۰', 'دیروز', J({ name: 'جواب کامل تمرین ۷.pdf', size: '۳۴۰ کیلوبایت' }), 0);
  insM.run(1, 'علی رضایی', 'شما', 'ع', 'orange', 'ممنون خانم محمدی، الان فهمیدم کجا رو اشتباه می‌رفتم', '۱۶:۴۲', 'دیروز', null, 0);
  insM.run(1, 'سارا محمدی', 'استاد', 'س', 'green', 'یادآوری: جلسهٔ امروز ساعت ۱۶:۰۰، مبحث قانون کولن. تست فنی را فراموش نکنید.', '۱۲:۱۰', 'امروز', null, 0);

  const insMis = db.prepare('INSERT INTO club_missions (title,done,target,coins,deadline) VALUES (?,?,?,?,?)');
  insMis.run('شرکت در بیش از ۱۰ کلاس', 7, 10, 50, '');
  insMis.run('سه کلاس ۵ ستاره', 2, 3, 20, '');
  insMis.run('شرکت در یک کلاس گروهی', 0, 1, 30, '');
  insMis.run('فعالیت ماهانه در نیم‌چت', 1, 1, 10, '');

  const insRew = db.prepare('INSERT INTO club_rewards (title,desc,cost,tag,locked) VALUES (?,?,?,?,?)');
  insRew.run('دو جلسه‌ی رایگان با استاد برتر', 'ویژه‌ی سطح طلایی', 5500, 'سطح طلایی', 1);
  insRew.run('شارژ ۱۰۰ هزار تومانی کیف پول', 'قابل استفاده برای هر کلاس', 500, 'دریافت', 0);
  insRew.run('پک لوازم‌التحریر نیمکت', 'ارسال رایگان به سراسر ایران', 700, 'دریافت', 0);
  insRew.run('یک جلسه مشاوره‌ی تحصیلی', '۴۵ دقیقه، آنلاین', 400, 'دریافت', 0);

  const insH = db.prepare('INSERT INTO club_history (user_id,desc,amount,date_label) VALUES (?,?,?,?)');
  insH.run(1, 'حضور در جلسه‌ی ۲ فیزیک یازدهم', 50, '۸ مهر');
  insH.run(1, 'نظرسنجی پایان کلاس زبان', 15, '۷ مهر');
  insH.run(1, 'دعوت پارسا کیانی', 50, '۵ مهر');
  insH.run(1, 'دریافت پک لوازم‌التحریر', -700, '۱ مهر');
  insH.run(1, 'سکه‌های آغاز فصل پاییز', 3005, '۳۰ شهریور');

  const insW = db.prepare('INSERT INTO wallet_tx (user_id,desc,amount,date_label) VALUES (?,?,?,?)');
  insW.run(1, 'موجودی اولیهٔ کیف پول', 2266000, '۱ مهر');
  insW.run(1, 'رزرو ۸ جلسه فیزیک یازدهم', -2016000, 'دیروز');
  insW.run(1, 'شارژ کیف پول از درگاه', 990000, '۵ مهر');

  const insN = db.prepare('INSERT INTO notifications (user_id,title,desc,time_label,cancellable) VALUES (?,?,?,?,?)');
  insN.run(1, 'پرداخت موفق', 'رزرو ۸ جلسه فیزیک یازدهم · ۲٬۰۱۶٬۰۰۰ تومان', 'دیروز', 1);
  insN.run(1, 'جزوهٔ جدید', 'سارا محمدی «میدان الکتریکی - تمرین‌ها» را فرستاد', '۲ روز پیش', 0);
  insN.run(1, '+۲۰ سکه', 'برای شرکت در جلسهٔ ۲ فیزیک', '۲ روز پیش', 0);
  insN.run(1, 'تغییر زمان', 'کلاس زبان شنبه از ۱۶ به ۱۷ منتقل شد', '۳ روز پیش', 1);

  const insU = db.prepare('INSERT INTO upcoming (user_id,title,teacher,mode,date_label,time) VALUES (?,?,?,?,?,?)');
  insU.run(1, 'فیزیک یازدهم', 'سارا محمدی', 'آنلاین', 'امروز', '۱۶:۰۰');
  insU.run(1, 'ریاضی یازدهم · حسابان', 'کاوه مرادی', 'آنلاین', 'پنجشنبه ۱۰ مهر', '۱۵:۰۰');
  insU.run(1, 'زبان انگلیسی · مکالمه', 'نگار سلطانی', 'گروهی · ۶ نفر', 'شنبه ۱۲ مهر', '۱۷:۰۰');
  insU.run(1, 'فیزیک یازدهم', 'سارا محمدی', 'آنلاین', 'سه‌شنبه ۱۵ مهر', '۱۶:۰۰');

  const insF = db.prepare('INSERT INTO files (user_id,title,meta,type) VALUES (?,?,?,?)');
  insF.run(1, 'میدان الکتریکی - تمرین‌ها', 'فیزیک · ۲٫۴ مگابایت', 'PDF');
  insF.run(1, 'خلاصهٔ قانون کولن', 'فیزیک · ۸۵۰ کیلوبایت', 'PDF');
  insF.run(1, 'Unit 2 - Listening', 'زبان · ۳ دقیقه', 'MP3');

  const insS = db.prepare('INSERT INTO settlements (teacher_id,desc,amount,status,date_label) VALUES (?,?,?,?,?)');
  insS.run(1, 'تسویهٔ دوره‌ای · ۲۴ جلسه', 6840000, 'واریز شد', '۱۵ مهر');
  insS.run(1, 'تسویهٔ دوره‌ای · در حال محاسبه', 4780000, 'در انتظار', '۱ مهر');
  insS.run(1, 'تسویهٔ دوره‌ای · ۲۱ جلسه', 5985000, 'واریز شد', '۲۴ شهریور');

  db.prepare('INSERT INTO coupons (code,percent) VALUES (?,?)').run('MEHR05', 5);
  try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch {}
}

module.exports = db;
