/* minimal toast feedback */
export function toast(msg, tone = 'ok') {
  if (typeof document === 'undefined') return;
  let host = document.getElementById('nimkat-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'nimkat-toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `nimkat-toast ${tone}`;
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
}
