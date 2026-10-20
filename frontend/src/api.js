/* Same-origin cookie API client. Session credentials are never stored in JS storage. */
let refreshPending = null;
const csrfToken = () => {
  if (typeof document === 'undefined') return '';
  const part = document.cookie.split('; ').find((value) => value.startsWith('nk_csrf='));
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
      // Another tab may already have rotated cookies while we waited for the lock.
      const me = await request('/auth/me');
      if (me.ok && (await me.json()).user) return true;
      return (await request('/auth/refresh', { method: 'POST' })).ok;
    };
    refreshPending = (typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('nimkat-session-refresh', refresh)
      : refresh()).finally(() => { refreshPending = null; });
  }
  return refreshPending;
}
export async function api(path, { method = 'GET', body } = {}) {
  const options = { method, body: body === undefined ? undefined : JSON.stringify(body) };
  let res = await request(path, options);
  if (res.status === 401 && (!path.startsWith('/auth/') || path === '/auth/me' || path === '/auth/logout-all')) {
    if (await refreshSession()) res = await request(path, options);
    else if (typeof window !== 'undefined') window.dispatchEvent(new Event('nimkat:session-ended'));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'خطای ناشناخته');
    error.status = res.status;
    error.code = data.code;
    throw error;
  }
  return data;
}
