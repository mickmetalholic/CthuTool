import { createHash } from 'node:crypto';
import { chmod, mkdir, rm } from 'node:fs/promises';
import {
  createConnection,
  createServer,
  type Server,
  type Socket,
} from 'node:net';
import { dirname, join } from 'node:path';
import type { AgentInstanceRecord } from './instance-lock';
import type { AgentBridgeLaunch } from './local-bridge';
import type { AgentRuntimeHealth } from './runtime-service';
import { AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION } from './runtime-state';

export type AgentControlOperation =
  | 'health'
  | 'status'
  | 'shutdown'
  | 'bridge.launch'
  | 'environment.list'
  | 'environment.switch';

type AgentControlRequestBase = {
  readonly protocolVersion: number;
  readonly instanceNonce: string;
};

export type AgentControlRequest = AgentControlRequestBase & {
  readonly operation: AgentControlOperation;
  readonly environmentId?: string;
};

export type AgentControlEnvironment = {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
};

export type AgentControlEnvironmentList = {
  readonly environments: readonly AgentControlEnvironment[];
};

export type AgentControlEnvironmentSwitch = {
  readonly accepted: true;
  readonly environmentId: string;
};

export type AgentControlResponse =
  | {
      readonly ok: true;
      readonly protocolVersion: number;
      readonly result:
        | AgentRuntimeHealth
        | AgentBridgeLaunch
        | AgentControlEnvironmentList
        | AgentControlEnvironmentSwitch
        | { readonly accepted: true };
    }
  | {
      readonly ok: false;
      readonly protocolVersion: number;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'UNAUTHORIZED_INSTANCE'
          | 'INCOMPATIBLE_PROTOCOL'
          | 'INVALID_ENVIRONMENT'
          | 'ENVIRONMENT_SWITCH_FAILED'
          | 'UNKNOWN_OPERATION'
          | 'INTERNAL_ERROR';
        readonly message: string;
      };
    };

type AgentControlSuccessResult = Extract<
  AgentControlResponse,
  { readonly ok: true }
>['result'];

export type AgentControlServerOptions = {
  readonly endpoint: string;
  readonly instanceNonce: string;
  readonly getHealth: () => AgentRuntimeHealth;
  readonly shutdown: () => Promise<void>;
  readonly issueBridgeLaunch?: () => AgentBridgeLaunch;
  readonly listEnvironments?: () => readonly AgentControlEnvironment[];
  readonly switchEnvironment?: (environmentId: string) => Promise<void>;
  readonly maxRequestBytes?: number;
  readonly platform?: NodeJS.Platform;
};

export type AgentControlServerPort = {
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
};

export class AgentControlServer implements AgentControlServerPort {
  private server?: Server;
  private readonly maxRequestBytes: number;
  private readonly platform: NodeJS.Platform;

  constructor(private readonly options: AgentControlServerOptions) {
    this.maxRequestBytes = options.maxRequestBytes ?? 16 * 1024;
    this.platform = options.platform ?? process.platform;
  }

  async start(): Promise<void> {
    if (this.server) {
      return;
    }
    if (this.platform !== 'win32') {
      await mkdir(dirname(this.options.endpoint), {
        mode: 0o700,
        recursive: true,
      });
      await rm(this.options.endpoint, { force: true });
    }
    const server = createServer((socket) => this.handleSocket(socket));
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        server.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        server.off('error', onError);
        resolve();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(this.options.endpoint);
    });
    this.server = server;
    if (this.platform !== 'win32') {
      await chmod(this.options.endpoint, 0o600);
    }
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = undefined;
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    if (this.platform !== 'win32') {
      await rm(this.options.endpoint, { force: true });
    }
  }

  private handleSocket(socket: Socket): void {
    socket.setEncoding('utf8');
    let payload = '';
    let handled = false;
    socket.on('data', (chunk: string) => {
      if (handled) {
        return;
      }
      payload += chunk;
      if (Buffer.byteLength(payload) > this.maxRequestBytes) {
        handled = true;
        this.writeResponse(
          socket,
          failure('INVALID_REQUEST', 'Control request is too large'),
        );
        return;
      }
      const newline = payload.indexOf('\n');
      if (newline === -1) {
        return;
      }
      handled = true;
      void this.dispatch(socket, payload.slice(0, newline));
    });
    socket.on('error', () => undefined);
  }

  private async dispatch(socket: Socket, raw: string): Promise<void> {
    const request = parseRequest(raw);
    if (!request) {
      this.writeResponse(
        socket,
        failure('INVALID_REQUEST', 'Control request is invalid'),
      );
      return;
    }
    if (request.protocolVersion !== AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION) {
      this.writeResponse(
        socket,
        failure(
          'INCOMPATIBLE_PROTOCOL',
          'Control protocol version is incompatible',
        ),
      );
      return;
    }
    if (request.instanceNonce !== this.options.instanceNonce) {
      this.writeResponse(
        socket,
        failure(
          'UNAUTHORIZED_INSTANCE',
          'Control instance identity is invalid',
        ),
      );
      return;
    }
    if (request.operation === 'health' || request.operation === 'status') {
      this.writeResponse(socket, success(this.options.getHealth()));
      return;
    }
    if (request.operation === 'shutdown') {
      this.writeResponse(socket, success({ accepted: true }), () => {
        void this.options.shutdown();
      });
      return;
    }
    if (request.operation === 'bridge.launch') {
      if (!this.options.issueBridgeLaunch) {
        this.writeResponse(
          socket,
          failure('UNKNOWN_OPERATION', 'Bridge launch is unavailable'),
        );
        return;
      }
      this.writeResponse(socket, success(this.options.issueBridgeLaunch()));
      return;
    }
    if (request.operation === 'environment.list') {
      if (!this.options.listEnvironments) {
        this.writeResponse(
          socket,
          failure('UNKNOWN_OPERATION', 'Environment listing is unavailable'),
        );
        return;
      }
      this.writeResponse(
        socket,
        success({ environments: this.options.listEnvironments() }),
      );
      return;
    }
    if (request.operation === 'environment.switch') {
      if (!request.environmentId) {
        this.writeResponse(
          socket,
          failure('INVALID_ENVIRONMENT', 'Environment id is required'),
        );
        return;
      }
      if (!this.options.switchEnvironment) {
        this.writeResponse(
          socket,
          failure('UNKNOWN_OPERATION', 'Environment switching is unavailable'),
        );
        return;
      }
      try {
        await this.options.switchEnvironment(request.environmentId);
        this.writeResponse(
          socket,
          success({
            accepted: true,
            environmentId: request.environmentId,
          }),
        );
      } catch (error) {
        this.writeResponse(
          socket,
          failure(
            error instanceof Error &&
              error.message.startsWith('Unknown Agent environment')
              ? 'INVALID_ENVIRONMENT'
              : 'ENVIRONMENT_SWITCH_FAILED',
            error instanceof Error
              ? error.message
              : 'Environment switch failed',
          ),
        );
      }
      return;
    }
    this.writeResponse(
      socket,
      failure('UNKNOWN_OPERATION', 'Control operation is unsupported'),
    );
  }

  private writeResponse(
    socket: Socket,
    response: AgentControlResponse,
    afterWrite?: () => void,
  ): void {
    socket.end(`${JSON.stringify(response)}\n`, afterWrite);
  }
}

export function resolveAgentControlEndpoint(input: {
  readonly runtimeDir: string;
  readonly platform?: NodeJS.Platform;
}): string {
  if ((input.platform ?? process.platform) === 'win32') {
    const digest = createHash('sha256')
      .update(input.runtimeDir)
      .digest('hex')
      .slice(0, 20);
    return `\\\\.\\pipe\\cthutool-agent-${digest}`;
  }
  return join(input.runtimeDir, 'control.sock');
}

export async function requestAgentControl(input: {
  readonly endpoint: string;
  readonly instanceNonce: string;
  readonly operation: AgentControlOperation;
  readonly protocolVersion?: number;
  readonly timeoutMs?: number;
  readonly environmentId?: string;
}): Promise<AgentControlResponse> {
  return new Promise<AgentControlResponse>((resolve, reject) => {
    const socket = createConnection(input.endpoint);
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Agent control request timed out'));
    }, input.timeoutMs ?? 2_000);
    let payload = '';
    const finish = (task: () => void) => {
      clearTimeout(timeout);
      task();
    };
    socket.setEncoding('utf8');
    socket.once('connect', () => {
      const request: AgentControlRequest = {
        protocolVersion:
          input.protocolVersion ?? AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION,
        instanceNonce: input.instanceNonce,
        operation: input.operation,
        ...(input.environmentId === undefined
          ? {}
          : { environmentId: input.environmentId }),
      };
      socket.write(`${JSON.stringify(request)}\n`);
    });
    socket.on('data', (chunk: string) => {
      payload += chunk;
      if (Buffer.byteLength(payload) > 64 * 1024) {
        finish(() => reject(new Error('Agent control response is too large')));
        socket.destroy();
        return;
      }
      const newline = payload.indexOf('\n');
      if (newline === -1) {
        return;
      }
      const response = parseResponse(payload.slice(0, newline));
      finish(() =>
        response
          ? resolve(response)
          : reject(new Error('Agent control response is invalid')),
      );
      socket.end();
    });
    socket.once('error', (error) => finish(() => reject(error)));
  });
}

export async function probeAgentControl(
  record: AgentInstanceRecord,
): Promise<boolean> {
  try {
    const response = await requestAgentControl({
      endpoint: record.controlEndpoint,
      instanceNonce: record.nonce,
      operation: 'health',
      protocolVersion: record.protocolVersion,
      timeoutMs: 500,
    });
    return response.ok;
  } catch {
    return false;
  }
}

function parseRequest(raw: string): AgentControlRequest | undefined {
  try {
    const value = JSON.parse(raw) as Partial<AgentControlRequest>;
    if (
      typeof value.protocolVersion !== 'number' ||
      typeof value.instanceNonce !== 'string' ||
      (value.operation !== 'health' &&
        value.operation !== 'status' &&
        value.operation !== 'shutdown' &&
        value.operation !== 'bridge.launch' &&
        value.operation !== 'environment.list' &&
        value.operation !== 'environment.switch')
    ) {
      return undefined;
    }
    if (
      value.environmentId !== undefined &&
      (typeof value.environmentId !== 'string' || !value.environmentId)
    ) {
      return undefined;
    }
    return value as AgentControlRequest;
  } catch {
    return undefined;
  }
}

function parseResponse(raw: string): AgentControlResponse | undefined {
  try {
    const value = JSON.parse(raw) as Partial<AgentControlResponse>;
    return typeof value.ok === 'boolean' &&
      value.protocolVersion === AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION
      ? (value as AgentControlResponse)
      : undefined;
  } catch {
    return undefined;
  }
}

function success(result: AgentControlSuccessResult): AgentControlResponse {
  return {
    ok: true,
    protocolVersion: AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION,
    result,
  };
}

function failure(
  code: Extract<AgentControlResponse, { ok: false }>['error']['code'],
  message: string,
): AgentControlResponse {
  return {
    ok: false,
    protocolVersion: AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION,
    error: { code, message },
  };
}
