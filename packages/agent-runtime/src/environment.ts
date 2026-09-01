import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import type { AgentConfig, AgentConfigPort, AgentDataPaths } from './config';

const ENVIRONMENT_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const NAMESPACE_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export type AgentEnvironmentTrust = 'release' | 'custom-development';

export type AgentEnvironmentProfile = {
  readonly environmentId: string;
  readonly label: string;
  readonly webOrigin: string;
  readonly webAgentUrl: string;
  readonly backendHttpUrl: string;
  readonly backendAgentWsUrl: string;
  readonly namespace: string;
  readonly trust: AgentEnvironmentTrust;
};

export type AgentEnvironmentCatalog = {
  readonly version: number;
  readonly profiles: readonly AgentEnvironmentProfile[];
};

export type AgentEnvironmentDataPaths = {
  readonly rootDir: string;
  readonly configPath: string;
  readonly profilesDir: string;
  readonly runtimeDir: string;
  readonly logsDir: string;
};

export type AgentEnvironmentSelection = {
  readonly activeEnvironmentId?: string;
};

export type AgentEnvironmentStorage = {
  readonly readSelection: () => AgentEnvironmentSelection;
  readonly writeSelection: (selection: AgentEnvironmentSelection) => void;
};

export type AgentEnvironmentSwitchPort = AgentConfigPort & {
  readonly getActiveProfile: () => AgentEnvironmentProfile | undefined;
  readonly getActivePaths: () => AgentEnvironmentDataPaths | undefined;
  readonly listProfiles: () => readonly AgentEnvironmentProfile[];
  readonly selectEnvironment: (environmentId: string) => {
    readonly changed: boolean;
    readonly profile: AgentEnvironmentProfile;
    readonly paths: AgentEnvironmentDataPaths;
  };
  readonly updateActiveSettings: (patch: {
    readonly deviceName?: string;
    readonly connectionEnabled?: boolean;
    readonly browserExecutablePath?: string;
  }) => AgentConfig;
};

export class JsonAgentEnvironmentStorage implements AgentEnvironmentStorage {
  constructor(
    paths: AgentDataPaths,
    private readonly selectionPath = join(paths.rootDir, 'environment.json'),
  ) {}

  readSelection(): AgentEnvironmentSelection {
    if (!existsSync(this.selectionPath)) {
      return {};
    }
    const input = JSON.parse(
      readFileSync(this.selectionPath, 'utf8'),
    ) as AgentEnvironmentSelection;
    return {
      activeEnvironmentId: normalizeText(input.activeEnvironmentId),
    };
  }

  writeSelection(selection: AgentEnvironmentSelection): void {
    atomicWriteJson(this.selectionPath, selection);
  }
}

export class AgentEnvironmentManager implements AgentEnvironmentSwitchPort {
  constructor(
    private readonly baseConfig: AgentConfigPort,
    private readonly catalog: AgentEnvironmentCatalog,
    private readonly paths: AgentDataPaths,
    private readonly storage: AgentEnvironmentStorage,
  ) {}

  listProfiles(): readonly AgentEnvironmentProfile[] {
    return this.catalog.profiles.map((profile) => ({ ...profile }));
  }

  getActiveProfile(): AgentEnvironmentProfile | undefined {
    const selection = this.storage.readSelection();
    const fallbackId = this.baseConfig.load().activeEnvironment.id;
    const environmentId = selection.activeEnvironmentId ?? fallbackId;
    return this.catalog.profiles.find(
      (profile) => profile.environmentId === environmentId,
    );
  }

  getActivePaths(): AgentEnvironmentDataPaths | undefined {
    const profile = this.getActiveProfile();
    return profile
      ? resolveAgentEnvironmentDataPaths(this.paths, profile)
      : undefined;
  }

  load(): AgentConfig {
    const base = this.baseConfig.load();
    const profile = this.getActiveProfile();
    if (!profile) {
      return {
        ...base,
        connectionEnabled: false,
      };
    }
    const environmentPaths = resolveAgentEnvironmentDataPaths(
      this.paths,
      profile,
    );
    const overrides = readEnvironmentOverrides(environmentPaths.configPath);
    return {
      ...base,
      activeEnvironment: {
        id: profile.environmentId,
        label: profile.label,
        webOrigin: profile.webOrigin,
        webAgentUrl: profile.webAgentUrl,
        backendHttpUrl: profile.backendHttpUrl,
        backendAgentWsUrl: profile.backendAgentWsUrl,
        namespace: profile.namespace,
        trust: profile.trust,
      },
      backendUrl: profile.backendHttpUrl,
      agentWsUrl: profile.backendAgentWsUrl,
      browserRuntime: {
        kind: 'host-chrome',
        executablePath:
          normalizeText(overrides.browserExecutablePath) ??
          base.browserRuntime.executablePath,
      },
      connectionEnabled: overrides.connectionEnabled ?? base.connectionEnabled,
      deviceName: normalizeText(overrides.deviceName) ?? base.deviceName,
    };
  }

  selectEnvironment(environmentId: string): {
    readonly changed: boolean;
    readonly profile: AgentEnvironmentProfile;
    readonly paths: AgentEnvironmentDataPaths;
  } {
    const normalized = normalizeEnvironmentId(environmentId);
    if (
      this.catalog.profiles.length === 1 &&
      this.catalog.profiles[0]?.environmentId === 'self-use' &&
      normalized !== 'self-use'
    ) {
      throw new Error(
        'Self-use Agent installations support only the fixed self-use environment',
      );
    }
    const profile = this.catalog.profiles.find(
      (candidate) => candidate.environmentId === normalized,
    );
    if (!profile) {
      throw new Error(`Unknown Agent environment "${normalized}"`);
    }
    const current = this.getActiveProfile();
    this.storage.writeSelection({ activeEnvironmentId: profile.environmentId });
    return {
      changed: current?.environmentId !== profile.environmentId,
      paths: resolveAgentEnvironmentDataPaths(this.paths, profile),
      profile,
    };
  }

  updateActiveSettings(patch: {
    readonly deviceName?: string;
    readonly connectionEnabled?: boolean;
    readonly browserExecutablePath?: string;
  }): AgentConfig {
    const paths = this.getActivePaths();
    if (!paths) {
      throw new Error('Select an Agent environment before changing settings');
    }
    const current = readEnvironmentOverrides(paths.configPath);
    atomicWriteJson(paths.configPath, {
      ...current,
      ...(patch.deviceName === undefined
        ? {}
        : { deviceName: patch.deviceName.trim() }),
      ...(patch.connectionEnabled === undefined
        ? {}
        : { connectionEnabled: patch.connectionEnabled }),
      ...(patch.browserExecutablePath === undefined
        ? {}
        : { browserExecutablePath: patch.browserExecutablePath.trim() }),
    });
    return this.load();
  }
}

export function loadAgentEnvironmentCatalog(
  options: {
    readonly releaseCatalogPath?: string;
    readonly releaseCatalog?: unknown;
    readonly customDevelopmentCatalogPath?: string;
    readonly allowCustomDevelopmentProfiles?: boolean;
    readonly nodeEnv?: string;
    readonly defaultBackendUrl?: string;
    readonly defaultWebOrigin?: string;
    readonly selfUseDeploymentOrigin?: string;
    readonly allowDevelopmentLocalhost?: boolean;
  } = {},
): AgentEnvironmentCatalog {
  if (options.selfUseDeploymentOrigin) {
    return {
      version: 1,
      profiles: [
        createSelfUseReleaseProfile(
          options.selfUseDeploymentOrigin,
          options.allowDevelopmentLocalhost === true,
        ),
      ],
    };
  }
  const releaseInput = options.releaseCatalogPath
    ? readJson(options.releaseCatalogPath)
    : options.releaseCatalog;
  const releaseProfiles = releaseInput
    ? parseCatalogInput(releaseInput, 'release')
    : [];
  let customProfiles: AgentEnvironmentProfile[] = [];
  if (options.customDevelopmentCatalogPath) {
    if (
      options.nodeEnv === 'production' ||
      !options.allowCustomDevelopmentProfiles
    ) {
      throw new Error(
        'Custom Agent environments require an explicit non-production development opt-in',
      );
    }
    customProfiles = parseCatalogInput(
      readJson(options.customDevelopmentCatalogPath),
      'custom-development',
    );
  }
  if (releaseProfiles.length === 0 && customProfiles.length === 0) {
    if (options.nodeEnv === 'production') {
      throw new Error(
        'Production Agent requires a self-use deployment Origin or a release environment catalog',
      );
    }
    customProfiles = [
      createLocalDevelopmentProfile(
        options.defaultBackendUrl,
        options.defaultWebOrigin,
      ),
    ];
  }
  const profiles = [...releaseProfiles, ...customProfiles];
  assertUniqueCatalog(profiles);
  return { version: 1, profiles };
}

export function createSelfUseReleaseProfile(
  deploymentOrigin: string,
  allowDevelopmentLocalhost = false,
): AgentEnvironmentProfile {
  const trust: AgentEnvironmentTrust =
    allowDevelopmentLocalhost && isLocalDevelopmentOrigin(deploymentOrigin)
      ? 'custom-development'
      : 'release';
  const origin = exactOrigin(deploymentOrigin, trust, 'deploymentOrigin');
  if (trust === 'release' && new URL(origin).protocol !== 'https:') {
    throw new Error('deploymentOrigin must use https');
  }
  const wsUrl = new URL('/ws/agents', origin);
  wsUrl.protocol = new URL(origin).protocol === 'https:' ? 'wss:' : 'ws:';
  return parseEnvironmentProfile(
    {
      backendAgentWsUrl: trimTrailingSlash(wsUrl.toString()),
      backendHttpUrl: origin,
      environmentId: 'self-use',
      label: 'Self-use',
      namespace: 'self-use',
      webAgentUrl: new URL('/agent', origin).toString(),
      webOrigin: origin,
    },
    trust,
    0,
  );
}

function isLocalDevelopmentOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function resolveAgentEnvironmentDataPaths(
  paths: Pick<AgentDataPaths, 'rootDir'>,
  profile: Pick<AgentEnvironmentProfile, 'namespace'>,
): AgentEnvironmentDataPaths {
  const rootDir = join(paths.rootDir, 'environments', profile.namespace);
  return {
    rootDir,
    configPath: join(rootDir, 'config.json'),
    profilesDir: join(rootDir, 'browser-profiles'),
    runtimeDir: join(rootDir, 'runtime'),
    logsDir: join(rootDir, 'logs'),
  };
}

function parseCatalogInput(
  input: unknown,
  trust: AgentEnvironmentTrust,
): AgentEnvironmentProfile[] {
  const value = input as { readonly profiles?: readonly unknown[] };
  if (!value || !Array.isArray(value.profiles)) {
    throw new Error('Agent environment catalog must contain a profiles array');
  }
  return value.profiles.map((profile, index) =>
    parseEnvironmentProfile(profile, trust, index),
  );
}

function parseEnvironmentProfile(
  input: unknown,
  trust: AgentEnvironmentTrust,
  index: number,
): AgentEnvironmentProfile {
  if (!input || typeof input !== 'object') {
    throw new Error(`Agent environment profile ${index} must be an object`);
  }
  const value = input as Record<string, unknown>;
  const environmentId = normalizeEnvironmentId(value.environmentId);
  const label = requiredText(value.label, 'label');
  const namespace = requiredText(value.namespace, 'namespace');
  if (!NAMESPACE_PATTERN.test(namespace)) {
    throw new Error(
      `Agent environment "${environmentId}" has invalid namespace`,
    );
  }
  const webOrigin = exactOrigin(value.webOrigin, trust, 'webOrigin');
  const webAgentUrl = validatedUrl(value.webAgentUrl, trust, 'webAgentUrl');
  if (new URL(webAgentUrl).origin !== webOrigin) {
    throw new Error(
      `Agent environment "${environmentId}" Web console must use its exact Web origin`,
    );
  }
  const backendHttpUrl = validatedUrl(
    value.backendHttpUrl,
    trust,
    'backendHttpUrl',
  );
  const backendAgentWsUrl = validatedUrl(
    value.backendAgentWsUrl,
    trust,
    'backendAgentWsUrl',
  );
  const httpProtocol = new URL(backendHttpUrl).protocol;
  const wsProtocol = new URL(backendAgentWsUrl).protocol;
  if (
    httpProtocol !== 'https:' &&
    !isAllowedDevelopmentUrl(backendHttpUrl, trust)
  ) {
    throw new Error(
      `Agent environment "${environmentId}" backend must use HTTPS`,
    );
  }
  if (
    wsProtocol !== 'wss:' &&
    !isAllowedDevelopmentUrl(backendAgentWsUrl, trust)
  ) {
    throw new Error(
      `Agent environment "${environmentId}" Agent endpoint must use WSS`,
    );
  }
  return {
    backendAgentWsUrl: trimTrailingSlash(backendAgentWsUrl),
    backendHttpUrl: trimTrailingSlash(backendHttpUrl),
    environmentId,
    label,
    namespace,
    trust,
    webAgentUrl,
    webOrigin,
  };
}

function createLocalDevelopmentProfile(
  backendUrl = 'http://localhost:3000',
  webOrigin = 'http://localhost:5173',
): AgentEnvironmentProfile {
  const backend = trimTrailingSlash(backendUrl);
  const wsUrl = new URL('/ws/agents', backend);
  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return parseEnvironmentProfile(
    {
      backendAgentWsUrl: wsUrl.toString(),
      backendHttpUrl: backend,
      environmentId: 'local',
      label: 'Local development',
      namespace: 'local',
      webAgentUrl: new URL('/agent', webOrigin).toString(),
      webOrigin: new URL(webOrigin).origin,
    },
    'custom-development',
    0,
  );
}

function exactOrigin(
  input: unknown,
  trust: AgentEnvironmentTrust,
  field: string,
): string {
  const value = validatedUrl(input, trust, field);
  const url = new URL(value);
  if (value !== url.origin) {
    throw new Error(
      `${field} must be an exact origin without path, query, or hash`,
    );
  }
  return value;
}

function validatedUrl(
  input: unknown,
  trust: AgentEnvironmentTrust,
  field: string,
): string {
  const value = requiredText(input, field);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} must be a valid absolute URL`);
  }
  if (
    !['https:', 'wss:'].includes(url.protocol) &&
    !isAllowedDevelopmentUrl(value, trust)
  ) {
    throw new Error(`${field} must use a secure production protocol`);
  }
  return value;
}

function isAllowedDevelopmentUrl(
  value: string,
  trust: AgentEnvironmentTrust,
): boolean {
  if (trust !== 'custom-development') {
    return false;
  }
  const url = new URL(value);
  return (
    ['http:', 'ws:'].includes(url.protocol) &&
    ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  );
}

function normalizeEnvironmentId(input: unknown): string {
  const value = requiredText(input, 'environmentId');
  if (!ENVIRONMENT_ID_PATTERN.test(value)) {
    throw new Error(`Invalid Agent environment id "${value}"`);
  }
  return value;
}

function requiredText(input: unknown, field: string): string {
  if (typeof input !== 'string' || !normalizeText(input)) {
    throw new Error(`Agent environment ${field} is required`);
  }
  return input.trim();
}

function normalizeText(input: unknown): string | undefined {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined;
}

function assertUniqueCatalog(
  profiles: readonly AgentEnvironmentProfile[],
): void {
  const ids = new Set<string>();
  const namespaces = new Set<string>();
  for (const profile of profiles) {
    if (ids.has(profile.environmentId)) {
      throw new Error(
        `Duplicate Agent environment id "${profile.environmentId}"`,
      );
    }
    if (namespaces.has(profile.namespace)) {
      throw new Error(
        `Duplicate Agent environment namespace "${profile.namespace}"`,
      );
    }
    ids.add(profile.environmentId);
    namespaces.add(profile.namespace);
  }
}

function readJson(filePath: string): unknown {
  if (!existsSync(filePath)) {
    throw new Error(`Agent environment catalog does not exist: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readEnvironmentOverrides(filePath: string): {
  readonly deviceName?: string;
  readonly connectionEnabled?: boolean;
  readonly browserExecutablePath?: string;
} {
  if (!existsSync(filePath)) {
    return {};
  }
  const value = JSON.parse(readFileSync(filePath, 'utf8')) as Record<
    string,
    unknown
  >;
  return {
    browserExecutablePath:
      typeof value.browserExecutablePath === 'string'
        ? value.browserExecutablePath
        : undefined,
    connectionEnabled:
      typeof value.connectionEnabled === 'boolean'
        ? value.connectionEnabled
        : undefined,
    deviceName:
      typeof value.deviceName === 'string' ? value.deviceName : undefined,
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function atomicWriteJson(filePath: string, value: unknown): void {
  atomicWrite(filePath, `${JSON.stringify(value, null, 2)}\n`, 0o600);
}

function atomicWrite(filePath: string, value: string, mode: number): void {
  mkdirSync(dirname(filePath), { mode: 0o700, recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaryPath, value, { encoding: 'utf8', mode });
  try {
    renameSync(temporaryPath, filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (
      process.platform === 'win32' &&
      (code === 'EEXIST' || code === 'EPERM')
    ) {
      rmSync(filePath, { force: true });
      try {
        renameSync(temporaryPath, filePath);
      } catch (retryError) {
        rmSync(temporaryPath, { force: true });
        throw retryError;
      }
    } else {
      rmSync(temporaryPath, { force: true });
      throw error;
    }
  }
}
