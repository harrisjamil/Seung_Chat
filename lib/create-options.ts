import type { LucideIcon } from 'lucide-react';
import {
  Hash,
  Layers,
  Link2,
  MessageSquarePlus,
  MoreHorizontal,
  UserPlus,
  UsersRound,
} from 'lucide-react';

export type CreateActionId =
  | 'connection'
  | 'space'
  | 'group'
  | 'channel'
  | 'invite'
  | 'more';

export type CreateOption = {
  id: CreateActionId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const createOptions: CreateOption[] = [
  {
    id: 'connection',
    label: 'Create connection',
    description: 'Start a direct chat with someone',
    icon: UserPlus,
  },
  {
    id: 'space',
    label: 'Create space',
    description: 'Organize teams, topics & projects',
    icon: Layers,
  },
  {
    id: 'group',
    label: 'New group',
    description: 'Chat with multiple people at once',
    icon: UsersRound,
  },
  {
    id: 'channel',
    label: 'New channel',
    description: 'Broadcast updates to members',
    icon: Hash,
  },
  {
    id: 'invite',
    label: 'Invite link',
    description: 'Share a link to join Seung',
    icon: Link2,
  },
  {
    id: 'more',
    label: 'More options',
    description: 'Templates, imports & more',
    icon: MoreHorizontal,
  },
];

export const FAN_ANGLES = [-75, -45, -15, 15, 45, 75];
export const FAN_RADIUS = 98;
/** Fan widget size; hub sits near the left edge so the arc opens into the inbox. */
export const FAN_SIZE = 248;
export const FAN_HUB_OFFSET_X = 36;
/** Polar origin in SVG viewBox coords (hub is left of widget center). */
export const FAN_HUB_SVG_X = FAN_HUB_OFFSET_X - FAN_SIZE / 2;

export const moreSubOptions = [
  { id: 'template', label: 'From template', icon: MessageSquarePlus },
  { id: 'import', label: 'Import chats', icon: Layers },
  { id: 'bot', label: 'Add bot / webhook', icon: Link2 },
] as const;

export function polarPosition(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

/** Fan action button diameter (`size-11`). */
export const FAN_ICON_SIZE = 44;
export const FAN_LABEL_GAP = 12;

/** Hover label anchor: just outside the icon along the spoke. */
export function fanLabelAnchor(angleDeg: number) {
  const radius = FAN_RADIUS + FAN_ICON_SIZE / 2 + FAN_LABEL_GAP;
  return polarPosition(angleDeg, radius);
}

/** CSS translate so the card sits beyond the icon, not on top of it. */
export function fanLabelTranslate(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  if (c > 0.2) return '0 -50%';
  if (c < -0.2) return '-100% -50%';
  const s = Math.sin(rad);
  if (s > 0.2) return '-50% 0';
  if (s < -0.2) return '-50% -100%';
  return '0 -50%';
}
