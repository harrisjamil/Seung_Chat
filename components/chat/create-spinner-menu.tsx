'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { chatEase, chatSpring } from '@/lib/chat-animations';
import {
  createOptions,
  FAN_ANGLES,
  FAN_HUB_OFFSET_X,
  FAN_HUB_SVG_X,
  FAN_RADIUS,
  FAN_SIZE,
  fanLabelAnchor,
  fanLabelTranslate,
  polarPosition,
  type CreateActionId,
} from '@/lib/create-options';
import type { CreatePayload } from '@/lib/chat-create-utils';
import { CreateActionSheet } from '@/components/chat/create-action-sheet';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type HubPoint = { x: number; y: number };

type CreateSpinnerMenuProps = {
  className?: string;
  onComplete?: (payload: CreatePayload) => void;
};

export function CreateSpinnerMenu({ className, onComplete }: CreateSpinnerMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hub, setHub] = useState<HubPoint>({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedAction, setSelectedAction] = useState<CreateActionId | null>(null);
  const [useCompactMenu, setUseCompactMenu] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    function updateHub() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setHub({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setUseCompactMenu(window.innerWidth < 768);
    }

    updateHub();
    window.addEventListener('resize', updateHub);
    window.addEventListener('scroll', updateHub, true);
    return () => {
      window.removeEventListener('resize', updateHub);
      window.removeEventListener('scroll', updateHub, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (useCompactMenu || prefersReducedMotion) return;

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev <= 0 ? createOptions.length - 1 : prev - 1;
          return next;
        });
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % createOptions.length);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const index = activeIndex < 0 ? 0 : activeIndex;
        openAction(createOptions[index]?.id);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, activeIndex, useCompactMenu, prefersReducedMotion]);

  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  function openAction(id: CreateActionId | undefined) {
    if (!id) return;
    setOpen(false);
    if (id === 'connection') {
      router.push('/seung_chat/connect');
      return;
    }
    setSelectedAction(id);
  }

  return (
    <>
      <CreateActionSheet
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
        onComplete={onComplete}
      />

      <div className={cn('relative z-50 my-5', className)}>
        <motion.button
          ref={triggerRef}
          type="button"
          data-chat-create-trigger
          aria-label={open ? 'Close create menu' : 'Open create menu'}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((prev) => !prev)}
          animate={{
            rotate: open ? 45 : 0,
            scale: open ? 1.05 : 1,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : chatSpring}
          whileHover={prefersReducedMotion ? undefined : { scale: open ? 1.05 : 1.08 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
          className={cn(
            'relative flex size-11 items-center justify-center rounded-full bg-avatar-bg text-avatar-fg shadow-lg ring-2 ring-chat-nav',
            open && 'ring-foreground/20 dark:ring-white/25'
          )}
        >
          {open ? (
            <X className="size-5" strokeWidth={2.5} />
          ) : (
            <Plus className="size-5" strokeWidth={2.5} />
          )}
          {open && !prefersReducedMotion ? (
            <motion.span
              className="absolute inset-0 rounded-full ring-2 ring-foreground/15 dark:ring-white/20"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : null}
        </motion.button>
      </div>

      {mounted ? (
        <CreateMenuPortal
          open={open}
          hub={hub}
          activeIndex={activeIndex}
          useCompactMenu={useCompactMenu}
          prefersReducedMotion={prefersReducedMotion ?? false}
          onClose={() => setOpen(false)}
          onHoverIndex={setActiveIndex}
          onSelect={openAction}
        />
      ) : null}
    </>
  );
}

type CreateMenuPortalProps = {
  open: boolean;
  hub: HubPoint;
  activeIndex: number;
  useCompactMenu: boolean;
  prefersReducedMotion: boolean;
  onClose: () => void;
  onHoverIndex: (index: number) => void;
  onSelect: (id: CreateActionId) => void;
};

function FanHoverLabel({ index }: { index: number }) {
  const option = createOptions[index]!;
  const angle = FAN_ANGLES[index] ?? 0;
  const { x, y } = fanLabelAnchor(angle);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: 1,
        scale: 1,
        left: FAN_HUB_OFFSET_X + x,
        top: FAN_SIZE / 2 + y,
      }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.18, ease: chatEase }}
      className="pointer-events-none absolute z-10 w-[min(160px,calc(100vw-100px))] rounded-xl bg-chat-inbox/95 px-2.5 py-2 text-left shadow-md ring-1 ring-chat-border/60 backdrop-blur-sm"
      style={{ translate: fanLabelTranslate(angle) }}
    >
      <p className="text-[11px] font-semibold leading-tight text-chat-foreground">{option.label}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-balance text-chat-subtle">
        {option.description}
      </p>
    </motion.div>
  );
}

function CreateMenuPortal({
  open,
  hub,
  activeIndex,
  useCompactMenu,
  prefersReducedMotion,
  onClose,
  onHoverIndex,
  onSelect,
}: CreateMenuPortalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close create menu"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {useCompactMenu || prefersReducedMotion ? (
            <motion.div
              initial={{ opacity: 0, x: -16, y: '-50%' }}
              animate={{ opacity: 1, x: 0, y: '-50%' }}
              exit={{ opacity: 0, x: -16, y: '-50%' }}
              transition={{ duration: 0.28, ease: chatEase }}
              style={{ left: hub.x + 36, top: hub.y }}
              className="fixed z-[56] w-[min(calc(100vw-80px),280px)] -translate-y-1/2 rounded-2xl border border-chat-border bg-chat-inbox p-2 shadow-2xl"
            >
              <p className="px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-chat-subtle">
                Create on Seung
              </p>
              {createOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.22 }}
                    onClick={() => onSelect(option.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-chat-muted"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-chat-border bg-chat-main shadow-sm">
                      <Icon className="size-[18px]" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-chat-foreground">
                        {option.label}
                      </span>
                      <span className="block text-[10px] text-chat-subtle">{option.description}</span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <div
              className="pointer-events-none fixed z-[56]"
              style={{
                left: hub.x - FAN_HUB_OFFSET_X,
                top: hub.y,
                transform: 'translateY(-50%)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                transition={{ duration: 0.35, ease: chatEase }}
                className="relative overflow-visible"
                style={{ width: FAN_SIZE, height: FAN_SIZE }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="absolute rounded-full border border-dashed border-chat-border/50"
                  style={{
                    left: FAN_HUB_OFFSET_X,
                    top: '50%',
                    width: FAN_SIZE - 24,
                    height: FAN_SIZE - 24,
                    translate: '-50% -50%',
                  }}
                />
                <div
                  className="absolute rounded-full border border-chat-border/30 bg-chat-muted/15 backdrop-blur-[1px]"
                  style={{
                    left: FAN_HUB_OFFSET_X,
                    top: '50%',
                    width: FAN_SIZE,
                    height: FAN_SIZE,
                    translate: '-50% -50%',
                  }}
                />

                {activeIndex >= 0 && createOptions[activeIndex] ? (
                  <FanHoverLabel index={activeIndex} />
                ) : null}

                <svg
                  className="absolute inset-0 overflow-visible"
                  viewBox={`${-FAN_SIZE / 2} ${-FAN_SIZE / 2} ${FAN_SIZE} ${FAN_SIZE}`}
                  aria-hidden
                >
                  {createOptions.map((option, index) => {
                    const angle = FAN_ANGLES[index] ?? 0;
                    const icon = polarPosition(angle, FAN_RADIUS);
                    const tip = index === activeIndex ? fanLabelAnchor(angle) : icon;
                    const isActive = index === activeIndex;
                    return (
                      <motion.line
                        key={option.id}
                        x1={FAN_HUB_SVG_X}
                        y1={0}
                        x2={FAN_HUB_SVG_X + tip.x}
                        y2={tip.y}
                        stroke="currentColor"
                        strokeWidth={isActive ? 1.5 : 1}
                        className={cn(
                          'text-chat-border transition-colors',
                          isActive && 'text-chat-foreground dark:text-white'
                        )}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: isActive ? 0.9 : 0.35 }}
                        transition={{ delay: index * 0.05, duration: 0.35, ease: chatEase }}
                      />
                    );
                  })}
                </svg>

                {createOptions.map((option, index) => {
                  const Icon = option.icon;
                  const angle = FAN_ANGLES[index] ?? 0;
                  const { x, y } = polarPosition(angle, FAN_RADIUS);
                  const isActive = index === activeIndex;

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                      animate={{ opacity: 1, x, y, scale: 1 }}
                      exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                      transition={{ ...chatSpring, delay: index * 0.045 }}
                      className="pointer-events-auto absolute top-1/2"
                      style={{
                        left: FAN_HUB_OFFSET_X,
                        translate: '-50% -50%',
                      }}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => onHoverIndex(index)}
                        onFocus={() => onHoverIndex(index)}
                        onClick={() => onSelect(option.id)}
                        className={cn(
                          'group relative flex size-11 items-center justify-center rounded-full border shadow-lg transition-all',
                          isActive
                            ? 'scale-110 border-foreground bg-avatar-bg text-avatar-fg dark:border-white'
                            : 'border-chat-border bg-chat-inbox text-chat-foreground hover:scale-105 hover:bg-chat-muted'
                        )}
                      >
                        <Icon className="size-[18px]" strokeWidth={1.75} />
                        {isActive ? (
                          <motion.span
                            layoutId="create-active-ring"
                            className="absolute inset-0 rounded-full ring-2 ring-foreground/20 dark:ring-white/30"
                            transition={chatSpring}
                          />
                        ) : null}
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
