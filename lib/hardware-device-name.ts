type NavigatorUAData = {
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, string>>;
};

function parseHardwareFromUserAgent(userAgent: string): string | null {
  const androidMatch = userAgent.match(/Android [^;]+;\s*([^;)]+)\)/i);
  if (androidMatch?.[1] && !/^(linux|android)$/i.test(androidMatch[1].trim())) {
    return androidMatch[1].trim();
  }

  if (/iPhone/i.test(userAgent)) {
    const iosMatch = userAgent.match(/OS (\d+[_\d]*)/i);
    return iosMatch
      ? `iPhone (iOS ${iosMatch[1].replace(/_/g, '.')})`
      : 'iPhone';
  }

  if (/iPad/i.test(userAgent)) {
    const iosMatch = userAgent.match(/OS (\d+[_\d]*)/i);
    return iosMatch ? `iPad (iOS ${iosMatch[1].replace(/_/g, '.')})` : 'iPad';
  }

  return null;
}

function buildDesktopHardwareName(
  platform: string,
  hints?: Record<string, string>
): string {
  if (hints?.model?.trim()) {
    return hints.model.trim();
  }

  const version = hints?.platformVersion?.split('.')[0];
  let name = 'Desktop computer';

  if (platform === 'Windows') {
    if (version === '15' || version === '11') name = 'Windows 11 PC';
    else if (version === '10') name = 'Windows 10 PC';
    else name = 'Windows PC';
  } else if (platform === 'macOS') {
    name = 'Mac';
  } else if (platform === 'Linux') {
    name = 'Linux PC';
  } else if (platform === 'Chrome OS') {
    name = 'Chromebook';
  }

  if (hints?.architecture) {
    return `${name} (${hints.architecture})`;
  }

  return name;
}

function getDesktopPlatformLabel(platform: string): string {
  if (platform === 'win32') return 'Windows';
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  return 'Desktop';
}

export async function getHardwareDeviceName(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'Unknown device';
  }

  const desktopApi = (
    window as Window & {
      seungDesktop?: { isDesktop?: boolean; platform?: string };
    }
  ).seungDesktop;

  if (desktopApi?.isDesktop) {
    const platformLabel = getDesktopPlatformLabel(desktopApi.platform ?? '');
    return `Seung Desktop (${platformLabel})`;
  }

  const fromUserAgent = parseHardwareFromUserAgent(navigator.userAgent);
  if (fromUserAgent) {
    return fromUserAgent;
  }

  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData })
    .userAgentData;

  if (uaData?.getHighEntropyValues) {
    try {
      const hints = await uaData.getHighEntropyValues([
        'model',
        'platform',
        'platformVersion',
        'architecture',
      ]);

      if (hints.model?.trim()) {
        return hints.model.trim();
      }

      const platform = hints.platform || uaData.platform || '';
      if (platform) {
        return buildDesktopHardwareName(platform, hints);
      }
    } catch {
      // Fall through to basic detection.
    }
  }

  if (/Windows/i.test(navigator.userAgent)) return 'Windows PC';
  if (/Macintosh/i.test(navigator.userAgent)) return 'Mac';
  if (/Linux/i.test(navigator.userAgent)) return 'Linux PC';

  return navigator.platform?.trim() || 'Unknown device';
}
