import type { Metadata, Viewport } from 'next';
import {siteUrl} from '../server/seo';
import JsonLd from '../components/JsonLd';
import Providers from './providers';
import '../styles/tailwind.css';
import '../styles/fonts.css';
import '../styles/global.css';
import '../styles/interactions.css';
import '../styles/support.css';
import '../styles/journal.css';
import '../styles/community.css';
import '../styles/loyalty.css';
import '../styles/onboarding.css';
import '../styles/responsive.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-content' };

const canonicalSite=siteUrl();
export const metadata: Metadata = {
 ...(canonicalSite?{metadataBase:new URL(canonicalSite)}:{robots:{index:false,follow:false}}),
 alternates:{types:{'application/rss+xml':'/rss.xml'}},
 openGraph:{locale:'fa_IR',siteName:'نیمکت',type:'website'},
 twitter:{card:'summary_large_image'},
  title: { default: 'نیمکت | رزرو کلاس با استاد دلخواه', template: '%s | نیمکت' },
  description: 'جستجو و رزرو کلاس آنلاین و حضوری با استاد دلخواه در نیمکت.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body>{canonicalSite&&<JsonLd data={{'@context':'https://schema.org','@type':'Organization',name:'نیمکت',url:canonicalSite}}/>}<Providers>{children}</Providers></body></html>;
}
