import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import PageTransition from '../components/PageTransition.jsx';

export default function SiteLayout() {
  return (
    <>
      <Header />
      <main>
        <PageTransition><Outlet /></PageTransition>
      </main>
      <Footer />
    </>
  );
}
