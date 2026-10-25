'use client';
// Adapted from Tailark Mist Call To Action One (MIT, Irung).
import { Link } from '../../../routing/navigation';
import { IconArrowLeft, IconSearch, IconCalendar, IconBook } from '../../icons.jsx';
export default function ActionPanel({title,sub,buttons=[],eyebrow='قدم بعدی، یک انتخاب بهتر',showSteps=true}) {
  return <div className="cta-band nk-action-panel"><div className="nk-action-decoration" aria-hidden="true"/><div className="nk-action-content"><>{eyebrow&&<span className="nk-action-eyebrow">{eyebrow}</span>}</><h2>{title}</h2>{sub&&<p>{sub}</p>}<div className="nk-action-buttons">{buttons.map((b,i)=><Link key={i} to={b.href||'/classes'} className={`btn btn-lg ${b.variant==='orange'?'btn-orange':b.variant==='ghost'?'nk-action-secondary':'btn-primary'}`}>{b.label}{i===0&&<span className="nk-button-arrow"><IconArrowLeft size={20}/></span>}</Link>)}</div>{showSteps&&<div className="nk-action-steps"><span><IconSearch size={18}/>استادت را پیدا کن</span><i/><span><IconCalendar size={18}/>زمانت را انتخاب کن</span><i/><span><IconBook size={18}/>یادگیری را شروع کن</span></div>}</div></div>;
}
