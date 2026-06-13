import { join } from 'node:path';
import { platform } from 'node:process';
import { app, BrowserWindow, ipcMain } from 'electron';
import WebSocket from 'ws';
import {
  AgentClient,
  type AgentConnectionState,
  type WebSocketConstructor,
} from './agent-client';
import {
  type DesktopConfigPatch,
  DesktopConfigStore,
  JsonDesktopConfigStorage,
} from './config';

const appVersion = app.getVersion();
let mainWindow: BrowserWindow | undefined;
let agentClient: AgentClient | undefined;
let configStore: DesktopConfigStore | undefined;

function createWindow(): void {
  const config = configStore?.load();
  const windowState = config?.windowState;
  mainWindow = new BrowserWindow({
    x: windowState?.x,
    y: windowState?.y,
    width: windowState?.width ?? 1120,
    height: windowState?.height ?? 760,
    minWidth: 860,
    minHeight: 600,
    title: 'CthuDesktop',
    frame: false,
    backgroundColor: '#282a36',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (windowState?.isMaximized) {
    mainWindow.maximize();
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function emitConnectionState(state: AgentConnectionState): void {
  mainWindow?.webContents.send('agent:state', state);
}

function setupIpc(store: DesktopConfigStore): void {
  ipcMain.handle('desktop:getConfig', () => store.load());
  ipcMain.handle('desktop:getConnectionState', () => agentClient?.getState());
  ipcMain.handle('desktop:getAppInfo', () => ({
    version: appVersion,
    platform:
      platform === 'darwin' || platform === 'win32' || platform === 'linux'
        ? platform
        : 'unknown',
    isPackaged: app.isPackaged,
  }));
  ipcMain.handle('desktop:saveConfig', (_event, patch: DesktopConfigPatch) => {
    const config = store.savePatch(patch);
    agentClient?.refreshConfig();
    return config;
  });
  ipcMain.handle(
    'desktop:windowAction',
    (_event, action: 'minimize' | 'maximize' | 'close') => {
      if (!mainWindow) return;
      if (action === 'minimize') {
        mainWindow.minimize();
      }
      if (action === 'maximize') {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
      }
      if (action === 'close') {
        mainWindow.close();
      }
    },
  );
}

function persistWindowState(): void {
  if (!mainWindow || !configStore) return;
  configStore.savePatch({
    windowState: {
      ...mainWindow.getBounds(),
      isMaximized: mainWindow.isMaximized(),
    },
  });
}

app.whenReady().then(() => {
  const store = new DesktopConfigStore(
    new JsonDesktopConfigStorage(join(app.getPath('userData'), 'config.json')),
    { isPackaged: app.isPackaged },
  );
  configStore = store;
  setupIpc(store);
  agentClient = new AgentClient({
    getConfig: () => store.load(),
    WebSocketImpl: WebSocket as unknown as WebSocketConstructor,
    platform:
      platform === 'darwin' || platform === 'win32' || platform === 'linux'
        ? platform
        : 'unknown',
    version: appVersion,
    onStateChange: emitConnectionState,
  });
  agentClient.start();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  persistWindowState();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  persistWindowState();
  agentClient?.stop();
});
