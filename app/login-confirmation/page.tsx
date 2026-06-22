import Link from 'next/link';
import { ShieldCheck, ShieldAlert, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SeungChatLogo } from '@/components/seung-chat-logo';

type PageProps = {
  searchParams: Promise<{ result?: string }>;
};

export default async function LoginConfirmationPage({ searchParams }: PageProps) {
  const { result } = await searchParams;

  if (result === 'approved') {
    return (
      <ResultLayout
        icon={<ShieldCheck className="size-10 text-emerald-600" />}
        title="Sign-in approved"
        description="Thanks for confirming. Return to the browser where you signed in — it will log you in automatically."
      />
    );
  }

  if (result === 'denied') {
    return (
      <ResultLayout
        icon={<ShieldAlert className="size-10 text-amber-600" />}
        title="Sign-in blocked"
        description="This sign-in attempt was denied and will not be allowed. If you did not try to sign in, change your password to protect your account."
        primaryHref="/signin"
        primaryLabel="Back to sign in"
        secondaryHref="/forgot-password"
        secondaryLabel="Change password"
      />
    );
  }

  if (result === 'expired') {
    return (
      <ResultLayout
        icon={<AlertCircle className="size-10 text-muted-foreground" />}
        title="Link expired"
        description="This sign-in confirmation link has expired. Please sign in again to receive a new email."
        primaryHref="/signin"
        primaryLabel="Sign in again"
      />
    );
  }

  if (result === 'invalid') {
    return (
      <ResultLayout
        icon={<AlertCircle className="size-10 text-destructive" />}
        title="Invalid link"
        description="This confirmation link is invalid or has already been used."
        primaryHref="/signin"
        primaryLabel="Back to sign in"
      />
    );
  }

  return (
    <ResultLayout
      icon={<Mail className="size-10 text-muted-foreground" />}
      title="Check your email"
      description="Open the sign-in confirmation email and choose whether this sign-in attempt was you."
      primaryHref="/signin"
      primaryLabel="Back to sign in"
    />
  );
}

function ResultLayout({
  icon,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <SeungChatLogo className="h-8" variant="light" />
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-muted/60">
              {icon}
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm leading-relaxed text-muted-foreground">{description}</p>
          </CardContent>
          {(primaryHref || secondaryHref) && (
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {primaryHref && primaryLabel ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
              ) : null}
              {secondaryHref && secondaryLabel ? (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
