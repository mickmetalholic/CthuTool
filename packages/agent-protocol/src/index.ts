import * as v from 'valibot';

const AGENT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const CAPABILITY_PATTERN = /^[a-z][a-z0-9._:-]{0,63}$/;

export const AGENT_PLATFORMS = ['darwin', 'win32', 'linux', 'unknown'] as const;

const AgentIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
  v.regex(AGENT_ID_PATTERN),
);

const NonEmptyDisplayStringSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
);

const VersionSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
);

const CapabilitySchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(CAPABILITY_PATTERN),
);

export const AgentHelloPayloadSchema = v.object({
  agentId: AgentIdSchema,
  deviceName: NonEmptyDisplayStringSchema,
  platform: v.picklist(AGENT_PLATFORMS),
  version: VersionSchema,
  capabilities: v.array(CapabilitySchema),
});

export const AgentHelloMessageSchema = v.object({
  type: v.literal('agent.hello'),
  payload: AgentHelloPayloadSchema,
});

export const AgentHeartbeatPayloadSchema = v.object({
  agentId: AgentIdSchema,
  sentAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
});

export const AgentHeartbeatMessageSchema = v.object({
  type: v.literal('agent.heartbeat'),
  payload: AgentHeartbeatPayloadSchema,
});

export const AgentClientMessageSchema = v.variant('type', [
  AgentHelloMessageSchema,
  AgentHeartbeatMessageSchema,
]);

export const AgentRegisteredMessageSchema = v.object({
  type: v.literal('agent.registered'),
  payload: v.object({
    agentId: AgentIdSchema,
    serverTime: v.pipe(v.string(), v.isoTimestamp()),
  }),
});

export const AgentErrorMessageSchema = v.object({
  type: v.literal('agent.error'),
  payload: v.object({
    code: NonEmptyDisplayStringSchema,
    message: NonEmptyDisplayStringSchema,
  }),
});

export const PublicAgentStatusSchema = v.object({
  agentId: AgentIdSchema,
  connectionId: NonEmptyDisplayStringSchema,
  deviceName: NonEmptyDisplayStringSchema,
  platform: v.picklist(AGENT_PLATFORMS),
  version: VersionSchema,
  capabilities: v.array(CapabilitySchema),
  connectedAt: v.pipe(v.string(), v.isoTimestamp()),
  lastSeenAt: v.pipe(v.string(), v.isoTimestamp()),
  state: v.literal('online'),
});

export type AgentPlatform = v.InferOutput<
  typeof AgentHelloPayloadSchema
>['platform'];
export type AgentHelloPayload = v.InferOutput<typeof AgentHelloPayloadSchema>;
export type AgentHelloMessage = v.InferOutput<typeof AgentHelloMessageSchema>;
export type AgentHeartbeatPayload = v.InferOutput<
  typeof AgentHeartbeatPayloadSchema
>;
export type AgentHeartbeatMessage = v.InferOutput<
  typeof AgentHeartbeatMessageSchema
>;
export type AgentClientMessage = v.InferOutput<typeof AgentClientMessageSchema>;
export type AgentRegisteredMessage = v.InferOutput<
  typeof AgentRegisteredMessageSchema
>;
export type AgentErrorMessage = v.InferOutput<typeof AgentErrorMessageSchema>;
export type PublicAgentStatus = v.InferOutput<typeof PublicAgentStatusSchema>;

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

export function validateAgentHelloMessage(
  input: unknown,
): ValidationResult<AgentHelloMessage> {
  return parseSchema(AgentHelloMessageSchema, input);
}

export function validateAgentHeartbeatMessage(
  input: unknown,
): ValidationResult<AgentHeartbeatMessage> {
  return parseSchema(AgentHeartbeatMessageSchema, input);
}

export function validateAgentClientMessage(
  input: unknown,
): ValidationResult<AgentClientMessage> {
  return parseSchema(AgentClientMessageSchema, input);
}

export function parseAgentClientMessageJson(
  input: string,
): ValidationResult<AgentClientMessage> {
  try {
    return validateAgentClientMessage(JSON.parse(input));
  } catch {
    return { ok: false, message: 'agent message must be valid JSON' };
  }
}

export function createAgentRegisteredMessage(
  agentId: string,
  serverTime: string,
): AgentRegisteredMessage {
  return {
    type: 'agent.registered',
    payload: {
      agentId,
      serverTime,
    },
  };
}

export function createAgentErrorMessage(
  code: string,
  message: string,
): AgentErrorMessage {
  return {
    type: 'agent.error',
    payload: {
      code,
      message,
    },
  };
}

function parseSchema<TSchema extends v.GenericSchema>(
  schema: TSchema,
  input: unknown,
): ValidationResult<v.InferOutput<TSchema>> {
  const result = v.safeParse(schema, input);
  if (result.success) {
    return { ok: true, value: result.output };
  }
  return {
    ok: false,
    message: summarizeIssues(result.issues),
  };
}

function summarizeIssues(issues: readonly v.BaseIssue<unknown>[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => issue.message)
    .join('; ');
}
