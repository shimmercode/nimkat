# راهنمای پشتیبان‌گیری و بازیابی دیتابیس (`BACKUP_RESTORE.md`)

## ۱. پشتیبان‌گیری گرم (Hot Backup) در حالت SQLite WAL
از آنجا که دیتابیس در حالت `WAL` اجرا می‌شود، کپی مستقیم فایل `.db` بدون فایل‌های `-wal` و `-shm` مجاز نیست. برای تهیهٔ نسخهٔ پشتیبان اتمیک از دستور زیر استفاده کنید:

```bash
node -e '
  const Database = require("./backend/node_modules/better-sqlite3");
  const db = new Database(process.env.NIMKAT_DB_PATH || "./backend/data/nimkat.db");
  db.backup("./backup-nimkat.db").then(() => {
    console.log("Backup complete: backup-nimkat.db");
    db.close();
  });
'
```

## ۲. بازیابی (Restore) و بررسی سلامت
```bash
node -e '
  const Database = require("./backend/node_modules/better-sqlite3");
  const db = new Database("./backup-nimkat.db", { readonly: true });
  console.log(db.pragma("integrity_check"));
  db.close();
'
```
