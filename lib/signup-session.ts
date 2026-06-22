const SIGNUP_SESSION_KEY = 'seung-signup-session';

export type SignupSession = {
  email: string;
  fullName: string;
  otpSent: boolean;
  emailVerified: boolean;
  otpExpiresAt: number | null;
};

export function loadSignupSession(): SignupSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(SIGNUP_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SignupSession>;
    if (typeof parsed.email !== 'string') return null;

    return {
      email: parsed.email,
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      otpSent: Boolean(parsed.otpSent),
      emailVerified: Boolean(parsed.emailVerified),
      otpExpiresAt:
        typeof parsed.otpExpiresAt === 'number' ? parsed.otpExpiresAt : null,
    };
  } catch {
    return null;
  }
}

export function saveSignupSession(session: SignupSession) {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SIGNUP_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearSignupSession() {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(SIGNUP_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function getOtpSecondsLeft(expiresAt: number | null) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}
