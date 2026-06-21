import {
  createJsonRpcErrorResponse,
  createJsonRpcRequest,
  createJsonRpcSuccessResponse,
  JSON_RPC_INVALID_PARAMS,
  JSON_RPC_METHOD_NOT_FOUND,
  type JsonRpcErrorObject,
  type JsonRpcErrorResponse,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type JsonRpcSuccessResponse,
  type ValidationResult,
} from '@cthutool/agent-protocol';
import * as v from 'valibot';

const SITE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const PROFILE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

export const BROWSER_CAPABILITY = 'browser';
export const BROWSER_RUNTIME_METHODS = [
  'browser.capturePage',
  'browser.verifyProfile',
  'browser.openLogin',
  'browser.clearProfile',
  'browser.createSession',
  'browser.runActions',
  'browser.closeSession',
] as const;
export const BROWSER_ACTION_TYPES = [
  'goto',
  'waitForSelector',
  'click',
  'fill',
  'textContent',
  'content',
  'title',
  'screenshot',
] as const;
export const BROWSER_AUTH_POLICIES = ['anonymous', 'required'] as const;
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
export const BROWSER_RUNTIME_ERROR_CODES = [
  'AUTH_PROFILE_REQUIRED',
  'AUTH_PROFILE_EXPIRED',
  'BROWSER_CAPABILITY_UNAVAILABLE',
  'BROWSER_COMMAND_FAILED',
  'BROWSER_ACTION_FAILED',
  'BROWSER_HOST_NOT_READY',
  'BROWSER_PROFILE_BLOCKED',
  'BROWSER_PROFILE_EXPIRED',
  'BROWSER_SESSION_DUPLICATE',
  'BROWSER_SESSION_EXPIRED',
  'BROWSER_SESSION_NOT_FOUND',
  'CAPTCHA_REQUIRED',
  'INVALID_BROWSER_COMMAND',
  'RATE_LIMITED',
  'UNSUPPORTED_BROWSER_COMMAND',
] as const;
export const BROWSER_CHALLENGE_KINDS = [
  'login_required',
  'login_expired',
  'verification_failed',
  'captcha_required',
  'blocked',
  'rate_limited',
] as const;

const NonEmptyDisplayStringSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(256),
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
const PositiveIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const BrowserSessionIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
);
const BrowserActionIdSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(128),
);
const BrowserSelectorSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(2048),
);
const WaitUntilSchema = v.picklist(['domcontentloaded', 'load', 'networkidle']);

const BaseBrowserParamsEntries = {
  siteId: SiteIdSchema,
  profileName: v.optional(ProfileNameSchema),
  authPolicy: v.picklist(BROWSER_AUTH_POLICIES),
  loginUrl: v.optional(HttpUrlSchema),
  verifyUrl: v.optional(HttpUrlSchema),
  timeoutMs: v.optional(PositiveIntegerSchema),
};

const BrowserActionBaseSchema = v.object({
  actionId: v.optional(BrowserActionIdSchema),
  timeoutMs: v.optional(PositiveIntegerSchema),
});

export const BrowserActionSchema = v.variant('type', [
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('goto'),
    url: HttpUrlSchema,
    waitUntil: v.optional(WaitUntilSchema),
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('waitForSelector'),
    selector: BrowserSelectorSchema,
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('click'),
    selector: BrowserSelectorSchema,
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('fill'),
    selector: BrowserSelectorSchema,
    value: v.pipe(v.string(), v.maxLength(100_000)),
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('textContent'),
    selector: BrowserSelectorSchema,
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('content'),
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('title'),
  }),
  v.object({
    ...BrowserActionBaseSchema.entries,
    type: v.literal('screenshot'),
    fullPage: v.optional(v.boolean()),
  }),
]);

export const BrowserActionResultSchema = v.object({
  actionId: v.optional(BrowserActionIdSchema),
  type: v.picklist(BROWSER_ACTION_TYPES),
  finalUrl: v.optional(HttpUrlSchema),
  status: v.optional(v.pipe(v.number(), v.integer())),
  title: v.optional(v.string()),
  html: v.optional(v.string()),
  text: v.optional(v.string()),
  screenshotBase64: v.optional(v.string()),
});

export const BrowserProfileSummarySchema = v.object({
  siteId: SiteIdSchema,
  profileName: ProfileNameSchema,
  status: v.picklist(BROWSER_PROFILE_STATUSES),
  displayName: v.optional(NonEmptyDisplayStringSchema),
  externalUserId: v.optional(NonEmptyDisplayStringSchema),
  verifiedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const BrowserDetectionSchema = v.object({
  kind: v.picklist(BROWSER_DETECTION_KINDS),
  reason: v.optional(v.string()),
});

export const BrowserChallengeSchema = v.object({
  kind: v.picklist(BROWSER_CHALLENGE_KINDS),
  siteId: SiteIdSchema,
  profileName: v.optional(ProfileNameSchema),
  loginUrl: v.optional(HttpUrlSchema),
  verifyUrl: v.optional(HttpUrlSchema),
  message: v.optional(NonEmptyDisplayStringSchema),
  retryable: v.optional(v.boolean()),
});

export const BrowserCapturePageParamsSchema = v.object({
  ...BaseBrowserParamsEntries,
  url: HttpUrlSchema,
  includeHtml: v.optional(v.boolean()),
  includeText: v.optional(v.boolean()),
  includeScreenshot: v.optional(v.boolean()),
  waitUntil: v.optional(
    v.picklist(['domcontentloaded', 'load', 'networkidle']),
  ),
  blockResources: v.optional(v.array(v.picklist(BROWSER_RESOURCE_TYPES))),
});

export const BrowserVerifyProfileParamsSchema = v.object({
  ...BaseBrowserParamsEntries,
});

export const BrowserOpenLoginParamsSchema = v.object({
  ...BaseBrowserParamsEntries,
});

export const BrowserClearProfileParamsSchema = v.object({
  siteId: SiteIdSchema,
  profileName: ProfileNameSchema,
  authPolicy: v.picklist(BROWSER_AUTH_POLICIES),
  timeoutMs: v.optional(PositiveIntegerSchema),
});

export const BrowserCreateSessionParamsSchema = v.object({
  ...BaseBrowserParamsEntries,
  sessionId: BrowserSessionIdSchema,
  expiresAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  blockResources: v.optional(v.array(v.picklist(BROWSER_RESOURCE_TYPES))),
});

export const BrowserRunActionsParamsSchema = v.object({
  ...BaseBrowserParamsEntries,
  sessionId: BrowserSessionIdSchema,
  actions: v.pipe(v.array(BrowserActionSchema), v.minLength(1)),
});

export const BrowserCloseSessionParamsSchema = v.object({
  ...BaseBrowserParamsEntries,
  sessionId: BrowserSessionIdSchema,
});

export const BrowserCapturePageResultSchema = v.object({
  finalUrl: v.optional(HttpUrlSchema),
  status: v.optional(v.pipe(v.number(), v.integer())),
  title: v.optional(v.string()),
  html: v.optional(v.string()),
  text: v.optional(v.string()),
  screenshotBase64: v.optional(v.string()),
  capturedAt: v.pipe(v.string(), v.isoTimestamp()),
  detection: BrowserDetectionSchema,
  profile: v.optional(BrowserProfileSummarySchema),
});

export const BrowserProfileOperationResultSchema = v.object({
  capturedAt: v.pipe(v.string(), v.isoTimestamp()),
  detection: BrowserDetectionSchema,
  profile: v.optional(BrowserProfileSummarySchema),
});

export const BrowserRuntimeErrorDataSchema = v.object({
  code: v.picklist(BROWSER_RUNTIME_ERROR_CODES),
  profileStatus: v.optional(v.picklist(BROWSER_PROFILE_STATUSES)),
  retryable: v.optional(v.boolean()),
  challenge: v.optional(BrowserChallengeSchema),
  detection: v.optional(BrowserDetectionSchema),
  failedActionIndex: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  failedActionType: v.optional(v.picklist(BROWSER_ACTION_TYPES)),
  sessionId: v.optional(BrowserSessionIdSchema),
});

export const BrowserSessionMetadataSchema = v.object({
  sessionId: BrowserSessionIdSchema,
  siteId: SiteIdSchema,
  profileName: v.optional(ProfileNameSchema),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  expiresAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const BrowserCreateSessionResultSchema = v.object({
  capturedAt: v.pipe(v.string(), v.isoTimestamp()),
  detection: BrowserDetectionSchema,
  session: BrowserSessionMetadataSchema,
  sessionId: BrowserSessionIdSchema,
});

export const BrowserRunActionsResultSchema = v.object({
  actionResults: v.array(BrowserActionResultSchema),
  capturedAt: v.pipe(v.string(), v.isoTimestamp()),
  detection: BrowserDetectionSchema,
  sessionId: BrowserSessionIdSchema,
});

export const BrowserCloseSessionResultSchema = v.object({
  capturedAt: v.pipe(v.string(), v.isoTimestamp()),
  detection: BrowserDetectionSchema,
  sessionId: BrowserSessionIdSchema,
});

export type BrowserRuntimeMethod = (typeof BROWSER_RUNTIME_METHODS)[number];
export type BrowserActionType = (typeof BROWSER_ACTION_TYPES)[number];
export type BrowserAuthPolicy = (typeof BROWSER_AUTH_POLICIES)[number];
export type BrowserResourceType = (typeof BROWSER_RESOURCE_TYPES)[number];
export type BrowserDetectionKind = (typeof BROWSER_DETECTION_KINDS)[number];
export type BrowserProfileStatus = (typeof BROWSER_PROFILE_STATUSES)[number];
export type BrowserRuntimeErrorCode =
  (typeof BROWSER_RUNTIME_ERROR_CODES)[number];
export type BrowserChallengeKind = (typeof BROWSER_CHALLENGE_KINDS)[number];
export type BrowserProfileSummary = v.InferOutput<
  typeof BrowserProfileSummarySchema
>;
export type BrowserDetection = v.InferOutput<typeof BrowserDetectionSchema>;
export type BrowserChallenge = v.InferOutput<typeof BrowserChallengeSchema>;
export type BrowserAction = v.InferOutput<typeof BrowserActionSchema>;
export type BrowserActionResult = v.InferOutput<
  typeof BrowserActionResultSchema
>;
export type BrowserCapturePageParams = v.InferOutput<
  typeof BrowserCapturePageParamsSchema
>;
export type BrowserVerifyProfileParams = v.InferOutput<
  typeof BrowserVerifyProfileParamsSchema
>;
export type BrowserOpenLoginParams = v.InferOutput<
  typeof BrowserOpenLoginParamsSchema
>;
export type BrowserClearProfileParams = v.InferOutput<
  typeof BrowserClearProfileParamsSchema
>;
export type BrowserCreateSessionParams = v.InferOutput<
  typeof BrowserCreateSessionParamsSchema
>;
export type BrowserRunActionsParams = v.InferOutput<
  typeof BrowserRunActionsParamsSchema
>;
export type BrowserCloseSessionParams = v.InferOutput<
  typeof BrowserCloseSessionParamsSchema
>;
export type BrowserRuntimeParamsByMethod = {
  readonly 'browser.capturePage': BrowserCapturePageParams;
  readonly 'browser.verifyProfile': BrowserVerifyProfileParams;
  readonly 'browser.openLogin': BrowserOpenLoginParams;
  readonly 'browser.clearProfile': BrowserClearProfileParams;
  readonly 'browser.createSession': BrowserCreateSessionParams;
  readonly 'browser.runActions': BrowserRunActionsParams;
  readonly 'browser.closeSession': BrowserCloseSessionParams;
};
export type BrowserCapturePageResult = v.InferOutput<
  typeof BrowserCapturePageResultSchema
>;
export type BrowserProfileOperationResult = v.InferOutput<
  typeof BrowserProfileOperationResultSchema
>;
export type BrowserSessionMetadata = v.InferOutput<
  typeof BrowserSessionMetadataSchema
>;
export type BrowserCreateSessionResult = v.InferOutput<
  typeof BrowserCreateSessionResultSchema
>;
export type BrowserRunActionsResult = v.InferOutput<
  typeof BrowserRunActionsResultSchema
>;
export type BrowserCloseSessionResult = v.InferOutput<
  typeof BrowserCloseSessionResultSchema
>;
export type BrowserRuntimeResultByMethod = {
  readonly 'browser.capturePage': BrowserCapturePageResult;
  readonly 'browser.verifyProfile': BrowserProfileOperationResult;
  readonly 'browser.openLogin': BrowserProfileOperationResult;
  readonly 'browser.clearProfile': BrowserProfileOperationResult;
  readonly 'browser.createSession': BrowserCreateSessionResult;
  readonly 'browser.runActions': BrowserRunActionsResult;
  readonly 'browser.closeSession': BrowserCloseSessionResult;
};
export type BrowserRuntimeErrorData = v.InferOutput<
  typeof BrowserRuntimeErrorDataSchema
>;
export type BrowserRuntimeErrorObject =
  JsonRpcErrorObject<BrowserRuntimeErrorData>;
export type BrowserRuntimeRequest<
  TMethod extends BrowserRuntimeMethod = BrowserRuntimeMethod,
> = JsonRpcRequest<BrowserRuntimeParamsByMethod[TMethod]> & {
  readonly method: TMethod;
};
export type BrowserRuntimeSuccessResponse<
  TMethod extends BrowserRuntimeMethod = BrowserRuntimeMethod,
> = JsonRpcSuccessResponse<BrowserRuntimeResultByMethod[TMethod]>;
export type BrowserRuntimeErrorResponse =
  JsonRpcErrorResponse<BrowserRuntimeErrorData>;
export type BrowserRuntimeResponse<
  TMethod extends BrowserRuntimeMethod = BrowserRuntimeMethod,
> = JsonRpcResponse<
  BrowserRuntimeResultByMethod[TMethod],
  BrowserRuntimeErrorData
>;

export function createBrowserRuntimeRequest<
  TMethod extends BrowserRuntimeMethod,
>(
  id: JsonRpcId,
  method: TMethod,
  params: BrowserRuntimeParamsByMethod[TMethod],
): BrowserRuntimeRequest<TMethod> {
  return createJsonRpcRequest({
    id,
    method,
    params,
  }) as BrowserRuntimeRequest<TMethod>;
}

export function createBrowserRuntimeSuccessResponse<
  TMethod extends BrowserRuntimeMethod,
>(
  id: JsonRpcId,
  result: BrowserRuntimeResultByMethod[TMethod],
): BrowserRuntimeSuccessResponse<TMethod> {
  return createJsonRpcSuccessResponse(id, result);
}

export function createBrowserRuntimeErrorResponse(
  id: JsonRpcId,
  input: {
    readonly code: BrowserRuntimeErrorCode;
    readonly message: string;
    readonly jsonRpcCode?: number;
    readonly profileStatus?: BrowserProfileStatus;
    readonly retryable?: boolean;
    readonly challenge?: BrowserChallenge;
    readonly detection?: BrowserDetection;
    readonly failedActionIndex?: number;
    readonly failedActionType?: BrowserActionType;
    readonly sessionId?: string;
  },
): BrowserRuntimeErrorResponse {
  const data: BrowserRuntimeErrorData = {
    code: input.code,
    ...(input.profileStatus ? { profileStatus: input.profileStatus } : {}),
    ...(input.retryable !== undefined ? { retryable: input.retryable } : {}),
    ...(input.challenge ? { challenge: input.challenge } : {}),
    ...(input.detection ? { detection: input.detection } : {}),
    ...(input.failedActionIndex !== undefined
      ? { failedActionIndex: input.failedActionIndex }
      : {}),
    ...(input.failedActionType
      ? { failedActionType: input.failedActionType }
      : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  };
  return createJsonRpcErrorResponse(id, {
    code: input.jsonRpcCode ?? JSON_RPC_INVALID_PARAMS,
    message: input.message,
    data,
  });
}

export function validateBrowserRuntimeRequest(
  input: unknown,
): ValidationResult<BrowserRuntimeRequest> {
  if (!isRecord(input) || input.jsonrpc !== '2.0') {
    return {
      ok: false,
      message: 'browser runtime request must be JSON-RPC 2.0',
    };
  }
  if (!isBrowserRuntimeMethod(input.method)) {
    return { ok: false, message: 'unsupported browser runtime method' };
  }
  const params = parseBrowserRuntimeParams(input.method, input.params);
  if (!params.ok) {
    return params;
  }
  return {
    ok: true,
    value: {
      ...input,
      method: input.method,
      params: params.value,
    } as BrowserRuntimeRequest,
  };
}

export function validateBrowserRuntimeResponse<
  TMethod extends BrowserRuntimeMethod,
>(
  method: TMethod,
  input: unknown,
): ValidationResult<BrowserRuntimeResponse<TMethod>> {
  if (!isRecord(input) || input.jsonrpc !== '2.0') {
    return {
      ok: false,
      message: 'browser runtime response must be JSON-RPC 2.0',
    };
  }
  if ('error' in input) {
    const error = input.error;
    if (!isRecord(error)) {
      return { ok: false, message: 'browser runtime error data is invalid' };
    }
    const parsed = parseSchema(BrowserRuntimeErrorDataSchema, error.data);
    if (!parsed.ok) {
      return { ok: false, message: 'browser runtime error data is invalid' };
    }
    return { ok: true, value: input as BrowserRuntimeResponse<TMethod> };
  }
  const parsed = parseBrowserRuntimeResult(method, input.result);
  if (!parsed.ok) {
    return parsed;
  }
  return {
    ok: true,
    value: {
      ...input,
      result: parsed.value,
    } as BrowserRuntimeResponse<TMethod>,
  };
}

export function parseBrowserRuntimeParams<TMethod extends BrowserRuntimeMethod>(
  method: TMethod,
  input: unknown,
): ValidationResult<BrowserRuntimeParamsByMethod[TMethod]> {
  switch (method) {
    case 'browser.capturePage':
      return parseSchema(
        BrowserCapturePageParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
    case 'browser.verifyProfile':
      return parseSchema(
        BrowserVerifyProfileParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
    case 'browser.openLogin':
      return parseSchema(
        BrowserOpenLoginParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
    case 'browser.clearProfile':
      return parseSchema(
        BrowserClearProfileParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
    case 'browser.createSession':
      return parseSchema(
        BrowserCreateSessionParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
    case 'browser.runActions':
      return parseSchema(
        BrowserRunActionsParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
    case 'browser.closeSession':
      return parseSchema(
        BrowserCloseSessionParamsSchema,
        input,
      ) as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
  }
  return {
    ok: false,
    message: 'unsupported browser runtime method',
  } as ValidationResult<BrowserRuntimeParamsByMethod[TMethod]>;
}

export function parseBrowserRuntimeResult<TMethod extends BrowserRuntimeMethod>(
  method: TMethod,
  input: unknown,
): ValidationResult<BrowserRuntimeResultByMethod[TMethod]> {
  switch (method) {
    case 'browser.capturePage':
      return parseSchema(
        BrowserCapturePageResultSchema,
        input,
      ) as ValidationResult<BrowserRuntimeResultByMethod[TMethod]>;
    case 'browser.verifyProfile':
    case 'browser.openLogin':
    case 'browser.clearProfile':
      return parseSchema(
        BrowserProfileOperationResultSchema,
        input,
      ) as ValidationResult<BrowserRuntimeResultByMethod[TMethod]>;
    case 'browser.createSession':
      return parseSchema(
        BrowserCreateSessionResultSchema,
        input,
      ) as ValidationResult<BrowserRuntimeResultByMethod[TMethod]>;
    case 'browser.runActions':
      return parseSchema(
        BrowserRunActionsResultSchema,
        input,
      ) as ValidationResult<BrowserRuntimeResultByMethod[TMethod]>;
    case 'browser.closeSession':
      return parseSchema(
        BrowserCloseSessionResultSchema,
        input,
      ) as ValidationResult<BrowserRuntimeResultByMethod[TMethod]>;
  }
  return {
    ok: false,
    message: 'unsupported browser runtime method',
  } as ValidationResult<BrowserRuntimeResultByMethod[TMethod]>;
}

export function isBrowserRuntimeMethod(
  input: unknown,
): input is BrowserRuntimeMethod {
  return (
    typeof input === 'string' &&
    (BROWSER_RUNTIME_METHODS as readonly string[]).includes(input)
  );
}

export function browserJsonRpcMethodNotFound(
  id: JsonRpcId,
  method: string,
): BrowserRuntimeErrorResponse {
  return createJsonRpcErrorResponse(id, {
    code: JSON_RPC_METHOD_NOT_FOUND,
    message: `Unsupported browser runtime method: ${method}`,
    data: {
      code: 'UNSUPPORTED_BROWSER_COMMAND',
      retryable: false,
    },
  });
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
    message: result.issues
      .slice(0, 3)
      .map((issue) => issue.message)
      .join('; '),
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null;
}
