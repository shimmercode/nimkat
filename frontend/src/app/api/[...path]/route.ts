import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Only forward safe application-level headers to the backend.
 * Never forward Cloudflare (cf-*), Render (rndr-*, x-render-*), or proxy hop headers
 * (via, forwarded, x-forwarded-*, true-client-ip, cdn-loop), which trigger 502/508
 * loop detection when calling another *.onrender.com service.
 */
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

/**
 * Only copy safe HTTP/2-compatible response headers from upstream.
 * Forwarding hop-by-hop headers like `connection: keep-alive` or `keep-alive: timeout=65`
 * violates RFC 9113 §8.2.2 (HTTP/2) and causes Cloudflare/Render edge proxies to return 502.
 */
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

function resolveTargetOrigin(): string {
  const raw =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID
      ? 'https://nimkat-backend.onrender.com'
      : 'http://127.0.0.1:8000');
  const trimmed = raw.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function proxy(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const targetOrigin = resolveTargetOrigin();
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

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

  const isRemote = Boolean(process.env.RENDER || targetOrigin.includes('.onrender.com'));
  const maxAttempts = isRemote ? 5 : 2;
  let upstreamRes: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      upstreamRes = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: forwardHeaders,
        body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
        redirect: 'manual',
        cache: 'no-store',
      });

      if (
        attempt < maxAttempts - 1 &&
        [502, 503, 504, 520, 521, 522, 523, 524].includes(upstreamRes.status)
      ) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      break;
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      return Response.json(
        { error: 'در حال اتصال به سرور نیمکت؛ لطفاً چند ثانیه دیگر دوباره تلاش کنید.' },
        { status: 503, headers: { 'Retry-After': '3' } }
      );
    }
  }

  if (!upstreamRes) {
    return Response.json(
      { error: 'در حال اتصال به سرور نیمکت؛ لطفاً دوباره تلاش کنید.' },
      { status: 503 }
    );
  }

  const contentType = upstreamRes.headers.get('content-type') || '';
  if (upstreamRes.status >= 502 && !contentType.includes('application/json')) {
    return Response.json(
      { error: 'سرور بک‌اند در حال راه‌اندازی مجدد است؛ لطفاً چند ثانیه دیگر تلاش کنید.' },
      { status: 503, headers: { 'Retry-After': '3' } }
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
