import {
  type AppRuntime,
  createDesktopRuntime,
  type HostActions,
} from '@cthutool/app-shell';
import type { DesktopApi } from './desktop-api';

export function createDesktopRuntimeAdapter(
  desktopApi: DesktopApi,
): AppRuntime {
  const clearBrowserProfile: HostActions['clearBrowserProfile'] =
    typeof desktopApi.clearBrowserProfile === 'function'
      ? (input) => desktopApi.clearBrowserProfile(input)
      : undefined;
  const openBrowserLogin: HostActions['openBrowserLogin'] =
    typeof desktopApi.openBrowserLogin === 'function'
      ? (input) => desktopApi.openBrowserLogin(input)
      : undefined;
  const verifyBrowserProfile: HostActions['verifyBrowserProfile'] =
    typeof desktopApi.verifyBrowserProfile === 'function'
      ? (input) => desktopApi.verifyBrowserProfile(input)
      : undefined;

  const actions: HostActions = {
    clearBrowserProfile,
    openBrowserLogin,
    verifyBrowserProfile,
    windowAction: (action) => desktopApi.windowAction(action),
  };

  return createDesktopRuntime(actions);
}
