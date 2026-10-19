import { IconMedal, IconBulb, IconTag, IconCoin, IconTrophy } from './icons.jsx';

const LINKS = [
  { title: 'اساتید برتر', sub: 'پروفایل و اعتبار', icon: IconMedal },
  { title: 'نوابغ نیمکت', sub: 'برترین‌های ماه', icon: IconBulb },
  { title: 'تخفیف‌ها', sub: 'پیشنهادهای ویژه', icon: IconTag },
  { title: 'نیمکت کلاب', sub: 'باشگاه مشتریان', icon: IconCoin },
  { title: 'رکوردها', sub: 'آمار نیمکت', icon: IconTrophy },
];

export default function QuickLinks() {
  return (
    <section className="qlinks">
      <div className="container qlinks-grid">
        {LINKS.map(({ title, sub, icon: Icon }) => (
          <a className="qlink" href="#teachers" key={title}>
            <span className="qlink-icon">
              <Icon size={26} />
            </span>
            <div className="qlink-title">{title}</div>
            <div className="qlink-sub">{sub}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
