import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  IconBench, IconSearch, IconUsers, IconCoin, IconBook, IconHeadset, IconUser,
  IconStar, IconBulb,
} from '../components/icons.jsx';
import {
  IconHome, IconChatPlaceholder, IconWallet, IconFile, IconCap2, IconClub,
  IconExit, IconCalendar,
} from '../panelIcons.jsx';

const STUDENT_NAV = [
  { to: '/panel', end: true, label: 'خانه', icon: IconHome },
  { to: '/panel#upcoming', label: 'کلاس‌های من', icon: IconBook },
  { to: '/panel/chat', label: 'نیم‌چت', icon: IconChatPlaceholder },
  { to: '/panel#report', label: 'گزارش تحصیلی', icon: IconStar },
  { to: '/panel#wallet', label: 'امور مالی', icon: IconWallet },
  { to: '/panel#files', label: 'فایل‌ها و منابع', icon: IconFile },
  { to: '/panel#report', label: 'آزمون‌ها', icon: IconCap2 },
  { to: '/panel/club', label: 'نیمکت کلاب', icon: IconClub },
  { to: '/panel#report', label: 'پشتیبانی', icon: IconHeadset },
  { to: '/panel#report', label: 'پروفایل', icon: IconUser },
];

const TEACHER_NAV = [
  { to: '/teacher', end: true, label: 'خانه', icon: IconHome },
  { to: '/teacher#today', label: 'کلاس‌های من', icon: IconBook },
  { to: '/teacher#today', label: 'تقویم کاری', icon: IconCalendar },
  { to: '/teacher/chat', label: 'نیم‌چت', icon: IconChatPlaceholder },
  { to: '/teacher#settlements', label: 'امور مالی', icon: IconWallet },
  { to: '/teacher#reviews', label: 'امتیاز و نظرات', icon: IconStar },
  { to: '/teacher#tip', label: 'نیم‌پند', icon: IconBulb },
  { to: '/teacher/club', label: 'نیمکت کلاب', icon: IconClub },
  { to: '/teacher#reviews', label: 'پشتیبانی', icon: IconHeadset },
  { to: '/teacher#tip', label: 'پروفایل و رزومه', icon: IconUser },
];

export default function PanelLayout({ variant }) {
  const { user, logout } = useAuth();
  const nav = variant === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const base = variant === 'teacher' ? '/teacher' : '/panel';

  return (
    <div className="panel-shell">
      <aside className="panel-side">
        <Link to="/" className="brand" style={{ padding: '6px 0' }}>
          <span className="brand-logo">
            <IconBench size={24} />
          </span>
          <span>
            <span className="brand-name">نیمکت</span>
            <br />
            <span className="brand-tag">پلتفرم آموزش آنلاین و حضوری</span>
          </span>
        </Link>

        <div className="panel-user">
          <span className={`test-avatar ${variant === 'teacher' ? 'green' : 'mint'}`}>
            {user?.letter || 'ک'}
          </span>
          <span>
            <b>{user?.name}</b>
            <span>{user?.subtitle}</span>
          </span>
        </div>

        <nav className="panel-nav">
          {nav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive && !item.to.includes('#') ? 'active' : '')}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
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
            <h1>{variant === 'teacher' ? 'پنل استاد · مای نیمکت' : 'پنل شاگرد · مای نیمکت'}</h1>
            <span className="panel-crumb">
              {variant === 'teacher' ? 'داشبورد استاد' : 'داشبورد'}
            </span>
          </div>
          <div className="panel-top-actions">
            <span className="panel-search">
              <IconSearch size={16} />
              <input placeholder="جستجو در کلاس‌ها، فایل‌ها و پیام‌ها" />
            </span>
            <Link to="/" className="link-green">صفحه اصلی سایت</Link>
            <Link to={base === '/panel' ? '/classes' : '/teacher#newcourse'} className="btn btn-primary">
              {variant === 'teacher' ? 'درخواست دورهٔ جدید' : 'رزرو کلاس جدید'}
            </Link>
          </div>
        </header>
        <div className="panel-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
