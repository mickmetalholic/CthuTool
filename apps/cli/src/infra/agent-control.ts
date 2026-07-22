import { readFile, stat } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { join } from 'node:path';

export type AgentInstanceRecord = {
  readonly protocolVersion: number;
  readonly pid: number;
  readonly nonce: string;
  readonly controlEndpoint: string;
  readonly executablePath: string;
  readonly entryPoint: string;
  readonly startedAt: string;
};

export type AgentHealth = {
  readonly applicationVersion: string;
  readonly process: { readonly state: string };
  readonly backend: { readonly status: string; readonly lastError?: string };
  readonly environment: { readonly id?: string; readonly label?: string };
  readonly browser: {
    readonly ready: boolean;
    readonly status: string;
    readonly message?: string;
  };
};

export async function readAgentInstance(
  userDataDir: string,
): Promise<AgentInstanceRecord | undefined> {
  const path = join(userDataDir, 'runtime', 'instance.json');
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, 'utf8'));
    if (process.platform !== 'win32' && ((await stat(path)).mode & 0o077) !== 0)
      throw new Error('Agent instance record is not user-private');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  if (!isAgentInstance(value))
    throw new Error('Agent instance record is invalid');
  return value;
}

export async function requestAgentHealth(
  record: AgentInstanceRecord,
  timeoutMs?: number,
): Promise<AgentHealth> {
  const result = await requestAgent(record, 'health', undefined, timeoutMs);
  if (
    !result ||
    typeof result !== 'object' ||
    typeof (result as Partial<AgentHealth>).applicationVersion !== 'string'
  )
    throw new Error('Agent health response is invalid');
  return result as AgentHealth;
}

export async function requestAgentEnvironmentSwitch(
  record: AgentInstanceRecord,
  environmentId: string,
): Promise<void> {
  await requestAgent(record, 'environment.switch', environmentId);
}

async function requestAgent(
  record: AgentInstanceRecord,
  operation: string,
  environmentId?: string,
  timeoutMs = 2_000,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(record.controlEndpoint);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Agent control request timed out'));
    }, timeoutMs);
    let payload = '';
    let settled = false;
    const finish = (task: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      task();
    };
    socket.setEncoding('utf8');
    socket.once('connect', () =>
      socket.write(
        `${JSON.stringify({ protocolVersion: record.protocolVersion, instanceNonce: record.nonce, operation, ...(environmentId ? { environmentId } : {}) })}\n`,
      ),
    );
    socket.on('data', (chunk: string) => {
      payload += chunk;
      if (Buffer.byteLength(payload) > 64 * 1024) {
        socket.destroy();
        finish(() => reject(new Error('Agent control response is too large')));
        return;
      }
      const newline = payload.indexOf('\n');
      if (newline < 0) return;
      finish(() => {
        try {
          const response = JSON.parse(payload.slice(0, newline)) as {
            readonly ok?: boolean;
            readonly result?: unknown;
            readonly error?: {
              readonly message?: string;
              readonly code?: string;
            };
          };
          if (!response.ok)
            throw new Error(
              response.error?.message ??
                response.error?.code ??
                'Agent rejected control request',
            );
          resolve(response.result);
        } catch (error) {
          reject(error);
        }
      });
      socket.end();
    });
    socket.once('error', (error) => finish(() => reject(error)));
  });
}

function isAgentInstance(value: unknown): value is AgentInstanceRecord {
  const item = value as Partial<AgentInstanceRecord> | undefined;
  return Boolean(
    item &&
      item.protocolVersion === 1 &&
      Number.isSafeInteger(item.pid) &&
      (item.pid ?? 0) > 0 &&
      typeof item.nonce === 'string' &&
      item.nonce.length >= 16 &&
      typeof item.controlEndpoint === 'string' &&
      typeof item.executablePath === 'string' &&
      typeof item.entryPoint === 'string' &&
      typeof item.startedAt === 'string',
  );
}
