import type { AgentConnectionState } from './agent-client';
import type { AgentBrowserRuntime } from './config';
import type { AgentControlServerPort } from './control-protocol';
import type { AgentEnvironmentSwitchPort } from './environment';
import type { AgentRuntimeLockSet } from './instance-lock';
import type {
  AgentBridgeLaunch,
  AgentLocalBridgeInfo,
  AgentLocalBridgePort,
} from './local-bridge';
import { createAgentObservabilityEvent } from './observability';
import type { AgentRuntimeCore } from './runtime-factory';
import {
  AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION,
  type AgentRuntimeProcessState,
} from './runtime-state';

export type AgentRuntimeHealth = {
  readonly applicationVersion: string;
  readonly protocolVersion: number;
  readonly process: {
    readonly state: AgentRuntimeProcessState;
    readonly startedAt?: string;
    readonly stateChangedAt: string;
  };
  readonly backend: Pick<
    AgentConnectionState,
    'status' | 'lastError' | 'lastHeartbeatAt' | 'lastRegisteredAt'
  >;
  readonly environment: {
    readonly id?: string;
    readonly label?: string;
  };
  readonly browser: {
    readonly ready: boolean;
    readonly status: 'pending' | 'ready' | 'unavailable';
    readonly message: string;
  };
  readonly bridge?: AgentLocalBridgeInfo;
};

export type AgentRuntimeServiceOptions = {
  readonly applicationVersion: string;
  readonly core: AgentRuntimeCore;
  readonly environment?: AgentEnvironmentSwitchPort;
  readonly invalidateBridgeTickets?: () => void | Promise<void>;
  readonly locks?: AgentRuntimeLockSet;
  readonly createControlServer?: (
    runtime: AgentRuntimeService,
  ) => AgentControlServerPort;
  readonly createLocalBridge?: (
    runtime: AgentRuntimeService,
  ) => AgentLocalBridgePort;
  readonly now?: () => Date;
  readonly onStateChange?: (health: AgentRuntimeHealth) => void;
};

export class AgentRuntimeService {
  private readonly now: () => Date;
  private state: AgentRuntimeProcessState = 'stopped';
  private stateChangedAt: string;
  private startedAt?: string;
  private startPromise?: Promise<void>;
  private stopPromise?: Promise<void>;
  private controlServer?: AgentControlServerPort;
  private localBridge?: AgentLocalBridgePort;
  private stopRequested = false;
  private environmentSwitchAwaitingConnection = false;

  constructor(private readonly options: AgentRuntimeServiceOptions) {
    this.now = options.now ?? (() => new Date());
    this.stateChangedAt = this.now().toISOString();
    options.core.agentClient.addStateChangeListener?.((connection) => {
      if (!this.environmentSwitchAwaitingConnection) {
        return;
      }
      if (connection.status === 'connected') {
        this.environmentSwitchAwaitingConnection = false;
        this.transition(
          this.options.core.playwrightHost.isReady() ? 'ready' : 'degraded',
        );
      } else if (connection.status === 'reconnecting') {
        this.transition('degraded');
      }
    });
  }

  async start(): Promise<void> {
    if (this.stopPromise) {
      await this.stopPromise;
    }
    if (this.state === 'ready' || this.state === 'degraded') {
      return;
    }
    if (this.startPromise) {
      return this.startPromise;
    }
    this.startPromise = this.startUnshared();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = undefined;
    }
  }

  async stop(): Promise<void> {
    if (this.state === 'stopped') {
      return;
    }
    if (this.stopPromise) {
      return this.stopPromise;
    }
    this.stopRequested = true;
    this.stopPromise = this.stopUnshared();
    try {
      await this.stopPromise;
    } finally {
      this.stopPromise = undefined;
    }
  }

  getHealth(): AgentRuntimeHealth {
    const connection = this.options.core.agentClient.getState();
    const browser = this.options.core.playwrightHost.getRuntimeDiagnostic();
    return {
      applicationVersion: this.options.applicationVersion,
      protocolVersion: AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION,
      process: {
        state: this.state,
        startedAt: this.startedAt,
        stateChangedAt: this.stateChangedAt,
      },
      backend: {
        status: connection.status,
        lastError: connection.lastError,
        lastHeartbeatAt: connection.lastHeartbeatAt,
        lastRegisteredAt: connection.lastRegisteredAt,
      },
      environment: {
        id: connection.environmentId,
        label: connection.environmentLabel,
      },
      browser: {
        ready: this.options.core.playwrightHost.isReady(),
        status: browser.status,
        message: browser.message,
      },
      bridge: this.localBridge?.getInfo(),
    };
  }

  async refreshConfig(browserRuntime: AgentBrowserRuntime): Promise<void> {
    this.options.core.playwrightHost.setBrowserRuntime(browserRuntime);
    await this.options.core.playwrightHost.initialize();
    this.options.core.agentClient.refreshConfig();
    if (this.state === 'ready' || this.state === 'degraded') {
      this.transition(
        this.options.core.playwrightHost.isReady() ? 'ready' : 'degraded',
      );
    }
  }

  async switchEnvironment(environmentId: string): Promise<void> {
    const environments = this.options.environment;
    if (!environments) {
      throw new Error('Agent environment switching is not configured');
    }
    const current = environments.getActiveProfile();
    if (current?.environmentId === environmentId) {
      return;
    }
    if (
      !environments
        .listProfiles()
        .some((profile) => profile.environmentId === environmentId)
    ) {
      throw new Error(`Unknown Agent environment "${environmentId}"`);
    }

    this.transition('switching');
    this.environmentSwitchAwaitingConnection = true;
    this.options.core.agentClient.stop();
    await this.options.core.playwrightHost.shutdown();
    this.localBridge?.invalidate();
    await this.options.invalidateBridgeTickets?.();
    const selected = environments.selectEnvironment(environmentId);
    this.options.core.profileStore.setRootDir(selected.paths.profilesDir);
    try {
      await this.options.core.playwrightHost.initialize();
      this.options.core.agentClient.refreshConfig();
      this.transition(
        this.options.core.playwrightHost.isReady() &&
          this.options.core.agentClient.getState().status === 'connected'
          ? 'ready'
          : 'degraded',
      );
    } catch (error) {
      this.options.core.agentClient.refreshConfig();
      this.recordFailure(error, 'ENVIRONMENT_SWITCH_TARGET_UNAVAILABLE');
      this.transition('degraded');
    }
  }

  issueBridgeLaunch(): AgentBridgeLaunch {
    if (!this.localBridge) {
      throw new Error('Agent local bridge is not available');
    }
    return this.localBridge.issueLaunch();
  }

  private async startUnshared(): Promise<void> {
    this.stopRequested = false;
    this.startedAt = this.now().toISOString();
    this.transition('starting');
    try {
      await this.options.locks?.acquire();
      this.localBridge = this.options.createLocalBridge?.(this);
      await this.localBridge?.start();
      this.controlServer = this.options.createControlServer?.(this);
      await this.controlServer?.start();
    } catch (error) {
      await this.controlServer?.stop().catch(() => undefined);
      this.controlServer = undefined;
      await this.localBridge?.stop().catch(() => undefined);
      this.localBridge = undefined;
      await this.options.locks?.release().catch(() => undefined);
      this.recordFailure(error, 'INSTANCE_LOCK_UNAVAILABLE');
      this.transition('stopped');
      throw error;
    }
    try {
      await this.options.core.playwrightHost.initialize();
      if (this.stopRequested) {
        return;
      }
      this.options.core.agentClient.start();
      this.transition(
        this.options.core.playwrightHost.isReady() ? 'ready' : 'degraded',
      );
    } catch (error) {
      if (this.stopRequested) {
        return;
      }
      this.options.core.agentClient.start();
      this.recordFailure(error);
      this.transition('degraded');
    }
  }

  private async stopUnshared(): Promise<void> {
    this.transition('stopping');
    this.options.core.agentClient.stop();
    await this.options.core.playwrightHost.shutdown();
    await this.controlServer?.stop();
    this.controlServer = undefined;
    await this.localBridge?.stop();
    this.localBridge = undefined;
    await this.options.locks?.release();
    this.transition('stopped');
  }

  private transition(state: AgentRuntimeProcessState): void {
    this.state = state;
    this.stateChangedAt = this.now().toISOString();
    this.options.core.observability.record(
      createAgentObservabilityEvent({
        details: { runtimeStatus: state },
        event: 'runtime.state_changed',
        message: `Agent runtime entered ${state}`,
        now: this.now,
      }),
    );
    this.options.onStateChange?.(this.getHealth());
  }

  private recordFailure(
    error: unknown,
    reasonCode = 'RUNTIME_INITIALIZATION_FAILED',
  ): void {
    this.options.core.observability.record(
      createAgentObservabilityEvent({
        details: {
          lastError:
            error instanceof Error
              ? error.message
              : 'Runtime initialization failed',
          outcome: 'unavailable',
          reasonCode,
        },
        event: 'browser.runtime_unavailable',
        level: 'warn',
        message: 'Agent runtime initialization degraded',
        now: this.now,
      }),
    );
  }
}
