import PublishedPage from '../../../render/PublishedPage.jsx';
import Fallback from '../../../views/ClassesSearch.jsx';
import { publicPage, publicEntity } from '../../../server/pages';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'جستجوی کلاس‌ها و اساتید' };
export default async function Page() {
  const page = await publicPage('classes');
  return <PublishedPage slug="classes" fallback={Fallback} initialSchema={page?.schema || null} initialKey="classes" />;
}
