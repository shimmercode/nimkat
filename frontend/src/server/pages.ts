import 'server-only';
import type { PublishedPageRecord } from '../types/page-builder';

const rawOrigin = (
  process.env.API_INTERNAL_URL ||
  (process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID
    ? 'https://nimkat-backend.onrender.com'
    : 'http://127.0.0.1:8000')
)
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');
const origin = rawOrigin.startsWith('http://') || rawOrigin.startsWith('https://') ? rawOrigin : `https://${rawOrigin}`;
/** Never fetch draft endpoints or forward administrator credentials for public SSR. */
export async function publicPage(slug: string): Promise<PublishedPageRecord | null> {
  try {
    const response = await fetch(`${origin}/api/pages/${encodeURIComponent(slug)}`, {
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const { page } = await response.json();
    return page?.status === 'published' ? page : null;
  } catch { return null; }
}
export async function publicEntity(kind: 'teachers' | 'classes', id: string) {
  try {
    const response = await fetch(`${origin}/api/${kind}/${encodeURIComponent(id)}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    return response.ok ? response.json() : null;
  } catch { return null; }
}

export async function publicClub(){
 try{const response=await fetch(`${origin}/api/club/catalog`,{cache:'no-store',signal:AbortSignal.timeout(15000)});return response.ok?response.json():null;}catch{return null;}
}

export async function publicTeacherReviews(id:string){
 try{const response=await fetch(`${origin}/api/teachers/${encodeURIComponent(id)}/reviews`,{cache:'no-store',signal:AbortSignal.timeout(15000)});return response.ok?response.json():null;}catch{return null;}
}

export async function publicTeacherAvailability(id:string){
 try{const response=await fetch(`${origin}/api/teachers/${encodeURIComponent(id)}/availability`,{cache:'no-store',signal:AbortSignal.timeout(15000)});return response.ok?response.json():null;}catch{return null;}
}
