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

/* Clients that still run an older worker keep showing the misleading
   "you appear to be offline" page for any 5xx. Ask them to reload so the
   current worker takes over, but only once per activation to avoid a loop. */
self.addEventListener('message', event => {
  if (event.data === 'NIMKAT_SW_VERSION') {
    event.source?.postMessage({ type: 'NIMKAT_SW_VERSION', version: CACHE });
  }
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
      let response;
      try {
        // A cold-starting server can hang instead of failing fast, so bound the
        // wait. navigator.onLine tells us whether the device itself is online.
        response = await Promise.race([
          fetch(event.request),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
        ]);
      } catch (_) {
        if (navigator.onLine === false) {
          // The device has no connectivity at all: the offline page is correct.
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
        } else {
          // The device is online but the request failed: the server is the
          // problem, so say so instead of blaming the user's connection.
          const restarting = await caches.match('/service-unavailable.html');
          if (restarting) return restarting;
        }
        return new Response(
          '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>اتصال برقرار نیست | نیمکت</title></head><body style="font-family:sans-serif;padding:40px;text-align:center"><h1>اتصال به نیمکت برقرار نیست</h1><p>اتصال اینترنت را بررسی و دوباره تلاش کنید.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }

      if (response.status >= 500) {
        const restarting = await caches.match('/service-unavailable.html');
        if (restarting) return restarting;
      }
      return response;
    })());
  }
});
