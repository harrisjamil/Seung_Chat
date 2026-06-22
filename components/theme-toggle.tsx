'use client';

import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
};

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'flex size-9 items-center justify-center rounded-lg text-chat-subtle transition-colors hover:bg-chat-muted hover:text-chat-foreground',
        className
      )}
    >
      {isDark ? (
        <Sun className={cn('size-[18px]', iconClassName)} />
      ) : (
        <Moon className={cn('size-[18px]', iconClassName)} />
      )}
    </button>
  );
}
