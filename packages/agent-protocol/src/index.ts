import * as v from 'valibot';

const AGENT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const CAPABILITY_PATTERN = /^[a-z][a-z0-9._:-]{0,63}$/;
const SITE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const PROFILE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const OBSERVABILITY_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const OPERATION_NAME_PATTERN = /^[a-z][a-zA-Z0-9._:-]{0,127}$/;

export const AGENT_PLATFORMS = ['darwin', 'win32', 'linux', 'unknown'] as const;
export const BROWSER_CAPABILITY = 'browser';
export const BROWSER_AUTH_POLICIES = ['anonymous', 'required'] as const;
export const BROWSER_COMMANDS = [
  'browser.capturePage',
  'browser.verifyProfile',
  'browser.openLogin',
  'browser.clearProfile',
] as const;
export const BROWSER_RESOURCE_TYPES = [
  'document',
  'font',
  'image',
  'media',
  'script',
  'stylesheet',
  'xhr',
  'fetch',
] as const;
export const BROWSER_DETECTION_KINDS = [
  'ok',
  'login_required',
  'rate_limited',
  'captcha_required',
  'blocked',
] as const;
export const BROWSER_PROFILE_STATUSES = [
  'missing',
  'login_required',
  'verifying',
  'verified',
  'expired',
  'blocked',
] as const;
export const BROWSER_PENDING_AUTH_REASONS = [
  'missing',
  'expired',
  'blocked',
  'verification_failed',
] as const;

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

const CommandIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
);

const SiteIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(SITE_ID_PATTERN),
);

const ProfileNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(PROFILE_NAME_PATTERN),
);

const HttpUrlSchema = v.pipe(v.string(), v.url());

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
  commandId: v.optional(CommandIdSchema),
});

export const AgentHelloPayloadSchema = v.object({
  agentId: AgentIdSchema,
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
  agentId: AgentIdSchema,
  sentAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const AgentHeartbeatMessageSchema = v.object({
  type: v.literal('agent.heartbeat'),
  payload: AgentHeartbeatPayloadSchema,
});

export const BrowserProfileSummarySchema = v.object({
  agentId: AgentIdSchema,
  siteId: SiteIdSchema,
  profileName: ProfileNameSchema,
  status: v.picklist(BROWSER_PROFILE_STATUSES),
  displayName: v.optional(NonEmptyDisplayStringSchema),
  externalUserId: v.optional(NonEmptyDisplayStringSchema),
  verifiedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const BrowserProfileStatusMessageSchema = v.object({
  type: v.literal('browser.profileStatus'),
  payload: BrowserProfileSummarySchema,
});

export const BrowserPendingAuthTaskSummarySchema = v.object({
  agentId: AgentIdSchema,
  id: NonEmptyDisplayStringSchema,
  siteId: SiteIdSchema,
  profileName: ProfileNameSchema,
  reason: v.picklist(BROWSER_PENDING_AUTH_REASONS),
  loginUrl: v.optional(HttpUrlSchema),
  verifyUrl: v.optional(HttpUrlSchema),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const BrowserStateSnapshotPayloadSchema = v.object({
  agentId: AgentIdSchema,
  profiles: v.array(BrowserProfileSummarySchema),
  pendingAuthTasks: v.array(BrowserPendingAuthTaskSummarySchema),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const BrowserStateSnapshotMessageSchema = v.object({
  type: v.literal('browser.stateSnapshot'),
  payload: BrowserStateSnapshotPayloadSchema,
});

export const BrowserCommandPayloadSchema = v.object({
  commandId: CommandIdSchema,
  command: v.picklist(BROWSER_COMMANDS),
  siteId: SiteIdSchema,
  url: v.optional(HttpUrlSchema),
  profileName: v.optional(ProfileNameSchema),
  authPolicy: v.picklist(BROWSER_AUTH_POLICIES),
  loginUrl: v.optional(HttpUrlSchema),
  verifyUrl: v.optional(HttpUrlSchema),
  includeHtml: v.optional(v.boolean()),
  includeText: v.optional(v.boolean()),
  includeScreenshot: v.optional(v.boolean()),
  waitUntil: v.optional(
    v.picklist(['domcontentloaded', 'load', 'networkidle']),
  ),
  timeoutMs: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  blockResources: v.optional(v.array(v.picklist(BROWSER_RESOURCE_TYPES))),
  suppressPendingAuthTask: v.optional(v.boolean()),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const BrowserCommandMessageSchema = v.object({
  type: v.literal('browser.command'),
  payload: BrowserCommandPayloadSchema,
});

export const BrowserDetectionSchema = v.object({
  kind: v.picklist(BROWSER_DETECTION_KINDS),
  reason: v.optional(v.string()),
});

export const BrowserResultPayloadSchema = v.object({
  commandId: CommandIdSchema,
  command: v.picklist(BROWSER_COMMANDS),
  finalUrl: v.optional(HttpUrlSchema),
  status: v.optional(v.pipe(v.number(), v.integer())),
  title: v.optional(v.string()),
  html: v.optional(v.string()),
  text: v.optional(v.string()),
  screenshotBase64: v.optional(v.string()),
  capturedAt: v.pipe(v.string(), v.isoTimestamp()),
  detection: BrowserDetectionSchema,
  profile: v.optional(BrowserProfileSummarySchema),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const BrowserResultMessageSchema = v.object({
  type: v.literal('browser.result'),
  payload: BrowserResultPayloadSchema,
});

export const BrowserErrorPayloadSchema = v.object({
  commandId: CommandIdSchema,
  command: v.picklist(BROWSER_COMMANDS),
  code: NonEmptyDisplayStringSchema,
  message: NonEmptyDisplayStringSchema,
  profileStatus: v.optional(v.picklist(BROWSER_PROFILE_STATUSES)),
  retryable: v.optional(v.boolean()),
  observability: v.optional(AgentObservabilityMetadataSchema),
});

export const BrowserErrorMessageSchema = v.object({
  type: v.literal('browser.error'),
  payload: BrowserErrorPayloadSchema,
});

export const AgentClientMessageSchema = v.variant('type', [
  AgentHelloMessageSchema,
  AgentHeartbeatMessageSchema,
  BrowserResultMessageSchema,
  BrowserErrorMessageSchema,
  BrowserProfileStatusMessageSchema,
  BrowserStateSnapshotMessageSchema,
]);

export const AgentRegisteredMessageSchema = v.object({
  type: v.literal('agent.registered'),
  payload: v.object({
    agentId: AgentIdSchema,
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

export const AgentServerMessageSchema = v.variant('type', [
  AgentRegisteredMessageSchema,
  AgentErrorMessageSchema,
  BrowserCommandMessageSchema,
]);

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
export type AgentObservabilityMetadata = v.InferOutput<
  typeof AgentObservabilityMetadataSchema
>;
export type AgentClientMessage = v.InferOutput<typeof AgentClientMessageSchema>;
export type AgentRegisteredMessage = v.InferOutput<
  typeof AgentRegisteredMessageSchema
>;
export type AgentErrorMessage = v.InferOutput<typeof AgentErrorMessageSchema>;
export type AgentServerMessage = v.InferOutput<typeof AgentServerMessageSchema>;
export type BrowserAuthPolicy = v.InferOutput<
  typeof BrowserCommandPayloadSchema
>['authPolicy'];
export type BrowserCommandName = v.InferOutput<
  typeof BrowserCommandPayloadSchema
>['command'];
export type BrowserCommandPayload = v.InferOutput<
  typeof BrowserCommandPayloadSchema
>;
export type BrowserCommandMessage = v.InferOutput<
  typeof BrowserCommandMessageSchema
>;
export type BrowserDetection = v.InferOutput<typeof BrowserDetectionSchema>;
export type BrowserResultPayload = v.InferOutput<
  typeof BrowserResultPayloadSchema
>;
export type BrowserResultMessage = v.InferOutput<
  typeof BrowserResultMessageSchema
>;
export type BrowserErrorPayload = v.InferOutput<
  typeof BrowserErrorPayloadSchema
>;
export type BrowserErrorMessage = v.InferOutput<
  typeof BrowserErrorMessageSchema
>;
export type BrowserProfileSummary = v.InferOutput<
  typeof BrowserProfileSummarySchema
>;
export type BrowserProfileStatusMessage = v.InferOutput<
  typeof BrowserProfileStatusMessageSchema
>;
export type BrowserPendingAuthTaskSummary = v.InferOutput<
  typeof BrowserPendingAuthTaskSummarySchema
>;
export type BrowserStateSnapshotPayload = v.InferOutput<
  typeof BrowserStateSnapshotPayloadSchema
>;
export type BrowserStateSnapshotMessage = v.InferOutput<
  typeof BrowserStateSnapshotMessageSchema
>;
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
  if (isBrowserStateSnapshotInput(input) && containsRawAuthState(input)) {
    return {
      ok: false,
      message: 'browser state snapshot must not include raw auth state',
    };
  }
  return parseSchema(AgentClientMessageSchema, input);
}

export function validateAgentServerMessage(
  input: unknown,
): ValidationResult<AgentServerMessage> {
  return parseSchema(AgentServerMessageSchema, input);
}

export function validateBrowserCommandMessage(
  input: unknown,
): ValidationResult<BrowserCommandMessage> {
  return parseSchema(BrowserCommandMessageSchema, input);
}

export function validateBrowserResultMessage(
  input: unknown,
): ValidationResult<BrowserResultMessage> {
  return parseSchema(BrowserResultMessageSchema, input);
}

export function validateBrowserErrorMessage(
  input: unknown,
): ValidationResult<BrowserErrorMessage> {
  return parseSchema(BrowserErrorMessageSchema, input);
}

export function validateBrowserStateSnapshotMessage(
  input: unknown,
): ValidationResult<BrowserStateSnapshotMessage> {
  if (containsRawAuthState(input)) {
    return {
      ok: false,
      message: 'browser state snapshot must not include raw auth state',
    };
  }
  return parseSchema(BrowserStateSnapshotMessageSchema, input);
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

export function createBrowserCommandMessage(
  payload: BrowserCommandPayload,
): BrowserCommandMessage {
  return {
    type: 'browser.command',
    payload,
  };
}

export function createBrowserResultMessage(
  payload: BrowserResultPayload,
): BrowserResultMessage {
  return {
    type: 'browser.result',
    payload,
  };
}

export function createBrowserErrorMessage(
  payload: BrowserErrorPayload,
): BrowserErrorMessage {
  return {
    type: 'browser.error',
    payload,
  };
}

export function createBrowserProfileStatusMessage(
  payload: BrowserProfileSummary,
): BrowserProfileStatusMessage {
  return {
    type: 'browser.profileStatus',
    payload,
  };
}

export function createBrowserStateSnapshotMessage(
  payload: BrowserStateSnapshotPayload,
): BrowserStateSnapshotMessage {
  return {
    type: 'browser.stateSnapshot',
    payload,
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

const RAW_AUTH_STATE_KEYS = new Set([
  'cookies',
  'origins',
  'storageState',
  'localStorage',
  'sessionStorage',
  'profilePath',
  'userDataDir',
]);

const OBSERVABILITY_METADATA_KEYS = new Set([
  'requestId',
  'traceId',
  'parentId',
  'operation',
  'commandId',
]);

function isBrowserStateSnapshotInput(input: unknown): boolean {
  return (
    typeof input === 'object' &&
    input !== null &&
    'type' in input &&
    input.type === 'browser.stateSnapshot'
  );
}

function containsRawAuthState(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some((item) => containsRawAuthState(item));
  }
  if (!input || typeof input !== 'object') {
    return false;
  }
  for (const [key, value] of Object.entries(input)) {
    if (RAW_AUTH_STATE_KEYS.has(key)) {
      return true;
    }
    if (containsRawAuthState(value)) {
      return true;
    }
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
