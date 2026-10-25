'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '../routing/navigation';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';

const calcMinutes = (p) =>
  p.readingMinutes ||
  Math.max(1, Math.ceil((p.sections || []).map((s) => s.text).join(' ').split(/\s+/).length / 180));

const formatDateFa = (n) =>
  n ? new Date(n).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' }) : '';

export default function BlogTeasers({ data = {} }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPosts = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    api('/blog')
      .then((r) => {
        if (alive) {
          setPosts((r?.posts || []).slice(0, 3));
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = loadPosts();
    return cleanup;
  }, [loadPosts]);

  const moreTo = data.moreHref && data.moreHref !== '#magazine' ? data.moreHref : '/blog';

  return (
    <section className="section journal" id="magazine">
      <div className="container">
        <div className="journal-section-head">
          <div>
            <span className="journal-kicker">{data.eyebrow || 'مجله نیمکت'}</span>
            <h2>{data.title || 'برای یادگیری، یک قدم جلوتر'}</h2>
            <p className="t-small t-muted">
              {data.sub || 'یادداشت‌هایی برای شاگردها، خانواده‌ها و مسیر یادگیری.'}
            </p>
          </div>
          <Link className="link-more" to={moreTo}>
            {data.moreLabel || 'همه یادداشت‌ها'} ←
          </Link>
        </div>

        {loading && (
          <p className="t-small t-muted" role="status" style={{ padding: '18px 0' }}>
            در حال دریافت یادداشت‌های مجله نیمکت…
          </p>
        )}

        {!loading && error && (
          <div className="card-soft" role="alert" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span>دریافت یادداشت‌های مجله با خطا روبه‌رو شد.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={loadPosts}>
                تلاش مجدد
              </button>
              <Link className="btn btn-primary btn-sm" to="/blog">
                مشاهده مجله
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="card-soft" style={{ padding: 20 }}>
            <p className="t-small t-muted">هنوز یادداشتی در این بخش منتشر نشده است.</p>
          </div>
        )}

        {posts.length > 0 && (
          <div className="journal-grid">
            {posts.map((p) => (
              <article className="journal-card" key={p.id || p.slug}>
                <Link to={`/blog/${p.slug}`}>
                  <Image
                    src={`/images/blog/${p.cover || 'learning'}.png`}
                    alt={p.coverAlt || p.title}
                    width={1200}
                    height={630}
                  />
                  <div className="journal-card-copy">
                    <span className="journal-kicker">{p.category}</span>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                    <div className="journal-meta">
                      {p.publishedAt ? <span>{formatDateFa(p.publishedAt)}</span> : null}
                      <span>{faNum(calcMinutes(p))} دقیقه مطالعه</span>
                    </div>
                    <span className="journal-read">خواندن یادداشت ←</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
