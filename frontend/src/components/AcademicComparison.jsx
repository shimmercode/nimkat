'use client';
import {useState} from 'react';
import {faNum} from '../utils/fa.js';
const labels=['آمادگی','وقت‌شناسی','تعامل','تمرکز','تکلیف','درک مفاهیم','حل مسئله','استمرار'];
const date=t=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'}).format(t);
export default function AcademicComparison({reports=[]}){
 const [first,setFirst]=useState(''),[second,setSecond]=useState('');
 if(!reports.length)return <p>هنوز گزارش معتبر مدرس ثبت نشده است.</p>;
 const a=reports.find(r=>String(r.occurrence_id)===first)||reports.at(-1),b=reports.find(r=>String(r.occurrence_id)===second)||reports[0];
 const strengths=b.scores.map((score,i)=>({score,label:labels[i]})).filter(x=>x.score>=75).sort((a,b)=>b.score-a.score).slice(0,3);
 return <section aria-label="مقایسهٔ گزارش‌های تحصیلی"><p>هر نمره از ۱۰۰ و نظر ثبت‌شدهٔ مدرس برای همان جلسه است؛ این مقایسه تشخیص علمی یا تضمین پیشرفت نیست.</p><div className="operations-fields"><label>گزارش مبنا<select aria-label="گزارش مبنا" className="input" value={String(a.occurrence_id)} onChange={e=>setFirst(e.target.value)}>{reports.map(r=><option key={r.occurrence_id} value={r.occurrence_id}>{date(r.created_at)} · جلسهٔ {faNum(r.occurrence_id)}</option>)}</select></label><label>گزارش مقایسه<select aria-label="گزارش مقایسه" className="input" value={String(b.occurrence_id)} onChange={e=>setSecond(e.target.value)}>{reports.map(r=><option key={r.occurrence_id} value={r.occurrence_id}>{date(r.created_at)} · جلسهٔ {faNum(r.occurrence_id)}</option>)}</select></label></div><div className="operations-table-wrap"><table className="operations-table"><caption>اختلاف نمرهٔ گزارش مقایسه نسبت به مبنا؛ واحد: نمره، نه درصد</caption><thead><tr><th scope="col">شاخص</th><th scope="col">مبنا</th><th scope="col">مقایسه</th><th scope="col">تغییر</th></tr></thead><tbody>{labels.map((l,i)=><tr key={l}><th scope="row">{l}</th><td>{faNum(a.scores[i])}</td><td>{faNum(b.scores[i])}</td><td>{b.scores[i]>a.scores[i]?'+':''}{faNum(b.scores[i]-a.scores[i])}</td></tr>)}</tbody></table></div><h3 className="t-h3">نقاط قوت در گزارش انتخاب‌شده</h3>{strengths.length?<ul>{strengths.map(s=><li key={s.label}>{s.label}: {faNum(s.score)} از ۱۰۰، طبق گزارش جلسهٔ {faNum(b.occurrence_id)} در {date(b.created_at)}</li>)}</ul>:<p>در این گزارش شاخصی با نمرهٔ حداقل ۷۵ ثبت نشده است.</p>}</section>;
}
