import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastSeen = new Date();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: 'connected' });

      const interval = setInterval(async () => {
        try {
          const notifications = await db.notification.findMany({
            where: {
              userId: user.id,
              createdAt: { gt: lastSeen },
            },
            orderBy: { createdAt: 'asc' },
          });

          if (notifications.length > 0) {
            lastSeen = notifications[notifications.length - 1]!.createdAt;
            for (const notification of notifications) {
              send({
                type: 'notification',
                notification: {
                  ...notification,
                  createdAt: notification.createdAt.toISOString(),
                  data: (notification.data as Record<string, string> | null) ?? null,
                },
              });
            }
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
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
