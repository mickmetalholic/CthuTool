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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    title: 'CthuTool Desktop',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function emitConnectionState(state: AgentConnectionState): void {
  mainWindow?.webContents.send('agent:state', state);
}

function setupIpc(configStore: DesktopConfigStore): void {
  ipcMain.handle('desktop:getConfig', () => configStore.load());
  ipcMain.handle('desktop:getConnectionState', () => agentClient?.getState());
  ipcMain.handle('desktop:saveConfig', (_event, patch: DesktopConfigPatch) => {
    const config = configStore.savePatch(patch);
    agentClient?.refreshConfig();
    return config;
  });
}

app.whenReady().then(() => {
  const configStore = new DesktopConfigStore(
    new JsonDesktopConfigStorage(join(app.getPath('userData'), 'config.json')),
  );
  setupIpc(configStore);
  agentClient = new AgentClient({
    getConfig: () => configStore.load(),
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  agentClient?.stop();
});
