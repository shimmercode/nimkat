'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { faNum } from '../utils/fa';
import type { BlogPost } from '../server/blog';

const calcMinutes = (p: BlogPost) =>
  p.readingMinutes ||
  Math.max(1, Math.ceil((p.sections || []).map((s) => s.text).join(' ').split(/\s+/).length / 180));

const formatDateFa = (n: number) =>
  new Date(n).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tehran',
  });

export default function BlogListClient({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [query, setQuery] = useState<string>('');

  const allCategories = useMemo(() => {
    const set = new Set<string>(['همه']);
    for (const c of categories || []) if (c) set.add(c);
    for (const p of posts || []) if (p.category) set.add(p.category);
    return Array.from(set);
  }, [categories, posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts || []).filter((p) => {
      if (selectedCategory !== 'همه' && p.category !== selectedCategory) return false;
      if (!q) return true;
      const haystack = [p.title, p.excerpt, p.category, p.author, ...(p.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, selectedCategory, query]);

  const lead = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 22,
        }}
      >
        <nav className="journal-categories" aria-label="دسته‌بندی‌های مجله">
          {allCategories.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${selectedCategory === c ? 'is-active' : 'outline'}`}
              aria-pressed={selectedCategory === c}
              onClick={() => setSelectedCategory(c)}
              style={{ cursor: 'pointer' }}
            >
              {c}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 260, flex: '0 1 360px' }}>
          <input
            type="search"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="جستجو در مجله نیمکت"
            placeholder="جستجو در عنوان، موضوع یا کلیدواژه…"
          />
          {(query || selectedCategory !== 'همه') && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSelectedCategory('همه');
                setQuery('');
              }}
            >
              حذف فیلتر
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-soft" style={{ padding: 28, marginTop: 24, textAlign: 'center' }}>
          <h2 className="t-h4">یادداشتی با این فیلتر پیدا نشد</h2>
          <p className="t-small t-muted" style={{ marginTop: 8 }}>
            عبارت جستجو یا دسته‌بندی انتخابی را تغییر دهید تا همهٔ یادداشت‌های مجله نمایش داده شوند.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              setSelectedCategory('همه');
              setQuery('');
            }}
          >
            نمایش همهٔ یادداشت‌ها ({faNum(posts.length)})
          </button>
        </div>
      ) : (
        <>
          {lead && (
            <article className="journal-lead">
              <Link href={`/blog/${lead.slug}`} className="journal-lead-media">
                <Image
                  src={`/images/blog/${lead.cover || 'learning'}.png`}
                  alt={lead.coverAlt || lead.title}
                  width={1200}
                  height={630}
                  priority
                />
              </Link>
              <div className="journal-lead-copy">
                <span className="journal-kicker">{lead.category} · انتخاب سردبیری</span>
                <h2>
                  <Link href={`/blog/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p>{lead.excerpt}</p>
                <div className="journal-meta">
                  <span>{lead.author}</span>
                  <span>{formatDateFa(lead.publishedAt)}</span>
                  <span>{faNum(calcMinutes(lead))} دقیقه مطالعه</span>
                </div>
                <Link href={`/blog/${lead.slug}`} className="btn btn-primary">
                  خواندن یادداشت
                </Link>
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <div className="journal-grid" aria-label="یادداشت‌های مجله">
              {rest.map((p) => (
                <article className="journal-card" key={p.id}>
                  <Link href={`/blog/${p.slug}`}>
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
                        <span>{formatDateFa(p.publishedAt)}</span>
                        <span>{faNum(calcMinutes(p))} دقیقه</span>
                      </div>
                      <span className="journal-read">ادامه یادداشت ←</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
