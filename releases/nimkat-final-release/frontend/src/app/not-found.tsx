import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="card-soft" style={{ padding: '44px 32px', textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
          <span className="eyebrow orange">خطای ۴۰۴</span>
          <h1 className="t-h2" style={{ marginTop: 12 }}>صفحهٔ مورد نظر پیدا نشد</h1>
          <p className="t-small t-muted" style={{ marginTop: 10, lineHeight: 2 }}>
            نشانی واردشده در سامانهٔ نیمکت وجود ندارد یا جابه‌جا شده است. می‌توانید از لینک‌های زیر به بخش‌های اصلی بروید.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
            <Link href="/" className="btn btn-primary">
              بازگشت به صفحهٔ اصلی
            </Link>
            <Link href="/classes" className="btn btn-outline">
              جستجوی کلاس‌ها و اساتید
            </Link>
            <Link href="/blog" className="btn btn-outline">
              مجله نیمکت
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
