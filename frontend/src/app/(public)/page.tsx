import Home from '../../views/Home.jsx';
import { publicPage } from '../../server/pages';
export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const page = await publicPage('home');
  return <Home initialSchema={page?.schema || null} />;
}
