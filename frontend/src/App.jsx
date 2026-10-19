import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import QuickLinks from './components/QuickLinks.jsx';
import TopTeachers from './components/TopTeachers.jsx';
import TopStudents from './components/TopStudents.jsx';
import GroupClasses from './components/GroupClasses.jsx';
import ClubBanner from './components/ClubBanner.jsx';
import ValueCards from './components/ValueCards.jsx';
import Testimonials from './components/Testimonials.jsx';
import Faq from './components/Faq.jsx';
import CallbackCta from './components/CallbackCta.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <QuickLinks />
        <TopTeachers />
        <TopStudents />
        <GroupClasses />
        <ClubBanner />
        <ValueCards />
        <Testimonials />
        <Faq />
        <CallbackCta />
      </main>
      <Footer />
    </>
  );
}
