import PublishedPage from '../../../render/PublishedPage.jsx';
import Fallback from '../../../views/panel/Club.jsx';
import { publicPage, publicEntity } from '../../../server/pages';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'نیمکت کلاب' };
export default async function Page() {
  const page = await publicPage('club');
  return <div className="container section-tight"><PublishedPage slug="club" fallback={Fallback} initialSchema={page?.schema || null} initialKey="club" /></div>;
}
