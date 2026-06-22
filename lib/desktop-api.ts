export type SeungDesktopApi = {
  isDesktop: boolean;
  platform: string;
  getServerUrl: () => Promise<string>;
  retryConnection: () => Promise<void>;
  showNotification: (
    title: string,
    body: string,
    options?: { silent?: boolean }
  ) => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  focusWindow: () => Promise<void>;
  getVersion: () => Promise<string>;
};

declare global {
  interface Window {
    seungDesktop?: SeungDesktopApi;
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && window.seungDesktop?.isDesktop === true;
}

export function getDesktopApi(): SeungDesktopApi | null {
  if (!isDesktopApp()) return null;
  return window.seungDesktop ?? null;
}

export async function showDesktopNotification(
  title: string,
  body: string,
  options?: { silent?: boolean }
): Promise<void> {
  const api = getDesktopApi();
  if (!api) return;
  await api.showNotification(title, body, options);
}

export async function setDesktopBadgeCount(count: number): Promise<void> {
  const api = getDesktopApi();
  if (!api) return;
  await api.setBadgeCount(count);
}
