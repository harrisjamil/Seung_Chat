import { cn } from '@/lib/utils';

const sizeMap = {
  xs: 'size-7 text-[9px]',
  sm: 'size-8 text-[10px]',
  md: 'size-10 text-xs',
  lg: 'size-16 text-sm',
  xl: 'size-20 text-xl',
} as const;

type UserAvatarProps = {
  initials: string;
  size?: keyof typeof sizeMap;
  className?: string;
  showRing?: boolean;
};

export function UserAvatar({
  initials,
  size = 'md',
  className,
  showRing = false,
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-avatar-bg font-semibold text-avatar-fg',
        showRing && 'ring-2 ring-avatar-ring',
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

type GroupAvatarProps = {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const groupSizeMap = {
  sm: 'size-10 rounded-xl text-xs',
  md: 'size-16 rounded-2xl text-sm',
  lg: 'size-20 rounded-2xl text-xl',
} as const;

export function GroupAvatar({ initials, size = 'md', className }: GroupAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl bg-avatar-bg font-bold text-avatar-fg shadow-lg',
        groupSizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
