import PublishedPage from '../../../render/PublishedPage.jsx';
import Fallback from '../../../views/ClassesSearch.jsx';
import { publicPage, publicEntity } from '../../../server/pages';
export const dynamic = 'force-dynamic';
import {seo} from '../../../server/seo';
export const generateMetadata=()=>seo('جستجوی کلاس‌ها و اساتید','کلاس خصوصی، گروهی و دوستانه را با توجه به درس، شیوه برگزاری و برنامه جلسات جستجو کنید.','/classes');
export default async function Page() {
  const page = await publicPage('classes');
  return <PublishedPage slug="classes" fallback={Fallback} initialSchema={page?.schema || null} initialKey="classes" />;
}
