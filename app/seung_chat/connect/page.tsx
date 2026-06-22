'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/chat/user-avatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Loader2, Search, UserPlus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type SearchUser = {
  id: string;
  fullName: string;
  email: string;
  initials: string;
  avatarColor: string;
  connection: {
    id: string;
    status: string;
    direction: 'incoming' | 'outgoing';
  } | null;
};

export default function ConnectPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setUsers([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Search failed.');
        setUsers([]);
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError('Search failed. Please try again.');
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  async function sendRequest(user: SearchUser) {
    setSendingId(user.id);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Could not send request.');
        return;
      }

      setMessage(`Request sent to ${user.fullName}. They will be notified to accept or decline.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                connection: {
                  id: data.connection.id,
                  status: 'PENDING',
                  direction: 'outgoing',
                },
              }
            : u
        )
      );
    } catch {
      setError('Could not send request.');
    } finally {
      setSendingId(null);
    }
  }

  function connectionLabel(user: SearchUser) {
    if (!user.connection) return null;
    if (user.connection.status === 'PENDING') {
      return user.connection.direction === 'outgoing' ? 'Request sent' : 'Wants to connect';
    }
    if (user.connection.status === 'ACCEPTED') return 'Connected';
    if (user.connection.status === 'REJECTED') return 'Declined';
    return null;
  }

  return (
    <div className="flex h-dvh flex-col bg-chat-main text-chat-foreground">
      <header className="flex items-center gap-3 border-b border-chat-border bg-chat-inbox px-4 py-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/seung_chat" aria-label="Back to chat">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold">Create connection</h1>
          <p className="text-[11px] text-chat-subtle">
            Search by full name and send a connection request
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <Label htmlFor="name-search" className="text-xs text-chat-subtle">
            Full name
          </Label>
          <div className="relative">
            <Search className="pointer-events-noimage.pngne absolute top-1/2 left-3 size-4 -translate-y-1/2 text-chat-subtle" />
            <Input
              id="name-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter connection user"
              autoFocus
              className="h-11 rounded-xl border-chat-border bg-chat-muted pl-10"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl bg-chat-brand-soft px-3 py-2 text-xs text-chat-brand"
          >
            {message}
          </motion.p>
        ) : null}

        <div className="mt-6 space-y-2">
          {searching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-chat-subtle" />
            </div>
          ) : query.trim().length < 2 ? (
            <p className="py-8 text-center text-sm text-chat-subtle">
              Type at least 2 characters to find people on Seung.
            </p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-chat-subtle">No users found.</p>
          ) : (
            users.map((user, index) => {
              const status = connectionLabel(user);
              const canSend = !user.connection || user.connection.status === 'REJECTED';
              const sendLabel =
                user.connection?.status === 'REJECTED' ? 'Send again' : 'Connect';

              return (
                <motion.div
                  key={user.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl border border-chat-border bg-chat-inbox p-3"
                >
                  <UserAvatar initials={user.initials} size="lg" className="bg-[var(--avatar-bg)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.fullName}</p>
                    <p className="truncate text-[11px] text-chat-subtle">{user.email}</p>
                    {status ? (
                      <p className="mt-1 text-[10px] font-medium text-chat-brand">{status}</p>
                    ) : null}
                  </div>
                  {canSend ? (
                    <Button
                      size="sm"
                      className="shrink-0 gap-1"
                      disabled={sendingId === user.id}
                      onClick={() => sendRequest(user)}
                    >
                      {sendingId === user.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="size-3.5" />
                      )}
                      {sendLabel}
                    </Button>
                  ) : user.connection?.status === 'PENDING' &&
                    user.connection.direction === 'incoming' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => router.push('/seung_chat')}
                    >
                      Respond
                    </Button>
                  ) : user.connection?.status === 'ACCEPTED' ? (
                    <span className="flex size-9 items-center justify-center text-chat-brand">
                      <Check className="size-4" />
                    </span>
                  ) : null}
                </motion.div>
              );
            })
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={() => router.push('/seung_chat')}>
            Back to messages
          </Button>
        </div>
      </div>
    </div>
  );
}
