import 'server-only';
export type BlogPost={id:string;slug:string;title:string;excerpt:string;category:string;author:string;seoTitle:string;seoDescription:string;cover:string;coverAlt:string;tags:string[];sections:{heading:string;text:string;type:'text'|'tip'|'quote'}[];faq:{question:string;answer:string}[];publishedAt:number;updatedAt:number;readingMinutes?:number};

function getCandidateOrigins(): string[] {
  const local = `http://127.0.0.1:${process.env.BACKEND_INTERNAL_PORT || '8000'}`;
  const raw = (process.env.API_INTERNAL_URL || '').trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (raw) {
    const norm = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    if (norm.includes('127.0.0.1') || norm.includes('localhost')) return [norm];
    return [local, norm];
  }
  if (process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID) {
    return [local, 'https://nimkat-backend.onrender.com'];
  }
  return [local];
}

export async function blogData(path = '') {
  const origins = getCandidateOrigins();
  let lastErr: unknown = null;
  for (const origin of origins) {
    try {
      const response = await fetch(`${origin}/api/blog${path}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (response.status === 404) return null;
      if (response.ok) return response.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Blog service unavailable');
}

export const minutes=(p:BlogPost)=>p.readingMinutes||Math.max(1,Math.ceil((p.sections||[]).map(s=>s.text).join(' ').split(/\s+/).length/180));
export const dateFa=(n:number)=>new Date(n).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'});
