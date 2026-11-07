import type { NextConfig } from 'next';

const config: NextConfig = {
  allowedDevOrigins: ['*.e2b.app'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Fallback pages must never be served stale by an intermediary cache.
        source: '/:fallback(offline|service-unavailable).html',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }],
      },
    ];
  },
};
export default config;
