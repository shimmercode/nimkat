import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HOP_AND_CF_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-length',
  'accept-encoding',
  'cf-ray',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-visitor',
  'cf-ew-via',
  'cf-worker',
  'cdn-loop',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-render-routing',
]);

function resolveTargetOrigin(): string {
  const raw =
    process.env.API_INTERNAL_URL ||
    (process.env.RENDER ? 'https://nimkat-backend.onrender.com' : 'http://127.0.0.1:8000');
  return raw.replace(/\/+$/, '');
}

async function proxy(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const targetOrigin = resolveTargetOrigin();
  const targetUrl = new URL(`/api/${path.join('/')}${req.nextUrl.search}`, targetOrigin);

  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_AND_CF_HEADERS.has(lower)) {
      forwardHeaders.set(key, value);
    }
  });

  const incomingOrigin = req.headers.get('origin');
  if (incomingOrigin) {
    try {
      const parsedOrigin = new URL(incomingOrigin);
      const allowedFrontendHosts = [
        req.headers.get('host'),
        req.headers.get('x-forwarded-host'),
        req.nextUrl.host,
      ].filter(Boolean);
      if (allowedFrontendHosts.includes(parsedOrigin.host)) {
        forwardHeaders.set('origin', targetUrl.origin);
      }
    } catch {
      // Keep original header if malformed
    }
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

  let upstreamRes: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      upstreamRes = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: forwardHeaders,
        body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
        redirect: 'manual',
        cache: 'no-store',
      });
      if (attempt === 0 && [502, 503, 504].includes(upstreamRes.status) && process.env.RENDER) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      break;
    } catch (err) {
      if (attempt === 0 && process.env.RENDER) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return Response.json(
        { error: 'ارتباط با سرور بک‌اند برقرار نشد؛ چند ثانیه صبر کنید تا سرور بیدار شود و دوباره تلاش کنید.' },
        { status: 502 }
      );
    }
  }

  if (!upstreamRes) {
    return Response.json(
      { error: 'ارتباط با سرور بک‌اند برقرار نشد؛ دوباره تلاش کنید.' },
      { status: 502 }
    );
  }

  const resHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== 'set-cookie' && lower !== 'content-encoding' && lower !== 'content-length' && lower !== 'transfer-encoding') {
      resHeaders.set(key, value);
    }
  });

  const setCookies =
    typeof (upstreamRes.headers as any).getSetCookie === 'function'
      ? (upstreamRes.headers as any).getSetCookie()
      : [];
  for (const cookie of setCookies) {
    resHeaders.append('set-cookie', cookie);
  }

  return new Response(upstreamRes.body, {
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
