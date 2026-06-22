import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';
import { mapDirectConversation } from '@/lib/conversation-mapper';

export async function GET() {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  const rows = await db.directConversation.findMany({
    where: {
      OR: [{ userAId: auth.id }, { userBId: auth.id }],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const otherIds = rows.map((row) => (row.userAId === auth.id ? row.userBId : row.userAId));
  const others = await db.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, fullName: true, email: true },
  });
  const otherById = new Map(others.map((u) => [u.id, u]));

  const conversations = rows
    .map((row) => {
      const otherId = row.userAId === auth.id ? row.userBId : row.userAId;
      const other = otherById.get(otherId);
      if (!other) return null;
      return mapDirectConversation(row, auth.id, other);
    })
    .filter(Boolean);

  return NextResponse.json({ conversations });
}
