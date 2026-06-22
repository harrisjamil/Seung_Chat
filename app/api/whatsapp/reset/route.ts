import { NextResponse } from 'next/server';
import { resetWhatsAppSession } from '@/lib/whatsapp-bridge';

export const runtime = 'nodejs';

export async function POST() {
  await resetWhatsAppSession();
  return NextResponse.json({ ok: true });
}
