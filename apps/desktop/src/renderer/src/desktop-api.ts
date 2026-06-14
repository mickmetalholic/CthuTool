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
  return window.cthutoolDesktop;
}

declare global {
  interface Window {
    readonly cthutoolDesktop: CthuToolDesktopApi;
  }
}
