import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { platform } from 'node:process';
import {
  BROWSER_CAPABILITY,
  type BrowserCommandPayload,
} from '@cthutool/agent-protocol';
import { app, BrowserWindow, ipcMain } from 'electron';
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
import { PendingAuthTaskStore } from './pending-auth-task-store';
import { PlaywrightHost } from './playwright-host';

const appVersion = app.getVersion();
let mainWindow: BrowserWindow | undefined;
let agentClient: AgentClient | undefined;
let configStore: DesktopConfigStore | undefined;
let browserProfileStore: BrowserProfileStore | undefined;
let playwrightHost: PlaywrightHost | undefined;
let pendingAuthTasks: PendingAuthTaskStore | undefined;

type BrowserSiteActionInput = {
  readonly siteId: string;
  readonly profileName?: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
};

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
  ipcMain.handle(
    'browser:getLocalPendingAuthTasks',
    () => pendingAuthTasks?.list() ?? [],
  );
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
    configPath: join(app.getPath('userData'), 'config.json'),
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

async function executeBrowserAction(
  input: BrowserSiteActionInput,
  command: BrowserCommandPayload['command'],
) {
  if (!playwrightHost) {
    throw new Error('Browser host is not initialized');
  }
  const profileName = input.profileName;
  const payload: BrowserCommandPayload = {
    authPolicy: 'required',
    command,
    commandId: randomUUID(),
    loginUrl: input.loginUrl,
    profileName,
    siteId: input.siteId,
    timeoutMs: 120_000,
    verifyUrl: input.verifyUrl,
  };
  const result = await playwrightHost.execute(payload);
  await reportBrowserStateToBackend(
    configStore?.load().backendUrl ?? '',
    result,
  );
  return result;
}

async function reportBrowserStateToBackend(
  backendUrl: string,
  _result: Awaited<ReturnType<PlaywrightHost['execute']>>,
): Promise<void> {
  await reportLocalBrowserStateToBackend(backendUrl);
}

async function reportLocalBrowserStateToBackend(
  backendUrl: string,
): Promise<void> {
  if (!backendUrl) {
    return;
  }
  const agentId = configStore?.load().agentId;
  if (!agentId) {
    return;
  }
  const baseUrl = backendUrl.replace(/\/+$/, '');
  const reports: Promise<unknown>[] = [];

  const profileStore = browserProfileStore;
  if (profileStore) {
    reports.push(
      ...(await profileStore.listProfiles()).map((profile) =>
        postJson(
          `${baseUrl}/api/browser/profiles`,
          profileStore.toPublicProfile(agentId, profile),
        ),
      ),
    );
  }

  if (agentId && pendingAuthTasks) {
    reports.push(
      ...pendingAuthTasks
        .list()
        .filter(
          (task) => task.status === 'open' || task.status === 'in_progress',
        )
        .map((task) =>
          postJson(`${baseUrl}/api/browser/pending-auth-tasks`, {
            agentId,
            loginUrl: task.loginUrl,
            profileName: task.profileName,
            reason: task.reason,
            siteId: task.siteId,
            verifyUrl: task.verifyUrl,
          }),
        ),
    );
  }

  await Promise.allSettled(reports);
}

async function postJson(url: string, body: unknown): Promise<void> {
  await fetch(url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

function persistWindowState(): void {
  if (!mainWindow || !configStore) return;
  if (mainWindow.isDestroyed()) return;
  configStore.savePatch({
    windowState: {
      ...mainWindow.getBounds(),
      isMaximized: mainWindow.isMaximized(),
    },
  });
}

app.whenReady().then(() => {
  const userDataDir = app.getPath('userData');
  const store = new DesktopConfigStore(
    new JsonDesktopConfigStorage(join(userDataDir, 'config.json')),
    { isPackaged: app.isPackaged },
  );
  const profileStore = new BrowserProfileStore(
    join(userDataDir, 'browser-profiles'),
  );
  browserProfileStore = profileStore;
  pendingAuthTasks = new PendingAuthTaskStore();
  playwrightHost = new PlaywrightHost({
    agentId: store.load().agentId,
    headless: false,
    onStateChanged: () =>
      reportLocalBrowserStateToBackend(store.load().backendUrl),
    pendingAuthTasks,
    profileStore,
  });
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
    handleBrowserCommand: (command) => {
      if (!playwrightHost) {
        throw new Error('Browser host is not initialized');
      }
      return playwrightHost.execute(command);
    },
    onRegistered: (state) => {
      void reportLocalBrowserStateToBackend(state.backendUrl);
    },
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
