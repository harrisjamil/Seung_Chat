import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';
import { createNotification } from '@/lib/connections';
import { NotificationType } from '@/lib/generated/prisma/enums';

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const toUserId = String(body.toUserId ?? '');

    if (!toUserId) {
      return NextResponse.json({ error: 'User is required.' }, { status: 400 });
    }

    if (toUserId === auth.id) {
      return NextResponse.json({ error: 'You cannot connect with yourself.' }, { status: 400 });
    }

    const target = await db.user.findUnique({
      where: { id: toUserId },
      select: { id: true, fullName: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const existing = await db.connectionRequest.findMany({
      where: {
        OR: [
          { fromUserId: auth.id, toUserId },
          { fromUserId: toUserId, toUserId: auth.id },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    const outgoing = existing.find(
      (item) => item.fromUserId === auth.id && item.toUserId === toUserId
    );
    const incoming = existing.find(
      (item) => item.fromUserId === toUserId && item.toUserId === auth.id
    );

    if (outgoing?.status === 'PENDING' || incoming?.status === 'PENDING') {
      return NextResponse.json(
        { error: 'A connection request is already pending.' },
        { status: 409 }
      );
    }

    if (outgoing?.status === 'ACCEPTED' || incoming?.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'You are already connected.' }, { status: 409 });
    }

    let connection;
    if (outgoing?.status === 'REJECTED') {
      connection = await db.connectionRequest.update({
        where: { id: outgoing.id },
        data: { status: 'PENDING' },
      });
    } else {
      connection = await db.connectionRequest.create({
        data: { fromUserId: auth.id, toUserId },
      });
    }

    await createNotification({
      userId: toUserId,
      type: NotificationType.CONNECTION_REQUEST,
      title: 'New connection request',
      body: `${auth.fullName} wants to connect with you.`,
      data: {
        connectionRequestId: connection.id,
        fromUserId: auth.id,
        fromUserName: auth.fullName,
      },
    });

    return NextResponse.json({
      connection: { id: connection.id, status: connection.status },
    });
  } catch {
    return NextResponse.json({ error: 'Could not send request.' }, { status: 500 });
  }
}
