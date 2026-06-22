'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppAvatar } from '@/components/whatsapp/whatsapp-avatar';
import type { WhatsAppChat, WhatsAppMessage } from '@/lib/whatsapp-conversation-mapper';
import { formatWhatsAppMessageTime } from '@/lib/whatsapp-message-utils';
import { CheckCheck, Loader2, MoreHorizontal, SendHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type WhatsAppMessagePanelProps = {
  chat: WhatsAppChat;
  messages: WhatsAppMessage[];
  loading?: boolean;
  sending?: boolean;
  onSend: (text: string) => Promise<boolean>;
};

export function WhatsAppMessagePanel({
  chat,
  messages,
  loading = false,
  sending = false,
  onSend,
}: WhatsAppMessagePanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isGroupLike = chat.isGroup || chat.isCommunity || chat.isChannel;
  const showLoader = loading && messages.length === 0;
  const showEmpty = !loading && messages.length === 0;

  useEffect(() => {
    setDraft('');
  }, [chat.id]);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'auto',
    });
  }, [messages, chat.id]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const ok = await onSend(text);
    if (ok) setDraft('');
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-chat-main">
      <header className="flex items-center justify-between gap-3 border-b border-chat-border px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <WhatsAppAvatar
            name={chat.name}
            profilePicUrl={chat.profilePicUrl}
            isGroup={isGroupLike}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-chat-foreground">{chat.name}</p>
            <p className="text-xs text-chat-subtle">
              {isGroupLike ? 'Group · via WhatsApp' : 'Direct · via WhatsApp'}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="flex size-9 items-center justify-center rounded-lg text-chat-subtle hover:bg-chat-muted hover:text-chat-foreground"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </header>

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        {showLoader ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-chat-main text-sm text-chat-subtle">
            <Loader2 className="size-6 animate-spin text-[#25D366]" />
            <span>Loading messages…</span>
          </div>
        ) : null}

        {showEmpty ? (
          <p className="py-10 text-center text-sm text-chat-subtle">
            No messages yet. Start the conversation.
          </p>
        ) : null}

        {messages.length > 0 ? (
          <div className="flex w-full flex-col gap-4">
            {messages.map((message) => {
              const isMe = message.fromMe;
              const senderLabel = isMe
                ? 'You'
                : message.authorName || message.author?.split('@')[0] || chat.name;

              return (
                <div
                  key={message.id}
                  className={cn('flex w-full gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}
                >
                  <WhatsAppAvatar
                    name={senderLabel}
                    profilePicUrl={message.authorProfilePicUrl}
                    isGroup={false}
                    size="sm"
                  />
                  <div
                    className={cn(
                      'max-w-[min(100%,72%)]',
                      isMe ? 'items-end' : 'items-start'
                    )}
                  >
                    {isGroupLike && !isMe ? (
                      <p className="mb-1 text-[11px] font-medium text-[#25D366]">{senderLabel}</p>
                    ) : null}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        isMe
                          ? 'rounded-br-md bg-chat-bubble-out text-chat-bubble-out-fg'
                          : 'rounded-bl-md border border-chat-border bg-chat-bubble-in text-chat-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p
                        className={cn(
                          'mt-1 flex items-center justify-end gap-1 text-[10px]',
                          isMe ? 'text-chat-bubble-out-fg/70' : 'text-chat-subtle'
                        )}
                      >
                        {formatWhatsAppMessageTime(message.timestamp)}
                        {isMe ? <CheckCheck className="size-3 text-[#25D366]" /> : null}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <footer className="border-t border-chat-border px-4 py-4 lg:px-6">
        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-chat-border bg-chat-muted px-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message via WhatsApp…"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-chat-foreground outline-none placeholder:text-chat-subtle"
            />
            <motion.button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
              className="flex size-9 items-center justify-center rounded-xl bg-[#25D366] text-black transition-opacity disabled:opacity-40"
            >
              <SendHorizontal className="size-[18px] text-black" />
            </motion.button>
          </div>
        </form>
      </footer>
    </section>
  );
}
