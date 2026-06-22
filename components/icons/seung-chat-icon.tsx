import { cn } from '@/lib/utils';

export function SeungChatIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-[18px] items-center justify-center text-[17px] font-bold leading-none',
        className
      )}
    >
      승
    </span>
  );
}
