'use client';
import { useEffect, useState } from 'react';
import { Link } from '../routing/navigation';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';
import { IconArrowLeft, IconBook, IconClock } from './icons.jsx';

const CATEGORY_TONES = {
  'روش مطالعه': { bg: 'linear-gradient(135deg, #053D29 0%, #0A6847 65%, #21A878 100%)', chip: '#E3F4EC', text: '#0A6847' },
  'کنکور': { bg: 'linear-gradient(135deg, #9C4F14 0%, #F28A3D 100%)', chip: '#FDEEE2', text: '#9C4F14' },
  'ویژه والدین': { bg: 'linear-gradient(135deg, #0A6847 0%, #21A878 100%)', chip: '#E3F4EC', text: '#053D29' },
  'تکنولوژی آموزشی': { bg: 'linear-gradient(135deg, #17211E 0%, #0A6847 100%)', chip: '#F3F6F4', text: '#17211E' },
  'کلاس گروهی': { bg: 'linear-gradient(135deg, #053D29 0%, #21A878 100%)', chip: '#E3F4EC', text: '#0A6847' },
};

export function CoverArt({ post }) {
  const tone = CATEGORY_TONES[post.category] || CATEGORY_TONES['روش مطالعه'];
  if (post.coverUrl) {
    return (
      <div className="mag-thumb" style={{ background: tone.bg }}>
        <img src={post.coverUrl} alt={post.title} loading="lazy" />
        <span className="chip chip-tag" style={{ background: tone.chip, color: tone.text }}>{post.category}</span>
      </div>
    );
  }
  return (
    <div
      className="mag-thumb"
      style={{
        background: tone.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 18,
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="chip" style={{ background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.24)', fontSize: 12 }}>
          {post.category}
        </span>
        <span style={{ opacity: 0.85, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <IconClock size={14} /> {faNum(post.readingMinutes || 5)} دقیقه
        </span>
      </div>
      <div>
        <div style={{ fontSize: 12, opacity: 0.78, marginBottom: 4 }}>مجله آموزشی نیمکت</div>
        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.5 }}>{post.title}</div>
      </div>
    </div>
  );
}

export default function BlogTeasers({ limit = 3, title = 'از مجله‌ی نیمکت', subtitle = 'مقاله‌های کوتاه برای دانش‌آموزان، والدین و معلم‌ها.' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/blog')
      .then((res) => {
        if (!active) return;
        setPosts((res.posts || []).slice(0, limit));
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message || 'خطا در دریافت مقالات مجله');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [limit]);

  return (
    <section className="section" id="magazine">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <IconBook size={13} /> مجله آموزشی
            </span>
            <h2 style={{ marginTop: 10 }}>{title}</h2>
            <p className="muted" style={{ marginTop: 4 }}>{subtitle}</p>
          </div>
          <Link to="/blog" className="btn btn-outline btn-sm">
            همه‌ی مقاله‌ها <IconArrowLeft size={14} />
          </Link>
        </div>

        {loading && (
          <div className="grid-3" role="status" aria-busy="true" aria-label="در حال بارگذاری مطالب...">
            <span className="sr-only">در حال بارگذاری مطالب...</span>
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="mag-card mag-card-skeleton" aria-hidden="true">
                <div className="mag-thumb nk-skeleton-surface" />
                <div className="mag-body">
                  <div className="nk-skeleton-line" style={{ width: '42%', height: 14 }} />
                  <div className="nk-skeleton-line" style={{ width: '88%', height: 20, marginTop: 6 }} />
                  <div className="nk-skeleton-line" style={{ width: '100%', height: 14, marginTop: 8 }} />
                  <div className="nk-skeleton-line" style={{ width: '72%', height: 14, marginTop: 4 }} />
                  <div className="nk-skeleton-line" style={{ width: '36%', height: 16, marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="card" style={{ padding: 20, borderColor: 'var(--error)', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p className="muted">هنوز مقاله‌ای منتشر نشده است.</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="grid-3">
            {posts.map((m) => (
              <article className="mag-card" key={m.slug}>
                <Link to={`/blog/${m.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <CoverArt post={m} />
                </Link>
                <div className="mag-body">
                  <div className="meta">
                    <span>{m.publishedAt || 'مهر ۱۴۰۳'}</span>
                    <span>•</span>
                    <span>{faNum(m.readingMinutes || 5)} دقیقه مطالعه</span>
                  </div>
                  <h3>
                    <Link to={`/blog/${m.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {m.title}
                    </Link>
                  </h3>
                  <p>{m.excerpt}</p>
                  <Link to={`/blog/${m.slug}`} className="more">
                    ادامه مطلب <IconArrowLeft size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
