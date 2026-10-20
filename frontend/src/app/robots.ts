import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const site = process.env.SITE_URL?.replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/panel', '/teacher/', '/teacher$', '/editor/', '/login', '/api/'] },
    ...(site ? { sitemap: `${site}/sitemap.xml` } : {}),
  };
}
