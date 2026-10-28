import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_REQUEST_HEADERS = [
  'cookie',
  'content-type',
  'accept',
  'accept-language',
  'x-csrf-token',
  'x-support-token',
  'authorization',
  'idempotency-key',
  'x-idempotency-key',
];

const ALLOWED_RESPONSE_HEADERS = [
  'content-type',
  'cache-control',
  'content-disposition',
  'retry-after',
  'etag',
  'last-modified',
  'location',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
];

function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getTargetCandidates(): string[] {
  const localOrigin = `http://127.0.0.1:${process.env.BACKEND_INTERNAL_PORT || '8000'}`;
  const configured = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
  if (configured) {
    const norm = normalizeOrigin(configured);
    if (norm.includes('127.0.0.1') || norm.includes('localhost')) {
      return [norm];
    }
    return [localOrigin, norm];
  }
  if (process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID) {
    return [localOrigin, 'https://nimkat-backend.onrender.com'];
  }
  return [localOrigin];
}

async function proxy(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const candidates = getTargetCandidates();

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

  let upstreamRes: Response | null = null;

  for (const targetOrigin of candidates) {
    const targetUrl = new URL(`/api/${path.join('/')}${req.nextUrl.search}`, targetOrigin);

    const forwardHeaders = new Headers();
    for (const name of ALLOWED_REQUEST_HEADERS) {
      const val = req.headers.get(name);
      if (val) forwardHeaders.set(name, val);
    }
    forwardHeaders.set('user-agent', 'Nimkat-Next-Proxy/1.0');

    if (req.headers.get('origin')) {
      forwardHeaders.set('origin', targetUrl.origin);
    }

    try {
      const res = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: forwardHeaders,
        body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
        redirect: 'manual',
        cache: 'no-store',
      });

      const ct = res.headers.get('content-type') || '';
      if (res.status >= 502 && !ct.includes('application/json') && candidates.length > 1) {
        continue;
      }
      upstreamRes = res;
      break;
    } catch {
      continue;
    }
  }

  if (!upstreamRes) {
    return Response.json(
      { error: 'در حال اتصال به سرور نیمکت؛ لطفاً چند ثانیه دیگر دوباره تلاش کنید.' },
      { status: 503, headers: { 'Retry-After': '2' } }
    );
  }

  const contentType = upstreamRes.headers.get('content-type') || '';
  if (upstreamRes.status >= 502 && !contentType.includes('application/json')) {
    return Response.json(
      { error: 'سرور بک‌اند در حال راه‌اندازی مجدد است؛ لطفاً چند ثانیه دیگر تلاش کنید.' },
      { status: 503, headers: { 'Retry-After': '2' } }
    );
  }

  const resHeaders = new Headers();
  for (const name of ALLOWED_RESPONSE_HEADERS) {
    const val = upstreamRes.headers.get(name);
    if (val) resHeaders.set(name, val);
  }

  const setCookies =
    typeof (upstreamRes.headers as any).getSetCookie === 'function'
      ? (upstreamRes.headers as any).getSetCookie()
      : [];
  for (const cookie of setCookies) {
    resHeaders.append('set-cookie', cookie);
  }

  const responseBuffer = req.method === 'HEAD' ? null : await upstreamRes.arrayBuffer();

  return new Response(responseBuffer, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
