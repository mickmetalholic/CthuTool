import { AgentRegistryService } from './agent-registry.service';

describe('AgentRegistryService', () => {
  const baseHello = {
    agentId: 'homelab-mac',
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
      agentId: 'homelab-mac',
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
    expect(registry.listOnlineAgents()).toEqual([result.status]);
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
        connectionId: 'new-conn',
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
});
