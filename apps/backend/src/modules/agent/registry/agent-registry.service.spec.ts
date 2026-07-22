import { AgentRegistryService } from './agent-registry.service';

describe('AgentRegistryService', () => {
  const baseHello = {
    environmentId: 'local',
    agentId: 'homelab-mac',
    protocolVersion: 1 as const,
    deviceName: 'Homelab Mac',
    platform: 'darwin' as const,
    version: '0.1.0',
    capabilities: [] as string[],
  };

  it('registers an online agent with safe public status', () => {
    const registry = new AgentRegistryService();

    const result = registry.register({
      connectionId: 'conn-1',
      hello: baseHello,
      now: new Date('2026-06-13T10:00:00.000Z'),
    });

    expect(result.status).toEqual({
      environmentId: 'local',
      agentId: 'homelab-mac',
      connectionGeneration: 1,
      protocolVersion: 1,
      connectionId: 'conn-1',
      deviceName: 'Homelab Mac',
      platform: 'darwin',
      version: '0.1.0',
      capabilities: [],
      connectedAt: '2026-06-13T10:00:00.000Z',
      lastSeenAt: '2026-06-13T10:00:00.000Z',
      state: 'online',
    });
    expect(JSON.stringify(result.status)).not.toContain('socket');
    expect(registry.listOnlineAgents()).toEqual([
      expect.objectContaining({
        environmentId: 'local',
        agentId: 'homelab-mac',
        connectionGeneration: 1,
      }),
    ]);
    expect(registry.listOnlineAgents()[0]).not.toHaveProperty('connectionId');
  });

  it('keeps browser capability as metadata without browser state', () => {
    const registry = new AgentRegistryService();

    const result = registry.register({
      connectionId: 'conn-browser',
      hello: {
        ...baseHello,
        capabilities: ['browser'],
      },
      now: new Date('2026-06-13T10:00:00.000Z'),
    });

    expect(result.status.capabilities).toEqual(['browser']);
    expect(result.status).not.toHaveProperty('profiles');
    expect(result.status).not.toHaveProperty('pendingAuthTasks');
    expect(result.status).not.toHaveProperty('browserState');
    expect(result.status).not.toHaveProperty('stateSnapshot');
  });

  it('replaces duplicate agent ids with the newest connection', () => {
    const registry = new AgentRegistryService();

    registry.register({
      connectionId: 'old-conn',
      hello: baseHello,
      now: new Date('2026-06-13T10:00:00.000Z'),
    });
    const replacement = registry.register({
      connectionId: 'new-conn',
      hello: {
        ...baseHello,
        deviceName: 'Renamed Mac',
        capabilities: ['browser'],
      },
      now: new Date('2026-06-13T10:01:00.000Z'),
    });

    expect(replacement.replacedConnectionId).toBe('old-conn');
    expect(registry.listOnlineAgents()).toEqual([
      expect.objectContaining({
        agentId: 'homelab-mac',
        connectionGeneration: 2,
        deviceName: 'Renamed Mac',
        capabilities: ['browser'],
      }),
    ]);
    expect(registry.disconnect('old-conn')).toBeUndefined();
    expect(registry.listOnlineAgents()).toHaveLength(1);
  });

  it('updates heartbeat freshness for the authoritative connection', () => {
    const registry = new AgentRegistryService();
    registry.register({
      connectionId: 'conn-1',
      hello: baseHello,
      now: new Date('2026-06-13T10:00:00.000Z'),
    });

    const result = registry.heartbeat(
      'conn-1',
      new Date('2026-06-13T10:00:05.000Z'),
    );

    expect(result).toEqual({
      ok: true,
      status: expect.objectContaining({
        agentId: 'homelab-mac',
        lastSeenAt: '2026-06-13T10:00:05.000Z',
      }),
    });
  });

  it('removes disconnected and stale agents', () => {
    const registry = new AgentRegistryService();
    registry.register({
      connectionId: 'conn-1',
      hello: baseHello,
      now: new Date('2026-06-13T10:00:00.000Z'),
    });
    registry.register({
      connectionId: 'conn-2',
      hello: { ...baseHello, agentId: 'windows-pc', platform: 'win32' },
      now: new Date('2026-06-13T10:00:10.000Z'),
    });

    expect(registry.disconnect('conn-2')).toEqual(
      expect.objectContaining({ agentId: 'windows-pc' }),
    );
    expect(
      registry.pruneStale(1000, new Date('2026-06-13T10:00:02.000Z')),
    ).toEqual([expect.objectContaining({ agentId: 'homelab-mac' })]);
    expect(registry.listOnlineAgents()).toEqual([]);
  });

  it('isolates the same stable Agent id by environment and advances generations', () => {
    const registry = new AgentRegistryService();
    const prod = registry.register({
      authenticatedEnvironmentId: 'prod',
      connectionId: 'prod-1',
      hello: { ...baseHello, environmentId: 'prod' },
    });
    registry.disconnect('prod-1');
    const prodReconnect = registry.register({
      authenticatedEnvironmentId: 'prod',
      connectionId: 'prod-2',
      hello: { ...baseHello, environmentId: 'prod' },
    });
    const testAgent = registry.register({
      authenticatedEnvironmentId: 'test',
      connectionId: 'test-1',
      hello: { ...baseHello, environmentId: 'test' },
    });

    expect(prod.status.connectionGeneration).toBe(1);
    expect(prodReconnect.status.connectionGeneration).toBe(2);
    expect(testAgent.status.connectionGeneration).toBe(1);
    expect(
      registry.findAuthoritative('prod', 'homelab-mac')?.connectionId,
    ).toBe('prod-2');
    expect(
      registry.findAuthoritative('test', 'homelab-mac')?.connectionId,
    ).toBe('test-1');
  });
});
