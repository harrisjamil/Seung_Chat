'use client';

import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

const BRAND_NAME = 'Seung';

type LogoVariant = 'dark' | 'light';

function SeungChatMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-white text-neutral-900 shadow-sm dark:bg-neutral-200',
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="font-bold leading-none select-none text-neutral-900"
        style={{ fontSize: size * 0.48 }}
      >
        승
      </span>
    </div>
  );
}

function TypewriterBrand({
  text = BRAND_NAME,
  className,
  startDelay = 700,
  speed = 75,
}: {
  text?: string;
  className?: string;
  startDelay?: number;
  speed?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? text : '');
  const [done, setDone] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed('');
    setDone(false);

    let index = 0;
    let interval: ReturnType<typeof setInterval>;

    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelay, speed, prefersReducedMotion]);

  return (
    <span className={cn('inline-flex items-center text-lg font-semibold tracking-tight', className)}>
      {displayed}
      {!done && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[1.1em] w-px bg-current"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.45, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </span>
  );
}

export function SeungChatLogo({
  className,
  markSize = 40,
  variant = 'dark',
  typewriterDelay = 700,
}: {
  className?: string;
  markSize?: number;
  variant?: LogoVariant;
  typewriterDelay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const textClass = variant === 'dark' ? 'text-background' : 'text-foreground';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        className="inline-flex shrink-0"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.45 }}
        aria-hidden
      >
        <SeungChatMark size={markSize} />
      </motion.div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.55 }}
        aria-label="Seung"
      >
        <TypewriterBrand startDelay={typewriterDelay} className={textClass} />
      </motion.div>
    </div>
  );
}

export { SeungChatMark, BRAND_NAME };
