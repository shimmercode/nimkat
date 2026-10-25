'use client';
import {faNum} from '../../utils/fa.js';
export default function ApplicationReview({profile,steps=[],submission}){
 if(!profile)return <p>جزئیات فرم تفصیلی برای این پروندهٔ قدیمی ثبت نشده است.</p>;
 return <div className="onboard-review">{steps.filter(s=>s.fields.length).map(s=><details key={s.title}><summary>{s.title}</summary><dl>{s.fields.map(f=>{const value=profile[f.key],text=Array.isArray(value)?value.map(v=>f.options?.find(([key])=>key===v)?.[1]||v).join('، '):value;return <div key={f.key}><dt>{f.label}</dt><dd>{f.key==='videoUrl'&&text?<a href={text} target="_blank" rel="noopener noreferrer">مشاهده ویدئو در آپارات ↗</a>:text===undefined||text===''?'ثبت نشده':faNum(text)}</dd></div>;})}</dl></details>)}{submission&&<div className="onboard-receipt"><b>رسید ارسال پرونده</b><p>شناسه {faNum(submission.id)} · توافق‌نامه نسخهٔ {faNum(submission.agreement_version)} · {new Date(submission.accepted_at).toLocaleString('fa-IR')}</p><code dir="ltr">{submission.checksum}</code>{submission.agreement&&<details><summary>متن هفت بند پذیرفته‌شده در همین نسخه</summary><ol>{submission.agreement.clauses.map((c,i)=><li key={i}>{c}</li>)}</ol></details>}</div>}</div>;
}
