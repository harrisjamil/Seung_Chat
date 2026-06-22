import type { Conversation, ChatMessage } from '@/lib/chat-types';
import {
  avatarColorFromId,
  formatRelativeTime,
  initialsFromName,
} from '@/lib/user-display';
import { decodeMessagePayload } from '@/lib/message-attachments';

type UserPick = { id: string; fullName: string; email: string };

type ConversationRow = {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: Date;
  messages: {
    id: string;
    senderId: string;
    text: string;
    createdAt: Date;
    readAt: Date | null;
    sender: { id: string; fullName: string };
  }[];
};

export function mapDirectConversation(
  row: ConversationRow,
  currentUserId: string,
  other: UserPick
): Conversation {
  const messages: ChatMessage[] = row.messages.map((m) => {
    const isMe = m.senderId === currentUserId;
    const payload = decodeMessagePayload(m.text);
    return {
      id: m.id,
      from: isMe ? 'me' : 'them',
      senderName: m.sender.fullName,
      senderInitials: initialsFromName(m.sender.fullName),
      text: payload.text,
      attachments: payload.attachments,
      replyTo: payload.replyTo ?? undefined,
      readByRecipient: isMe ? Boolean(m.readAt) : undefined,
      createdAt: m.createdAt.toISOString(),
      time: formatRelativeTime(m.createdAt),
    };
  });

  const last = row.messages[row.messages.length - 1];
  const lastPayload = last ? decodeMessagePayload(last.text) : null;
  const lastPreview =
    lastPayload?.text ||
    (lastPayload?.attachments?.some((a) => a.type.startsWith('image/'))
      ? 'Photo'
      : lastPayload?.attachments?.length
        ? `Attachment (${lastPayload.attachments.length})`
        : '');

  return {
    id: row.id,
    name: other.fullName,
    preview: lastPreview || 'Start with a greeting.',
    time: formatRelativeTime(last?.createdAt ?? row.updatedAt),
    lastActivityAt: (last?.createdAt ?? row.updatedAt).toISOString(),
    type: 'direct',
    online: false,
    bio: `Direct message · ${other.email}`,
    initials: initialsFromName(other.fullName),
    avatarColor: avatarColorFromId(other.id),
    otherUserId: other.id,
    messages,
  };
}
