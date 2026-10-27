/* Accessible, RTL-aware toast notification feedback */
export function toast(msg, tone = 'ok') {
  if (typeof document === 'undefined') return;
  let host = document.getElementById('nimkat-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'nimkat-toast-host';
    host.setAttribute('role', 'region');
    host.setAttribute('aria-label', 'اعلان‌های سامانه');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `nimkat-toast ${tone}`;
  el.setAttribute('role', tone === 'err' ? 'alert' : 'status');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.classList.add('show'), 12);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 240);
  }, 3000);
}
