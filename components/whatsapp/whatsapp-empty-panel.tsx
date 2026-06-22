'use client';

import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { chatEase, chatFadeUp } from '@/lib/chat-animations';
import { MessageCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export function WhatsAppEmptyPanel() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      {...(prefersReducedMotion ? {} : chatFadeUp)}
      className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden bg-chat-main"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, oklch(1 0 0 / 8%) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: chatEase }}
        className="relative flex flex-col items-center px-8 text-center"
      >
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-[#25D366]/10 blur-xl" />
          <div className="relative flex size-20 items-center justify-center rounded-2xl border border-chat-border bg-chat-inbox shadow-lg">
            <WhatsAppIcon className="size-10 text-[#25D366]" />
          </div>
        </div>

        <h2 className="mt-6 text-xl font-semibold text-chat-foreground">Select a chat</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-chat-subtle">
          Your linked WhatsApp conversations appear on the left. Pick one to read and reply here.
        </p>

        <div className="mt-8 flex items-center gap-2 rounded-full border border-chat-border bg-chat-inbox px-4 py-2 text-xs text-chat-subtle">
          <MessageCircle className="size-3.5 text-[#25D366]" />
          End-to-end encrypted via WhatsApp
        </div>
      </motion.div>
    </motion.section>
  );
}
