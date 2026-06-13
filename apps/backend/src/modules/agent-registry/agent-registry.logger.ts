import { Injectable, Logger } from '@nestjs/common';
import type { AgentRegistryEvent } from './agent-registry.types';

type AgentRegistryLogInput = {
  readonly event: AgentRegistryEvent;
  readonly connectionId: string;
  readonly agentId?: string;
  readonly details?: Record<string, unknown>;
};

@Injectable()
export class AgentRegistryLogger {
  private readonly logger = new Logger('AgentRegistry');

  log(input: AgentRegistryLogInput): void {
    this.logger.log('agent registry event', {
      event: input.event,
      connectionId: input.connectionId,
      agentId: input.agentId,
      details: input.details,
      timestamp: new Date().toISOString(),
    });
  }

  warn(input: AgentRegistryLogInput): void {
    this.logger.warn('agent registry warning', {
      event: input.event,
      connectionId: input.connectionId,
      agentId: input.agentId,
      details: input.details,
      timestamp: new Date().toISOString(),
    });
  }
}
