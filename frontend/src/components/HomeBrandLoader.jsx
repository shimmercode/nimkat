'use client';
import React from 'react';

export default function HomeBrandLoader({ overlay = false, label = 'در حال آماده‌سازی نیمکت…' }) {
  return (
    <div
      className={overlay ? 'nk-brand-loader nk-brand-loader--overlay' : 'nk-brand-loader'}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="home-brand-loader"
    >
      <div className="nk-preloader__stage">
        <div className="nk-preloader__orb nk-preloader__orb--emerald" aria-hidden="true" />
        <div className="nk-preloader__orb nk-preloader__orb--amber" aria-hidden="true" />

        <div className="nk-preloader__emblem" aria-hidden="true">
          <span className="nk-preloader__ring" />
          <span className="nk-preloader__ring nk-preloader__ring--outer" />
          <div className="nk-preloader__mark">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11h18" />
              <path d="M5 11v7" />
              <path d="M19 11v7" />
              <path d="M6 7h12a1 1 0 0 1 1 1v3H5V8a1 1 0 0 1 1-1Z" />
              <path d="M3 15h18" />
            </svg>
            <i className="nk-preloader__dot" />
          </div>
        </div>

        <div className="nk-preloader__wordmark">
          <span className="nk-preloader__brand-name">نیمکت</span>
          <span className="nk-preloader__tagline">پلتفرم آموزش آنلاین و حضوری</span>
        </div>

        <div className="nk-preloader__progress" aria-hidden="true">
          <span className="nk-preloader__progress-bar" />
        </div>

        <div className="nk-preloader__status">{label}</div>
      </div>
    </div>
  );
}
