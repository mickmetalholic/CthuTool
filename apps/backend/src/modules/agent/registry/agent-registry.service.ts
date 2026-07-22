import type { PublicAgentStatus } from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
import type {
  AgentRegistryStatus,
  HeartbeatResult,
  RegisterAgentInput,
  RegisterAgentResult,
} from './agent-registry.types';

@Injectable()
export class AgentRegistryService {
  private readonly agents = new Map<string, AgentRegistryStatus>();
  private readonly connectionToAgent = new Map<string, string>();
  private readonly generations = new Map<string, number>();

  register(input: RegisterAgentInput): RegisterAgentResult {
    const now = toIso(input.now ?? new Date());
    if (
      input.authenticatedEnvironmentId &&
      input.authenticatedEnvironmentId !== input.hello.environmentId
    ) {
      throw new Error('authenticated Agent environment does not match hello');
    }
    const key = registryKey(input.hello.environmentId, input.hello.agentId);
    const previous = this.agents.get(key);
    if (previous) {
      this.connectionToAgent.delete(previous.connectionId);
    }

    const connectionGeneration = (this.generations.get(key) ?? 0) + 1;
    this.generations.set(key, connectionGeneration);
    const status: AgentRegistryStatus = {
      environmentId: input.hello.environmentId,
      agentId: input.hello.agentId,
      connectionGeneration,
      protocolVersion: input.hello.protocolVersion,
      connectionId: input.connectionId,
      deviceName: input.hello.deviceName,
      platform: input.hello.platform,
      version: input.hello.version,
      capabilities: [...input.hello.capabilities],
      connectedAt: now,
      lastSeenAt: now,
      state: 'online',
    };

    this.agents.set(key, status);
    this.connectionToAgent.set(input.connectionId, key);

    return {
      status,
      replacedConnectionId: previous?.connectionId,
    };
  }

  heartbeat(connectionId: string, now: Date = new Date()): HeartbeatResult {
    const key = this.connectionToAgent.get(connectionId);
    if (!key) {
      return { ok: false, reason: 'agent_not_found' };
    }

    const current = this.agents.get(key);
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
    this.agents.set(key, status);
    return { ok: true, status };
  }

  disconnect(connectionId: string): PublicAgentStatus | undefined {
    const key = this.connectionToAgent.get(connectionId);
    if (!key) {
      return undefined;
    }

    const current = this.agents.get(key);
    this.connectionToAgent.delete(connectionId);
    if (current?.connectionId === connectionId) {
      this.agents.delete(key);
      return current;
    }
    return undefined;
  }

  pruneStale(
    staleTimeoutMs: number,
    now: Date = new Date(),
  ): AgentRegistryStatus[] {
    const stale: AgentRegistryStatus[] = [];
    for (const [key, status] of this.agents.entries()) {
      const lastSeenMs = new Date(status.lastSeenAt).getTime();
      if (now.getTime() - lastSeenMs > staleTimeoutMs) {
        this.agents.delete(key);
        this.connectionToAgent.delete(status.connectionId);
        stale.push(status);
      }
    }
    return stale;
  }

  listOnlineAgents(): PublicAgentStatus[] {
    return [...this.agents.values()]
      .map(({ connectionId: _connectionId, ...status }) => ({
        ...status,
        capabilities: [...status.capabilities],
      }))
      .sort((left, right) =>
        registryKey(left.environmentId, left.agentId).localeCompare(
          registryKey(right.environmentId, right.agentId),
        ),
      );
  }

  listOnlineConnections(): AgentRegistryStatus[] {
    return [...this.agents.values()].map((status) => ({
      ...status,
      capabilities: [...status.capabilities],
    }));
  }

  findAuthoritative(
    environmentId: string,
    agentId?: string,
  ): AgentRegistryStatus | undefined {
    if (agentId) {
      return this.agents.get(registryKey(environmentId, agentId));
    }
    const matches = [...this.agents.values()].filter(
      (status) => status.environmentId === environmentId,
    );
    return matches.length === 1 ? matches[0] : undefined;
  }

  findByEnvironmentAndCapability(
    environmentId: string,
    capability: string,
  ): AgentRegistryStatus | undefined {
    const matches = [...this.agents.values()].filter(
      (status) =>
        status.environmentId === environmentId &&
        status.capabilities.includes(capability),
    );
    return matches.length === 1 ? matches[0] : undefined;
  }
}

function registryKey(environmentId: string, agentId: string): string {
  return `${environmentId}\u0000${agentId}`;
}

function toIso(date: Date): string {
  return date.toISOString();
}
