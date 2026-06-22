import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  EMAIL_REGEX,
  normalizeEmail,
  OTP_REGEX,
} from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ''));
    const code = String(body.code ?? '').trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!OTP_REGEX.test(code)) {
      return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 });
    }

    const otpRecord = await db.signupOtp.findFirst({
      where: { email, code, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification code expired. Please resend a new code.' },
        { status: 410 }
      );
    }

    await db.signupOtp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return NextResponse.json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
