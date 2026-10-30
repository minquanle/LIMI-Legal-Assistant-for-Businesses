import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  getBackendAdminKey,
  verifySessionToken,
} from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_BASE =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

/**
 * Server-side proxy for admin-guarded backend endpoints.
 *
 * The browser never sees ADMIN_SECRET_KEY: it presents the httpOnly session
 * cookie, this handler verifies it, and only then attaches the real key on the
 * hop to the backend. Without a valid session the request is rejected here, so
 * the proxy cannot be used as an open bypass.
 */
async function forward(req: NextRequest, pathSegments: string[]) {
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Phiên quản trị không hợp lệ hoặc đã hết hạn.' },
      { status: 401 },
    );
  }

  const adminKey = getBackendAdminKey();
  if (!adminKey) {
    return NextResponse.json(
      { error: 'ServerMisconfigured', message: 'ADMIN_SECRET_KEY chưa được cấu hình trên máy chủ.' },
      { status: 500 },
    );
  }

  // Rebuild the downstream URL, preserving the query string.
  const suffix = pathSegments.map(encodeURIComponent).join('/');
  const target = `${BACKEND_BASE.replace(/\/$/, '')}/${suffix}${req.nextUrl.search}`;

  const headers: Record<string, string> = { 'x-admin-key': adminKey };
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: 'no-store',
    });

    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err) {
    console.error('[admin-proxy] upstream request failed:', target, err);
    return NextResponse.json(
      { error: 'BadGateway', message: 'Không thể kết nối tới máy chủ API.' },
      { status: 502 },
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return forward(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  return forward(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return forward(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return forward(req, (await ctx.params).path);
}
