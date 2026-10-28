'use client';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';
import { IconArrowLeft } from './icons.jsx';

function formatDateFa(ts) {
  if (!ts) return 'مجله نیمکت';
  if (typeof ts === 'string' && !/^\d+$/.test(ts)) return ts;
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(Number(ts)));
  } catch {
    return 'مجله نیمکت';
  }
}

export default function BlogTeasers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api('/blog?limit=3')
      .then((res) => {
        if (!active) return;
        const posts = Array.isArray(res?.posts) ? res.posts.slice(0, 3) : [];
        setItems(posts);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loading && !items.length) return null;

  return (
    <section className="section" id="blog-teasers" aria-label="تازه‌های مجله نیمکت">
      <div className="container">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow">مجله و راهنمای یادگیری</span>
            <h2 className="section-title">تازه‌های مجلهٔ نیمکت</h2>
          </div>
          <a className="link-more" href="/blog">
            مشاهده همه مقالات <IconArrowLeft size={16} />
          </a>
        </div>

        {loading ? (
          <div className="journal-grid" role="status" aria-busy="true" aria-label="در حال بارگذاری مطالب...">
            {[0, 1, 2].map((idx) => (
              <article className="journal-card mag-card-skeleton" key={idx} aria-hidden="true">
                <div className="mag-thumb nk-skeleton" style={{ aspectRatio: '1200 / 630', width: '100%' }} />
                <div className="journal-card-copy">
                  <span className="nk-skeleton nk-skeleton--pill" style={{ width: 96, height: 22 }} />
                  <div className="nk-skeleton nk-skeleton--line" style={{ width: '88%', height: 22 }} />
                  <div className="nk-skeleton nk-skeleton--line" style={{ width: '100%', height: 15 }} />
                  <div className="nk-skeleton nk-skeleton--line" style={{ width: '72%', height: 15 }} />
                  <div className="journal-meta" style={{ borderTop: '1px solid var(--n200)', paddingTop: 12 }}>
                    <span className="nk-skeleton nk-skeleton--line" style={{ width: 110, height: 14 }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="journal-grid" aria-label="یادداشت‌های مجله">
            {items.map((post) => {
              const coverSrc =
                post.coverImage || `/images/blog/${post.cover || 'learning'}.png`;
              const minutes = post.readingMinutes || post.readTime || 5;
              return (
                <article className="journal-card" key={post.id || post.slug}>
                  <a href={`/blog/${post.slug}`} className="journal-card-link">
                    <div className="journal-card-cover-wrap">
                      <img
                        src={coverSrc}
                        alt={post.coverAlt || post.title}
                        width={1200}
                        height={630}
                        loading="lazy"
                      />
                      <span className="journal-card-badge">{post.category || 'مجله نیمکت'}</span>
                    </div>
                    <div className="journal-card-copy">
                      <span className="journal-kicker">{post.category || 'مجله نیمکت'}</span>
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <div className="journal-meta">
                        <span>{post.author || 'تحریریه نیمکت'}</span>
                        <span>{formatDateFa(post.publishedAt)}</span>
                        <span className="num">{faNum(minutes)} دقیقه مطالعه</span>
                      </div>
                      <span className="journal-read">
                        ادامه یادداشت <b aria-hidden="true">←</b>
                      </span>
                    </div>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
