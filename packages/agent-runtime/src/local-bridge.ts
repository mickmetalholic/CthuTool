import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  AGENT_BRIDGE_PROTOCOL_VERSION,
  AGENT_BRIDGE_SUPPORTED_VERSIONS,
  type AgentBridgeErrorCode,
  type AgentBridgeResourceSnapshot,
  type AgentBridgeRpcRequest,
  type AgentBridgeSession,
  type AgentBridgeSettingsPatch,
  bridgeFailure,
  validateAgentBridgeResourceSnapshot,
  validateAgentBridgeRpcRequest,
  validateAgentBridgeSessionExchange,
  validateAgentBridgeSettingsPatch,
} from '@cthutool/agent-bridge-protocol';
import { validateBrowserRuntimeRequest } from '@cthutool/browser-runtime-protocol';

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
const MAX_BODY_BYTES = 256 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const BROWSER_COMMAND_TIMEOUT_MS = 120_000;
const ALLOWED_HEADERS = new Set(['authorization', 'content-type']);
const ALLOWED_METHODS = new Set(['GET', 'POST', 'OPTIONS']);
const TRUST_BOUNDARY_REJECTION_MESSAGE =
  'Web requests cannot change Origin or other trust-boundary fields. Use native Agent Settings (tray → Agent Settings, or `chc agent settings`).';
const TRUST_BOUNDARY_FIELD =
  /^(activeEnvironment|activeEnvironmentId|agentSecret|backendAgentWsUrl|backendHttpUrl|backendUrl|deploymentOrigin|environmentId|namespace|origin|secret|webAgentUrl|webOrigin)$/i;

export type AgentBridgeContext = {
  readonly environmentId: string;
  readonly webOrigin: string;
  readonly webAgentUrl: string;
};

export type AgentBridgeRuntimeEffect =
  | 'immediate'
  | 'reconnect-required'
  | 'restart-required';

export type AgentLocalBridgeOptions = {
  readonly getContext: () => AgentBridgeContext | undefined;
  readonly getResources: () =>
    | AgentBridgeResourceSnapshot
    | Promise<AgentBridgeResourceSnapshot>;
  readonly updateSettings: (
    patch: AgentBridgeSettingsPatch,
  ) =>
    | { readonly effect: AgentBridgeRuntimeEffect }
    | Promise<{ readonly effect: AgentBridgeRuntimeEffect }>;
  readonly deleteProfile: (input: {
    readonly siteId: string;
    readonly profileName: string;
  }) => Promise<void>;
  readonly isProfileLocked?: (input: {
    readonly siteId: string;
    readonly profileName: string;
  }) => boolean;
  readonly lifecycleAction: (action: string) => unknown | Promise<unknown>;
  readonly executeBrowserCommand: (
    request: unknown,
  ) => unknown | Promise<unknown>;
  readonly bindHost?: '127.0.0.1' | '::1';
  readonly now?: () => Date;
  readonly ticketTtlMs?: number;
  readonly sessionTtlMs?: number;
  readonly randomToken?: () => string;
  readonly instanceId?: string;
};

export type AgentBridgeLaunch = {
  readonly environmentId: string;
  readonly endpoint: string;
  readonly instanceId: string;
  readonly expiresAt: string;
  readonly launchUrl: string;
};

export type AgentLocalBridgeInfo = {
  readonly endpoint: string;
  readonly host: '127.0.0.1' | '::1';
  readonly port: number;
  readonly instanceId: string;
  readonly protocolVersion: number;
};

export type AgentLocalBridgePort = {
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
  readonly invalidate: () => void;
  readonly issueLaunch: () => AgentBridgeLaunch;
  readonly getInfo: () => AgentLocalBridgeInfo | undefined;
};

type TicketRecord = {
  readonly environmentId: string;
  readonly webOrigin: string;
  readonly instanceId: string;
  readonly expiresAt: number;
};

type SessionRecord = TicketRecord;

export class AgentLocalBridge implements AgentLocalBridgePort {
  private readonly bindHost: '127.0.0.1' | '::1';
  private readonly instanceId: string;
  private readonly now: () => Date;
  private readonly ticketTtlMs: number;
  private readonly sessionTtlMs: number;
  private readonly randomToken: () => string;
  private readonly tickets = new Map<string, TicketRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private server?: Server;
  private info?: AgentLocalBridgeInfo;

  constructor(private readonly options: AgentLocalBridgeOptions) {
    this.bindHost = options.bindHost ?? '127.0.0.1';
    if (this.bindHost !== '127.0.0.1' && this.bindHost !== '::1') {
      throw new Error(
        'Agent bridge must bind an operating-system loopback host',
      );
    }
    this.instanceId = options.instanceId ?? randomUUID();
    this.now = options.now ?? (() => new Date());
    this.ticketTtlMs = options.ticketTtlMs ?? 60_000;
    this.sessionTtlMs = options.sessionTtlMs ?? 5 * 60_000;
    this.randomToken =
      options.randomToken ?? (() => randomBytes(32).toString('base64url'));
  }

  async start(): Promise<void> {
    if (this.server) {
      return;
    }
    const server = createServer((request, response) => {
      request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy());
      void this.handleRequest(request, response);
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, this.bindHost, () => {
        server.off('error', reject);
        resolve();
      });
    });
    const address = server.address() as AddressInfo | null;
    if (!address) {
      server.close();
      throw new Error('Agent bridge did not receive a loopback address');
    }
    const formattedHost = this.bindHost === '::1' ? '[::1]' : '127.0.0.1';
    this.server = server;
    this.info = {
      endpoint: `http://${formattedHost}:${address.port}`,
      host: this.bindHost,
      instanceId: this.instanceId,
      port: address.port,
      protocolVersion: AGENT_BRIDGE_PROTOCOL_VERSION,
    };
  }

  async stop(): Promise<void> {
    this.invalidate();
    const server = this.server;
    this.server = undefined;
    this.info = undefined;
    if (!server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  invalidate(): void {
    this.tickets.clear();
    this.sessions.clear();
  }

  getInfo(): AgentLocalBridgeInfo | undefined {
    return this.info ? { ...this.info } : undefined;
  }

  issueLaunch(): AgentBridgeLaunch {
    const context = this.options.getContext();
    const info = this.info;
    if (!context || !info) {
      throw new Error('Agent bridge is not ready for Web launch');
    }
    const ticket = this.randomToken();
    const expiresAt = this.now().getTime() + this.ticketTtlMs;
    this.tickets.set(hashToken(ticket), {
      environmentId: context.environmentId,
      expiresAt,
      instanceId: this.instanceId,
      webOrigin: context.webOrigin,
    });
    const fragment = new URLSearchParams({
      endpoint: info.endpoint,
      environment: context.environmentId,
      instance: this.instanceId,
      ticket,
    });
    const launchUrl = new URL(context.webAgentUrl);
    launchUrl.hash = fragment.toString();
    return {
      endpoint: info.endpoint,
      environmentId: context.environmentId,
      expiresAt: new Date(expiresAt).toISOString(),
      instanceId: this.instanceId,
      launchUrl: launchUrl.toString(),
    };
  }

  private async handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    try {
      this.cleanupExpired();
      const context = this.options.getContext();
      const info = this.info;
      if (!context || !info) {
        this.respondFailure(
          response,
          'INTERNAL_ERROR',
          'Bridge is not ready',
          503,
        );
        return;
      }
      if (!this.hasExpectedHost(request, info)) {
        this.respondFailure(
          response,
          'HOST_DENIED',
          'Host is not allowed',
          403,
        );
        return;
      }
      const origin = readHeader(request, 'origin');
      if (origin !== context.webOrigin) {
        this.respondFailure(
          response,
          'ORIGIN_DENIED',
          'Origin is not allowed',
          403,
        );
        return;
      }
      this.setCors(response, origin);

      if (request.method === 'OPTIONS') {
        this.handlePreflight(request, response);
        return;
      }
      if (!request.method || !ALLOWED_METHODS.has(request.method)) {
        this.respondFailure(
          response,
          'METHOD_NOT_ALLOWED',
          'Method is not allowed',
          405,
        );
        return;
      }
      const url = new URL(request.url ?? '/', info.endpoint);
      if (request.method === 'GET' && url.pathname === '/v1/bootstrap') {
        this.respondJson(response, 200, {
          environmentId: context.environmentId,
          instanceId: this.instanceId,
          protocolVersion: AGENT_BRIDGE_PROTOCOL_VERSION,
          supportedVersions: AGENT_BRIDGE_SUPPORTED_VERSIONS,
        });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/v1/session') {
        await this.exchangeTicket(request, response, origin, context);
        return;
      }

      const session = this.authenticate(request, context);
      if (!session.ok) {
        this.respondFailure(response, session.code, session.message, 401);
        return;
      }
      if (request.method === 'GET' && url.pathname === '/v1/resources') {
        const resources = validateAgentBridgeResourceSnapshot(
          await this.options.getResources(),
        );
        if (!resources.ok) {
          this.respondFailure(
            response,
            'INTERNAL_ERROR',
            'Agent bridge resource snapshot is invalid',
            500,
          );
          return;
        }
        this.respondJson(response, 200, resources.value);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/v1/rpc') {
        await this.handleRpc(request, response);
        return;
      }
      this.respondFailure(
        response,
        'RESOURCE_NOT_FOUND',
        'Bridge resource was not found',
        404,
      );
    } catch {
      if (!response.headersSent) {
        this.respondFailure(
          response,
          'INTERNAL_ERROR',
          'Bridge request failed',
          500,
        );
      } else {
        response.end();
      }
    }
  }

  private async exchangeTicket(
    request: IncomingMessage,
    response: ServerResponse,
    origin: string,
    context: AgentBridgeContext,
  ): Promise<void> {
    const body = await this.readJson(request);
    if (!body.ok) {
      this.respondFailure(response, body.code, body.message, 400);
      return;
    }
    const parsed = validateAgentBridgeSessionExchange(body.value);
    if (!parsed.ok) {
      this.respondFailure(
        response,
        'INVALID_REQUEST',
        'Session exchange request is invalid',
        400,
      );
      return;
    }
    const key = hashToken(parsed.value.ticket);
    const ticket = this.tickets.get(key);
    this.tickets.delete(key);
    if (!ticket) {
      this.respondFailure(
        response,
        'TICKET_INVALID',
        'Launch ticket is invalid',
        401,
      );
      return;
    }
    if (ticket.expiresAt <= this.now().getTime()) {
      this.respondFailure(
        response,
        'TICKET_EXPIRED',
        'Launch ticket expired',
        401,
      );
      return;
    }
    if (
      ticket.environmentId !== context.environmentId ||
      parsed.value.environmentId !== context.environmentId
    ) {
      this.respondFailure(
        response,
        'ENVIRONMENT_MISMATCH',
        'Agent environment does not match this Web deployment',
        409,
      );
      return;
    }
    if (
      ticket.instanceId !== this.instanceId ||
      parsed.value.instanceId !== this.instanceId
    ) {
      this.respondFailure(
        response,
        'INSTANCE_MISMATCH',
        'Agent bridge instance changed',
        409,
      );
      return;
    }
    if (ticket.webOrigin !== origin) {
      this.respondFailure(
        response,
        'ORIGIN_DENIED',
        'Origin is not allowed',
        403,
      );
      return;
    }
    if (
      !parsed.value.supportedVersions.includes(AGENT_BRIDGE_PROTOCOL_VERSION)
    ) {
      this.respondFailure(
        response,
        'VERSION_INCOMPATIBLE',
        'Agent bridge version is incompatible',
        426,
      );
      return;
    }
    const sessionToken = this.randomToken();
    const expiresAt = this.now().getTime() + this.sessionTtlMs;
    this.sessions.set(hashToken(sessionToken), {
      environmentId: context.environmentId,
      expiresAt,
      instanceId: this.instanceId,
      webOrigin: origin,
    });
    const session: AgentBridgeSession = {
      environmentId: context.environmentId,
      expiresAt: new Date(expiresAt).toISOString(),
      instanceId: this.instanceId,
      protocolVersion: AGENT_BRIDGE_PROTOCOL_VERSION,
      sessionToken,
    };
    this.respondJson(response, 200, session);
  }

  private async handleRpc(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const body = await this.readJson(request);
    if (!body.ok) {
      this.respondFailure(response, body.code, body.message, 400);
      return;
    }
    const parsed = validateAgentBridgeRpcRequest(body.value);
    if (!parsed.ok) {
      const directsToNativeSettings =
        /forbidden metadata/i.test(parsed.message) ||
        containsTrustBoundaryMutation(body.value);
      this.respondFailure(
        response,
        'INVALID_REQUEST',
        directsToNativeSettings
          ? TRUST_BOUNDARY_REJECTION_MESSAGE
          : 'Bridge RPC request is invalid',
        400,
      );
      return;
    }
    const result = await this.dispatchRpc(parsed.value);
    if (!result.ok) {
      this.respondJson(
        response,
        result.status,
        bridgeFailure(result.code, result.message),
      );
      return;
    }
    this.respondJson(response, 200, {
      id: parsed.value.id,
      ok: true,
      protocolVersion: AGENT_BRIDGE_PROTOCOL_VERSION,
      result: result.value,
    });
  }

  private async dispatchRpc(request: AgentBridgeRpcRequest): Promise<
    | { readonly ok: true; readonly value: unknown }
    | {
        readonly ok: false;
        readonly code: AgentBridgeErrorCode;
        readonly message: string;
        readonly status: number;
      }
  > {
    if (containsTrustBoundaryMutation(request.params)) {
      return {
        code: 'INVALID_REQUEST',
        message: TRUST_BOUNDARY_REJECTION_MESSAGE,
        ok: false,
        status: 400,
      };
    }
    if (request.method === 'settings.update') {
      const settings = validateAgentBridgeSettingsPatch(request.params);
      return settings.ok
        ? { ok: true, value: await this.options.updateSettings(settings.value) }
        : {
            code: 'INVALID_REQUEST',
            message: 'Settings mutation is invalid',
            ok: false,
            status: 400,
          };
    }
    if (request.method === 'profile.delete') {
      const params = parseProfileDeletion(request.params);
      if (!params.ok) {
        return params;
      }
      if (this.options.isProfileLocked?.(params.value)) {
        return {
          code: 'PROFILE_LOCKED',
          message: 'Browser profile is currently in use',
          ok: false,
          status: 409,
        };
      }
      await this.options.deleteProfile(params.value);
      return { ok: true, value: { deleted: true } };
    }
    if (request.method === 'lifecycle.action') {
      const action = parseLifecycleAction(request.params);
      if (!action) {
        return {
          code: 'LIFECYCLE_UNAVAILABLE',
          message: 'Lifecycle action is not supported',
          ok: false,
          status: 400,
        };
      }
      const result = await this.options.lifecycleAction(action);
      if (isRejectedLifecycleResult(result)) {
        return {
          code: 'LIFECYCLE_UNAVAILABLE',
          message: 'Lifecycle adapter is unavailable for this action',
          ok: false,
          status: 409,
        };
      }
      return { ok: true, value: result };
    }
    if (request.method === 'browser.command') {
      const command = validateBrowserRuntimeRequest(request.params);
      if (!command.ok || containsExcessiveTimeout(request.params)) {
        return {
          code: 'BROWSER_COMMAND_REJECTED',
          message: 'Controlled browser command is invalid or unsupported',
          ok: false,
          status: 400,
        };
      }
      try {
        return {
          ok: true,
          value: await withTimeout(
            this.options.executeBrowserCommand(command.value),
            BROWSER_COMMAND_TIMEOUT_MS,
          ),
        };
      } catch {
        return {
          code: 'BROWSER_COMMAND_REJECTED',
          message: 'Controlled browser command failed or timed out',
          ok: false,
          status: 504,
        };
      }
    }
    return {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Bridge RPC method is not allowed',
      ok: false,
      status: 405,
    };
  }

  private authenticate(
    request: IncomingMessage,
    context: AgentBridgeContext,
  ):
    | { readonly ok: true }
    | {
        readonly ok: false;
        readonly code: 'SESSION_INVALID' | 'SESSION_EXPIRED';
        readonly message: string;
      } {
    const authorization = readHeader(request, 'authorization');
    const rawToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    if (!rawToken) {
      return {
        code: 'SESSION_INVALID',
        message: 'Bridge session is required',
        ok: false,
      };
    }
    const session = this.sessions.get(hashToken(rawToken));
    if (!session) {
      return {
        code: 'SESSION_INVALID',
        message: 'Bridge session is invalid',
        ok: false,
      };
    }
    if (session.expiresAt <= this.now().getTime()) {
      this.sessions.delete(hashToken(rawToken));
      return {
        code: 'SESSION_EXPIRED',
        message: 'Bridge session expired',
        ok: false,
      };
    }
    if (
      session.environmentId !== context.environmentId ||
      session.instanceId !== this.instanceId ||
      session.webOrigin !== readHeader(request, 'origin')
    ) {
      return {
        code: 'SESSION_INVALID',
        message: 'Bridge session scope is invalid',
        ok: false,
      };
    }
    return { ok: true };
  }

  private handlePreflight(
    request: IncomingMessage,
    response: ServerResponse,
  ): void {
    const requestedMethod = readHeader(
      request,
      'access-control-request-method',
    );
    const requestedHeaders = (
      readHeader(request, 'access-control-request-headers') ?? ''
    )
      .split(',')
      .map((header) => header.trim().toLowerCase())
      .filter(Boolean);
    if (
      !requestedMethod ||
      !['GET', 'POST'].includes(requestedMethod) ||
      requestedHeaders.some((header) => !ALLOWED_HEADERS.has(header))
    ) {
      this.respondFailure(
        response,
        'METHOD_NOT_ALLOWED',
        'Bridge preflight is not allowed',
        403,
      );
      return;
    }
    response.statusCode = 204;
    response.setHeader('Access-Control-Allow-Methods', requestedMethod);
    response.setHeader(
      'Access-Control-Allow-Headers',
      requestedHeaders.join(', '),
    );
    response.setHeader('Access-Control-Max-Age', '60');
    response.end();
  }

  private async readJson(request: IncomingMessage): Promise<
    | { readonly ok: true; readonly value: unknown }
    | {
        readonly ok: false;
        readonly code: 'CONTENT_TYPE_REQUIRED' | 'INVALID_REQUEST';
        readonly message: string;
      }
  > {
    const contentType = readHeader(request, 'content-type');
    if (!contentType?.toLowerCase().startsWith('application/json')) {
      return {
        code: 'CONTENT_TYPE_REQUIRED',
        message: 'Bridge requests require JSON content type',
        ok: false,
      };
    }
    let raw = '';
    for await (const chunk of request) {
      raw += chunk.toString();
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        return {
          code: 'INVALID_REQUEST',
          message: 'Bridge request is too large',
          ok: false,
        };
      }
    }
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      return {
        code: 'INVALID_REQUEST',
        message: 'Bridge request must contain valid JSON',
        ok: false,
      };
    }
  }

  private hasExpectedHost(
    request: IncomingMessage,
    info: AgentLocalBridgeInfo,
  ): boolean {
    const formattedHost = info.host === '::1' ? '[::1]' : '127.0.0.1';
    return readHeader(request, 'host') === `${formattedHost}:${info.port}`;
  }

  private setCors(response: ServerResponse, origin: string): void {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  private respondJson(
    response: ServerResponse,
    status: number,
    value: unknown,
  ): void {
    response.statusCode = status;
    response.setHeader('Content-Type', JSON_CONTENT_TYPE);
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(value));
  }

  private respondFailure(
    response: ServerResponse,
    code: AgentBridgeErrorCode,
    message: string,
    status: number,
  ): void {
    this.respondJson(response, status, bridgeFailure(code, message));
  }

  private cleanupExpired(): void {
    const now = this.now().getTime();
    for (const [key, ticket] of this.tickets) {
      if (ticket.expiresAt + this.ticketTtlMs <= now) {
        this.tickets.delete(key);
      }
    }
    for (const [key, session] of this.sessions) {
      if (session.expiresAt + this.sessionTtlMs <= now) {
        this.sessions.delete(key);
      }
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

function readHeader(
  request: IncomingMessage,
  name: string,
): string | undefined {
  const value = request.headers[name];
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function parseProfileDeletion(input: unknown):
  | {
      readonly ok: true;
      readonly value: { readonly siteId: string; readonly profileName: string };
    }
  | {
      readonly ok: false;
      readonly code: 'CONFIRMATION_REQUIRED' | 'INVALID_REQUEST';
      readonly message: string;
      readonly status: number;
    } {
  if (!input || typeof input !== 'object') {
    return {
      code: 'INVALID_REQUEST',
      message: 'Profile deletion request is invalid',
      ok: false,
      status: 400,
    };
  }
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).some(
      (key) => !['confirm', 'profileName', 'siteId'].includes(key),
    )
  ) {
    return {
      code: 'INVALID_REQUEST',
      message: 'Profile deletion request contains unsupported fields',
      ok: false,
      status: 400,
    };
  }
  if (value.confirm !== true) {
    return {
      code: 'CONFIRMATION_REQUIRED',
      message: 'Profile deletion requires explicit confirmation',
      ok: false,
      status: 409,
    };
  }
  if (
    typeof value.siteId !== 'string' ||
    !/^[a-z][a-z0-9_-]{0,63}$/.test(value.siteId) ||
    typeof value.profileName !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value.profileName)
  ) {
    return {
      code: 'INVALID_REQUEST',
      message: 'Profile key is invalid',
      ok: false,
      status: 400,
    };
  }
  return {
    ok: true,
    value: { profileName: value.profileName, siteId: value.siteId },
  };
}

function parseLifecycleAction(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((key) => key !== 'action')) {
    return undefined;
  }
  const action = value.action;
  return typeof action === 'string' &&
    [
      'agent.restart',
      'agent.quit',
      'autostart.enable',
      'autostart.disable',
    ].includes(action)
    ? action
    : undefined;
}

function containsTrustBoundaryMutation(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some(containsTrustBoundaryMutation);
  }
  if (!input || typeof input !== 'object') {
    return false;
  }
  for (const [key, value] of Object.entries(input)) {
    if (TRUST_BOUNDARY_FIELD.test(key)) {
      return true;
    }
    if (containsTrustBoundaryMutation(value)) {
      return true;
    }
  }
  return false;
}

function isRejectedLifecycleResult(input: unknown): boolean {
  return Boolean(
    input &&
      typeof input === 'object' &&
      'accepted' in input &&
      (input as { readonly accepted?: unknown }).accepted === false,
  );
}

function containsExcessiveTimeout(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some(containsExcessiveTimeout);
  }
  if (!input || typeof input !== 'object') {
    return false;
  }
  for (const [key, value] of Object.entries(input)) {
    if (
      key === 'timeoutMs' &&
      (typeof value !== 'number' || value > BROWSER_COMMAND_TIMEOUT_MS)
    ) {
      return true;
    }
    if (containsExcessiveTimeout(value)) {
      return true;
    }
  }
  return false;
}

function withTimeout<T>(task: T | Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Agent bridge operation timed out')),
      timeoutMs,
    );
    timer.unref();
    Promise.resolve(task).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
