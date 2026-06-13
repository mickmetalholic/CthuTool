import type {
  AgentHelloPayload,
  PublicAgentStatus,
} from '@cthutool/agent-protocol';

export type AgentConnectionState = {
  readonly connectionId: string;
  readonly agentId?: string;
};

export type RegisterAgentInput = {
  readonly connectionId: string;
  readonly hello: AgentHelloPayload;
  readonly now?: Date;
};

export type RegisterAgentResult = {
  readonly status: PublicAgentStatus;
  readonly replacedConnectionId?: string;
};

export type HeartbeatResult =
  | { readonly ok: true; readonly status: PublicAgentStatus }
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
  | 'agent_browser_state_snapshot'
  | 'agent_snapshot_stale'
  | 'invalid_payload';
