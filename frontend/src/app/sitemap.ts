import type { MetadataRoute } from 'next';
import {siteUrl} from '../server/seo';
import {blogData,type BlogPost} from '../server/blog';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const site=siteUrl();if(!site)return [];const origin=process.env.API_INTERNAL_URL||'http://127.0.0.1:8000';const base:MetadataRoute.Sitemap=['/','/classes','/club','/blog'].map(p=>({url:`${site}${p}`,changeFrequency:'weekly'}));
 const [blog,classes,teachers]=await Promise.allSettled([blogData('/feed'),fetch(`${origin}/api/classes`,{cache:'no-store',signal:AbortSignal.timeout(4000)}).then(r=>r.ok?r.json():null),fetch(`${origin}/api/teachers`,{cache:'no-store',signal:AbortSignal.timeout(4000)}).then(r=>r.ok?r.json():null)]);
 if(blog.status==='fulfilled'&&blog.value)base.push(...blog.value.posts.map((p:BlogPost)=>({url:`${site}/blog/${p.slug}`,lastModified:new Date(p.updatedAt),changeFrequency:'monthly' as const})));
 for(const [result,kind,key] of [[classes,'classes','classes'],[teachers,'teachers','teachers']] as const)if(result.status==='fulfilled'&&result.value)base.push(...(result.value[key]||[]).map((r:{id:number})=>({url:`${site}/${kind}/${r.id}`,changeFrequency:'weekly' as const})));
 return base;
}
