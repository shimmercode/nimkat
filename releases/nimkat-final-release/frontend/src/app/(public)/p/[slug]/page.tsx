import {seo} from '../../../../server/seo';
import { notFound } from 'next/navigation';
import PageRenderer from '../../../../render/PageRenderer.jsx';
import { publicPage } from '../../../../server/pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page=await publicPage(slug);
  return page?seo(page.title,`${page.title}؛ نیمکت، مسیر یادگیری شما.`,`/p/${encodeURIComponent(slug)}`):{title:'صفحه پیدا نشد',robots:{index:false,follow:false}};
}
export default async function CustomPage({ params }: Props) {
  const { slug } = await params;
  const page = await publicPage(slug);
  if (!page) notFound();
  return <PageRenderer schema={page.schema} />;
}
