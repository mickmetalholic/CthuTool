import {
  AGENT_BRIDGE_PROTOCOL_VERSION,
  type AgentBridgeErrorCode,
  type AgentBridgeResourceSnapshot,
  type AgentBridgeRpcMethod,
  type AgentBridgeSession,
} from '@cthutool/agent-bridge-protocol';

export type AgentBridgeFragment = {
  readonly endpoint: string;
  readonly environmentId: string;
  readonly instanceId: string;
  readonly ticket: string;
};

export type AgentBridgeBootstrapState =
  | 'permission-required'
  | 'permission-denied'
  | 'not-running'
  | 'ticket-expired'
  | 'origin-mismatch'
  | 'environment-mismatch'
  | 'version-incompatible'
  | 'backend-offline'
  | 'stale-session'
  | 'ready';

export type AgentLocalNetworkPermissionState = PermissionState | 'unsupported';

export class AgentBridgeClientError extends Error {
  constructor(
    readonly code: AgentBridgeErrorCode | 'NETWORK_UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'AgentBridgeClientError';
  }
}

export class AgentBridgeFetchClient {
  #sessionToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(
    readonly endpoint: string,
    fetchImpl: typeof fetch = fetch,
  ) {
    assertLoopbackEndpoint(endpoint);
    this.fetchImpl = fetchImpl;
  }

  async connect(
    fragment: AgentBridgeFragment,
  ): Promise<Omit<AgentBridgeSession, 'sessionToken'>> {
    const response = await this.request('/v1/session', {
      body: JSON.stringify({
        environmentId: fragment.environmentId,
        instanceId: fragment.instanceId,
        supportedVersions: [AGENT_BRIDGE_PROTOCOL_VERSION],
        ticket: fragment.ticket,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const session = (await response.json()) as AgentBridgeSession;
    if (
      session.protocolVersion !== AGENT_BRIDGE_PROTOCOL_VERSION ||
      session.environmentId !== fragment.environmentId ||
      session.instanceId !== fragment.instanceId ||
      !/^[a-zA-Z0-9_-]{32,512}$/.test(session.sessionToken)
    ) {
      throw new AgentBridgeClientError(
        'VERSION_INCOMPATIBLE',
        'Agent bridge returned an incompatible session',
      );
    }
    const { sessionToken, ...connection } = session;
    this.#sessionToken = sessionToken;
    return connection;
  }

  disconnect(): void {
    this.#sessionToken = undefined;
  }

  async getResources(): Promise<AgentBridgeResourceSnapshot> {
    const response = await this.authorizedRequest('/v1/resources', {
      method: 'GET',
    });
    return (await response.json()) as AgentBridgeResourceSnapshot;
  }

  async rpc(method: AgentBridgeRpcMethod, params?: unknown): Promise<unknown> {
    const response = await this.authorizedRequest('/v1/rpc', {
      body: JSON.stringify({
        id: crypto.randomUUID(),
        method,
        params,
        protocolVersion: AGENT_BRIDGE_PROTOCOL_VERSION,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const body = (await response.json()) as { readonly result?: unknown };
    return body.result;
  }

  startPolling(
    onUpdate: (snapshot: AgentBridgeResourceSnapshot) => void,
    options: {
      readonly intervalMs?: number;
      readonly maxAttempts?: number;
      readonly onError?: (error: unknown) => void;
    } = {},
  ): () => void {
    const intervalMs = Math.max(1_000, options.intervalMs ?? 3_000);
    const maxAttempts = Math.min(300, Math.max(1, options.maxAttempts ?? 120));
    let stopped = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (stopped || attempts >= maxAttempts) {
        return;
      }
      attempts += 1;
      try {
        onUpdate(await this.getResources());
      } catch (error) {
        options.onError?.(error);
        if (error instanceof AgentBridgeClientError) {
          stopped = true;
          return;
        }
      }
      if (!stopped && attempts < maxAttempts) {
        timer = setTimeout(poll, intervalMs);
      }
    };
    timer = setTimeout(poll, intervalMs);
    return () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }

  private authorizedRequest(
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    if (!this.#sessionToken) {
      throw new AgentBridgeClientError(
        'SESSION_INVALID',
        'Open Agent settings again from the tray',
      );
    }
    return this.request(path, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${this.#sessionToken}`,
      },
    });
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.endpoint}${path}`, {
        ...init,
        cache: 'no-store',
        credentials: 'omit',
        mode: 'cors',
        targetAddressSpace: 'loopback',
      } as RequestInit & { readonly targetAddressSpace: 'loopback' });
    } catch {
      throw new AgentBridgeClientError(
        'NETWORK_UNAVAILABLE',
        'Browser could not reach the local Agent bridge',
      );
    }
    if (!response.ok) {
      const body = await response.json().catch(() => undefined);
      const error = body as {
        readonly error?: {
          readonly code?: AgentBridgeErrorCode;
          readonly message?: string;
        };
      };
      throw new AgentBridgeClientError(
        error?.error?.code ?? 'INTERNAL_ERROR',
        error?.error?.message ?? 'Agent bridge request failed',
      );
    }
    return response;
  }
}

export function consumeAgentBridgeFragment(input: {
  readonly deploymentEnvironment: string;
  readonly hash: string;
  readonly clear: () => void;
}): AgentBridgeFragment | undefined {
  if (!input.hash || input.hash === '#') {
    return undefined;
  }
  const fragment = new URLSearchParams(input.hash.replace(/^#/, ''));
  const endpoint = fragment.get('endpoint') ?? '';
  const environmentId = fragment.get('environment') ?? '';
  const instanceId = fragment.get('instance') ?? '';
  const ticket = fragment.get('ticket') ?? '';
  input.clear();
  if (environmentId !== input.deploymentEnvironment) {
    throw new AgentBridgeClientError(
      'ENVIRONMENT_MISMATCH',
      'The opened Agent environment does not match this deployment',
    );
  }
  assertLoopbackEndpoint(endpoint);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(instanceId)) {
    throw new AgentBridgeClientError(
      'INSTANCE_MISMATCH',
      'Agent bridge instance is invalid',
    );
  }
  if (!/^[a-zA-Z0-9_-]{32,512}$/.test(ticket)) {
    throw new AgentBridgeClientError(
      'TICKET_INVALID',
      'Agent launch ticket is invalid',
    );
  }
  return { endpoint, environmentId, instanceId, ticket };
}

export function classifyAgentBridgeError(
  error: unknown,
  permissionState: AgentLocalNetworkPermissionState = 'unsupported',
): AgentBridgeBootstrapState {
  if (!(error instanceof AgentBridgeClientError)) {
    return 'not-running';
  }
  switch (error.code) {
    case 'NETWORK_UNAVAILABLE':
      return permissionState === 'denied'
        ? 'permission-denied'
        : permissionState === 'prompt'
          ? 'permission-required'
          : 'not-running';
    case 'TICKET_EXPIRED':
    case 'TICKET_INVALID':
      return 'ticket-expired';
    case 'ORIGIN_DENIED':
      return 'origin-mismatch';
    case 'ENVIRONMENT_MISMATCH':
    case 'INSTANCE_MISMATCH':
      return 'environment-mismatch';
    case 'VERSION_INCOMPATIBLE':
      return 'version-incompatible';
    case 'SESSION_EXPIRED':
    case 'SESSION_INVALID':
      return 'stale-session';
    default:
      return 'not-running';
  }
}

export async function queryLocalNetworkPermission(): Promise<AgentLocalNetworkPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({
      name: 'local-network-access',
    } as unknown as PermissionDescriptor);
    return status.state;
  } catch {
    return 'unsupported';
  }
}

function assertLoopbackEndpoint(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new AgentBridgeClientError(
      'HOST_DENIED',
      'Agent bridge endpoint is invalid',
    );
  }
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', '[::1]'].includes(url.hostname) ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new AgentBridgeClientError(
      'HOST_DENIED',
      'Agent bridge endpoint must be an exact loopback origin',
    );
  }
}
