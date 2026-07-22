import * as v from 'valibot';

export const AGENT_BRIDGE_PROTOCOL_VERSION = 1;
export const AGENT_BRIDGE_SUPPORTED_VERSIONS = [
  AGENT_BRIDGE_PROTOCOL_VERSION,
] as const;
export const AGENT_BRIDGE_ERROR_CODES = [
  'HOST_DENIED',
  'ORIGIN_DENIED',
  'CONTENT_TYPE_REQUIRED',
  'INVALID_REQUEST',
  'TICKET_INVALID',
  'TICKET_EXPIRED',
  'ENVIRONMENT_MISMATCH',
  'INSTANCE_MISMATCH',
  'VERSION_INCOMPATIBLE',
  'SESSION_INVALID',
  'SESSION_EXPIRED',
  'CONFIRMATION_REQUIRED',
  'PROFILE_LOCKED',
  'METHOD_NOT_ALLOWED',
  'RESOURCE_NOT_FOUND',
  'LIFECYCLE_UNAVAILABLE',
  'BROWSER_COMMAND_REJECTED',
  'INTERNAL_ERROR',
] as const;

export const AGENT_BRIDGE_RPC_METHODS = [
  'settings.update',
  'profile.delete',
  'lifecycle.action',
  'browser.command',
] as const;

const EnvironmentIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z][a-z0-9-]{0,63}$/),
);
const IdentifierSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
  v.regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/),
);
const TokenSchema = v.pipe(
  v.string(),
  v.minLength(32),
  v.maxLength(512),
  v.regex(/^[a-zA-Z0-9_-]+$/),
);
const ProtocolVersionSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const ResourceTextSchema = v.pipe(v.string(), v.maxLength(2_048));
const ResourceTimestampSchema = v.pipe(v.string(), v.isoTimestamp());

export const AgentBridgeSessionExchangeSchema = v.strictObject({
  ticket: TokenSchema,
  environmentId: EnvironmentIdSchema,
  instanceId: IdentifierSchema,
  supportedVersions: v.pipe(
    v.array(ProtocolVersionSchema),
    v.minLength(1),
    v.maxLength(8),
  ),
});

export const AgentBridgeSettingsPatchSchema = v.strictObject({
  deviceName: v.optional(
    v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(128)),
  ),
  connectionEnabled: v.optional(v.boolean()),
  browserExecutablePath: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(2048)),
  ),
});

export const AgentBridgeRpcRequestSchema = v.strictObject({
  protocolVersion: v.literal(AGENT_BRIDGE_PROTOCOL_VERSION),
  id: v.union([
    v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(128)),
    v.pipe(v.number(), v.integer()),
  ]),
  method: v.picklist(AGENT_BRIDGE_RPC_METHODS),
  params: v.optional(v.unknown()),
});

export const AgentBridgeResourceSnapshotSchema = v.object({
  protocolVersion: v.literal(AGENT_BRIDGE_PROTOCOL_VERSION),
  environment: v.object({
    id: EnvironmentIdSchema,
    label: ResourceTextSchema,
    webOrigin: ResourceTextSchema,
    backendHttpUrl: ResourceTextSchema,
  }),
  agent: v.object({
    id: IdentifierSchema,
    deviceName: ResourceTextSchema,
    version: ResourceTextSchema,
    processState: ResourceTextSchema,
    backendStatus: ResourceTextSchema,
  }),
  browser: v.object({
    ready: v.boolean(),
    status: ResourceTextSchema,
    message: ResourceTextSchema,
    executablePathConfigured: v.boolean(),
    executablePath: v.optional(ResourceTextSchema),
  }),
  profiles: v.pipe(
    v.array(
      v.object({
        siteId: IdentifierSchema,
        profileName: IdentifierSchema,
        status: ResourceTextSchema,
        displayName: v.optional(ResourceTextSchema),
        updatedAt: ResourceTimestampSchema,
        verifiedAt: v.optional(ResourceTimestampSchema),
      }),
    ),
    v.maxLength(500),
  ),
  autostart: v.object({
    supported: v.boolean(),
    enabled: v.boolean(),
  }),
  secret: v.object({
    status: v.picklist(['configured', 'missing', 'invalid']),
  }),
  diagnostics: v.pipe(
    v.array(
      v.object({
        timestamp: ResourceTimestampSchema,
        level: ResourceTextSchema,
        event: ResourceTextSchema,
        message: ResourceTextSchema,
      }),
    ),
    v.maxLength(100),
  ),
});

export type AgentBridgeErrorCode = (typeof AGENT_BRIDGE_ERROR_CODES)[number];
export type AgentBridgeRpcMethod = (typeof AGENT_BRIDGE_RPC_METHODS)[number];
export type AgentBridgeSessionExchange = v.InferOutput<
  typeof AgentBridgeSessionExchangeSchema
>;
export type AgentBridgeSettingsPatch = v.InferOutput<
  typeof AgentBridgeSettingsPatchSchema
>;
export type AgentBridgeRpcRequest = v.InferOutput<
  typeof AgentBridgeRpcRequestSchema
>;

export type AgentBridgeBootstrap = {
  readonly protocolVersion: typeof AGENT_BRIDGE_PROTOCOL_VERSION;
  readonly supportedVersions: readonly number[];
  readonly instanceId: string;
  readonly environmentId: string;
};

export type AgentBridgeSession = {
  readonly protocolVersion: typeof AGENT_BRIDGE_PROTOCOL_VERSION;
  readonly sessionToken: string;
  readonly expiresAt: string;
  readonly instanceId: string;
  readonly environmentId: string;
};

export type AgentBridgeResourceSnapshot = v.InferOutput<
  typeof AgentBridgeResourceSnapshotSchema
>;

export type AgentBridgeRpcSuccess = {
  readonly ok: true;
  readonly protocolVersion: typeof AGENT_BRIDGE_PROTOCOL_VERSION;
  readonly id: string | number;
  readonly result: unknown;
};

export type AgentBridgeFailure = {
  readonly ok: false;
  readonly protocolVersion: typeof AGENT_BRIDGE_PROTOCOL_VERSION;
  readonly error: {
    readonly code: AgentBridgeErrorCode;
    readonly message: string;
  };
};

export type AgentBridgeResponse = AgentBridgeRpcSuccess | AgentBridgeFailure;

export type BridgeValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

export function validateAgentBridgeSessionExchange(
  input: unknown,
): BridgeValidationResult<AgentBridgeSessionExchange> {
  return parse(AgentBridgeSessionExchangeSchema, input);
}

export function validateAgentBridgeRpcRequest(
  input: unknown,
): BridgeValidationResult<AgentBridgeRpcRequest> {
  return parse(AgentBridgeRpcRequestSchema, input);
}

export function validateAgentBridgeSettingsPatch(
  input: unknown,
): BridgeValidationResult<AgentBridgeSettingsPatch> {
  const result = parse(AgentBridgeSettingsPatchSchema, input);
  if (!result.ok) {
    return result;
  }
  return Object.values(result.value).some((value) => value !== undefined)
    ? result
    : { ok: false, message: 'settings patch must change a supported field' };
}

export function validateAgentBridgeResourceSnapshot(
  input: unknown,
): BridgeValidationResult<AgentBridgeResourceSnapshot> {
  return parse(AgentBridgeResourceSnapshotSchema, input);
}

export function bridgeFailure(
  code: AgentBridgeErrorCode,
  message: string,
): AgentBridgeFailure {
  return {
    error: { code, message },
    ok: false,
    protocolVersion: AGENT_BRIDGE_PROTOCOL_VERSION,
  };
}

function parse<TSchema extends v.GenericSchema>(
  schema: TSchema,
  input: unknown,
): BridgeValidationResult<v.InferOutput<TSchema>> {
  if (containsForbiddenMetadata(input)) {
    return { ok: false, message: 'bridge request contains forbidden metadata' };
  }
  const result = v.safeParse(schema, input);
  return result.success
    ? { ok: true, value: result.output }
    : {
        ok: false,
        message: result.issues
          .slice(0, 3)
          .map((issue) => issue.message)
          .join('; '),
      };
}

function containsForbiddenMetadata(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some(containsForbiddenMetadata);
  }
  if (!input || typeof input !== 'object') {
    return false;
  }
  for (const [key, value] of Object.entries(input)) {
    if (
      /agentSecret|authorization|bearer|bridgeTicket|cookie|operatorPassword|sessionToken/i.test(
        key,
      ) &&
      key !== 'ticket'
    ) {
      return true;
    }
    if (containsForbiddenMetadata(value)) {
      return true;
    }
  }
  return false;
}
