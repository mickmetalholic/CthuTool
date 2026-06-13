import type { PublicAgentStatus } from '@cthutool/agent-protocol';

export type ConnectedAgentsResponse = {
  readonly agents: PublicAgentStatus[];
};

export type BrowserSiteSummary = {
  readonly siteId: string;
  readonly displayName: string;
  readonly allowedOrigins: readonly string[];
  readonly authPolicy: 'anonymous' | 'required';
  readonly loginUrl?: string;
  readonly profileName?: string;
  readonly verifyUrl?: string;
};

export type BrowserProfileSummary = {
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName: string;
  readonly status: string;
  readonly updatedAt: string;
};

export type BrowserPendingAuthTask = {
  readonly id: string;
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName: string;
  readonly reason: string;
  readonly updatedAt: string;
};

export type BrowserStatus = {
  readonly pendingAuthTasks: BrowserPendingAuthTask[];
  readonly profiles: BrowserProfileSummary[];
  readonly sites: BrowserSiteSummary[];
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

export async function fetchBrowserStatus(
  backendUrl: string,
): Promise<BrowserStatus> {
  const baseUrl = backendUrl.replace(/\/+$/, '');
  const [sites, profiles, pendingAuthTasks] = await Promise.all([
    fetchArray<BrowserSiteSummary>(`${baseUrl}/api/browser/sites`, 'sites'),
    fetchArray<BrowserProfileSummary>(
      `${baseUrl}/api/browser/profiles`,
      'profiles',
    ),
    fetchArray<BrowserPendingAuthTask>(
      `${baseUrl}/api/browser/pending-auth-tasks`,
      'tasks',
    ),
  ]);
  return {
    pendingAuthTasks,
    profiles,
    sites,
  };
}

async function fetchArray<T>(url: string, key: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Browser status request failed (${response.status})`);
  }
  const body = (await response.json()) as Record<string, unknown>;
  const value = body[key];
  return Array.isArray(value) ? (value as T[]) : [];
}
