import PageRenderer from '../../../../render/PageRenderer.jsx';
import { publicPage } from '../../../../server/pages';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import JsonLd from '../../../../components/JsonLd';
import ArticleTools from '../../../../components/ArticleTools.jsx';
import { blogData, dateFa, minutes, type BlogPost } from '../../../../server/blog';
import { seo, siteUrl } from '../../../../server/seo';

export const dynamic = 'force-dynamic';

const read = cache(async (slug: string) => await blogData(`/${encodeURIComponent(slug)}`));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await read(slug);
  if (!data) return { title: 'مقاله پیدا نشد', robots: { index: false, follow: false } };
  const p: BlogPost = data.post;
  const base = seo(
    p.seoTitle || p.title,
    p.seoDescription || p.excerpt,
    `/blog/${p.slug}`,
    `/images/blog/${p.cover}.png`
  );
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: new Date(p.publishedAt).toISOString(),
      modifiedTime: new Date(p.updatedAt).toISOString(),
      authors: [p.author],
      tags: p.tags,
    },
  };
}

export default async function Article({ params }: Props) {
  const { slug } = await params;
  const data = await read(slug);
  if (!data) notFound();
  const p: BlogPost = data.post;

  const archiveData = await blogData('');
  const allPosts: BlogPost[] = Array.isArray(archiveData?.posts) ? archiveData.posts : [];
  const sameCategory = allPosts.filter((x) => x.slug !== slug && x.category === p.category);
  const otherCategory = allPosts.filter((x) => x.slug !== slug && x.category !== p.category);
  const related: BlogPost[] = [...sameCategory, ...otherCategory].slice(0, 3);
  const recentPosts: BlogPost[] = allPosts.filter((x) => x.slug !== slug).slice(0, 4);

  const currentIdx = allPosts.findIndex((x) => x.slug === slug);
  const prevPost: BlogPost | null = currentIdx > 0 ? allPosts[currentIdx - 1] : otherCategory[0] || null;
  const nextPost: BlogPost | null =
    currentIdx >= 0 && currentIdx < allPosts.length - 1
      ? allPosts[currentIdx + 1]
      : otherCategory[1] || sameCategory[0] || null;

  const categoryCounts = new Map<string, number>();
  for (const item of allPosts) {
    if (item.category) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
    }
  }
  if (p.category && !categoryCounts.has(p.category)) {
    categoryCounts.set(p.category, 1);
  }
  const categoriesList = Array.from(categoryCounts.entries());

  const site = siteUrl();
  const readMins = minutes(p);
  const wordCount = p.sections
    .map((s) => s.text)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const pubDateObj = new Date(p.publishedAt);
  const dayNumFa = pubDateObj.toLocaleDateString('fa-IR', {
    day: 'numeric',
    timeZone: 'Asia/Tehran',
  });
  const monthNameFa = pubDateObj.toLocaleDateString('fa-IR', {
    month: 'long',
    timeZone: 'Asia/Tehran',
  });

  const body = (
    <article className="journal journal-single wm-blog-single">
      {/* WoodMart Magazine Hero Banner */}
      <header className="wm-post-hero">
        <div className="container wm-post-hero__inner">
          <div className="wm-post-top-bar">
            <nav className="journal-breadcrumb wm-breadcrumb" aria-label="مسیر صفحه">
              <Link href="/">خانه</Link>
              <span>/</span>
              <Link href="/blog">مجله</Link>
              <span>/</span>
              <Link href={`/blog?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
            </nav>
            <ArticleTools variant="top" />
          </div>

          <div className="wm-post-hero__head">
            <div className="wm-post-badges">
              <Link
                href={`/blog?category=${encodeURIComponent(p.category)}`}
                className="journal-kicker wm-post-cat-pill"
              >
                {p.category}
              </Link>
              <span className="wm-post-edition-pill">مجلهٔ تخصصی نیمکت</span>
            </div>

            <h1>{p.title}</h1>
            <p className="journal-standfirst">{p.excerpt}</p>

            <div className="journal-byline wm-post-byline">
              <div className="wm-post-author">
                <span className="journal-author-mark">
                  {(p.author || 'ن').trim().slice(0, 1)}
                </span>
                <div>
                  <strong>{p.author}</strong>
                  <span className="wm-post-author__role">تیم علمی و تحریریهٔ آموزشی نیمکت</span>
                </div>
              </div>

              <div className="journal-meta wm-post-meta-pills">
                <span className="wm-meta-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <time dateTime={pubDateObj.toISOString()}>{dateFa(p.publishedAt)}</time>
                </span>
                <span className="wm-meta-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <b>{readMins.toLocaleString('fa-IR')} دقیقه مطالعه</b>
                </span>
                <span className="wm-meta-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span>{p.sections.length.toLocaleString('fa-IR')} سرفصل کلیدی</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* WoodMart Framed Cover Image with Date Badge */}
      <div className="container wm-post-cover-container">
        <figure className="wm-post-cover-frame">
          <div className="wm-post-date-badge" aria-hidden="true">
            <strong className="num">{dayNumFa}</strong>
            <span>{monthNameFa}</span>
          </div>
          <Image
            className="journal-article-cover"
            src={`/images/blog/${p.cover}.png`}
            alt={p.coverAlt || p.title}
            width={1200}
            height={630}
            priority
            sizes="(max-width:1200px) 100vw,1200px"
          />
          {p.coverAlt && (
            <figcaption className="wm-post-cover-caption">
              <span>تصویر شاخص:</span> {p.coverAlt}
            </figcaption>
          )}
        </figure>
      </div>

      {/* WoodMart Article-First Editorial Layout
          Order: article meta → cover → Table of Contents → full article text
                 → related posts → remaining side widgets.
          The article text is the primary column; no sidebar narrows it. */}
      <div className="container journal-reading-layout wm-reading-grid wm-reading-grid--article-first">
        {/* Table of Contents — placed above the article body */}
        <aside className="journal-toc wm-sidebar wm-sidebar--toc">
          {/* Widget 1: Table of Contents */}
          <div className="wm-widget wm-widget--toc">
            <div className="wm-widget__head">
              <span className="wm-widget__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </span>
              <div>
                <span className="journal-kicker">راهنمای مطالعه</span>
                <h3 className="wm-widget__title">در این یادداشت می‌خوانید</h3>
              </div>
            </div>

            <nav aria-label="فهرست مقاله" className="wm-toc-nav">
              {p.sections.map((s, i) => (
                <a key={i} href={`#section-${i + 1}`} className="wm-toc-link">
                  <span className="wm-toc-num">
                    {(i + 1).toLocaleString('fa-IR').padStart(2, '۰')}
                  </span>
                  <span className="wm-toc-text">{s.heading}</span>
                </a>
              ))}
              {!!p.faq.length && (
                <a href="#article-faq" className="wm-toc-link">
                  <span className="wm-toc-num">؟</span>
                  <span className="wm-toc-text">پرسش‌های متداول</span>
                </a>
              )}
            </nav>

            <div className="wm-widget__foot">
              <span className="num">حدود {wordCount.toLocaleString('fa-IR')} واژه</span>
              <a href="/rss.xml" className="wm-rss-link">
                خوراک RSS ↗
              </a>
            </div>
          </div>

        </aside>

        {/* Main Editorial Article Column */}
        <div className="journal-prose wm-article-column" id="article-body">
          <div className="wm-article-paper">
            {/* Editorial Key Takeaways Box */}
            {p.sections.length > 0 && (
              <div className="wm-takeaways-box">
                <div className="wm-takeaways-box__head">
                  <span className="wm-takeaways-box__badge">چکیدهٔ کاربردی مقاله</span>
                  <span className="num">{p.sections.length.toLocaleString('fa-IR')} گام کلیدی</span>
                </div>
                <p className="wm-takeaways-box__lead">{p.excerpt}</p>
                <div className="wm-takeaways-box__chips">
                  {p.sections.map((s, idx) => (
                    <a key={idx} href={`#section-${idx + 1}`} className="wm-takeaway-chip">
                      <b>{(idx + 1).toLocaleString('fa-IR')}</b>
                      <span>{s.heading}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Article Sections */}
            {p.sections.map((s, i) => (
              <section
                key={i}
                id={`section-${i + 1}`}
                className={`journal-prose-section journal-prose--${s.type} wm-prose-section`}
              >
                <div className="wm-section-heading">
                  <span className="wm-section-heading__num num">
                    {(i + 1).toLocaleString('fa-IR').padStart(2, '۰')}
                  </span>
                  <div>
                    {s.type === 'tip' && (
                      <span className="wm-section-type-badge wm-section-type-badge--tip">
                        نکتهٔ کلیدی یادگیری
                      </span>
                    )}
                    {s.type === 'quote' && (
                      <span className="wm-section-type-badge wm-section-type-badge--quote">
                        دیدگاه آموزشی
                      </span>
                    )}
                    <h2>{s.heading}</h2>
                  </div>
                </div>

                <div className="wm-section-body">
                  {s.text
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((text, j) => (
                      <p key={j}>{text}</p>
                    ))}
                </div>
              </section>
            ))}

            {/* FAQ Section */}
            {!!p.faq.length && (
              <section id="article-faq" className="journal-faq wm-faq-box">
                <div className="wm-section-heading">
                  <span className="wm-section-heading__num">؟</span>
                  <div>
                    <span className="wm-section-type-badge wm-section-type-badge--tip">
                      پاسخ به ابهامات رایج
                    </span>
                    <h2>پرسش‌های متداول</h2>
                  </div>
                </div>
                <div className="wm-faq-list">
                  {p.faq.map((f, i) => (
                    <details key={i} className="wm-faq-item">
                      <summary>{f.question}</summary>
                      <p>{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Article Footer (Tags + Share + Disclaimer) */}
            <footer className="journal-article-footer wm-article-footer">
              <div className="wm-article-footer__top">
                <div className="journal-tags wm-tags">
                  <span className="wm-tags__label">برچسب‌ها:</span>
                  {p.tags.map((t) => (
                    <Link key={t} href={`/blog?q=${encodeURIComponent(t)}`}>
                      #{t}
                    </Link>
                  ))}
                </div>
                <ArticleTools variant="bottom" />
              </div>

              <p className="wm-article-disclaimer">
                آخرین به‌روزرسانی: {dateFa(p.updatedAt)} · این یادداشت یک راهنمای عمومی آموزشی است؛ روش مناسب را با توجه به شرایط خود انتخاب کنید.
              </p>
            </footer>
          </div>

          {/* WoodMart Author Bio Card */}
          <div className="wm-author-card">
            <div className="wm-author-card__avatar">
              {(p.author || 'ن').trim().slice(0, 1)}
            </div>
            <div className="wm-author-card__body">
              <div className="wm-author-card__head">
                <div>
                  <span className="journal-kicker">دربارهٔ نویسنده</span>
                  <h3>{p.author}</h3>
                </div>
                <Link href="/blog" className="btn btn-outline btn-sm">
                  همهٔ مقالات نویسنده ←
                </Link>
              </div>
              <p>
                تحریریهٔ علمی نیمکت با همکاری اساتید برتر و مشاوران آموزشی، راهنماهای کاربردی برای بهبود روش مطالعه، تعامل مؤثر با معلم و همراهی آگاهانهٔ خانواده‌ها تولید می‌کند.
              </p>
            </div>
          </div>

          {/* WoodMart Prev / Next Article Navigation */}
          {(prevPost || nextPost) && (
            <nav className="wm-post-nav" aria-label="ناوبری بین مقالات">
              {prevPost ? (
                <Link href={`/blog/${prevPost.slug}`} className="wm-post-nav__card">
                  <Image
                    src={`/images/blog/${prevPost.cover}.png`}
                    alt={prevPost.coverAlt || prevPost.title}
                    width={160}
                    height={110}
                    className="wm-post-nav__thumb"
                  />
                  <div className="wm-post-nav__copy">
                    <span className="wm-post-nav__dir">→ مطلب قبلی مجله</span>
                    <strong>{prevPost.title}</strong>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextPost ? (
                <Link href={`/blog/${nextPost.slug}`} className="wm-post-nav__card wm-post-nav__card--next">
                  <div className="wm-post-nav__copy">
                    <span className="wm-post-nav__dir">مطلب بعدی مجله ←</span>
                    <strong>{nextPost.title}</strong>
                  </div>
                  <Image
                    src={`/images/blog/${nextPost.cover}.png`}
                    alt={nextPost.coverAlt || nextPost.title}
                    width={160}
                    height={110}
                    className="wm-post-nav__thumb"
                  />
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Related Articles & Bottom CTA */}
      <div className="container wm-bottom-container">
        {related.length > 0 && (
          <section className="journal-related wm-related-section">
            <div className="journal-section-head">
              <div>
                <span className="journal-kicker">پیشنهاد تحریریهٔ نیمکت</span>
                <h2>این مسیر را ادامه دهید</h2>
              </div>
              <Link href="/blog" className="btn btn-outline btn-sm">
                همه یادداشت‌ها ←
              </Link>
            </div>
            <div className="journal-grid journal-grid--related">
              {related.map((x) => (
                <article className="journal-card journal-card--row" key={x.id}>
                  <Link href={`/blog/${x.slug}`} className="journal-card-link">
                    <div className="journal-card-cover-wrap">
                      <Image
                        src={`/images/blog/${x.cover}.png`}
                        alt={x.coverAlt || x.title}
                        width={1200}
                        height={630}
                      />
                      <span className="journal-card-badge">{x.category}</span>
                      <span className="journal-card-readtime">
                        {minutes(x).toLocaleString('fa-IR')} دقیقه مطالعه
                      </span>
                    </div>
                    <div className="journal-card-copy">
                      <h3>{x.title}</h3>
                      <p>{x.excerpt}</p>
                      <div className="journal-meta">
                        <span className="journal-card-author">
                          <i className="journal-card-author-dot" aria-hidden="true">
                            {(x.author || 'ن').slice(0, 1)}
                          </i>
                          {x.author}
                        </span>
                        <time dateTime={new Date(x.publishedAt).toISOString()}>
                          {dateFa(x.publishedAt)}
                        </time>
                      </div>
                      <span className="journal-card-cta">مطالعه مقاله ←</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <aside className="journal-bottom wm-bottom-cta">
          <div>
            <span className="journal-kicker">یادگیری، فقط خواندن نیست</span>
            <h2>با یک استاد مناسب، شروع کنید.</h2>
            <p>
              کلاس‌های خصوصی، گروهی و دونفره با اساتید تأییدشدهٔ نیمکت و گزارش پیشرفت هشت‌شاخصی پس از هر جلسه
            </p>
          </div>
          <Link href="/classes" className="btn btn-primary btn-lg">
            مشاهده کلاس‌ها ←
          </Link>
        </aside>
      </div>

      {/* Remaining side widgets — rendered AFTER the article text and related posts */}
      <div className="container wm-after-article-widgets">
        <aside className="journal-toc wm-sidebar wm-sidebar--after">
          {/* Widget 2: Categories */}
          {categoriesList.length > 0 && (
            <div className="wm-widget">
              <div className="wm-widget__head">
                <span className="wm-widget__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <div>
                  <span className="journal-kicker">موضوعات</span>
                  <h3 className="wm-widget__title">دسته‌بندی‌های مجله</h3>
                </div>
              </div>
              <div className="wm-cat-list">
                {categoriesList.map(([cat, count]) => {
                  const isActive = cat === p.category;
                  return (
                    <Link
                      key={cat}
                      href={`/blog?category=${encodeURIComponent(cat)}`}
                      className={`wm-cat-item ${isActive ? 'is-active' : ''}`}
                    >
                      <span>{cat}</span>
                      <b className="num">{count.toLocaleString('fa-IR')}</b>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Widget 3: Recent Posts (WoodMart Mini List) */}
          {recentPosts.length > 0 && (
            <div className="wm-widget">
              <div className="wm-widget__head">
                <span className="wm-widget__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <div>
                  <span className="journal-kicker">پیشنهاد مطالعه</span>
                  <h3 className="wm-widget__title">تازه‌ترین مطالب مجله</h3>
                </div>
              </div>
              <div className="wm-recent-list">
                {recentPosts.map((rp) => (
                  <Link key={rp.id} href={`/blog/${rp.slug}`} className="wm-recent-item">
                    <Image
                      src={`/images/blog/${rp.cover}.png`}
                      alt={rp.coverAlt || rp.title}
                      width={160}
                      height={110}
                      className="wm-recent-item__thumb"
                    />
                    <div className="wm-recent-item__body">
                      <span className="wm-recent-item__cat">{rp.category}</span>
                      <h4>{rp.title}</h4>
                      <time dateTime={new Date(rp.publishedAt).toISOString()}>
                        {dateFa(rp.publishedAt)}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Widget 4: WoodMart Sidebar CTA Card */}
          <div className="wm-widget wm-widget--cta">
            <span className="wm-widget-cta__badge">پشتیبانی آموزشی نیمکت</span>
            <h3>نیاز به راهنمایی مستقیم استاد دارید؟</h3>
            <p>
              با اساتید تأییدشدهٔ نیمکت جلسهٔ آزمایشی یا دورهٔ اختصاصی رزرو کنید و ابهام‌های درسی را ریشه‌ای برطرف کنید.
            </p>
            <Link href="/classes" className="btn btn-primary btn-sm btn-block">
              مشاهده و رزرو کلاس‌ها ←
            </Link>
          </div>
        </aside>
      </div>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.excerpt,
          datePublished: new Date(p.publishedAt).toISOString(),
          dateModified: new Date(p.updatedAt).toISOString(),
          author: { '@type': 'Organization', name: p.author },
          publisher: { '@type': 'Organization', name: 'نیمکت' },
          inLanguage: 'fa-IR',
          articleSection: p.category,
          wordCount,
          ...(site
            ? {
                mainEntityOfPage: `${site}/blog/${p.slug}`,
                image: `${site}/images/blog/${p.cover}.png`,
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { name: 'خانه', path: '/' },
            { name: 'مجله', path: '/blog' },
            { name: p.title, path: `/blog/${p.slug}` },
          ].map((x, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: x.name,
            ...(site ? { item: `${site}${x.path}` } : {}),
          })),
        }}
      />
    </article>
  );

  const layout = await publicPage('article-layout');
  return layout ? <PageRenderer schema={layout.schema} slots={{ 'blog-feed': body }} /> : body;
}
