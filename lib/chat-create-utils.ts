import type { CreateActionId } from '@/lib/create-options';
import type { Conversation } from '@/lib/chat-types';

export type CreatePayload = {
  action: CreateActionId;
  name: string;
  email?: string;
  detail?: string;
  visibility?: 'Public' | 'Private';
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'SC';
}

function slugId(prefix: string, name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug || 'new'}-${Date.now().toString(36)}`;
}

export function buildConversationFromCreate(payload: CreatePayload): Conversation {
  const displayName =
    payload.name.trim() ||
    (payload.action === 'connection' ? payload.email?.split('@')[0] ?? 'New chat' : 'Untitled');

  if (payload.action === 'connection') {
    const now = new Date().toISOString();
    return {
      id: slugId('dm', displayName),
      name: displayName,
      preview: 'Start with a greeting.',
      time: 'Now',
      lastActivityAt: now,
      type: 'direct',
      online: true,
      bio: payload.email ? `Direct message · ${payload.email}` : 'Direct message',
      initials: initialsFromName(displayName),
      avatarColor: '#737373',
      messages: [],
    };
  }

  if (payload.action === 'group') {
    const now = new Date().toISOString();
    return {
      id: slugId('group', displayName),
      name: displayName,
      preview: 'Group created · Add your first message',
      time: 'Now',
      lastActivityAt: now,
      type: 'team',
      isGroup: true,
      memberCount: 2,
      initials: initialsFromName(displayName),
      avatarColor: '#525252',
      members: [
        { id: 'you', name: 'You', role: 'Admin', initials: 'YU', color: '#737373' },
      ],
      messages: [],
    };
  }

  if (payload.action === 'space') {
    const now = new Date().toISOString();
    return {
      id: slugId('space', displayName),
      name: displayName,
      preview: payload.detail?.trim() || 'New space · Organize your work here',
      time: 'Now',
      lastActivityAt: now,
      type: 'team',
      isGroup: true,
      memberCount: 1,
      initials: initialsFromName(displayName),
      avatarColor: '#404040',
      messages: [],
    };
  }

  const now = new Date().toISOString();
  return {
    id: slugId('channel', displayName.startsWith('#') ? displayName.slice(1) : displayName),
    name: displayName.startsWith('#') ? displayName : `# ${displayName}`,
    preview:
      payload.detail?.trim() ||
      `${payload.visibility ?? 'Public'} channel · Share updates with members`,
    time: 'Now',
    lastActivityAt: now,
    type: 'team',
    isGroup: true,
    initials: displayName.replace('#', '').slice(0, 2).toUpperCase() || 'CH',
    avatarColor: '#525252',
    messages: [],
  };
}
