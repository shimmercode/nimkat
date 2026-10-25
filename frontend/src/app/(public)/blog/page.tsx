import PageRenderer from '../../../render/PageRenderer.jsx';
import { publicPage } from '../../../server/pages';
import Link from 'next/link';
import Image from 'next/image';
import { blogData, dateFa, minutes, type BlogPost } from '../../../server/blog';
import { seo, siteUrl } from '../../../server/seo';
import JsonLd from '../../../components/JsonLd';

export const dynamic = 'force-dynamic';
type Props = { searchParams: Promise<{ q?: string; category?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const p = await searchParams;
  return {
    ...seo(
      'مجله نیمکت؛ یادگیری، برنامه‌ریزی و همراهی خانواده',
      'راهنماهای کاربردی برای بهتر یاد گرفتن، برنامه‌ریزی درسی و انتخاب کلاس مناسب؛ از تحریریه نیمکت.',
      '/blog'
    ),
    ...(p.q || p.category || p.page ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Blog({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['q', 'category', 'page'] as const) if (params[key]) query.set(key, params[key]!);
  let data: { posts: BlogPost[]; categories: string[]; total: number; page: number; pages: number } = {
    posts: [],
    categories: [],
    total: 0,
    page: 1,
    pages: 1,
  };
  let fetchError = false;
  try {
    const res = await blogData(`?${query}`);
    if (res) data = res;
    else fetchError = true;
  } catch {
    fetchError = true;
  }
  const posts: BlogPost[] = data.posts || [];
  const featured = posts[0];
  const filtered = !!(params.q || params.category || params.page);
  const pageLink = (page: number) => `/blog?${new URLSearchParams({ ...params, page: String(page) } as Record<string, string>)}`;

  const body = (
    <div className="journal">
      <section className="journal-hero">
        <div className="container">
          <nav className="journal-breadcrumb" aria-label="مسیر صفحه">
            <Link href="/">نیمکت</Link>
            <span>/</span>
            <span>مجله</span>
          </nav>
          <span className="journal-kicker">یاد گرفتن، ادامه دارد.</span>
          <h1>
            برای یک قدم <em>جلوتر بودن.</em>
          </h1>
          <p>
            از سؤال‌های کوچک تا تصمیم‌های مهم؛ راهنماهایی برای شاگردها، خانواده‌ها و هر کسی که هنوز دوست دارد یاد بگیرد.
          </p>
          <div className="journal-hero-foot">
            <span>مجلهٔ نیمکت / یادداشت‌های کاربردی</span>
            <a href="/rss.xml" className="journal-rss">
              RSS مجله ↗
            </a>
          </div>
        </div>
      </section>
      <div className="container journal-main">
        {featured && !filtered && (
          <Link href={`/blog/${featured.slug}`} className="journal-feature">
            <div className="journal-feature-cover">
              <Image
                src={`/images/blog/${featured.cover}.png`}
                alt={featured.coverAlt || featured.title}
                width={1200}
                height={630}
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
              />
              <span className="journal-cover-label">انتخاب تحریریه</span>
            </div>
            <div className="journal-feature-copy">
              <span className="journal-kicker">{featured.category}</span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="journal-meta">
                <span>{featured.author}</span>
                <span>{dateFa(featured.publishedAt)}</span>
                <span>{minutes(featured).toLocaleString('fa-IR')} دقیقه مطالعه</span>
              </div>
              <span className="journal-read">
                خواندن یادداشت <b>←</b>
              </span>
            </div>
          </Link>
        )}
        <section aria-labelledby="journal-archive-title" id="archive">
          <div className="journal-section-head">
            <div>
              <span className="journal-kicker">کتابخانهٔ ایده‌ها</span>
              <h2 id="journal-archive-title">{filtered ? 'یادداشت‌های انتخابی شما' : 'تازه‌های مجله'}</h2>
            </div>
            <form action="/blog" className="journal-search" role="search">
              <label className="support-sr-only" htmlFor="blog-q">
                جستجوی مقاله
              </label>
              <input
                name="q"
                id="blog-q"
                placeholder="دنبال چه موضوعی هستید؟"
                defaultValue={params.q}
                maxLength={100}
              />
              <button type="submit" aria-label="جستجوی مقاله">
                جستجو ←
              </button>
            </form>
          </div>
          <nav className="journal-categories" aria-label="دسته‌بندی مجله">
            <Link href="/blog#archive" aria-current={!params.category ? 'page' : undefined}>
              همه یادداشت‌ها
            </Link>
            {(data.categories || []).map((c: string) => (
              <Link
                key={c}
                href={`/blog?category=${encodeURIComponent(c)}#archive`}
                aria-current={params.category === c ? 'page' : undefined}
              >
                {c}
              </Link>
            ))}
          </nav>
          <p className="journal-result-count">
            {Number(data.total || 0).toLocaleString('fa-IR')} یادداشت{params.q && ` برای «${params.q}»`}
          </p>
          <div className="journal-grid">
            {posts.map((p) => (
              <article className="journal-card" key={p.id}>
                <Link href={`/blog/${p.slug}`} className="journal-card-cover" tabIndex={-1} aria-hidden="true">
                  <Image
                    src={`/images/blog/${p.cover}.png`}
                    alt=""
                    width={1200}
                    height={630}
                    sizes="(max-width:600px) 100vw,(max-width:1000px) 50vw,33vw"
                  />
                </Link>
                <div className="journal-card-copy">
                  <span className="journal-kicker">{p.category}</span>
                  <h3>
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <p>{p.excerpt}</p>
                  <div className="journal-meta">
                    <time dateTime={new Date(p.publishedAt).toISOString()}>{dateFa(p.publishedAt)}</time>
                    <span>{minutes(p).toLocaleString('fa-IR')} دقیقه</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!posts.length && (
            <div className="journal-empty">
              <h3>{fetchError ? 'ارتباط با سرویس مجله برقرار نشد.' : 'برای این جستجو یادداشتی پیدا نشد.'}</h3>
              <p>
                {fetchError
                  ? 'لطفاً اتصال سرور را بررسی کرده و صفحه را دوباره بارگذاری کنید.'
                  : 'عبارت کوتاه‌تر یا دسته‌بندی دیگری را امتحان کنید.'}
              </p>
              <Link className="btn btn-outline" href="/blog">
                همه مقاله‌ها
              </Link>
            </div>
          )}
          {data.pages > 1 && (
            <nav className="journal-pagination" aria-label="صفحه‌بندی مجله">
              {data.page > 1 && <Link href={pageLink(data.page - 1)}>صفحه قبل</Link>}
              <span>
                صفحه {Number(data.page).toLocaleString('fa-IR')} از {Number(data.pages).toLocaleString('fa-IR')}
              </span>
              {data.page < data.pages && <Link href={pageLink(data.page + 1)}>صفحه بعد</Link>}
            </nav>
          )}
        </section>
        <aside className="journal-bottom">
          <div>
            <span className="journal-kicker">از خواندن تا تجربه کردن</span>
            <h2>قدم بعدی، یک یادگیری واقعی است.</h2>
            <p>کلاس‌ها و استادها را ببینید و با آگاهی انتخاب کنید.</p>
          </div>
          <Link href="/classes" className="btn btn-primary">
            پیدا کردن کلاس مناسب ←
          </Link>
        </aside>
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'مجله نیمکت',
          description: 'یادداشت‌های آموزشی نیمکت',
          inLanguage: 'fa-IR',
          ...(siteUrl() ? { url: `${siteUrl()}/blog` } : {}),
        }}
      />
    </div>
  );
  const layout = await publicPage('blog');
  return layout ? <PageRenderer schema={layout.schema} slots={{ 'blog-feed': body }} /> : body;
}
