import JsonLd from '../../../../components/JsonLd';
import PublishedPage from '../../../../render/PublishedPage.jsx';
import Fallback from '../../../../views/ClassDetail.jsx';
import { publicPage, publicEntity } from '../../../../server/pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await publicEntity('classes', id);
  return { title: data?.class?.title || 'جزئیات کلاس' };
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const page = await publicPage(`class-${id}`) || await publicPage('class-detail');
  const entity = await publicEntity('classes', id);
  return <><JsonLd data={{ '@context': 'https://schema.org', '@type': 'Course', name: entity?.class?.title || 'کلاس نیمکت', provider: { '@type': 'Organization', name: 'نیمکت' } }} /><PublishedPage slug="class-detail" recordPrefix="class" initialEntity={entity} fallback={Fallback} initialSchema={page?.schema || null} initialKey={`class-${id}`} /></>;
}
