import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { platform } from 'node:process';
import {
  BROWSER_CAPABILITY,
  type BrowserRuntimeMethod,
  createBrowserRuntimeRequest,
} from '@cthutool/browser-runtime-protocol';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import WebSocket from 'ws';
import {
  AgentClient,
  type AgentConnectionState,
  type WebSocketConstructor,
} from './agent-client';
import { BrowserProfileStore } from './browser-profile-store';
import {
  type DesktopConfigPatch,
  DesktopConfigStore,
  JsonDesktopConfigStorage,
} from './config';
import { DesktopObservabilityRecorder } from './observability';
import { PlaywrightHost } from './playwright-host';
import { resolveDesktopWindowBounds } from './window-bounds';

const appVersion = app.getVersion();
app.setAppUserModelId('dev.cthutool.desktop');

let mainWindow: BrowserWindow | undefined;
let agentClient: AgentClient | undefined;
let configStore: DesktopConfigStore | undefined;
let playwrightHost: PlaywrightHost | undefined;
const desktopObservability = new DesktopObservabilityRecorder();

type BrowserSiteActionInput = {
  readonly siteId: string;
  readonly profileName?: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
};

function createWindow(): void {
  const config = configStore?.load();
  const windowBounds = resolveDesktopWindowBounds(
    config?.windowState,
    screen.getAllDisplays().map((display) => display.workArea),
  );
  mainWindow = new BrowserWindow({
    x: windowBounds.x,
    y: windowBounds.y,
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 860,
    minHeight: 600,
    title: 'CthuDesktop',
    icon: join(app.getAppPath(), 'build', 'icon.png'),
    frame: false,
    backgroundColor: '#282a36',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (windowBounds.isMaximized) {
    mainWindow.maximize();
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('close', persistWindowState);
  mainWindow.on('resize', persistWindowState);
  mainWindow.on('move', persistWindowState);
  mainWindow.on('maximize', persistWindowState);
  mainWindow.on('unmaximize', persistWindowState);
  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

function emitConnectionState(state: AgentConnectionState): void {
  if (mainWindow?.isDestroyed()) {
    return;
  }
  mainWindow?.webContents.send('agent:state', state);
}

function setupIpc(store: DesktopConfigStore): void {
  ipcMain.handle('desktop:getConfig', () => store.load());
  ipcMain.handle('desktop:getConnectionState', () => agentClient?.getState());
  ipcMain.handle('browser:openLogin', (_event, input: BrowserSiteActionInput) =>
    executeBrowserAction(input, 'browser.openLogin'),
  );
  ipcMain.handle(
    'browser:verifyProfile',
    (_event, input: BrowserSiteActionInput) =>
      executeBrowserAction(input, 'browser.verifyProfile'),
  );
  ipcMain.handle(
    'browser:clearProfile',
    (_event, input: BrowserSiteActionInput) =>
      executeBrowserAction(input, 'browser.clearProfile'),
  );
  ipcMain.handle('desktop:getAppInfo', () => ({
    browserProfilesDir: join(app.getPath('userData'), 'browser-profiles'),
    browserRuntime: playwrightHost?.getRuntimeDiagnostic(),
    configPath: join(app.getPath('userData'), 'config.json'),
    diagnostics: desktopObservability.snapshot(),
    userDataDir: app.getPath('userData'),
    version: appVersion,
    platform:
      platform === 'darwin' || platform === 'win32' || platform === 'linux'
        ? platform
        : 'unknown',
    isPackaged: app.isPackaged,
  }));
  ipcMain.handle('desktop:saveConfig', (_event, patch: DesktopConfigPatch) => {
    const config = store.savePatch(patch);
    playwrightHost?.setBrowserRuntime(config.browserRuntime);
    void playwrightHost?.initialize().then(() => {
      agentClient?.refreshConfig();
    });
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

async function executeBrowserAction(
  input: BrowserSiteActionInput,
  command: Extract<
    BrowserRuntimeMethod,
    'browser.openLogin' | 'browser.verifyProfile' | 'browser.clearProfile'
  >,
) {
  if (!playwrightHost) {
    throw new Error('Browser host is not initialized');
  }
  const profileName = input.profileName;
  const payload = {
    authPolicy: 'required' as const,
    loginUrl: input.loginUrl,
    profileName,
    siteId: input.siteId,
    timeoutMs: 120_000,
    verifyUrl: input.verifyUrl,
  };
  const commandId = randomUUID();
  return playwrightHost.executeRequest({
    ...createBrowserRuntimeRequest(commandId, command, payload),
    observability: {
      commandId,
      operation: command,
    },
  });
}

function persistWindowState(): void {
  if (!mainWindow || !configStore) return;
  if (mainWindow.isDestroyed()) return;
  const bounds = mainWindow.isMaximized()
    ? mainWindow.getNormalBounds()
    : mainWindow.getBounds();
  configStore.savePatch({
    windowState: {
      ...bounds,
      isMaximized: mainWindow.isMaximized(),
    },
  });
}

app.whenReady().then(async () => {
  const userDataDir = app.getPath('userData');
  const store = new DesktopConfigStore(
    new JsonDesktopConfigStorage(join(userDataDir, 'config.json')),
    { isPackaged: app.isPackaged },
  );
  const profileStore = new BrowserProfileStore(
    join(userDataDir, 'browser-profiles'),
  );
  const config = store.load();
  playwrightHost = new PlaywrightHost({
    agentId: config.agentId,
    browserRuntime: config.browserRuntime,
    observability: desktopObservability,
    profileStore,
  });
  await playwrightHost.initialize();
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
    getCapabilities: () =>
      playwrightHost?.isReady() ? [BROWSER_CAPABILITY] : [],
    handleBrowserRequest: (request) => {
      if (!playwrightHost) {
        throw new Error('Browser host is not initialized');
      }
      return playwrightHost.executeRequest(request);
    },
    onStateChange: emitConnectionState,
    observability: desktopObservability,
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
