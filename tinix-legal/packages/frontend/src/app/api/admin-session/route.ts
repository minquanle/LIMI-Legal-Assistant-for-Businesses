import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
  isAdminAuthConfigured,
  issueSessionToken,
  verifyAdminKey,
  verifySessionToken,
} from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — report whether the current browser holds a valid admin session. */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: isAdminAuthConfigured(),
    authenticated: verifySessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value),
  });
}

/** POST — exchange the admin key for an httpOnly session cookie. */
export async function POST(req: NextRequest) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: 'ServerMisconfigured', message: 'ADMIN_SECRET_KEY chưa được cấu hình trên máy chủ.' },
      { status: 500 },
    );
  }

  let key = '';
  try {
    const body = await req.json();
    key = typeof body?.key === 'string' ? body.key : '';
  } catch {
    return NextResponse.json(
      { error: 'BadRequest', message: 'Nội dung yêu cầu không hợp lệ.' },
      { status: 400 },
    );
  }

  if (!verifyAdminKey(key)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Khóa quản trị không đúng.' },
      { status: 401 },
    );
  }

  const token = issueSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: 'ServerMisconfigured', message: 'Không thể tạo phiên quản trị.' },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);
  return res;
}

/** DELETE — sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
