import type { ChatMessage } from '@/lib/chat-types';
import { formatRelativeTime, initialsFromName } from '@/lib/user-display';
import { decodeMessagePayload } from '@/lib/message-attachments';

export type MessageRow = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { id: string; fullName: string };
};

export function mapMessage(row: MessageRow, currentUserId: string): ChatMessage {
  const isMe = row.senderId === currentUserId;
  const payload = decodeMessagePayload(row.text);
  return {
    id: row.id,
    from: isMe ? 'me' : 'them',
    senderName: isMe ? 'You' : row.sender.fullName,
    senderInitials: initialsFromName(row.sender.fullName),
    text: payload.text,
    attachments: payload.attachments,
    replyTo: payload.replyTo ?? undefined,
    readByRecipient: isMe ? Boolean(row.readAt) : undefined,
    createdAt: row.createdAt.toISOString(),
    time: formatRelativeTime(row.createdAt),
  };
}

export function serializeMessage(row: MessageRow, currentUserId: string) {
  return {
    ...mapMessage(row, currentUserId),
    createdAt: row.createdAt.toISOString(),
    senderId: row.senderId,
  };
}
