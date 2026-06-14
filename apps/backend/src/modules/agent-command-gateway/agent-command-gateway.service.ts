import type {
  BrowserCommandPayload,
  BrowserErrorMessage,
  BrowserResultMessage,
  PublicAgentStatus,
} from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from '../agent-registry/agent-registry.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentWebSocketServer } from '../agent-registry/agent-websocket.server';

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

  async sendBrowserCommandByCapability(
    capability: string,
    payload: BrowserCommandPayload,
    timeoutMs?: number,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
    const agent = this.selectAgentByCapability(capability);
    if (!agent) {
      throw new AgentCommandGatewayError(
        'AGENT_CAPABILITY_MISSING',
        `No online desktop agent with "${capability}" capability`,
      );
    }
    return this.sendBrowserCommand(agent.agentId, payload, timeoutMs);
  }

  async sendBrowserCommand(
    agentId: string,
    payload: BrowserCommandPayload,
    timeoutMs?: number,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
    try {
      return await this.agentSocketServer.sendBrowserCommand(
        agentId,
        payload,
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
}
