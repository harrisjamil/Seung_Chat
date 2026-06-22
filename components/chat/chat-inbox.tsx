'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/chat/user-avatar';
import type { Conversation } from '@/lib/chat-types';
import { chatEase, chatSpring, staggerDelay } from '@/lib/chat-animations';
import { formatRelativeTime } from '@/lib/user-display';
import { ChevronDown, Search } from 'lucide-react';
import { InboxSidebarToggle } from '@/components/chat/inbox-sidebar-toggle';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

type ChatInboxProps = {
  teamConversations: Conversation[];
  directConversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

function InboxItem({
  conversation,
  active,
  onSelect,
  index,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayTime = (() => {
    void nowMs;
    if (!conversation.lastActivityAt) return conversation.time;
    const parsed = new Date(conversation.lastActivityAt);
    if (Number.isNaN(parsed.getTime())) return conversation.time;
    return formatRelativeTime(parsed);
  })();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: staggerDelay(index, prefersReducedMotion ?? false),
        duration: 0.28,
        ease: chatEase,
      }}
      whileHover={prefersReducedMotion ? undefined : { x: 2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      className={cn(
        'relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        active ? 'bg-chat-active' : 'hover:bg-chat-muted'
      )}
    >
      {active ? (
        <motion.span
          layoutId={prefersReducedMotion ? undefined : 'inbox-active-indicator'}
          transition={chatSpring}
          className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-foreground dark:bg-white"
        />
      ) : null}
      <div className="relative shrink-0">
        <UserAvatar initials={conversation.initials} />
        {conversation.online ? (
          <motion.span
            initial={prefersReducedMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={chatSpring}
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-chat-inbox bg-foreground dark:bg-white"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-chat-foreground">
            {conversation.name}
          </span>
          <span className="shrink-0 text-[11px] text-chat-subtle">{displayTime}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          {conversation.typing ? (
            <motion.p
              animate={prefersReducedMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="truncate text-xs text-chat-brand"
            >
              typing...
            </motion.p>
          ) : (
            <p className="truncate text-xs text-chat-subtle">{conversation.preview}</p>
          )}
          <AnimatePresence>
            {conversation.unread ? (
              <motion.span
                initial={prefersReducedMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={prefersReducedMotion ? undefined : { scale: 0 }}
                transition={chatSpring}
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-avatar-bg text-[10px] font-bold text-avatar-fg"
              >
                {conversation.unread}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-chat-subtle transition-colors hover:text-chat-foreground"
      >
        <ChevronDown
          className={cn('size-3.5 transition-transform duration-200', !open && '-rotate-90')}
        />
        {title} ({count})
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: chatEase }}
            className="overflow-hidden pb-1"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ChatInbox({
  teamConversations,
  directConversations,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  loading = false,
  emptyMessage = 'No conversations yet. Tap + to create a connection.',
  sidebarOpen = true,
  onToggleSidebar,
}: ChatInboxProps) {
  const prefersReducedMotion = useReducedMotion();

  const filter = (list: Conversation[]) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.preview.toLowerCase().includes(query)
    );
  };

  const team = filter(teamConversations);
  const direct = filter(directConversations);
  let itemIndex = 0;

  return (
    <motion.aside
      initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: chatEase }}
      className={cn(
        'flex h-full shrink-0 flex-col overflow-hidden border-r border-chat-border bg-chat-inbox transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        sidebarOpen ? 'w-full md:w-[300px] lg:w-[320px]' : 'w-0 border-r-0'
      )}
    >
      {sidebarOpen ? (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: chatEase }}
          className="p-4"
        >
          <div className="flex w-full items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-chat-subtle" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search messages..."
                className="h-10 rounded-xl border-chat-border bg-chat-muted pl-10 text-sm text-chat-foreground placeholder:text-chat-subtle focus-visible:border-foreground focus-visible:ring-foreground/20 dark:focus-visible:border-white dark:focus-visible:ring-white/20"
              />
            </div>
            {onToggleSidebar ? (
              <InboxSidebarToggle open={sidebarOpen} onClick={onToggleSidebar} />
            ) : null}
          </div>
        </motion.div>
      ) : null}

      {sidebarOpen ? (
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-chat-subtle">Loading messages…</p>
        ) : null}

        {!loading && team.length === 0 && direct.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-chat-subtle">{emptyMessage}</p>
        ) : null}

        {team.length > 0 ? (
          <Section title="Team messages" count={teamConversations.length}>
            {team.map((conversation) => {
              const index = itemIndex++;
              return (
                <InboxItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  onSelect={() => onSelect(conversation.id)}
                  index={index}
                />
              );
            })}
          </Section>
        ) : null}

        {direct.length > 0 ? (
          <Section title="Direct messages" count={directConversations.length}>
            {direct.map((conversation) => {
              const index = itemIndex++;
              return (
                <InboxItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  onSelect={() => onSelect(conversation.id)}
                  index={index}
                />
              );
            })}
          </Section>
        ) : null}
      </div>
      ) : null}
    </motion.aside>
  );
}
