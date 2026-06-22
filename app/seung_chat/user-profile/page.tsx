'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatWorkspaceShell } from '@/components/chat/chat-workspace-shell';
import { UserProfile, type UserProfileData } from '@/components/chat/user-profile';
import { initialsFromName } from '@/lib/user-display';

export default function SeungChatUserProfilePage() {
  const [userInitials, setUserInitials] = useState('YU');
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const nextUser = data?.user as UserProfileData | undefined;
        if (nextUser) {
          setUser(nextUser);
          if (nextUser.fullName) {
            setUserInitials(initialsFromName(nextUser.fullName));
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ChatWorkspaceShell active="settings" userInitials={userInitials}>
      <div className="h-full min-w-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-[#f6f7f9]">
            <Loader2 className="size-6 animate-spin text-slate-500" />
          </div>
        ) : user ? (
          <UserProfile user={user} initials={userInitials} />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f6f7f9] px-6 text-sm text-slate-600">
            Unable to load profile details.
          </div>
        )}
      </div>
    </ChatWorkspaceShell>
  );
}
