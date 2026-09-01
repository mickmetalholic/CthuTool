export const AGENT_CLI_RESPONSE_SCHEMA_VERSION = 1 as const;

export type AgentEnvironmentView = {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
  readonly webOrigin: string;
  readonly backendHttpUrl: string;
};

export type AgentSetupStatus = {
  readonly required: boolean;
  readonly configured: boolean;
  readonly deploymentOrigin?: string;
  readonly remediation?: string;
  readonly migrationNotice?: string;
};

export type AgentLifecycleStatus = {
  readonly installed: boolean;
  readonly version?: string;
  readonly tray: { readonly state: string; readonly pid?: number };
  readonly setup: AgentSetupStatus;
  readonly environment?: AgentEnvironmentView;
  readonly endpoints?: {
    readonly webOrigin: string;
    readonly webAgentUrl: string;
    readonly backendHttpUrl: string;
    readonly backendAgentWsUrl: string;
  };
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
  install(): Promise<{ readonly version: string; readonly changed: boolean }>;
  update(): Promise<{
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
