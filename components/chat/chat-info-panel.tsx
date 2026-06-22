'use client';

import { cn } from '@/lib/utils';
import { UserAvatar, GroupAvatar } from '@/components/chat/user-avatar';
import type { Conversation, GroupMember, GroupTask } from '@/lib/chat-types';
import { chatEase, staggerDelay } from '@/lib/chat-animations';
import {
  BellOff,
  ChevronDown,
  Info,
  Mail,
  Phone,
  Star,
  User,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type ChatInfoPanelProps = {
  conversation: Conversation;
  onClose: () => void;
};

function MemberRow({ member, index }: { member: GroupMember; index: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: staggerDelay(index, prefersReducedMotion ?? false), duration: 0.25 }}
      className="flex items-center gap-3 py-2"
    >
      <UserAvatar initials={member.initials} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-chat-foreground">{member.name}</p>
        {member.role ? (
          <p className="text-[11px] text-chat-subtle">{member.role}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function TaskRow({ task }: { task: GroupTask }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-2">
      <input
        type="checkbox"
        checked={task.done}
        readOnly
        className="mt-0.5 size-4 rounded border-chat-border bg-chat-muted accent-foreground dark:accent-white"
      />
      <span
        className={cn(
          'flex-1 text-sm',
          task.done ? 'text-chat-subtle line-through' : 'text-chat-foreground'
        )}
      >
        {task.text}
      </span>
      {task.starred ? (
        <Star className="size-3.5 shrink-0 fill-foreground text-foreground dark:fill-white dark:text-white" />
      ) : null}
    </label>
  );
}

function InfoSection({
  title,
  count,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-chat-border">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-sm font-medium text-chat-foreground">
          <ChevronDown className="size-4 -rotate-90 text-chat-subtle transition-transform duration-200 group-open:rotate-0" />
          {title}
          {count !== undefined ? (
            <span className="text-chat-subtle">({count})</span>
          ) : null}
        </span>
        {badge !== undefined ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-avatar-bg text-[10px] font-bold text-avatar-fg">
            {badge}
          </span>
        ) : null}
      </summary>
      <div className="px-5 pb-4">{children}</div>
    </details>
  );
}

function ContactInfoContent({ conversation }: { conversation: Conversation }) {
  const photoCount = conversation.photoCount ?? 0;
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: chatEase }}
        className="flex flex-col items-center px-5 py-6 text-center"
      >
        <div className="relative">
          <UserAvatar initials={conversation.initials} size="xl" />
          {conversation.online ? (
            <span className="absolute right-1 bottom-1 size-4 rounded-full border-[3px] border-chat-inbox bg-foreground dark:bg-white" />
          ) : null}
        </div>
        <h2 className="mt-4 text-base font-semibold text-chat-foreground">{conversation.name}</h2>
        <p className="mt-1 text-xs text-chat-subtle">
          {conversation.online ? 'Active now' : 'Last seen recently'}
        </p>
        {conversation.bio ? (
          <p className="mt-3 max-w-[220px] text-xs leading-relaxed text-chat-subtle">
            {conversation.bio}
          </p>
        ) : null}
      </motion.div>

      <div className="border-b border-chat-border px-5 pb-5">
        <div className="grid grid-cols-3 gap-2">
          <ActionButton icon={Phone} label="Call" />
          <ActionButton icon={Mail} label="Email" />
          <ActionButton icon={BellOff} label="Mute" />
        </div>
      </div>

      {photoCount > 0 ? (
        <InfoSection title="Shared photos" count={photoCount}>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl border border-chat-border bg-chat-muted"
              />
            ))}
          </div>
        </InfoSection>
      ) : null}

      <InfoSection title="About" defaultOpen={false}>
        <div className="space-y-3 text-sm text-chat-subtle">
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0" />
            <span>Direct message</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="size-4 shrink-0" />
            <span>Add to favorites</span>
          </div>
        </div>
      </InfoSection>
    </>
  );
}

function GroupInfoContent({ conversation }: { conversation: Conversation }) {
  const remaining = Math.max(0, (conversation.photoCount ?? 0) - 3);
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: chatEase }}
        className="flex flex-col items-center px-5 py-6 text-center"
      >
        <GroupAvatar initials={conversation.initials} size="md" />
        <h2 className="mt-4 text-base font-semibold text-chat-foreground">{conversation.name}</h2>
        <p className="mt-1 text-xs text-chat-subtle">
          {conversation.memberCount ?? conversation.members?.length ?? 0} members
        </p>
      </motion.div>

      {conversation.members?.length ? (
        <InfoSection title="Group members" count={conversation.memberCount ?? conversation.members.length}>
          <div className="divide-y divide-chat-border/60">
            {conversation.members.map((member, index) => (
              <MemberRow key={member.id} member={member} index={index} />
            ))}
          </div>
        </InfoSection>
      ) : null}

      {conversation.photoCount ? (
        <InfoSection title="Photos and multimedia" count={conversation.photoCount}>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl border border-chat-border bg-chat-muted"
              />
            ))}
            <div className="flex aspect-square items-center justify-center rounded-xl border border-chat-border bg-chat-muted text-sm font-medium text-chat-subtle">
              +{remaining > 0 ? remaining : 1434}
            </div>
          </div>
        </InfoSection>
      ) : null}

      {conversation.tasks?.length ? (
        <InfoSection
          title="Tasks"
          count={conversation.tasks.length}
          badge={conversation.tasks.filter((t) => !t.done).length}
        >
          <div>
            {conversation.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </InfoSection>
      ) : null}
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-chat-border bg-chat-muted px-2 py-3 text-[11px] text-chat-subtle transition-colors hover:bg-chat-active hover:text-chat-foreground"
    >
      <Icon className="size-4" />
      {label}
    </motion.button>
  );
}

export function ChatInfoPanel({ conversation, onClose }: ChatInfoPanelProps) {
  const isGroup = conversation.isGroup;
  const panelTitle = isGroup ? 'Group info' : 'Contact info';
  const prefersReducedMotion = useReducedMotion();

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-chat-border bg-chat-inbox">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: chatEase }}
        className="flex items-center justify-between border-b border-chat-border px-5 py-4"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-chat-foreground">
          <Info className="size-4 text-chat-subtle" />
          {panelTitle}
        </div>
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
          aria-label={`Close ${panelTitle.toLowerCase()}`}
          className="flex size-8 items-center justify-center rounded-lg text-chat-subtle transition-colors hover:bg-chat-muted hover:text-chat-foreground"
        >
          <X className="size-4" />
        </motion.button>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        {isGroup ? (
          <GroupInfoContent conversation={conversation} />
        ) : (
          <ContactInfoContent conversation={conversation} />
        )}
      </div>
    </aside>
  );
}
