import { notFound } from 'next/navigation';
import PageRenderer from '../../../../render/PageRenderer.jsx';
import { publicPage } from '../../../../server/pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: (await publicPage(slug))?.title || 'صفحه پیدا نشد' };
}
export default async function CustomPage({ params }: Props) {
  const { slug } = await params;
  const page = await publicPage(slug);
  if (!page) notFound();
  return <PageRenderer schema={page.schema} />;
}
