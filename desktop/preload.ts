import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('seungDesktop', {
  isDesktop: true,
  platform: process.platform,
  getServerUrl: () => ipcRenderer.invoke('get-server-url') as Promise<string>,
  retryConnection: () => ipcRenderer.invoke('retry-connection'),
  showNotification: (title: string, body: string, options?: { silent?: boolean }) =>
    ipcRenderer.invoke('show-notification', { title, body, ...options }),
  setBadgeCount: (count: number) => ipcRenderer.invoke('set-badge-count', count),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  getVersion: () => ipcRenderer.invoke('get-version') as Promise<string>,
});
