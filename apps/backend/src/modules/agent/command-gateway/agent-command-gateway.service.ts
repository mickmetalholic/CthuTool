import type {
  AgentClientMessage,
  AgentObservabilityMetadata,
  AgentServerMessage,
  PublicAgentStatus,
} from '@cthutool/agent-protocol';
import { Injectable, Optional } from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendObservabilityService } from '../../../observability';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from '../registry/agent-registry.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentWebSocketServer } from '../websocket/agent-websocket.server';

export type AgentCommandMessage = Extract<
  AgentServerMessage,
  { readonly payload: { readonly commandId: string } }
>;
export type AgentCommandResponse = Extract<
  AgentClientMessage,
  { readonly payload: { readonly commandId: string } }
>;
export type AgentCommandRequest<
  TMessage extends AgentCommandMessage = AgentCommandMessage,
> = {
  readonly commandId: string;
  readonly message: TMessage;
  readonly observability?: AgentObservabilityMetadata;
};

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
    const commandType = commandTypeOf(command);
    this.observability?.record({
      event: 'agent.command_dispatched',
      details: {
        agentId,
        commandId: command.commandId,
        commandType,
        timeoutMs,
      },
    });
    try {
      const response = await this.agentSocketServer.sendCommand<TResponse>(
        agentId,
        attachObservability(command),
        timeoutMs,
      );
      this.observability?.record({
        event: 'agent.command_completed',
        details: {
          agentId,
          commandId: command.commandId,
          commandType,
          durationMs: Date.now() - startedAt,
          responseType: response.type,
        },
      });
      return response;
    } catch (error) {
      this.observability?.record({
        event: 'agent.command_failed',
        level: 'warn',
        details: {
          agentId,
          commandId: command.commandId,
          commandType,
          durationMs: Date.now() - startedAt,
          errorCode: 'AGENT_NOT_AVAILABLE',
          message:
            error instanceof Error
              ? error.message
              : 'Target desktop agent is not available',
        },
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

function commandTypeOf(command: AgentCommandRequest): string | undefined {
  const payload = command.message.payload as { readonly command?: unknown };
  return typeof payload.command === 'string' ? payload.command : undefined;
}

function attachObservability<TMessage extends AgentCommandMessage>(
  command: AgentCommandRequest<TMessage>,
): AgentCommandRequest<TMessage> {
  if (!command.observability) {
    return command;
  }
  if ('observability' in command.message.payload) {
    return command;
  }
  return {
    ...command,
    message: {
      ...command.message,
      payload: {
        ...command.message.payload,
        observability: command.observability,
      },
    } as TMessage,
  };
}
