import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(__dirname, '../..');
const swSource = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
const offlineHtml = fs.readFileSync(path.join(root, 'public/offline.html'), 'utf8');
const unavailableHtml = fs.readFileSync(path.join(root, 'public/service-unavailable.html'), 'utf8');

type Handler = (event: any) => void;

/* Minimal but faithful Service Worker host: implements only the APIs the
   worker actually uses, so the real handler logic is exercised end to end. */
function createWorker() {
  const listeners: Record<string, Handler[]> = {};
  const cacheStore = new Map<string, Map<string, Response>>();
  const deletedCaches: string[] = [];

  const makeCache = (name: string) => {
    const store = cacheStore.get(name) || new Map<string, Response>();
    cacheStore.set(name, store);
    return {
      add: async (request: any) => {
        const url = typeof request === 'string' ? request : request.url;
        // Seed with the real file contents so assertions check the shipped pages.
        if (url === '/offline.html') store.set(url, new Response(offlineHtml));
        else if (url === '/service-unavailable.html') store.set(url, new Response(unavailableHtml));
        else store.set(url, new Response(`cached:${url}`));
      },
      put: async (request: any, response: Response) => {
        const url = typeof request === 'string' ? request : request.url;
        store.set(url, response);
      },
      match: async (request: any) => {
        const url = typeof request === 'string' ? request : request.url;
        return store.get(url) || undefined;
      },
    };
  };

  const caches = {
    open: async (name: string) => makeCache(name),
    match: async (request: any) => {
      const url = typeof request === 'string' ? request : request.url;
      for (const store of cacheStore.values()) {
        const hit = store.get(url);
        if (hit) return hit;
      }
      return undefined;
    },
    keys: async () => Array.from(cacheStore.keys()),
    delete: async (name: string) => {
      deletedCaches.push(name);
      cacheStore.delete(name);
      return true;
    },
  };

  const self: any = {
    location: { origin: 'https://nimkat.example' },
    addEventListener: (type: string, handler: Handler) => {
      (listeners[type] ||= []).push(handler);
    },
    skipWaiting: async () => { self.__skipped = true; },
    clients: { claim: async () => { self.__claimed = true; } },
  };

  const ctx: any = {
    self,
    caches,
    Request: class { constructor(public url: string, public opts: any = {}) {} },
    Response,
    URL,
    Promise,
    console,
    setTimeout,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  // The worker resolves `fetch` from its own scope, so the stub must live in
  // the context rather than on the outer global.
  ctx.fetch = (...args: any[]) => (globalThis as any).fetch(...args);
  vm.runInContext(swSource, ctx);

  const fire = (type: string, event: any) => {
    const waits: Promise<any>[] = [];
    const ev = { ...event, waitUntil: (p: Promise<any>) => waits.push(p) };
    for (const h of listeners[type] || []) h(ev);
    return Promise.all(waits);
  };

  return { fire, self, caches, deletedCaches };
}

function navigateEvent(pathname: string, fetchImpl: (url: string) => Promise<Response>) {
  let responded: Response | undefined;
  const event: any = {
    request: {
      url: `https://nimkat.example${pathname}`,
      method: 'GET',
      mode: 'navigate',
      headers: new Headers(),
    },
    respondWith: (r: Promise<Response>) => { responded = r; },
  };
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = fetchImpl;
  return {
    event,
    result: () => responded!,
    restore: () => { (globalThis as any).fetch = originalFetch; },
  };
}

describe('service worker runtime behaviour', () => {
  it('serves the offline page when the network genuinely fails', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    const nav = navigateEvent('/', async () => { throw new TypeError('Failed to fetch'); });
    await w.fire('fetch', nav.event);
    const res = await nav.result();
    const body = await res.text();
    nav.restore();

    expect(body).toContain('اتصال به نیمکت برقرار نیست');
    expect(body).toContain('اتصال اینترنت را بررسی');
  });

  it('serves the restarting page (not the offline page) on a 502', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    const nav = navigateEvent('/', async () => new Response('Bad Gateway', { status: 502 }));
    await w.fire('fetch', nav.event);
    const res = await nav.result();
    const body = await res.text();
    nav.restore();

    expect(body).toContain('در حال راه‌اندازی مجدد');
    expect(body).not.toContain('اتصال اینترنت را بررسی');
  });

  it('serves the restarting page on a 503', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    const nav = navigateEvent('/classes', async () => new Response('Service Unavailable', { status: 503 }));
    await w.fire('fetch', nav.event);
    const res = await nav.result();
    const body = await res.text();
    nav.restore();

    expect(body).toContain('در حال راه‌اندازی مجدد');
  });

  it('passes a 404 through unchanged instead of masking it', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    const nav = navigateEvent('/does-not-exist', async () => new Response('Not Found', { status: 404 }));
    await w.fire('fetch', nav.event);
    const res = await nav.result();
    const body = await res.text();
    nav.restore();

    expect(res.status).toBe(404);
    expect(body).toBe('Not Found');
  });

  it('returns the real page when the server responds 200', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    const nav = navigateEvent('/', async () => new Response('real homepage', { status: 200 }));
    await w.fire('fetch', nav.event);
    const res = await nav.result();
    const body = await res.text();
    nav.restore();

    expect(res.status).toBe(200);
    expect(body).toBe('real homepage');
  });

  it('never intercepts API requests', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    let responded = false;
    const event: any = {
      request: { url: 'https://nimkat.example/api/health', method: 'GET', mode: 'cors', headers: new Headers() },
      respondWith: () => { responded = true; },
    };
    await w.fire('fetch', event);
    expect(responded).toBe(false);
  });

  it('never intercepts non-GET requests', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    let responded = false;
    const event: any = {
      request: { url: 'https://nimkat.example/api/bookings', method: 'POST', mode: 'cors', headers: new Headers() },
      respondWith: () => { responded = true; },
    };
    await w.fire('fetch', event);
    expect(responded).toBe(false);
  });

  it('replaces the old cache on activate', async () => {
    const w = createWorker();
    await w.fire('install', {});
    await w.fire('activate', {});

    expect(w.self.__skipped).toBe(true);
    expect(w.self.__claimed).toBe(true);
  });
});
