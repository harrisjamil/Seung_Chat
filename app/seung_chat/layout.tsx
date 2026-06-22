import type { Metadata } from 'next';
import { SeungChatAuthGuard } from '@/components/chat/seung-chat-auth-guard';

export const metadata: Metadata = {
  title: 'Seung Chat',
  description: 'Your Seung messaging workspace',
};

export default function SeungChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-hidden bg-chat-main">
      <SeungChatAuthGuard>{children}</SeungChatAuthGuard>
    </div>
  );
}
