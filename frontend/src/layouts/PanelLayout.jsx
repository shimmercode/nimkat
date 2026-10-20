import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
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
      { to: '/panel#upcoming', label: 'کلاس‌های من', icon: IconBook, badge: '۲' },
      { to: '/panel/chat', label: 'نیم‌چت', icon: IconChat, badge: '۵' },
      { to: '/panel#report', label: 'گزارش تحصیلی', icon: IconChart },
    ],
  },
  {
    group: 'مالی و منابع',
    items: [
      { to: '/panel#wallet', label: 'امور مالی', icon: IconWallet },
      { to: '/panel#files', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/panel#report', label: 'آزمون‌ها', icon: IconCap, badge: 'به‌زودی', soft: true },
    ],
  },
  {
    group: 'باشگاه و پشتیبانی',
    items: [
      { to: '/panel/club', label: 'نیمکت کلاب', icon: IconCrown },
      { to: '/panel#report', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/panel#report', label: 'پروفایل', icon: IconUser },
    ],
  },
];

const TEACHER_NAV = [
  {
    group: '',
    items: [
      { to: '/teacher', end: true, label: 'خانه', icon: IconHome },
      { to: '/teacher#today', label: 'کلاس‌های من', icon: IconBook, badge: '۳' },
      { to: '/teacher#today', label: 'تقویم کاری', icon: IconCalendar, badge: '۲' },
      { to: '/teacher/chat', label: 'نیم‌چت', icon: IconChat, badge: '۱۲' },
    ],
  },
  {
    group: 'مالی و کیفیت',
    items: [
      { to: '/teacher#settlements', label: 'امور مالی', icon: IconWallet },
      { to: '/teacher#reviews', label: 'فایل‌ها و منابع', icon: IconFile },
      { to: '/teacher#reviews', label: 'امتیاز و نظرات', icon: IconStar, badge: '۱' },
      { to: '/teacher#tip', label: 'نیم‌پند', icon: IconBulb },
    ],
  },
  {
    group: 'باشگاه و پشتیبانی',
    items: [
      { to: '/teacher/club', label: 'نیمکت کلاب', icon: IconCrown },
      { to: '/teacher#reviews', label: 'پشتیبانی', icon: IconHeadset },
      { to: '/teacher#tip', label: 'پروفایل و رزومه', icon: IconUser },
    ],
  },
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
  const roleLabel = variant === 'teacher' ? 'پنل استاد' : 'پنل شاگرد';

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
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{roleLabel} · مای نیمکت</div>
              <b style={{ fontSize: 15 }}>{TITLES[pathname] || 'مای نیمکت'}</b>
            </div>
          </div>

          <div className="panel-search">
            <IconSearch size={17} style={{ color: 'var(--n500)' }} />
            <input placeholder="جستجو در کلاس‌ها، فایل‌ها و پیام‌ها" />
          </div>

          <button className="btn-icon-round" type="button" aria-label="اعلان‌ها">
            <IconBell size={19} />
          </button>
          <Link to="/" className="btn btn-outline">
            <IconHome size={17} /> صفحه اصلی سایت
          </Link>
        </div>
      </div>

      <div className="container panel-body">
        {/* sidebar (right) */}
        <aside className="panel-side">
          <div className="side-user">
            <div className={`avatar sq-40 ${variant === 'teacher' ? '' : 'tint-green'}`} style={variant === 'teacher' ? {} : { background: 'var(--secondary-50)', color: 'var(--primary)' }}>
              {user?.letter || 'ع'}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 14 }}>{user?.name || (variant === 'teacher' ? 'سارا محمدی' : 'علی رضایی')}</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {user?.subtitle || (variant === 'teacher' ? 'دبیر فیزیک · متخصص' : 'پایه یازدهم · ریاضی')}
              </div>
            </div>
            <IconChevronDown size={16} style={{ color: 'var(--n500)' }} />
          </div>

          {nav.map((g, gi) => (
            <div key={gi} style={{ marginTop: g.group ? 10 : 0 }}>
              {g.group && <div className="side-group">{g.group}</div>}
              {g.items.map((it) => (
                <NavLink
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

          <button type="button" className="side-link" style={{ marginTop: 12, color: 'var(--error)' }} onClick={logout}>
            <IconLogout size={19} /> خروج از حساب
          </button>
        </aside>

        {/* content (left) */}
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
