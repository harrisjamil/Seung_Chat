'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createOptions,
  moreSubOptions,
  type CreateActionId,
} from '@/lib/create-options';
import type { CreatePayload } from '@/lib/chat-create-utils';
import { chatEase } from '@/lib/chat-animations';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type CreateActionSheetProps = {
  action: CreateActionId | null;
  onClose: () => void;
  onComplete?: (payload: CreatePayload) => void;
};

const inviteLink = 'https://seung.chat/invite/yu-8k2m';

const successCopy: Record<CreateActionId, { title: string; subtitle: string }> = {
  connection: {
    title: 'Connection started',
    subtitle: 'Your direct chat is ready. Say hello!',
  },
  space: {
    title: 'Space created',
    subtitle: 'Invite teammates and organize your work.',
  },
  group: {
    title: 'Group created',
    subtitle: 'Members can join and start chatting.',
  },
  channel: {
    title: 'Channel live',
    subtitle: 'Broadcast updates to everyone in the channel.',
  },
  invite: {
    title: 'Link ready',
    subtitle: 'Share it with anyone you want on Seung.',
  },
  more: {
    title: 'Done',
    subtitle: 'Your selection has been queued.',
  },
};

export function CreateActionSheet({ action, onClose, onComplete }: CreateActionSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!action) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [action, onClose]);

  useEffect(() => {
    if (!action) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [action]);

  const option = createOptions.find((item) => item.id === action) ?? null;

  return (
    <AnimatePresence>
      {action && option ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-action-title"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: chatEase }}
            className="fixed top-1/2 left-1/2 z-[61] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-chat-border bg-chat-inbox shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-chat-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-avatar-bg text-avatar-fg">
                  <option.icon className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 id="create-action-title" className="text-sm font-semibold text-chat-foreground">
                    {option.label}
                  </h2>
                  <p className="text-xs text-chat-subtle">{option.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex size-8 items-center justify-center rounded-lg text-chat-subtle hover:bg-chat-muted hover:text-chat-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <ActionForm
                key={action}
                action={action}
                onDone={onClose}
                onComplete={onComplete}
              />
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ActionForm({
  action,
  onDone,
  onComplete,
}: {
  action: CreateActionId;
  onDone: () => void;
  onComplete?: (payload: CreatePayload) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [detail, setDetail] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    action === 'connection'
      ? email.trim().length > 0
      : action === 'invite' || action === 'more'
        ? true
        : name.trim().length > 0;

  function finish(payload: CreatePayload) {
    setSubmitting(true);
    window.setTimeout(() => {
      onComplete?.(payload);
      setSubmitting(false);
      setSubmitted(true);
      window.setTimeout(onDone, 1400);
    }, 650);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    finish({
      action,
      name: name.trim(),
      email: email.trim() || undefined,
      detail: detail.trim() || undefined,
      visibility: action === 'channel' ? visibility : undefined,
    });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (submitted) {
    const copy = successCopy[action];
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="flex size-12 items-center justify-center rounded-full bg-chat-muted"
        >
          <Check className="size-6 text-chat-foreground" />
        </motion.div>
        <p className="mt-3 text-sm font-medium text-chat-foreground">{copy.title}</p>
        <p className="mt-1 max-w-[260px] text-xs text-chat-subtle">{copy.subtitle}</p>
      </motion.div>
    );
  }

  if (action === 'invite') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-chat-border bg-chat-muted/50 p-3">
          <p className="text-[11px] font-medium tracking-wide uppercase text-chat-subtle">
            Your invite link
          </p>
          <p className="mt-2 break-all text-sm text-chat-foreground">{inviteLink}</p>
        </div>
        <p className="text-[11px] text-chat-subtle">
          Anyone with this link can request to join your workspace on Seung.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={copyInvite}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button type="button" className="flex-1" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (action === 'more') {
    return (
      <div className="space-y-1">
        {moreSubOptions.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={submitting}
            onClick={() => finish({ action: 'more', name: item.label })}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-chat-muted disabled:opacity-60"
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-chat-border bg-chat-main">
              <item.icon className="size-4" />
            </span>
            <span className="text-sm font-medium text-chat-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(action === 'connection' || action === 'group') && (
        <Field
          id="create-email"
          label={action === 'connection' ? 'Email or username' : 'Add members'}
          placeholder={action === 'connection' ? 'name@example.com' : 'Search people...'}
          value={email}
          onChange={setEmail}
          type={action === 'connection' ? 'email' : 'text'}
          required
        />
      )}

      <Field
        id="create-name"
        label={
          action === 'connection'
            ? 'Display name (optional)'
            : action === 'space'
              ? 'Space name'
              : action === 'group'
                ? 'Group name'
                : 'Channel name'
        }
        placeholder={
          action === 'space'
            ? 'e.g. Product Design'
            : action === 'channel'
              ? 'e.g. announcements'
              : 'Enter a name'
        }
        value={name}
        onChange={setName}
        required={action !== 'connection'}
      />

      {(action === 'space' || action === 'channel') && (
        <Field
          id="create-detail"
          label={action === 'space' ? 'Description' : 'Topic (optional)'}
          placeholder={
            action === 'space' ? 'What is this space for?' : 'What will this channel be used for?'
          }
          value={detail}
          onChange={setDetail}
        />
      )}

      {action === 'channel' && (
        <div className="space-y-2">
          <Label className="text-xs text-chat-subtle">Visibility</Label>
          <div className="flex gap-2">
            {(['Public', 'Private'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                  visibility === option
                    ? 'border-foreground bg-chat-muted text-chat-foreground dark:border-white'
                    : 'border-chat-border text-chat-subtle hover:bg-chat-muted'
                )}
                onClick={() => setVisibility(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!canSubmit || submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              Creating…
            </>
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-chat-subtle">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-10 border-chat-border bg-chat-muted"
      />
    </div>
  );
}
