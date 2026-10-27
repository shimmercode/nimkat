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
      <div className="nk-brand-loader__card">
        <div className="nk-brand-loader__logo-wrap" aria-hidden="true">
          <span className="nk-brand-loader__halo" />
          <div className="nk-brand-loader__logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19V6l8 10V6" />
              <path d="M16 6v13" />
              <path d="M19 6v13" />
            </svg>
          </div>
        </div>
        <div className="nk-brand-loader__title">نیمکت</div>
        <div className="nk-brand-loader__sub">{label}</div>
        <div className="nk-brand-loader__bar" aria-hidden="true">
          <span className="nk-brand-loader__bar-fill" />
        </div>
      </div>

      {!overlay && (
        <div className="container nk-brand-loader__skeleton" aria-hidden="true">
          <div className="nk-brand-loader__skel-hero" />
          <div className="nk-brand-loader__skel-grid">
            <div className="nk-brand-loader__skel-box" />
            <div className="nk-brand-loader__skel-box" />
            <div className="nk-brand-loader__skel-box" />
            <div className="nk-brand-loader__skel-box" />
          </div>
        </div>
      )}
    </div>
  );
}
