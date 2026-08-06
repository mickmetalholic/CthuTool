import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir, hostname } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export type AgentBrowserRuntime = {
  readonly kind: 'host-chrome';
  readonly executablePath?: string;
};

export type AgentConnectionEnvironment = {
  readonly id: string;
  readonly label: string;
  readonly webOrigin?: string;
  readonly webAgentUrl?: string;
  readonly backendHttpUrl?: string;
  readonly backendAgentWsUrl?: string;
  readonly namespace?: string;
  readonly trust?: 'release' | 'custom-development';
};

export type AgentConnectionConfig = {
  readonly backendUrl: string;
  readonly agentWsUrl?: string;
  readonly agentId: string;
  readonly deviceName: string;
  readonly connectionEnabled: boolean;
  readonly activeEnvironment: AgentConnectionEnvironment;
};

export type AgentConfig = AgentConnectionConfig & {
  readonly browserRuntime: AgentBrowserRuntime;
};

export type AgentConfigStorage = {
  readonly read: () => Partial<AgentConfig> | undefined;
  readonly write: (config: AgentConfig) => void;
};

export type AgentConfigPort = {
  readonly load: () => AgentConfig;
};

export type AgentDataPaths = {
  readonly rootDir: string;
  readonly configPath: string;
  readonly profilesDir: string;
  readonly runtimeDir: string;
  readonly logsDir: string;
  readonly legacyDesktopUserDataDir: string;
};

export type AgentPathResolutionOptions = {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly homeDir?: string;
  readonly legacyDesktopUserDataDir?: string;
  readonly platform?: NodeJS.Platform;
  readonly rootDir?: string;
};

export const DEFAULT_AGENT_BACKEND_URL = 'http://localhost:3000';
export const DEFAULT_AGENT_BROWSER_RUNTIME: AgentBrowserRuntime = {
  kind: 'host-chrome',
};

export class JsonAgentConfigStorage implements AgentConfigStorage {
  constructor(private readonly filePath: string) {}

  read(): Partial<AgentConfig> | undefined {
    if (!existsSync(this.filePath)) {
      return undefined;
    }
    return JSON.parse(
      readFileSync(this.filePath, 'utf8'),
    ) as Partial<AgentConfig>;
  }

  write(config: AgentConfig): void {
    const parent = dirname(this.filePath);
    mkdirSync(parent, { mode: 0o700, recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    renameSync(temporaryPath, this.filePath);
  }
}

export class AgentConfigStore implements AgentConfigPort {
  constructor(
    private readonly storage: AgentConfigStorage,
    private readonly defaults: Partial<AgentConfig> = {},
  ) {}

  load(): AgentConfig {
    const raw = this.storage.read();
    const config = normalizeAgentConfig({ ...this.defaults, ...raw });
    if (!raw?.agentId || !raw.browserRuntime || !raw.activeEnvironment) {
      this.storage.write(config);
    }
    return config;
  }
}

export function normalizeAgentConfig(
  input: Partial<AgentConfig> | undefined,
): AgentConfig {
  const environmentId = normalizeText(input?.activeEnvironment?.id) ?? 'local';
  const environmentLabel =
    normalizeText(input?.activeEnvironment?.label) ?? 'Local';
  return {
    backendUrl: normalizeBackendUrl(input?.backendUrl),
    agentId: normalizeText(input?.agentId) ?? `agent-${randomUUID()}`,
    deviceName: normalizeText(input?.deviceName) ?? hostname(),
    connectionEnabled: input?.connectionEnabled ?? true,
    activeEnvironment: {
      id: environmentId,
      label: environmentLabel,
    },
    browserRuntime: normalizeBrowserRuntime(input?.browserRuntime),
  };
}

export function resolveAgentDataPaths(
  options: AgentPathResolutionOptions = {},
): AgentDataPaths {
  const platform = options.platform ?? process.platform;
  const environment = options.env ?? process.env;
  const userHome = resolve(options.homeDir ?? homedir());
  const rootDir = resolve(
    options.rootDir ?? defaultAgentRoot(platform, userHome, environment),
  );
  const legacyDesktopUserDataDir = resolve(
    options.legacyDesktopUserDataDir ??
      defaultLegacyDesktopRoot(platform, userHome, environment),
  );
  return {
    rootDir,
    configPath: join(rootDir, 'config.json'),
    profilesDir: join(rootDir, 'browser-profiles'),
    runtimeDir: join(rootDir, 'runtime'),
    logsDir: join(rootDir, 'logs'),
    legacyDesktopUserDataDir,
  };
}

function defaultAgentRoot(
  platform: NodeJS.Platform,
  userHome: string,
  environment: Readonly<Record<string, string | undefined>>,
): string {
  if (platform === 'darwin') {
    return join(userHome, 'Library', 'Application Support', 'CthuAgent');
  }
  if (platform === 'win32') {
    return join(
      environment.APPDATA ?? join(userHome, 'AppData', 'Roaming'),
      'CthuAgent',
    );
  }
  return join(
    environment.XDG_CONFIG_HOME ?? join(userHome, '.config'),
    'cthutool',
    'agent',
  );
}

function defaultLegacyDesktopRoot(
  platform: NodeJS.Platform,
  userHome: string,
  environment: Readonly<Record<string, string | undefined>>,
): string {
  if (platform === 'darwin') {
    return join(userHome, 'Library', 'Application Support', 'CthuDesktop');
  }
  if (platform === 'win32') {
    return join(
      environment.APPDATA ?? join(userHome, 'AppData', 'Roaming'),
      'CthuDesktop',
    );
  }
  return join(
    environment.XDG_CONFIG_HOME ?? join(userHome, '.config'),
    'CthuDesktop',
  );
}

function normalizeBackendUrl(input: string | undefined): string {
  const value = normalizeText(input) ?? DEFAULT_AGENT_BACKEND_URL;
  return value.replace(/\/+$/, '');
}

function normalizeBrowserRuntime(
  input: AgentBrowserRuntime | undefined,
): AgentBrowserRuntime {
  const executablePath = normalizeText(input?.executablePath);
  return executablePath
    ? { kind: 'host-chrome', executablePath }
    : DEFAULT_AGENT_BROWSER_RUNTIME;
}

function normalizeText(input: string | undefined): string | undefined {
  const value = input?.trim();
  return value ? value : undefined;
}
