import { db } from '@/lib/db';

export async function getConversationForUser(conversationId: string, userId: string) {
  return db.directConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
}
