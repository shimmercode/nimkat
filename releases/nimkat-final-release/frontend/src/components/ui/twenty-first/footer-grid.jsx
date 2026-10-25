'use client';
// Tailark Footer Two's grouped, data-driven navigation (MIT, Irung).
import { Link } from '../../../routing/navigation';
export default function FooterGrid({groups,children}) {
  return <div className="nk-footer-grid">{children}{groups.map(group=><nav className="nk-footer-group" key={group.title} aria-label={group.title}><h3>{group.title}</h3><ul>{group.items.map(item=><li key={item.title}>{item.onClick?<button onClick={item.onClick}>{item.title}</button>:<Link to={item.href}>{item.title}</Link>}</li>)}</ul></nav>)}</div>;
}
