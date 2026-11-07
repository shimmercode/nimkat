/* No API, account HTML, payments, transcripts or personal data are cached. */
const CACHE = 'nimkat-offline-v2';
const ASSETS = ['/offline.html', '/service-unavailable.html', '/icons/bench-192.png', '/icons/bench-512.png', '/fonts/YekanBakhFaNum-Regular.woff2'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache each asset independently: one missing file must not abort the whole install.
    await Promise.all(ASSETS.map(async asset => {
      try { await cache.add(new Request(asset, { cache: 'reload' })); } catch (_) { /* optional asset */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('nimkat-offline-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Distinguishes a genuine network outage from a server-side error.
   - network down / connection reset  -> offline.html (no connectivity)
   - server responded with 5xx         -> service-unavailable.html (auto retry)
   - server responded with 4xx         -> pass the response through unchanged */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.status >= 500) {
          const fallback = await caches.match('/service-unavailable.html');
          if (fallback) return fallback;
        }
        return response;
      } catch (_) {
        const fallback = await caches.match('/offline.html');
        if (fallback) return fallback;
        return new Response(
          '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>اتصال برقرار نیست | نیمکت</title></head><body style="font-family:sans-serif;padding:40px;text-align:center"><h1>اتصال به نیمکت برقرار نیست</h1><p>اتصال اینترنت را بررسی و دوباره تلاش کنید.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
  }
});
