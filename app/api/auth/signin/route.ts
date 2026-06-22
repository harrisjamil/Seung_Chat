import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { normalizeEmail, EMAIL_REGEX } from '@/lib/auth-utils';
import { sendLoginAlertEmail } from '@/lib/email';
import { getLoginClientInfo } from '@/lib/request-client-info';
import { createLoginAlert } from '@/lib/login-alert';
import { getAppBaseUrl } from '@/lib/app-url';

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local[0] ?? '*' : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedEmail = normalizeEmail(String(body.email ?? ''));
    const password = String(body.password ?? '');
    const rememberMe = body.rememberMe !== false;

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const hardwareDeviceName = String(body.hardwareDeviceName ?? '');
    const clientInfo = await getLoginClientInfo(request, hardwareDeviceName);
    const { token: confirmationToken } = await createLoginAlert(
      user.id,
      clientInfo,
      rememberMe
    );

    const baseUrl = getAppBaseUrl(request);
    const confirmUrl = `${baseUrl}/api/auth/login-confirmation?token=${encodeURIComponent(confirmationToken)}&action=confirm`;
    const denyUrl = `${baseUrl}/api/auth/login-confirmation?token=${encodeURIComponent(confirmationToken)}&action=deny`;

    try {
      await sendLoginAlertEmail(user.email, {
        fullName: user.fullName,
        email: user.email,
        ip: clientInfo.ip,
        location: clientInfo.location,
        deviceName: clientInfo.deviceName,
        hardwareDeviceName: clientInfo.hardwareDeviceName,
        signedInAt: new Date(),
        confirmUrl,
        denyUrl,
      });
    } catch (emailError) {
      console.error('Failed to send login alert email:', emailError);
      return NextResponse.json(
        { error: 'Could not send confirmation email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pendingConfirmation: true,
      confirmationToken,
      email: maskEmail(user.email),
    });
  } catch {
    return NextResponse.json({ error: 'Sign in failed. Please try again.' }, { status: 500 });
  }
}
