import { NextResponse } from 'next/server';
import { getSessionUser, type SessionUser } from '@/lib/auth-session';

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function requireApiUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return user;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
