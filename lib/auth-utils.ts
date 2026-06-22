export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const OTP_REGEX = /^\d{6}$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const OTP_EXPIRY_SECONDS = 60;
