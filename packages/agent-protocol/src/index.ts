import * as v from 'valibot';

const AGENT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const ENVIRONMENT_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const CAPABILITY_PATTERN = /^[a-z][a-z0-9._:-]{0,63}$/;
const OBSERVABILITY_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const OPERATION_NAME_PATTERN = /^[a-z][a-zA-Z0-9._:-]{0,127}$/;

export const JSON_RPC_VERSION = '2.0';
export const AGENT_PROTOCOL_VERSION = 1;
export const JSON_RPC_PARSE_ERROR = -32700;
export const JSON_RPC_INVALID_REQUEST = -32600;
export const JSON_RPC_METHOD_NOT_FOUND = -32601;
export const JSON_RPC_INVALID_PARAMS = -32602;
export const JSON_RPC_INTERNAL_ERROR = -32603;

export const AGENT_PLATFORMS = ['darwin', 'win32', 'linux', 'unknown'] as const;
export const AGENT_LIFECYCLE_MESSAGE_TYPES = [
  'agent.hello',
  'agent.heartbeat',
  'agent.registered',
  'agent.error',
] as const;
export const AGENT_CLIENT_LIFECYCLE_MESSAGE_TYPES = [
  'agent.hello',
  'agent.heartbeat',
] as const;
export const AGENT_SERVER_LIFECYCLE_MESSAGE_TYPES = [
  'agent.registered',
  'agent.error',
] as const;

const AgentIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
  v.regex(AGENT_ID_PATTERN),
);

const EnvironmentIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(ENVIRONMENT_ID_PATTERN),
);

const ConnectionGenerationSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
);

const ProtocolVersionSchema = v.literal(AGENT_PROTOCOL_VERSION);

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

const JsonRpcIdSchema = v.union([
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(128)),
  v.pipe(v.number(), v.integer()),
]);

const JsonRpcMethodSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
);

const JsonRpcVersionSchema = v.literal(JSON_RPC_VERSION);

const ObservabilityIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
  v.regex(OBSERVABILITY_ID_PATTERN),
);

const OperationNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
  v.regex(OPERATION_NAME_PATTERN),
);

export const AgentObservabilityMetadataSchema = v.object({
  requestId: v.optional(ObservabilityIdSchema),
  traceId: v.optional(ObservabilityIdSchema),
  parentId: v.optional(ObservabilityIdSchema),
  operation: v.optional(OperationNameSchema),
  commandId: v.optional(JsonRpcIdSchema),
});

export const AgentCommandRoutingSchema = v.object({
  environmentId: EnvironmentIdSchema,
  agentId: AgentIdSchema,
  connectionGeneration: ConnectionGenerationSchema,
});

export const AgentHelloPayloadSchema = v.object({
  environmentId: EnvironmentIdSchema,
  agentId: AgentIdSchema,
  protocolVersion: ProtocolVersionSchema,
  deviceName: NonEmptyDisplayStringSchema,
  platform: v.picklist(AGENT_PLATFORMS),
  version: VersionSchema,
  capabilities: v.array(CapabilitySchema),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const AgentHelloMessageSchema = v.object({
  type: v.literal('agent.hello'),
  payload: AgentHelloPayloadSchema,
});

export const AgentHeartbeatPayloadSchema = v.object({
  environmentId: EnvironmentIdSchema,
  agentId: AgentIdSchema,
  connectionGeneration: v.optional(ConnectionGenerationSchema),
  sentAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const AgentHeartbeatMessageSchema = v.object({
  type: v.literal('agent.heartbeat'),
  payload: AgentHeartbeatPayloadSchema,
});

export const AgentRegisteredMessageSchema = v.object({
  type: v.literal('agent.registered'),
  payload: v.object({
    environmentId: EnvironmentIdSchema,
    agentId: AgentIdSchema,
    connectionGeneration: ConnectionGenerationSchema,
    protocolVersion: ProtocolVersionSchema,
    serverTime: v.pipe(v.string(), v.isoTimestamp()),
    observability: v.optional(AgentObservabilityMetadataSchema),
  }),
});

export const AgentErrorMessageSchema = v.object({
  type: v.literal('agent.error'),
  payload: v.object({
    code: NonEmptyDisplayStringSchema,
    message: NonEmptyDisplayStringSchema,
    observability: v.optional(AgentObservabilityMetadataSchema),
  }),
});

export const AgentClientLifecycleMessageSchema = v.variant('type', [
  AgentHelloMessageSchema,
  AgentHeartbeatMessageSchema,
]);

export const AgentServerLifecycleMessageSchema = v.variant('type', [
  AgentRegisteredMessageSchema,
  AgentErrorMessageSchema,
]);

export const AgentLifecycleMessageSchema = v.variant('type', [
  AgentHelloMessageSchema,
  AgentHeartbeatMessageSchema,
  AgentRegisteredMessageSchema,
  AgentErrorMessageSchema,
]);

export const JsonRpcRequestSchema = v.object({
  jsonrpc: JsonRpcVersionSchema,
  id: JsonRpcIdSchema,
  method: JsonRpcMethodSchema,
  params: v.optional(v.unknown()),
  observability: v.optional(AgentObservabilityMetadataSchema),
  routing: v.optional(AgentCommandRoutingSchema),
});

export const JsonRpcErrorObjectSchema = v.object({
  code: v.pipe(v.number(), v.integer()),
  message: NonEmptyDisplayStringSchema,
  data: v.optional(v.unknown()),
});

export const JsonRpcSuccessResponseSchema = v.object({
  jsonrpc: JsonRpcVersionSchema,
  id: JsonRpcIdSchema,
  result: v.unknown(),
  observability: v.optional(AgentObservabilityMetadataSchema),
  routing: v.optional(AgentCommandRoutingSchema),
});

export const JsonRpcErrorResponseSchema = v.object({
  jsonrpc: JsonRpcVersionSchema,
  id: JsonRpcIdSchema,
  error: JsonRpcErrorObjectSchema,
  observability: v.optional(AgentObservabilityMetadataSchema),
  routing: v.optional(AgentCommandRoutingSchema),
});

export const JsonRpcResponseSchema = v.union([
  JsonRpcSuccessResponseSchema,
  JsonRpcErrorResponseSchema,
]);

export const AgentClientMessageSchema = v.union([
  AgentClientLifecycleMessageSchema,
  JsonRpcResponseSchema,
]);

export const AgentServerMessageSchema = v.union([
  AgentServerLifecycleMessageSchema,
  JsonRpcRequestSchema,
]);

export const PublicAgentStatusSchema = v.object({
  environmentId: EnvironmentIdSchema,
  agentId: AgentIdSchema,
  connectionGeneration: ConnectionGenerationSchema,
  protocolVersion: ProtocolVersionSchema,
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
export type AgentLifecycleMessageType =
  (typeof AGENT_LIFECYCLE_MESSAGE_TYPES)[number];
export type AgentClientLifecycleMessageType =
  (typeof AGENT_CLIENT_LIFECYCLE_MESSAGE_TYPES)[number];
export type AgentServerLifecycleMessageType =
  (typeof AGENT_SERVER_LIFECYCLE_MESSAGE_TYPES)[number];
export type AgentHelloPayload = v.InferOutput<typeof AgentHelloPayloadSchema>;
export type AgentHelloMessage = v.InferOutput<typeof AgentHelloMessageSchema>;
export type AgentHeartbeatPayload = v.InferOutput<
  typeof AgentHeartbeatPayloadSchema
>;
export type AgentHeartbeatMessage = v.InferOutput<
  typeof AgentHeartbeatMessageSchema
>;
export type AgentObservabilityMetadata = v.InferOutput<
  typeof AgentObservabilityMetadataSchema
>;
export type AgentCommandRouting = v.InferOutput<
  typeof AgentCommandRoutingSchema
>;
export type AgentRegisteredMessage = v.InferOutput<
  typeof AgentRegisteredMessageSchema
>;
export type AgentErrorMessage = v.InferOutput<typeof AgentErrorMessageSchema>;
export type AgentClientLifecycleMessage = v.InferOutput<
  typeof AgentClientLifecycleMessageSchema
>;
export type AgentServerLifecycleMessage = v.InferOutput<
  typeof AgentServerLifecycleMessageSchema
>;
export type AgentLifecycleMessage = v.InferOutput<
  typeof AgentLifecycleMessageSchema
>;
export type JsonRpcId = v.InferOutput<typeof JsonRpcRequestSchema>['id'];
export type JsonRpcRequest<TParams = unknown> = {
  readonly jsonrpc: typeof JSON_RPC_VERSION;
  readonly id: JsonRpcId;
  readonly method: string;
  readonly params?: TParams;
  readonly observability?: AgentObservabilityMetadata;
  readonly routing?: AgentCommandRouting;
};
export type JsonRpcErrorObject<TData = unknown> = {
  readonly code: number;
  readonly message: string;
  readonly data?: TData;
};
export type JsonRpcSuccessResponse<TResult = unknown> = {
  readonly jsonrpc: typeof JSON_RPC_VERSION;
  readonly id: JsonRpcId;
  readonly result: TResult;
  readonly observability?: AgentObservabilityMetadata;
  readonly routing?: AgentCommandRouting;
};
export type JsonRpcErrorResponse<TData = unknown> = {
  readonly jsonrpc: typeof JSON_RPC_VERSION;
  readonly id: JsonRpcId;
  readonly error: JsonRpcErrorObject<TData>;
  readonly observability?: AgentObservabilityMetadata;
  readonly routing?: AgentCommandRouting;
};
export type JsonRpcResponse<TResult = unknown, TErrorData = unknown> =
  | JsonRpcSuccessResponse<TResult>
  | JsonRpcErrorResponse<TErrorData>;
export type AgentClientMessage = v.InferOutput<typeof AgentClientMessageSchema>;
export type AgentServerMessage = v.InferOutput<typeof AgentServerMessageSchema>;
export type PublicAgentStatus = v.InferOutput<typeof PublicAgentStatusSchema>;

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

export function validateAgentHelloMessage(
  input: unknown,
): ValidationResult<AgentHelloMessage> {
  if (containsForbiddenPublicMetadata(input)) {
    return { ok: false, message: 'agent lifecycle metadata contains secrets' };
  }
  return parseSchema(AgentHelloMessageSchema, input);
}

export function validateAgentHeartbeatMessage(
  input: unknown,
): ValidationResult<AgentHeartbeatMessage> {
  if (containsForbiddenPublicMetadata(input)) {
    return { ok: false, message: 'agent lifecycle metadata contains secrets' };
  }
  return parseSchema(AgentHeartbeatMessageSchema, input);
}

export function validateAgentClientLifecycleMessage(
  input: unknown,
): ValidationResult<AgentClientLifecycleMessage> {
  if (containsForbiddenPublicMetadata(input)) {
    return { ok: false, message: 'agent lifecycle metadata contains secrets' };
  }
  return parseSchema(AgentClientLifecycleMessageSchema, input);
}

export function validateAgentServerLifecycleMessage(
  input: unknown,
): ValidationResult<AgentServerLifecycleMessage> {
  if (containsForbiddenPublicMetadata(input)) {
    return { ok: false, message: 'agent lifecycle metadata contains secrets' };
  }
  return parseSchema(AgentServerLifecycleMessageSchema, input);
}

export function validateAgentLifecycleMessage(
  input: unknown,
): ValidationResult<AgentLifecycleMessage> {
  if (containsForbiddenPublicMetadata(input)) {
    return { ok: false, message: 'agent lifecycle metadata contains secrets' };
  }
  return parseSchema(AgentLifecycleMessageSchema, input);
}

export function validateJsonRpcRequest(
  input: unknown,
): ValidationResult<JsonRpcRequest> {
  return parseSchema(
    JsonRpcRequestSchema,
    input,
  ) as ValidationResult<JsonRpcRequest>;
}

export function validateJsonRpcResponse(
  input: unknown,
): ValidationResult<JsonRpcResponse> {
  if (
    input &&
    typeof input === 'object' &&
    'error' in input &&
    containsForbiddenPublicMetadata((input as { error?: unknown }).error)
  ) {
    return { ok: false, message: 'agent error data contains secrets' };
  }
  return parseSchema(
    JsonRpcResponseSchema,
    input,
  ) as ValidationResult<JsonRpcResponse>;
}

export function validateAgentClientMessage(
  input: unknown,
): ValidationResult<AgentClientMessage> {
  if (containsForbiddenAgentMessageMetadata(input)) {
    return { ok: false, message: 'agent message metadata contains secrets' };
  }
  return parseSchema(AgentClientMessageSchema, input);
}

export function validateAgentServerMessage(
  input: unknown,
): ValidationResult<AgentServerMessage> {
  if (
    input &&
    typeof input === 'object' &&
    'type' in input &&
    containsForbiddenPublicMetadata(input)
  ) {
    return { ok: false, message: 'agent lifecycle metadata contains secrets' };
  }
  return parseSchema(AgentServerMessageSchema, input);
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

export function parseAgentServerMessageJson(
  input: string,
): ValidationResult<AgentServerMessage> {
  try {
    return validateAgentServerMessage(JSON.parse(input));
  } catch {
    return { ok: false, message: 'agent server message must be valid JSON' };
  }
}

export function parseAgentLifecycleMessage(
  input: unknown,
): ValidationResult<AgentLifecycleMessage> {
  return validateAgentLifecycleMessage(input);
}

export function isAgentLifecycleMessage(
  input: unknown,
): input is AgentLifecycleMessage {
  return validateAgentLifecycleMessage(input).ok;
}

export function isJsonRpcRequest(input: unknown): input is JsonRpcRequest {
  return validateJsonRpcRequest(input).ok;
}

export function isJsonRpcResponse(input: unknown): input is JsonRpcResponse {
  return validateJsonRpcResponse(input).ok;
}

export function isJsonRpcErrorResponse(
  input: JsonRpcResponse,
): input is JsonRpcErrorResponse {
  return 'error' in input;
}

export function createAgentRegisteredMessage(input: {
  readonly environmentId: string;
  readonly agentId: string;
  readonly connectionGeneration: number;
  readonly protocolVersion?: typeof AGENT_PROTOCOL_VERSION;
  readonly serverTime: string;
}): AgentRegisteredMessage {
  return {
    type: 'agent.registered',
    payload: {
      environmentId: input.environmentId,
      agentId: input.agentId,
      connectionGeneration: input.connectionGeneration,
      protocolVersion: input.protocolVersion ?? AGENT_PROTOCOL_VERSION,
      serverTime: input.serverTime,
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

export function createJsonRpcRequest<TParams = unknown>(input: {
  readonly id: JsonRpcId;
  readonly method: string;
  readonly params?: TParams;
  readonly observability?: AgentObservabilityMetadata;
  readonly routing?: AgentCommandRouting;
}): JsonRpcRequest<TParams> {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id: input.id,
    method: input.method,
    ...(input.params === undefined ? {} : { params: input.params }),
    ...(input.observability ? { observability: input.observability } : {}),
    ...(input.routing ? { routing: input.routing } : {}),
  };
}

export function createJsonRpcSuccessResponse<TResult = unknown>(
  id: JsonRpcId,
  result: TResult,
  observability?: AgentObservabilityMetadata,
  routing?: AgentCommandRouting,
): JsonRpcSuccessResponse<TResult> {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
    ...(observability ? { observability } : {}),
    ...(routing ? { routing } : {}),
  };
}

export function createJsonRpcErrorResponse<TData = unknown>(
  id: JsonRpcId,
  error: JsonRpcErrorObject<TData>,
  observability?: AgentObservabilityMetadata,
  routing?: AgentCommandRouting,
): JsonRpcErrorResponse<TData> {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    error,
    ...(observability ? { observability } : {}),
    ...(routing ? { routing } : {}),
  };
}

function parseSchema<TSchema extends v.GenericSchema>(
  schema: TSchema,
  input: unknown,
): ValidationResult<v.InferOutput<TSchema>> {
  if (containsUnsafeObservabilityMetadata(input)) {
    return {
      ok: false,
      message: 'observability metadata contains unsupported fields',
    };
  }
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

const OBSERVABILITY_METADATA_KEYS = new Set([
  'requestId',
  'traceId',
  'parentId',
  'operation',
  'commandId',
]);

const FORBIDDEN_PUBLIC_METADATA_KEY =
  /authorization|bridge.?ticket|cookie|operator|password|secret|session|token/i;

function containsForbiddenPublicMetadata(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some((item) => containsForbiddenPublicMetadata(item));
  }
  if (!input || typeof input !== 'object') {
    return false;
  }
  return Object.entries(input).some(
    ([key, value]) =>
      FORBIDDEN_PUBLIC_METADATA_KEY.test(key) ||
      containsForbiddenPublicMetadata(value),
  );
}

function containsForbiddenAgentMessageMetadata(input: unknown): boolean {
  if (!input || typeof input !== 'object') {
    return false;
  }
  if ('type' in input) {
    return containsForbiddenPublicMetadata(input);
  }
  if ('error' in input) {
    return containsForbiddenPublicMetadata(
      (input as { readonly error?: unknown }).error,
    );
  }
  return false;
}

function containsUnsafeObservabilityMetadata(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some((item) => containsUnsafeObservabilityMetadata(item));
  }
  if (!input || typeof input !== 'object') {
    return false;
  }
  for (const [key, value] of Object.entries(input)) {
    if (key === 'observability') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        continue;
      }
      if (
        Object.keys(value).some(
          (metadataKey) => !OBSERVABILITY_METADATA_KEYS.has(metadataKey),
        )
      ) {
        return true;
      }
    }
    if (containsUnsafeObservabilityMetadata(value)) {
      return true;
    }
  }
  return false;
}
