import type { AgentConnectionState } from '../../main/agent-client';
import type { DesktopConfig } from '../../main/config';
import type { BrowserRuntimeDiagnostic } from '../../main/playwright-host';
import type { CthuToolDesktopApi } from '../../preload';

export type DesktopAppInfo = Awaited<
  ReturnType<CthuToolDesktopApi['getAppInfo']>
> & {
  readonly browserRuntime?: BrowserRuntimeDiagnostic;
};

export type DesktopApi = Omit<CthuToolDesktopApi, 'getAppInfo'> & {
  readonly getAppInfo: () => Promise<DesktopAppInfo>;
};

export function getDesktopApi(): DesktopApi {
  return window.cthutoolDesktop ?? webPreviewDesktopApi;
}

const webPreviewConfig: DesktopConfig = {
  activeEnvironment: {
    backendUrl: 'http://localhost:3000',
    id: 'local',
    label: 'Local',
  },
  activeEnvironmentId: 'local',
  agentId: 'web-preview',
  appearance: {
    colorScheme: 'dracula',
    mode: 'dark',
  },
  backendUrl: 'http://localhost:3000',
  browserRuntime: {
    kind: 'host-chrome',
  },
  connectionEnabled: false,
  deviceName: 'Web Preview',
  environmentProfiles: [
    {
      backendUrl: 'http://localhost:3000',
      id: 'local',
      label: 'Local',
    },
  ],
};

const webPreviewConnection: AgentConnectionState = {
  agentId: 'web-preview',
  backendUrl: 'http://localhost:3000',
  deviceName: 'Web Preview',
  environmentLabel: 'Local',
  status: 'disconnected',
};

const webPreviewDesktopApi: DesktopApi = {
  clearBrowserProfile: async () => undefined,
  getAppInfo: async () => ({
    browserProfilesDir: '',
    browserRuntime: {
      message: 'Desktop preload is not available in this preview',
      preferredKind: 'host-chrome',
      status: 'pending',
    },
    configPath: '',
    isPackaged: false,
    platform: 'web',
    userDataDir: '',
    version: 'preview',
  }),
  getConfig: async () => webPreviewConfig,
  getConnectionState: async () => webPreviewConnection,
  getLocalPendingAuthTasks: async () => [],
  onConnectionStateChange: () => () => undefined,
  openBrowserLogin: async () => undefined,
  saveConfig: async (patch) => ({
    ...webPreviewConfig,
    ...patch,
    activeEnvironment: {
      ...webPreviewConfig.activeEnvironment,
      backendUrl: patch.backendUrl ?? webPreviewConfig.backendUrl,
    },
    backendUrl: patch.backendUrl ?? webPreviewConfig.backendUrl,
  }),
  verifyBrowserProfile: async () => undefined,
  windowAction: async () => undefined,
};

declare global {
  interface Window {
    readonly cthutoolDesktop: CthuToolDesktopApi;
  }
}
