import * as React from 'react';

export type RuntimeKind = 'desktop' | 'web';

export type ObservableLogLevel = 'debug' | 'error' | 'info' | 'warn';

export type ObservableLogScalar = boolean | null | number | string | undefined;

export type ObservableLogDetails = Readonly<
  Record<string, ObservableLogScalar | readonly ObservableLogScalar[]>
>;

export type ObservableCorrelation = {
  readonly commandId?: string;
  readonly diagnosticsId?: string;
  readonly operation?: string;
  readonly parentId?: string;
  readonly requestId?: string;
  readonly traceId?: string;
};

export type ObservableLoggerEvent = {
  readonly correlation?: ObservableCorrelation;
  readonly details?: ObservableLogDetails;
  readonly event: string;
  readonly level: ObservableLogLevel;
  readonly message: string;
  readonly scope: string;
};

export type ObservableLoggerInput = Omit<ObservableLoggerEvent, 'level'>;

export type ObservableLogger = {
  readonly debug: (input: ObservableLoggerInput) => void;
  readonly error: (input: ObservableLoggerInput) => void;
  readonly info: (input: ObservableLoggerInput) => void;
  readonly log: (event: ObservableLoggerEvent) => void;
  readonly warn: (input: ObservableLoggerInput) => void;
};

export type ObservableStateKind = 'degraded' | 'ok' | 'unavailable' | 'unknown';

export type ObservableSafeError = {
  readonly code?: string;
  readonly message: string;
  readonly occurredAt?: string;
};

export type ObservableBackendState = {
  readonly checkedAt?: string;
  readonly label?: string;
  readonly lastError?: ObservableSafeError;
  readonly requestId?: string;
  readonly status: ObservableStateKind;
  readonly url?: string;
};

export type ObservableAgentState = {
  readonly agentId?: string;
  readonly backendUrl?: string;
  readonly lastError?: ObservableSafeError;
  readonly lastSeenAt?: string;
  readonly status: ObservableStateKind;
};

export type ObservableBrowserRuntimeState = {
  readonly diagnostic?: string;
  readonly lastError?: ObservableSafeError;
  readonly lastSeenAt?: string;
  readonly status: ObservableStateKind;
};

export type ObservableDiagnosticsReference = {
  readonly href?: string;
  readonly id: string;
  readonly label?: string;
  readonly summary?: string;
};

export type ObservableDiagnosticsState = {
  readonly enabled: boolean;
  readonly lastError?: ObservableSafeError;
  readonly references?: readonly ObservableDiagnosticsReference[];
  readonly status: ObservableStateKind;
};

export type ObservableRuntimeState = {
  readonly agent?: ObservableAgentState;
  readonly backend?: ObservableBackendState;
  readonly browserRuntime?: ObservableBrowserRuntimeState;
  readonly diagnostics?: ObservableDiagnosticsState;
  readonly generatedAt?: string;
};

export type RuntimeObservability = {
  readonly logger: ObservableLogger;
  readonly state?: ObservableRuntimeState;
};

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
  readonly observability: RuntimeObservability;
};

export type RuntimeObservabilityOptions = Partial<RuntimeObservability>;

type ObservableConsole = {
  readonly debug?: (...args: readonly unknown[]) => void;
  readonly error?: (...args: readonly unknown[]) => void;
  readonly info?: (...args: readonly unknown[]) => void;
  readonly log?: (...args: readonly unknown[]) => void;
  readonly warn?: (...args: readonly unknown[]) => void;
};

const redactedDetailKeyPattern =
  /authorization|cookie|html|localstorage|password|profilepath|screenshot|secret|storage.?state|token/i;

const levelPriority: Record<ObservableLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const noopLog = () => undefined;

export const noopObservableLogger: ObservableLogger = {
  debug: noopLog,
  error: noopLog,
  info: noopLog,
  log: noopLog,
  warn: noopLog,
};

export function redactObservableDetails(
  details: ObservableLogDetails | undefined,
): ObservableLogDetails | undefined {
  if (!details) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      redactedDetailKeyPattern.test(key)
        ? '[redacted]'
        : redactObservableValue(value),
    ]),
  );
}

export function createConsoleObservableLogger({
  consoleRef = console,
  environment = 'development',
  minLevel = environment === 'production' ? 'warn' : 'debug',
}: {
  readonly consoleRef?: ObservableConsole;
  readonly environment?: 'development' | 'production' | 'test';
  readonly minLevel?: ObservableLogLevel;
} = {}): ObservableLogger {
  const emit = (event: ObservableLoggerEvent) => {
    if (levelPriority[event.level] < levelPriority[minLevel]) {
      return;
    }

    const payload = {
      correlation: event.correlation,
      details: redactObservableDetails(event.details),
      event: event.event,
      level: event.level,
      scope: event.scope,
    };
    const method = consoleRef[event.level] ?? consoleRef.log;
    method?.(`[${event.scope}] ${event.event}: ${event.message}`, payload);
  };

  return {
    debug: (input) => emit({ ...input, level: 'debug' }),
    error: (input) => emit({ ...input, level: 'error' }),
    info: (input) => emit({ ...input, level: 'info' }),
    log: emit,
    warn: (input) => emit({ ...input, level: 'warn' }),
  };
}

export function createRuntimeObservability(
  options: RuntimeObservabilityOptions = {},
): RuntimeObservability {
  return {
    logger: options.logger ?? noopObservableLogger,
    state: options.state,
  };
}

const noCapabilities: RuntimeCapabilities = {
  canControlWindow: false,
  canReadLocalPaths: false,
  canUseLocalBrowserProfiles: false,
};

export const webRuntime: AppRuntime = {
  actions: {},
  capabilities: noCapabilities,
  kind: 'web',
  observability: createRuntimeObservability(),
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

export function useObservableRuntimeState():
  | ObservableRuntimeState
  | undefined {
  return useAppRuntime().observability.state;
}

export function useObservableLogger(): ObservableLogger {
  return useAppRuntime().observability.logger;
}

export function createDesktopRuntime(
  actions: HostActions,
  observability?: RuntimeObservabilityOptions,
): AppRuntime {
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
    observability: createRuntimeObservability(observability),
  };
}

function redactObservableValue(
  value: ObservableLogScalar | readonly ObservableLogScalar[],
): ObservableLogScalar | readonly ObservableLogScalar[] {
  if (Array.isArray(value)) {
    return value.map((item) => redactObservableScalar(item));
  }

  return redactObservableScalar(value as ObservableLogScalar);
}

function redactObservableScalar(
  value: ObservableLogScalar,
): ObservableLogScalar {
  if (typeof value !== 'string') {
    return value;
  }

  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}
