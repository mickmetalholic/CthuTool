import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { parse as parseUrl } from 'node:url';
import {
  type AgentClientMessage,
  type BrowserCommandPayload,
  type BrowserErrorMessage,
  type BrowserResultMessage,
  createAgentErrorMessage,
  createAgentRegisteredMessage,
  createBrowserCommandMessage,
  parseAgentClientMessageJson,
} from '@cthutool/agent-protocol';
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { HttpAdapterHost } from '@nestjs/core';
import type WebSocket from 'ws';
import { WebSocketServer } from 'ws';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryLogger } from './agent-registry.logger';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from './agent-registry.service';

const AGENT_WS_PATH = '/ws/agents';
const STALE_AGENT_TIMEOUT_MS = 45_000;
const STALE_SWEEP_INTERVAL_MS = 15_000;

type SocketState = {
  readonly connectionId: string;
  agentId?: string;
};

type PendingBrowserCommand = {
  readonly agentId: string;
  readonly timer: NodeJS.Timeout;
  readonly resolve: (
    message: BrowserResultMessage | BrowserErrorMessage,
  ) => void;
  readonly reject: (error: Error) => void;
};

@Injectable()
export class AgentWebSocketServer implements OnModuleInit, OnModuleDestroy {
  private readonly server = new WebSocketServer({ noServer: true });
  private readonly sockets = new Map<string, WebSocket>();
  private readonly pendingBrowserCommands = new Map<
    string,
    PendingBrowserCommand
  >();
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly registry: AgentRegistryService,
    private readonly registryLogger: AgentRegistryLogger,
  ) {}

  onModuleInit(): void {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();
    httpServer.on('upgrade', this.handleUpgrade);
    this.server.on('connection', this.handleConnection);
    this.sweepTimer = setInterval(
      () => this.closeStaleConnections(),
      STALE_SWEEP_INTERVAL_MS,
    );
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();
    httpServer.off('upgrade', this.handleUpgrade);
    this.server.off('connection', this.handleConnection);
    this.server.close();
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = undefined;
    }
    for (const socket of this.sockets.values()) {
      socket.close();
    }
    this.sockets.clear();
    for (const pending of this.pendingBrowserCommands.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('agent websocket server stopped'));
    }
    this.pendingBrowserCommands.clear();
  }

  sendBrowserCommand(
    agentId: string,
    payload: BrowserCommandPayload,
    timeoutMs = 30_000,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
    const status = this.registry
      .listOnlineAgents()
      .find((agent) => agent.agentId === agentId);
    if (!status) {
      return Promise.reject(new Error(`Agent "${agentId}" is not online`));
    }

    const socket = this.sockets.get(status.connectionId);
    if (!socket || socket.readyState !== 1) {
      return Promise.reject(new Error(`Agent "${agentId}" socket is not open`));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingBrowserCommands.delete(payload.commandId);
        reject(new Error(`Browser command "${payload.commandId}" timed out`));
      }, timeoutMs);
      timer.unref();

      this.pendingBrowserCommands.set(payload.commandId, {
        agentId,
        reject,
        resolve,
        timer,
      });

      socket.send(
        JSON.stringify(createBrowserCommandMessage(payload)),
        (error) => {
          if (!error) {
            return;
          }
          clearTimeout(timer);
          this.pendingBrowserCommands.delete(payload.commandId);
          reject(error);
        },
      );
    });
  }

  private readonly handleUpgrade = (
    request: IncomingMessage,
    socket: Parameters<WebSocketServer['handleUpgrade']>[1],
    head: Buffer,
  ): void => {
    const pathname = parseUrl(request.url ?? '').pathname;
    if (pathname !== AGENT_WS_PATH) {
      return;
    }

    this.server.handleUpgrade(request, socket, head, (ws) => {
      this.server.emit('connection', ws, request);
    });
  };

  private readonly handleConnection = (socket: WebSocket): void => {
    const state: SocketState = {
      connectionId: randomUUID(),
    };
    this.sockets.set(state.connectionId, socket);
    this.registryLogger.log({
      event: 'socket_connected',
      connectionId: state.connectionId,
    });

    socket.on('message', (data) => {
      this.handleMessage(socket, state, data);
    });
    socket.on('close', () => {
      const status = this.registry.disconnect(state.connectionId);
      this.sockets.delete(state.connectionId);
      this.registryLogger.log({
        event: 'agent_disconnected',
        connectionId: state.connectionId,
        agentId: status?.agentId ?? state.agentId,
      });
    });
  };

  private handleMessage(
    socket: WebSocket,
    state: SocketState,
    data: WebSocket.RawData,
  ): void {
    const parsed = parseAgentClientMessageJson(data.toString());
    if (!parsed.ok) {
      this.reject(socket, state, parsed.message);
      return;
    }

    switch (parsed.value.type) {
      case 'agent.hello':
        this.handleHello(socket, state, parsed.value);
        return;
      case 'agent.heartbeat':
        this.handleHeartbeat(socket, state, parsed.value);
        return;
      case 'browser.result':
      case 'browser.error':
        this.handleBrowserResponse(socket, state, parsed.value);
        return;
      case 'browser.profileStatus':
        this.handleProfileStatus(socket, state, parsed.value);
        return;
    }
  }

  private handleHello(
    socket: WebSocket,
    state: SocketState,
    message: Extract<AgentClientMessage, { type: 'agent.hello' }>,
  ): void {
    const result = this.registry.register({
      connectionId: state.connectionId,
      hello: message.payload,
    });
    state.agentId = result.status.agentId;

    if (
      result.replacedConnectionId &&
      result.replacedConnectionId !== state.connectionId
    ) {
      this.sockets.get(result.replacedConnectionId)?.close();
      this.sockets.delete(result.replacedConnectionId);
      this.registryLogger.log({
        event: 'agent_reconnected',
        connectionId: state.connectionId,
        agentId: result.status.agentId,
        details: {
          replacedConnectionId: result.replacedConnectionId,
        },
      });
    } else {
      this.registryLogger.log({
        event: 'agent_registered',
        connectionId: state.connectionId,
        agentId: result.status.agentId,
      });
    }

    socket.send(
      JSON.stringify(
        createAgentRegisteredMessage(
          result.status.agentId,
          new Date().toISOString(),
        ),
      ),
    );
  }

  private handleHeartbeat(
    socket: WebSocket,
    state: SocketState,
    message: Extract<AgentClientMessage, { type: 'agent.heartbeat' }>,
  ): void {
    if (!state.agentId || state.agentId !== message.payload.agentId) {
      this.reject(socket, state, 'heartbeat must match registered agent');
      return;
    }

    const result = this.registry.heartbeat(state.connectionId);
    if (!result.ok) {
      this.reject(socket, state, result.reason);
      return;
    }

    this.registryLogger.log({
      event: 'agent_heartbeat',
      connectionId: state.connectionId,
      agentId: result.status.agentId,
    });
  }

  private handleBrowserResponse(
    socket: WebSocket,
    state: SocketState,
    message: BrowserResultMessage | BrowserErrorMessage,
  ): void {
    const pending = this.pendingBrowserCommands.get(message.payload.commandId);
    if (!pending) {
      this.reject(
        socket,
        state,
        'browser response does not match a pending command',
      );
      return;
    }
    if (!state.agentId || state.agentId !== pending.agentId) {
      this.reject(
        socket,
        state,
        'browser response must come from the target agent',
      );
      return;
    }
    clearTimeout(pending.timer);
    this.pendingBrowserCommands.delete(message.payload.commandId);
    pending.resolve(message);
  }

  private handleProfileStatus(
    _socket: WebSocket,
    _state: SocketState,
    _message: Extract<AgentClientMessage, { type: 'browser.profileStatus' }>,
  ): void {
    // Browser profile status is consumed by browser automation commands for now.
  }

  private reject(socket: WebSocket, state: SocketState, message: string): void {
    this.registryLogger.warn({
      event: 'invalid_payload',
      connectionId: state.connectionId,
      agentId: state.agentId,
      details: { message },
    });
    socket.send(
      JSON.stringify(createAgentErrorMessage('invalid_agent_message', message)),
    );
    socket.close(1008, 'invalid agent message');
  }

  private closeStaleConnections(): void {
    const stale = this.registry.pruneStale(STALE_AGENT_TIMEOUT_MS);
    for (const status of stale) {
      this.registryLogger.warn({
        event: 'agent_stale',
        connectionId: status.connectionId,
        agentId: status.agentId,
      });
      const socket = this.sockets.get(status.connectionId);
      socket?.close(4000, 'agent heartbeat stale');
      this.sockets.delete(status.connectionId);
    }
  }
}
