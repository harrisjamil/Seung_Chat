import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { createSession, deleteSessionById } from '@/lib/auth-session';

export const LOGIN_ALERT_EXPIRY_HOURS = 72;

type LoginAlertClientInfo = {
  ip: string;
  location: string;
  deviceName: string;
  hardwareDeviceName: string;
};

export async function createLoginAlert(
  userId: string,
  clientInfo: LoginAlertClientInfo,
  rememberMe = true
) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + LOGIN_ALERT_EXPIRY_HOURS * 60 * 60 * 1000);

  const alert = await db.loginAlert.create({
    data: {
      user: { connect: { id: userId } },
      token,
      expiresAt,
      rememberMe,
      ip: clientInfo.ip,
      location: clientInfo.location,
      deviceName: clientInfo.deviceName,
      hardwareDeviceName: clientInfo.hardwareDeviceName,
    },
  });

  return { token: alert.token, expiresAt: alert.expiresAt };
}

export type LoginAlertActionResult =
  | { ok: true; status: 'confirmed' | 'denied' | 'already_confirmed' | 'already_denied' }
  | { ok: false; error: 'invalid' | 'expired' };

export type LoginAlertStatusResult =
  | { status: 'pending' }
  | { status: 'confirmed'; sessionToken: string; expiresAt: Date }
  | { status: 'denied' }
  | { status: 'expired' }
  | { status: 'invalid' };

async function ensureLoginSession(alertId: string, userId: string, rememberMe: boolean) {
  const alert = await db.loginAlert.findUnique({
    where: { id: alertId },
    include: { session: true },
  });

  if (!alert) {
    throw new Error('Login alert not found');
  }

  if (alert.session) {
    return alert.session;
  }

  const { token, expiresAt, sessionId } = await createSession(userId, rememberMe);

  await db.loginAlert.update({
    where: { id: alertId },
    data: { session: { connect: { id: sessionId } } },
  });

  return { token, expiresAt, id: sessionId };
}

export async function respondToLoginAlert(
  token: string,
  action: 'confirm' | 'deny'
): Promise<LoginAlertActionResult> {
  const alert = await db.loginAlert.findUnique({
    where: { token },
    include: { session: true },
  });

  if (!alert) {
    return { ok: false, error: 'invalid' };
  }

  if (alert.expiresAt < new Date()) {
    return { ok: false, error: 'expired' };
  }

  if (alert.status === 'CONFIRMED') {
    return { ok: true, status: 'already_confirmed' };
  }

  if (alert.status === 'DENIED') {
    return { ok: true, status: 'already_denied' };
  }

  const now = new Date();

  if (action === 'confirm') {
    await db.loginAlert.update({
      where: { id: alert.id },
      data: { status: 'CONFIRMED', respondedAt: now },
    });
    await ensureLoginSession(alert.id, alert.userId, alert.rememberMe);
    return { ok: true, status: 'confirmed' };
  }

  await db.loginAlert.update({
    where: { id: alert.id },
    data: { status: 'DENIED', respondedAt: now },
  });

  if (alert.sessionId) {
    await deleteSessionById(alert.sessionId);
  }

  return { ok: true, status: 'denied' };
}

export async function getLoginAlertStatus(token: string): Promise<LoginAlertStatusResult> {
  const alert = await db.loginAlert.findUnique({
    where: { token },
    include: { session: true },
  });

  if (!alert) {
    return { status: 'invalid' };
  }

  if (alert.expiresAt < new Date()) {
    return { status: 'expired' };
  }

  if (alert.status === 'DENIED') {
    return { status: 'denied' };
  }

  if (alert.status === 'CONFIRMED') {
    const session =
      alert.session ?? (await ensureLoginSession(alert.id, alert.userId, alert.rememberMe));

    return {
      status: 'confirmed',
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    };
  }

  return { status: 'pending' };
}
