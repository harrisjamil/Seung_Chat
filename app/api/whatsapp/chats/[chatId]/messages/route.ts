import { NextResponse } from 'next/server';
import {
  ensureWhatsAppInitialized,
  getWhatsAppMessages,
  getWhatsAppStatus,
  sendWhatsAppMessage,
} from '@/lib/whatsapp-bridge';

export const runtime = 'nodejs';

type Context = {
  params: Promise<{ chatId: string }>;
};

export async function GET(request: Request, context: Context) {
  await ensureWhatsAppInitialized();
  const status = getWhatsAppStatus();
  if (status.status !== 'ready') {
    return NextResponse.json({ status: status.status, messages: [] }, { status: 200 });
  }

  const { chatId: encodedChatId } = await context.params;
  const chatId = decodeURIComponent(encodedChatId);
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit') ?? '60');
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 60;
  const messages = await getWhatsAppMessages(chatId, limit);
  return NextResponse.json({ status: status.status, messages });
}

export async function POST(request: Request, context: Context) {
  await ensureWhatsAppInitialized();
  const status = getWhatsAppStatus();
  if (status.status !== 'ready') {
    return NextResponse.json({ error: 'WhatsApp is not connected.' }, { status: 409 });
  }

  const { chatId: encodedChatId } = await context.params;
  const chatId = decodeURIComponent(encodedChatId);
  let body = '';
  try {
    const data = (await request.json()) as { body?: string };
    body = typeof data?.body === 'string' ? data.body : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const sent = await sendWhatsAppMessage(chatId, body);
  if (!sent) {
    return NextResponse.json({ error: 'Could not send message.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
