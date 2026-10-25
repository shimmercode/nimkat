'use client';
import {useEffect,useState} from 'react';
import {api} from '../../api.js';
import {persianMonthBounds} from '../../utils/persian-calendar.js';
const date=t=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',dateStyle:'full',timeStyle:'short'}).format(t);
export default function Calendar(){
 const [clock,setClock]=useState(Date.now());
 useEffect(()=>{const t=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(t);},[]);
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[month,setMonth]=useState(0),[offset,setOffset]=useState(0);
 // A bounded navigation window; all displayed dates and input labels are Tehran/Persian.
 const bounds=()=>persianMonthBounds(month);
 const load=async()=>{const {from,to}=bounds();try{setError('');setData(await api(`/calendar?from=${from}&to=${to}&offset=${offset}`));}catch(e){setError(e.message);}};
 useEffect(()=>{let active=true;const {from,to}=bounds();setData(null);api(`/calendar?from=${from}&to=${to}&offset=${offset}`).then(d=>{if(active){setData(d);setError('');}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[month,offset]);
 async function respond(id,decision){setBusy(true);try{await api(`/schedule/proposals/${id}/respond`,{method:'POST',body:{decision}});await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function join(id){setBusy(true);try{const r=await api(`/classroom/${id}/join`,{method:'POST',body:{}});window.location.assign(r.url);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="teaching-card"><h1 className="t-h2">تقویم و کلاس‌های من</h1><p>تاریخ شمسی و ساعت تهران. ورود به اتاق فقط در بازهٔ مجاز و با عضویت قطعی فعال است.</p>{error&&<p role="alert">{error}</p>}<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBlock:20}}><button className="btn btn-outline" onClick={()=>{setMonth(m=>m-1);setOffset(0);}}>بازهٔ قبل</button><strong>{date(bounds().from)} تا {date(bounds().to-1)}</strong><button className="btn btn-outline" onClick={()=>{setMonth(m=>m+1);setOffset(0);}}>بازهٔ بعد</button></div>
 {data?.changes.map(p=><article className="nimchat-report" key={p.id}><h2 className="t-h3">پیشنهاد تغییر زمان</h2><p>{p.reason}</p><p>قبلی: {date(p.old_start)}<br/>جدید: {date(p.starts_at)} تا {date(p.ends_at)}</p><p>مهلت پاسخ: {date(p.expires_at)}؛ تا پذیرش همهٔ اعضا زمان قبلی معتبر است.</p>{p.decision==='pending'?<><button disabled={busy} className="btn btn-primary" onClick={()=>respond(p.id,'accepted')}>پذیرش زمان جدید</button> <button disabled={busy} className="btn btn-outline" onClick={()=>respond(p.id,'rejected')}>رد پیشنهاد</button></>:<p>پاسخ شما ثبت شده؛ در انتظار سایر اعضا.</p>}</article>)}
 {!data&&!error&&<p role="status">دریافت برنامه…</p>}{data&&!data.occurrences.length&&<p>در این بازه جلسه‌ای ثبت نشده است.</p>}{data?.occurrences.map(o=><article className="nimchat-report" key={o.id}><h2 className="t-h3">{o.title}</h2><p>{o.teacher_name} · {o.mode}</p><p>{date(o.starts_at)} تا {date(o.ends_at)}</p><p>{o.status==='cancelled'?'لغوشده':'برنامه‌ریزی‌شده'}</p>{o.status==='scheduled'&&!['حضوری','in-person'].includes(o.mode)&&<button disabled={busy||clock<o.starts_at-15*60000||clock>o.ends_at+15*60000} className="btn btn-primary" onClick={()=>join(o.id)}>ورود امن به کلاس</button>} <a className="btn btn-outline" href="#support" onClick={e=>{e.preventDefault();window.dispatchEvent(new Event('nimkat:open-support'));}}>پشتیبانی کلاس</a></article>)}
 <div style={{display:'flex',gap:12}}>{offset>0&&<button className="btn btn-outline" onClick={()=>setOffset(n=>Math.max(0,n-100))}>صفحهٔ قبل</button>}{data?.hasMore&&<button className="btn btn-outline" onClick={()=>setOffset(n=>n+100)}>جلسات بیشتر</button>}</div></section>;
}
