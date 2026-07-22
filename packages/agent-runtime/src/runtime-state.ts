export const AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION = 1;

export type AgentRuntimeProcessState =
  | 'starting'
  | 'switching'
  | 'ready'
  | 'degraded'
  | 'stopping'
  | 'stopped';
