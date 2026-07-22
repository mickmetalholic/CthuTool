import type {
  AgentHelloPayload,
  PublicAgentStatus,
} from '@cthutool/agent-protocol';

export type AgentConnectionState = {
  readonly connectionId: string;
  readonly environmentId?: string;
  readonly agentId?: string;
};

export type AgentRegistryStatus = PublicAgentStatus & {
  readonly connectionId: string;
};

export type RegisterAgentInput = {
  readonly connectionId: string;
  readonly authenticatedEnvironmentId?: string;
  readonly hello: AgentHelloPayload;
  readonly now?: Date;
};

export type RegisterAgentResult = {
  readonly status: AgentRegistryStatus;
  readonly replacedConnectionId?: string;
};

export type HeartbeatResult =
  | { readonly ok: true; readonly status: AgentRegistryStatus }
  | {
      readonly ok: false;
      readonly reason: 'agent_not_found' | 'connection_not_authoritative';
    };

export type AgentRegistryEvent =
  | 'socket_connected'
  | 'agent_registered'
  | 'agent_reconnected'
  | 'agent_heartbeat'
  | 'agent_disconnected'
  | 'agent_stale'
  | 'invalid_payload'
  | 'authentication_failed';
