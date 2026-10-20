'use client';
import { Link, useNavigate,useLocation } from '../routing/navigation';
import { useEffect, useState } from 'react';
import { DesktopNavigation, MobileNavigation } from './ui/twenty-first/navigation.jsx';
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
  const {pathname}=useLocation();
  const editSlug=pathname==='/'?'home':pathname==='/classes'?'classes':/^\/teachers\/\d+$/.test(pathname)?'teacher-'+pathname.split('/').at(-1):/^\/classes\/\d+$/.test(pathname)?'class-'+pathname.split('/').at(-1):pathname==='/blog'?'blog':pathname.startsWith('/blog/')?'article-layout':pathname==='/club'?'club':pathname.startsWith('/p/')?pathname.split('/').at(-1):'home';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className="site-header nk-header" data-scrolled={scrolled}>
      <div className="container inner">
        <Brand />

        <DesktopNavigation user={user} />

        <div className="header-actions">
          <button className="btn-icon-round nk-header-search" aria-label="جستجو" onClick={() => navigate('/classes')}>
            <IconSearch size={20} />
          </button>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? `/editor/${editSlug}` : user.role === 'teacher' ? '/teacher' : user.role==='parent'?'/parent':'/panel'} className="btn btn-outline">
                <IconUser size={18} />
                {user.role === 'admin' ? 'ویرایش همین صفحه' : user.name.split(' ')[0]}
              </Link>
              <button
                className="btn btn-ghost btn-sm nk-header-logout"
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
          <Link to="/login?mode=teacher" className="btn btn-primary nk-teacher-link">
            استاد شوید
          </Link>
        </div>
        <MobileNavigation user={user} onLogout={logout} />
      </div>
    </header>
  );
}
