'use client';
import {useState} from 'react';
import { NavLink, Link, useLocation } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import {
  IconBench, IconSearch, IconBell, IconHome, IconBook, IconChat, IconChart,
  IconWallet, IconFile, IconCap, IconCrown, IconHeadset, IconUser, IconLogout,
  IconCalendar, IconChevronDown, IconStar, IconBulb,
} from '../components/icons.jsx';

const STUDENT_NAV = [
  {
    group: '',
    items: [
      { to: '/panel', end: true, label: 'خانه', icon: IconHome },
      { to: '/panel/calendar', label: 'کلاس‌های من', icon: IconBook },
      { to: '/panel/chat', label: 'نیم‌چت', icon: IconChat },
      { to: '/panel#report', label: 'گزارش تحصیلی', icon: IconChart },
    ],
  },
  {
    group: 'مالی و منابع',
    items: [
      {to:'/panel/friendly',label:'گروه دوستانه',icon:IconUser},
      {to:'/panel/shop',label:'فروشگاه',icon:IconBook},
      {to:'/panel/earnings',label:'درآمد و همکاری',icon:IconWallet},
      { to: '/panel/finance', label: 'امور مالی', icon: IconWallet },
      { to: '/panel/files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/panel#report', label: 'آزمون‌ها', icon: IconCap, badge: 'به‌زودی', soft: true },
    ],
  },
  {
    group: 'باشگاه و پشتیبانی',
    items: [
      { to: '/panel/club', label: 'نیمکت کلاب', icon: IconCrown },
      { to: '#support', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/panel/reviews', label: 'انتشار بازخورد من', icon: IconStar },
      { to: '/panel/family', label: 'دسترسی خانواده', icon: IconUser },
      { to: '/panel/club?section=reports', label: 'پروفایل', icon: IconUser },
    ],
  },
];

const TEACHER_NAV = [
  {
    group: '',
    items: [
      { to: '/teacher', end: true, label: 'خانه', icon: IconHome },
      { to: '/teacher/calendar', label: 'کلاس‌های من', icon: IconBook },
      { to: '/teacher/calendar', label: 'تقویم کاری', icon: IconCalendar },
      { to: '/teacher/chat', label: 'نیم‌چت', icon: IconChat },
    ],
  },
  {
    group: 'مالی و کیفیت',
    items: [
      {to:'/teacher/earnings',label:'درآمد و برداشت',icon:IconWallet},
      { to: '/teacher/finance', label: 'امور مالی', icon: IconWallet },
      { to: '/teacher/files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/teacher#reviews', label: 'امتیاز و نظرات', icon: IconStar },
      { to: '/teacher#reviews', label: 'نیم‌پند', icon: IconBulb },
    ],
  },
  {
    group: 'باشگاه و پشتیبانی',
    items: [
      { to: '/teacher/club', label: 'نیمکت کلاب', icon: IconCrown },
      { to: '#support', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/teacher/application', label: 'پرونده و تأیید مدرس', icon: IconUser },
    ],
  },
];

const PARENT_NAV=[{group:'اطلاعات مجاز خانواده',items:[{to:'/parent',end:true,label:'خانه و دسترسی‌ها',icon:IconHome},{to:'/parent/files',label:'فایل‌های مجاز',icon:IconFile},{to:'#support',label:'پشتیبانی',icon:IconHeadset}]}];

const TITLES = {
  '/panel': 'داشبورد',
  '/panel/finance': 'امور مالی',
  '/teacher/finance': 'امور مالی',
  '/panel/calendar': 'تقویم و کلاس‌ها',
  '/teacher/calendar': 'تقویم و کلاس‌ها',
  '/panel/chat': 'نیم‌چت · گفتگوها',
  '/panel/club': 'نیمکت کلاب',
  '/teacher': 'داشبورد استاد',
  '/teacher/chat': 'نیم‌چت · گفتگوها',
  '/teacher/club': 'نیمکت کلاب',
};

export default function PanelLayout({ variant, children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [navOpen,setNavOpen]=useState(false);
  const nav = variant === 'parent' ? PARENT_NAV : variant === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const roleLabel = variant === 'parent' ? 'پنل والد' : variant === 'teacher' ? 'پنل استاد' : 'پنل شاگرد';

  return (
    <div className="panel-page">
      {/* top bar */}
      <div className="panel-top">
        <div className="container inner">
          <Link to="/" className="brand">
            <span className="brand-logo" style={{ width: 42, height: 42, borderRadius: 12 }}>
              <IconBench size={22} />
              <i className="dot" />
            </span>
            <span>
              <span style={{ fontSize: 16, fontWeight: 900, display: 'block', lineHeight: 1.4 }}>
                نیمکت
              </span>
              <span style={{ fontSize: 12, color: 'var(--n700)' }}>پلتفرم آموزش آنلاین و حضوری</span>
            </span>
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--n700)' }}>{roleLabel} · مای نیمکت</div>
              <b style={{ fontSize: 15 }}>{TITLES[pathname] || 'مای نیمکت'}</b>
            </div>
          </div>

          <form className="panel-search" action="/classes" role="search" aria-label="جستجوی کلاس در پنل">
            <IconSearch size={17} style={{ color: 'var(--n500)' }} />
            <input name="q" aria-label="جستجوی کلاس" placeholder="جستجوی کلاس و استاد" />
          </form>

          {variant!=='parent'&&<Link className="btn-icon-round" to={`${variant==='teacher'?'/teacher':'/panel'}/club?section=notifications`} aria-label="اعلان‌های کلاب"><IconBell size={19}/></Link>}
          <Link to="/" className="btn btn-outline">
            <IconHome size={17} /> صفحه اصلی سایت
          </Link>
        </div>
      </div>

      <div className="container panel-body">
        {/* sidebar (right) */}
        <aside className="panel-side">
          <button type="button" className="panel-mobile-toggle btn btn-outline" aria-expanded={navOpen} aria-controls="panel-navigation" onClick={()=>setNavOpen(v=>!v)}>فهرست پنل <IconChevronDown size={20}/></button>
          <div id="panel-navigation" className={`panel-navigation ${navOpen?'is-open':''}`}>
          <div className="side-user">
            <div className={`avatar sq-40 ${variant === 'teacher' ? '' : 'tint-green'}`} style={variant === 'teacher' ? {} : { background: 'var(--secondary-50)', color: 'var(--primary)' }}>
              {user?.letter || 'ع'}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 14 }}>{user?.name || 'کاربر نیمکت'}</b>
              <div style={{ fontSize: 12, color: 'var(--n700)' }}>
                {user?.subtitle || 'پروفایل تکمیل نشده'}
              </div>
            </div>
            <IconChevronDown size={16} style={{ color: 'var(--n500)' }} />
          </div>

          {nav.map((g, gi) => (
            <div key={gi} style={{ marginTop: g.group ? 10 : 0 }}>
              {g.group && <div className="side-group">{g.group}</div>}
              {g.items.map((it) => (
                <NavLink
                  onClick={(e) => { setNavOpen(false); if (it.to === '#support') { e.preventDefault(); window.dispatchEvent(new Event('nimkat:open-support')); } }}
                  key={it.label}
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `side-link ${isActive && !it.to.includes('#') ? 'is-active' : ''}`
                  }
                >
                  <it.icon size={19} />
                  <span>{it.label}</span>
                  <span className="end">
                    {it.badge && <span className={`side-badge ${it.soft ? 'soft' : ''}`}>{it.badge}</span>}
                  </span>
                </NavLink>
              ))}
            </div>
          ))}

          <button type="button" className="side-link" style={{ marginTop: 12, color: 'var(--error)' }} onClick={() => logout()}>
            <IconLogout size={19} /> خروج از حساب
          </button>
          <button type="button" className="side-link" style={{ color: 'var(--n700)', fontSize: 12 }} onClick={() => logout(true)}>
            <IconLogout size={17} /> خروج از همه دستگاه‌ها
          </button>
          </div>
        </aside>

        {/* content (left) */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
