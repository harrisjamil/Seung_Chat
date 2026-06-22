'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatAttachment, ChatMessage, ChatReplyTarget } from '@/lib/chat-types';

type CurrentUser = {
  id: string;
  fullName: string;
  initials: string;
};

type SerializedMessage = ChatMessage & {
  createdAt?: string;
  senderId?: string;
};

function areMessagesEqual(a: ChatMessage[], b: ChatMessage[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.text !== right.text ||
      left.time !== right.time ||
      left.from !== right.from ||
      left.senderName !== right.senderName ||
      left.senderInitials !== right.senderInitials ||
      JSON.stringify(left.attachments ?? []) !== JSON.stringify(right.attachments ?? []) ||
      JSON.stringify(left.replyTo ?? null) !== JSON.stringify(right.replyTo ?? null) ||
      Boolean(left.readByRecipient) !== Boolean(right.readByRecipient)
    ) {
      return false;
    }
  }

  return true;
}

export function useConversationMessages(
  conversationId: string | null,
  currentUser: CurrentUser | null,
  initialMessages: ChatMessage[],
  enabled: boolean,
  onActivity?: () => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const knownIds = useRef(new Set<string>());

  useEffect(() => {
    setMessages((prev) => (areMessagesEqual(prev, initialMessages) ? prev : initialMessages));
    knownIds.current = new Set(initialMessages.map((m) => m.id));
  }, [conversationId, initialMessages]);

  const appendMessage = useCallback((message: ChatMessage) => {
    if (knownIds.current.has(message.id)) return;
    knownIds.current.add(message.id);
    setMessages((prev) => [...prev, message]);
    onActivity?.();
  }, [onActivity]);

  useEffect(() => {
    if (!enabled || !conversationId || !currentUser) return;

    const source = new EventSource(
      `/api/conversations/${conversationId}/messages/stream`
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type: string;
          message?: SerializedMessage;
          messageId?: string;
        };
        if (payload.type === 'message' && payload.message) {
          const { senderId: _s, ...chatMessage } = payload.message;
          appendMessage(chatMessage);
        }
        if (payload.type === 'read' && payload.messageId) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === payload.messageId
                ? { ...message, readByRecipient: true }
                : message
            )
          );
        }
      } catch {
        /* ignore */
      }
    };

    return () => source.close();
  }, [conversationId, currentUser, enabled, appendMessage]);

  const sendMessage = useCallback(
    async (
      text: string,
      attachments: ChatAttachment[] = [],
      replyTo: ChatReplyTarget | null = null
    ) => {
      if (!conversationId || !currentUser || !enabled) return false;

      const optimisticId = `pending-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        from: 'me',
        senderName: 'You',
        senderInitials: currentUser.initials,
        text,
        attachments,
        replyTo: replyTo ?? undefined,
        readByRecipient: false,
        createdAt: new Date().toISOString(),
        time: 'Just now',
      };

      knownIds.current.add(optimisticId);
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, attachments, replyTo }),
        });
        const data = await res.json();

        if (!res.ok) {
          knownIds.current.delete(optimisticId);
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          return false;
        }

        const saved = data.message as SerializedMessage;
        knownIds.current.delete(optimisticId);
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== optimisticId);
          if (knownIds.current.has(saved.id)) return without;
          knownIds.current.add(saved.id);
          return [...without, saved];
        });
        onActivity?.();
        return true;
      } catch {
        knownIds.current.delete(optimisticId);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUser, enabled, onActivity]
  );

  return { messages, sendMessage, sending };
}

/** For non-persisted (local-only) conversations */
export function useLocalMessages(initialMessages: ChatMessage[], conversationId: string | null) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages((prev) => (areMessagesEqual(prev, initialMessages) ? prev : initialMessages));
  }, [conversationId, initialMessages]);

  const sendMessage = useCallback(
    async (
      text: string,
      initials: string,
      attachments: ChatAttachment[] = [],
      replyTo: ChatReplyTarget | null = null
    ) => {
      const message: ChatMessage = {
        id: `local-${Date.now()}`,
        from: 'me',
        senderName: 'You',
        senderInitials: initials,
        text,
        attachments,
        replyTo: replyTo ?? undefined,
        createdAt: new Date().toISOString(),
        time: 'Just now',
      };
      setMessages((prev) => [...prev, message]);
      return true;
    },
    []
  );

  return { messages, sendMessage, sending: false };
}
