import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  const notifications = await db.notification.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });

  const unreadCount = await db.notification.count({
    where: { userId: auth.id, read: false },
  });

  const serialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    data: (n.data as Record<string, string> | null) ?? null,
  }));

  return NextResponse.json({ notifications: serialized, unreadCount });
}
