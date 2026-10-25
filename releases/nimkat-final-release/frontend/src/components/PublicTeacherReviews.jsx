'use client';
import {useEffect,useState} from 'react';
import {api} from '../api.js';
import {faNum} from '../utils/fa.js';
export const reviewTags={punctual:'وقت‌شناس',mastery:'مسلط به درس',kind:'خوش‌برخورد',followup:'پیگیر',patient:'صبور',value:'ارزش آموزشی',innovative:'نوآور'};
export default function PublicTeacherReviews({teacherId,initialData=null}){
 const [data,setData]=useState(initialData),[offset,setOffset]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setData(initialData);setOffset(0);},[teacherId,initialData]);
 async function page(next){setBusy(true);setError('');try{const d=await api(`/teachers/${teacherId}/reviews?offset=${next}`);setData(d);setOffset(next);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="card" id="public-reviews" style={{borderRadius:'var(--r-2xl)',padding:24}}><h2 className="t-h3">رضایت‌های منتشرشدهٔ شاگردها</h2><p>این بخش فقط بازخوردهای مثبتِ دارای رضایت انتشار و تأیید مدیر را نشان می‌دهد؛ نمایندهٔ همهٔ نظرات یا رتبه‌بندی بی‌طرفانه نیست.</p>{error&&<p role="alert">{error}</p>}{!data&&<p role="status">اطلاعات نظرات در دسترس نیست.</p>}{data&&<><p>{faNum(data.summary.count)} بازخورد منتشرشده · میانگین همین بازخوردها: {data.summary.average===null?'—':faNum(Math.round(data.summary.average*10)/10)} از ۵</p>{!data.reviews.length&&<p>هنوز بازخورد مثبتِ تأییدشده با اجازهٔ انتشار ثبت نشده است.</p>}{data.reviews.map(r=><article className="nimchat-report" key={r.id}><h3>{r.alias}</h3><p>{faNum(r.stars)} از ۵ · جلسهٔ {new Date(r.ends_at).toLocaleDateString('fa-IR')}</p><ul>{r.positive.map(t=><li key={t}>{reviewTags[t]||t}</li>)}</ul><span className="chip outline-green">حضور و بازخورد ثبت‌شده؛ انتشار با اجازه</span></article>)}<div className="operations-actions"><button className="btn btn-outline" disabled={busy||offset===0} onClick={()=>page(Math.max(0,offset-20))}>صفحهٔ قبل نظرات</button><button className="btn btn-outline" disabled={busy||!data.hasMore} onClick={()=>page(offset+20)}>صفحهٔ بعد نظرات</button></div></>}</section>;
}
