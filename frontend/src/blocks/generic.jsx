'use client';
/* Generic layout + content blocks for the page builder */
import { Link } from '../routing/navigation';
import {
  IconStar, IconArrowLeft, IconSearch, IconGlobe, IconMapPin, IconChevronDown,
} from '../components/icons.jsx';

export const iconMap = {
  star: IconStar, arrow: IconArrowLeft, search: IconSearch, globe: IconGlobe, pin: IconMapPin, chevron: IconChevronDown,
};

/* ---------- section (container) ---------- */
export function SectionBlock({ node, children }) {
  const d = node.props;
  return (
    <section className={`pb-section ${d.className || ''}`} id={d.anchor || undefined} style={d.wrapStyle}>
      <div className="container">{children}</div>
    </section>
  );
}

export const sectionSpec = {
  type: 'section', label: 'بخش (کانتینر)', container: true, category: 'لایه‌بندی',
  defaults: { className: 'section-tight', anchor: '' },
  fields: [
    { key: 'anchor', label: 'شناسه‌ی anchor (برای لینک‌ها)', type: 'text' },
    { key: 'className', label: 'کلاس ظاهری', type: 'select', options: ['', 'section', 'section-tight', 'testi-band'] },
  ],
};

/* ---------- heading ---------- */
export function HeadingBlock({ node }) {
  const d = node.props;
  return (
    <div className="section-head">
      <div className="titles">
        {d.eyebrow ? <span className={`eyebrow ${d.eyebrowTone || ''}`}>{d.eyebrow}</span> : null}
        <h2 className="section-title" dangerouslySetInnerHTML={{ __html: d.title }} />
        {d.sub ? <p className="section-sub">{d.sub}</p> : null}
      </div>
    </div>
  );
}

export const headingSpec = {
  type: 'heading', label: 'عنوان بخش', category: 'متن',
  defaults: {
    eyebrow: 'عنوان کوچک', eyebrowTone: '', title: 'عنوان بخش <span class="hl-green">برجسته</span>',
    sub: 'توضیح کوتاه زیر عنوان.',
  },
  fields: [
    { key: 'eyebrow', label: 'متن بالای عنوان', type: 'text' },
    { key: 'eyebrowTone', label: 'رنگ عنوان کوچک', type: 'select', options: ['', 'orange', 'green'] },
    { key: 'title', label: 'عنوان (HTML)', type: 'textarea' },
    { key: 'sub', label: 'توضیح', type: 'textarea' },
  ],
};

/* ---------- text ---------- */
export function TextBlock({ node }) {
  const d = node.props;
  return <p className={d.cls || 't-small t-muted'} style={{ lineHeight: 2.1 }} dangerouslySetInnerHTML={{ __html: d.text }} />;
}

export const textSpec = {
  type: 'text', label: 'متن', category: 'متن',
  defaults: { text: 'متن خود را اینجا بنویسید.', cls: 't-small t-muted' },
  fields: [
    { key: 'text', label: 'متن (HTML)', type: 'textarea' },
    { key: 'cls', label: 'کلاس متن', type: 'select', options: ['t-small t-muted', 'lead', 't-h4', 't-h3', 't-caption t-muted'] },
  ],
};

/* ---------- image ---------- */
export function ImageBlock({ node }) {
  const d = node.props;
  return (
    <img
      src={d.src}
      alt={d.alt || ''}
      style={{ width: d.width || '100%', maxWidth: d.maxWidth || 'none', borderRadius: d.radius || 0, display: 'block', margin: d.center ? '0 auto' : undefined }}
    />
  );
}

export const imageSpec = {
  type: 'image', label: 'تصویر', category: 'رسانه',
  defaults: { src: '', alt: '', width: '100%', maxWidth: 480, radius: 16, center: true },
  fields: [
    { key: 'src', label: 'آدرس تصویر', type: 'text' },
    { key: 'alt', label: 'متن جایگزین', type: 'text' },
    { key: 'width', label: 'عرض', type: 'text' },
    { key: 'maxWidth', label: 'حداکثر عرض (px)', type: 'number' },
    { key: 'radius', label: 'گردی گوشه‌ها (px)', type: 'number' },
    { key: 'center', label: 'وسط‌چین', type: 'toggle' },
  ],
};

/* ---------- buttons ---------- */
export function ButtonsBlock({ node }) {
  const d = node.props;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: d.align || 'flex-start' }}>
      {(d.items || []).map((b, i) => {
        const cls = `btn ${b.variant === 'orange' ? 'btn-orange' : b.variant === 'outline' ? 'btn-outline' : b.variant === 'outline-green' ? 'btn-outline-green' : 'btn-primary'}${b.size === 'lg' ? ' btn-lg' : ''}`;
        return b.href && b.href.startsWith('/') ? (
          <Link key={i} to={b.href} className={cls}>{b.label}</Link>
        ) : (
          <a key={i} href={b.href || '#'} className={cls}>{b.label}</a>
        );
      })}
    </div>
  );
}

export const buttonsSpec = {
  type: 'buttons', label: 'دکمه‌ها', category: 'کاربردی',
  defaults: {
    align: 'flex-start',
    items: [
      { label: 'شروع رزرو کلاس', href: '/classes', variant: 'primary', size: 'lg' },
      { label: 'ثبت‌نام رایگان', href: '/login', variant: 'outline', size: 'lg' },
    ],
  },
  fields: [
    { key: 'align', label: 'چیدمان', type: 'select', options: ['flex-start', 'center', 'flex-end'] },
    {
      key: 'items', label: 'دکمه‌ها', type: 'list', itemLabel: 'label',
      fields: [
        { key: 'label', label: 'متن', type: 'text' },
        { key: 'href', label: 'لینک', type: 'text' },
        { key: 'variant', label: 'ظاهر', type: 'select', options: ['primary', 'orange', 'outline', 'outline-green'] },
        { key: 'size', label: 'اندازه', type: 'select', options: ['', 'lg'] },
      ],
    },
  ],
};

/* ---------- divider / spacer ---------- */
export function DividerBlock({ node }) {
  const d = node.props;
  return <hr className="divider" style={{ margin: `${d.gap || 24}px 0` }} />;
}
export const dividerSpec = {
  type: 'divider', label: 'خط جداکننده', category: 'لایه‌بندی',
  defaults: { gap: 24 }, fields: [{ key: 'gap', label: 'فاصله (px)', type: 'number' }],
};

export function SpacerBlock({ node }) {
  return <div style={{ height: node.props.height || 32 }} />;
}
export const spacerSpec = {
  type: 'spacer', label: 'فاصله‌گذار', category: 'لایه‌بندی',
  defaults: { height: 32 }, fields: [{ key: 'height', label: 'ارتفاع (px)', type: 'number' }],
};

/* ---------- cta band (final CTA style) ---------- */
export function CtaBandBlock({ node }) {
  const d = node.props;
  return (
    <div className="cta-band">
      <div>
        <h2 className="t-h3" style={{ color: '#fff' }}>{d.title}</h2>
        <p style={{ opacity: 0.9, marginTop: 10, lineHeight: 2 }}>{d.sub}</p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {(d.buttons || []).map((b, i) => (
          <Link key={i} to={b.href} className={`btn btn-lg ${b.variant === 'orange' ? 'btn-orange' : ''}`} style={b.variant === 'ghost' ? { background: 'rgba(255,255,255,.14)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' } : undefined}>
            {b.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
export const ctaBandSpec = {
  type: 'cta-band', label: 'بنر دعوت به اقدام', category: 'کاربردی',
  defaults: {
    title: 'همین حالا نیمکتت را رزرو کن',
    sub: 'اولین جلسه با ضمانت تغییر استاد؛ پرداخت امن و بازگشت وجه تا ۲۴ ساعت قبل از کلاس.',
    buttons: [
      { label: 'شروع رزرو کلاس', href: '/classes', variant: 'orange' },
      { label: 'ثبت‌نام رایگان', href: '/login', variant: 'ghost' },
    ],
  },
  fields: [
    { key: 'title', label: 'عنوان', type: 'text' },
    { key: 'sub', label: 'توضیح', type: 'textarea' },
    {
      key: 'buttons', label: 'دکمه‌ها', type: 'list', itemLabel: 'label',
      fields: [
        { key: 'label', label: 'متن', type: 'text' },
        { key: 'href', label: 'لینک', type: 'text' },
        { key: 'variant', label: 'ظاهر', type: 'select', options: ['orange', 'ghost', 'primary'] },
      ],
    },
  ],
};
