'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { UserAvatar, GroupAvatar } from '@/components/chat/user-avatar';
import type {
  ChatAttachment,
  ChatMessage,
  ChatReplyTarget,
  Conversation,
} from '@/lib/chat-types';
import { messageEnter, chatEase, chatFadeUp, chatSpring, staggerDelay } from '@/lib/chat-animations';
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Forward,
  Info,
  Link2,
  Mic,
  MonitorUp,
  Paperclip,
  Phone,
  Reply,
  SendHorizontal,
  Trash2,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useConversationMessages,
  useLocalMessages,
} from '@/hooks/use-conversation-messages';
import { formatRelativeTime } from '@/lib/user-display';

type CurrentUser = {
  id: string;
  fullName: string;
  initials: string;
};

type ChatPanelProps = {
  conversation: Conversation | null;
  onToggleInfo?: () => void;
  infoOpen?: boolean;
  emptyHint?: string;
  currentUser?: CurrentUser | null;
  onMessageActivity?: () => void;
  messagesOverride?: ChatMessage[];
  onSendOverride?: (text: string) => Promise<boolean>;
  sendingOverride?: boolean;
  textOnlyComposer?: boolean;
};

type ImageViewerState = {
  images: { src: string; name: string }[];
  index: number;
} | null;

const IMAGE_BUBBLE_MAX_W = 280;
const IMAGE_BUBBLE_MAX_H = 320;
const IMAGE_CORNER_CLASS = 'rounded-2xl';

type MessageGroupInfo = {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

function sameMessageGroup(a: ChatMessage, b: ChatMessage) {
  return a.from === b.from && a.senderName === b.senderName;
}

function getMessageGroupInfo(messages: ChatMessage[], index: number): MessageGroupInfo {
  const message = messages[index]!;
  const prev = messages[index - 1];
  const next = messages[index + 1];
  return {
    isFirstInGroup: !prev || !sameMessageGroup(prev, message),
    isLastInGroup: !next || !sameMessageGroup(next, message),
  };
}

function downloadAttachmentFile(name: string, dataUrl: string) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function openAttachmentInNewTab(dataUrl: string) {
  window.open(dataUrl, '_blank', 'noopener,noreferrer');
}

function fileTypeLabel(type: string, name: string) {
  if (type.includes('pdf') || name.toLowerCase().endsWith('.pdf')) return 'PDF';
  const ext = name.split('.').pop()?.toUpperCase();
  return ext && ext.length <= 5 ? ext : 'FILE';
}

function formatAttachmentMeta(type: string, name: string, sizeBytes: number) {
  const sizeKb = Math.max(1, Math.round(sizeBytes / 1024));
  return `${fileTypeLabel(type, name)} • ${sizeKb} KB`;
}

const IMAGE_ZOOM_MIN = 0.5;
const IMAGE_ZOOM_MAX = 4;
const IMAGE_ZOOM_STEP = 0.25;
const IMAGE_VIEWPORT_WIDTH = 'min(96vw, 1680px)';
const IMAGE_VIEWPORT_HEIGHT = 'calc(100dvh - 8rem)';

function ImageLightbox({
  viewer,
  onClose,
  onChangeIndex,
  prefersReducedMotion,
}: {
  viewer: NonNullable<ImageViewerState>;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
  prefersReducedMotion: boolean;
}) {
  const current = viewer.images[viewer.index];
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
  }, [viewer.index, current.src]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.imageViewerOpen = 'true';
    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.imageViewerOpen;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && viewer.index > 0) onChangeIndex(viewer.index - 1);
      if (event.key === 'ArrowRight' && viewer.index < viewer.images.length - 1) {
        onChangeIndex(viewer.index + 1);
      }
      if (event.key === '+' || event.key === '=') {
        setZoom((value) => Math.min(IMAGE_ZOOM_MAX, +(value + IMAGE_ZOOM_STEP).toFixed(2)));
      }
      if (event.key === '-') {
        setZoom((value) => Math.max(IMAGE_ZOOM_MIN, +(value - IMAGE_ZOOM_STEP).toFixed(2)));
      }
      if (event.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewer, onClose, onChangeIndex]);

  return (
    <div
      id="image-lightbox-root"
      className="fixed inset-0 flex flex-col"
      style={{
        zIndex: 2_147_483_000,
        width: '100vw',
        height: '100dvh',
        top: 0,
        left: 0,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${current.name}`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer border-0 p-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(48px) saturate(120%)',
          WebkitBackdropFilter: 'blur(48px) saturate(120%)',
        }}
        onClick={onClose}
        aria-label="Close image viewer"
      />

      <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <p className="min-w-0 truncate text-sm font-medium text-white">{current.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={zoom <= IMAGE_ZOOM_MIN}
            onClick={() =>
              setZoom((value) => Math.max(IMAGE_ZOOM_MIN, +(value - IMAGE_ZOOM_STEP).toFixed(2)))
            }
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25 disabled:cursor-default disabled:pointer-events-none disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-5" />
          </button>
          <span className="min-w-12 text-center text-sm font-medium tabular-nums text-white/85">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            disabled={zoom >= IMAGE_ZOOM_MAX}
            onClick={() =>
              setZoom((value) => Math.min(IMAGE_ZOOM_MAX, +(value + IMAGE_ZOOM_STEP).toFixed(2)))
            }
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25 disabled:cursor-default disabled:pointer-events-none disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => downloadAttachmentFile(current.name, current.src)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25"
            aria-label={`Download ${current.name}`}
          >
            <Download className="size-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25"
            aria-label="Close image viewer"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-6 sm:pb-6">
        {viewer.images.length > 1 ? (
          <>
            <button
              type="button"
              disabled={viewer.index === 0}
              onClick={() => onChangeIndex(viewer.index - 1)}
              className="absolute left-2 z-20 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25 disabled:cursor-default disabled:pointer-events-none disabled:opacity-30 sm:left-5"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-7" />
            </button>
            <button
              type="button"
              disabled={viewer.index === viewer.images.length - 1}
              onClick={() => onChangeIndex(viewer.index + 1)}
              className="absolute right-2 z-20 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25 disabled:cursor-default disabled:pointer-events-none disabled:opacity-30 sm:right-5"
              aria-label="Next image"
            >
              <ChevronRight className="size-7" />
            </button>
          </>
        ) : null}

        <div
          className="flex items-center justify-center overflow-auto"
          style={{
            width: IMAGE_VIEWPORT_WIDTH,
            height: IMAGE_VIEWPORT_HEIGHT,
          }}
          onWheel={(event) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            const delta = event.deltaY > 0 ? -IMAGE_ZOOM_STEP : IMAGE_ZOOM_STEP;
            setZoom((value) =>
              Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, +(value + delta).toFixed(2)))
            );
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: `calc(${IMAGE_VIEWPORT_WIDTH} * ${zoom})`,
              height: `calc(${IMAGE_VIEWPORT_HEIGHT} * ${zoom})`,
            }}
          >
            <motion.img
              key={current.src}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.24, ease: chatEase }}
              src={current.src}
              alt={current.name}
              className="h-full w-full cursor-default rounded-xl object-contain ring-1 ring-white/15"
              onClick={(event) => event.stopPropagation()}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {viewer.images.length > 1 ? (
        <p className="relative z-10 shrink-0 pb-5 text-center text-sm font-medium text-white/85">
          {viewer.index + 1} of {viewer.images.length}
        </p>
      ) : (
        <div className="shrink-0 pb-5" />
      )}
    </div>
  );
}

function ImageLightboxPortal({
  viewer,
  onClose,
  onChangeIndex,
  prefersReducedMotion,
}: {
  viewer: ImageViewerState;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
  prefersReducedMotion: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    viewer ? (
      <ImageLightbox
        viewer={viewer}
        onClose={onClose}
        onChangeIndex={onChangeIndex}
        prefersReducedMotion={prefersReducedMotion}
      />
    ) : null,
    document.body
  );
}

function MessageRow({
  message,
  index,
  isFirstInGroup,
  isLastInGroup,
  isNew,
  isRead,
  isPending,
  activeMenu,
  onOpenMenu,
  onCloseMenu,
  onCopy,
  onReply,
  onForward,
  onDelete,
  onActionToast,
  onJumpToMessage,
  onRegisterMessageRef,
  highlightedMessageId,
  onOpenImage,
  nowMs,
}: {
  message: ChatMessage;
  index: number;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isNew?: boolean;
  isRead?: boolean;
  isPending?: boolean;
  activeMenu: { messageId: string; x: number; y: number } | null;
  onOpenMenu?: (menu: { messageId: string; x: number; y: number }) => void;
  onCloseMenu?: () => void;
  onCopy?: (messageId: string, text: string) => void;
  onReply?: (target: ChatReplyTarget) => void;
  onForward?: () => void;
  onDelete?: () => void;
  onActionToast?: (message: string) => void;
  onJumpToMessage?: (messageId: string) => void;
  onRegisterMessageRef?: (messageId: string, node: HTMLDivElement | null) => void;
  highlightedMessageId?: string | null;
  onOpenImage?: (images: ChatAttachment[], index: number) => void;
  nowMs: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isMe = message.from === 'me';
  const motionProps = messageEnter(isMe, prefersReducedMotion ?? false);
  const [attachmentMenu, setAttachmentMenu] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const isMessageMenuOpen = activeMenu?.messageId === message.id;
  const messageMenuPos = isMessageMenuOpen
    ? { x: activeMenu.x, y: activeMenu.y }
    : null;

  useEffect(() => {
    const closeMenus = () => {
      setAttachmentMenu(null);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  useEffect(() => {
    if (!attachmentMenu) return;
    const closeOnScroll = () => setAttachmentMenu(null);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => window.removeEventListener('scroll', closeOnScroll, true);
  }, [attachmentMenu]);

  function toggleAttachmentMenu(
    event: React.MouseEvent<HTMLButtonElement>,
    attachmentIndex: number
  ) {
    event.stopPropagation();
    if (attachmentMenu?.index === attachmentIndex) {
      setAttachmentMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = 132;
    const padding = 8;
    const rawX = isMe ? rect.right - menuWidth : rect.left;
    const x = Math.max(padding, Math.min(rawX, window.innerWidth - menuWidth - padding));
    let y = rect.bottom + 6;
    if (y + menuHeight > window.innerHeight - padding) {
      y = Math.max(padding, rect.top - menuHeight - 6);
    }

    setAttachmentMenu({ index: attachmentIndex, x, y });
  }

  async function copyAttachmentLink(dataUrl: string) {
    try {
      await navigator.clipboard.writeText(dataUrl);
      onActionToast?.('Attachment link copied');
    } catch {
      onActionToast?.('Could not copy link');
    }
  }

  function downloadAttachment(name: string, dataUrl: string) {
    downloadAttachmentFile(name, dataUrl);
    onActionToast?.('Download started');
  }

  function openFileAttachment(dataUrl: string) {
    openAttachmentInNewTab(dataUrl);
    onActionToast?.('Opened attachment');
  }

  const displayTime = (() => {
    void nowMs;
    if (!message.createdAt) return message.time;
    const parsed = new Date(message.createdAt);
    if (Number.isNaN(parsed.getTime())) return message.time;
    return formatRelativeTime(parsed);
  })();

  const imageAttachments =
    message.attachments?.filter((attachment) => attachment.type.startsWith('image/')) ?? [];
  const fileAttachments =
    message.attachments?.filter((attachment) => !attachment.type.startsWith('image/')) ?? [];
  const hasImages = imageAttachments.length > 0;
  const hasFiles = fileAttachments.length > 0;
  const hasText = Boolean(message.text?.trim());
  const showBubble = hasText || hasImages;
  const imageOnly = hasImages && !hasText;

  function openMessageMenu(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const viewportPadding = 8;
    const rawX = isMe ? rect.right - menuWidth : rect.left;
    const x = Math.max(
      viewportPadding,
      Math.min(rawX, window.innerWidth - menuWidth - viewportPadding)
    );
    const y = Math.min(rect.bottom + 6, window.innerHeight - 180);
    onOpenMenu?.({ messageId: message.id, x, y });
  }

  function renderFileAttachmentList() {
    return fileAttachments.map((attachment, attachmentIndex) => (
      <div
        key={`${attachment.name}-${attachmentIndex}`}
        className={cn(
          'flex max-w-[min(100%,340px)] items-center gap-1 rounded-2xl border px-2 py-2 text-xs',
          isMe
            ? 'border-chat-bubble-out/30 bg-chat-bubble-out/10 text-chat-foreground'
            : 'border-chat-border bg-chat-muted text-chat-foreground'
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => openFileAttachment(attachment.dataUrl)}
          aria-label={`Open ${attachment.name}`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-chat-border bg-chat-main px-0.5 text-[9px] font-semibold leading-none text-chat-subtle">
            {fileTypeLabel(attachment.type, attachment.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-snug">{attachment.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-chat-subtle">
              {formatAttachmentMeta(attachment.type, attachment.name, attachment.size)}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              downloadAttachment(attachment.name, attachment.dataUrl);
            }}
            className="inline-flex size-8 items-center justify-center rounded-md text-chat-subtle hover:bg-chat-border hover:text-chat-foreground"
            aria-label={`Download ${attachment.name}`}
          >
            <Download className="size-3.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(event) => toggleAttachmentMenu(event, attachmentIndex)}
              className="inline-flex size-8 items-center justify-center rounded-md text-chat-subtle hover:bg-chat-border hover:text-chat-foreground"
              aria-label="Attachment actions"
              aria-expanded={attachmentMenu?.index === attachmentIndex}
            >
              <MoreActionsIcon />
            </button>
          </div>
        </div>
      </div>
    ));
  }

  return (
    <motion.div
      layout={!prefersReducedMotion}
      {...motionProps}
      transition={{
        ...chatSpring,
        delay: isNew ? 0 : staggerDelay(index, prefersReducedMotion ?? false),
      }}
      className={cn(
        'group flex w-full gap-3',
        isMe ? 'flex-row-reverse justify-start items-end' : 'flex-row items-end',
        isFirstInGroup ? 'mt-6' : 'mt-3'
      )}
    >
      <UserAvatar initials={message.senderInitials} size="sm" />

      <div
        className={cn(
          'flex min-w-0 max-w-[min(100%,520px)] flex-col',
          isMe ? 'items-end' : 'items-start'
        )}
      >
        {showBubble ? (
          <motion.div
            className={cn(
              'relative w-fit max-w-full',
              isMe ? 'self-end' : 'self-start',
              message.reactions?.length && 'mb-3'
            )}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.005 }}
            transition={{ duration: 0.15 }}
          >
            <div
              ref={(node) => onRegisterMessageRef?.(message.id, node)}
              className={cn(
                'text-sm leading-relaxed transition-colors',
                imageOnly
                  ? cn('relative w-fit overflow-hidden', IMAGE_CORNER_CLASS)
                  : cn(
                      'overflow-hidden rounded-2xl',
                      isMe
                        ? 'rounded-br-md bg-chat-bubble-out text-chat-bubble-out-fg'
                        : 'rounded-bl-md border border-chat-border bg-chat-bubble-in text-chat-foreground',
                      hasText && !hasImages && 'px-4 py-3',
                      hasImages && !hasText && 'relative w-fit max-w-full p-0',
                      imageOnly && IMAGE_CORNER_CLASS
                    ),
                highlightedMessageId === message.id && 'ring-2 ring-chat-brand'
              )}
              style={imageOnly ? { maxWidth: IMAGE_BUBBLE_MAX_W } : undefined}
              onContextMenu={openMessageMenu}
            >
              {message.replyTo ? (
                <button
                  type="button"
                  className={cn(
                    'mb-0 w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-[11px]',
                    (hasImages || hasText) && 'm-2 mb-0',
                    isMe
                      ? 'border-l-chat-bubble-out-fg border-y border-r border-chat-bubble-out/30 bg-chat-bubble-out/20 text-chat-bubble-out-fg'
                      : 'border-l-chat-brand border-y border-r border-chat-border bg-chat-main text-chat-subtle'
                  )}
                  onClick={() => onJumpToMessage?.(message.replyTo!.id)}
                >
                  <p className="font-semibold">{message.replyTo.senderName}</p>
                  <p className="truncate opacity-90">{message.replyTo.text}</p>
                </button>
              ) : null}

              {hasImages ? (
                imageAttachments.length === 1 ? (
                  <button
                    key={`${imageAttachments[0]!.name}-0`}
                    type="button"
                    className={cn(
                      'group/img relative m-0 block w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0 leading-none',
                      IMAGE_CORNER_CLASS
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenImage?.(imageAttachments, 0);
                    }}
                    aria-label={`Open ${imageAttachments[0]!.name}`}
                  >
                    <img
                      src={imageAttachments[0]!.dataUrl}
                      alt={imageAttachments[0]!.name}
                      className={cn('block w-full object-cover', IMAGE_CORNER_CLASS)}
                      style={{
                        maxWidth: IMAGE_BUBBLE_MAX_W,
                        maxHeight: IMAGE_BUBBLE_MAX_H,
                        aspectRatio: '1 / 1',
                        borderRadius: 'var(--radius-2xl)',
                      }}
                      draggable={false}
                    />
                  </button>
                ) : (
                <div
                  className={cn(
                    'grid max-w-full gap-1 overflow-hidden rounded-2xl',
                    imageAttachments.length === 3
                      ? 'grid-cols-2 grid-rows-2'
                      : 'grid-cols-2',
                    message.replyTo && 'mt-2'
                  )}
                  style={{ width: IMAGE_BUBBLE_MAX_W, maxWidth: '100%' }}
                >
                  {imageAttachments.slice(0, 4).map((attachment, imageIndex) => (
                    <button
                      key={`${attachment.name}-${imageIndex}`}
                      type="button"
                      className={cn(
                        'group/img relative block cursor-pointer overflow-hidden rounded-xl bg-black/5',
                        imageAttachments.length === 3 && imageIndex === 0 && 'row-span-2',
                        'aspect-square'
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onOpenImage?.(imageAttachments, imageIndex);
                      }}
                      aria-label={`Open ${attachment.name}`}
                    >
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-[1.02]"
                        draggable={false}
                      />
                      {imageAttachments.length > 4 && imageIndex === 3 ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                          +{imageAttachments.length - 4}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
                )
              ) : null}

              {hasText ? (
                <div className={cn(hasImages && 'px-4 py-3')}>{message.text}</div>
              ) : null}

              <p
                className={cn(
                  'text-[10px]',
                  imageOnly
                    ? 'absolute right-2 bottom-2 rounded-full bg-black/45 px-2 py-0.5 text-white'
                    : cn(
                        'mt-1 flex w-full justify-end',
                        isMe ? 'text-chat-bubble-out-fg/75' : 'text-chat-subtle'
                      ),
                  hasImages && hasText ? 'px-4 pb-2' : ''
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {displayTime}
                  {isMe ? (
                    isPending ? (
                      <span className={imageOnly ? 'text-white/80' : 'text-chat-bubble-out-fg/60'}>
                        ...
                      </span>
                    ) : isRead ? (
                      <CheckCheck className={cn('size-3.5', imageOnly ? 'text-sky-300' : 'text-sky-400')} />
                    ) : (
                      <Check
                        className={cn(
                          'size-3.5',
                          imageOnly ? 'text-white/80' : 'text-chat-bubble-out-fg/70'
                        )}
                      />
                    )
                  ) : null}
                </span>
              </p>
            </div>
            {message.reactions?.length ? (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, ...chatSpring }}
                className={cn(
                  'absolute -bottom-3 flex gap-1',
                  isMe ? 'right-2' : 'left-2'
                )}
              >
                {message.reactions.map((reaction) => (
                  <span
                    key={reaction.emoji}
                    className="flex items-center gap-0.5 rounded-full border border-chat-border bg-chat-muted px-1.5 py-0.5 text-[11px] shadow-sm"
                  >
                    {reaction.emoji}
                    {reaction.count > 1 ? (
                      <span className="text-chat-subtle">{reaction.count}</span>
                    ) : null}
                  </span>
                ))}
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}

        {messageMenuPos ? (
          <div
            className="fixed z-50 w-40 rounded-md border border-chat-border bg-chat-inbox p-1 shadow-lg"
            style={{ left: messageMenuPos.x, top: messageMenuPos.y }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-chat-foreground hover:bg-chat-muted"
              onClick={() => {
                onCopy?.(message.id, message.text ?? '');
                onCloseMenu?.();
              }}
            >
              <Copy className="size-3.5" />
              Copy
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-chat-foreground hover:bg-chat-muted"
              onClick={() => {
                onReply?.({
                  id: message.id,
                  senderName: message.senderName,
                  text: message.text ?? '',
                });
                onCloseMenu?.();
              }}
            >
              <Reply className="size-3.5" />
              Reply
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-chat-foreground hover:bg-chat-muted"
              onClick={() => {
                onForward?.();
                onCloseMenu?.();
              }}
            >
              <Forward className="size-3.5" />
              Forward
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-destructive hover:bg-chat-muted"
              onClick={() => {
                onDelete?.();
                onCloseMenu?.();
              }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        ) : null}

        {hasFiles ? (
          <div className={cn('space-y-1', (hasImages || hasText) && 'mt-1')}>
            {renderFileAttachmentList()}
            {attachmentMenu ? (
              <div
                className="fixed z-50 w-40 rounded-md border border-chat-border bg-chat-inbox p-1 shadow-lg"
                style={{ left: attachmentMenu.x, top: attachmentMenu.y }}
                onClick={(event) => event.stopPropagation()}
              >
                {fileAttachments[attachmentMenu.index] ? (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-chat-foreground hover:bg-chat-muted"
                      onClick={() => {
                        openFileAttachment(fileAttachments[attachmentMenu.index]!.dataUrl);
                        setAttachmentMenu(null);
                      }}
                    >
                      <ExternalLink className="size-3.5" />
                      Open in new tab
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-chat-foreground hover:bg-chat-muted"
                      onClick={() => {
                        const attachment = fileAttachments[attachmentMenu.index]!;
                        downloadAttachment(attachment.name, attachment.dataUrl);
                        setAttachmentMenu(null);
                      }}
                    >
                      <Download className="size-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-chat-foreground hover:bg-chat-muted"
                      onClick={() => {
                        copyAttachmentLink(fileAttachments[attachmentMenu.index]!.dataUrl);
                        setAttachmentMenu(null);
                      }}
                    >
                      <Link2 className="size-3.5" />
                      Copy link
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {message.imageGrid?.length ? (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: chatEase }}
            className="mt-1 grid grid-cols-2 gap-2 rounded-2xl border border-chat-border bg-chat-bubble-in p-2"
          >
            {message.imageGrid.map((shade, gridIndex) => (
              <motion.div
                key={gridIndex}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: gridIndex * 0.06, duration: 0.3, ease: chatEase }}
                className="aspect-[4/3] rounded-xl border border-chat-border"
                style={{ backgroundColor: shade }}
              />
            ))}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function ChatPanel({
  conversation,
  onToggleInfo,
  infoOpen,
  emptyHint,
  currentUser,
  onMessageActivity,
  messagesOverride,
  onSendOverride,
  sendingOverride,
  textOnlyComposer = false,
}: ChatPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [replyTarget, setReplyTarget] = useState<ChatReplyTarget | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState<{
    messageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [imageViewer, setImageViewer] = useState<ImageViewerState>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentCarouselRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [nowMs, setNowMs] = useState(Date.now());

  const usesExternalMessages = messagesOverride !== undefined;
  const isPersistedDirect = Boolean(
    !usesExternalMessages &&
      conversation?.type === 'direct' &&
      conversation.otherUserId &&
      currentUser
  );

  const synced = useConversationMessages(
    conversation?.id ?? null,
    currentUser ?? null,
    conversation?.messages ?? [],
    isPersistedDirect,
    onMessageActivity
  );

  const local = useLocalMessages(conversation?.messages ?? [], conversation?.id ?? null);

  const messages = messagesOverride ?? (isPersistedDirect ? synced.messages : local.messages);
  const sending = sendingOverride ?? (isPersistedDirect ? synced.sending : local.sending);

  useEffect(() => {
    setDraft('');
    setAttachments([]);
    setReplyTarget(null);
    setActiveMessageMenu(null);
    setHighlightedMessageId(null);
    setImageViewer(null);
  }, [conversation?.id]);

  function openImageViewer(attachments: ChatAttachment[], index: number) {
    const images = attachments.filter((attachment) => attachment.type.startsWith('image/'));
    const target = attachments[index];
    if (!target?.type.startsWith('image/')) return;
    const imageIndex = images.findIndex((image) => image.dataUrl === target.dataUrl);
    setImageViewer({
      images: images.map((image) => ({ src: image.dataUrl, name: image.name })),
      index: Math.max(0, imageIndex),
    });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }

  async function handlePickAttachments(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    const encoded = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: await fileToDataUrl(file),
      }))
    );

    setAttachments((prev) => [...prev, ...encoded].slice(0, 10));
    input.value = '';
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && attachments.length === 0) || !conversation || sending) return;

    if (onSendOverride) {
      const ok = await onSendOverride(text);
      if (ok) {
        setDraft('');
        setAttachments([]);
        setReplyTarget(null);
      }
      return;
    }

    if (isPersistedDirect) {
      const ok = await synced.sendMessage(text, attachments, replyTarget);
      if (ok) {
        setDraft('');
        setAttachments([]);
        setReplyTarget(null);
      }
      return;
    }

    const ok = await local.sendMessage(
      text,
      currentUser?.initials ?? 'YU',
      attachments,
      replyTarget
    );
    if (ok) {
      setDraft('');
      setAttachments([]);
      setReplyTarget(null);
    }
  }

  function handleCopyMessage(messageId: string, text: string) {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      setActionToast('Message copied');
      setTimeout(() => setActionToast(null), 1200);
    }).catch(() => undefined);
  }

  function handleReplyMessage(target: ChatReplyTarget) {
    setReplyTarget(target);
    draftInputRef.current?.focus();
    setActionToast('Reply draft added');
    setTimeout(() => setActionToast(null), 1200);
  }

  function handleJumpToMessage(messageId: string) {
    const node = messageRefs.current[messageId];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(messageId);
    setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
    }, 1800);
  }

  function handleNotImplementedAction() {
    setActionToast('This action is coming soon');
    setTimeout(() => setActionToast(null), 1200);
  }

  function handleActionToast(message: string) {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 1200);
  }

  useEffect(() => {
    const closeMenu = () => setActiveMessageMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  if (!conversation) {
    return (
      <motion.section
        {...(prefersReducedMotion ? {} : chatFadeUp)}
        className="flex flex-1 flex-col items-center justify-center bg-chat-main px-6 text-center"
      >
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={chatSpring}
        >
          <GroupAvatar initials="승" size="lg" className="font-bold" />
        </motion.div>
        <motion.h2
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: chatEase }}
          className="mt-5 text-xl font-semibold text-chat-foreground"
        >
          Select a conversation
        </motion.h2>
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35, ease: chatEase }}
          className="mt-2 max-w-sm text-sm text-chat-subtle"
        >
          {emptyHint ?? 'Choose a chat from the sidebar to start messaging.'}
        </motion.p>
      </motion.section>
    );
  }

  const headerMembers = conversation.members?.slice(0, 4) ?? [];
  function scrollAttachmentCarousel(direction: 'left' | 'right') {
    const el = attachmentCarouselRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -180 : 180;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={conversation.id}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2, ease: chatEase }}
        className="flex h-full min-w-0 flex-1 flex-col bg-chat-main"
      >
        <motion.header
          initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: chatEase }}
          className="flex items-center justify-between gap-3 border-b border-chat-border px-4 py-3 lg:px-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <motion.button
              type="button"
              onClick={onToggleInfo}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className={cn(
                'truncate rounded-md px-1.5 py-0.5 text-left text-sm font-semibold transition-colors hover:bg-chat-muted',
                infoOpen ? 'text-chat-brand' : 'text-chat-foreground'
              )}
              aria-expanded={infoOpen}
              aria-label={`${conversation.name} info`}
            >
              {conversation.name}
            </motion.button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <HeaderIcon label="Video call">
              <Video className="size-[18px]" />
            </HeaderIcon>
            <HeaderIcon label="Voice call">
              <Phone className="size-[18px]" />
            </HeaderIcon>
            <HeaderIcon label="Screen share">
              <MonitorUp className="size-[18px]" />
            </HeaderIcon>
            <HeaderIcon
              label={conversation.isGroup ? 'Group info' : 'Contact info'}
              active={infoOpen}
              onClick={onToggleInfo}
            >
              <Info className="size-[18px]" />
            </HeaderIcon>

            {headerMembers.length ? (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: chatEase }}
                className="ml-2 hidden items-center sm:flex"
              >
                {headerMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.12 + index * 0.05, ...chatSpring }}
                    className={cn(index > 0 && '-ml-2')}
                    style={{ zIndex: headerMembers.length - index }}
                  >
                    <UserAvatar
                      initials={member.initials}
                      size="xs"
                      showRing
                      className="ring-avatar-ring"
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </div>
        </motion.header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="flex w-full flex-col pb-4">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: chatEase }}
              className="flex justify-center"
            >
              <span className="rounded-full bg-chat-muted px-4 py-1 text-[11px] text-chat-subtle">
                Today
              </span>
            </motion.div>
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const { isFirstInGroup, isLastInGroup } = getMessageGroupInfo(messages, index);
                return (
                <MessageRow
                  key={message.id}
                  message={message}
                  index={index}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  isNew={message.id.startsWith('pending-')}
                  isPending={message.id.startsWith('pending-')}
                  isRead={message.from === 'me' && Boolean(message.readByRecipient)}
                  activeMenu={activeMessageMenu}
                  onOpenMenu={setActiveMessageMenu}
                  onCloseMenu={() => setActiveMessageMenu(null)}
                  onCopy={handleCopyMessage}
                  onReply={handleReplyMessage}
                  onForward={handleNotImplementedAction}
                  onDelete={handleNotImplementedAction}
                  onActionToast={handleActionToast}
                  onJumpToMessage={handleJumpToMessage}
                  onRegisterMessageRef={(messageId, node) => {
                    messageRefs.current[messageId] = node;
                  }}
                  highlightedMessageId={highlightedMessageId}
                  onOpenImage={openImageViewer}
                  nowMs={nowMs}
                />
              );
              })}
            </AnimatePresence>
          </div>
        </div>
        {actionToast ? (
          <div className="pointer-events-none fixed right-4 bottom-24 z-20 rounded-md border border-chat-border bg-chat-inbox px-3 py-1.5 text-xs text-chat-foreground shadow-sm">
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5" />
              {actionToast}
            </span>
          </div>
        ) : null}

        <ImageLightboxPortal
          viewer={imageViewer}
          onClose={() => setImageViewer(null)}
          onChangeIndex={(index) =>
            setImageViewer((prev) => (prev ? { ...prev, index } : null))
          }
          prefersReducedMotion={prefersReducedMotion ?? false}
        />

        <motion.footer
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: chatEase }}
          className="border-t border-chat-border px-4 py-4 lg:px-8"
        >
          <form onSubmit={handleSend} className="flex w-full items-center gap-2">
            <div className="relative min-w-0 flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handlePickAttachments}
              />
              {attachments.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="relative">
                  <div ref={attachmentCarouselRef} className="overflow-x-auto pb-1">
                    <div className="flex w-max items-start gap-1.5">
                      {attachments.map((attachment, index) => {
                        const absoluteIndex = index;
                        return (
                          <div
                            key={`${attachment.name}-${absoluteIndex}`}
                            className="group relative w-[120px] shrink-0 overflow-hidden rounded-xl border border-chat-border bg-chat-muted p-1"
                          >
                            <button
                              type="button"
                              className="absolute top-1 right-1 z-10 rounded-sm bg-black/50 px-1 py-0 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                setAttachments((prev) =>
                                  prev.filter((_, itemIndex) => itemIndex !== absoluteIndex)
                                )
                              }
                              aria-label={`Remove ${attachment.name}`}
                            >
                              ×
                            </button>

                            {attachment.type.startsWith('image/') ? (
                              <button
                                type="button"
                                className="block w-full cursor-pointer"
                                onClick={() => openImageViewer(attachments, absoluteIndex)}
                                aria-label={`Preview ${attachment.name}`}
                              >
                                <img
                                  src={attachment.dataUrl}
                                  alt={attachment.name}
                                  className="h-10 w-full rounded-lg object-cover"
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-chat-border bg-chat-main text-[9px] font-semibold text-chat-subtle"
                                onClick={() => openAttachmentInNewTab(attachment.dataUrl)}
                                aria-label={`Open ${attachment.name}`}
                              >
                                {fileTypeLabel(attachment.type, attachment.name)}
                              </button>
                            )}
                            <p className="mt-1 truncate px-0.5 text-[10px] text-chat-foreground">
                              {attachment.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                    {attachments.length > 1 ? (
                      <>
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                          <button
                            type="button"
                            className="pointer-events-auto flex size-6 items-center justify-center rounded-md bg-black/70 text-white/90 shadow-lg transition-colors hover:bg-black/85 hover:text-white"
                            onClick={() => scrollAttachmentCarousel('left')}
                            aria-label="Scroll attachments left"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                          <button
                            type="button"
                            className="pointer-events-auto flex size-6 items-center justify-center rounded-md bg-black/70 text-white/90 shadow-lg transition-colors hover:bg-black/85 hover:text-white"
                            onClick={() => scrollAttachmentCarousel('right')}
                            aria-label="Scroll attachments right"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {replyTarget ? (
                <div className="flex items-start justify-between gap-2 rounded-lg border-l-4 border-l-chat-brand border-y border-r border-chat-border bg-chat-muted px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-chat-foreground">
                      Replying to {replyTarget.senderName}
                    </p>
                    <p className="truncate text-[11px] text-chat-subtle">{replyTarget.text}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1 text-chat-subtle hover:bg-chat-border hover:text-chat-foreground"
                    onClick={() => setReplyTarget(null)}
                    aria-label="Clear reply target"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : null}
              <div className="flex items-center gap-1 rounded-2xl border border-chat-border bg-chat-muted px-2">
                <input
                  ref={draftInputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Compose a message..."
                  className="h-12 min-w-0 flex-1 bg-transparent px-2 text-sm text-chat-foreground outline-none placeholder:text-chat-subtle"
                />
                {!textOnlyComposer ? (
                  <>
                    <FooterIcon label="Voice note">
                      <Mic className="size-[18px]" />
                    </FooterIcon>
                    <FooterIcon label="Attach file" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="size-[18px]" />
                    </FooterIcon>
                  </>
                ) : null}
                <motion.button
                  type="submit"
                  disabled={(!draft.trim() && attachments.length === 0) || sending}
                  aria-label="Send message"
                  whileHover={
                    prefersReducedMotion || (!draft.trim() && attachments.length === 0)
                      ? undefined
                      : { scale: 1.06 }
                  }
                  whileTap={
                    prefersReducedMotion || (!draft.trim() && attachments.length === 0)
                      ? undefined
                      : { scale: 0.94 }
                  }
                  className="flex size-9 items-center justify-center rounded-xl bg-avatar-bg text-avatar-fg transition-opacity disabled:opacity-40"
                >
                  <SendHorizontal className="size-[18px]" />
                </motion.button>
              </div>
            </div>
          </form>
        </motion.footer>
      </motion.section>
    </AnimatePresence>
  );
}

function HeaderIcon({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      className={cn(
        'flex size-9 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-chat-brand-soft text-chat-brand'
          : 'text-chat-subtle hover:bg-chat-muted hover:text-chat-foreground'
      )}
    >
      {children}
    </motion.button>
  );
}

function FooterIcon({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
      className="flex size-9 items-center justify-center rounded-lg text-chat-subtle transition-colors hover:bg-chat-border hover:text-chat-foreground"
    >
      {children}
    </motion.button>
  );
}

function MoreActionsIcon() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="size-1 rounded-full bg-current" />
      <span className="size-1 rounded-full bg-current" />
      <span className="size-1 rounded-full bg-current" />
    </span>
  );
}
