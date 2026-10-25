import PublishedPage from '../../../render/PublishedPage.jsx';
import Fallback from '../../../views/panel/Club.jsx';
import { publicPage, publicClub } from '../../../server/pages';
export const dynamic = 'force-dynamic';
import {seo} from '../../../server/seo';
export const generateMetadata=()=>seo('نیمکت کلاب','باشگاه یادگیری نیمکت؛ مسیر پیشرفت، چالش‌ها و فعالیت‌های آموزشی.','/club');
export default async function Page() {
  const [page,catalog] = await Promise.all([publicPage('club'),publicClub()]);
  return <div className="container section-tight"><PublishedPage slug="club" fallback={Fallback} initialSchema={page?.schema || null} initialKey="club" initialEntity={{club:catalog}} /></div>;
}
