import type { ChatMessage } from '@/lib/chat-types';
import { initialsFromName } from '@/lib/user-display';

export type WhatsAppChat = {
  id: string;
  name: string;
  unreadCount: number;
  timestamp: number | null;
  lastMessage: string;
  isGroup: boolean;
  isChannel: boolean;
  isCommunity: boolean;
  pinned: boolean;
  archived: boolean;
  lastMessageFromMe: boolean;
  profilePicUrl: string | null;
};

export type WhatsAppMessage = {
  id: string;
  fromMe: boolean;
  body: string;
  timestamp: number | null;
  author: string | null;
  authorName: string | null;
  authorProfilePicUrl: string | null;
  type: string;
};

export function mapWhatsAppMessageToChatMessage(
  message: WhatsAppMessage,
  chatName: string,
  isGroup: boolean
): ChatMessage {
  const senderLabel = message.fromMe
    ? 'You'
    : message.authorName || message.author?.split('@')[0] || chatName;
  const createdAt = message.timestamp
    ? new Date(message.timestamp * 1000).toISOString()
    : undefined;

  return {
    id: message.id,
    from: message.fromMe ? 'me' : 'them',
    senderName: isGroup && !message.fromMe ? senderLabel : senderLabel,
    senderInitials: initialsFromName(senderLabel),
    text: message.body,
    createdAt,
    time: message.timestamp
      ? new Date(message.timestamp * 1000).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : '',
    readByRecipient: message.fromMe ? true : undefined,
  };
}
