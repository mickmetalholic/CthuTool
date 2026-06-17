import type {
  AgentClientMessage,
  AgentServerMessage,
  PublicAgentStatus,
} from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
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
    try {
      return await this.agentSocketServer.sendCommand<TResponse>(
        agentId,
        command,
        timeoutMs,
      );
    } catch (error) {
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
