'use client';
import { useState } from 'react';
import { useNavigate } from '../routing/navigation';
import { IconSearch, IconGlobe, IconMapPin, IconChevronDown } from './icons.jsx';
const fields = [
  { key:'kind',label:'نوع کلاس',values:['خصوصی','گروهی','دوستانه'],initial:'خصوصی' },
  { key:'grade',label:'مقطع',values:['ابتدایی','متوسطه اول','متوسطه دوم','کنکور'],initial:'متوسطه دوم' },
  { key:'subject',label:'درس',values:['فیزیک','ریاضی','شیمی','زیست‌شناسی','زبان انگلیسی','فارسی'],initial:'فیزیک' },
];
export default function HeroSearch({ data = {} }) {
  const navigate=useNavigate(),[mode,setMode]=useState('online');
  const [values,setValues]=useState(()=>Object.fromEntries(fields.map((f,i)=>[f.key,data.searchFields?.[i]?.value||f.initial])));
  function submit(e){e.preventDefault();const query=new URLSearchParams({...values,mode:mode==='online'?'آنلاین':'حضوری'});const href=data.searchBtnHref||'/classes';const target=href.startsWith('/')&&!href.startsWith('//')?href:'/classes';navigate(`${target.split('?')[0]}?${query}`);}
  return <form className="hero-search" onSubmit={submit} aria-label="جستجوی کلاس"><div className="top"><div className="segmented" role="group" aria-label="شیوه برگزاری"><button aria-pressed={mode==='online'} className={mode==='online'?'is-active':''} type="button" onClick={()=>setMode('online')}><IconGlobe size={17}/>{data.modeOnlineLabel||'آنلاین'}</button><button aria-pressed={mode==='inperson'} className={mode==='inperson'?'is-active':''} type="button" onClick={()=>setMode('inperson')}><IconMapPin size={17}/>{data.modeInpersonLabel||'حضوری'}</button></div><span className="note">{data.searchNote||'شیوه‌ی برگزاری'} {mode==='online'?'آنلاین':'حضوری'}</span></div><div className="search-bar">{fields.map((f,i)=><label className="sfield hero-select-field" key={f.key}><span className="sf-label">{data.searchFields?.[i]?.label||f.label}</span><select aria-label={f.label} value={values[f.key]} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}>{[...new Set([values[f.key],...f.values])].map(v=><option key={v} value={v}>{v}</option>)}</select><IconChevronDown size={16} className="chev"/></label>)}<button type="submit" className="btn btn-primary hero-search-btn"><IconSearch size={19}/>{data.searchBtnLabel||'جستجو'}</button></div></form>;
}
