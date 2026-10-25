import {blogData,type BlogPost} from '../../server/blog';
import {siteUrl} from '../../server/seo';
export const dynamic='force-dynamic';
const xml=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export async function GET(request:Request){let site=siteUrl();const preview=!site;
 if(!site && process.env.NIMKAT_PREVIEW_MODE==='true') {
  const host=request.headers.get('x-forwarded-host')||request.headers.get('host')||new URL(request.url).host;
  if(/^[a-zA-Z0-9-]+\.(arena\.site|e2b\.app)$/.test(host))site=`https://${host}`;
  else if(/^(localhost|127\.0\.0\.1):\d+$/.test(host))site=`http://${host}`;
 }
 if(!site)return new Response('Configure SITE_URL with your canonical HTTPS origin to enable RSS.',{status:503,headers:{'Cache-Control':'no-store'}});try{const data=await blogData('/feed');const posts:BlogPost[]=data.posts;return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>مجله نیمکت</title><link>${xml(site)}/blog</link><description>راهنماهای یادگیری، مطالعه و همراهی خانواده</description><language>fa-IR</language><atom:link href="${xml(site)}/rss.xml" rel="self" type="application/rss+xml"/>${posts.map(p=>`<item><title>${xml(p.title)}</title><link>${xml(site)}/blog/${xml(p.slug)}</link><guid isPermaLink="true">${xml(site)}/blog/${xml(p.slug)}</guid><description>${xml(p.excerpt)}</description><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><category>${xml(p.category)}</category></item>`).join('')}</channel></rss>`,{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':preview?'private, no-store':'public, max-age=300',...(preview?{'X-Robots-Tag':'noindex, nofollow'}:{}),'X-Content-Type-Options':'nosniff'}});}catch{return new Response('Feed temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}}
