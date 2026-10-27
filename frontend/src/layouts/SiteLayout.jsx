import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import PageTransition from '../components/PageTransition.jsx';

export default function SiteLayout({ children }) {
  return (
    <>
      <Header />
      <PageTransition>{children}</PageTransition>
      <Footer />
    </>
  );
}
