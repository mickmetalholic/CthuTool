import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentPaths } from './agent-paths';

export const SELF_USE_ENVIRONMENT_ID = 'self-use';
export const SELF_USE_NAMESPACE = 'self-use';
export const SELF_USE_LABEL = 'Self-use';
export const SETTINGS_REMEDIATION = 'Run: chc agent settings';

export type DerivedSelfUseEndpoints = {
  readonly webOrigin: string;
  readonly webAgentUrl: string;
  readonly backendHttpUrl: string;
  readonly backendAgentWsUrl: string;
  readonly environmentId: typeof SELF_USE_ENVIRONMENT_ID;
  readonly namespace: typeof SELF_USE_NAMESPACE;
  readonly label: typeof SELF_USE_LABEL;
};

export type SelfUseSetupSnapshot = {
  readonly configured: boolean;
  readonly setupRequired: boolean;
  readonly deploymentOrigin?: string;
  readonly endpoints?: DerivedSelfUseEndpoints;
  readonly deviceName?: string;
  readonly migrationNotice?: string;
  readonly preservedEnvironmentNamespaces: readonly string[];
};

export function resolveSelfUseConfigPath(paths: AgentPaths): string {
  return join(paths.userDataDir, 'config.json');
}

export function nativeSetupEntryPoint(
  target: 'darwin-arm64' | 'darwin-x64' | 'windows-x64',
): string {
  return target === 'windows-x64'
    ? 'bin/cthutool-agent-setup.exe'
    : 'bin/cthutool-agent-setup';
}

export function readSelfUseSetupSnapshot(
  paths: AgentPaths,
): SelfUseSetupSnapshot {
  const configPath = resolveSelfUseConfigPath(paths);
  const preserved = listEnvironmentNamespaces(paths.userDataDir);
  let deploymentOrigin: string | undefined;
  let deviceName: string | undefined;
  let migrationNotice: string | undefined;

  if (existsSync(configPath)) {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Record<
        string,
        unknown
      >;
      if (
        typeof raw.deploymentOrigin === 'string' &&
        raw.deploymentOrigin.trim()
      ) {
        try {
          deploymentOrigin = validateExactOrigin(raw.deploymentOrigin.trim());
        } catch {
          migrationNotice =
            'Saved deploymentOrigin is invalid; reconfigure in native Agent Settings.';
        }
      }
      if (typeof raw.deviceName === 'string' && raw.deviceName.trim()) {
        deviceName = raw.deviceName.trim();
      }
    } catch {
      migrationNotice =
        'Self-use configuration could not be read; open native Agent Settings.';
    }
  } else if (
    preserved.some((namespace) => namespace !== SELF_USE_NAMESPACE) ||
    preserved.length > 1
  ) {
    migrationNotice =
      'Multiple legacy environments were preserved; choose the deployment Origin in native Agent Settings.';
  } else if (preserved.length > 0) {
    migrationNotice =
      'Legacy Agent data was preserved; configure self-use in native Agent Settings.';
  }

  const endpoints = deploymentOrigin
    ? deriveSelfUseEndpoints(deploymentOrigin)
    : undefined;
  const configured = Boolean(deploymentOrigin);

  if (!configured && !migrationNotice) {
    migrationNotice = undefined;
  }

  return {
    configured,
    setupRequired: !configured,
    ...(deploymentOrigin ? { deploymentOrigin } : {}),
    ...(endpoints ? { endpoints } : {}),
    ...(deviceName ? { deviceName } : {}),
    ...(migrationNotice ? { migrationNotice } : {}),
    preservedEnvironmentNamespaces: preserved,
  };
}

export function deriveSelfUseEndpoints(
  deploymentOrigin: string,
): DerivedSelfUseEndpoints {
  const origin = validateExactOrigin(deploymentOrigin);
  const url = new URL(origin);
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return {
    webOrigin: origin,
    webAgentUrl: `${origin}/agent`,
    backendHttpUrl: origin,
    backendAgentWsUrl: `${wsProtocol}//${url.host}/ws/agents`,
    environmentId: SELF_USE_ENVIRONMENT_ID,
    namespace: SELF_USE_NAMESPACE,
    label: SELF_USE_LABEL,
  };
}

export function validateExactOrigin(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('deploymentOrigin must be a valid absolute URL');
  }
  if (input !== url.origin) {
    throw new Error(
      'deploymentOrigin must be an exact Origin without path, query, or hash',
    );
  }
  const localhost =
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '::1';
  if (url.protocol === 'https:') return input;
  if (url.protocol === 'http:' && localhost) return input;
  throw new Error('deploymentOrigin must use https');
}

function listEnvironmentNamespaces(userDataDir: string): string[] {
  const root = join(userDataDir, 'environments');
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
