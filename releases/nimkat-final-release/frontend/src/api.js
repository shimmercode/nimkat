/* Same-origin cookie API client. Session credentials are never stored in JS storage. */
let refreshPending = null;
let sessionRevision = 0;
const csrfToken = () => {
  if (typeof document === 'undefined') return '';
  const part = document.cookie.split('; ').filter((value) => value.startsWith('nk_csrf=')).at(-1);
  try { return part ? decodeURIComponent(part.slice('nk_csrf='.length)) : ''; } catch { return ''; }
};
const request = (path, options = {}) => fetch(`/api${path}`, {
  ...options,
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    ...(csrfToken() ? { 'X-CSRF-Token': csrfToken() } : {}),
    ...(options.headers || {}),
  },
});
async function refreshSession() {
  if (!refreshPending) {
    const refresh = async () => {
      if(mutationPending)await mutationPending.catch(()=>{});
      // Another tab may already have rotated cookies while we waited for the lock.
      const me = await request('/auth/me');
      if (me.ok && (await me.json()).user) return true;
      const response = await request('/auth/refresh', { method: 'POST' });
      if (response.status >= 500) throw new Error('ارتباط با سرور نشست موقتاً برقرار نیست؛ دوباره تلاش کنید.');
      return response.ok;
    };
    refreshPending = (typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('nimkat-session-refresh', refresh)
      : refresh()).finally(() => { refreshPending = null; });
  }
  return refreshPending;
}
async function performApi(path, { method = 'GET', body, headers, raw = false, responseType = 'json' } = {}) {
  const started = sessionRevision;
  const options = { method, headers, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) };
  let res = await request(path, options);
  if (res.status === 401 && !path.startsWith('/support/guest') && (!path.startsWith('/auth/') || path === '/auth/me' || path === '/auth/logout-all')) {
    if (await refreshSession()) res = await request(path, options);
    else if (started === sessionRevision && typeof window !== 'undefined') window.dispatchEvent(new Event('nimkat:session-ended'));
  }
  if(res.ok&&responseType==='blob')return res.blob();
  const data = await res.json().catch(() => ({error:res.status>=500?'ارتباط با سرویس موقتاً برقرار نیست؛ دوباره تلاش کنید.':'پاسخ سرور قابل پردازش نیست؛ صفحه را تازه کنید.'}));
  if (!res.ok) {
    const error = new Error(data.error || 'خطای ناشناخته');
    error.status = res.status;
    error.code = data.code;
    throw error;
  }
  if (['/auth/otp/verify', '/auth/logout', '/auth/logout-all'].includes(path)) sessionRevision++;
  return data;
}

// Serialize login/logout with credential rotation. A delayed refresh response must not
// clear cookies that a newer OTP verification has just created (also across tabs).
let mutationPending=null;
export async function api(path,options={}) {
  if(!['/auth/otp/verify','/auth/logout'].includes(path))return performApi(path,options);
  sessionRevision++;
  const change=()=>performApi(path,options);
  // refreshPending can itself be waiting on the Web Lock: await it BEFORE taking it.
  if(refreshPending)await refreshPending.catch(()=>{});
  if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request('nimkat-session-refresh',()=>performApi(path,options));
  const previous=mutationPending;
  const pending=(async()=>{if(previous)await previous.catch(()=>{});return change();})();
  mutationPending=pending;
  try{return await pending;}finally{if(mutationPending===pending)mutationPending=null;}
}
