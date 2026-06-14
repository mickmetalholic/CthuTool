import * as React from 'react';

export type RuntimeKind = 'desktop' | 'web';

export type RuntimeCapabilities = {
  readonly canControlWindow: boolean;
  readonly canReadLocalPaths: boolean;
  readonly canUseLocalBrowserProfiles: boolean;
};

export type WindowAction = 'close' | 'maximize' | 'minimize';

export type BrowserProfileActionInput = {
  readonly loginUrl?: string;
  readonly profileName?: string;
  readonly siteId: string;
  readonly verifyUrl?: string;
};

export type HostActions = {
  readonly clearBrowserProfile?: (
    input: BrowserProfileActionInput,
  ) => Promise<unknown>;
  readonly openBrowserLogin?: (
    input: BrowserProfileActionInput,
  ) => Promise<unknown>;
  readonly verifyBrowserProfile?: (
    input: BrowserProfileActionInput,
  ) => Promise<unknown>;
  readonly windowAction?: (action: WindowAction) => Promise<void> | void;
};

export type AppRuntime = {
  readonly actions: HostActions;
  readonly capabilities: RuntimeCapabilities;
  readonly kind: RuntimeKind;
};

const noCapabilities: RuntimeCapabilities = {
  canControlWindow: false,
  canReadLocalPaths: false,
  canUseLocalBrowserProfiles: false,
};

export const webRuntime: AppRuntime = {
  actions: {},
  capabilities: noCapabilities,
  kind: 'web',
};

const RuntimeContext = React.createContext<AppRuntime>(webRuntime);

export function AppRuntimeProvider({
  children,
  runtime,
}: {
  readonly children: React.ReactNode;
  readonly runtime: AppRuntime;
}) {
  return (
    <RuntimeContext.Provider value={runtime}>
      {children}
    </RuntimeContext.Provider>
  );
}

export function useAppRuntime(): AppRuntime {
  return React.useContext(RuntimeContext);
}

export function useRuntimeCapability(
  capability: keyof RuntimeCapabilities,
): boolean {
  return useAppRuntime().capabilities[capability];
}

export function createDesktopRuntime(actions: HostActions): AppRuntime {
  return {
    actions,
    capabilities: {
      canControlWindow: typeof actions.windowAction === 'function',
      canReadLocalPaths: true,
      canUseLocalBrowserProfiles:
        typeof actions.openBrowserLogin === 'function' ||
        typeof actions.verifyBrowserProfile === 'function' ||
        typeof actions.clearBrowserProfile === 'function',
    },
    kind: 'desktop',
  };
}
