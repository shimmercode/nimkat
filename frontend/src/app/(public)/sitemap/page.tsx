import Link from 'next/link';
import { seo } from '../../../server/seo';
import { blogData, type BlogPost } from '../../../server/blog';

export const dynamic = 'force-dynamic';
export const metadata = seo(
  'نقشهٔ سایت نیمکت',
  'فهرست کامل صفحات عمومی، مقالات مجله نیمکت، پنل‌های کاربری و راهنماهای سامانه آموزشی نیمکت.',
  '/sitemap'
);

export default async function HtmlSitemapPage() {
  let posts: BlogPost[] = [];
  try {
    const b = await blogData();
    posts = b?.posts || [];
  } catch {
    posts = [];
  }

  return (
    <section className="section">
      <div className="container">
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <Link href="/">خانه</Link>
          <span className="sep">›</span>
          <span className="here">نقشهٔ سایت</span>
        </div>

        <div className="card" style={{ padding: 32, borderRadius: 'var(--r-2xl)' }}>
          <span className="eyebrow">دسترسی سریع به تمام بخش‌ها</span>
          <h1 className="t-h2" style={{ marginTop: 10 }}>نقشهٔ سایت نیمکت</h1>
          <p className="t-small t-muted" style={{ marginTop: 8 }}>
            علاوه بر این صفحه، نسخهٔ ماشینی نقشهٔ سایت در <a href="/sitemap.xml" style={{ color: 'var(--primary)', fontWeight: 700 }}>/sitemap.xml</a> و خوراک مجله در <a href="/rss.xml" style={{ color: 'var(--primary)', fontWeight: 700 }}>/rss.xml</a> در دسترس است.
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginTop: 24 }}>
            <div>
              <h2 className="t-h4">صفحات اصلی</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 14 }}>
                <li><Link href="/">صفحهٔ اصلی نیمکت</Link></li>
                <li><Link href="/classes">جستجوی کلاس‌ها و اساتید</Link></li>
                <li><Link href="/club">نیمکت کلاب (باشگاه مشتریان)</Link></li>
                <li><Link href="/blog">مجله نیمکت</Link></li>
                <li><Link href="/login">ورود / ثبت‌نام شاگرد و والدین</Link></li>
                <li><Link href="/login?mode=teacher">همکاری به عنوان استاد</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="t-h4">پشتیبانی و قوانین</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 14 }}>
                <li><Link href="/faq">سؤالات متداول</Link></li>
                <li><Link href="/parent-guide">راهنمای والدین</Link></li>
                <li><Link href="/contact">تماس با ما و مشاوره</Link></li>
                <li><Link href="/cancellation-policy">شرایط لغو و بازگشت وجه</Link></li>
                <li><Link href="/terms">قوانین و مقررات</Link></li>
                <li><Link href="/privacy">حریم خصوصی</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="t-h4">پنل شاگرد</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 14 }}>
                <li><Link href="/panel">داشبورد شاگرد</Link></li>
                <li><Link href="/panel/calendar">تقویم و کلاس‌های من</Link></li>
                <li><Link href="/panel/chat">نیم‌چت</Link></li>
                <li><Link href="/panel/reports">گزارش تحصیلی</Link></li>
                <li><Link href="/panel/exams">آزمون‌ها و تمرین‌ها</Link></li>
                <li><Link href="/panel/files">فایل‌ها و منابع امن</Link></li>
                <li><Link href="/panel/finance">امور مالی و کیف پول</Link></li>
                <li><Link href="/panel/club">نیمکت کلاب من</Link></li>
                <li><Link href="/panel/notifications">اعلان‌ها</Link></li>
                <li><Link href="/panel/profile">پروفایل و تنظیمات</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="t-h4">یادداشت‌های مجله نیمکت</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 14 }}>
                {posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
