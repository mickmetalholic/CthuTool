import { randomUUID } from 'node:crypto';
import {
  BROWSER_ACTION_TYPES,
  BROWSER_AUTH_POLICIES,
  BROWSER_RESOURCE_TYPES,
  type BrowserAction,
  type BrowserActionResult,
} from '@cthutool/browser-runtime-protocol';
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
// Nest DI needs runtime class reference.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentLifecycleEvents } from '../../agent/registry/agent-lifecycle-events.service';
// Nest DI needs runtime class reference.
// biome-ignore lint/style/useImportType: constructor injection token
import { SitesConfigService } from '../../sites-config/sites-config.service';
// Nest DI needs runtime class reference.
// biome-ignore lint/style/useImportType: constructor injection token
import { DesktopBrowserRuntimeService } from '../desktop-runtime/desktop-browser-runtime.service';
import { browserPublicApiError } from './browser-public-api.errors';
// Nest DI needs runtime class reference.
// biome-ignore lint/style/useImportType: constructor injection token
import {
  BrowserSessionRoutingRecord,
  BrowserSessionRoutingStore,
} from './browser-session-routing.store';

const DEFAULT_SESSION_TTL_MS = 15 * 60 * 1000;
const MAX_SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_ACTIONS = 50;
const MAX_ACTIONS_PAYLOAD_BYTES = 200_000;

export type CreateBrowserSessionResponse = {
  readonly session: PublicBrowserSession;
};

export type RunBrowserActionsResponse = {
  readonly sessionId: string;
  readonly actionResults: readonly BrowserActionResult[];
  readonly capturedAt: string;
};

export type CloseBrowserSessionResponse = {
  readonly sessionId: string;
  readonly closed: true;
};

export type PublicBrowserSession = {
  readonly sessionId: string;
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName?: string;
  readonly authPolicy: 'anonymous' | 'required';
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly lastUsedAt: string;
  readonly status: BrowserSessionRoutingRecord['status'];
};

@Injectable()
export class BrowserPublicApiService implements OnModuleInit, OnModuleDestroy {
  private unsubscribeAgentDisconnected?: () => void;

  constructor(
    private readonly desktopRuntime: DesktopBrowserRuntimeService,
    private readonly siteConfig: SitesConfigService,
    private readonly sessions: BrowserSessionRoutingStore,
    private readonly agentLifecycleEvents: AgentLifecycleEvents,
  ) {}

  onModuleInit(): void {
    this.unsubscribeAgentDisconnected =
      this.agentLifecycleEvents.onAgentDisconnected((event) => {
        this.sessions.expireByAgent(event.agent.agentId);
      });
  }

  onModuleDestroy(): void {
    this.unsubscribeAgentDisconnected?.();
    this.unsubscribeAgentDisconnected = undefined;
  }

  async createSession(input: unknown): Promise<CreateBrowserSessionResponse> {
    await this.cleanupExpiredSessions();
    const request = parseCreateSessionRequest(input);
    const site = this.siteConfig.getSite(request.siteId);
    if (!site) {
      throw browserPublicApiError(
        'INVALID_BROWSER_REQUEST',
        `Browser site "${request.siteId}" is not configured`,
      );
    }
    const authPolicy = request.authPolicy ?? site.authPolicy ?? 'anonymous';
    const profileName =
      request.profileName ??
      (authPolicy === 'required' ? site.profileName : undefined);
    const expiresAt = new Date(
      Date.now() + clampTtl(request.ttlMs ?? DEFAULT_SESSION_TTL_MS),
    ).toISOString();
    const sessionId = randomUUID();

    const result = await this.desktopRuntime.createSession({
      authPolicy,
      blockResources: request.blockResources ?? site.defaultBlockResources,
      expiresAt,
      profileName,
      sessionId,
      siteId: site.siteId,
      timeoutMs: request.timeoutMs ?? site.defaultTimeoutMs,
    });
    if (!result.ok) {
      runtimeErrorToPublicError(result);
    }

    const record = this.sessions.create({
      agentId: result.value.agentId,
      authPolicy,
      expiresAt: result.value.expiresAt,
      profileName,
      sessionId: result.value.sessionId,
      siteId: site.siteId,
    });
    return { session: toPublicSession(record) };
  }

  async runActions(
    sessionId: string,
    input: unknown,
  ): Promise<RunBrowserActionsResponse> {
    await this.cleanupExpiredSessions();
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw browserPublicApiError(
        'BROWSER_SESSION_NOT_FOUND',
        'Browser session was not found or has expired',
        { sessionId },
      );
    }
    const site = this.siteConfig.getSite(record.siteId);
    if (!site) {
      this.sessions.close(sessionId);
      throw browserPublicApiError(
        'INVALID_BROWSER_REQUEST',
        `Browser site "${record.siteId}" is no longer configured`,
      );
    }
    const actions = parseRunActionsRequest(input);
    for (const action of actions) {
      if (action.type === 'goto') {
        assertAllowedOrigin(action.url, site.allowedOrigins);
      }
      if (action.type === 'waitForURL' && action.target.url) {
        assertAllowedOrigin(action.target.url, site.allowedOrigins);
      }
      if (action.type === 'waitForResponse' && action.target.url) {
        assertAllowedOrigin(action.target.url, site.allowedOrigins);
      }
    }
    const result = await this.desktopRuntime.runActions({
      actions,
      agentId: record.agentId,
      authPolicy: record.authPolicy,
      profileName: record.profileName,
      sessionId,
      siteId: record.siteId,
    });
    if (!result.ok) {
      if ('error' in result && result.code === 'AGENT_NOT_AVAILABLE') {
        this.sessions.close(sessionId);
      }
      runtimeErrorToPublicError(result, sessionId);
    }
    this.sessions.touch(sessionId);
    return {
      actionResults: result.value.actionResults,
      capturedAt: result.value.capturedAt,
      sessionId: result.value.sessionId,
    };
  }

  async closeSession(sessionId: string): Promise<CloseBrowserSessionResponse> {
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw browserPublicApiError(
        'BROWSER_SESSION_NOT_FOUND',
        'Browser session was not found or has expired',
        { sessionId },
      );
    }
    this.sessions.close(sessionId);
    const result = await this.desktopRuntime.closeSession({
      agentId: record.agentId,
      authPolicy: record.authPolicy,
      profileName: record.profileName,
      sessionId,
      siteId: record.siteId,
    });
    if (
      !result.ok &&
      'error' in result &&
      result.code !== 'AGENT_NOT_AVAILABLE'
    ) {
      runtimeErrorToPublicError(result, sessionId);
    }
    this.sessions.delete(sessionId);
    return { closed: true, sessionId };
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const expired = this.sessions.collectExpired();
    for (const record of expired) {
      await this.desktopRuntime.closeSession({
        agentId: record.agentId,
        authPolicy: record.authPolicy,
        profileName: record.profileName,
        sessionId: record.sessionId,
        siteId: record.siteId,
      });
      this.sessions.delete(record.sessionId);
    }
  }
}

function toPublicSession(
  record: BrowserSessionRoutingRecord,
): PublicBrowserSession {
  return {
    agentId: record.agentId,
    authPolicy: record.authPolicy,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    lastUsedAt: record.lastUsedAt,
    profileName: record.profileName,
    sessionId: record.sessionId,
    siteId: record.siteId,
    status: record.status,
  };
}

function parseCreateSessionRequest(input: unknown): {
  readonly siteId: string;
  readonly authPolicy?: 'anonymous' | 'required';
  readonly profileName?: string;
  readonly timeoutMs?: number;
  readonly ttlMs?: number;
  readonly blockResources?: readonly (typeof BROWSER_RESOURCE_TYPES)[number][];
} {
  const body = requireObject(input);
  const siteId = requireString(body.siteId, 'siteId');
  const authPolicy =
    body.authPolicy === undefined
      ? undefined
      : requirePicklist(body.authPolicy, BROWSER_AUTH_POLICIES, 'authPolicy');
  const profileName =
    body.profileName === undefined
      ? undefined
      : requireString(body.profileName, 'profileName');
  const timeoutMs =
    body.timeoutMs === undefined
      ? undefined
      : requirePositiveInteger(body.timeoutMs, 'timeoutMs', MAX_TIMEOUT_MS);
  const ttlMs =
    body.ttlMs === undefined
      ? undefined
      : requirePositiveInteger(body.ttlMs, 'ttlMs', MAX_SESSION_TTL_MS);
  const blockResources =
    body.blockResources === undefined
      ? undefined
      : requireArray(body.blockResources, 'blockResources').map((item) =>
          requirePicklist(item, BROWSER_RESOURCE_TYPES, 'blockResources'),
        );
  return {
    authPolicy,
    blockResources,
    profileName,
    siteId,
    timeoutMs,
    ttlMs,
  };
}

function parseRunActionsRequest(input: unknown): BrowserAction[] {
  const body = requireObject(input);
  const actionsInput = requireArray(body.actions, 'actions');
  if (actionsInput.length === 0 || actionsInput.length > MAX_ACTIONS) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `actions must contain between 1 and ${MAX_ACTIONS} items`,
    );
  }
  if (
    Buffer.byteLength(JSON.stringify(actionsInput), 'utf8') >
    MAX_ACTIONS_PAYLOAD_BYTES
  ) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      'actions payload is too large',
    );
  }
  return actionsInput.map(parseBrowserAction);
}

function parseBrowserAction(input: unknown): BrowserAction {
  const action = requireObject(input);
  rejectExecutablePayload(action);
  const type = requirePicklist(
    action.type,
    BROWSER_ACTION_TYPES,
    'action.type',
  );
  const base = {
    ...(action.actionId === undefined
      ? {}
      : { actionId: requireString(action.actionId, 'action.actionId') }),
    ...(action.timeoutMs === undefined
      ? {}
      : {
          timeoutMs: requirePositiveInteger(
            action.timeoutMs,
            'action.timeoutMs',
            MAX_TIMEOUT_MS,
          ),
        }),
  };
  if (type === 'goto') {
    return {
      ...base,
      type,
      url: requireUrl(action.url, 'action.url'),
      ...(action.waitUntil === undefined
        ? {}
        : {
            waitUntil: requirePicklist(
              action.waitUntil,
              ['domcontentloaded', 'load', 'networkidle'] as const,
              'action.waitUntil',
            ),
          }),
    };
  }
  if (
    type === 'waitForSelector' ||
    type === 'click' ||
    type === 'textContent' ||
    type === 'innerText' ||
    type === 'innerHTML' ||
    type === 'locatorCount' ||
    type === 'allTextContents' ||
    type === 'exists' ||
    type === 'hover' ||
    type === 'check' ||
    type === 'uncheck'
  ) {
    return {
      ...base,
      selector: requireString(action.selector, 'action.selector'),
      type,
    } as BrowserAction;
  }
  if (type === 'waitForLoadState') {
    return {
      ...base,
      state: requirePicklist(
        action.state,
        ['domcontentloaded', 'load', 'networkidle'] as const,
        'action.state',
      ),
      type,
    };
  }
  if (type === 'waitForURL') {
    return {
      ...base,
      target: parseUrlMatch(action.target, 'action.target'),
      type,
    } as BrowserAction;
  }
  if (type === 'waitForResponse') {
    return {
      ...base,
      target: parseResponseMatch(action.target, 'action.target'),
      type,
    } as BrowserAction;
  }
  if (type === 'press') {
    return {
      ...base,
      key: requireString(action.key, 'action.key'),
      selector: requireString(action.selector, 'action.selector'),
      type,
    };
  }
  if (type === 'selectOption') {
    return {
      ...base,
      selector: requireString(action.selector, 'action.selector'),
      type,
      value: requireString(action.value, 'action.value'),
    };
  }
  if (type === 'scroll') {
    return {
      ...base,
      ...(action.target === undefined
        ? {}
        : {
            target: requirePicklist(
              action.target,
              ['page', 'selector'] as const,
              'action.target',
            ),
          }),
      ...(action.selector === undefined
        ? {}
        : { selector: requireString(action.selector, 'action.selector') }),
      ...(action.x === undefined
        ? {}
        : {
            x: requireInteger(action.x, 'action.x'),
          }),
      ...(action.y === undefined
        ? {}
        : {
            y: requireInteger(action.y, 'action.y'),
          }),
      type,
    } as BrowserAction;
  }
  if (type === 'getAttribute') {
    return {
      ...base,
      name: requireString(action.name, 'action.name'),
      selector: requireString(action.selector, 'action.selector'),
      type,
    };
  }
  if (type === 'fill') {
    return {
      ...base,
      selector: requireString(action.selector, 'action.selector'),
      type,
      value: requireString(action.value, 'action.value'),
    };
  }
  if (type === 'screenshot') {
    return {
      ...base,
      type,
      ...(action.fullPage === undefined
        ? {}
        : { fullPage: requireBoolean(action.fullPage, 'action.fullPage') }),
    };
  }
  if (type === 'extractList') {
    return {
      ...base,
      fields: parseExtractFields(action.fields),
      itemSelector: requireString(action.itemSelector, 'action.itemSelector'),
      ...(action.limit === undefined
        ? {}
        : {
            limit: requirePositiveInteger(action.limit, 'action.limit', 1000),
          }),
      type,
    } as BrowserAction;
  }
  if (type === 'extractLinks') {
    return {
      ...base,
      ...(action.selector === undefined
        ? {}
        : { selector: requireString(action.selector, 'action.selector') }),
      type,
    } as BrowserAction;
  }
  return { ...base, type } as BrowserAction;
}

function parseUrlMatch(input: unknown, field: string) {
  const target = requireObject(input);
  return {
    ...(target.url === undefined ? {} : { url: requireUrl(target.url, field) }),
    ...(target.pattern === undefined
      ? {}
      : { pattern: requireString(target.pattern, `${field}.pattern`) }),
  };
}

function parseResponseMatch(input: unknown, field: string) {
  const target = parseUrlMatch(input, field);
  const body = requireObject(input);
  return {
    ...target,
    ...(body.method === undefined
      ? {}
      : { method: requireString(body.method, `${field}.method`) }),
    ...(body.status === undefined
      ? {}
      : { status: requireInteger(body.status, `${field}.status`) }),
  };
}

function parseExtractFields(input: unknown) {
  const fields = requireObject(input);
  const output: Record<string, unknown> = {};
  for (const [name, rawField] of Object.entries(fields)) {
    const field = requireObject(rawField);
    const type = requirePicklist(
      field.type,
      ['text', 'innerText', 'html', 'attribute', 'exists', 'count'] as const,
      `action.fields.${name}.type`,
    );
    output[name] = {
      ...(field.selector === undefined
        ? {}
        : {
            selector: requireString(
              field.selector,
              `action.fields.${name}.selector`,
            ),
          }),
      type,
      ...(field.attribute === undefined
        ? {}
        : {
            attribute: requireString(
              field.attribute,
              `action.fields.${name}.attribute`,
            ),
          }),
      ...(field.required === undefined
        ? {}
        : {
            required: requireBoolean(
              field.required,
              `action.fields.${name}.required`,
            ),
          }),
    };
  }
  return output;
}

function runtimeErrorToPublicError(
  result: Exclude<
    Awaited<ReturnType<DesktopBrowserRuntimeService['runActions']>>,
    { readonly ok: true }
  >,
  sessionId?: string,
): never {
  if ('challenge' in result) {
    throw browserPublicApiError(
      result.challenge.reason === 'profile_expired'
        ? 'AUTH_PROFILE_EXPIRED'
        : 'AUTH_PROFILE_REQUIRED',
      `Browser profile action required for site "${result.challenge.siteId}"`,
      { challenge: result.challenge, sessionId },
    );
  }
  if (result.code === 'AGENT_NOT_AVAILABLE') {
    throw browserPublicApiError('BROWSER_UNAVAILABLE', result.error, {
      sessionId,
    });
  }
  throw browserPublicApiError('BROWSER_ACTION_FAILED', result.error, {
    code: result.code,
    sessionId,
  });
}

function assertAllowedOrigin(url: string, allowedOrigins: readonly string[]) {
  const origin = new URL(url).origin;
  if (!allowedOrigins.includes(origin)) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `URL origin "${origin}" is not allowed`,
      { allowedOrigins },
    );
  }
}

function clampTtl(ttlMs: number): number {
  return Math.min(Math.max(ttlMs, 1), MAX_SESSION_TTL_MS);
}

function requireObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      'Request body must be an object',
    );
  }
  return input as Record<string, unknown>;
}

function requireArray(input: unknown, field: string): unknown[] {
  if (!Array.isArray(input)) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} must be an array`,
    );
  }
  return input;
}

function requireString(input: unknown, field: string): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} must be a non-empty string`,
    );
  }
  return input.trim();
}

function requireUrl(input: unknown, field: string): string {
  const value = requireString(input, field);
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return url.toString();
  } catch {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} must be an HTTP URL`,
    );
  }
}

function requireBoolean(input: unknown, field: string): boolean {
  if (typeof input !== 'boolean') {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} must be a boolean`,
    );
  }
  return input;
}

function requirePositiveInteger(
  input: unknown,
  field: string,
  max: number,
): number {
  if (
    typeof input !== 'number' ||
    !Number.isInteger(input) ||
    input < 1 ||
    input > max
  ) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} must be an integer between 1 and ${max}`,
    );
  }
  return input;
}

function requireInteger(input: unknown, field: string): number {
  if (typeof input !== 'number' || !Number.isInteger(input)) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} must be an integer`,
    );
  }
  return input;
}

function requirePicklist<const T extends readonly string[]>(
  input: unknown,
  values: T,
  field: string,
): T[number] {
  if (typeof input !== 'string' || !values.includes(input)) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      `${field} is not supported`,
    );
  }
  return input;
}

function rejectExecutablePayload(input: Record<string, unknown>): void {
  if (containsExecutablePayload(input)) {
    throw browserPublicApiError(
      'INVALID_BROWSER_REQUEST',
      'browser actions must not contain executable script payloads',
    );
  }
}

function containsExecutablePayload(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some(containsExecutablePayload);
  }
  if (!input || typeof input !== 'object') {
    return typeof input === 'function';
  }
  for (const [key, value] of Object.entries(input)) {
    const normalized = key.toLowerCase();
    if (
      normalized === 'script' ||
      normalized === 'function' ||
      normalized === 'predicate' ||
      normalized === 'evaluate'
    ) {
      return true;
    }
    if (containsExecutablePayload(value)) {
      return true;
    }
  }
  return false;
}
