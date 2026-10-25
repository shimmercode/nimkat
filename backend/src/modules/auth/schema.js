module.exports = function migrateAuth(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      access_hash TEXT UNIQUE NOT NULL,
      access_expires INTEGER NOT NULL,
      refresh_hash TEXT UNIQUE NOT NULL,
      csrf_hash TEXT NOT NULL,
      refresh_expires INTEGER NOT NULL,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions(user_id);
    CREATE TABLE IF NOT EXISTS auth_refresh_used (
      token_hash TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );
  `);
  const cols = db.prepare('PRAGMA table_info(otp)').all();
  if (!cols.some((c) => c.name === 'requested_at')) {
    db.transaction(() => {
      db.exec('ALTER TABLE otp ADD COLUMN requested_at INTEGER NOT NULL DEFAULT 0');
      // Invalidate old plaintext challenges during migration.
      db.prepare('DELETE FROM otp').run();
    })();
  }
};
