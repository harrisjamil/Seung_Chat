'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { WhatsAppAvatar } from '@/components/whatsapp/whatsapp-avatar';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { formatWhatsAppListTime } from '@/lib/whatsapp-message-utils';
import type { WhatsAppChat } from '@/lib/whatsapp-conversation-mapper';
import { chatSpring } from '@/lib/chat-animations';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export type WhatsAppFilter = 'all' | 'unread' | 'favourites' | 'groups';

type WhatsAppChatListProps = {
  chats: WhatsAppChat[];
  activeId: string | null;
  searchQuery: string;
  filter: WhatsAppFilter;
  loading?: boolean;
  onSelect: (id: string) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: WhatsAppFilter) => void;
  onRefresh?: () => void;
};

const filters: { id: WhatsAppFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'favourites', label: 'Pinned' },
  { id: 'groups', label: 'Groups' },
];

function filterChats(chats: WhatsAppChat[], filter: WhatsAppFilter, query: string) {
  let list = chats.filter((chat) => !chat.archived);

  if (filter === 'unread') list = list.filter((chat) => chat.unreadCount > 0);
  if (filter === 'favourites') list = list.filter((chat) => chat.pinned);
  if (filter === 'groups') {
    list = list.filter((chat) => chat.isGroup || chat.isCommunity || chat.isChannel);
  }

  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (chat) =>
        chat.name.toLowerCase().includes(q) || chat.lastMessage.toLowerCase().includes(q)
    );
  }

  return list;
}

export function WhatsAppChatList({
  chats,
  activeId,
  searchQuery,
  filter,
  loading = false,
  onSelect,
  onSearchChange,
  onFilterChange,
  onRefresh,
}: WhatsAppChatListProps) {
  const prefersReducedMotion = useReducedMotion();
  const visibleChats = filterChats(chats, filter, searchQuery);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col bg-chat-inbox sm:w-[300px] lg:w-[320px]">
      <header className="border-b border-chat-border px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#25D366]/15">
              <WhatsAppIcon className="size-[18px] text-[#25D366]" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-chat-foreground">WhatsApp Bridge</h1>
              <p className="flex items-center gap-1.5 text-[11px] text-chat-subtle">
                <span className="size-1.5 rounded-full bg-[#25D366]" />
                Connected
              </p>
            </div>
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh chats"
              className="flex size-8 items-center justify-center rounded-lg text-chat-subtle transition-colors hover:bg-chat-muted hover:text-chat-foreground"
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </button>
          ) : null}
        </div>

        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-chat-subtle"
            strokeWidth={2}
          />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats…"
            className="h-10 rounded-xl border-chat-border bg-chat-muted pl-10 pr-3 text-sm text-chat-foreground shadow-none placeholder:text-chat-subtle focus-visible:border-foreground focus-visible:ring-foreground/20 dark:focus-visible:border-white dark:focus-visible:ring-white/20"
          />
        </div>

        <div className="mt-3 flex gap-1 border-b border-chat-border">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={cn(
                'relative px-3 pb-2.5 text-xs font-medium transition-colors',
                filter === item.id
                  ? 'text-chat-foreground'
                  : 'text-chat-subtle hover:text-chat-foreground'
              )}
            >
              {item.label}
              {filter === item.id ? (
                <motion.span
                  layoutId={prefersReducedMotion ? undefined : 'wa-filter-indicator'}
                  transition={chatSpring}
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[#25D366]"
                />
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div
            className={cn(
              'flex items-center justify-center gap-2 text-sm text-chat-subtle',
              chats.length === 0 ? 'absolute inset-0 flex-col py-10' : 'border-b border-chat-border px-4 py-3'
            )}
          >
            <Loader2 className="size-5 animate-spin text-[#25D366]" />
            <span>Loading chats…</span>
          </div>
        ) : null}

        {!loading && visibleChats.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-chat-subtle">
            {filter === 'groups'
              ? 'No group or community chats found.'
              : 'No chats match your filters.'}
          </p>
        ) : null}

        {visibleChats.map((chat) => {
          const active = chat.id === activeId;
          const isGroupLike = chat.isGroup || chat.isCommunity || chat.isChannel;
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onSelect(chat.id)}
              className={cn(
                'relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                active ? 'bg-chat-active' : 'hover:bg-chat-muted'
              )}
            >
              {active ? (
                <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-[#25D366]" />
              ) : null}
              <WhatsAppAvatar
                name={chat.name}
                profilePicUrl={chat.profilePicUrl}
                isGroup={isGroupLike}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-chat-foreground">
                    {chat.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-chat-subtle">
                    {formatWhatsAppListTime(chat.timestamp)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-chat-subtle">
                    {chat.lastMessageFromMe ? 'You: ' : ''}
                    {chat.lastMessage || 'No messages'}
                  </p>
                  {chat.unreadCount > 0 ? (
                    <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
