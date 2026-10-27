'use client';
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import {
  IconBench, IconSearch, IconBell, IconHome, IconBook, IconChat, IconChart,
  IconWallet, IconFile, IconCap, IconCrown, IconHeadset, IconUser, IconLogout,
  IconCalendar, IconChevronDown, IconStar, IconBulb, IconUsers, IconGift, IconCoins,
} from '../components/icons.jsx';

const STUDENT_NAV = [
  {
    group: '',
    items: [
      { to: '/panel', end: true, label: 'خانه', icon: IconHome },
      { to: '/panel/calendar', label: 'کلاس‌های من', icon: IconBook, badge: '۲' },
      { to: '/panel/chat', label: 'نیم‌چت', icon: IconChat, badge: '۵' },
      { to: '/panel/reports', label: 'گزارش تحصیلی', icon: IconChart },
    ],
  },
  {
    group: 'مالی و منابع',
    items: [
      { to: '/panel/finance', label: 'امور مالی', icon: IconWallet },
      { to: '/panel/files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/panel/exams', label: 'آزمون‌ها', icon: IconCap, badge: 'به‌زودی', soft: true },
    ],
  },
  {
    group: 'باشگاه و پشتیبانی',
    items: [
      { to: '/panel/club', label: 'نیمکت کلاب', icon: IconCrown },
      { to: '/contact', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/panel/profile', label: 'پروفایل', icon: IconUser },
    ],
  },
];

const TEACHER_NAV = [
  {
    group: '',
    items: [
      { to: '/teacher', end: true, label: 'خانه', icon: IconHome },
      { to: '/teacher/calendar', label: 'کلاس‌های من', icon: IconBook, badge: '۳' },
      { to: '/teacher/calendar', label: 'تقویم کاری', icon: IconCalendar },
      { to: '/teacher/chat', label: 'نیم‌چت', icon: IconChat, badge: '۱۲' },
    ],
  },
  {
    group: 'مالی و کیفیت',
    items: [
      { to: '/teacher/finance', label: 'امور مالی', icon: IconWallet },
      { to: '/teacher/files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/teacher#reviews', label: 'امتیاز و نظرات', icon: IconStar },
      { to: '/teacher#tip', label: 'نیم‌پند', icon: IconBulb },
    ],
  },
  {
    group: 'باشگاه و پشتیبانی',
    items: [
      { to: '/teacher/club', label: 'نیمکت کلاب', icon: IconCrown },
      { to: '/contact', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/teacher/application', label: 'پروفایل و رزومه', icon: IconUser },
    ],
  },
];

const PARENT_NAV = [
  {
    group: 'اطلاعات مجاز خانواده',
    items: [
      { to: '/parent', end: true, label: 'خانه و دسترسی‌ها', icon: IconHome },
      { to: '/parent/files', label: 'فایل‌های مجاز', icon: IconFile },
      { to: '/parent-guide', label: 'راهنمای والدین', icon: IconBook },
      { to: '/contact', label: 'پشتیبانی', icon: IconHeadset },
    ],
  },
];

const ADMIN_NAV = [
  {
    group: 'مدیریت کل',
    items: [
      { to: '/admin/analytics', label: 'شاخص‌های واقعی', icon: IconChart },
      { to: '/admin/integrations', label: 'اتصال‌ها و درگاه‌ها', icon: IconCrown },
      { to: '/admin/blog', label: 'مجله و سئو', icon: IconBook },
      { to: '/admin/support', label: 'پشتیبانی و دانش', icon: IconHeadset },
      { to: '/admin/chat', label: 'نظارت نیم‌چت', icon: IconChat },
      { to: '/admin/teaching', label: 'اساتید و برنامه', icon: IconCalendar },
      { to: '/admin/reviews', label: 'رضایت‌های استاد', icon: IconStar },
      { to: '/admin/finance', label: 'بازپرداخت‌ها', icon: IconWallet },
      { to: '/admin/earnings', label: 'تسویه و برداشت اساتید', icon: IconWallet },
      { to: '/admin/shop', label: 'فروشگاه و مرجوعی', icon: IconGift },
      { to: '/admin/club', label: 'نیمکت کلاب', icon: IconCoins },
      { to: '/editor/home', label: 'ویرایشگر صفحات', icon: IconFile },
    ],
  },
];

const TITLES = {
  '/panel': 'داشبورد',
  '/panel/calendar': 'کلاس‌های من',
  '/panel/chat': 'نیم‌چت · گفتگوها',
  '/panel/reports': 'گزارش تحصیلی',
  '/panel/finance': 'امور مالی',
  '/panel/files': 'فایل‌ها و منابع',
  '/panel/exams': 'آزمون‌ها',
  '/panel/club': 'نیمکت کلاب',
  '/panel/notifications': 'اعلان‌ها',
  '/panel/support': 'پشتیبانی',
  '/panel/profile': 'پروفایل',
  '/teacher': 'داشبورد استاد',
  '/teacher/classes': 'کلاس‌های من',
  '/teacher/calendar': 'تقویم کاری',
  '/teacher/chat': 'نیم‌چت · گفتگوها',
  '/teacher/finance': 'امور مالی',
  '/teacher/earnings': 'درآمد و برداشت',
  '/teacher/files': 'فایل‌ها و منابع',
  '/teacher/reviews': 'امتیاز و نظرات',
  '/teacher/club': 'نیمکت کلاب',
  '/teacher/support': 'پشتیبانی',
  '/teacher/teaching': 'پروفایل و رزومه',
  '/teacher/application': 'پرونده مدرس',
};

export default function PanelLayout({ role: propRole = '', variant = '', children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState(null);

  const effectiveRole = propRole || variant;
  const isAdmin = effectiveRole === 'admin' || pathname.startsWith('/admin');
  const isParent = effectiveRole === 'parent' || pathname.startsWith('/parent');
  const isTeacher = !isAdmin && !isParent && (effectiveRole ? effectiveRole === 'teacher' : pathname.startsWith('/teacher'));
  const nav = isAdmin ? ADMIN_NAV : isParent ? PARENT_NAV : isTeacher ? TEACHER_NAV : STUDENT_NAV;
  const roleLabel = isAdmin ? 'مدیریت کل' : isParent ? 'پنل والد' : isTeacher ? 'پنل استاد' : 'پنل شاگرد';

  useEffect(() => {
    if (!user || isAdmin || isParent) return;
    let alive = true;
    api('/panel/overview')
      .then((d) => {
        if (alive) setSummary(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, isAdmin, isParent, pathname]);

  const defaultProfile = isAdmin
    ? { name: 'مدیر نیمکت', sub: 'مدیریت کل سامانه', letter: 'م' }
    : isParent
      ? { name: 'والد نیمکت', sub: 'همراه خانواده', letter: 'و' }
      : isTeacher
        ? { name: 'سارا محمدی', sub: 'دبیر فیزیک · متخصص', letter: 'س' }
        : { name: 'علی رضایی', sub: 'پایه یازدهم · ریاضی', letter: 'ع' };

  const profile = user
    ? {
        name: user.name || defaultProfile.name,
        sub: summary?.user?.subtitle || user.subtitle || defaultProfile.sub,
        letter: user.letter || user.name?.[0] || defaultProfile.letter,
      }
    : defaultProfile;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/classes?q=${encodeURIComponent(q)}` : '/classes');
  };

  const notifLink = isAdmin
    ? '/admin/club'
    : isTeacher
      ? '/teacher/club?section=notifications'
      : isParent
        ? '/parent'
        : '/panel/notifications';

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
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>پلتفرم آموزش آنلاین و حضوری</span>
            </span>
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ textAlign: 'right', paddingRight: 12 }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{roleLabel} · مای نیمکت</div>
              <b style={{ fontSize: 15 }}>{TITLES[pathname] || 'مای نیمکت'}</b>
            </div>
          </div>

          <form className="panel-search" onSubmit={handleSearchSubmit} role="search" aria-label="جستجوی کلاس در پنل">
            <IconSearch size={17} style={{ color: 'var(--n500)' }} />
            <input
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="جستجوی کلاس"
              placeholder="جستجو در کلاس‌ها، فایل‌ها و پیام‌ها"
            />
          </form>

          {!isAdmin && !isParent && (
            <Link
              to={isTeacher ? '/teacher/finance' : '/panel/finance'}
              className="nk-header-wallet-btn"
              aria-label="کیف پول و امور مالی"
              title="مشاهده کیف پول، افزایش موجودی و تراکنش‌ها"
            >
              <IconWallet size={17} />
              <span className="nk-header-wallet-label">کیف پول:</span>
              <strong className="nk-header-wallet-val num">
                {typeof summary?.wallet === 'number' ? `${faPrice(summary.wallet)} تومان` : 'مشاهده'}
              </strong>
            </Link>
          )}

          <Link className="btn-icon-round" to={notifLink} aria-label="اعلان‌ها" style={{ position: 'relative' }}>
            <IconBell size={19} />
            {summary?.stats?.unreadNotifications > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  background: 'var(--error)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  minWidth: 18,
                  height: 18,
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 4px',
                }}
              >
                {faNum(summary.stats.unreadNotifications)}
              </span>
            )}
          </Link>
          <Link to="/" className="btn btn-outline">
            <IconHome size={17} /> صفحه اصلی سایت
          </Link>
        </div>
      </div>

      <div className="container panel-body">
        {/* sidebar (right) */}
        <aside className="panel-side">
          <button
            type="button"
            className="panel-mobile-toggle btn btn-outline"
            aria-expanded={navOpen}
            aria-controls="panel-navigation"
            onClick={() => setNavOpen((v) => !v)}
          >
            فهرست پنل <IconChevronDown size={20} />
          </button>
          <div id="panel-navigation" className={`panel-navigation ${navOpen ? 'is-open' : ''}`}>
            <div className="side-user">
              <div
                className={`avatar sq-40 ${isTeacher ? '' : 'tint-green'}`}
                style={isTeacher ? {} : { background: 'var(--secondary-50)', color: 'var(--primary)' }}
              >
                {profile.letter}
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{profile.name}</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{profile.sub}</div>
              </div>
              <IconChevronDown size={16} style={{ color: 'var(--n500)' }} />
            </div>

            {nav.map((g, gi) => (
              <div key={gi} style={{ marginTop: g.group ? 10 : 0 }}>
                {g.group && <div className="side-group">{g.group}</div>}
                {g.items.map((it) => (
                  <NavLink
                    onClick={() => setNavOpen(false)}
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

            <button
              type="button"
              className="side-link"
              style={{ marginTop: 12, color: 'var(--error)' }}
              onClick={async () => {
                if (await logout()) navigate('/');
              }}
            >
              <IconLogout size={19} /> خروج از حساب
            </button>
          </div>
        </aside>

        {/* content (left) */}
        <main style={{ minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
