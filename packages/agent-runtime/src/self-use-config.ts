import { randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join } from 'node:path';
import type {
  AgentBrowserRuntime,
  AgentConfig,
  AgentDataPaths,
} from './config';
import { DEFAULT_AGENT_BROWSER_RUNTIME } from './config';
import type {
  AgentEnvironmentCatalog,
  AgentEnvironmentProfile,
  AgentEnvironmentTrust,
} from './environment';
import { createSelfUseReleaseProfile } from './environment';

export const SELF_USE_CONFIG_SCHEMA_VERSION = 1;
export const SELF_USE_ENVIRONMENT_ID = 'self-use';
export const SELF_USE_NAMESPACE = 'self-use';
export const SELF_USE_LABEL = 'Self-use';

export type SelfUseConfig = {
  readonly schemaVersion: number;
  readonly agentId: string;
  readonly deploymentOrigin?: string;
  readonly deviceName: string;
  readonly connectionEnabled: boolean;
  readonly browserRuntime: AgentBrowserRuntime;
};

export type DerivedSelfUseEndpoints = {
  readonly webOrigin: string;
  readonly webAgentUrl: string;
  readonly backendHttpUrl: string;
  readonly backendAgentWsUrl: string;
  readonly environmentId: typeof SELF_USE_ENVIRONMENT_ID;
  readonly namespace: typeof SELF_USE_NAMESPACE;
  readonly label: typeof SELF_USE_LABEL;
  readonly trust: AgentEnvironmentTrust;
};

export type SelfUseSetupState = {
  readonly configured: boolean;
  readonly setupRequired: boolean;
  readonly deploymentOrigin?: string;
  readonly endpoints?: DerivedSelfUseEndpoints;
  readonly deviceName: string;
  readonly connectionEnabled: boolean;
  readonly agentId: string;
  readonly browserExecutablePath?: string;
  readonly migrationNotice?: string;
};

export type SelfUseCandidateConfig = {
  readonly deploymentOrigin: string;
  readonly deviceName?: string;
  readonly connectionEnabled?: boolean;
  readonly browserExecutablePath?: string;
};

export type SelfUseMigrationResult = {
  readonly config: SelfUseConfig;
  readonly migrated: boolean;
  readonly notice?: string;
  readonly preservedEnvironmentNamespaces: readonly string[];
};

export type SelfUseOriginValidationOptions = {
  readonly allowDevelopmentLocalhost?: boolean;
};

export class SelfUseConfigError extends Error {
  readonly category:
    | 'invalid-origin'
    | 'schema'
    | 'persistence'
    | 'not-configured';

  constructor(category: SelfUseConfigError['category'], message: string) {
    super(message);
    this.name = 'SelfUseConfigError';
    this.category = category;
  }
}

export function validateDeploymentOrigin(
  input: unknown,
  options: SelfUseOriginValidationOptions = {},
): string {
  if (typeof input !== 'string' || !input.trim()) {
    throw new SelfUseConfigError(
      'invalid-origin',
      'deploymentOrigin must be a non-empty exact Origin',
    );
  }
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SelfUseConfigError(
      'invalid-origin',
      'deploymentOrigin must be a valid absolute URL',
    );
  }
  if (value !== url.origin) {
    throw new SelfUseConfigError(
      'invalid-origin',
      'deploymentOrigin must be an exact Origin without path, query, or hash',
    );
  }
  const allowLocalhost =
    options.allowDevelopmentLocalhost === true &&
    isLocalhostHostname(url.hostname);
  if (url.protocol === 'https:') {
    return value;
  }
  if (allowLocalhost && url.protocol === 'http:') {
    return value;
  }
  throw new SelfUseConfigError(
    'invalid-origin',
    allowLocalhost
      ? 'deploymentOrigin must use https or http://localhost'
      : 'deploymentOrigin must use https',
  );
}

export function deriveSelfUseEndpoints(
  deploymentOrigin: string,
  options: SelfUseOriginValidationOptions = {},
): DerivedSelfUseEndpoints {
  const profile = createSelfUseProfile(deploymentOrigin, options);
  return {
    backendAgentWsUrl: profile.backendAgentWsUrl,
    backendHttpUrl: profile.backendHttpUrl,
    environmentId: SELF_USE_ENVIRONMENT_ID,
    label: SELF_USE_LABEL,
    namespace: SELF_USE_NAMESPACE,
    trust: profile.trust,
    webAgentUrl: profile.webAgentUrl,
    webOrigin: profile.webOrigin,
  };
}

export function createSelfUseProfile(
  deploymentOrigin: string,
  options: SelfUseOriginValidationOptions = {},
): AgentEnvironmentProfile {
  return createSelfUseReleaseProfile(
    deploymentOrigin,
    options.allowDevelopmentLocalhost === true,
  );
}

export function createSelfUseCatalog(
  deploymentOrigin: string,
  options: SelfUseOriginValidationOptions = {},
): AgentEnvironmentCatalog {
  return {
    version: 1,
    profiles: [createSelfUseProfile(deploymentOrigin, options)],
  };
}

export function normalizeSelfUseConfig(
  input: Partial<SelfUseConfig> | undefined,
  options: SelfUseOriginValidationOptions = {},
): SelfUseConfig {
  const deploymentOrigin = normalizeOptionalOrigin(
    input?.deploymentOrigin,
    options,
  );
  return {
    agentId: normalizeText(input?.agentId) ?? `agent-${randomUUID()}`,
    browserRuntime: normalizeBrowserRuntime(input?.browserRuntime),
    connectionEnabled: input?.connectionEnabled ?? true,
    deploymentOrigin,
    deviceName: normalizeText(input?.deviceName) ?? hostname(),
    schemaVersion: SELF_USE_CONFIG_SCHEMA_VERSION,
  };
}

export function readSelfUseConfig(
  paths: Pick<AgentDataPaths, 'configPath'>,
  options: SelfUseOriginValidationOptions = {},
): SelfUseConfig | undefined {
  if (!existsSync(paths.configPath)) {
    return undefined;
  }
  try {
    const raw = JSON.parse(readFileSync(paths.configPath, 'utf8')) as Record<
      string,
      unknown
    >;
    if (isSelfUseSchema(raw)) {
      return normalizeSelfUseConfig(raw as Partial<SelfUseConfig>, options);
    }
  } catch {
    // Native setup must be able to recover from a malformed or partial file.
  }
  return undefined;
}

export function writeSelfUseConfig(
  paths: Pick<AgentDataPaths, 'configPath'>,
  config: SelfUseConfig,
  options: SelfUseOriginValidationOptions = {},
): SelfUseConfig {
  const normalized = normalizeSelfUseConfig(config, options);
  atomicWriteJson(
    paths.configPath,
    redactSelfUseConfigForPersistence(normalized),
  );
  return normalized;
}

export function redactSelfUseConfigForPersistence(
  config: SelfUseConfig,
): Record<string, unknown> {
  return {
    agentId: config.agentId,
    browserRuntime: config.browserRuntime,
    connectionEnabled: config.connectionEnabled,
    ...(config.deploymentOrigin
      ? { deploymentOrigin: config.deploymentOrigin }
      : {}),
    deviceName: config.deviceName,
    schemaVersion: SELF_USE_CONFIG_SCHEMA_VERSION,
  };
}

export function redactSelfUseConfigForLog(
  config: SelfUseConfig,
): Record<string, unknown> {
  return redactSelfUseConfigForPersistence(config);
}

export function isSelfUseConfigured(
  config: SelfUseConfig,
  options: SelfUseOriginValidationOptions = {},
): boolean {
  if (!config.deploymentOrigin) {
    return false;
  }
  try {
    validateDeploymentOrigin(config.deploymentOrigin, options);
  } catch {
    return false;
  }
  return true;
}

export function getSelfUseSetupState(
  paths: AgentDataPaths,
  options: SelfUseOriginValidationOptions = {},
): SelfUseSetupState {
  const migration = migrateToSelfUseConfig(paths, options);
  const config = migration.config;
  const configured = isSelfUseConfigured(config, options);
  const endpoints = config.deploymentOrigin
    ? safeDeriveEndpoints(config.deploymentOrigin, options)
    : undefined;
  return {
    agentId: config.agentId,
    browserExecutablePath: config.browserRuntime.executablePath,
    configured,
    connectionEnabled: config.connectionEnabled,
    deploymentOrigin: config.deploymentOrigin,
    deviceName: config.deviceName,
    endpoints,
    migrationNotice: migration.notice,
    setupRequired: !configured,
  };
}

export function applySelfUseCandidate(
  paths: AgentDataPaths,
  candidate: SelfUseCandidateConfig,
  options: SelfUseOriginValidationOptions = {},
): {
  readonly config: SelfUseConfig;
  readonly endpoints: DerivedSelfUseEndpoints;
  readonly profile: AgentEnvironmentProfile;
} {
  const previousConfig =
    readSelfUseConfig(paths, options) ??
    normalizeSelfUseConfig(undefined, options);
  const origin = validateDeploymentOrigin(candidate.deploymentOrigin, options);
  const endpoints = deriveSelfUseEndpoints(origin, options);
  const nextConfig = normalizeSelfUseConfig(
    {
      ...previousConfig,
      browserRuntime:
        candidate.browserExecutablePath === undefined
          ? previousConfig.browserRuntime
          : candidate.browserExecutablePath.trim()
            ? {
                kind: 'host-chrome',
                executablePath: candidate.browserExecutablePath.trim(),
              }
            : DEFAULT_AGENT_BROWSER_RUNTIME,
      connectionEnabled:
        candidate.connectionEnabled ?? previousConfig.connectionEnabled,
      deploymentOrigin: origin,
      deviceName: candidate.deviceName ?? previousConfig.deviceName,
    },
    options,
  );

  try {
    writeSelfUseConfig(paths, nextConfig, options);
    writeSelfUseSelection(paths);
    return {
      config: nextConfig,
      endpoints,
      profile: createSelfUseProfile(origin, options),
    };
  } catch (error) {
    restoreKnownGood(paths, previousConfig, options);
    throw error;
  }
}

export function migrateToSelfUseConfig(
  paths: AgentDataPaths,
  options: SelfUseOriginValidationOptions = {},
): SelfUseMigrationResult {
  const existing = readSelfUseConfig(paths, options);
  const namespaces = listEnvironmentNamespaces(paths.rootDir);
  const legacyNamespaces = namespaces.filter(
    (namespace) => namespace !== SELF_USE_NAMESPACE,
  );
  if (existing?.deploymentOrigin) {
    const merged = mergeSingleLegacyEnvironment(paths, legacyNamespaces);
    return {
      config: existing,
      migrated: merged,
      ...(merged
        ? {
            notice:
              'Migrated the unambiguous legacy environment data into self-use; the original namespace was preserved.',
          }
        : {}),
      preservedEnvironmentNamespaces: namespaces,
    };
  }

  const legacy = readLegacyConfig(paths.configPath);
  const selection = readLegacySelection(paths.rootDir);
  const catalogOrigins = readLegacyCatalogOrigins(paths.rootDir);

  if (existing && !existing.deploymentOrigin && namespaces.length === 0) {
    return {
      config: existing,
      migrated: false,
      preservedEnvironmentNamespaces: namespaces,
    };
  }

  if (
    selection.activeEnvironmentId &&
    namespaces.length === 1 &&
    namespaces[0] === selection.activeEnvironmentId
  ) {
    const origin =
      catalogOrigins.get(selection.activeEnvironmentId) ??
      catalogOrigins.get(namespaces[0]);
    const envOverrides = readEnvironmentOverrides(
      join(paths.rootDir, 'environments', namespaces[0], 'config.json'),
    );
    const migrated = normalizeSelfUseConfig(
      {
        agentId: legacy?.agentId ?? existing?.agentId,
        browserRuntime:
          envOverrides.browserExecutablePath || legacy?.browserRuntime
            ? {
                kind: 'host-chrome',
                ...(envOverrides.browserExecutablePath
                  ? { executablePath: envOverrides.browserExecutablePath }
                  : legacy?.browserRuntime?.executablePath
                    ? {
                        executablePath: legacy.browserRuntime.executablePath,
                      }
                    : {}),
              }
            : existing?.browserRuntime,
        connectionEnabled:
          envOverrides.connectionEnabled ??
          legacy?.connectionEnabled ??
          existing?.connectionEnabled,
        deploymentOrigin: origin,
        deviceName:
          envOverrides.deviceName ?? legacy?.deviceName ?? existing?.deviceName,
      },
      options,
    );
    writeSelfUseConfig(paths, migrated, options);
    writeSelfUseSelection(paths);
    mergeSingleLegacyEnvironment(paths, [namespaces[0]]);
    return {
      config: migrated,
      migrated: true,
      notice: origin
        ? undefined
        : 'Migrated single-environment installation; set deploymentOrigin in Agent Settings if missing.',
      preservedEnvironmentNamespaces: namespaces,
    };
  }

  if (
    namespaces.length > 1 ||
    (catalogOrigins.size > 1 && !selection.activeEnvironmentId)
  ) {
    const base = normalizeSelfUseConfig(
      {
        agentId: legacy?.agentId ?? existing?.agentId,
        browserRuntime: legacy?.browserRuntime ?? existing?.browserRuntime,
        connectionEnabled:
          legacy?.connectionEnabled ?? existing?.connectionEnabled,
        deviceName: legacy?.deviceName ?? existing?.deviceName,
      },
      options,
    );
    if (!existing) {
      writeSelfUseConfig(paths, base, options);
    }
    return {
      config: existing ?? base,
      migrated: false,
      notice:
        'Multiple environment profiles were preserved. Configure a single self-use deployment Origin in Agent Settings; existing profiles, logs, and secrets were not deleted.',
      preservedEnvironmentNamespaces: namespaces,
    };
  }

  if (legacy && !existing) {
    const fromLegacyOrigin =
      typeof legacy.activeEnvironment?.webOrigin === 'string'
        ? legacy.activeEnvironment.webOrigin
        : undefined;
    const migrated = normalizeSelfUseConfig(
      {
        agentId: legacy.agentId,
        browserRuntime: legacy.browserRuntime,
        connectionEnabled: legacy.connectionEnabled,
        deploymentOrigin: fromLegacyOrigin,
        deviceName: legacy.deviceName,
      },
      options,
    );
    writeSelfUseConfig(paths, migrated, options);
    if (migrated.deploymentOrigin) {
      writeSelfUseSelection(paths);
    }
    return {
      config: migrated,
      migrated: true,
      preservedEnvironmentNamespaces: namespaces,
    };
  }

  const fresh =
    existing ??
    normalizeSelfUseConfig(
      {
        agentId: legacy?.agentId,
        browserRuntime: legacy?.browserRuntime,
        connectionEnabled: legacy?.connectionEnabled,
        deviceName: legacy?.deviceName,
      },
      options,
    );
  if (!existing) {
    writeSelfUseConfig(paths, fresh, options);
  }
  return {
    config: fresh,
    migrated: Boolean(legacy) && !existing,
    preservedEnvironmentNamespaces: namespaces,
  };
}

export function toAgentConfigFromSelfUse(
  config: SelfUseConfig,
  options: SelfUseOriginValidationOptions = {},
): AgentConfig {
  if (!config.deploymentOrigin) {
    return {
      activeEnvironment: {
        id: SELF_USE_ENVIRONMENT_ID,
        label: SELF_USE_LABEL,
        namespace: SELF_USE_NAMESPACE,
        trust: 'release',
      },
      agentId: config.agentId,
      backendUrl: 'http://localhost:3000',
      browserRuntime: config.browserRuntime,
      connectionEnabled: false,
      deviceName: config.deviceName,
    };
  }
  const profile = createSelfUseProfile(config.deploymentOrigin, options);
  return {
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
    agentId: config.agentId,
    agentWsUrl: profile.backendAgentWsUrl,
    backendUrl: profile.backendHttpUrl,
    browserRuntime: config.browserRuntime,
    connectionEnabled: config.connectionEnabled,
    deviceName: config.deviceName,
  };
}

function writeSelfUseSelection(paths: Pick<AgentDataPaths, 'rootDir'>): void {
  atomicWriteJson(join(paths.rootDir, 'environment.json'), {
    activeEnvironmentId: SELF_USE_ENVIRONMENT_ID,
  });
}

function restoreKnownGood(
  paths: AgentDataPaths,
  previousConfig: SelfUseConfig,
  options: SelfUseOriginValidationOptions,
): void {
  try {
    writeSelfUseConfig(paths, previousConfig, options);
  } catch {
    // Best-effort restoration; original error is rethrown by caller.
  }
}

function mergeSingleLegacyEnvironment(
  paths: Pick<AgentDataPaths, 'rootDir'>,
  legacyNamespaces: readonly string[],
): boolean {
  const [namespace] = legacyNamespaces;
  if (!namespace) {
    return false;
  }
  const sourceRoot = join(
    paths.rootDir,
    'environments',
    namespace,
    'browser-profiles',
  );
  const targetRoot = join(
    paths.rootDir,
    'environments',
    SELF_USE_NAMESPACE,
    'browser-profiles',
  );
  if (!existsSync(sourceRoot)) {
    return false;
  }
  return mergeDirectoryEntries(sourceRoot, targetRoot);
}

function mergeDirectoryEntries(
  sourceRoot: string,
  targetRoot: string,
): boolean {
  let copied = false;
  mkdirSync(targetRoot, { mode: 0o700, recursive: true });
  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = join(sourceRoot, entry.name);
    const target = join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      if (existsSync(target) && !statSync(target).isDirectory()) {
        continue;
      }
      copied = mergeDirectoryEntries(source, target) || copied;
    } else if (
      entry.isFile() &&
      entry.name !== '.cthutool-agent.lock' &&
      !existsSync(target)
    ) {
      copyFileSync(source, target);
      copied = true;
    }
  }
  return copied;
}

function safeDeriveEndpoints(
  origin: string,
  options: SelfUseOriginValidationOptions,
): DerivedSelfUseEndpoints | undefined {
  try {
    return deriveSelfUseEndpoints(origin, options);
  } catch {
    return undefined;
  }
}

function normalizeOptionalOrigin(
  input: string | undefined,
  options: SelfUseOriginValidationOptions,
): string | undefined {
  const value = normalizeText(input);
  if (!value) {
    return undefined;
  }
  return validateDeploymentOrigin(value, options);
}

function isSelfUseSchema(raw: Record<string, unknown>): boolean {
  return typeof raw.schemaVersion === 'number';
}

function readLegacyConfig(
  configPath: string,
): Partial<AgentConfig> | undefined {
  if (!existsSync(configPath)) {
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as Partial<AgentConfig>;
  } catch {
    return undefined;
  }
}

function readLegacySelection(rootDir: string): {
  readonly activeEnvironmentId?: string;
} {
  const selectionPath = join(rootDir, 'environment.json');
  if (!existsSync(selectionPath)) {
    return {};
  }
  try {
    const value = JSON.parse(readFileSync(selectionPath, 'utf8')) as {
      readonly activeEnvironmentId?: unknown;
    };
    return {
      activeEnvironmentId: normalizeText(value.activeEnvironmentId),
    };
  } catch {
    return {};
  }
}

function readLegacyCatalogOrigins(rootDir: string): Map<string, string> {
  const origins = new Map<string, string>();
  const catalogPath = join(rootDir, 'environments.json');
  if (!existsSync(catalogPath)) {
    return origins;
  }
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as {
      readonly profiles?: readonly {
        readonly environmentId?: unknown;
        readonly webOrigin?: unknown;
        readonly namespace?: unknown;
      }[];
    };
    for (const profile of catalog.profiles ?? []) {
      const id = normalizeText(profile.environmentId);
      const origin = normalizeText(profile.webOrigin);
      if (id && origin) {
        origins.set(id, origin);
        const namespace = normalizeText(profile.namespace);
        if (namespace) {
          origins.set(namespace, origin);
        }
      }
    }
  } catch {
    return origins;
  }
  return origins;
}

function listEnvironmentNamespaces(rootDir: string): string[] {
  const environmentsDir = join(rootDir, 'environments');
  if (!existsSync(environmentsDir)) {
    return [];
  }
  try {
    return readdirSync(environmentsDir).filter((entry) => {
      try {
        return statSync(join(environmentsDir, entry)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function readEnvironmentOverrides(filePath: string): {
  readonly deviceName?: string;
  readonly connectionEnabled?: boolean;
  readonly browserExecutablePath?: string;
} {
  if (!existsSync(filePath)) {
    return {};
  }
  try {
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
  } catch {
    return {};
  }
}

function normalizeBrowserRuntime(
  input: AgentBrowserRuntime | undefined,
): AgentBrowserRuntime {
  const executablePath = normalizeText(input?.executablePath);
  return executablePath
    ? { kind: 'host-chrome', executablePath }
    : DEFAULT_AGENT_BROWSER_RUNTIME;
}

function normalizeText(input: unknown): string | undefined {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined;
}

function isLocalhostHostname(hostnameValue: string): boolean {
  return ['localhost', '127.0.0.1', '::1'].includes(hostnameValue);
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
