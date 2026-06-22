'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatWorkspaceShell } from '@/components/chat/chat-workspace-shell';
import { ChatInbox } from '@/components/chat/chat-inbox';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ChatInfoPanel } from '@/components/chat/chat-info-panel';
import { chatEase, chatSlideRight } from '@/lib/chat-animations';
import { getConversation, type Conversation } from '@/lib/chat-types';
import { buildConversationFromCreate, type CreatePayload } from '@/lib/chat-create-utils';
import { useNotifications } from '@/hooks/use-notifications';
import { setDesktopBadgeCount } from '@/lib/desktop-api';
import { initialsFromName } from '@/lib/user-display';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  initials: string;
};

export default function SeungChatPage() {
  const prefersReducedMotion = useReducedMotion();
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations');
    if (!res.ok) return;
    const data = await res.json();
    const list = (data.conversations ?? []) as Conversation[];
    setConversationList(list);
    setActiveId((prev) => {
      if (prev && list.some((c) => c.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
    setLoadingChats(false);
  }, []);

  const onNotificationIncoming = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  const {
    unreadCount,
    refresh: refreshNotifications,
  } = useNotifications(onNotificationIncoming);

  useEffect(() => {
    void setDesktopBadgeCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({
            ...data.user,
            initials: initialsFromName(data.user.fullName),
          });
        }
      })
      .catch(() => undefined);

    loadConversations();
  }, [loadConversations]);

  const activeConversation = useMemo(
    () => (activeId ? (getConversation(activeId, conversationList) ?? null) : null),
    [activeId, conversationList]
  );

  const teamConversations = useMemo(
    () => conversationList.filter((c) => c.type === 'team'),
    [conversationList]
  );
  const directConversations = useMemo(
    () => conversationList.filter((c) => c.type === 'direct'),
    [conversationList]
  );

  const handleCreateComplete = useCallback((payload: CreatePayload) => {
    if (payload.action === 'invite' || payload.action === 'more' || payload.action === 'connection') {
      return;
    }

    const created = buildConversationFromCreate(payload);
    setConversationList((prev) => [created, ...prev]);
    setActiveId(created.id);
    setInboxOpen(false);
    setInfoOpen(false);
  }, []);

  const handleConversationReady = useCallback(
    (conversationId: string) => {
      loadConversations().then(() => {
        setActiveId(conversationId);
        setInboxOpen(false);
        setInfoOpen(false);
      });
    },
    [loadConversations]
  );

  const hasActiveChat = Boolean(activeConversation);
  const sidebarExpanded = inboxOpen || !hasActiveChat;

  function toggleInbox() {
    setInboxOpen((prev) => !prev);
  }

  function toggleInfoPanel() {
    setInfoOpen((prev) => !prev);
  }

  const navProps = {
    active: 'chat' as const,
    onCreateComplete: handleCreateComplete,
    userInitials: currentUser?.initials ?? 'YU',
    unreadCount,
    notificationsActive: false,
    onNotificationsClick: refreshNotifications,
    inboxCollapsed: hasActiveChat && !inboxOpen,
    onShowInbox: () => setInboxOpen(true),
  };

  return (
    <ChatWorkspaceShell {...navProps}>
      <div
        className={cn(
          'flex shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          hasActiveChat && inboxOpen &&
            'fixed inset-y-0 left-[68px] z-40 w-[calc(100vw-68px)] sm:static sm:z-auto sm:w-auto',
          !hasActiveChat && 'static w-auto'
        )}
      >
        <ChatInbox
          teamConversations={teamConversations}
          directConversations={directConversations}
          activeId={activeId ?? ''}
          onSelect={(id) => {
            setActiveId(id);
            setInboxOpen(false);
            setInfoOpen(false);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loadingChats}
          sidebarOpen={sidebarExpanded}
          onToggleSidebar={hasActiveChat ? toggleInbox : undefined}
        />
      </div>

      <AnimatePresence>
        {inboxOpen && hasActiveChat ? (
          <motion.button
            type="button"
            aria-label="Close inbox"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-y-0 right-0 left-[68px] z-30 bg-black/50 backdrop-blur-[1px] sm:hidden"
            onClick={() => setInboxOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[margin] duration-300',
          infoOpen && activeConversation ? 'lg:mr-[30vw]' : 'lg:mr-0'
        )}
      >
        <ChatPanel
          conversation={activeConversation}
          currentUser={currentUser}
          onMessageActivity={loadConversations}
          onToggleInfo={toggleInfoPanel}
          infoOpen={infoOpen}
          emptyHint={
            directConversations.length === 0 && !loadingChats
              ? 'No direct messages yet. Use + → Create connection to find someone.'
              : undefined
          }
        />
      </div>

      <AnimatePresence>
        {infoOpen && activeConversation ? (
          <>
            <motion.button
              type="button"
              aria-label="Close info panel"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setInfoOpen(false)}
            />
            <motion.aside
              {...(prefersReducedMotion ? {} : chatSlideRight)}
              className={cn(
                'fixed inset-y-0 right-0 z-40 border-l border-chat-border bg-chat-main shadow-2xl',
                'w-[min(100%,320px)] lg:w-[30vw]'
              )}
            >
              <ChatInfoPanel
                conversation={activeConversation}
                onClose={() => setInfoOpen(false)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </ChatWorkspaceShell>
  );
}
