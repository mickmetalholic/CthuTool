import type { CthuToolDesktopApi } from '../../preload';

export type DesktopApi = CthuToolDesktopApi;

export function getDesktopApi(): DesktopApi {
  return window.cthutoolDesktop;
}

declare global {
  interface Window {
    readonly cthutoolDesktop: CthuToolDesktopApi;
  }
}
