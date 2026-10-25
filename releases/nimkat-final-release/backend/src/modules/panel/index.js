const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

function categorizeNotification(source = '', title = '') {
  const s = String(source || '').toLowerCase();
  const t = String(title || '');
  if (s.startsWith('claim:') || s.startsWith('level:') || s.startsWith('medal:') || s.startsWith('mission') || s.startsWith('spin') || s.startsWith('streak') || s.startsWith('reward')) return 'club';
  if (s.startsWith('progress:') || t.includes('تحصیلی') || t.includes('گزارش')) return 'academic';
  if (s.startsWith('payment') || s.startsWith('booking') || s.startsWith('refund') || t.includes('پرداخت') || t.includes('کیف پول')) return 'financial';
  return 'system';
}

function panelModule(app, { db, auth, finance, club, now = Date.now }) {
  try {
    db.exec('ALTER TABLE users ADD COLUMN subtitle TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN letter TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE classes ADD COLUMN platform TEXT');
  } catch {}
  db.exec(`CREATE TABLE IF NOT EXISTS user_notification_dismissals(
    user_id INTEGER NOT NULL,
    notification_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, notification_id)
  )`);

  function buildProfileCompletion(uid) {
    const a = club.account(uid);
    const u = db.prepare('SELECT id, name, mobile, role, subtitle, letter FROM users WHERE id=?').get(uid) || {};
    let p = {};
    try {
      p = JSON.parse(a.profile || '{}') || {};
    } catch {
      p = {};
    }
    const checks = [
      { key: 'name', label: 'نام و نام خانوادگی', done: Boolean(u.name && String(u.name).trim().length >= 2) },
      { key: 'subtitle', label: 'پایه و رشتهٔ تحصیلی', done: Boolean(u.subtitle && String(u.subtitle).trim().length >= 2) },
      { key: 'alias', label: 'نام نمایشی در کلاب', done: Boolean(p.alias && String(p.alias).trim().length >= 2) },
      { key: 'location', label: 'استان و شهر محل سکونت', done: Boolean(p.province && String(p.province).trim().length >= 2 && p.city && String(p.city).trim().length >= 2) },
      { key: 'goal', label: 'هدف یادگیری (حداقل ۱۰ نویسه)', done: Boolean(p.goal && String(p.goal).trim().length >= 10) },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    const percent = Math.round((doneCount / checks.length) * 100);
    const missing = checks.filter((c) => !c.done).map((c) => c.label);
    const rewardClaimed = Boolean(
      db.prepare("SELECT 1 FROM loyalty_events WHERE user_id=? AND kind='profile.completed'").get(uid)
    );
    return {
      percent,
      doneCount,
      totalCount: checks.length,
      missing,
      rewardClaimed,
      fields: {
        name: u.name || '',
        mobile: u.mobile || '',
        subtitle: u.subtitle || '',
        alias: p.alias || '',
        province: p.province || '',
        city: p.city || '',
        goal: p.goal || '',
        country: p.country || 'IR',
        leagueOptIn: Boolean(a.league_opt_in),
      },
    };
  }

  function listNotifications(uid, limit = 30) {
    const rows = db
      .prepare(
        `SELECT n.id, n.source, n.title, n.body, n.created_at, n.read_at
         FROM loyalty_notifications n
         WHERE n.user_id=?
           AND NOT EXISTS (
             SELECT 1 FROM user_notification_dismissals d
             WHERE d.user_id=n.user_id AND d.notification_id=n.id
           )
         ORDER BY n.id DESC
         LIMIT ?`
      )
      .all(uid, limit);
    return rows.map((r) => ({
      ...r,
      category: categorizeNotification(r.source, r.title),
    }));
  }

  const overview = (req, res) => {
    const uid = req.user.id;
    const a = club.account(uid);
    const cfg = club.configuration();
    const teacher = db
      .prepare("SELECT teacher_id FROM teacher_accounts WHERE user_id=? AND status='approved'")
      .get(uid);
    const upcoming = db
      .prepare(
        `SELECT DISTINCT o.id, o.starts_at, o.ends_at, c.id class_id, c.title, c.mode, c.platform, t.name teacher_name
         FROM class_occurrences o
         JOIN classes c ON c.id=o.class_id
         JOIN teachers t ON t.id=o.teacher_id
         WHERE o.status='scheduled'
           AND o.ends_at>?
           AND (
             o.teacher_id=?
             OR EXISTS(
               SELECT 1 FROM booking_occurrences bo
               JOIN bookings b ON b.id=bo.booking_id
               WHERE bo.occurrence_id=o.id AND b.user_id=? AND b.status='confirmed' AND b.schema_version=2
             )
           )
         ORDER BY o.starts_at
         LIMIT 10`
      )
      .all(now(), teacher?.teacher_id || -1, uid);
    const completed = db
      .prepare("SELECT COUNT(*) n FROM loyalty_events WHERE user_id=? AND kind='class.completed'")
      .get(uid).n;
    const notifications = listNotifications(uid, 30);
    const unreadNotifications = notifications.filter((n) => !n.read_at).length;
    const profileCompletion = buildProfileCompletion(uid);

    res.json({
      user: { id: uid, name: req.user.name, role: req.user.role, subtitle: profileCompletion.fields.subtitle },
      wallet: finance.walletBalance(uid) / 10,
      club: {
        coins: a.coins,
        points: a.points,
        level: [...cfg.levels].reverse().find((l) => a.points >= l.minPoints)?.name || '',
      },
      teacherApproved: !!teacher,
      stats: { verifiedSessions: completed, upcomingShown: upcoming.length, unreadNotifications },
      profileCompletion,
      upcoming,
      notifications,
      files: [],
      filesPreviewIncluded: false,
      filesStatus: 'private_materials_route',
      filesUrl:
        req.user.role === 'parent'
          ? '/parent/files'
          : req.user.role === 'teacher'
            ? '/teacher/files'
            : '/panel/files',
    });
  };

  app.get('/api/panel/overview', auth, overview);

  app.get('/api/profile', auth, (req, res) => {
    res.json({ profile: buildProfileCompletion(req.user.id) });
  });

  app.put('/api/profile', auth, (req, res, next) => {
    try {
      const uid = req.user.id;
      const b = req.body || {};
      const name = String(b.name ?? req.user.name ?? '').trim();
      const subtitle = String(b.subtitle ?? '').trim();
      const alias = String(b.alias ?? '').trim();
      const province = String(b.province ?? '').trim();
      const city = String(b.city ?? '').trim();
      const goal = String(b.goal ?? '').trim();
      const country = String(b.country || 'IR').trim().toUpperCase();
      const leagueOptIn = Boolean(b.leagueOptIn);

      if (name.length < 2 || name.length > 80) fail('نام و نام خانوادگی باید بین ۲ تا ۸۰ نویسه باشد.');
      if (subtitle.length > 120) fail('عنوان پایه و رشته حداکثر ۱۲۰ نویسه است.');
      if (alias && (alias.length < 2 || alias.length > 60)) fail('نام نمایشی باید بین ۲ تا ۶۰ نویسه باشد.');
      if (province && (province.length < 2 || province.length > 80)) fail('نام استان معتبر نیست.');
      if (city && (city.length < 2 || city.length > 80)) fail('نام شهر معتبر نیست.');
      if (goal && (goal.length < 10 || goal.length > 500)) fail('هدف یادگیری باید حداقل ۱۰ نویسه باشد.');
      if (!/^[A-Z]{2}$/.test(country)) fail('کد کشور معتبر نیست.');

      let rewarded = false;
      db.transaction(() => {
        const acc = club.account(uid);
        let prev = {};
        try {
          prev = JSON.parse(acc.profile || '{}') || {};
        } catch {
          prev = {};
        }
        const nextProfile = {
          ...prev,
          alias: alias || prev.alias || name,
          province: province || prev.province || '',
          city: city || prev.city || '',
          goal: goal || prev.goal || '',
          country,
        };
        db.prepare('UPDATE users SET name=?, subtitle=?, letter=? WHERE id=?').run(
          name,
          subtitle,
          name[0] || 'ن',
          uid
        );
        db.prepare('UPDATE loyalty_accounts SET profile=?, league_opt_in=? WHERE user_id=?').run(
          JSON.stringify(nextProfile),
          leagueOptIn ? 1 : 0,
          uid
        );
        if (
          req.user.role === 'student' &&
          nextProfile.alias?.length >= 2 &&
          nextProfile.province?.length >= 2 &&
          nextProfile.city?.length >= 2 &&
          nextProfile.goal?.length >= 10
        ) {
          rewarded = club.ingest(uid, 'profile.completed', 'profile:v1');
        }
      })();

      res.json({ ok: true, rewarded, profile: buildProfileCompletion(uid) });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/notifications', auth, (req, res) => {
    const items = listNotifications(req.user.id, 100);
    res.json({
      notifications: items,
      unreadCount: items.filter((n) => !n.read_at).length,
    });
  });

  app.post('/api/notifications/read-all', auth, (req, res) => {
    db.prepare('UPDATE loyalty_notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').run(
      now(),
      req.user.id
    );
    res.json({ ok: true });
  });

  app.post('/api/notifications/:id/read', auth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id)) return res.status(400).json({ error: 'شناسه اعلان معتبر نیست.' });
    db.prepare('UPDATE loyalty_notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND user_id=?').run(
      now(),
      id,
      req.user.id
    );
    res.json({ ok: true });
  });

  app.post('/api/notifications/:id/dismiss', auth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id)) return res.status(400).json({ error: 'شناسه اعلان معتبر نیست.' });
    const row = db
      .prepare('SELECT id, source, title FROM loyalty_notifications WHERE id=? AND user_id=?')
      .get(id, req.user.id);
    if (!row) return res.status(404).json({ error: 'اعلان پیدا نشد.' });
    db.prepare('INSERT OR IGNORE INTO user_notification_dismissals(user_id, notification_id, created_at) VALUES (?,?,?)').run(
      req.user.id,
      id,
      now()
    );
    res.json({ ok: true, note: 'اعلان از فهرست شما بسته شد؛ سوابق مالی و آموزشی تغییر نمی‌کند.' });
  });

  return { overview, buildProfileCompletion, listNotifications };
}

module.exports = { panelModule };
