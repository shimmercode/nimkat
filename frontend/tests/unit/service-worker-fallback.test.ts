import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const swPath = path.join(root, 'public/sw.js');
const offlinePath = path.join(root, 'public/offline.html');
const unavailablePath = path.join(root, 'public/service-unavailable.html');

const sw = fs.readFileSync(swPath, 'utf8');
const offline = fs.readFileSync(offlinePath, 'utf8');
const unavailable = fs.readFileSync(unavailablePath, 'utf8');

describe('service worker offline vs server-error fallback', () => {
  it('ships both fallback pages', () => {
    expect(offline.length).toBeGreaterThan(0);
    expect(unavailable.length).toBeGreaterThan(0);
    expect(unavailable).toContain('راه‌اندازی مجدد');
    expect(unavailable).toContain('setTimeout');
  });

  it('keeps the genuine offline page for a real network failure', () => {
    expect(sw).toContain("/offline.html");
    expect(offline).toContain('اتصال به نیمکت برقرار نیست');
  });

  it('does NOT show the offline page for a server 5xx response', () => {
    // A 5xx is a server-side condition, not a lost connection: it must be routed
    // to the "service restarting" page instead of claiming the user is offline.
    expect(sw).toContain('response.status >= 500');
    expect(sw).toContain("/service-unavailable.html");
  });

  it('routes 5xx to the restarting page and network errors to the offline page', () => {
    // Isolate the navigation handler so the install-time catch block cannot match.
    const navigateStart = sw.indexOf("event.request.mode === 'navigate'");
    expect(navigateStart).toBeGreaterThan(-1);
    const handler = sw.slice(navigateStart);

    // In the failure path the offline page is only reachable when the device
    // reports no connectivity at all.
    const onLineCheck = handler.indexOf('navigator.onLine === false');
    const offlineMatch = handler.indexOf('/offline.html', onLineCheck);
    const restartingMatch = handler.indexOf('/service-unavailable.html', onLineCheck);
    const statusCheck = handler.indexOf('response.status >= 500');
    const statusRestart = handler.indexOf('/service-unavailable.html', statusCheck);

    expect(onLineCheck).toBeGreaterThan(-1);
    expect(offlineMatch).toBeGreaterThan(onLineCheck);
    expect(restartingMatch).toBeGreaterThan(onLineCheck);
    expect(statusCheck).toBeGreaterThan(-1);
    expect(statusRestart).toBeGreaterThan(statusCheck);
  });

  it('passes 4xx responses through untouched', () => {
    // Only >= 500 is intercepted; a 404 must reach the user as-is.
    expect(sw).toContain('if (response.status >= 500)');
    expect(sw).not.toMatch(/response\.status >= 400/);
  });

  it('bumps the cache name so an outdated worker is replaced', () => {
    expect(sw).toContain("const CACHE = 'nimkat-offline-v2'");
    expect(sw).toContain('self.skipWaiting()');
    expect(sw).toContain('self.clients.claim()');
  });

  it('installs fallback assets independently so one missing file cannot abort install', () => {
    expect(sw).toContain('Promise.all(ASSETS.map');
    expect(sw).not.toMatch(/c\.addAll\(ASSETS\)/);
  });

  it('never caches API, account, payment or private responses', () => {
    expect(sw).toContain("url.pathname.startsWith('/api/')");
    expect(sw).toContain('event.request.method !== \'GET\'');
  });

  it('uses the device connectivity state to pick the right message', () => {
    // navigator.onLine distinguishes "no internet" from "server is down".
    expect(sw).toContain('navigator.onLine === false');
    expect(sw).toContain('/offline.html');
    expect(sw).toContain('/service-unavailable.html');
  });

  it('bounds the navigation wait so a hanging server cannot block the page', () => {
    expect(sw).toContain("setTimeout(() => reject(new Error('timeout')), 12000)");
  });

  it('asks the browser to refresh the worker on every page load', () => {
    const comp = fs.readFileSync(path.join(root, 'src/components/ServiceWorker.tsx'), 'utf8');
    expect(comp).toContain('registration.update()');
    expect(comp).toContain("updateViaCache: 'none'");
    expect(comp).toContain('visibilitychange');
  });

  it('serves the sw.js and fallback pages with no-cache headers', () => {
    const config = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
    expect(config).toContain("source: '/sw.js'");
    expect(config).toContain('no-cache, no-store, must-revalidate');
    expect(config).toContain('offline|service-unavailable');
  });
});
