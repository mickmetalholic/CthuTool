export const AGENT_CLI_RESPONSE_SCHEMA_VERSION = 1 as const;

export type AgentEnvironmentView = {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
  readonly webOrigin: string;
  readonly backendHttpUrl: string;
  readonly secretConfigured: boolean;
};

export type AgentLifecycleStatus = {
  readonly installed: boolean;
  readonly version?: string;
  readonly tray: { readonly state: string; readonly pid?: number };
  readonly environment?: AgentEnvironmentView;
  readonly backend: { readonly status: string; readonly lastError?: string };
  readonly browser: { readonly ready: boolean; readonly status: string };
  readonly autostart: {
    readonly enabled: boolean;
    readonly supported: boolean;
  };
};

export type AgentDoctorCheck = {
  readonly id: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly message: string;
};

export interface AgentLifecycleService {
  install(input?: {
    readonly channel?: 'stable' | 'beta';
    readonly version?: string;
  }): Promise<{ readonly version: string; readonly changed: boolean }>;
  update(input?: { readonly channel?: 'stable' | 'beta' }): Promise<{
    readonly version: string;
    readonly previousVersion?: string;
    readonly changed: boolean;
  }>;
  start(): Promise<'started' | 'already-running'>;
  stop(): Promise<'stopped' | 'already-stopped'>;
  restart(): Promise<'restarted'>;
  status(): Promise<AgentLifecycleStatus>;
  settings(): Promise<'opened'>;
  logs(input?: {
    readonly lines?: number;
    readonly follow?: boolean;
  }): Promise<readonly string[]>;
  listEnvironments(): Promise<readonly AgentEnvironmentView[]>;
  getEnvironment(id?: string): Promise<AgentEnvironmentView>;
  setEnvironment(
    id: string,
  ): Promise<{ readonly id: string; readonly changed: boolean }>;
  setEnvironmentSecret(
    id: string,
    secret: string,
  ): Promise<{ readonly id: string; readonly configured: true }>;
  autostart(
    action: 'enable' | 'disable' | 'status',
  ): Promise<{ readonly enabled: boolean; readonly supported: boolean }>;
  doctor(): Promise<readonly AgentDoctorCheck[]>;
  uninstall(input?: {
    readonly purge?: boolean;
    readonly confirmed?: boolean;
  }): Promise<{
    readonly removed: boolean;
    readonly purged: boolean;
    readonly preservedDataDir?: string;
  }>;
}
