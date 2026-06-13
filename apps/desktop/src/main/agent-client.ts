import type {
  AgentClientMessage,
  AgentHelloPayload,
  AgentPlatform,
  BrowserCommandPayload,
  BrowserErrorMessage,
  BrowserResultMessage,
} from '@cthutool/agent-protocol';
import { parseAgentServerMessageJson } from '@cthutool/agent-protocol';
import type { DesktopConfig } from './config';

type MinimalWebSocket = {
  readonly readyState: number;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: (() => void) | null;
  send: (data: string) => void;
  close: () => void;
};

export type WebSocketConstructor = new (url: string) => MinimalWebSocket;

type TimerApi = {
  readonly setTimeout: typeof setTimeout;
  readonly clearTimeout: typeof clearTimeout;
  readonly setInterval: typeof setInterval;
  readonly clearInterval: typeof clearInterval;
};

export type AgentConnectionStatus =
  | 'disabled'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export type AgentConnectionState = {
  readonly status: AgentConnectionStatus;
  readonly backendUrl: string;
  readonly agentId: string;
  readonly deviceName: string;
  readonly environmentLabel?: string;
  readonly lastError?: string;
  readonly lastRegisteredAt?: string;
};

export type AgentClientOptions = {
  readonly getConfig: () => DesktopConfig;
  readonly WebSocketImpl: WebSocketConstructor;
  readonly platform: AgentPlatform;
  readonly version: string;
  readonly timers?: TimerApi;
  readonly heartbeatIntervalMs?: number;
  readonly reconnectDelayMs?: number;
  readonly onStateChange?: (state: AgentConnectionState) => void;
  readonly onRegistered?: (state: AgentConnectionState) => void;
  readonly now?: () => Date;
  readonly getCapabilities?: () => readonly string[];
  readonly handleBrowserCommand?: (
    command: BrowserCommandPayload,
  ) => Promise<BrowserResultMessage | BrowserErrorMessage>;
};

export class AgentClient {
  private socket?: MinimalWebSocket;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private stopped = true;
  private state: AgentConnectionState;
  private readonly timers: TimerApi;
  private readonly heartbeatIntervalMs: number;
  private readonly reconnectDelayMs: number;
  private readonly now: () => Date;

  constructor(private readonly options: AgentClientOptions) {
    const config = options.getConfig();
    this.state = {
      status: config.connectionEnabled ? 'disconnected' : 'disabled',
      backendUrl: config.backendUrl,
      agentId: config.agentId,
      deviceName: config.deviceName,
      environmentLabel: config.activeEnvironment.label,
    };
    this.timers = options.timers ?? {
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    };
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 15_000;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 2_000;
    this.now = options.now ?? (() => new Date());
  }

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    this.socket?.close();
    this.socket = undefined;
    this.setState('disabled');
  }

  refreshConfig(): void {
    const config = this.options.getConfig();
    this.state = {
      ...this.state,
      backendUrl: config.backendUrl,
      agentId: config.agentId,
      deviceName: config.deviceName,
      environmentLabel: config.activeEnvironment.label,
    };
    if (!config.connectionEnabled) {
      this.stop();
      return;
    }
    if (this.stopped) {
      this.start();
      return;
    }
    this.socket?.close();
  }

  getState(): AgentConnectionState {
    return this.state;
  }

  buildHelloPayload(): AgentHelloPayload {
    const config = this.options.getConfig();
    return {
      agentId: config.agentId,
      deviceName: config.deviceName,
      platform: this.options.platform,
      version: this.options.version,
      capabilities: [...(this.options.getCapabilities?.() ?? [])],
    };
  }

  private connect(): void {
    const config = this.options.getConfig();
    if (!config.connectionEnabled) {
      this.setState('disabled');
      return;
    }

    this.clearTimers();
    this.setState(
      this.state.status === 'connected' ? 'connecting' : 'connecting',
    );
    const socket = new this.options.WebSocketImpl(
      toAgentWsUrl(config.backendUrl),
    );
    this.socket = socket;
    socket.onopen = () => {
      this.send({ type: 'agent.hello', payload: this.buildHelloPayload() });
    };
    socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    socket.onerror = () => {
      this.setState(this.state.status, 'WebSocket connection failed');
    };
    socket.onclose = () => {
      this.clearHeartbeat();
      this.socket = undefined;
      if (this.stopped) {
        return;
      }
      this.setState('reconnecting');
      this.reconnectTimer = this.timers.setTimeout(
        () => this.connect(),
        this.reconnectDelayMs,
      );
    };
  }

  private handleMessage(data: unknown): void {
    const parsed = parseAgentServerMessageJson(String(data));
    if (!parsed.ok) {
      this.setState(this.state.status, 'Backend sent an invalid message');
      return;
    }

    if (parsed.value.type === 'agent.registered') {
      this.setState('connected', undefined, this.now().toISOString());
      this.options.onRegistered?.(this.state);
      this.startHeartbeat();
      return;
    }

    if (parsed.value.type === 'agent.error') {
      this.setState(this.state.status, 'Backend rejected agent message');
      return;
    }

    if (parsed.value.type === 'browser.command') {
      void this.handleBrowserCommand(parsed.value.payload);
    }
  }

  private async handleBrowserCommand(
    command: BrowserCommandPayload,
  ): Promise<void> {
    if (!this.options.handleBrowserCommand) {
      this.send({
        type: 'browser.error',
        payload: {
          code: 'BROWSER_CAPABILITY_UNAVAILABLE',
          command: command.command,
          commandId: command.commandId,
          message: 'Browser capability is not available',
        },
      });
      return;
    }
    this.send(await this.options.handleBrowserCommand(command));
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = this.timers.setInterval(() => {
      this.send({
        type: 'agent.heartbeat',
        payload: {
          agentId: this.options.getConfig().agentId,
          sentAt: this.now().toISOString(),
        },
      });
    }, this.heartbeatIntervalMs);
  }

  private send(message: AgentClientMessage): void {
    this.socket?.send(JSON.stringify(message));
  }

  private setState(
    status: AgentConnectionStatus,
    lastError?: string,
    lastRegisteredAt?: string,
  ): void {
    const config = this.options.getConfig();
    this.state = {
      status,
      backendUrl: config.backendUrl,
      agentId: config.agentId,
      deviceName: config.deviceName,
      lastError,
      lastRegisteredAt: lastRegisteredAt ?? this.state.lastRegisteredAt,
    };
    this.options.onStateChange?.(this.state);
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      this.timers.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      this.timers.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

export function toAgentWsUrl(backendUrl: string): string {
  const url = new URL(backendUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/agents';
  url.search = '';
  url.hash = '';
  return url.toString();
}
