'use client';
import { useEffect, useState } from 'react';

export default function ArticleTools({ variant = 'top' }) {
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (variant !== 'top') return undefined;
    const update = () => {
      const el = document.getElementById('article-body');
      if (el) {
        const r = el.getBoundingClientRect();
        setProgress(
          Math.min(100, Math.max(0, (-r.top / Math.max(1, r.height - window.innerHeight)) * 100))
        );
      }
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [variant]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice('پیوند مقاله کپی شد ✓');
        setTimeout(() => setNotice(''), 3500);
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') {
        setNotice('کپی خودکار ممکن نیست؛ پیوند را از نوار آدرس بردارید.');
      }
    }
  };

  return (
    <>
      {variant === 'top' && (
        <div className="journal-progress" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className={`journal-share wm-share-bar wm-share-bar--${variant}`}>
        <button type="button" className="wm-share-btn" onClick={handleShare}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>اشتراک‌گذاری ↗</span>
        </button>
        <button type="button" className="wm-share-btn" onClick={() => window.print()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>نسخهٔ چاپی</span>
        </button>
        <span role="status" className={`wm-share-notice ${notice ? 'is-visible' : ''}`}>
          {notice}
        </span>
      </div>
    </>
  );
}
