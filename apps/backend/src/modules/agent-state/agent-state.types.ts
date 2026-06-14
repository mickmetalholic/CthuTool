import type {
  BrowserPendingAuthTaskSummary,
  BrowserProfileSummary,
} from '@cthutool/agent-protocol';

export type AgentBrowserProfile = BrowserProfileSummary;
export type AgentBrowserPendingAuthTask = BrowserPendingAuthTaskSummary;

export type AgentBrowserProfileStatus = {
  readonly profileName: string;
  readonly status: 'available' | 'missing' | 'invalid';
  readonly updatedAt?: string;
};

export type UpsertAgentBrowserPendingAuthTaskInput = {
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName: string;
  readonly reason: AgentBrowserPendingAuthTask['reason'];
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
};
