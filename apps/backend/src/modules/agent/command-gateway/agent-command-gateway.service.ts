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
    readonly code:
      | 'AGENT_NOT_AVAILABLE'
      | 'AGENT_CAPABILITY_MISSING'
      | 'ENVIRONMENT_CONTEXT_REQUIRED',
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

  selectAgentByCapability(
    environmentId: string,
    capability: string,
  ): PublicAgentStatus | undefined {
    if (!environmentId) {
      return undefined;
    }
    const status = this.registry.findByEnvironmentAndCapability(
      environmentId,
      capability,
    );
    if (!status) {
      return undefined;
    }
    const { connectionId: _connectionId, ...publicStatus } = status;
    return publicStatus;
  }

  async sendCommand<
    TResponse extends AgentCommandResponse = AgentCommandResponse,
  >(
    target: { readonly environmentId: string; readonly agentId: string },
    command: AgentCommandRequest,
    timeoutMs?: number,
  ): Promise<TResponse> {
    const startedAt = Date.now();
    if (!target.environmentId) {
      throw new AgentCommandGatewayError(
        'ENVIRONMENT_CONTEXT_REQUIRED',
        'Trusted environment context is required',
      );
    }
    const authoritative = this.registry.findAuthoritative(
      target.environmentId,
      target.agentId,
    );
    if (!authoritative) {
      throw new AgentCommandGatewayError(
        'AGENT_NOT_AVAILABLE',
        `Agent "${target.agentId}" is not online in environment "${target.environmentId}"`,
      );
    }
    const commandType = command.method;
    this.observability?.record({
      event: 'agent.command_dispatched',
      details: {
        environmentId: target.environmentId,
        agentId: target.agentId,
        connectionGeneration: authoritative.connectionGeneration,
        commandId: String(command.id),
        commandType,
        timeoutMs,
      },
    });
    this.metrics?.recordAgentCommandDispatched({ commandType });
    try {
      const response = await this.agentSocketServer.sendCommand<TResponse>(
        {
          environmentId: target.environmentId,
          agentId: target.agentId,
          connectionGeneration: authoritative.connectionGeneration,
        },
        attachObservability(command),
        timeoutMs,
      );
      const durationMs = Date.now() - startedAt;
      const responseType =
        'error' in response ? 'jsonrpc.error' : 'jsonrpc.result';
      this.observability?.record({
        event: 'agent.command_completed',
        details: {
          environmentId: target.environmentId,
          agentId: target.agentId,
          connectionGeneration: authoritative.connectionGeneration,
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
          environmentId: target.environmentId,
          agentId: target.agentId,
          connectionGeneration: authoritative.connectionGeneration,
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
    environmentId: string,
    capability: string,
    command: AgentCommandRequest,
    timeoutMs?: number,
  ): Promise<TResponse> {
    if (!environmentId) {
      throw new AgentCommandGatewayError(
        'ENVIRONMENT_CONTEXT_REQUIRED',
        'Trusted environment context is required',
      );
    }
    const agent = this.selectAgentByCapability(environmentId, capability);
    if (!agent) {
      throw new AgentCommandGatewayError(
        'AGENT_CAPABILITY_MISSING',
        `No online desktop agent with "${capability}" capability`,
      );
    }
    return this.sendCommand<TResponse>(
      { environmentId, agentId: agent.agentId },
      command,
      timeoutMs,
    );
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
