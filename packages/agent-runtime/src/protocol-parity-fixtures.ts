import type { AgentConfig } from './config';

export const AGENT_RUNTIME_PARITY_CONFIG: AgentConfig = {
  activeEnvironment: { id: 'local', label: 'Local' },
  agentId: 'agent-parity',
  backendUrl: 'https://backend.example.com',
  browserRuntime: { kind: 'host-chrome' },
  connectionEnabled: true,
  deviceName: 'Parity Agent',
};

export const AGENT_RUNTIME_PARITY_REGISTERED_MESSAGE = JSON.stringify({
  type: 'agent.registered',
  payload: {
    environmentId: AGENT_RUNTIME_PARITY_CONFIG.activeEnvironment.id,
    agentId: AGENT_RUNTIME_PARITY_CONFIG.agentId,
    connectionGeneration: 1,
    protocolVersion: 1,
    serverTime: '2026-07-22T01:00:00.000Z',
  },
});

export const AGENT_RUNTIME_PARITY_BROWSER_REQUEST = JSON.stringify({
  jsonrpc: '2.0',
  id: 'parity-command',
  method: 'browser.capturePage',
  params: {
    authPolicy: 'anonymous',
    siteId: 'example',
    url: 'https://example.com/',
  },
  routing: {
    environmentId: AGENT_RUNTIME_PARITY_CONFIG.activeEnvironment.id,
    agentId: AGENT_RUNTIME_PARITY_CONFIG.agentId,
    connectionGeneration: 1,
  },
});
