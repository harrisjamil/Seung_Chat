'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export const InboxHideIcon = PanelLeftClose;
export const InboxShowIcon = PanelLeftOpen;

type InboxSidebarToggleProps = {
  open: boolean;
  onClick: () => void;
  className?: string;
};

export function InboxSidebarToggle({ open, onClick, className }: InboxSidebarToggleProps) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = open ? InboxHideIcon : InboxShowIcon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Hide recent messages' : 'Show recent messages'}
      aria-pressed={open}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl text-chat-subtle transition-colors hover:bg-chat-muted hover:text-chat-foreground',
        className
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </motion.button>
  );
}
