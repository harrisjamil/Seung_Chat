export const chatEase = [0.22, 1, 0.36, 1] as const;

export const chatSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
};

export const chatSpringSoft = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
};

export const chatFadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: chatEase },
};

export const chatSlideRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: chatSpringSoft,
};

export const chatSlideLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: chatSpringSoft,
};

export function messageEnter(isMe: boolean, reduced: boolean) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, x: isMe ? 16 : -16, y: 8, scale: 0.98 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    transition: chatSpring,
  };
}

export function staggerDelay(index: number, reduced: boolean) {
  if (reduced) return 0;
  return Math.min(index * 0.04, 0.24);
}
