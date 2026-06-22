import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth-session';

export async function SeungChatAuthGuard({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/signin');
  }
  return children;
}
