import { contextBridge, ipcRenderer } from 'electron';
import type { AgentConnectionState } from '../main/agent-client';
import type { DesktopConfig, DesktopConfigPatch } from '../main/config';

const api = {
  getConfig: (): Promise<DesktopConfig> =>
    ipcRenderer.invoke('desktop:getConfig'),
  saveConfig: (patch: DesktopConfigPatch): Promise<DesktopConfig> =>
    ipcRenderer.invoke('desktop:saveConfig', patch),
  getConnectionState: (): Promise<AgentConnectionState> =>
    ipcRenderer.invoke('desktop:getConnectionState'),
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
