'use client';
// Adapted from Tailark HeroHeader (MIT, Irung). See upstream/ and SOURCES.md.
import { useEffect, useState } from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { Link, NavLink, useLocation } from '../../../routing/navigation';
import { IconArrowLeft, IconBook, IconUsers, IconGlobe, IconMapPin, IconChevronDown, IconX, IconBench } from '../../icons.jsx';

const courses = [
  { title: 'کلاس خصوصی', text: 'یادگیری با ریتم خودت', href: '/classes?kind=خصوصی', icon: IconBook },
  { title: 'کلاس گروهی', text: 'کنار هم، یک قدم جلوتر', href: '/classes?kind=گروهی', icon: IconUsers },
  { title: 'کلاس آنلاین', text: 'از هر جا که هستی', href: '/classes?mode=آنلاین', icon: IconGlobe },
  { title: 'کلاس حضوری', text: 'نزدیک به خانه و مدرسه', href: '/classes?mode=حضوری', icon: IconMapPin },
];
const NavigationLink = ({to,...props}) => to.includes('#') ? <Link to={to} {...props}/> : <NavLink to={to} {...props}/>;
const links = [{ title:'نیمکت کلاب', href:'/club' }, { title:'ویژه والدین', href:'/#parents' }, { title:'مجله نیمکت', href:'/blog' }];

export function DesktopNavigation({user}) {
  const desktopLinks=[...links.slice(0,1),{title:'نیم‌چت',href:user?'/panel/chat':'/login?next=/panel/chat'},...links.slice(1)];
  return <NavigationMenu.Root dir="rtl" className="main-nav nk-navigation" aria-label="منوی اصلی" delayDuration={100}>
    <NavigationMenu.List className="nk-nav-list">
      <NavigationMenu.Item>
        <NavigationMenu.Trigger className="nk-nav-trigger">کلاس‌ها و اساتید <IconChevronDown size={16}/></NavigationMenu.Trigger>
        <NavigationMenu.Content className="nk-mega-menu">
          <NavigationMenu.Link asChild><Link to="/classes" className="nk-menu-feature"><span className="nk-menu-symbol"><IconBench size={32}/></span><span className="nk-overline">از انتخاب تا یادگیری</span><strong>استاد مناسب تو،<br/>همین‌جاست.</strong><span>زمان‌ها و کلاس‌ها را ببین و آگاهانه انتخاب کن.</span><b>دیدن همهٔ کلاس‌ها <IconArrowLeft size={18}/></b></Link></NavigationMenu.Link>
          <div className="nk-menu-courses">{courses.map(({title,text,href,icon:Icon})=><NavigationMenu.Link asChild key={href}><Link to={href} className="nk-menu-course"><span><Icon size={22}/></span><div><b>{title}</b><small>{text}</small></div></Link></NavigationMenu.Link>)}</div>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      {desktopLinks.map(l=><NavigationMenu.Item key={l.href}><NavigationMenu.Link asChild><NavigationLink to={l.href}>{l.title}</NavigationLink></NavigationMenu.Link></NavigationMenu.Item>)}
    </NavigationMenu.List>
  </NavigationMenu.Root>;
}

export function MobileNavigation({ user, onLogout }) {
  const [open,setOpen]=useState(false),{pathname}=useLocation();
  useEffect(()=>setOpen(false),[pathname]);
  useEffect(()=>{
    const media=window.matchMedia('(min-width: 1101px)');
    const close=()=>{if(media.matches)setOpen(false);};
    media.addEventListener('change',close);
    return()=>media.removeEventListener('change',close);
  },[]);
  const panel=user?.role==='admin'?'/admin/integrations':user?.role==='teacher'?'/teacher':user?.role==='parent'?'/parent':'/panel';
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger className="nk-mobile-trigger" aria-label="فهرست صفحات"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M8 12h12M4 17h16"/></svg></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="nk-menu-overlay"/><Dialog.Content className="nk-menu-sheet" dir="rtl"><div className="nk-sheet-heading"><div><Dialog.Title>روی نیمکت، جا داری.</Dialog.Title><Dialog.Description>مسیر یادگیری‌ات را از اینجا شروع کن.</Dialog.Description></div><Dialog.Close className="nk-icon-button" aria-label="بستن فهرست"><IconX size={24}/></Dialog.Close></div>
    <nav className="nk-sheet-links" aria-label="فهرست موبایل"><span className="nk-overline">کشف کلاس‌ها</span>{courses.map(({title,href,icon:Icon})=><Dialog.Close asChild key={href}><Link to={href}><span><Icon size={20}/>{title}</span><IconArrowLeft size={18}/></Link></Dialog.Close>)}<span className="nk-sheet-divider"/>{[...links,{title:'نیم‌چت',href:user?'/panel/chat':'/login?next=/panel/chat'}].map(l=><Dialog.Close asChild key={l.href}><NavigationLink to={l.href}>{l.title}<IconArrowLeft size={18}/></NavigationLink></Dialog.Close>)}</nav>
    <div className="nk-sheet-bottom"><Dialog.Close asChild><Link to={user?panel:'/login'} className="btn btn-primary btn-block">{user?'رفتن به حساب من':'ورود / ثبت‌نام'}</Link></Dialog.Close><Dialog.Close asChild><Link to="/login?mode=teacher" className="btn btn-outline btn-block">می‌خواهی استاد نیمکت باشی؟</Link></Dialog.Close>{user&&<button className="nk-text-button" onClick={async()=>{if(await onLogout())setOpen(false);}}>خروج از حساب</button>}</div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
