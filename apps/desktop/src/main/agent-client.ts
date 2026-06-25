import type {
  AgentClientMessage,
  AgentHelloPayload,
  AgentPlatform,
} from '@cthutool/agent-protocol';
import {
  createJsonRpcErrorResponse,
  JSON_RPC_INVALID_PARAMS,
  JSON_RPC_METHOD_NOT_FOUND,
  parseAgentServerMessageJson,
} from '@cthutool/agent-protocol';
import type {
  BrowserRuntimeRequest,
  BrowserRuntimeResponse,
} from '@cthutool/browser-runtime-protocol';
import { validateBrowserRuntimeRequest } from '@cthutool/browser-runtime-protocol';
import type { DesktopConfig } from './config';
import {
  createDesktopObservabilityEvent,
  type DesktopObservabilityEvent,
  type DesktopObservabilityEventName,
  type DesktopObservabilityLevel,
  type DesktopObservabilitySink,
  observabilityDetailsFromMetadata,
} from './observability';

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
  readonly lastDiagnostic?: AgentConnectionDiagnostic;
  readonly lastError?: string;
  readonly lastHeartbeatAt?: string;
  readonly lastRegisteredAt?: string;
  readonly lastStateChangedAt?: string;
};

export type AgentConnectionDiagnostic = Pick<
  DesktopObservabilityEvent,
  'event' | 'level' | 'message' | 'timestamp'
>;

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
  readonly observability?: DesktopObservabilitySink;
  readonly now?: () => Date;
  readonly getCapabilities?: () => readonly string[];
  readonly handleBrowserRequest?: (
    request: BrowserRuntimeRequest,
  ) => Promise<BrowserRuntimeResponse>;
};

export class AgentClient {
  private socket?: MinimalWebSocket;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private stopped = true;
  private state: AgentConnectionState;
  private lastDiagnostic?: AgentConnectionDiagnostic;
  private lastHeartbeatAt?: string;
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
    this.recordObservability({
      event: 'agent.start',
      message: 'Desktop agent client started',
    });
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.recordObservability({
      event: 'agent.stop',
      message: 'Desktop agent client stopped',
    });
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
    this.recordObservability({
      details: {
        connectionStatus: 'connecting',
      },
      event: 'agent.connecting',
      message: 'Connecting to backend agent websocket',
    });
    this.setState(
      this.state.status === 'connected' ? 'connecting' : 'connecting',
    );
    const socket = new this.options.WebSocketImpl(
      toAgentWsUrl(config.backendUrl),
    );
    this.socket = socket;
    socket.onopen = () => {
      this.recordObservability({
        details: { connectionStatus: 'connected' },
        event: 'agent.socket_open',
        message: 'Backend agent websocket opened',
      });
      this.send({ type: 'agent.hello', payload: this.buildHelloPayload() });
    };
    socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    socket.onerror = () => {
      this.recordObservability({
        details: {
          connectionStatus: this.state.status,
          reasonCode: 'WEBSOCKET_ERROR',
        },
        event: 'agent.socket_error',
        level: 'warn',
        message: 'WebSocket connection failed',
      });
      this.setState(this.state.status, 'WebSocket connection failed');
    };
    socket.onclose = () => {
      this.clearHeartbeat();
      this.socket = undefined;
      if (this.stopped) {
        return;
      }
      this.recordObservability({
        details: { connectionStatus: 'reconnecting' },
        event: 'agent.reconnecting',
        level: 'warn',
        message: 'Backend agent websocket closed; reconnect scheduled',
      });
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
      this.recordObservability({
        details: { reasonCode: 'INVALID_BACKEND_MESSAGE' },
        event: 'agent.invalid_message',
        level: 'warn',
        message: 'Backend sent an invalid message',
      });
      this.setState(this.state.status, 'Backend sent an invalid message');
      return;
    }

    if (!('type' in parsed.value)) {
      this.recordObservability({
        details: {
          commandId: String(parsed.value.id),
          operation: parsed.value.method,
          ...observabilityDetailsFromMetadata(parsed.value.observability),
        },
        event: 'browser.command_received',
        message: 'Received browser runtime request from backend',
      });
      void this.handleJsonRpcRequest(parsed.value);
      return;
    }

    if (parsed.value.type === 'agent.registered') {
      this.recordObservability({
        details: {
          connectionStatus: 'connected',
          ...observabilityDetailsFromMetadata(
            parsed.value.payload.observability,
          ),
        },
        event: 'agent.registered',
        message: 'Backend accepted desktop agent registration',
      });
      this.setState('connected', undefined, this.now().toISOString());
      this.options.onRegistered?.(this.state);
      this.startHeartbeat();
      return;
    }

    if (parsed.value.type === 'agent.error') {
      this.recordObservability({
        details: {
          reasonCode: parsed.value.payload.code,
          ...observabilityDetailsFromMetadata(
            parsed.value.payload.observability,
          ),
        },
        event: 'agent.backend_rejected',
        level: 'warn',
        message: 'Backend rejected agent message',
      });
      this.setState(this.state.status, 'Backend rejected agent message');
      return;
    }
  }

  private async handleJsonRpcRequest(request: unknown): Promise<void> {
    const parsed = validateBrowserRuntimeRequest(request);
    if (!parsed.ok) {
      const id =
        typeof request === 'object' &&
        request !== null &&
        'id' in request &&
        (typeof request.id === 'string' || typeof request.id === 'number')
          ? request.id
          : 'unknown';
      this.recordObservability({
        details: {
          commandId: String(id),
          outcome: 'invalid',
          reasonCode: 'INVALID_BROWSER_RUNTIME_REQUEST',
        },
        event: 'browser.command_failed',
        level: 'warn',
        message: 'Browser runtime request is invalid',
      });
      this.send(
        createJsonRpcErrorResponse(id, {
          code: JSON_RPC_INVALID_PARAMS,
          message: parsed.message,
        }),
      );
      return;
    }

    if (!this.options.handleBrowserRequest) {
      this.recordObservability({
        details: {
          command: parsed.value.method,
          commandId: String(parsed.value.id),
          outcome: 'unavailable',
          reasonCode: 'BROWSER_CAPABILITY_UNAVAILABLE',
          ...observabilityDetailsFromMetadata(parsed.value.observability),
        },
        event: 'browser.command_failed',
        level: 'warn',
        message: 'Browser capability is not available',
      });
      this.send(
        createJsonRpcErrorResponse(
          parsed.value.id,
          {
            code: JSON_RPC_METHOD_NOT_FOUND,
            message: 'Browser capability is not available',
            data: {
              code: 'BROWSER_CAPABILITY_UNAVAILABLE',
            },
          },
          parsed.value.observability,
        ),
      );
      return;
    }
    this.send(await this.options.handleBrowserRequest(parsed.value));
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = this.timers.setInterval(() => {
      const sentAt = this.now().toISOString();
      this.send({
        type: 'agent.heartbeat',
        payload: {
          agentId: this.options.getConfig().agentId,
          sentAt,
        },
      });
      this.lastHeartbeatAt = sentAt;
      this.recordObservability({
        details: { connectionStatus: 'connected' },
        event: 'agent.heartbeat',
        message: 'Agent heartbeat sent',
      });
      this.options.onStateChange?.({
        ...this.state,
        lastDiagnostic: this.lastDiagnostic,
        lastHeartbeatAt: this.lastHeartbeatAt,
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
      lastDiagnostic: this.lastDiagnostic,
      lastHeartbeatAt: this.lastHeartbeatAt,
      lastRegisteredAt: lastRegisteredAt ?? this.state.lastRegisteredAt,
      lastStateChangedAt: this.now().toISOString(),
    };
    this.options.onStateChange?.(this.state);
  }

  private recordObservability(input: {
    readonly details?: Parameters<
      typeof createDesktopObservabilityEvent
    >[0]['details'];
    readonly event: DesktopObservabilityEventName;
    readonly level?: DesktopObservabilityLevel;
    readonly message: string;
  }): void {
    const config = this.options.getConfig();
    const event = createDesktopObservabilityEvent({
      details: {
        agentId: config.agentId,
        backendUrl: config.backendUrl,
        ...input.details,
      },
      event: input.event,
      level: input.level,
      message: input.message,
      now: this.now,
    });
    this.lastDiagnostic = {
      event: event.event,
      level: event.level,
      message: event.message,
      timestamp: event.timestamp,
    };
    this.options.observability?.record(event);
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
