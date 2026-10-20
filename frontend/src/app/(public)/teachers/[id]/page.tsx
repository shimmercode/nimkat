import JsonLd from '../../../../components/JsonLd';
import PublishedPage from '../../../../render/PublishedPage.jsx';
import Fallback from '../../../../views/TeacherProfile.jsx';
import { publicPage, publicEntity } from '../../../../server/pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await publicEntity('teachers', id);
  return { title: data?.teacher?.name || 'پروفایل استاد' };
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const page = await publicPage(`teacher-${id}`) || await publicPage('teacher-profile');
  const entity = await publicEntity('teachers', id);
  return <><JsonLd data={{ '@context': 'https://schema.org', '@type': 'Person', name: entity?.teacher?.name || 'استاد نیمکت', jobTitle: 'مدرس' }} /><PublishedPage slug="teacher-profile" recordPrefix="teacher" initialEntity={entity} fallback={Fallback} initialSchema={page?.schema || null} initialKey={`teacher-${id}`} /></>;
}
