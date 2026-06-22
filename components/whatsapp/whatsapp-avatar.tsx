'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { initialsFromName } from '@/lib/user-display';
import { Users } from 'lucide-react';

const sizeMap = {
  sm: 'size-8 text-[10px]',
  md: 'size-10 text-xs',
  lg: 'size-12 text-sm',
} as const;

type WhatsAppAvatarProps = {
  name: string;
  profilePicUrl?: string | null;
  size?: keyof typeof sizeMap;
  isGroup?: boolean;
  className?: string;
};

export function WhatsAppAvatar({
  name,
  profilePicUrl,
  size = 'md',
  isGroup = false,
  className,
}: WhatsAppAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(profilePicUrl) && !failed;

  if (showImage) {
    return (
      <img
        src={profilePicUrl!}
        alt=""
        onError={() => setFailed(true)}
        className={cn('shrink-0 rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }

  if (isGroup) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-chat-muted text-chat-subtle',
          sizeMap[size],
          className
        )}
      >
        <Users className={size === 'sm' ? 'size-3.5' : 'size-4'} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-avatar-bg font-semibold text-avatar-fg',
        sizeMap[size],
        className
      )}
    >
      {initialsFromName(name)}
    </div>
  );
}
