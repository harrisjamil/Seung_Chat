'use client';

import { useCallback, useEffect, useState } from 'react';
import { showDesktopNotification } from '@/lib/desktop-api';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  createdAt: string;
};

export function useNotifications(onIncoming?: (notification: AppNotification) => void) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const source = new EventSource('/api/notifications/stream');

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type: string;
          notification?: AppNotification;
        };
        if (payload.type === 'notification' && payload.notification) {
          const notification = payload.notification;
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((c) => c + 1);
          onIncoming?.(notification);

          if (document.hidden) {
            void showDesktopNotification(notification.title, notification.body);
          }
        }
      } catch {
        /* ignore malformed events */
      }
    };

    return () => source.close();
  }, [onIncoming]);

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const respondToConnection = useCallback(
    async (connectionRequestId: string, action: 'accept' | 'reject') => {
      const res = await fetch(`/api/connections/${connectionRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as {
        status?: string;
        conversationId?: string;
        error?: string;
      };
      if (action === 'accept' && data.conversationId) {
        await refresh();
      }
      return data;
    },
    [refresh]
  );

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    respondToConnection,
  };
}
