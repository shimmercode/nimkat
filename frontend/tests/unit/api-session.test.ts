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

it('preserves the session on a temporary refresh service error',async()=>{
 vi.stubGlobal('document',{cookie:'nk_csrf=old; nk_csrf=current'});
 const event=vi.fn();vi.stubGlobal('window',{dispatchEvent:event});
 const mock=vi.fn(async(url:string)=>new Response(JSON.stringify({error:'temporary'}),{status:url.includes('/refresh')?503:401}));vi.stubGlobal('fetch',mock);
 const {api}=await import('../../src/api.js');await expect(api('/private')).rejects.toThrow('موقتاً');expect(event).not.toHaveBeenCalled();
 expect((mock.mock.calls[0] as any)[1].headers['X-CSRF-Token']).toBe('current');
});

it('waits for an in-flight refresh before setting fresh OTP cookies',async()=>{
 vi.stubGlobal('document',{cookie:'nk_csrf=test'});let release!:()=>void;const hold=new Promise<void>(r=>release=r);const order:string[]=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>{if(url==='/api/private')return new Response('{}',{status:401});if(url==='/api/auth/me')return new Response('{}',{status:401});if(url==='/api/auth/refresh'){order.push('refresh-start');await hold;order.push('refresh-end');return new Response('{}',{status:401});}order.push('verify');return new Response('{"user":{"id":1}}');}));
 const {api}=await import('../../src/api.js');const old=api('/private').catch(()=>{});await vi.waitFor(()=>expect(order).toContain('refresh-start'));const login=api('/auth/otp/verify',{method:'POST',body:{}});await Promise.resolve();expect(order).not.toContain('verify');release();await Promise.all([old,login]);expect(order).toEqual(['refresh-start','refresh-end','verify']);
});

it('uploads raw file bytes with CSRF and refreshes a private download without parsing it as JSON',async()=>{
 vi.stubGlobal('document',{cookie:'nk_csrf=file-token'});let downloaded=false;
 const blob=new Blob(['%PDF-private'],{type:'application/pdf'}),mock=vi.fn(async(url:string,options:any)=>{
  if(url==='/api/materials/1'){expect(options.body).toBe(blob);expect(options.headers['Content-Type']).toBe('application/octet-stream');expect(options.headers['X-CSRF-Token']).toBe('file-token');return new Response('{"id":"material-1"}');}
  if(url==='/api/materials/material-1/download'){if(!downloaded){downloaded=true;return new Response('{}',{status:401});}return new Response(blob,{headers:{'Content-Type':'application/pdf'}});}
  if(url==='/api/auth/me')return new Response('{}',{status:401});
  if(url==='/api/auth/refresh')return new Response('{"ok":true}');
  throw Error(url);
 });vi.stubGlobal('fetch',mock);const {api}=await import('../../src/api.js');expect(await api('/materials/1',{method:'POST',body:blob,raw:true,headers:{'Content-Type':'application/octet-stream'}})).toEqual({id:'material-1'});const file=await api('/materials/material-1/download',{responseType:'blob'});expect(await file.text()).toBe('%PDF-private');expect(file.type).toBe('application/pdf');
});
