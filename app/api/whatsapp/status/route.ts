import { NextResponse } from 'next/server';
import {
  ensureWhatsAppInitialized,
  getWhatsAppStatus,
} from '@/lib/whatsapp-bridge';

export const runtime = 'nodejs';

export async function GET() {
  await ensureWhatsAppInitialized();
  return NextResponse.json(getWhatsAppStatus());
}
