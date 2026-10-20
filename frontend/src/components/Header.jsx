import { Link, NavLink, useNavigate } from 'react-router-dom';
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
              <Link to={user.role === 'teacher' ? '/teacher' : '/panel'} className="btn btn-outline">
                <IconUser size={18} />
                {user.name.split(' ')[0]}
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  logout();
                  navigate('/');
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
