import type { NextConfig } from 'next';

const apiOrigin = process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000';
const config: NextConfig = {
  allowedDevOrigins: ['*.e2b.app'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};
export default config;
