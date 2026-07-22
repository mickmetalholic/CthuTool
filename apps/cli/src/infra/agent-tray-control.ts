import { readFile, stat } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const TRAY_CONTROL_PROTOCOL_VERSION = 1;

export type TrayInstanceRecord = {
  readonly protocolVersion: number;
  readonly pid: number;
  readonly nonce: string;
  readonly controlEndpoint: string;
  readonly executablePath: string;
  readonly processStartedAt: number;
};

export type TraySnapshot = {
  readonly state: string;
  readonly activeEnvironmentId?: string;
  readonly environments: readonly {
    readonly id: string;
    readonly label: string;
    readonly active: boolean;
  }[];
  readonly detail?: string;
};

type TrayControlResponse = {
  readonly ok: boolean;
  readonly protocolVersion: number;
  readonly result?: unknown;
  readonly error?: { readonly code?: string; readonly message?: string };
};

export function resolveAgentUserDataDir(input?: string): string {
  if (input?.trim()) {
    return input;
  }
  if (process.env.CTHUTOOL_AGENT_DATA_DIR?.trim()) {
    return process.env.CTHUTOOL_AGENT_DATA_DIR;
  }
  if (process.platform === 'darwin') {
    return join(
      homedir(),
      'Library',
      'Application Support',
      'CthuTool',
      'agent',
    );
  }
  if (process.platform === 'win32') {
    return join(
      process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'),
      'CthuTool',
      'agent',
    );
  }
  return join(
    process.env.XDG_STATE_HOME ?? join(homedir(), '.local', 'state'),
    'cthutool',
    'agent',
  );
}

export function resolveTrayInstancePath(userDataDir: string): string {
  return join(userDataDir, 'runtime', 'tray-instance.json');
}

export async function readTrayInstanceRecord(
  instancePath: string,
): Promise<TrayInstanceRecord | undefined> {
  let input: unknown;
  try {
    input = JSON.parse(await readFile(instancePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
  if (!isRecord(input)) {
    throw new Error('Tray instance record is invalid');
  }
  return input;
}

export async function requestTrayShutdown(input: {
  readonly record: TrayInstanceRecord;
  readonly timeoutMs?: number;
}): Promise<void> {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation: 'shutdown',
    timeoutMs: input.timeoutMs,
  });
  if (!response.ok) {
    throw new Error(
      response.error?.message ??
        response.error?.code ??
        'Tray rejected shutdown',
    );
  }
}

export async function requestTrayHealth(input: {
  readonly record: TrayInstanceRecord;
  readonly timeoutMs?: number;
}): Promise<TraySnapshot> {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation: 'health',
    timeoutMs: input.timeoutMs,
  });
  if (!response.ok || !isTraySnapshot(response.result)) {
    throw new Error(
      response.error?.message ??
        response.error?.code ??
        'Tray health is invalid',
    );
  }
  return response.result;
}

export async function requestTrayOpen(input: {
  readonly record: TrayInstanceRecord;
  readonly timeoutMs?: number;
}): Promise<void> {
  await requestAccepted(input, 'open');
}

export async function requestTrayEnvironmentSwitch(input: {
  readonly record: TrayInstanceRecord;
  readonly environmentId: string;
  readonly timeoutMs?: number;
}): Promise<void> {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation: 'environment.switch',
    environmentId: input.environmentId,
    timeoutMs: input.timeoutMs,
  });
  if (!response.ok) {
    throw new Error(
      response.error?.message ??
        response.error?.code ??
        'Tray rejected environment switch',
    );
  }
}

export async function waitForTrayExit(input: {
  readonly instancePath: string;
  readonly record: TrayInstanceRecord;
  readonly timeoutMs?: number;
  readonly pollMs?: number;
}): Promise<void> {
  const deadline = Date.now() + (input.timeoutMs ?? 10_000);
  while (Date.now() < deadline) {
    const current = await readTrayInstanceRecord(input.instancePath);
    if (!current || !sameInstance(current, input.record)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, input.pollMs ?? 50));
  }
  throw new Error('Timed out waiting for tray-owned Agent shutdown');
}

export async function stopTrayOwnedAgent(input: {
  readonly userDataDir?: string;
  readonly timeoutMs?: number;
}): Promise<'stopped' | 'already-stopped'> {
  const instancePath = resolveTrayInstancePath(
    resolveAgentUserDataDir(input.userDataDir),
  );
  const record = await readTrayInstanceRecord(instancePath);
  if (!record) {
    return 'already-stopped';
  }
  await assertPrivateRecord(instancePath);
  await requestTrayShutdown({ record, timeoutMs: input.timeoutMs });
  await waitForTrayExit({
    instancePath,
    record,
    timeoutMs: input.timeoutMs,
  });
  return 'stopped';
}

export async function requestTrayControl(input: {
  readonly endpoint: string;
  readonly nonce: string;
  readonly operation: string;
  readonly environmentId?: string;
  readonly timeoutMs?: number;
}): Promise<TrayControlResponse> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(input.endpoint);
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Tray control request timed out'));
    }, input.timeoutMs ?? 2_000);
    let payload = '';
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      action();
    };
    socket.setEncoding('utf8');
    socket.once('connect', () => {
      socket.write(
        `${JSON.stringify({
          protocolVersion: TRAY_CONTROL_PROTOCOL_VERSION,
          instanceNonce: input.nonce,
          operation: input.operation,
          ...(input.environmentId === undefined
            ? {}
            : { environmentId: input.environmentId }),
        })}\n`,
      );
    });
    socket.on('data', (chunk: string) => {
      payload += chunk;
      if (Buffer.byteLength(payload) > 64 * 1024) {
        finish(() => reject(new Error('Tray control response is too large')));
        socket.destroy();
        return;
      }
      const newline = payload.indexOf('\n');
      if (newline === -1) {
        return;
      }
      finish(() => {
        try {
          const response = JSON.parse(
            payload.slice(0, newline),
          ) as TrayControlResponse;
          if (
            typeof response.ok !== 'boolean' ||
            response.protocolVersion !== TRAY_CONTROL_PROTOCOL_VERSION
          ) {
            throw new Error('Tray control response is invalid');
          }
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
      socket.end();
    });
    socket.once('error', (error) => finish(() => reject(error)));
  });
}

async function requestAccepted(
  input: { readonly record: TrayInstanceRecord; readonly timeoutMs?: number },
  operation: string,
): Promise<void> {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation,
    timeoutMs: input.timeoutMs,
  });
  if (!response.ok) {
    throw new Error(
      response.error?.message ??
        response.error?.code ??
        `Tray rejected ${operation}`,
    );
  }
}

async function assertPrivateRecord(instancePath: string): Promise<void> {
  if (process.platform === 'win32') {
    return;
  }
  const metadata = await stat(instancePath);
  if ((metadata.mode & 0o077) !== 0) {
    throw new Error('Tray instance record is not user-private');
  }
}

function sameInstance(
  left: TrayInstanceRecord,
  right: TrayInstanceRecord,
): boolean {
  return (
    left.pid === right.pid &&
    left.nonce === right.nonce &&
    left.executablePath === right.executablePath &&
    left.processStartedAt === right.processStartedAt
  );
}

function isRecord(value: unknown): value is TrayInstanceRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Partial<TrayInstanceRecord>;
  return (
    record.protocolVersion === TRAY_CONTROL_PROTOCOL_VERSION &&
    typeof record.pid === 'number' &&
    Number.isSafeInteger(record.pid) &&
    record.pid > 0 &&
    typeof record.nonce === 'string' &&
    record.nonce.length >= 16 &&
    typeof record.controlEndpoint === 'string' &&
    record.controlEndpoint.length > 0 &&
    typeof record.executablePath === 'string' &&
    record.executablePath.length > 0 &&
    typeof record.processStartedAt === 'number' &&
    record.processStartedAt > 0
  );
}

function isTraySnapshot(value: unknown): value is TraySnapshot {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as Partial<TraySnapshot>).state === 'string' &&
      Array.isArray((value as Partial<TraySnapshot>).environments),
  );
}
