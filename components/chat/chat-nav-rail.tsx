'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserAvatar } from '@/components/chat/user-avatar';
import { CreateSpinnerMenu } from '@/components/chat/create-spinner-menu';
import { InboxShowIcon } from '@/components/chat/inbox-sidebar-toggle';
import { chatEase, chatSpring, staggerDelay } from '@/lib/chat-animations';
import type { CreatePayload } from '@/lib/chat-create-utils';
import { SeungChatIcon } from '@/components/icons/seung-chat-icon';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  Bell,
  Phone,
  Settings,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type NavItemId =
  | 'chat'
  | 'whatsapp'
  | 'contacts'
  | 'phone'
  | 'notifications'
  | 'favorites'
  | 'settings';

type NavIcon = LucideIcon | typeof WhatsAppIcon | typeof SeungChatIcon;

const navItems: { id: NavItemId; icon: NavIcon; label: string }[] = [
  { id: 'chat', icon: SeungChatIcon, label: 'Chat' },
  { id: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'phone', icon: Phone, label: 'Phone' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'favorites', icon: Star, label: 'Favorites' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

type ChatNavRailProps = {
  active?: NavItemId;
  onCreateComplete?: (payload: CreatePayload) => void;
  userInitials?: string;
  unreadCount?: number;
  notificationsActive?: boolean;
  onNotificationsClick?: () => void;
  inboxCollapsed?: boolean;
  onShowInbox?: () => void;
};

export function ChatNavRail({
  active = 'chat',
  onCreateComplete,
  userInitials = 'YU',
  unreadCount = 0,
  notificationsActive = false,
  onNotificationsClick,
  inboxCollapsed = false,
  onShowInbox,
}: ChatNavRailProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  function handleItemClick(itemId: NavItemId) {
    if (itemId === 'notifications') {
      router.push('/seung_chat/notifications');
      onNotificationsClick?.();
      return;
    }
    if (itemId === 'chat') {
      if (inboxCollapsed) {
        onShowInbox?.();
        return;
      }
      router.push('/seung_chat');
      return;
    }
    if (itemId === 'whatsapp') {
      router.push('/seung_chat/whatsapp');
      return;
    }
    if (itemId === 'settings') {
      router.push('/seung_chat/user-profile');
    }
  }

  return (
    <motion.nav
      initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: chatEase }}
      className="flex h-full w-[68px] shrink-0 flex-col items-center overflow-visible border-r border-chat-border bg-chat-nav py-4"
    >
      <div className="flex flex-col items-center gap-1">
        {navItems.slice(0, 3).map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            active={active === item.id}
            index={index}
            inboxCollapsed={item.id === 'chat' ? inboxCollapsed : false}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>

      <CreateSpinnerMenu onComplete={onCreateComplete} />

      <div className="flex flex-col items-center gap-1">
        {navItems.slice(3).map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            active={
              item.id === 'notifications'
                ? notificationsActive || active === 'notifications'
                : active === item.id
            }
            index={index + 3}
            badge={item.id === 'notifications' ? unreadCount : undefined}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3, ease: chatEase }}
        className="mt-auto flex flex-col items-center gap-4"
      >
        <ThemeToggle />
        <Link href="/seung_chat/user-profile" aria-label="Your profile">
          <UserAvatar initials={userInitials} size="sm" showRing className="ring-avatar-ring" />
        </Link>
      </motion.div>
    </motion.nav>
  );
}

function NavButton({
  item,
  active,
  index,
  badge,
  inboxCollapsed = false,
  onClick,
}: {
  item: { id: NavItemId; icon: NavIcon; label: string };
  active: boolean;
  index: number;
  badge?: number;
  inboxCollapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const prefersReducedMotion = useReducedMotion();
  const showInboxIcon = item.id === 'chat' && inboxCollapsed;

  return (
    <motion.button
      type="button"
      aria-label={showInboxIcon ? 'Show recent messages' : item.label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay(index, prefersReducedMotion ?? false), duration: 0.25 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-xl transition-colors',
        active
          ? 'bg-chat-brand-soft text-chat-brand'
          : 'text-chat-subtle hover:bg-chat-muted hover:text-chat-foreground'
      )}
    >
      {active ? (
        <motion.span
          layoutId={prefersReducedMotion ? undefined : 'nav-active-indicator'}
          transition={chatSpring}
          className="absolute -left-[14px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground dark:bg-white"
        />
      ) : null}
      {item.id === 'whatsapp' ? (
        <Icon className="size-[18px] text-[#25D366]" />
      ) : showInboxIcon ? (
        <InboxShowIcon className="size-[18px]" strokeWidth={1.75} />
      ) : item.id === 'chat' ? (
        <Icon className="size-[18px]" />
      ) : (
        <Icon className="size-[18px]" strokeWidth={1.75} />
      )}
      {badge && badge > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-avatar-bg px-1 text-[9px] font-bold text-avatar-fg">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </motion.button>
  );
}
