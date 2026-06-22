import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';
import { createNotification, orderedUserPair } from '@/lib/connections';
import { NotificationType } from '@/lib/generated/prisma/enums';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const action = body.action as 'accept' | 'reject';

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const connection = await db.connectionRequest.findUnique({
      where: { id },
      include: {
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    if (connection.toUserId !== auth.id) {
      return NextResponse.json({ error: 'Only the recipient can respond.' }, { status: 403 });
    }

    if (connection.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already handled.' }, { status: 409 });
    }

    if (action === 'reject') {
      await db.connectionRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await createNotification({
        userId: connection.fromUserId,
        type: NotificationType.CONNECTION_REJECTED,
        title: 'Connection declined',
        body: `${auth.fullName} declined your connection request.`,
        data: { connectionRequestId: id },
      });

      return NextResponse.json({ status: 'REJECTED' });
    }

    const [userAId, userBId] = orderedUserPair(connection.fromUserId, connection.toUserId);

    const result = await db.$transaction(async (tx) => {
      await tx.connectionRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });

      const conversation = await tx.directConversation.create({
        data: {
          connectionRequestId: id,
          userAId,
          userBId,
        },
      });

      return conversation;
    });

    await createNotification({
      userId: connection.fromUserId,
      type: NotificationType.CONNECTION_ACCEPTED,
      title: 'Connection accepted',
      body: `${auth.fullName} accepted your request. You can chat now.`,
      data: {
        connectionRequestId: id,
        conversationId: result.id,
      },
    });

    return NextResponse.json({
      status: 'ACCEPTED',
      conversationId: result.id,
    });
  } catch {
    return NextResponse.json({ error: 'Could not update request.' }, { status: 500 });
  }
}
