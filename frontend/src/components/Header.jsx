import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconBench, IconSearch, IconUser, IconMenu } from './icons.jsx';

const NAV = [
  { label: 'کلاس‌ها و اساتید', to: '/classes', active: true },
  { label: 'کلاس‌های گروهی', to: '/classes' },
  { label: 'نیم‌چت', to: '/panel/chat' },
  { label: 'نیمکت کلاب', to: '/panel/club' },
  { label: 'ویژه والدین', to: '/#parents' },
  { label: 'مجله', to: '/#faq' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={`header${open ? ' open' : ''}`}>
      <div className="container header-inner">
        <Link className="brand" to="/">
          <span className="brand-logo">
            <IconBench size={26} />
          </span>
          <span>
            <span className="brand-name">نیمکت</span>
            <br />
            <span className="brand-tag">پلتفرم آموزش آنلاین و حضوری</span>
          </span>
        </Link>

        <nav className="nav" onClick={() => setOpen(false)}>
          {NAV.map((item) => (
            <Link key={item.label} to={item.to} className={item.active ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="icon-btn" to="/classes" aria-label="جست‌وجو">
            <IconSearch size={19} />
          </Link>
          <Link className="btn btn-outline" to="/login">
            <IconUser size={17} />
            ورود / ثبت‌نام
          </Link>
          <Link className="btn btn-primary" to="/teachers/1">استاد شوید</Link>
          <button
            className="icon-btn burger"
            aria-label="منو"
            onClick={() => setOpen((v) => !v)}
          >
            <IconMenu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
