import { NextResponse } from 'next/server';
import { getLoginAlertStatus } from '@/lib/login-alert';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth-session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.json({ status: 'invalid' }, { status: 400 });
  }

  const result = await getLoginAlertStatus(token);

  if (result.status === 'confirmed') {
    const response = NextResponse.json({
      status: 'confirmed',
      user: null,
    });
    response.cookies.set(
      SESSION_COOKIE,
      result.sessionToken,
      sessionCookieOptions(result.expiresAt)
    );
    return response;
  }

  return NextResponse.json({ status: result.status });
}
