'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import { IconSend } from '../icons.jsx';
export const SUPPORT_STATUS = { bot: 'دستیار راهنما', waiting: 'در صف کارشناس', human: 'در حال پیگیری', closed: 'بسته‌شده' };
export default function SupportConversation({ id, admin = false, onActivity, onNew, guestToken, guestAdmin = false }) {
  const [detail, setDetail] = useState(null), [messages, setMessages] = useState([]), [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState(''), [busy, setBusy] = useState(false), [olderBusy, setOlderBusy] = useState(false), [error, setError] = useState(''), [closeAfter, setCloseAfter] = useState(false), [notice, setNotice] = useState('');
  const attempt = useRef(null), end = useRef(null), scroll = useRef(null), initialized = useRef(false), alive = useRef(true), callback = useRef(onActivity);
  callback.current = onActivity;
  const base = guestAdmin ? '/admin/support/guests' : guestToken ? '/support/guest/threads' : admin ? '/admin/support' : '/support/threads';
  const call=useCallback((path,options={})=>api(path,{...options,...(guestToken?{headers:{'X-Support-Token':guestToken}}:{})}),[guestToken]);
  const load = useCallback(async (before) => {
    const result = await call(`${base}/${id}${before ? `?before=${before}` : ''}`);
    if (!alive.current) return;
    setDetail(result.thread);
    const nearEnd = !scroll.current || scroll.current.scrollHeight - scroll.current.scrollTop - scroll.current.clientHeight < 100;
    setMessages(previous => [...new Map([...previous, ...result.messages].map(m => [m.id,m])).values()].sort((a,b)=>a.id-b.id));
    if (before || !initialized.current) setHasMore(result.hasMore);
    if (!before && (!initialized.current || nearEnd)) requestAnimationFrame(() => end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
    initialized.current = true;
  }, [base,id,call]);
  useEffect(() => {
    alive.current=true;
    load().catch(e => { if (alive.current) setError(e.message); });
    const timer=setInterval(() => { if(document.visibilityState==='visible') load().catch(e => { if(alive.current) setError(e.message); }); },6000);
    return () => { alive.current=false; clearInterval(timer); };
  },[load]);
  async function send(e) {
    e.preventDefault(); if(busy || !text.trim()) return;
    const value=text.trim(), fingerprint=JSON.stringify([value,closeAfter]);
    if(attempt.current?.fingerprint!==fingerprint) attempt.current={fingerprint,key:crypto.randomUUID()};
    setBusy(true);setError('');setNotice('');
    try {
      await call(`${base}/${id}/${admin?'reply':'messages'}`,{method:'POST',body:{text:value,clientId:attempt.current.key,...(admin?{close:closeAfter}:{})}});
      if(!alive.current) return;
      setText(''); attempt.current=null; setNotice(admin?'پاسخ ذخیره شد.':'پیام ذخیره شد.'); await load(); callback.current?.();
      requestAnimationFrame(()=>end.current?.scrollIntoView({block:'nearest'}));
    } catch(e) { if(alive.current) {setError(e.message); await load().catch(()=>{});} }
    finally { if(alive.current) setBusy(false); }
  }
  async function change(action) {
    setBusy(true);setError('');
    try { const r=await call(`${base}/${id}/${action}`,{method:'POST',body:{}}); if(!alive.current)return; setNotice(r.message||'درخواست بازگشایی شد.');await load();callback.current?.(); }
    catch(e){if(alive.current)setError(e.message);} finally{if(alive.current)setBusy(false);}
  }
  async function older() {
    setOlderBusy(true); const node=scroll.current, height=node?.scrollHeight||0, top=node?.scrollTop||0;
    try {await load(messages[0]?.id);requestAnimationFrame(()=>{if(node)node.scrollTop=top+node.scrollHeight-height;});} catch(e){setError(e.message);}finally{setOlderBusy(false);}
  }
  return <div className="support-conversation">
    <div className="support-conversation-meta"><span className={`support-badge support-badge--${detail?.status || 'bot'}`}>{detail ? SUPPORT_STATUS[detail.status] : 'در حال دریافت…'}</span><button type="button" className="support-text-button" onClick={()=>load().then(()=>setError('')).catch(e=>setError(e.message))}>تازه‌سازی</button></div>
    {error && <p className="support-error" role="alert">{error}</p>}
    <div className="support-message-list" ref={scroll} role="log" aria-label="پیام‌های پشتیبانی" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
      {hasMore && <button className="btn btn-outline support-older" onClick={older} disabled={olderBusy}>{olderBusy?'در حال دریافت…':'پیام‌های قدیمی‌تر'}</button>}
      {detail && !messages.length && <div className="support-empty"><span className="support-empty-mark">؟</span><h3>از همین‌جا شروع کنیم</h3><p>سؤالتان را بنویسید. رمز، کد ورود و اطلاعات کارت بانکی را ارسال نکنید.</p></div>}
      {messages.map(m=><article key={m.id} className={`support-message support-message--${m.kind}`}><div className="support-message-byline"><strong>{m.kind==='user'?(admin?'کاربر':'شما') :m.kind==='agent'?'کارشناس نیمکت':'دستیار نیمکت'}</strong><time dateTime={new Date(m.created_at).toISOString()}>{new Date(m.created_at).toLocaleString('fa-IR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></div><p>{m.text}</p></article>)}
      {busy&&!admin&&detail?.status==='bot'&&<p className="support-bot-thinking" role="status"><i/><i/><i/> دستیار در حال آماده‌کردن پاسخ است…</p>}<div ref={end} />
    </div>
    <div className="support-composer-area">
      {notice && <p className="support-small" role="status">{notice}</p>}
      {detail?.status==='closed' ? <div className="support-closed"><p>این درخواست بسته شده؛ تاریخچه محفوظ است.</p>{admin && !guestAdmin?<button className="btn btn-outline" disabled={busy} onClick={()=>change('reopen')}>بازگشایی درخواست</button>:!admin?<button className="btn btn-primary" onClick={onNew}>درخواست جدید</button>:null}</div> : <>
        {!admin && detail?.status==='bot' && <button className="support-escalate" disabled={busy} onClick={()=>change('escalate')}>نیاز به بررسی حساب دارید؟ <strong>ارجاع به کارشناس</strong></button>}
        {!admin && ['waiting','human'].includes(detail?.status) && <p className="support-small">پیام برای کارشناس ذخیره می‌شود؛ پاسخ فوری یا حضور آنلاین تضمین نمی‌شود.</p>}
        <form onSubmit={send} className="support-composer"><label className="support-sr-only" htmlFor={`support-text-${id}`}>{admin?'پاسخ کارشناس':'پیام پشتیبانی'}</label><textarea id={`support-text-${id}`} rows={2} maxLength={admin?4000:2000} value={text} onChange={e=>setText(e.target.value)} placeholder={admin?'پاسخ دقیق و روشن بنویسید…':'چطور می‌توانیم کمکتان کنیم؟'} disabled={busy || !detail} /><button className="btn btn-primary support-send" disabled={busy || !text.trim() || !detail} type="submit" aria-label={busy?'در حال ارسال':'ارسال پیام'}><IconSend size={20}/><span>{busy?'در حال ارسال…':'ارسال'}</span></button></form>
        <div className="support-composer-foot"><span>{text.length.toLocaleString('fa-IR')} / {admin?'۴۰۰۰':'۲۰۰۰'}</span>{admin ? <label><input type="checkbox" checked={closeAfter} onChange={e=>setCloseAfter(e.target.checked)} /> بستن درخواست پس از پاسخ</label>:<span>پاسخ‌های دستیار جایگزین تأیید پرداخت نیست.</span>}</div>
      </>}
    </div>
  </div>;
}
