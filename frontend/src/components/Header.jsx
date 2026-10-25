'use client';
import { NavLink, Link, useNavigate } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import { IconBench, IconSearch, IconUser } from './icons.jsx';
import { MobileNavigation } from './ui/twenty-first/navigation.jsx';

export function Brand({ dark = false }) {
  return (
    <Link to="/" className="brand">
      <span className="brand-logo">
        <IconBench size={26} />
        <i className="dot" />
      </span>
      <span>
        <span className="brand-name" style={dark ? { color: '#fff' } : {}}>
          نیمکت
        </span>
        <span className="brand-tag" style={{ display: 'block' }}>
          پلتفرم آموزش آنلاین و حضوری
        </span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const panelPath =
    user?.role === 'teacher'
      ? '/teacher'
      : user?.role === 'admin'
        ? '/admin/analytics'
        : user?.role === 'parent'
          ? '/parent'
          : '/panel';

  const chatPath = user
    ? user.role === 'teacher'
      ? '/teacher/chat'
      : '/panel/chat'
    : '/login?next=/panel/chat';

  return (
    <header className="site-header">
      <div className="container inner">
        <Brand />

        <nav className="main-nav" aria-label="منوی اصلی">
          <NavLink to="/classes" className={({ isActive }) => (isActive ? 'active' : '')}>
            کلاس‌ها و اساتید
          </NavLink>
          <Link to="/classes?kind=گروهی">کلاس‌های گروهی</Link>
          <Link to={chatPath}>نیم‌چت</Link>
          <NavLink to="/club" className={({ isActive }) => (isActive ? 'active' : '')}>
            نیمکت کلاب
          </NavLink>
          <NavLink to="/parent-guide" className={({ isActive }) => (isActive ? 'active' : '')}>
            ویژه والدین
          </NavLink>
          <NavLink to="/blog" className={({ isActive }) => (isActive ? 'active' : '')}>
            مجله
          </NavLink>
        </nav>

        <div className="header-actions">
          <button
            className="btn-icon-round"
            type="button"
            aria-label="جستجو"
            onClick={() => navigate('/classes')}
          >
            <IconSearch size={20} />
          </button>
          {user ? (
            <>
              <Link to={panelPath} className="btn btn-outline">
                <IconUser size={18} />
                {user.name || 'پنل من'}
              </Link>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => logout()}>
                خروج
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline">
              <IconUser size={18} />
              ورود / ثبت‌نام
            </Link>
          )}
          <Link to="/login?mode=teacher" className="btn btn-primary">
            استاد شوید
          </Link>
          <MobileNavigation user={user} logout={logout} />
        </div>
      </div>
    </header>
  );
}
