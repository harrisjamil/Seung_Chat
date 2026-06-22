import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-session';
import { getConversationForUser } from '@/lib/conversation-access';
import { serializeMessage } from '@/lib/message-mapper';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id: conversationId } = await context.params;
  const conversation = await getConversationForUser(conversationId, user.id);
  if (!conversation) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  let lastSeen = new Date();
  let lastReadSeen = new Date(0);

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const closeStream = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Client already disconnected.
        }
      };

      const send = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closeStream();
        }
      };

      send({ type: 'connected' });

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          await db.directMessage.updateMany({
            where: {
              conversationId,
              senderId: { not: user.id },
              readAt: null,
            },
            data: { readAt: new Date() },
          });

          const readUpdates = await db.directMessage.findMany({
            where: {
              conversationId,
              senderId: user.id,
              readAt: { not: null, gt: lastReadSeen },
            },
            orderBy: { readAt: 'asc' },
            select: { id: true, readAt: true },
          });
          if (readUpdates.length > 0) {
            lastReadSeen = readUpdates[readUpdates.length - 1]!.readAt!;
            for (const update of readUpdates) {
              send({ type: 'read', messageId: update.id });
            }
          }

          const messages = await db.directMessage.findMany({
            where: {
              conversationId,
              createdAt: { gt: lastSeen },
            },
            orderBy: { createdAt: 'asc' },
            include: {
              sender: { select: { id: true, fullName: true } },
            },
          });

          if (messages.length > 0) {
            lastSeen = messages[messages.length - 1]!.createdAt;
            for (const row of messages) {
              send({
                type: 'message',
                message: serializeMessage(row, user.id),
              });
            }
          }
        } catch {
          closeStream();
        }
      }, 1500);

      request.signal.addEventListener('abort', closeStream);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
