'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatWorkspaceShell } from '@/components/chat/chat-workspace-shell';
import { UserAvatar } from '@/components/chat/user-avatar';
import { useNotifications, type AppNotification } from '@/hooks/use-notifications';
import { initialsFromName } from '@/lib/user-display';
import { Check, Loader2 } from 'lucide-react';

type CurrentUser = {
  fullName: string;
};

function parseData(notification: AppNotification) {
  const raw = notification.data;
  if (!raw || typeof raw !== 'object') return {} as Record<string, string>;
  return raw as Record<string, string>;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [userInitials, setUserInitials] = useState('YU');
  const [busyId, setBusyId] = useState<string | null>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    respondToConnection,
  } = useNotifications();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.user as CurrentUser | undefined;
        if (user?.fullName) {
          setUserInitials(initialsFromName(user.fullName));
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <ChatWorkspaceShell active="notifications" userInitials={userInitials} unreadCount={unreadCount}>
      <main className="h-full overflow-y-auto bg-chat-main p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-2xl font-semibold text-chat-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-chat-subtle">Recent updates and connection requests.</p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-chat-subtle" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-chat-border bg-chat-inbox p-6 text-center text-sm text-chat-subtle">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const data = parseData(notification);
                const fromName = data.fromUserName ?? 'Someone';
                const isRequest = notification.type === 'CONNECTION_REQUEST';
                const isPending = isRequest && !notification.read;

                return (
                  <div
                    key={notification.id}
                    className="rounded-xl border border-chat-border bg-chat-inbox p-4"
                  >
                    <div className="flex gap-3">
                      <UserAvatar initials={initialsFromName(fromName)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-chat-foreground">{notification.title}</p>
                        <p className="mt-1 text-sm text-chat-subtle">{notification.body}</p>

                        {isPending && data.connectionRequestId ? (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 flex-1 gap-1 text-xs"
                              disabled={busyId === notification.id}
                              onClick={async () => {
                                setBusyId(notification.id);
                                await respondToConnection(data.connectionRequestId!, 'accept');
                                await markRead(notification.id);
                                setBusyId(null);
                                router.push('/seung_chat');
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
                                await respondToConnection(data.connectionRequestId!, 'reject');
                                await markRead(notification.id);
                                setBusyId(null);
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          !notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 h-8 text-xs"
                              onClick={() => markRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </ChatWorkspaceShell>
  );
}
