import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  IconBench, IconSearch, IconUsers, IconCoin, IconBook, IconHeadset, IconUser,
  IconStar, IconBulb, IconChatPlaceholder, IconWallet, IconFile, IconCap2,
  IconClub, IconExit, IconCalendar, IconHome, IconBell,
} from '../panelIcons.jsx';

const STUDENT_NAV = [
  { group: '', items: [
    { to: '/panel', end: true, label: 'خانه', icon: IconHome },
    { to: '/panel#upcoming', label: 'کلاس‌های من', icon: IconBook, badge: '۲' },
    { to: '/panel/chat', label: 'نیم‌چت', icon: IconChatPlaceholder, badge: '۵' },
    { to: '/panel#report', label: 'گزارش تحصیلی', icon: IconStar },
  ]},
  { group: 'مالی و منابع', items: [
    { to: '/panel#wallet', label: 'امور مالی', icon: IconWallet },
    { to: '/panel#files', label: 'فایل‌ها و منابع', icon: IconFile },
    { to: '/panel#report', label: 'آزمون‌ها', icon: IconCap2, badge: 'به‌زودی', soft: true },
  ]},
  { group: 'باشگاه و پشتیبانی', items: [
    { to: '/panel/club', label: 'نیمکت کلاب', icon: IconClub },
    { to: '/panel#report', label: 'پشتیبانی', icon: IconHeadset },
    { to: '/panel#report', label: 'پروفایل', icon: IconUser },
  ]},
];

const TEACHER_NAV = [
  { group: '', items: [
    { to: '/teacher', end: true, label: 'خانه', icon: IconHome },
    { to: '/teacher#today', label: 'کلاس‌های من', icon: IconBook },
    { to: '/teacher#today', label: 'تقویم کاری', icon: IconCalendar },
    { to: '/teacher/chat', label: 'نیم‌چت', icon: IconChatPlaceholder, badge: '۳' },
  ]},
  { group: 'مالی و کیفیت', items: [
    { to: '/teacher#settlements', label: 'امور مالی', icon: IconWallet },
    { to: '/teacher#reviews', label: 'فایل‌ها و منابع', icon: IconFile },
    { to: '/teacher#reviews', label: 'امتیاز و نظرات', icon: IconStar, badge: '۱' },
    { to: '/teacher#tip', label: 'نیم‌پند', icon: IconBulb },
  ]},
  { group: 'باشگاه و پشتیبانی', items: [
    { to: '/teacher/club', label: 'نیمکت کلاب', icon: IconClub },
    { to: '/teacher#reviews', label: 'پشتیبانی', icon: IconHeadset },
    { to: '/teacher#tip', label: 'پروفایل و رزومه', icon: IconUser },
  ]},
];

const TITLES = {
  '/panel': 'داشبورد',
  '/panel/chat': 'نیم‌چت · گفتگوها',
  '/panel/club': 'نیمکت کلاب',
  '/teacher': 'داشبورد استاد',
  '/teacher/chat': 'نیم‌چت · گفتگوها',
  '/teacher/club': 'نیمکت کلاب',
};

export default function PanelLayout({ variant }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const nav = variant === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const base = variant === 'teacher' ? '/teacher' : '/panel';
  const title = TITLES[pathname] || (variant === 'teacher' ? 'داشبورد استاد' : 'داشبورد');

  return (
    <div className="panel-shell">
      <aside className="panel-side">
        <Link to="/" className="brand">
          <span className="brand-logo"><IconBench size={24} /></span>
          <span>
            <span className="brand-name">نیمکت</span>
            <br />
            <span className="brand-tag">پلتفرم آموزش آنلاین و حضوری</span>
          </span>
        </Link>

        <div className="panel-user">
          <span className={`test-avatar ${variant === 'teacher' ? 'green' : 'mint'}`}>{user?.letter || 'ک'}</span>
          <span className="pu-body">
            <b>{user?.name}</b>
            <span>{user?.subtitle}</span>
          </span>
          <span className="pu-chev">⌄</span>
        </div>

        <nav className="panel-nav">
          {nav.map((g, i) => (
            <div className="panel-group" key={i}>
              {g.group && <span className="panel-group-label">{g.group}</span>}
              {g.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive && !item.to.includes('#') ? 'active' : '')}
                >
                  <item.icon size={18} />
                  <span className="pn-label">{item.label}</span>
                  {item.badge && <span className={`pn-badge${item.soft ? ' soft' : ''}`}>{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <button className="panel-exit" onClick={logout}>
            <IconExit size={18} />
            خروج از حساب
          </button>
        </nav>
      </aside>

      <div className="panel-main">
        <header className="panel-top">
          <div>
            <span className="panel-crumb">پنل {variant === 'teacher' ? 'استاد' : 'شاگرد'} · مای نیمکت</span>
            <h1>{title}</h1>
          </div>
          <div className="panel-top-actions">
            <span className="panel-search">
              <IconSearch size={16} />
              <input placeholder="جستجو در کلاس‌ها، فایل‌ها و پیام‌ها" />
            </span>
            <button className="icon-btn" aria-label="اعلان‌ها">
              <IconBell size={18} />
            </button>
            <Link to="/" className="btn btn-outline">
              <IconHome size={16} />
              صفحه اصلی سایت
            </Link>
            {variant === 'student' ? (
              <Link to="/classes" className="btn btn-primary">+ رزرو کلاس جدید</Link>
            ) : (
              <Link to="/teacher#newcourse" className="btn btn-primary">+ درخواست دورهٔ جدید</Link>
            )}
          </div>
        </header>
        <div className="panel-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
