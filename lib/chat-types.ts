export type ChatReaction = {
  emoji: string;
  count: number;
};

export type ChatAttachment = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export type ChatReplyTarget = {
  id: string;
  senderName: string;
  text: string;
};

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  senderName: string;
  senderInitials: string;
  senderColor?: string;
  text?: string;
  time: string;
  createdAt?: string;
  attachments?: ChatAttachment[];
  replyTo?: ChatReplyTarget;
  readByRecipient?: boolean;
  reactions?: ChatReaction[];
  imageGrid?: string[];
};

export type GroupMember = {
  id: string;
  name: string;
  role?: string;
  initials: string;
  color: string;
};

export type GroupTask = {
  id: string;
  text: string;
  done: boolean;
  starred?: boolean;
};

export type Conversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  lastActivityAt?: string;
  unread?: number;
  typing?: boolean;
  online?: boolean;
  bio?: string;
  type: 'team' | 'direct';
  isGroup?: boolean;
  groupColor?: string;
  initials: string;
  avatarColor: string;
  otherUserId?: string;
  members?: GroupMember[];
  memberCount?: number;
  photoCount?: number;
  tasks?: GroupTask[];
  messages: ChatMessage[];
};

export function getConversation(id: string, list: Conversation[]) {
  return list.find((c) => c.id === id);
}
