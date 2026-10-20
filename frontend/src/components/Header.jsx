'use client';
import { Link, NavLink, useNavigate } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import { IconSearch, IconUser, IconBench } from './icons.jsx';

export function Brand({ dark = false, compact = false }) {
  return (
    <Link to="/" className="brand">
      <span className="brand-logo">
        <IconBench size={26} />
        <i className="dot" />
      </span>
      <span>
        <span className="brand-name" style={dark ? { color: '#fff' } : undefined}>
          نیمکت
        </span>
        {!compact && (
          <span className="brand-tag" style={{ display: 'block' }}>
            پلتفرم آموزش آنلاین و حضوری
          </span>
        )}
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <div className="container inner">
        <Brand />

        <details className="mobile-nav">
          <summary aria-label="فهرست صفحات">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </summary>
          <nav aria-label="فهرست موبایل" onClick={(e) => { e.currentTarget.closest('details').open = false; }}>
            <Link to="/classes">کلاس‌ها و اساتید</Link>
            <Link to="/club">نیمکت کلاب</Link>
            <Link to={user ? '/panel/chat' : '/login?next=/panel/chat'}>نیم‌چت</Link>
            <Link to="/#parents">ویژه والدین</Link>
            <Link to="/#magazine">مجله نیمکت</Link>
          </nav>
        </details>

        <nav className="main-nav">
          <NavLink to="/classes">کلاس‌ها و اساتید</NavLink>
          <a href="/#group-classes">کلاس‌های گروهی</a>
          <a href={user ? '/panel/chat' : '/login'}>نیم‌چت</a>
          <a href={user ? '/panel/club' : '/login'}>نیمکت کلاب</a>
          <a href="/#parents">ویژه والدین</a>
          <a href="/#magazine">مجله</a>
        </nav>

        <div className="header-actions">
          <button className="btn-icon-round" aria-label="جستجو" onClick={() => navigate('/classes')}>
            <IconSearch size={20} />
          </button>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/editor/home' : user.role === 'teacher' ? '/teacher' : '/panel'} className="btn btn-outline">
                <IconUser size={18} />
                {user.role === 'admin' ? 'ویرایش صفحات' : user.name.split(' ')[0]}
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  if (await logout()) navigate('/');
                }}
              >
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
        </div>
      </div>
    </header>
  );
}
