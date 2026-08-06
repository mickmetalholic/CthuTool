import {
  bridgeFailure,
  validateAgentBridgeResourceSnapshot,
  validateAgentBridgeRpcRequest,
  validateAgentBridgeSessionExchange,
  validateAgentBridgeSettingsPatch,
} from './index';

describe('Agent bridge protocol', () => {
  test('validates bounded session exchange and settings requests', () => {
    expect(
      validateAgentBridgeSessionExchange({
        environmentId: 'prod',
        instanceId: 'instance-1',
        supportedVersions: [1],
        ticket: 't'.repeat(43),
      }).ok,
    ).toBe(true);
    expect(
      validateAgentBridgeSettingsPatch({ deviceName: 'Personal Agent' }).ok,
    ).toBe(true);
    expect(validateAgentBridgeSettingsPatch({}).ok).toBe(false);
  });

  test('rejects environment switching and secret-shaped metadata', () => {
    expect(
      validateAgentBridgeRpcRequest({
        id: 'rpc-1',
        method: 'environment.switch',
        params: { environmentId: 'test' },
        protocolVersion: 1,
      }).ok,
    ).toBe(false);
    expect(
      validateAgentBridgeRpcRequest({
        id: 'rpc-1',
        method: 'settings.update',
        params: { agentSecret: 'not-allowed' },
        protocolVersion: 1,
      }).ok,
    ).toBe(false);
    expect(
      validateAgentBridgeSettingsPatch({
        deviceName: 'Attempted mutation',
        environmentId: 'test',
      }).ok,
    ).toBe(false);
  });

  test('creates stable bounded failures', () => {
    expect(bridgeFailure('ORIGIN_DENIED', 'Origin is not allowed')).toEqual({
      error: { code: 'ORIGIN_DENIED', message: 'Origin is not allowed' },
      ok: false,
      protocolVersion: 1,
    });
  });
});

describe('Agent bridge resources', () => {
  test('accepts bounded sanitized resource snapshots', () => {
    expect(
      validateAgentBridgeResourceSnapshot({
        agent: {
          backendStatus: 'connected',
          deviceName: 'Personal Agent',
          id: 'agent-1',
          processState: 'ready',
          version: '0.1.0',
        },
        autostart: { enabled: false, supported: false },
        browser: {
          executablePathConfigured: false,
          message: 'Chrome ready',
          ready: true,
          status: 'ready',
        },
        diagnostics: [],
        environment: {
          backendHttpUrl: 'https://api.example.com',
          id: 'prod',
          label: 'Production',
          webOrigin: 'https://app.example.com',
        },
        profiles: [],
        protocolVersion: 1,
      }).ok,
    ).toBe(true);
  });

  test('rejects secret-shaped metadata in resource snapshots', () => {
    expect(
      validateAgentBridgeResourceSnapshot({
        agentSecret: 'must-not-cross-bridge',
      }).ok,
    ).toBe(false);
  });
});
