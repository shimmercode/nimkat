import type { NextConfig } from 'next';

const apiOrigin = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const config: NextConfig = {
  allowedDevOrigins: ['*.e2b.app'],
  async headers(){return [{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'},{key:'Service-Worker-Allowed',value:'/'}]}];},
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};
export default config;
