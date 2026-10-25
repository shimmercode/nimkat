'use client';
import { Link } from '../routing/navigation';
import { Brand } from './Header.jsx';
import FooterGrid from './ui/twenty-first/footer-grid.jsx';
import { IconArrowLeft, IconHeadset, IconBook, IconArrowRight } from './icons.jsx';

const support=()=>window.dispatchEvent(new Event('nimkat:open-support'));
const groups=[
  {title:'برای یادگرفتن',items:['ابتدایی','متوسطه اول','متوسطه دوم','کنکور'].map(title=>({title,href:`/classes?grade=${encodeURIComponent(title)}`}))},
  {title:'دنیای نیمکت',items:[{title:'کلاس‌ها و اساتید',href:'/classes'},{title:'نیمکت کلاب',href:'/club'},{title:'مجله نیمکت',href:'/blog'},{title:'استاد شوید',href:'/login?mode=teacher'}]},
  {title:'کنارت هستیم',items:[{title:'گفتگو با پشتیبانی',onClick:support},{title:'سؤالات متداول',href:'/#faq'},{title:'درخواست تماس',href:'/#callback'},{title:'راهنمای والدین',href:'/#parents'}]},
];
export default function Footer() {
  return <footer className="site-footer nk-footer"><div className="container">
    <div className="nk-footer-top"><div><span className="nk-overline">یک انتخاب خوب، یک شروع تازه</span><h2>برای قدم بعدی،<br/>روی نیمکت حساب کن.</h2></div><Link to="/classes" className="nk-footer-discover"><span>کلاس مناسبم را پیدا کنم</span><span className="nk-footer-arrow"><IconArrowLeft size={24}/></span></Link></div>
    <FooterGrid groups={groups}><div className="nk-footer-brand"><Brand dark/><p>هر هدفی یک نقطهٔ شروع دارد. نیمکت، جایی برای پیدا کردن استاد مناسب و ساختن مسیر یادگیری توست؛ آنلاین یا حضوری.</p><div className="nk-footer-chips"><button onClick={support}><IconHeadset size={18}/>پشتیبانی نیمکت</button><Link to="/blog"><IconBook size={18}/>راهنمای یادگیری</Link></div></div></FooterGrid>
    <div className="nk-footer-bottom"><span>© ۱۴۰۵ نیمکت · یادگیری، نزدیک‌تر از همیشه.</span><nav aria-label="منابع سایت"><a href="/rss.xml">RSS مجله</a><a href="/sitemap.xml">نقشهٔ سایت</a><button onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>بازگشت به بالا <IconArrowRight size={16}/></button></nav></div>
    <div className="nk-footer-wordmark" aria-hidden="true">نیمکت<span>جای تو برای رشد.</span></div>
  </div></footer>;
}
