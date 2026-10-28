'use client';
import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { NavLink, Link, useNavigate, useLocation } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { faPrice } from '../utils/fa.js';
import { IconBench, IconSearch, IconUser, IconWallet, IconChevronDown, IconX } from './icons.jsx';
import { MobileNavigation } from './ui/twenty-first/navigation.jsx';
import LiveSearch from './LiveSearch.jsx';

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
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const walletMenuId = useId();
  const walletRef = useRef(null);

  const panelPath =
    user?.role === 'teacher'
      ? '/teacher'
      : user?.role === 'admin'
        ? '/admin/analytics'
        : user?.role === 'parent'
          ? '/parent'
          : '/panel';

  const financePath =
    user?.role === 'teacher'
      ? '/teacher/finance'
      : user?.role === 'admin'
        ? '/admin/refunds'
        : user?.role === 'parent'
          ? '/parent/finance'
          : '/panel/finance';

  const chatPath = user
    ? user.role === 'teacher'
      ? '/teacher/chat'
      : '/panel/chat'
    : '/login?next=/panel/chat';

  const isAuthenticated = Boolean(user && (user.id || user.mobile));

  const fetchWalletBalance = useCallback(() => {
    if (!isAuthenticated) {
      setWalletBalance(null);
      setWalletError('');
      setWalletLoading(false);
      return () => {};
    }
    let alive = true;
    setWalletLoading(true);
    setWalletError('');
    api('/wallet')
      .then((res) => {
        if (!alive) return;
        setWalletBalance(typeof res?.balance === 'number' ? res.balance : 0);
      })
      .catch((err) => {
        if (!alive) return;
        setWalletError(err?.message || 'خطا در دریافت موجودی');
      })
      .finally(() => {
        if (alive) setWalletLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const cleanup = fetchWalletBalance();
    const onWalletUpdated = () => fetchWalletBalance();
    if (typeof window !== 'undefined') {
      window.addEventListener('nk:wallet-updated', onWalletUpdated);
    }
    return () => {
      cleanup();
      if (typeof window !== 'undefined') {
        window.removeEventListener('nk:wallet-updated', onWalletUpdated);
      }
    };
  }, [fetchWalletBalance, pathname]);

  useEffect(() => {
    setSearchOpen(false);
    setWalletMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!walletMenuOpen && !searchOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setWalletMenuOpen(false);
        setSearchOpen(false);
      }
    };
    const onDown = (e) => {
      if (walletMenuOpen && walletRef.current && !walletRef.current.contains(e.target)) {
        setWalletMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [walletMenuOpen, searchOpen]);

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
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <IconX size={20} /> : <IconSearch size={20} />}
          </button>
          {isAuthenticated ? (
            <>
              <div ref={walletRef} className="nk-wallet-pill-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="nk-wallet-pill"
                  aria-expanded={walletMenuOpen}
                  aria-controls={walletMenuId}
                  aria-label="کیف پول و موجودی حساب"
                  onClick={() => setWalletMenuOpen((v) => !v)}
                >
                  <IconWallet size={17} />
                  <span className="nk-wallet-pill__label">کیف پول:</span>
                  <span className="nk-wallet-pill__balance num" data-testid="header-wallet-balance">
                    {walletLoading && walletBalance === null
                      ? 'در حال دریافت…'
                      : walletError && walletBalance === null
                        ? 'خطا در دریافت'
                        : `${faPrice(walletBalance ?? 0)} تومان`}
                  </span>
                  <IconChevronDown size={14} />
                </button>
                {walletMenuOpen && (
                  <div
                    id={walletMenuId}
                    role="region"
                    aria-label="جزئیات کیف پول"
                    className="nk-wallet-dropdown"
                  >
                    <div className="nk-wallet-dropdown__head">
                      <span className="t-caption t-muted">موجودی قابل استفاده</span>
                      <strong className="num" style={{ fontSize: 17, color: 'var(--primary)' }}>
                        {walletLoading
                          ? 'در حال بروزرسانی…'
                          : walletError
                            ? 'خطا در دریافت موجودی'
                            : `${faPrice(walletBalance ?? 0)} تومان`}
                      </strong>
                    </div>
                    {walletError && (
                      <div style={{ marginTop: 8 }}>
                        <div className="t-caption" style={{ color: 'var(--error)', marginBottom: 6 }}>
                          {walletError}
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ width: '100%' }}
                          onClick={() => fetchWalletBalance()}
                        >
                          تلاش مجدد برای دریافت موجودی
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      <Link
                        to={`${financePath}#wallet-charge`}
                        className="btn btn-primary btn-sm"
                        style={{ justifyContent: 'center' }}
                        onClick={() => setWalletMenuOpen(false)}
                      >
                        + افزایش موجودی (شارژ کیف پول)
                      </Link>
                      <Link
                        to={financePath}
                        className="btn btn-outline btn-sm"
                        style={{ justifyContent: 'center' }}
                        onClick={() => setWalletMenuOpen(false)}
                      >
                        مشاهده جزئیات کیف پول و امور مالی
                      </Link>
                      <Link
                        to={`${financePath}#wallet-history`}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'center' }}
                        onClick={() => setWalletMenuOpen(false)}
                      >
                        تاریخچه تراکنش‌ها و رسیدها
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link to={panelPath} className="btn btn-outline">
                <IconUser size={18} />
                {user.name || 'پنل من'}
              </Link>
              <button className="btn btn-ghost btn-sm site-header-logout" type="button" onClick={() => logout()}>
                خروج
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline">
              <IconUser size={18} />
              ورود / ثبت‌نام
            </Link>
          )}
          <Link to="/login?mode=teacher" className="btn btn-primary site-header-teacher-cta">
            استاد شوید
          </Link>
          <MobileNavigation user={isAuthenticated ? user : null} logout={logout} />
        </div>
      </div>

      {searchOpen && (
        <div className="site-header-search-panel">
          <div className="container site-header-search-panel__inner">
            <LiveSearch
              autoFocus
              placeholder="جستجوی زنده نام کلاس، استاد یا درس در نیمکت…"
              inputAriaLabel="جستجوی زنده در هدر سایت"
            />
          </div>
        </div>
      )}
    </header>
  );
}
