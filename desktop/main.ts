import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  Notification,
  ipcMain,
  shell,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const isDev = process.env.SEUNG_DESKTOP_DEV === '1' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let serverUrl = resolveServerUrl();
let isShowingOffline = false;

function readEnvFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^SEUNG_SERVER_URL=(.+)$/m);
  if (!match?.[1]) return null;
  return match[1].trim().replace(/^["']|["']$/g, '');
}

function resolveServerUrl(): string {
  const envCandidates = [
    path.join(path.dirname(process.execPath), 'seung.env'),
    path.join(app.getPath('userData'), 'seung.env'),
    path.join(__dirname, '..', 'assets', 'seung.env'),
  ];

  for (const envPath of envCandidates) {
    const fromFile = readEnvFile(envPath);
    if (fromFile) return fromFile;
  }

  return process.env.SEUNG_SERVER_URL?.trim() || 'http://localhost:3000';
}

function getAssetPath(...segments: string[]) {
  return path.join(__dirname, '..', 'assets', ...segments);
}

function loadWindowIcon() {
  const pngPath = getAssetPath('icon.png');
  const icoPath = getAssetPath('icon.ico');
  if (fs.existsSync(pngPath)) {
    return nativeImage.createFromPath(pngPath);
  }
  if (fs.existsSync(icoPath)) {
    return nativeImage.createFromPath(icoPath);
  }
  return nativeImage.createEmpty();
}

function showOfflinePage() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isShowingOffline = true;
  void mainWindow.loadFile(getAssetPath('offline.html'));
}

async function loadServer() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  serverUrl = resolveServerUrl();
  isShowingOffline = false;

  try {
    await mainWindow.loadURL(serverUrl);
  } catch {
    showOfflinePage();
  }
}

function createMainWindow() {
  const icon = loadWindowIcon();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Seung',
    icon: icon.isEmpty() ? undefined : icon,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      if (isShowingOffline) return;
      if (validatedURL.startsWith('file://')) return;
      showOfflinePage();
    }
  );

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isShowingOffline) return;
    const target = new URL(url);
    const server = new URL(serverUrl);
    if (target.origin !== server.origin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  void loadServer();
}

function createTray() {
  const icon = loadWindowIcon();
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Seung');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Seung',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function registerIpcHandlers() {
  ipcMain.handle('get-server-url', () => serverUrl);

  ipcMain.handle('retry-connection', () => {
    void loadServer();
  });

  ipcMain.handle(
    'show-notification',
    (_event, payload: { title: string; body: string; silent?: boolean }) => {
      if (!Notification.isSupported()) return;

      const notification = new Notification({
        title: payload.title,
        body: payload.body,
        silent: payload.silent ?? false,
        icon: getAssetPath('icon.png'),
      });

      notification.on('click', () => {
        mainWindow?.show();
        mainWindow?.focus();
      });

      notification.show();
    }
  );

  ipcMain.handle('set-badge-count', (_event, count: number) => {
    const safeCount = Math.max(0, Math.floor(count));
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setBadge(safeCount > 0 ? String(safeCount) : '');
    } else if (mainWindow) {
      mainWindow.setOverlayIcon(
        safeCount > 0 ? createBadgeOverlay(safeCount) : null,
        safeCount > 0 ? `${safeCount} unread` : ''
      );
    }
  });

  ipcMain.handle('focus-window', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  ipcMain.handle('get-version', () => app.getVersion());
}

function createBadgeOverlay(count: number) {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    canvas[offset] = 220;
    canvas[offset + 1] = 38;
    canvas[offset + 2] = 38;
    canvas[offset + 3] = 255;
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createMainWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        mainWindow?.show();
        mainWindow?.focus();
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      // Keep running in tray on Windows/Linux.
    }
  });
}
