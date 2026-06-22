import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendSignupOtpEmail } from '@/lib/email';
import {
  EMAIL_REGEX,
  generateOtpCode,
  normalizeEmail,
  OTP_EXPIRY_SECONDS,
} from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ''));

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    await db.signupOtp.create({
      data: { email, code, expiresAt },
    });

    await sendSignupOtpEmail(email, code);

    return NextResponse.json({
      message: 'Verification code sent.',
      expiresIn: OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    const message =
      error instanceof Error && error.message.includes('Gmail')
        ? 'Email service is not configured. Please contact support.'
        : 'Failed to send verification code. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
