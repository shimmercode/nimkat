import { useState } from 'react';
import { IconBench, IconSearch, IconUser, IconMenu } from './icons.jsx';

const NAV = [
  { label: 'کلاس‌ها و اساتید', href: '#teachers', active: true },
  { label: 'کلاس‌های گروهی', href: '#classes' },
  { label: 'نیم‌چت', href: '#club' },
  { label: 'نیمکت کلاب', href: '#club' },
  { label: 'ویژه والدین', href: '#parents' },
  { label: 'مجله', href: '#faq' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={`header${open ? ' open' : ''}`}>
      <div className="container header-inner">
        <a className="brand" href="#top">
          <span className="brand-logo">
            <IconBench size={26} />
          </span>
          <span>
            <span className="brand-name">نیمکت</span>
            <br />
            <span className="brand-tag">پلتفرم آموزش آنلاین و حضوری</span>
          </span>
        </a>

        <nav className="nav" onClick={() => setOpen(false)}>
          {NAV.map((item) => (
            <a key={item.label} href={item.href} className={item.active ? 'active' : ''}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button className="icon-btn" aria-label="جست‌وجو">
            <IconSearch size={19} />
          </button>
          <button className="btn btn-outline">
            <IconUser size={17} />
            ورود / ثبت‌نام
          </button>
          <button className="btn btn-primary">استاد شوید</button>
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
