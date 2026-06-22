import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';
import { getConversationForUser } from '@/lib/conversation-access';
import { serializeMessage } from '@/lib/message-mapper';
import { encodeMessagePayload } from '@/lib/message-attachments';
import type { ChatAttachment, ChatReplyTarget } from '@/lib/chat-types';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  const { id: conversationId } = await context.params;

  try {
    const conversation = await getConversationForUser(conversationId, auth.id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const body = await request.json();
    const text = String(body.text ?? '').trim();
    const attachments = (Array.isArray(body.attachments) ? body.attachments : []) as ChatAttachment[];
    const replyTo = (body.replyTo ?? null) as ChatReplyTarget | null;
    const safeAttachments = attachments
      .map((item) => ({
        name: String(item?.name ?? '').slice(0, 120),
        type: String(item?.type ?? 'application/octet-stream').slice(0, 120),
        size: Number(item?.size ?? 0),
        dataUrl: String(item?.dataUrl ?? ''),
      }))
      .filter((item) => item.name && item.dataUrl);

    if (!text && safeAttachments.length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    if (safeAttachments.length > 10) {
      return NextResponse.json({ error: 'Too many attachments.' }, { status: 400 });
    }

    const textToStore = encodeMessagePayload(text, safeAttachments, replyTo);

    const message = await db.$transaction(async (tx) => {
      const created = await tx.directMessage.create({
        data: {
          conversationId,
          senderId: auth.id,
          text: textToStore,
        },
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      });

      await tx.directConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json({
      message: serializeMessage(message, auth.id),
    });
  } catch {
    return NextResponse.json({ error: 'Could not send message.' }, { status: 500 });
  }
}
