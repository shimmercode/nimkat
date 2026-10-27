import type { Metadata } from 'next';
export const siteUrl = () => {
 const value=process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://nimkat.ir';
 if(!value)return null;
 try{const u=new URL(value);return u.protocol==='https:'?u.origin:null;}catch{return null;}
};
export function seo(title:string,description:string,path:string,image='/images/blog/study.png'):Metadata {
 description=description.slice(0,180);
 const site=siteUrl();
 return {title,description,alternates:{...(site?{canonical:`${site}${path}`} :{}),types:{'application/rss+xml':`${site||''}/rss.xml`}},openGraph:{type:'website',title,description,locale:'fa_IR',siteName:'نیمکت',...(site?{url:`${site}${path}`,images:[{url:`${site}${image}`,width:1200,height:630,alt:title}]}:{})},twitter:{card:'summary_large_image',title,description,...(site?{images:[`${site}${image}`]}:{})}};
}
