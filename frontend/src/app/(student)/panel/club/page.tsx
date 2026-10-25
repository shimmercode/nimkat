import Club from '../../../../views/panel/Club.jsx';
import PublishedPage from '../../../../render/PublishedPage.jsx';
export const metadata = { title: 'نیمکت کلاب | پنل شاگرد نیمکت' };
export default function Page() { return <PublishedPage slug="club" fallback={Club} />; }
