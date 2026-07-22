import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { parse as parseUrl } from 'node:url';
import {
  type AgentHeartbeatMessage,
  type AgentHelloMessage,
  createAgentErrorMessage,
  createAgentRegisteredMessage,
  isJsonRpcResponse,
  type JsonRpcId,
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
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { SingleOperatorAccessService } from '../../operator-access/single-operator-access.service';
import type {
  AgentCommandRequest,
  AgentCommandResponse,
} from '../command-gateway/agent-command-gateway.service';
// Nest DI needs runtime class reference.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentLifecycleEvents } from '../registry/agent-lifecycle-events.service';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryLogger } from '../registry/agent-registry.logger';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from '../registry/agent-registry.service';

const AGENT_WS_PATH = '/ws/agents';
const STALE_AGENT_TIMEOUT_MS = 45_000;
const STALE_SWEEP_INTERVAL_MS = 15_000;

type SocketState = {
  readonly connectionId: string;
  readonly environmentId: string;
  agentId?: string;
  connectionGeneration?: number;
};

type PendingCommand = {
  readonly environmentId: string;
  readonly agentId: string;
  readonly connectionGeneration: number;
  readonly timer: NodeJS.Timeout;
  readonly resolve: (message: AgentCommandResponse) => void;
  readonly reject: (error: Error) => void;
};

@Injectable()
export class AgentWebSocketServer implements OnModuleInit, OnModuleDestroy {
  private readonly server = new WebSocketServer({ noServer: true });
  private readonly sockets = new Map<string, WebSocket>();
  private readonly pendingCommands = new Map<string, PendingCommand>();
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly registry: AgentRegistryService,
    private readonly registryLogger: AgentRegistryLogger,
    private readonly lifecycleEvents: AgentLifecycleEvents,
    private readonly access: SingleOperatorAccessService,
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
    for (const pending of this.pendingCommands.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('agent websocket server stopped'));
    }
    this.pendingCommands.clear();
  }

  sendCommand<TResponse extends AgentCommandResponse = AgentCommandResponse>(
    target: {
      readonly environmentId: string;
      readonly agentId: string;
      readonly connectionGeneration: number;
    },
    command: AgentCommandRequest,
    timeoutMs = 30_000,
  ): Promise<TResponse> {
    const status = this.registry.findAuthoritative(
      target.environmentId,
      target.agentId,
    );
    if (
      !status ||
      status.connectionGeneration !== target.connectionGeneration
    ) {
      return Promise.reject(
        new Error(`Agent "${target.agentId}" is not authoritative`),
      );
    }

    const socket = this.sockets.get(status.connectionId);
    if (!socket || socket.readyState !== 1) {
      return Promise.reject(
        new Error(`Agent "${target.agentId}" socket is not open`),
      );
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(pendingKey(target, command.id));
        reject(new Error(`Command "${String(command.id)}" timed out`));
      }, timeoutMs);
      timer.unref();

      this.pendingCommands.set(pendingKey(target, command.id), {
        environmentId: target.environmentId,
        agentId: target.agentId,
        connectionGeneration: target.connectionGeneration,
        reject,
        resolve: (message) => resolve(message as TResponse),
        timer,
      });

      socket.send(
        JSON.stringify({
          ...command,
          routing: {
            environmentId: target.environmentId,
            agentId: target.agentId,
            connectionGeneration: target.connectionGeneration,
          },
        }),
        (error) => {
          if (!error) {
            return;
          }
          clearTimeout(timer);
          this.pendingCommands.delete(pendingKey(target, command.id));
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

    const authentication = this.access.authenticateAgent(request);
    if (!authentication.ok) {
      this.registryLogger.warn({
        event: 'authentication_failed',
        connectionId: 'unregistered',
        details: { category: authentication.category },
      });
      socket.destroy();
      return;
    }

    this.server.handleUpgrade(request, socket, head, (ws) => {
      this.server.emit('connection', ws, request, authentication.environmentId);
    });
  };

  private readonly handleConnection = (
    socket: WebSocket,
    _request?: IncomingMessage,
    authenticatedEnvironmentId = this.access.environmentId,
  ): void => {
    const state: SocketState = {
      connectionId: randomUUID(),
      environmentId: authenticatedEnvironmentId,
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
      if (status) {
        this.lifecycleEvents.emitAgentDisconnected(status);
      }
      this.failPendingForConnection(state, 'agent connection closed');
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

    if (!('type' in parsed.value)) {
      if (isJsonRpcResponse(parsed.value)) {
        this.handleCommandResponse(socket, state, parsed.value);
      }
      return;
    }

    switch (parsed.value.type) {
      case 'agent.hello':
        this.handleHello(socket, state, parsed.value);
        return;
      case 'agent.heartbeat':
        this.handleHeartbeat(socket, state, parsed.value);
        return;
    }
  }

  private handleHello(
    socket: WebSocket,
    state: SocketState,
    message: AgentHelloMessage,
  ): void {
    if (message.payload.environmentId !== state.environmentId) {
      this.reject(
        socket,
        state,
        'hello environment does not match authentication',
      );
      return;
    }
    const result = this.registry.register({
      authenticatedEnvironmentId: state.environmentId,
      connectionId: state.connectionId,
      hello: message.payload,
    });
    state.agentId = result.status.agentId;
    state.connectionGeneration = result.status.connectionGeneration;

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
        createAgentRegisteredMessage({
          environmentId: result.status.environmentId,
          agentId: result.status.agentId,
          connectionGeneration: result.status.connectionGeneration,
          serverTime: new Date().toISOString(),
        }),
      ),
    );
  }

  private handleHeartbeat(
    socket: WebSocket,
    state: SocketState,
    message: AgentHeartbeatMessage,
  ): void {
    if (
      !state.agentId ||
      state.agentId !== message.payload.agentId ||
      state.environmentId !== message.payload.environmentId ||
      (message.payload.connectionGeneration !== undefined &&
        state.connectionGeneration !== message.payload.connectionGeneration)
    ) {
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

  private handleCommandResponse(
    socket: WebSocket,
    state: SocketState,
    message: AgentCommandResponse,
  ): void {
    const routing = message.routing;
    if (!routing) {
      this.reject(socket, state, 'command response routing is required');
      return;
    }
    const commandId = pendingKey(routing, message.id);
    const pending = this.pendingCommands.get(commandId);
    if (!pending) {
      this.reject(
        socket,
        state,
        'command response does not match a pending command',
      );
      return;
    }
    if (
      !state.agentId ||
      state.agentId !== pending.agentId ||
      state.environmentId !== pending.environmentId ||
      state.connectionGeneration !== pending.connectionGeneration
    ) {
      this.reject(
        socket,
        state,
        'command response must come from the target agent',
      );
      return;
    }
    clearTimeout(pending.timer);
    this.pendingCommands.delete(commandId);
    pending.resolve(message);
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
      this.lifecycleEvents.emitAgentDisconnected(status);
      const socket = this.sockets.get(status.connectionId);
      socket?.close(4000, 'agent heartbeat stale');
      this.sockets.delete(status.connectionId);
    }
  }

  private failPendingForConnection(state: SocketState, message: string): void {
    for (const [key, pending] of this.pendingCommands.entries()) {
      if (
        pending.environmentId === state.environmentId &&
        pending.agentId === state.agentId &&
        pending.connectionGeneration === state.connectionGeneration
      ) {
        clearTimeout(pending.timer);
        this.pendingCommands.delete(key);
        pending.reject(new Error(message));
      }
    }
  }
}

function getCommandId(id: JsonRpcId): string {
  return String(id);
}

function pendingKey(
  target: {
    readonly environmentId: string;
    readonly agentId: string;
    readonly connectionGeneration: number;
  },
  id: JsonRpcId,
): string {
  return `${target.environmentId}\u0000${target.agentId}\u0000${target.connectionGeneration}\u0000${getCommandId(id)}`;
}
