import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';
import { initialsFromName, avatarColorFromId } from '@/lib/user-display';

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const users = await db.user.findMany({
    where: {
      id: { not: auth.id },
      fullName: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, fullName: true, email: true },
    take: 8,
    orderBy: { fullName: 'asc' },
  });

  const enriched = await Promise.all(
    users.map(async (user) => {
      const existing = await db.connectionRequest.findFirst({
        where: {
          OR: [
            { fromUserId: auth.id, toUserId: user.id },
            { fromUserId: user.id, toUserId: auth.id },
          ],
        },
        select: { id: true, status: true, fromUserId: true },
      });

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        initials: initialsFromName(user.fullName),
        avatarColor: avatarColorFromId(user.id),
        connection: existing
          ? {
              id: existing.id,
              status: existing.status,
              direction: existing.fromUserId === auth.id ? 'outgoing' : 'incoming',
            }
          : null,
      };
    })
  );

  return NextResponse.json({ users: enriched });
}
