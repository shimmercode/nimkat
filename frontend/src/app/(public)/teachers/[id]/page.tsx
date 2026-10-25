import {notFound} from 'next/navigation';
import {seo} from '../../../../server/seo';
import JsonLd from '../../../../components/JsonLd';
import PublishedPage from '../../../../render/PublishedPage.jsx';
import Fallback from '../../../../views/TeacherProfile.jsx';
import { publicPage, publicEntity, publicTeacherReviews, publicTeacherAvailability } from '../../../../server/pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await publicEntity('teachers', id);
  return data?.teacher ? seo(`معرفی ${data.teacher.name}`,String(data.teacher.about||'سوابق و روش تدریس، کلاس‌ها و برنامه مدرس.').slice(0,180),`/teachers/${id}`) : {title:'استاد پیدا نشد',robots:{index:false,follow:false}};
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const page = await publicPage(`teacher-${id}`) || await publicPage('teacher-profile');
  const entity = await publicEntity('teachers', id);
  if(!entity?.teacher) notFound();
  return <><JsonLd data={{ '@context': 'https://schema.org', '@type': 'Person', name: entity?.teacher?.name || 'استاد نیمکت', jobTitle: 'مدرس' }} /><PublishedPage slug="teacher-profile" recordPrefix="teacher" initialEntity={{...entity,reviews:await publicTeacherReviews(id),availability:await publicTeacherAvailability(id)}} fallback={Fallback} initialSchema={page?.schema || null} initialKey={`teacher-${id}`} /></>;
}
