import Home from '../../views/Home.jsx';
import { publicPage } from '../../server/pages';
import {seo} from '../../server/seo';
export const generateMetadata=()=>seo('نیمکت | رزرو کلاس با استاد دلخواه','جستجو و رزرو کلاس آنلاین و حضوری؛ برنامه جلسات، معرفی استاد و راهنماهای یادگیری.','/');
export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const page = await publicPage('home');
  return <Home initialSchema={page?.schema || null} />;
}
