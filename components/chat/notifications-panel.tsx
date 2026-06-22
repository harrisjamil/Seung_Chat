'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/chat/user-avatar';
import type { AppNotification } from '@/hooks/use-notifications';
import { initialsFromName } from '@/lib/user-display';
import { chatEase } from '@/lib/chat-animations';
import { Check, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onRespond: (
    connectionRequestId: string,
    action: 'accept' | 'reject'
  ) => Promise<{ conversationId?: string } | void>;
  onConversationReady?: (conversationId: string) => void;
};

function parseData(notification: AppNotification) {
  const raw = notification.data;
  if (!raw || typeof raw !== 'object') return {} as Record<string, string>;
  return raw as Record<string, string>;
}

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  loading,
  onMarkRead,
  onRespond,
  onConversationReady,
}: NotificationsPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [busyId, setBusyId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close notifications"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.aside
            initial={prefersReducedMotion ? false : { x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { x: -280, opacity: 0 }}
            transition={{ duration: 0.28, ease: chatEase }}
            className="fixed inset-y-0 left-[68px] z-[61] flex w-[min(100%,320px)] flex-col border-r border-chat-border bg-chat-inbox shadow-2xl sm:left-[68px]"
          >
            <div className="flex items-center justify-between border-b border-chat-border px-4 py-3">
              <h2 className="text-sm font-semibold text-chat-foreground">Notifications</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-chat-subtle hover:bg-chat-muted hover:text-chat-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-chat-subtle" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-chat-subtle">No notifications yet.</p>
              ) : (
                notifications.map((notification) => {
                  const data = parseData(notification);
                  const fromName = data.fromUserName ?? 'Someone';
                  const isRequest = notification.type === 'CONNECTION_REQUEST';
                  const isPending = isRequest && !notification.read;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'mb-2 rounded-xl border border-chat-border bg-chat-main p-3',
                        !notification.read && 'ring-1 ring-foreground/10 dark:ring-white/15'
                      )}
                    >
                      <div className="flex gap-3">
                        <UserAvatar initials={initialsFromName(fromName)} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-chat-foreground">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-chat-subtle">
                            {notification.body}
                          </p>

                          {isPending && data.connectionRequestId ? (
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="h-8 flex-1 gap-1 text-xs"
                                disabled={busyId === notification.id}
                                onClick={async () => {
                                  setBusyId(notification.id);
                                  const result = await onRespond(
                                    data.connectionRequestId!,
                                    'accept'
                                  );
                                  await onMarkRead(notification.id);
                                  setBusyId(null);
                                  if (result?.conversationId) {
                                    onConversationReady?.(result.conversationId);
                                    onClose();
                                  }
                                }}
                              >
                                {busyId === notification.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Check className="size-3.5" />
                                )}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 flex-1 text-xs"
                                disabled={busyId === notification.id}
                                onClick={async () => {
                                  setBusyId(notification.id);
                                  await onRespond(data.connectionRequestId!, 'reject');
                                  await onMarkRead(notification.id);
                                  setBusyId(null);
                                }}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : notification.type === 'CONNECTION_ACCEPTED' &&
                            data.conversationId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 h-8 w-full text-xs"
                              onClick={() => {
                                onConversationReady?.(data.conversationId!);
                                onMarkRead(notification.id);
                                onClose();
                              }}
                            >
                              Open chat
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
