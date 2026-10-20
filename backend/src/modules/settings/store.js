const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const definitions = {
  sms: { label: 'پیامک ورود', defaults: { enabled: false, provider: 'kavenegar', template: '' }, secrets: ['apiKey'] },
  materials: {label:'فایل‌های آموزشی و اسکن امنیتی',defaults:{enabled:false,provider:'clamav',budgetMb:64,perOwnerMb:16},secrets:[]},
  shop:{label:'فروشگاه فیزیکی',defaults:{enabled:false,shippingToman:0},secrets:[]},
  friendly:{label:'پرداخت مستقل دوستانه',defaults:{enabled:false,discount2:20,discount3:20,discount4:20,discount5:20,holdMinutes:15},secrets:[]},
  payment: { label: 'درگاه پرداخت', defaults: { enabled: false, provider: 'zarinpal', sandbox: true }, secrets: ['merchantId'] },
  scheduling: {label:'برنامه‌ریزی و رفت‌وآمد',defaults:{travelBufferMinutes:30},secrets:[]},
  classroom: { label: 'کلاس آنلاین', defaults: { enabled: false, provider: 'skyroom', domain: '' }, secrets: ['apiKey','webhookSecret'] },
  support: { label: 'پشتیبانی و دستیار سرور', defaults: { enabled: true, engine: 'knowledge', slaMinutes:60, model: 'qwen2.5:7b', greeting: 'برای انتخاب کلاس یا پیگیری سؤال‌هایتان اینجاییم؛ شماره را وارد کنید و گفتگو را شروع کنید.' }, secrets: [] },
};
function masterKey(env = process.env) {
  if (env.NIMKAT_SETTINGS_KEY) {
    if (!/^[a-f0-9]{64}$/i.test(env.NIMKAT_SETTINGS_KEY)) throw new Error('NIMKAT_SETTINGS_KEY must be 64 hex characters.');
    return Buffer.from(env.NIMKAT_SETTINGS_KEY, 'hex');
  }
  if (env.NODE_ENV === 'production') throw new Error('NIMKAT_SETTINGS_KEY is required in production.');
  const dir = env.NIMKAT_DATA_DIR || path.join(__dirname, '../../../data');
  fs.mkdirSync(dir, { recursive: true });
  const filename = path.join(dir, 'settings.key');
  if (!fs.existsSync(filename)) {
    try { fs.writeFileSync(filename, crypto.randomBytes(32), { mode: 0o600, flag: 'wx' }); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
  const value = fs.readFileSync(filename);
  if (value.length !== 32) throw new Error('Invalid local settings encryption key.');
  return value;
}
function settingsStore(db, key = masterKey()) {
  db.exec(`CREATE TABLE IF NOT EXISTS service_settings (
    service TEXT PRIMARY KEY, config_json TEXT NOT NULL, secrets_enc TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, action TEXT NOT NULL, subject TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL
  );`);
  function seal(data, context) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(context));
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((x) => x.toString('base64')).join('.');
  }
  function open(value, context) {
    const [iv, tag, payload] = value.split('.').map((x) => Buffer.from(x, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8'));
  }
  function get(service) {
    const def = definitions[service]; if (!def) throw Object.assign(new Error('سرویس نامعتبر است.'), { status: 404 });
    const row = db.prepare('SELECT * FROM service_settings WHERE service=?').get(service);
    return { config: row ? {...def.defaults,...JSON.parse(row.config_json)} : { ...def.defaults }, secrets: row ? open(row.secrets_enc, service) : {}, version: row?.version || 0 };
  }
  function audit(actor, action, subject, metadata = {}) {
    db.prepare('INSERT INTO audit_events (actor_id,action,subject,metadata,created_at) VALUES (?,?,?,?,?)').run(actor || null, action, subject, JSON.stringify(metadata), Date.now());
  }
  function publicValue(service) {
    const value = get(service);
    return { service, label: definitions[service].label, config: value.config, version: value.version,
      secrets: Object.fromEntries(definitions[service].secrets.map((name) => [name, { configured: !!value.secrets[name] }])) };
  }
  function update(service, body, actor) {
    const def = definitions[service]; if (!def) throw Object.assign(new Error('سرویس نامعتبر است.'), { status: 404 });
    if (!body || !Number.isInteger(body.version)) throw Object.assign(new Error('نسخهٔ تنظیمات لازم است.'), { status: 400 });
    const fields = body.config || {}, secrets = body.secrets || {};
    if (Object.keys(fields).some((name) => !Object.hasOwn(def.defaults, name)) || Object.keys(secrets).some((name) => !def.secrets.includes(name))) throw Object.assign(new Error('فیلد تنظیمات نامعتبر است.'), { status: 400 });
    for (const [name, value] of Object.entries(fields)) {
      if (typeof value !== typeof def.defaults[name] || (typeof value === 'string' && value.length > 2000)) throw Object.assign(new Error('نوع یا طول فیلد نامعتبر است.'), { status: 400 });
    }
    for (const value of Object.values(secrets)) if (value !== null && (typeof value !== 'string' || value.length < 8 || value.length > 512)) throw Object.assign(new Error('کلید نامعتبر است؛ برای حذف، مقدار null ارسال کنید.'), { status: 400 });
    return db.transaction(() => {
      const old = get(service);
      if (old.version !== body.version) throw Object.assign(new Error('تنظیمات هم‌زمان تغییر کرده‌اند؛ صفحه را تازه کنید.'), { status: 409 });
      const config = { ...old.config, ...fields }, nextSecrets = { ...old.secrets };
      for (const [name, value] of Object.entries(secrets)) { if (value === null) delete nextSecrets[name]; else nextSecrets[name] = value; }
      if(service==='shop'&&(!Number.isSafeInteger(config.shippingToman)||config.shippingToman<0||config.shippingToman>10000000))throw Object.assign(new Error('هزینهٔ ارسال نامعتبر است.'),{status:400});
      if(service==='friendly'&&(!Number.isInteger(config.holdMinutes)||config.holdMinutes<5||config.holdMinutes>60||[2,3,4,5].some(n=>!Number.isInteger(config['discount'+n])||config['discount'+n]<0||config['discount'+n]>50||(n>2&&config['discount'+n]<config['discount'+(n-1)]))))throw Object.assign(new Error('تخفیف پلکانی باید بین صفر و ۵۰ و صعودی، مهلت بین ۵ و ۶۰ دقیقه باشد.'),{status:400});
      if(service==='materials'&&(!Number.isInteger(config.budgetMb)||config.budgetMb<1||config.budgetMb>1024||!Number.isInteger(config.perOwnerMb)||config.perOwnerMb<1||config.perOwnerMb>config.budgetMb))throw Object.assign(new Error('بودجهٔ فایل باید ۱ تا ۱۰۲۴ مگابایت و سهم هر مدرس حداکثر برابر بودجه باشد.'),{status:400});
      if(service==='scheduling'&&(!Number.isInteger(config.travelBufferMinutes)||config.travelBufferMinutes<0||config.travelBufferMinutes>180))throw Object.assign(new Error('فاصلهٔ رفت‌وآمد باید بین صفر و ۱۸۰ دقیقه باشد.'),{status:400});
      if (config.provider && config.provider !== def.defaults.provider) throw Object.assign(new Error('ارائه‌دهنده پشتیبانی نمی‌شود.'), { status: 400 });
      if(service==='support'&&(!Number.isInteger(config.slaMinutes)||config.slaMinutes<1||config.slaMinutes>1440))throw Object.assign(new Error('مهلت پاسخ باید بین یک و ۱۴۴۰ دقیقه باشد.'),{status:400});
      if (service === 'support' && !['knowledge', 'ollama'].includes(config.engine)) throw Object.assign(new Error('موتور دستیار نامعتبر است.'), { status: 400 });
      if (service === 'support' && !/^[a-zA-Z0-9_.:/-]{1,100}$/.test(config.model)) throw Object.assign(new Error('نام مدل نامعتبر است.'), { status: 400 });
      if (service === 'sms' && config.template && !/^[a-zA-Z0-9_-]{1,100}$/.test(config.template)) throw Object.assign(new Error('نام الگوی پیامک نامعتبر است.'), { status: 400 });
      if (config.enabled && def.secrets.filter(name=>name!=='webhookSecret').some((name) => !nextSecrets[name])) throw Object.assign(new Error('پیش از فعال‌سازی، کلیدهای لازم را ثبت کنید.'), { status: 422 });
      if (service === 'sms' && config.enabled && !config.template) throw Object.assign(new Error('الگوی OTP لازم است.'), { status: 422 });
      if(service==='classroom'&&nextSecrets.webhookSecret&&nextSecrets.webhookSecret.length<32)throw Object.assign(new Error('کلید وب‌هوک حداقل ۳۲ نویسه لازم دارد.'),{status:400});
      if (service === 'classroom' && config.enabled && !/^[a-zA-Z0-9-]{1,100}$/.test(config.domain)) throw Object.assign(new Error('نام حساب کلاس آنلاین لازم است.'), { status: 422 });
      db.prepare('INSERT INTO service_settings (service,config_json,secrets_enc,version,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(service) DO UPDATE SET config_json=excluded.config_json,secrets_enc=excluded.secrets_enc,version=excluded.version,updated_at=excluded.updated_at')
        .run(service, JSON.stringify(config), seal(nextSecrets, service), old.version + 1, Date.now());
      audit(actor, 'settings.update', service, { fields: Object.keys(fields), secretFields: Object.keys(secrets), version: old.version + 1 });
      return publicValue(service);
    })();
  }
  return { get, update, publicValue, seal, open, audit, definitions };
}
module.exports = { settingsStore, masterKey, definitions };
