import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export const SESSION_COOKIE = 'seung_session';
const SESSION_DAYS = 30;
const SHORT_SESSION_DAYS = 1;

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
};

export async function createSession(userId: string, rememberMe = true) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = buildSessionExpiry(rememberMe);

  const session = await db.session.create({
    data: { userId, token, expiresAt },
    select: { id: true },
  });

  return { token, expiresAt, sessionId: session.id };
}

export function sessionCookieOptions(expiresAt: Date) {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
    expires: expiresAt,
  };
}

export function buildSessionExpiry(rememberMe = true) {
  const days = rememberMe ? SESSION_DAYS : SHORT_SESSION_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  return session.user;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function deleteSessionByToken(token: string) {
  await db.session.deleteMany({ where: { token } });
}

export async function deleteSessionById(sessionId: string) {
  await db.session.deleteMany({ where: { id: sessionId } });
}

export async function refreshSession(token: string) {
  const expiresAt = buildSessionExpiry(true);
  const session = await db.session.updateMany({
    where: { token },
    data: { expiresAt },
  });

  if (session.count === 0) {
    return null;
  }

  return expiresAt;
}
