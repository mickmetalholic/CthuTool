import { join } from 'node:path';
import { platform } from 'node:process';
import { migrateLegacyDesktopData } from '@cthutool/agent-data-migration';
import {
  AgentConfigStore,
  AgentControlServer,
  AgentEnvironmentManager,
  AgentLocalBridge,
  type AgentRuntimeCore,
  type AgentRuntimeCoreOptions,
  AgentRuntimeService,
  createAgentRuntimeCore,
  createAgentRuntimeLockSet,
  FileAgentObservabilityRecorder,
  getSelfUseSetupState,
  isSelfUseConfigured,
  JsonAgentConfigStorage,
  JsonAgentEnvironmentStorage,
  loadAgentEnvironmentCatalog,
  migrateToSelfUseConfig,
  probeAgentControl,
  resolveAgentControlEndpoint,
  resolveAgentDataPaths,
  SELF_USE_ENVIRONMENT_ID,
  type WebSocketConstructor,
} from '@cthutool/agent-runtime';
import WebSocket from 'ws';

export async function runAgentProcess(
  options: {
    readonly userDataDir?: string;
    readonly legacyDesktopUserDataDir?: string;
    readonly applicationVersion?: string;
    readonly processPlatform?: NodeJS.Platform;
    readonly releaseEnvironmentCatalog?: unknown;
    readonly WebSocketImpl?: WebSocketConstructor;
    readonly createRuntimeCore?: (
      coreOptions: AgentRuntimeCoreOptions,
    ) => AgentRuntimeCore;
  } = {},
): Promise<AgentRuntimeService> {
  const paths = resolveAgentDataPaths({
    rootDir: options.userDataDir,
    legacyDesktopUserDataDir:
      options.legacyDesktopUserDataDir ??
      process.env.CTHUTOOL_AGENT_LEGACY_DATA_DIR,
  });
  const allowDevelopmentLocalhost =
    process.env.CTHUTOOL_AGENT_ALLOW_CUSTOM_ENVIRONMENTS === '1' ||
    process.env.NODE_ENV !== 'production';
  const selfUseMigration = migrateToSelfUseConfig(paths, {
    allowDevelopmentLocalhost,
  });
  const setupState = getSelfUseSetupState(paths, { allowDevelopmentLocalhost });
  if (
    process.env.NODE_ENV === 'production' &&
    !options.releaseEnvironmentCatalog &&
    !process.env.CTHUTOOL_AGENT_ENVIRONMENTS_PATH &&
    setupState.setupRequired
  ) {
    throw new Error(
      'Agent setup required: run Agent Settings or `chc agent settings` to configure the deployment Origin',
    );
  }
  const config = new AgentConfigStore(
    new JsonAgentConfigStorage(paths.configPath),
    {
      backendUrl: process.env.CTHUTOOL_AGENT_BACKEND_URL,
      connectionEnabled: process.env.CTHUTOOL_AGENT_DISABLED !== '1',
    },
  );
  const selfUseReady =
    Boolean(selfUseMigration.config.deploymentOrigin) &&
    isSelfUseConfigured(selfUseMigration.config, {
      allowDevelopmentLocalhost,
    });
  const catalog = loadAgentEnvironmentCatalog({
    allowCustomDevelopmentProfiles:
      process.env.CTHUTOOL_AGENT_ALLOW_CUSTOM_ENVIRONMENTS === '1',
    allowDevelopmentLocalhost,
    customDevelopmentCatalogPath:
      process.env.CTHUTOOL_AGENT_CUSTOM_ENVIRONMENTS_PATH,
    defaultBackendUrl: process.env.CTHUTOOL_AGENT_BACKEND_URL,
    defaultWebOrigin: process.env.CTHUTOOL_WEB_ORIGIN,
    nodeEnv: process.env.NODE_ENV,
    releaseCatalog: options.releaseEnvironmentCatalog,
    releaseCatalogPath: selfUseReady
      ? undefined
      : process.env.CTHUTOOL_AGENT_ENVIRONMENTS_PATH,
    selfUseDeploymentOrigin: selfUseReady
      ? selfUseMigration.config.deploymentOrigin
      : undefined,
  });
  const environmentStorage = new JsonAgentEnvironmentStorage(paths);
  if (selfUseReady) {
    environmentStorage.writeSelection({
      activeEnvironmentId: SELF_USE_ENVIRONMENT_ID,
    });
  }
  const explicitEnvironmentId =
    environmentStorage.readSelection().activeEnvironmentId;
  const migration = await migrateLegacyDesktopData({
    agentRootDir: paths.rootDir,
    legacyRootDir: paths.legacyDesktopUserDataDir,
    environments: catalog.profiles,
    explicitEnvironmentId,
  });
  if (
    migration.status === 'selection-required' ||
    migration.status === 'locked' ||
    migration.status === 'failed'
  ) {
    throw new Error(
      `${migration.message}${migration.retryCommand ? ` Next: ${migration.retryCommand}` : ''}`,
    );
  }
  if (
    !explicitEnvironmentId &&
    migration.environmentId &&
    (migration.status === 'migrated' || migration.status === 'already-migrated')
  ) {
    environmentStorage.writeSelection({
      activeEnvironmentId: migration.environmentId,
    });
  }
  const environments = new AgentEnvironmentManager(
    config,
    catalog,
    paths,
    environmentStorage,
  );
  const activePaths = environments.getActivePaths();
  const controlEndpoint = resolveAgentControlEndpoint({
    runtimeDir: paths.runtimeDir,
  });
  const locks = createAgentRuntimeLockSet({
    paths: {
      profilesDir: activePaths?.profilesDir ?? paths.profilesDir,
      runtimeDir: paths.runtimeDir,
    },
    controlEndpoint,
    overrides: { probeControl: probeAgentControl },
  });
  const applicationVersion =
    options.applicationVersion ?? process.env.CTHUTOOL_AGENT_VERSION ?? '0.0.0';
  const core = (options.createRuntimeCore ?? createAgentRuntimeCore)({
    config: environments,
    paths: { profilesDir: activePaths?.profilesDir ?? paths.profilesDir },
    platform: normalizePlatform(options.processPlatform ?? platform),
    version: applicationVersion,
    observability: new FileAgentObservabilityRecorder({
      path: join(paths.logsDir, 'agent.log'),
    }),
    WebSocketImpl:
      options.WebSocketImpl ?? (WebSocket as unknown as WebSocketConstructor),
  });
  const runtime = new AgentRuntimeService({
    applicationVersion,
    core,
    environment: environments,
    locks,
    createControlServer: (service) =>
      new AgentControlServer({
        endpoint: controlEndpoint,
        getHealth: () => service.getHealth(),
        instanceNonce: locks.record.nonce,
        issueBridgeLaunch: () => service.issueBridgeLaunch(),
        listEnvironments: () => {
          const activeId = environments.getActiveProfile()?.environmentId;
          return environments.listProfiles().map((profile) => ({
            active: profile.environmentId === activeId,
            id: profile.environmentId,
            label: profile.label,
          }));
        },
        shutdown: () => service.stop(),
        switchEnvironment: (environmentId) =>
          service.switchEnvironment(environmentId),
      }),
    createLocalBridge: (service) =>
      new AgentLocalBridge({
        deleteProfile: (input) =>
          core.profileStore.clearProfile(input.siteId, input.profileName),
        executeBrowserCommand: (request) =>
          core.playwrightHost.executeRequest(request as never),
        getContext: () => {
          const active = environments.getActiveProfile();
          return active
            ? {
                environmentId: active.environmentId,
                webAgentUrl: active.webAgentUrl,
                webOrigin: active.webOrigin,
              }
            : undefined;
        },
        getResources: async () => {
          const config = environments.load();
          const health = service.getHealth();
          const browser = core.playwrightHost.getRuntimeDiagnostic();
          const diagnostics = readDiagnostics(core.observability);
          return {
            agent: {
              backendStatus: health.backend.status,
              deviceName: config.deviceName,
              id: config.agentId,
              processState: health.process.state,
              version: applicationVersion,
            },
            autostart: { enabled: false, supported: false },
            browser: {
              executablePath: config.browserRuntime.executablePath,
              executablePathConfigured: Boolean(
                config.browserRuntime.executablePath,
              ),
              message: browser.message,
              ready: core.playwrightHost.isReady(),
              status: browser.status,
            },
            diagnostics,
            environment: {
              backendHttpUrl: config.backendUrl,
              id: config.activeEnvironment.id,
              label: config.activeEnvironment.label,
              webOrigin: config.activeEnvironment.webOrigin ?? '',
            },
            profiles: (await core.profileStore.listProfiles()).map(
              (profile) => ({
                displayName: profile.displayName,
                profileName: profile.profileName,
                siteId: profile.siteId,
                status: profile.status,
                updatedAt: profile.updatedAt,
                verifiedAt: profile.verifiedAt,
              }),
            ),
            protocolVersion: 1,
          };
        },
        isProfileLocked: (input) =>
          core.playwrightHost.isProfileInUse(input.siteId, input.profileName),
        lifecycleAction: (action) => {
          if (action === 'agent.quit') {
            setTimeout(() => void service.stop(), 0).unref();
            return { accepted: true };
          }
          return { accepted: false, reason: 'lifecycle adapter unavailable' };
        },
        updateSettings: async (patch) => {
          const next = environments.updateActiveSettings(patch);
          if (patch.browserExecutablePath !== undefined) {
            await service.refreshConfig(next.browserRuntime);
            return { effect: 'restart-required' as const };
          }
          core.agentClient.refreshConfig();
          return {
            effect:
              patch.connectionEnabled !== undefined
                ? ('reconnect-required' as const)
                : ('immediate' as const),
          };
        },
      }),
  });
  await runtime.start();
  return runtime;
}

function readDiagnostics(observability: AgentRuntimeCore['observability']) {
  const recorder = observability as AgentRuntimeCore['observability'] & {
    readonly snapshot?: () => {
      readonly recentEvents: readonly {
        readonly event: string;
        readonly level: string;
        readonly message: string;
        readonly timestamp: string;
      }[];
    };
  };
  return (recorder.snapshot?.().recentEvents ?? []).map((event) => ({
    event: event.event,
    level: event.level,
    message: event.message,
    timestamp: event.timestamp,
  }));
}

function normalizePlatform(
  value: string,
): 'darwin' | 'win32' | 'linux' | 'unknown' {
  return value === 'darwin' || value === 'win32' || value === 'linux'
    ? value
    : 'unknown';
}

function readUserDataArgument(argv: readonly string[]): string | undefined {
  const index = argv.indexOf('--user-data-dir');
  return index >= 0 ? argv[index + 1] : undefined;
}

if (require.main === module) {
  let runtime: AgentRuntimeService | undefined;
  let shutdownRequested = false;
  const shutdown = async () => {
    shutdownRequested = true;
    await runtime?.stop();
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  void runAgentProcess({
    userDataDir: readUserDataArgument(process.argv.slice(2)),
  })
    .then((startedRuntime) => {
      runtime = startedRuntime;
      if (shutdownRequested) {
        void runtime.stop();
      }
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : 'Agent startup failed'}\n`,
      );
      process.exitCode = 1;
    });
}
