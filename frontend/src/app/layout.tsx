import type { Metadata } from 'next';
import Providers from './providers';
import '../styles/tailwind.css';
import '../styles/fonts.css';
import '../styles/global.css';
import '../styles/interactions.css';
import '../styles/responsive.css';

export const metadata: Metadata = {
  title: { default: 'نیمکت | رزرو کلاس با استاد دلخواه', template: '%s | نیمکت' },
  description: 'جستجو و رزرو کلاس آنلاین و حضوری با استاد دلخواه در نیمکت.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body><Providers>{children}</Providers></body></html>;
}
