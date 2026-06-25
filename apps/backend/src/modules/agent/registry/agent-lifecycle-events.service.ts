import type { PublicAgentStatus } from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';

export type AgentDisconnectedEvent = {
  readonly agent: PublicAgentStatus;
};

type AgentDisconnectedHandler = (event: AgentDisconnectedEvent) => void;

@Injectable()
export class AgentLifecycleEvents {
  private readonly disconnectedHandlers = new Set<AgentDisconnectedHandler>();

  onAgentDisconnected(handler: AgentDisconnectedHandler): () => void {
    this.disconnectedHandlers.add(handler);
    return () => {
      this.disconnectedHandlers.delete(handler);
    };
  }

  emitAgentDisconnected(agent: PublicAgentStatus): void {
    for (const handler of this.disconnectedHandlers) {
      handler({ agent });
    }
  }
}
