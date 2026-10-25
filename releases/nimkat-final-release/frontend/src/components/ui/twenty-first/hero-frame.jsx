'use client';
// Tailark Veil Hero Section One, adapted for Nimkat (MIT, Irung).
// Preserve the approved two-photo composition and editable content/search slots.
import { Link } from '../../../routing/navigation';
import { IconArrowLeft } from '../../icons.jsx';
export function HeroFrame({children,editorPreview=false}) {
  return <section className={`hero nk-hero${editorPreview?' nk-hero-editor':''}`}><div className="nk-hero-ambient" aria-hidden="true"><span/><i/></div>{children}</section>;
}
export function HeroEyebrow({label='یادگیری، با آدم‌های درست',href='/#how'}) {
  if(!label)return null;
  return <Link to={href} className="nk-hero-eyebrow"><span className="nk-status-dot"/>{label}<span className="nk-eyebrow-arrow"><IconArrowLeft size={16}/></span></Link>;
}
