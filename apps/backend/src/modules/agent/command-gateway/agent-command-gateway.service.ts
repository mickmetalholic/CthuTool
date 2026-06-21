import type {
  AgentObservabilityMetadata,
  JsonRpcRequest,
  JsonRpcResponse,
  PublicAgentStatus,
} from '@cthutool/agent-protocol';
import { Injectable, Optional } from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendMetricsService } from '../../../metrics';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendObservabilityService } from '../../../observability';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from '../registry/agent-registry.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentWebSocketServer } from '../websocket/agent-websocket.server';

export type AgentCommandRequest<TParams = unknown> = JsonRpcRequest<TParams>;
export type AgentCommandResponse<
  TResult = unknown,
  TErrorData = unknown,
> = JsonRpcResponse<TResult, TErrorData>;

export class AgentCommandGatewayError extends Error {
  constructor(
    readonly code: 'AGENT_NOT_AVAILABLE' | 'AGENT_CAPABILITY_MISSING',
    message: string,
  ) {
    super(message);
    this.name = 'AgentCommandGatewayError';
  }
}

@Injectable()
export class AgentCommandGateway {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly agentSocketServer: AgentWebSocketServer,
    @Optional()
    private readonly observability?: BackendObservabilityService,
    @Optional()
    private readonly metrics?: BackendMetricsService,
  ) {}

  selectAgentByCapability(capability: string): PublicAgentStatus | undefined {
    return this.registry
      .listOnlineAgents()
      .find((status) => status.capabilities.includes(capability));
  }

  async sendCommand<
    TResponse extends AgentCommandResponse = AgentCommandResponse,
  >(
    agentId: string,
    command: AgentCommandRequest,
    timeoutMs?: number,
  ): Promise<TResponse> {
    const startedAt = Date.now();
    const commandType = command.method;
    this.observability?.record({
      event: 'agent.command_dispatched',
      details: {
        agentId,
        commandId: String(command.id),
        commandType,
        timeoutMs,
      },
    });
    this.metrics?.recordAgentCommandDispatched({ commandType });
    try {
      const response = await this.agentSocketServer.sendCommand<TResponse>(
        agentId,
        attachObservability(command),
        timeoutMs,
      );
      const durationMs = Date.now() - startedAt;
      const responseType =
        'error' in response ? 'jsonrpc.error' : 'jsonrpc.result';
      this.observability?.record({
        event: 'agent.command_completed',
        details: {
          agentId,
          commandId: String(command.id),
          commandType,
          durationMs,
          responseType,
        },
      });
      this.metrics?.recordAgentCommandCompleted({
        commandType,
        durationMs,
        responseType,
      });
      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const errorCode = isTimeoutError(error)
        ? 'AGENT_COMMAND_TIMEOUT'
        : 'AGENT_NOT_AVAILABLE';
      this.observability?.record({
        event: 'agent.command_failed',
        level: 'warn',
        details: {
          agentId,
          commandId: String(command.id),
          commandType,
          durationMs,
          errorCode,
          message:
            error instanceof Error
              ? error.message
              : 'Target desktop agent is not available',
        },
      });
      this.metrics?.recordAgentCommandFailed({
        commandType,
        durationMs,
        errorCode,
      });
      throw new AgentCommandGatewayError(
        'AGENT_NOT_AVAILABLE',
        error instanceof Error
          ? error.message
          : 'Target desktop agent is not available',
      );
    }
  }

  async sendCommandByCapability<
    TResponse extends AgentCommandResponse = AgentCommandResponse,
  >(
    capability: string,
    command: AgentCommandRequest,
    timeoutMs?: number,
  ): Promise<TResponse> {
    const agent = this.selectAgentByCapability(capability);
    if (!agent) {
      throw new AgentCommandGatewayError(
        'AGENT_CAPABILITY_MISSING',
        `No online desktop agent with "${capability}" capability`,
      );
    }
    return this.sendCommand<TResponse>(agent.agentId, command, timeoutMs);
  }
}

function attachObservability<TParams>(
  command: AgentCommandRequest<TParams>,
): AgentCommandRequest<TParams> {
  const observability = command.observability as
    | AgentObservabilityMetadata
    | undefined;
  if (!observability) {
    return command;
  }
  return {
    ...command,
    observability,
  };
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && /timed out/i.test(error.message);
}
