import type { PublicAgentStatus } from '@cthutool/agent-protocol';

export type ConnectedAgentsResponse = {
  readonly agents: PublicAgentStatus[];
};

export async function fetchConnectedAgents(
  backendUrl: string,
): Promise<PublicAgentStatus[]> {
  const response = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/agents`);
  if (!response.ok) {
    throw new Error(`Agent list request failed (${response.status})`);
  }
  const body = (await response.json()) as ConnectedAgentsResponse;
  return body.agents;
}
