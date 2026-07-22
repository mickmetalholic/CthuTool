import { BROWSER_CAPABILITY } from '@cthutool/browser-runtime-protocol';
import {
  AgentClient,
  type AgentConnectionState,
  type WebSocketConstructor,
} from './agent-client';
import { BrowserProfileStore } from './browser-profile-store';
import type { AgentConfigPort, AgentDataPaths } from './config';
import {
  AgentObservabilityRecorder,
  type AgentObservabilitySink,
  type AgentObservabilitySource,
} from './observability';
import { PlaywrightHost } from './playwright-host';

export type AgentRuntimeCore = {
  readonly agentClient: AgentClient;
  readonly observability: AgentObservabilitySink;
  readonly playwrightHost: PlaywrightHost;
  readonly profileStore: BrowserProfileStore;
};

export type AgentRuntimeCoreOptions = {
  readonly config: AgentConfigPort;
  readonly paths: Pick<AgentDataPaths, 'profilesDir'>;
  readonly platform: 'darwin' | 'win32' | 'linux' | 'unknown';
  readonly version: string;
  readonly WebSocketImpl: WebSocketConstructor;
  readonly now?: () => Date;
  readonly observability?: AgentObservabilitySink;
  readonly observabilitySource?: AgentObservabilitySource;
  readonly onConnectionStateChange?: (state: AgentConnectionState) => void;
  readonly createPlaywrightHost?: (
    options: ConstructorParameters<typeof PlaywrightHost>[0],
  ) => PlaywrightHost;
};

export function createAgentRuntimeCore(
  options: AgentRuntimeCoreOptions,
): AgentRuntimeCore {
  const config = options.config.load();
  const observability =
    options.observability ??
    new AgentObservabilityRecorder({
      now: options.now,
      source: options.observabilitySource,
    });
  const profileStore = new BrowserProfileStore(
    options.paths.profilesDir,
    options.now,
  );
  const playwrightHost = (
    options.createPlaywrightHost ??
    ((playwrightOptions) => new PlaywrightHost(playwrightOptions))
  )({
    agentId: config.agentId,
    browserRuntime: config.browserRuntime,
    now: options.now,
    observability,
    observabilitySource: options.observabilitySource,
    profileStore,
  });
  const agentClient = new AgentClient({
    getConfig: () => options.config.load(),
    WebSocketImpl: options.WebSocketImpl,
    platform: options.platform,
    version: options.version,
    getCapabilities: () =>
      playwrightHost.isReady() ? [BROWSER_CAPABILITY] : [],
    handleBrowserRequest: (request) => playwrightHost.executeRequest(request),
    now: options.now,
    observability,
    observabilitySource: options.observabilitySource,
    onStateChange: options.onConnectionStateChange,
  });
  return {
    agentClient,
    observability,
    playwrightHost,
    profileStore,
  };
}
