import 'server-only';
import type { PublishedPageRecord } from '../types/page-builder';

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

async function fetchFromCandidates(apiPath: string): Promise<Response | null> {
  for (const origin of getCandidateOrigins()) {
    try {
      const res = await fetch(`${origin}${apiPath}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok || res.status === 404) return res;
    } catch {
      continue;
    }
  }
  return null;
}

/** Never fetch draft endpoints or forward administrator credentials for public SSR. */
export async function publicPage(slug: string): Promise<PublishedPageRecord | null> {
  try {
    const response = await fetchFromCandidates(`/api/pages/${encodeURIComponent(slug)}`);
    if (!response || !response.ok) return null;
    const { page } = await response.json();
    return page?.status === 'published' ? page : null;
  } catch {
    return null;
  }
}

export async function publicEntity(kind: 'teachers' | 'classes', id: string) {
  try {
    const response = await fetchFromCandidates(`/api/${kind}/${encodeURIComponent(id)}`);
    return response && response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

export async function publicClub() {
  try {
    const response = await fetchFromCandidates('/api/club/catalog');
    return response && response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

export async function publicTeacherReviews(id: string) {
  try {
    const response = await fetchFromCandidates(`/api/teachers/${encodeURIComponent(id)}/reviews`);
    return response && response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

export async function publicTeacherAvailability(id: string) {
  try {
    const response = await fetchFromCandidates(`/api/teachers/${encodeURIComponent(id)}/availability`);
    return response && response.ok ? response.json() : null;
  } catch {
    return null;
  }
}
