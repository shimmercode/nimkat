'use client';
import React from 'react';

export default function HomeBrandLoader({
  overlay = false,
  exiting = false,
  label = 'نسل نوین آموزش آنلاین و حضوری — نیمکت',
}) {
  const cls = [
    'nk-brand-loader',
    overlay ? 'nk-brand-loader--overlay' : '',
    exiting ? 'is-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      data-testid="home-brand-loader"
    >
      <div className="nk-preloader__center">
        {/* Giant typographic NIMKAT wordmark that fills smoothly */}
        <div className="nk-preloader__word" dir="ltr" aria-label="NIMKAT">
          <span className="nk-preloader__word-base" aria-hidden="true">
            NIMKAT
          </span>
          <span className="nk-preloader__word-fill" aria-hidden="true">
            NIMKAT
          </span>
        </div>

        {/* Slogan underneath that fills/reveals smoothly */}
        <div className="nk-preloader__slogan-wrap">
          <p className="nk-preloader__slogan-base" aria-hidden="true">
            {label}
          </p>
          <p className="nk-preloader__slogan-fill">{label}</p>
        </div>

        {/* Minimal thin fill line */}
        <div className="nk-preloader__line" aria-hidden="true">
          <span className="nk-preloader__line-fill" />
        </div>
      </div>
    </div>
  );
}
