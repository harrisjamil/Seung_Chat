import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { EMAIL_REGEX, normalizeEmail } from '@/lib/auth-utils';
import { sendAccountCredentialsEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(String(email ?? ''));
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const verifiedOtp = await db.signupOtp.findFirst({
      where: { email: normalizedEmail, verified: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verifiedOtp) {
      return NextResponse.json(
        { error: 'Please verify your email with the OTP before creating an account.' },
        { status: 403 }
      );
    }

    const verificationAge = Date.now() - verifiedOtp.createdAt.getTime();
    if (verificationAge > 15 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Email verification expired. Please verify your email again.' },
        { status: 403 }
      );
    }

    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);

    const user = await db.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    await db.signupOtp.deleteMany({ where: { email: normalizedEmail } });

    try {
      await sendAccountCredentialsEmail(
        normalizedEmail,
        fullName.trim(),
        normalizedEmail,
        String(password)
      );
    } catch (emailError) {
      console.error('Failed to send account credentials email:', emailError);
    }

    return NextResponse.json({ message: 'Account created successfully.', user }, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      const target =
        'meta' in error &&
        error.meta &&
        typeof error.meta === 'object' &&
        'target' in error.meta
          ? (error.meta.target as string[])
          : [];

      if (target.includes('email')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
    }

    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
