import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getSessionUser,
  SESSION_COOKIE,
  refreshSession,
  sessionCookieOptions,
} from '@/lib/auth-session';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const response = NextResponse.json({ user });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    const expiresAt = await refreshSession(token);
    if (expiresAt) {
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    }
  }
  return response;
}
