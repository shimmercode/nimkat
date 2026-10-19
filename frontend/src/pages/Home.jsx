import Hero from '../components/Hero.jsx';
import QuickLinks from '../components/QuickLinks.jsx';
import TopTeachers from '../components/TopTeachers.jsx';
import TopStudents from '../components/TopStudents.jsx';
import GroupClasses from '../components/GroupClasses.jsx';
import ClubBanner from '../components/ClubBanner.jsx';
import ValueCards from '../components/ValueCards.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Faq from '../components/Faq.jsx';
import CallbackCta from '../components/CallbackCta.jsx';
import {
  BookingProcess, PlatformStats, TeacherSpotlight, Magazine, FinalCta,
} from '../components/HomeExtras.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <QuickLinks />
      <BookingProcess />
      <PlatformStats />
      <TopTeachers />
      <TeacherSpotlight />
      <TopStudents />
      <GroupClasses />
      <ClubBanner />
      <ValueCards />
      <Magazine />
      <Testimonials />
      <Faq />
      <CallbackCta />
      <FinalCta />
    </>
  );
}
