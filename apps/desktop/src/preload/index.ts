import { contextBridge, ipcRenderer } from 'electron';
import type { AgentConnectionState } from '../main/agent-client';
import type { DesktopConfig, DesktopConfigPatch } from '../main/config';
import type { DesktopDiagnosticsSnapshot } from '../main/observability';
import type { PendingAuthTask } from '../main/pending-auth-task-store';
import type { BrowserRuntimeDiagnostic } from '../main/playwright-host';

type BrowserSiteActionInput = {
  readonly siteId: string;
  readonly profileName?: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
};

const api = {
  getConfig: (): Promise<DesktopConfig> =>
    ipcRenderer.invoke('desktop:getConfig'),
  getAppInfo: (): Promise<{
    readonly browserProfilesDir: string;
    readonly browserRuntime?: BrowserRuntimeDiagnostic;
    readonly configPath: string;
    readonly diagnostics: DesktopDiagnosticsSnapshot;
    readonly userDataDir: string;
    readonly version: string;
    readonly platform: string;
    readonly isPackaged: boolean;
  }> => ipcRenderer.invoke('desktop:getAppInfo'),
  saveConfig: (patch: DesktopConfigPatch): Promise<DesktopConfig> =>
    ipcRenderer.invoke('desktop:saveConfig', patch),
  getConnectionState: (): Promise<AgentConnectionState> =>
    ipcRenderer.invoke('desktop:getConnectionState'),
  getLocalPendingAuthTasks: (): Promise<PendingAuthTask[]> =>
    ipcRenderer.invoke('browser:getLocalPendingAuthTasks'),
  openBrowserLogin: (input: BrowserSiteActionInput): Promise<unknown> =>
    ipcRenderer.invoke('browser:openLogin', input),
  verifyBrowserProfile: (input: BrowserSiteActionInput): Promise<unknown> =>
    ipcRenderer.invoke('browser:verifyProfile', input),
  clearBrowserProfile: (input: BrowserSiteActionInput): Promise<unknown> =>
    ipcRenderer.invoke('browser:clearProfile', input),
  windowAction: (action: 'minimize' | 'maximize' | 'close'): Promise<void> =>
    ipcRenderer.invoke('desktop:windowAction', action),
  onConnectionStateChange: (
    callback: (state: AgentConnectionState) => void,
  ): (() => void) => {
    const listener = (_event: unknown, state: AgentConnectionState) => {
      callback(state);
    };
    ipcRenderer.on('agent:state', listener);
    return () => ipcRenderer.off('agent:state', listener);
  },
};

contextBridge.exposeInMainWorld('cthutoolDesktop', api);

export type CthuToolDesktopApi = typeof api;
