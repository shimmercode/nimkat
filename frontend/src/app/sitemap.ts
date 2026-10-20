import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.SITE_URL?.replace(/\/$/, '');
  // Never advertise the sandbox or localhost as the production canonical host.
  if (!site) return [];
  return ['/', '/classes', '/club'].map((path) => ({
    url: `${site}${path}`, changeFrequency: 'weekly' as const,
  }));
}
