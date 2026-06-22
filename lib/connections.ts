import { db } from '@/lib/db';
import { NotificationType } from '@/lib/generated/prisma/enums';

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? undefined,
    },
  });
}

export function orderedUserPair(a: string, b: string) {
  return a < b ? ([a, b] as const) : ([b, a] as const);
}
