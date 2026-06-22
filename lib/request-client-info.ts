export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'Unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'Unknown';
}

export function parseDeviceName(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) {
    return 'Unknown device';
  }

  let browser = 'Unknown browser';
  if (ua.includes('Edg/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    browser = 'Opera';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari/')) {
    browser = 'Safari';
  }

  let os = 'Unknown OS';
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
    os = 'macOS';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iPhone')) {
    os = 'iPhone';
  } else if (ua.includes('iPad')) {
    os = 'iPad';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}

export function parseHardwareDeviceNameFromUserAgent(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) {
    return 'Unknown device';
  }

  const androidMatch = ua.match(/Android [^;]+;\s*([^;)]+)\)/i);
  if (androidMatch?.[1] && !/^(linux|android)$/i.test(androidMatch[1].trim())) {
    return androidMatch[1].trim();
  }

  if (/iPhone/i.test(ua)) {
    const iosMatch = ua.match(/OS (\d+[_\d]*)/i);
    return iosMatch
      ? `iPhone (iOS ${iosMatch[1].replace(/_/g, '.')})`
      : 'iPhone';
  }

  if (/iPad/i.test(ua)) {
    const iosMatch = ua.match(/OS (\d+[_\d]*)/i);
    return iosMatch ? `iPad (iOS ${iosMatch[1].replace(/_/g, '.')})` : 'iPad';
  }

  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux PC';

  return 'Unknown device';
}

function isPrivateIp(ip: string): boolean {
  if (
    ip === 'Unknown' ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('::ffff:127.')
  ) {
    return true;
  }

  const ipv4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = ipv4.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export async function lookupLocationFromIp(ip: string): Promise<string> {
  if (isPrivateIp(ip)) {
    return 'Local network';
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      return 'Unknown location';
    }

    const data = (await response.json()) as {
      status?: string;
      city?: string;
      regionName?: string;
      country?: string;
    };

    if (data.status !== 'success') {
      return 'Unknown location';
    }

    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}

export async function getLoginClientInfo(
  request: Request,
  hardwareDeviceName?: string
) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') ?? '';
  const deviceName = parseDeviceName(userAgent);
  const location = await lookupLocationFromIp(ip);
  const resolvedHardwareDeviceName =
    hardwareDeviceName?.trim() ||
    parseHardwareDeviceNameFromUserAgent(userAgent);

  return {
    ip,
    deviceName,
    hardwareDeviceName: resolvedHardwareDeviceName,
    location,
  };
}
