import { NextResponse } from 'next/server';
import {
  ensureWhatsAppInitialized,
  getWhatsAppChats,
  getWhatsAppStatus,
} from '@/lib/whatsapp-bridge';

export const runtime = 'nodejs';

export async function GET() {
  await ensureWhatsAppInitialized();
  const status = getWhatsAppStatus();
  const chats = status.status === 'ready' ? await getWhatsAppChats(120) : [];
  return NextResponse.json({ status: status.status, chats });
}
