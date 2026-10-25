import type { MetadataRoute } from 'next';
import {siteUrl} from '../server/seo';
export const dynamic='force-dynamic';
export default function robots():MetadataRoute.Robots{const site=siteUrl();return {rules:site?{userAgent:'*',allow:'/',disallow:['/panel','/teacher','/admin','/editor','/login','/payment','/api/']}:{userAgent:'*',disallow:'/'},...(site?{sitemap:`${site}/sitemap.xml`}:{})};}
