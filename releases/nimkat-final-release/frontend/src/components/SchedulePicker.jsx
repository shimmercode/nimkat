'use client';
import { useEffect,useState } from 'react';
import { api } from '../api.js';
export const sessionTime=(value)=>new Date(value).toLocaleString('fa-IR',{dateStyle:'medium',timeStyle:'short'});
export default function SchedulePicker({classId,count,selected,onChange}){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);setError('');api(`/classes/${classId}/schedule`).then(r=>setRows(r.occurrences)).catch(e=>setError(e.message)).finally(()=>setLoading(false));};
 useEffect(()=>{load();},[classId]);
 return <fieldset className="schedule-picker"><legend>انتخاب زمان جلسات</legend><p className="t-small">{selected.length.toLocaleString('fa-IR')} از {count.toLocaleString('fa-IR')} جلسه انتخاب شده · زمان محلی دستگاه ({Intl.DateTimeFormat().resolvedOptions().timeZone})</p>{error?<p role="alert">{error}</p>:loading?<p role="status">در حال دریافت برنامه…</p>:!rows.length?<p className="t-small">زمان قابل رزروی ثبت نشده است؛ تا تأیید مدرس و انتشار برنامه، رزرو نهایی ممکن نیست.</p>:<div className="schedule-options">{rows.map(row=><label key={row.id}><input type="checkbox" checked={selected.includes(row.id)} disabled={!selected.includes(row.id)&&selected.length>=count} onChange={e=>onChange(e.target.checked?[...selected,row.id]:selected.filter(id=>id!==row.id))}/><span>{sessionTime(row.starts_at)}<small>تا {new Date(row.ends_at).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})}</small></span></label>)}</div>}<button className="btn btn-outline btn-sm" type="button" onClick={load}>تازه‌سازی برنامه</button></fieldset>;
}
