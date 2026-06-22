import nodemailer from 'nodemailer';
import { OTP_EXPIRY_SECONDS } from '@/lib/auth-utils';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('Gmail credentials are not configured in .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function formatExpiry(seconds: number) {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${seconds} seconds`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSignupOtpHtml(code: string, expiryLabel: string) {
  const digits = code.split('');

  const digitCells = digits
    .map(
      (digit) => `
        <td align="center" style="padding:0 4px;">
          <div style="width:44px;height:52px;line-height:52px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;font-size:24px;font-weight:700;color:#09090b;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">
            ${digit}
          </div>
        </td>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify your Seung account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Your Seung verification code is ${code}. It expires in ${expiryLabel}.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#09090b;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <div style="width:40px;height:40px;background-color:#ffffff;border-radius:8px;text-align:center;line-height:40px;font-size:19px;font-weight:700;color:#09090b;">
                      승
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Seung
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.65);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Secure messaging
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Email verification
              </p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;line-height:1.3;color:#09090b;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Verify your email address
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#52525b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Enter the verification code below to complete your Seung registration. For your security, this code is single-use and time-limited.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>${digitCells}</tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:360px;">
                <tr>
                  <td align="center" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#52525b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Expires in <strong style="color:#09090b;">${expiryLabel}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e4e4e7;">
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      If you did not request this code, you can safely ignore this email. No account will be created without verification.
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Never share this code with anyone. Seung will never ask for your verification code by phone or message.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:20px 32px;">
              <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                © ${new Date().getFullYear()} Seung. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSignupOtpText(code: string, expiryLabel: string) {
  return [
    'Seung — Email verification',
    '',
    'Verify your email address',
    '',
    `Your verification code: ${code}`,
    '',
    `This code expires in ${expiryLabel}.`,
    '',
    'If you did not request this code, you can safely ignore this email.',
    'Never share this code with anyone.',
    '',
    `© ${new Date().getFullYear()} Seung. All rights reserved.`,
  ].join('\n');
}

export async function sendSignupOtpEmail(to: string, code: string) {
  const from = process.env.GMAIL_USER;

  if (!from) {
    throw new Error('GMAIL_USER is not configured');
  }

  const expiryLabel = formatExpiry(OTP_EXPIRY_SECONDS);
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `Seung <${from}>`,
    to,
    subject: `${code} is your Seung verification code`,
    text: buildSignupOtpText(code, expiryLabel),
    html: buildSignupOtpHtml(code, expiryLabel),
  });
}

function buildAccountCredentialsHtml(fullName: string, email: string, password: string) {
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Seung account is ready</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Your Seung account has been created. Sign in with the credentials in this email.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#09090b;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <div style="width:40px;height:40px;background-color:#ffffff;border-radius:8px;text-align:center;line-height:40px;font-size:19px;font-weight:700;color:#09090b;">
                      승
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Seung
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.65);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Secure messaging
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Account created
              </p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;line-height:1.3;color:#09090b;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Welcome, ${safeName}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#52525b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Your Seung account is ready. Use the credentials below to sign in.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Your login details
                    </p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Email</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeEmail}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Password</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#09090b;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;letter-spacing:0.02em;">${safePassword}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e4e4e7;">
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Keep this email private. Delete it after saving your credentials in a secure password manager.
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      If you did not create this account, please contact support immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:20px 32px;">
              <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                © ${new Date().getFullYear()} Seung. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAccountCredentialsText(fullName: string, email: string, password: string) {
  return [
    'Seung — Account created',
    '',
    `Welcome, ${fullName}!`,
    '',
    'Your Seung account is ready. Use the credentials below to sign in:',
    '',
    `Email: ${email}`,
    `Password: ${password}`,
    '',
    'Keep this email private. Delete it after saving your credentials in a secure password manager.',
    'If you did not create this account, please contact support immediately.',
    '',
    `© ${new Date().getFullYear()} Seung. All rights reserved.`,
  ].join('\n');
}

export async function sendAccountCredentialsEmail(
  to: string,
  fullName: string,
  email: string,
  password: string
) {
  const from = process.env.GMAIL_USER;

  if (!from) {
    throw new Error('GMAIL_USER is not configured');
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `Seung <${from}>`,
    to,
    subject: 'Your Seung account credentials',
    text: buildAccountCredentialsText(fullName, email, password),
    html: buildAccountCredentialsHtml(fullName, email, password),
  });
}

type LoginAlertDetails = {
  fullName: string;
  email: string;
  ip: string;
  location: string;
  deviceName: string;
  hardwareDeviceName: string;
  signedInAt: Date;
  confirmUrl: string;
  denyUrl: string;
};

function formatLoginTimestamp(date: Date) {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function buildLoginAlertHtml(details: LoginAlertDetails) {
  const safeName = escapeHtml(details.fullName);
  const safeEmail = escapeHtml(details.email);
  const safeIp = escapeHtml(details.ip);
  const safeLocation = escapeHtml(details.location);
  const safeDevice = escapeHtml(details.deviceName);
  const safeHardwareDevice = escapeHtml(details.hardwareDeviceName);
  const safeTime = escapeHtml(formatLoginTimestamp(details.signedInAt));
  const safeConfirmUrl = escapeHtml(details.confirmUrl);
  const safeDenyUrl = escapeHtml(details.denyUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Was this you? New sign-in to your Seung account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Was this you? A new sign-in to your Seung account was detected.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#09090b;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <div style="width:40px;height:40px;background-color:#ffffff;border-radius:8px;text-align:center;line-height:40px;font-size:19px;font-weight:700;color:#09090b;">
                      승
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Seung
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.65);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Secure messaging
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Security alert
              </p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;line-height:1.3;color:#09090b;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Was this you?
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#52525b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Hi ${safeName}, someone is trying to sign in to your Seung account. Confirm below to allow access, or deny to block this sign-in.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Sign-in details
                    </p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Account</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeEmail}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Time</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeTime}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">IP address</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#09090b;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">${safeIp}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Location</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeLocation}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Device</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeDevice}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Hardware</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${safeHardwareDevice}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-right:8px;">
                    <a href="${safeConfirmUrl}" style="display:inline-block;background-color:#09090b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Yes, it was me
                    </a>
                  </td>
                  <td align="center" style="padding-left:8px;">
                    <a href="${safeDenyUrl}" style="display:inline-block;background-color:#ffffff;color:#09090b;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;border:1px solid #e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      No, secure my account
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e4e4e7;">
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      If you did not sign in, click &quot;No, secure my account&quot; to end that session. We also recommend changing your password.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:20px 32px;">
              <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                © ${new Date().getFullYear()} Seung. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildLoginAlertText(details: LoginAlertDetails) {
  const signedInAt = formatLoginTimestamp(details.signedInAt);

  return [
    'Seung — Was this you?',
    '',
    `Hi ${details.fullName},`,
    '',
    'We noticed a sign-in attempt on your Seung account.',
    'Your account will not be accessible until you confirm below.',
    '',
    'Sign-in details:',
    `Account: ${details.email}`,
    `Time: ${signedInAt}`,
    `IP address: ${details.ip}`,
    `Location: ${details.location}`,
    `Device: ${details.deviceName}`,
    `Hardware: ${details.hardwareDeviceName}`,
    '',
    'Was this you?',
    `Yes, it was me: ${details.confirmUrl}`,
    `No, secure my account: ${details.denyUrl}`,
    '',
    'If you did not sign in, use the secure link above and change your password.',
    '',
    `© ${new Date().getFullYear()} Seung. All rights reserved.`,
  ].join('\n');
}

export async function sendLoginAlertEmail(to: string, details: LoginAlertDetails) {
  const from = process.env.GMAIL_USER;

  if (!from) {
    throw new Error('GMAIL_USER is not configured');
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `Seung <${from}>`,
    to,
    subject: 'Was this you? New sign-in to your Seung account',
    text: buildLoginAlertText(details),
    html: buildLoginAlertHtml(details),
  });
}
