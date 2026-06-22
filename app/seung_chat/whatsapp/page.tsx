'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ChatWorkspaceShell } from '@/components/chat/chat-workspace-shell';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  WhatsAppChatList,
  type WhatsAppFilter,
} from '@/components/whatsapp/whatsapp-chat-list';
import { WhatsAppEmptyPanel } from '@/components/whatsapp/whatsapp-empty-panel';
import { WhatsAppMessagePanel } from '@/components/whatsapp/whatsapp-message-panel';
import { chatEase } from '@/lib/chat-animations';
import { initialsFromName } from '@/lib/user-display';
import type { WhatsAppChat, WhatsAppMessage } from '@/lib/whatsapp-conversation-mapper';

type WhatsAppStatus = {
  status:
    | 'idle'
    | 'initializing'
    | 'qr'
    | 'authenticated'
    | 'ready'
    | 'auth_failure'
    | 'disconnected'
    | 'error';
  qrImageUrl: string | null;
  lastError: string | null;
};

function WhatsAppConnectScreen({
  waStatus,
  onReset,
}: {
  waStatus: WhatsAppStatus;
  onReset: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="flex h-full w-full items-center justify-center bg-chat-main p-4 sm:p-6">
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: chatEase }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-chat-border bg-chat-inbox shadow-xl"
      >
        <div className="border-b border-chat-border bg-chat-muted/50 px-6 py-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#25D366]/15">
            <WhatsAppIcon className="size-7 text-[#25D366]" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-chat-foreground">Link WhatsApp</h1>
          <p className="mt-1 text-sm text-chat-subtle">
            Scan with your phone to bridge messages into Seung.
          </p>
        </div>

        <div className="flex flex-col items-center px-6 py-8">
          <div className="relative rounded-2xl border border-[#25D366]/30 bg-chat-main p-4 shadow-[0_0_40px_-12px_rgba(37,211,102,0.45)]">
            {waStatus.qrImageUrl ? (
              <img src={waStatus.qrImageUrl} alt="WhatsApp QR code" className="size-[220px]" />
            ) : (
              <div className="flex size-[220px] items-center justify-center text-sm text-chat-subtle">
                {waStatus.status === 'initializing'
                  ? 'Initializing bridge…'
                  : waStatus.status === 'authenticated'
                    ? 'Almost ready…'
                    : 'Generating QR code…'}
              </div>
            )}
          </div>

          <div className="mt-6 w-full space-y-2.5 rounded-xl border border-chat-border bg-chat-muted/40 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-chat-foreground">
              <Smartphone className="size-3.5 text-[#25D366]" />
              On your phone
            </p>
            <ol className="space-y-1.5 text-xs leading-relaxed text-chat-subtle">
              <li>1. Open WhatsApp → Linked devices</li>
              <li>2. Tap Link a device</li>
              <li>3. Scan the QR code above</li>
            </ol>
          </div>

          {waStatus.lastError ? (
            <p className="mt-4 w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {waStatus.lastError}
            </p>
          ) : null}

          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-chat-border px-3 py-2 text-xs font-medium text-chat-subtle transition-colors hover:bg-chat-muted hover:text-chat-foreground"
            onClick={onReset}
          >
            <RefreshCw className="size-3.5" />
            Reset session
          </button>
        </div>
      </motion.section>
    </main>
  );
}

export default function WhatsAppBridgePage() {
  const [userInitials, setUserInitials] = useState('YU');
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({
    status: 'idle',
    qrImageUrl: null,
    lastError: null,
  });
  const [waChats, setWaChats] = useState<WhatsAppChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<WhatsAppFilter>('all');

  const activeIdRef = useRef<string | null>(null);
  const messagesCacheRef = useRef<Map<string, WhatsAppMessage[]>>(new Map());

  const connected = waStatus.status === 'ready';
  const activeChat = waChats.find((chat) => chat.id === activeId) ?? null;

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.fullName) {
          setUserInitials(initialsFromName(data.user.fullName));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok || !active) return;
      const data = (await res.json()) as WhatsAppStatus;
      if (!active) return;
      setWaStatus(data);
    }

    loadStatus().catch(() => undefined);
    const timer = setInterval(() => {
      loadStatus().catch(() => undefined);
    }, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const loadChats = useCallback(async () => {
    if (!connected) {
      setWaChats([]);
      return;
    }
    setLoadingChats(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      const res = await fetch('/api/whatsapp/chats', { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return;
      const data = (await res.json()) as {
        status: WhatsAppStatus['status'];
        chats: WhatsAppChat[];
      };
      const chats = data.chats ?? [];
      setWaChats(chats);
      setActiveId((prev) => (prev && chats.some((chat) => chat.id === prev) ? prev : null));
    } finally {
      setLoadingChats(false);
    }
  }, [connected]);

  useEffect(() => {
    loadChats().catch(() => undefined);
    if (!connected) return;
    const timer = setInterval(() => {
      loadChats().catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, [connected, loadChats]);

  const loadMessages = useCallback(
    async (chatId: string, options?: { silent?: boolean }) => {
      if (!connected) return;

      const hasCached = messagesCacheRef.current.has(chatId);
      const silent = options?.silent ?? hasCached;

      if (!silent) {
        setLoadingMessages(true);
      }

      try {
        const res = await fetch(
          `/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages?limit=80`
        );
        if (!res.ok || activeIdRef.current !== chatId) return;
        const data = (await res.json()) as { messages?: WhatsAppMessage[] };
        const nextMessages = data.messages ?? [];
        messagesCacheRef.current.set(chatId, nextMessages);
        if (activeIdRef.current === chatId) {
          setMessages(nextMessages);
        }
      } finally {
        if (!silent && activeIdRef.current === chatId) {
          setLoadingMessages(false);
        }
      }
    },
    [connected]
  );

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveId(chatId);

    const cached = messagesCacheRef.current.get(chatId);
    if (cached) {
      setMessages(cached);
      setLoadingMessages(false);
    } else {
      setMessages([]);
      setLoadingMessages(true);
    }
  }, []);

  useEffect(() => {
    if (!connected || !activeId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    loadMessages(activeId, { silent: messagesCacheRef.current.has(activeId) }).catch(() => {
      if (activeIdRef.current === activeId) setLoadingMessages(false);
    });

    const timer = setInterval(() => {
      if (activeIdRef.current) {
        loadMessages(activeIdRef.current, { silent: true }).catch(() => undefined);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [connected, activeId, loadMessages]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!activeId || !text.trim() || sending) return false;
      setSending(true);
      try {
        const res = await fetch(`/api/whatsapp/chats/${encodeURIComponent(activeId)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: text.trim() }),
        });
        if (!res.ok) return false;
        await loadMessages(activeId);
        await loadChats();
        return true;
      } finally {
        setSending(false);
      }
    },
    [activeId, sending, loadMessages, loadChats]
  );

  function handleReset() {
    fetch('/api/whatsapp/reset', { method: 'POST' }).catch(() => undefined);
    setWaStatus((prev) => ({ ...prev, status: 'idle', qrImageUrl: null }));
    setWaChats([]);
    setActiveId(null);
    setMessages([]);
    messagesCacheRef.current.clear();
  }

  if (!connected) {
    return (
      <ChatWorkspaceShell active="whatsapp" userInitials={userInitials}>
        <WhatsAppConnectScreen waStatus={waStatus} onReset={handleReset} />
      </ChatWorkspaceShell>
    );
  }

  return (
    <ChatWorkspaceShell active="whatsapp" userInitials={userInitials}>
      <div className="flex h-full min-w-0 flex-1 overflow-hidden">
        <div className="h-full shrink-0 border-r border-chat-border">
          <WhatsAppChatList
            chats={waChats}
            activeId={activeId}
            searchQuery={searchQuery}
            filter={filter}
            loading={loadingChats}
            onSelect={handleSelectChat}
            onSearchChange={setSearchQuery}
            onFilterChange={setFilter}
            onRefresh={() => loadChats().catch(() => undefined)}
          />
        </div>

        {activeChat ? (
          <WhatsAppMessagePanel
            chat={activeChat}
            messages={messages}
            loading={loadingMessages}
            sending={sending}
            onSend={handleSend}
          />
        ) : (
          <WhatsAppEmptyPanel />
        )}
      </div>
    </ChatWorkspaceShell>
  );
}
