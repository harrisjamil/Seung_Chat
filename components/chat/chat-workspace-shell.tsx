'use client';

import { ChatNavRail } from '@/components/chat/chat-nav-rail';
import type { CreatePayload } from '@/lib/chat-create-utils';

type ChatWorkspaceShellProps = {
  children: React.ReactNode;
  active?:
    | 'chat'
    | 'whatsapp'
    | 'contacts'
    | 'phone'
    | 'notifications'
    | 'favorites'
    | 'settings';
  userInitials?: string;
  unreadCount?: number;
  notificationsActive?: boolean;
  onNotificationsClick?: () => void;
  onCreateComplete?: (payload: CreatePayload) => void;
  inboxCollapsed?: boolean;
  onShowInbox?: () => void;
};

export function ChatWorkspaceShell({
  children,
  active = 'chat',
  userInitials = 'YU',
  unreadCount = 0,
  notificationsActive = false,
  onNotificationsClick,
  onCreateComplete,
  inboxCollapsed = false,
  onShowInbox,
}: ChatWorkspaceShellProps) {
  const navRailProps = {
    active,
    userInitials,
    unreadCount,
    notificationsActive,
    onNotificationsClick,
    onCreateComplete,
    inboxCollapsed,
    onShowInbox,
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-chat-main text-chat-foreground">
      <div className="hidden sm:flex">
        <ChatNavRail {...navRailProps} />
      </div>
      <div className="flex sm:hidden">
        <ChatNavRail {...navRailProps} />
      </div>
      <div className="flex h-full min-w-0 flex-1">{children}</div>
    </div>
  );
}
