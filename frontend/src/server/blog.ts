import 'server-only';
export type BlogPost={id:string;slug:string;title:string;excerpt:string;category:string;author:string;seoTitle:string;seoDescription:string;cover:string;coverAlt:string;tags:string[];sections:{heading:string;text:string;type:'text'|'tip'|'quote'}[];faq:{question:string;answer:string}[];publishedAt:number;updatedAt:number;readingMinutes?:number};
export async function blogData(path='') {
 const rawOrigin=(process.env.API_INTERNAL_URL||(process.env.RENDER||process.env.RENDER_EXTERNAL_URL||process.env.RENDER_SERVICE_ID?'https://nimkat-backend.onrender.com':'http://127.0.0.1:8000')).trim().replace(/\/+$/,'').replace(/\/api$/,'');
 const origin=rawOrigin.startsWith('http://')||rawOrigin.startsWith('https://')?rawOrigin:`https://${rawOrigin}`;
 const response=await fetch(`${origin}/api/blog${path}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(response.status===404)return null;
 if(!response.ok)throw new Error('Blog service unavailable');
 return response.json();
}
export const minutes=(p:BlogPost)=>p.readingMinutes||Math.max(1,Math.ceil((p.sections||[]).map(s=>s.text).join(' ').split(/\s+/).length/180));
export const dateFa=(n:number)=>new Date(n).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'});
