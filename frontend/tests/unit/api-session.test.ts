import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
describe('cookie API client', () => {
  it('deduplicates simultaneous refreshes and retries each failed request once', async () => {
    vi.stubGlobal('document', { cookie: 'nk_csrf=csrf-test' });
    let privateCount = 0;
    const mock = vi.fn(async (url: string) => {
      if (url === '/api/private') return new Response(JSON.stringify(privateCount++ < 2 ? { code: 'UNAUTHENTICATED' } : { ok: true }), { status: privateCount <= 2 ? 401 : 200 });
      if (url === '/api/auth/me') return new Response('{}', { status: 401 });
      if (url === '/api/auth/refresh') return new Response('{"ok":true}', { status: 200 });
      throw new Error(url);
    });
    vi.stubGlobal('fetch', mock);
    const { api } = await import('../../src/api.js');
    const responses = await Promise.all([api('/private'), api('/private')]);
    expect(responses).toEqual([{ ok: true }, { ok: true }]);
    expect(mock.mock.calls.filter(([url]) => url === '/api/auth/refresh')).toHaveLength(1);
    for (const call of mock.mock.calls) {
      const options = (call as unknown as [string, RequestInit])[1];
      expect(options.credentials).toBe('same-origin');
      expect(options.headers).not.toHaveProperty('Authorization');
      expect(options.headers).toHaveProperty('X-CSRF-Token', 'csrf-test');
    }
  });
  it('never refreshes authentication errors from OTP verification or CSRF rejection', async () => {
    const mock = vi.fn(async () => new Response('{"error":"rejected","code":"CSRF_REJECTED"}', { status: 403 }));
    vi.stubGlobal('fetch', mock);
    const { api } = await import('../../src/api.js');
    await expect(api('/auth/otp/verify', { method: 'POST', body: {} })).rejects.toMatchObject({ code: 'CSRF_REJECTED', status: 403 });
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
