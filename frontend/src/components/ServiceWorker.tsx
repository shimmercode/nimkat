'use client';
import {useEffect} from 'react';

/**
 * Registers the offline service worker and keeps it fresh.
 *
 * The browser only checks for a new worker on its own schedule (up to 24 hours),
 * so a client that loaded an older worker would keep serving a stale offline
 * fallback long after a fix was deployed. Re-registering on every mount asks
 * the browser for the current script; when the bytes differ it installs the new
 * worker, which then takes over via skipWaiting() + clients.claim().
 *
 * Every failure is swallowed: offline support must never block the app or login.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (!window.isSecureContext) return;

    let cancelled = false;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          if (cancelled) return;
          // Ask the browser to compare the script bytes on every page load so a
          // deployed fix reaches clients immediately instead of after a day.
          registration.update().catch(() => {});
        })
        .catch(() => {
          /* Offline support must never prevent login. */
        });
    };

    register();

    // Also refresh when the tab regains focus, which covers a long-lived tab
    // that was left open across a deployment.
    const onVisible = () => {
      if (document.visibilityState === 'visible') register();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
