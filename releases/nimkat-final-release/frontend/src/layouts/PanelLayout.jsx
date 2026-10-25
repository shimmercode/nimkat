'use client';
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';
import {
  IconBench, IconHome, IconBook, IconChat, IconChart, IconWallet, IconFile,
  IconCap, IconCrown, IconHeadset, IconUser, IconCalendar, IconStar, IconSearch,
  IconCoins, IconBell, IconUsers, IconGift,
} from '../components/icons.jsx';

const STUDENT_NAV = [
  {
    group: 'اصلی',
    items: [
      { to: '/panel', label: 'خانه', icon: IconHome, end: true },
      { to: '/panel/calendar', label: 'تقویم و کلاس‌های من', icon: IconBook, badgeKey: 'upcoming' },
      { to: '/panel/chat', label: 'نیم‌چت', icon: IconChat },
      { to: '/panel/reports', label: 'گزارش تحصیلی', icon: IconChart },
    ],
  },
  {
    group: 'ابزارها',
    items: [
      { to: '/panel/finance', label: 'کیف پول و مالی', icon: IconWallet },
      { to: '/panel/friendly', label: 'رزرو دوستانه', icon: IconUsers },
      { to: '/panel/shop', label: 'فروشگاه آموزشی', icon: IconGift },
      { to: '/panel/files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/panel/family', label: 'دسترسی والدین', icon: IconUsers },
      { to: '/panel/exams', label: 'آزمون‌ها و تمرین‌ها', icon: IconCap },
      { to: '/panel/club', label: 'نیمکت کلاب', icon: IconCrown, badgeKey: 'level', gold: true },
    ],
  },
  {
    group: 'حساب',
    items: [
      { to: '/panel/notifications', label: 'اعلان‌ها', icon: IconBell, badgeKey: 'unread' },
      { to: '/panel/support', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/panel/profile', label: 'پروفایل و تنظیمات', icon: IconUser },
    ],
  },
];

const TEACHER_NAV = [
  {
    group: 'اصلی',
    items: [
      { to: '/teacher', label: 'داشبورد', icon: IconHome, end: true },
      { to: '/teacher/calendar', label: 'برنامهٔ هفتگی', icon: IconCalendar, badgeKey: 'upcoming' },
      { to: '/teacher/teaching', label: 'پرونده و زمان‌های آزاد', icon: IconCap },
      { to: '/teacher/classes', label: 'کلاس‌های من', icon: IconBook },
      { to: '/teacher/chat', label: 'نیم‌چت', icon: IconChat },
    ],
  },
  {
    group: 'مدیریت',
    items: [
      { to: '/teacher/earnings', label: 'درآمد و برداشت', icon: IconWallet },
      { to: '/teacher/finance', label: 'تسویه و مالی', icon: IconWallet },
      { to: '/teacher/files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/teacher/reviews', label: 'نظرات و رضایت‌ها', icon: IconStar },
      { to: '/teacher/club', label: 'نیمکت کلاب', icon: IconCrown, badgeKey: 'level', gold: true },
    ],
  },
  {
    group: 'حساب',
    items: [
      { to: '/teacher/support', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/teachers/1', label: 'پروفایل عمومی', icon: IconUser },
    ],
  },
];

const PARENT_NAV = [
  {
    group: 'خانواده',
    items: [
      { to: '/parent', label: 'پیشرفت و دسترسی فرزند', icon: IconUsers, end: true },
      { to: '/parent/files', label: 'فایل‌های مجاز فرزند', icon: IconFile },
      { to: '/parent/finance', label: 'کیف پول و مالی', icon: IconWallet },
      { to: '/parent/friendly', label: 'رزرو دوستانه', icon: IconUsers },
      { to: '/parent/shop', label: 'فروشگاه آموزشی', icon: IconGift },
      { to: '/parent/support', label: 'پشتیبانی', icon: IconHeadset },
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
      { to: '/admin/refunds', label: 'بازپرداخت‌ها', icon: IconWallet },
      { to: '/admin/earnings', label: 'تسویه و برداشت اساتید', icon: IconWallet },
      { to: '/admin/shop', label: 'فروشگاه و مرجوعی', icon: IconGift },
      { to: '/admin/club', label: 'نیمکت کلاب', icon: IconCoins },
      { to: '/editor/home', label: 'ویرایشگر صفحات', icon: IconFile },
    ],
  },
];

export default function PanelLayout({ role: propRole = '', variant = '', children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState(null);

  const effectiveRole = propRole || variant;
  const isAdmin = effectiveRole === 'admin' || pathname.startsWith('/admin');
  const isParent = effectiveRole === 'parent' || pathname.startsWith('/parent');
  const isTeacher = !isAdmin && !isParent && (effectiveRole ? effectiveRole === 'teacher' : pathname.startsWith('/teacher'));
  const nav = isAdmin ? ADMIN_NAV : isParent ? PARENT_NAV : isTeacher ? TEACHER_NAV : STUDENT_NAV;

  useEffect(() => {
    if (!user || isAdmin) return;
    let alive = true;
    api('/panel/overview')
      .then((d) => {
        if (alive) setSummary(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, isAdmin, pathname]);

  const defaultProfile = isAdmin
    ? { name: 'مدیر نیمکت', sub: 'مدیریت کل سامانه', letter: 'م', color: 'dark' }
    : isParent
      ? { name: 'والد نیمکت', sub: 'همراه خانواده', letter: 'و', color: 'green' }
      : isTeacher
        ? { name: 'سارا محمدی', sub: 'دبیر فیزیک · متخصص', letter: 'س', color: 'green' }
        : { name: 'علی رضایی', sub: 'پایه یازدهم · ریاضی', letter: 'ع', color: 'orange' };

  const profile = user
    ? {
        name: user.name,
        sub: summary?.user?.subtitle || user.subtitle || defaultProfile.sub,
        letter: user.letter || user.name?.[0] || defaultProfile.letter,
        color: user.role === 'teacher' ? 'green' : 'orange',
      }
    : defaultProfile;

  const resolveBadge = (item) => {
    if (item.badge) return item.badge;
    if (!summary) return null;
    if (item.badgeKey === 'upcoming') {
      return summary.stats?.upcomingShown > 0 ? faNum(summary.stats.upcomingShown) : null;
    }
    if (item.badgeKey === 'unread') {
      return summary.stats?.unreadNotifications > 0 ? faNum(summary.stats.unreadNotifications) : null;
    }
    if (item.badgeKey === 'level') {
      return summary.club?.level || null;
    }
    return null;
  };

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
    <div className="panel-shell">
      {/* ============ sidebar (right in RTL) ============ */}
      <aside className="panel-side">
        <Link to="/" className="brand" style={{ padding: '4px 6px 14px' }}>
          <span className="brand-logo">
            <IconBench size={24} />
            <i className="dot" />
          </span>
          <span>
            <span className="brand-name">نیمکت</span>
            <span className="brand-tag" style={{ display: 'block' }}>
              {isAdmin ? 'مدیریت کل' : isParent ? 'پنل والدین' : isTeacher ? 'پنل استاد' : 'پنل شاگرد'}
            </span>
          </span>
        </Link>

        <div className="side-user">
          <div className={`avatar sq-44 ${profile.color}`}>{profile.letter}</div>
          <div style={{ minWidth: 0 }}>
            <div className="name">{profile.name}</div>
            <div className="sub">{profile.sub}</div>
          </div>
        </div>

        <nav className="side-nav" aria-label="منوی پنل کاربری">
          {nav.map((g) => (
            <div key={g.group}>
              <div className="side-group">{g.group}</div>
              {g.items.map((it) => {
                const badgeText = resolveBadge(it);
                return (
                  <NavLink
                    key={it.label}
                    to={it.to}
                    end={it.end}
                    className={({ isActive }) => `side-link ${isActive ? 'is-active' : ''}`}
                  >
                    <it.icon size={19} />
                    <span>{it.label}</span>
                    {badgeText && (
                      <span className={`side-badge ${it.soft ? 'soft' : ''} ${it.gold ? 'gold' : ''}`}>
                        {badgeText}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="side-switch">
          {user && (
            <button
              type="button"
              onClick={async () => {
                if (await logout()) navigate('/');
              }}
              style={{ color: 'var(--error)', fontWeight: 700, textAlign: 'right' }}
            >
              خروج از حساب ({user.name})
            </button>
          )}
          <Link to="/">← بازگشت به سایت</Link>
        </div>
      </aside>

      {/* ============ main ============ */}
      <div className="panel-main">
        <div className="panel-top">
          <form className="panel-search" onSubmit={handleSearchSubmit} role="search">
            <IconSearch size={17} style={{ color: 'var(--n500)' }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="جستجو در کلاس‌ها و اساتید"
              placeholder="جستجو در کلاس‌ها، دروس، اساتید…"
            />
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isAdmin && (
              <Link
                to={isTeacher ? '/teacher/club' : isParent ? '/club' : '/panel/club'}
                className="coin-pill"
                style={{ padding: '7px 14px', fontSize: 13 }}
              >
                <IconCoins size={16} />
                <span className="num">{faNum(summary?.club?.coins ?? 0)} سکه</span>
              </Link>
            )}
            <Link
              className="btn-icon-round"
              aria-label="اعلان‌ها"
              to={notifLink}
              style={{ position: 'relative' }}
            >
              <IconBell size={18} />
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
          </div>
        </div>

        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}
