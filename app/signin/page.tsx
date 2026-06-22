'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessagesSquare,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SeungChatLogo } from '@/components/seung-chat-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { getHardwareDeviceName } from '@/lib/hardware-device-name';

const features = [
  {
    icon: Zap,
    title: 'Instant messaging',
    description: 'Send and receive messages in real time, without delay.',
  },
  {
    icon: Users,
    title: 'Group conversations',
    description: 'Create rooms and chat with friends or your whole team.',
  },
  {
    icon: Shield,
    title: 'Private & secure',
    description: 'Your conversations stay protected and under your control.',
  },
];

const chatPreview = [
  { from: 'them' as const, text: 'Hey, are we still on for tonight?' },
  { from: 'me' as const, text: 'Yes! I will be there at 7.' },
  { from: 'them' as const, text: 'Perfect. See you soon.' },
];

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-background/15 px-3.5 py-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-background/50"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function AnimatedChatPreview({ contentDelay = 0.9 }: { contentDelay?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(chatPreview.length);
      return;
    }

    let active = true;

    (async () => {
      while (active) {
        setVisibleCount(0);
        setShowTyping(false);
        await delay(500);

        for (let i = 0; i < chatPreview.length; i++) {
          if (!active) return;

          setShowTyping(true);
          await delay(1100);
          if (!active) return;

          setShowTyping(false);
          setVisibleCount(i + 1);
          await delay(350);
        }

        await delay(2800);
      }
    })();

    return () => {
      active = false;
    };
  }, [prefersReducedMotion]);

  const visibleMessages = chatPreview.slice(0, visibleCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: contentDelay }}
      className="space-y-3 rounded-xl border border-background/15 bg-background/5 p-4"
    >
      <div className="flex items-center gap-2 border-b border-background/10 pb-3">
        <div className="relative flex size-8 items-center justify-center rounded-full bg-background/15">
          <MessagesSquare className="size-3.5" strokeWidth={1.75} />
          <motion.span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-foreground bg-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Team Chat</p>
          <p className="text-xs text-background/50">3 members online</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((message, index) => (
            <motion.div
              key={`${message.text}-${index}`}
              layout
              initial={{ opacity: 0, x: message.from === 'me' ? 24 : -24, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn(
                'flex',
                message.from === 'me' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  message.from === 'me'
                    ? 'rounded-br-md bg-background text-foreground'
                    : 'rounded-bl-md bg-background/15 text-background'
                )}
              >
                {message.text}
              </div>
            </motion.div>
          ))}
          {showTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!active) return null;
        if (res.ok) {
          router.replace('/seung_chat');
          return null;
        }
        return null;
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!pendingConfirmation || !confirmationToken) return;

    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/auth/login-confirmation/status?token=${encodeURIComponent(confirmationToken)}`
        );
        const data = await res.json();
        if (!active) return;

        if (data.status === 'confirmed') {
          router.push('/seung_chat');
          return;
        }

        if (data.status === 'denied') {
          setPendingConfirmation(false);
          setConfirmationToken(null);
          setError('Sign-in was denied from your email. If this was not you, change your password.');
          return;
        }

        if (data.status === 'expired' || data.status === 'invalid') {
          setPendingConfirmation(false);
          setConfirmationToken(null);
          setError('Confirmation expired. Please sign in again.');
        }
      } catch {
        // Ignore transient polling errors.
      }
    };

    const interval = setInterval(poll, 3000);
    void poll();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pendingConfirmation, confirmationToken, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const hardwareDeviceName = await getHardwareDeviceName();
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe, hardwareDeviceName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Sign in failed.');
        return;
      }

      if (data.pendingConfirmation) {
        setPendingConfirmation(true);
        setConfirmationToken(data.confirmationToken);
        setMaskedEmail(data.email ?? email);
        return;
      }

      router.push('/seung_chat');
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const panelSpring = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 65, damping: 18 };

  const contentReveal = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, delay: 0.75 },
      };

  if (checkingSession) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative grid h-dvh overflow-hidden overscroll-none bg-background lg:grid-cols-2">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="text-muted-foreground hover:bg-muted hover:text-foreground" />
      </div>
      {/* Merge seam */}
      {!prefersReducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-px -translate-x-1/2 bg-border lg:block"
          initial={{ scaleY: 0, opacity: 1 }}
          animate={{ scaleY: 1, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
        />
      )}

      {/* Brand panel — slides in from left */}
      <motion.div
        className="relative hidden h-full min-h-0 flex-col justify-between overflow-hidden bg-foreground px-10 py-8 text-background lg:flex"
        initial={prefersReducedMotion ? false : { x: '-100%' }}
        animate={{ x: 0 }}
        transition={panelSpring}
      >
        <SeungChatLogo variant="dark" typewriterDelay={650} markSize={40} />

        <div className="max-w-md space-y-6">
          <motion.div className="space-y-3" {...contentReveal}>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              Connect instantly. Message effortlessly.
            </h1>
            <p className="text-sm leading-relaxed text-background/70">
              Seung brings your conversations together — direct messages,
              group chats, and everything in between.
            </p>
          </motion.div>

          <AnimatedChatPreview contentDelay={0.95} />

          <ul className="space-y-3">
            {features.map((feature, index) => (
              <motion.li
                key={feature.title}
                className="flex gap-4"
                initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.85 + index * 0.1 }}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-background/15 bg-background/5">
                  <feature.icon className="size-4" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-sm leading-relaxed text-background/60">
                    {feature.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.p
          className="text-xs text-background/50"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          © {new Date().getFullYear()} Seung. All rights reserved.
        </motion.p>
      </motion.div>

      {/* Sign-in form — slides in from right */}
      <motion.div
        className="relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden px-6 py-6 lg:px-12"
        initial={prefersReducedMotion ? false : { x: '100%' }}
        animate={{ x: 0 }}
        transition={panelSpring}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.03),transparent_50%)]" />

        <motion.div
          className="relative w-full max-w-[420px] space-y-8"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <div className="space-y-6">
            <div className="lg:hidden">
              <SeungChatLogo variant="light" typewriterDelay={750} markSize={44} />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in to continue to your account and pick up where you left off.
              </p>
            </div>
          </div>

          <Card className="gap-0 overflow-hidden border-border/50 py-0 shadow-none ring-1 ring-foreground/8">
            <CardContent className="p-0">
              {pendingConfirmation ? (
                <div className="space-y-5 p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
                      <Mail className="size-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight">Check your email</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        We sent a confirmation to <span className="font-medium text-foreground">{maskedEmail}</span>.
                        Open the email and choose <span className="font-medium text-foreground">Yes, it was me</span> to finish signing in.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Waiting for your confirmation...
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => {
                      setPendingConfirmation(false);
                      setConfirmationToken(null);
                      setError(null);
                    }}
                  >
                    Back to sign in
                  </Button>
                </div>
              ) : (
              <form onSubmit={onSubmit} className="divide-y divide-border/60">
                <div className="space-y-5 p-6">
                  <motion.div
                    className="space-y-2"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.85 }}
                  >
                    <Label htmlFor="email" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-border/70 bg-muted/30 pl-10 transition-colors focus-visible:bg-background"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.95 }}
                  >
                    <Label htmlFor="password" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-border/70 bg-muted/30 pr-10 pl-10 transition-colors focus-visible:bg-background"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between gap-4"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1.05 }}
                  >
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading}
                        className="size-4 rounded border-border accent-foreground"
                      />
                      Remember me
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Forgot password?
                    </Link>
                  </motion.div>
                </div>

                <div className="bg-muted/20 p-6">
                  {error ? (
                    <p className="mb-3 text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.15 }}
                  >
                    <Button
                      type="submit"
                      className="h-11 w-full text-sm font-medium"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Continue to Seung
                          <ArrowRight />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
              )}
            </CardContent>

            <CardFooter className="justify-center border-t border-border/60 bg-muted/10 py-5">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>

          <motion.p
            className="text-center text-xs leading-relaxed text-muted-foreground"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 1.25 }}
          >
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-4 transition-colors hover:text-foreground">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-4 transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
