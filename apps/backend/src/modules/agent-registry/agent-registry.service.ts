import type { PublicAgentStatus } from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
import type {
  HeartbeatResult,
  RegisterAgentInput,
  RegisterAgentResult,
} from './agent-registry.types';

@Injectable()
export class AgentRegistryService {
  private readonly agents = new Map<string, PublicAgentStatus>();
  private readonly connectionToAgent = new Map<string, string>();

  register(input: RegisterAgentInput): RegisterAgentResult {
    const now = toIso(input.now ?? new Date());
    const previous = this.agents.get(input.hello.agentId);
    if (previous) {
      this.connectionToAgent.delete(previous.connectionId);
    }

    const status: PublicAgentStatus = {
      agentId: input.hello.agentId,
      connectionId: input.connectionId,
      deviceName: input.hello.deviceName,
      platform: input.hello.platform,
      version: input.hello.version,
      capabilities: [...input.hello.capabilities],
      connectedAt: now,
      lastSeenAt: now,
      state: 'online',
    };

    this.agents.set(input.hello.agentId, status);
    this.connectionToAgent.set(input.connectionId, input.hello.agentId);

    return {
      status,
      replacedConnectionId: previous?.connectionId,
    };
  }

  heartbeat(connectionId: string, now: Date = new Date()): HeartbeatResult {
    const agentId = this.connectionToAgent.get(connectionId);
    if (!agentId) {
      return { ok: false, reason: 'agent_not_found' };
    }

    const current = this.agents.get(agentId);
    if (!current) {
      this.connectionToAgent.delete(connectionId);
      return { ok: false, reason: 'agent_not_found' };
    }

    if (current.connectionId !== connectionId) {
      this.connectionToAgent.delete(connectionId);
      return { ok: false, reason: 'connection_not_authoritative' };
    }

    const status = {
      ...current,
      lastSeenAt: toIso(now),
    };
    this.agents.set(agentId, status);
    return { ok: true, status };
  }

  disconnect(connectionId: string): PublicAgentStatus | undefined {
    const agentId = this.connectionToAgent.get(connectionId);
    if (!agentId) {
      return undefined;
    }

    const current = this.agents.get(agentId);
    this.connectionToAgent.delete(connectionId);
    if (current?.connectionId === connectionId) {
      this.agents.delete(agentId);
      return current;
    }
    return undefined;
  }

  pruneStale(
    staleTimeoutMs: number,
    now: Date = new Date(),
  ): PublicAgentStatus[] {
    const stale: PublicAgentStatus[] = [];
    for (const status of this.agents.values()) {
      const lastSeenMs = new Date(status.lastSeenAt).getTime();
      if (now.getTime() - lastSeenMs > staleTimeoutMs) {
        this.agents.delete(status.agentId);
        this.connectionToAgent.delete(status.connectionId);
        stale.push(status);
      }
    }
    return stale;
  }

  listOnlineAgents(): PublicAgentStatus[] {
    return [...this.agents.values()]
      .map((status) => ({
        ...status,
        capabilities: [...status.capabilities],
      }))
      .sort((left, right) => left.agentId.localeCompare(right.agentId));
  }
}

function toIso(date: Date): string {
  return date.toISOString();
}
