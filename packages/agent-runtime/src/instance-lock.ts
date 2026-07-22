import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import {
  access,
  link,
  mkdir,
  open,
  readFile,
  readlink,
  rm,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { AgentDataPaths } from './config';
import { AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION } from './runtime-state';

export type AgentProcessIdentity = {
  readonly executablePath: string;
  readonly entryPoint: string;
};

export type AgentInstanceRecord = AgentProcessIdentity & {
  readonly protocolVersion: number;
  readonly pid: number;
  readonly nonce: string;
  readonly controlEndpoint: string;
  readonly startedAt: string;
};

export type AgentRuntimeLockOptions = {
  readonly instancePath: string;
  readonly profileLockPath: string;
  readonly controlEndpoint: string;
  readonly processIdentity?: AgentProcessIdentity;
  readonly pid?: number;
  readonly now?: () => Date;
  readonly randomNonce?: () => string;
  readonly isProcessAlive?: (pid: number) => boolean;
  readonly inspectProcess?: (
    pid: number,
  ) => Promise<AgentProcessIdentity | undefined>;
  readonly probeControl?: (record: AgentInstanceRecord) => Promise<boolean>;
};

export class AgentInstanceAlreadyRunningError extends Error {
  constructor(readonly record: AgentInstanceRecord) {
    super(`Agent runtime is already owned by PID ${record.pid}`);
    this.name = 'AgentInstanceAlreadyRunningError';
  }
}

export class AgentRuntimeLockSet {
  readonly record: AgentInstanceRecord;
  private instanceOwned = false;
  private profileOwned = false;
  private readonly isProcessAlive: (pid: number) => boolean;
  private readonly inspectProcess: (
    pid: number,
  ) => Promise<AgentProcessIdentity | undefined>;

  constructor(private readonly options: AgentRuntimeLockOptions) {
    const processIdentity = options.processIdentity ?? {
      executablePath: resolve(process.execPath),
      entryPoint: resolve(process.argv[1] ?? process.execPath),
    };
    this.record = {
      ...processIdentity,
      protocolVersion: AGENT_RUNTIME_CONTROL_PROTOCOL_VERSION,
      pid: options.pid ?? process.pid,
      nonce: (options.randomNonce ?? randomUUID)(),
      controlEndpoint: options.controlEndpoint,
      startedAt: (options.now ?? (() => new Date()))().toISOString(),
    };
    this.isProcessAlive = options.isProcessAlive ?? defaultIsProcessAlive;
    this.inspectProcess = options.inspectProcess ?? inspectProcessIdentity;
  }

  async acquire(): Promise<void> {
    if (this.instanceOwned && this.profileOwned) {
      return;
    }
    await this.acquireFile(this.options.instancePath);
    this.instanceOwned = true;
    try {
      await this.acquireFile(this.options.profileLockPath);
      this.profileOwned = true;
    } catch (error) {
      await this.releaseFile(this.options.instancePath);
      this.instanceOwned = false;
      throw error;
    }
  }

  async release(): Promise<void> {
    if (this.profileOwned) {
      await this.releaseFile(this.options.profileLockPath);
      this.profileOwned = false;
    }
    if (this.instanceOwned) {
      await this.releaseFile(this.options.instancePath);
      this.instanceOwned = false;
    }
  }

  private async acquireFile(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { mode: 0o700, recursive: true });
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (await createExclusiveRecord(filePath, this.record)) {
        return;
      }
      const stale = await this.readAndClassifyExisting(filePath);
      if (!stale) {
        const record = await readInstanceRecord(filePath);
        throw new AgentInstanceAlreadyRunningError(record ?? this.record);
      }
      await removeIfUnchanged(filePath, stale);
    }
    throw new Error(`Unable to acquire Agent lock at ${filePath}`);
  }

  private async readAndClassifyExisting(
    filePath: string,
  ): Promise<string | undefined> {
    const raw = await readFile(filePath, 'utf8').catch(() => undefined);
    if (raw === undefined) {
      return undefined;
    }
    const existing = parseInstanceRecord(raw);
    if (!existing || !this.isProcessAlive(existing.pid)) {
      return raw;
    }
    if (await this.options.probeControl?.(existing)) {
      return undefined;
    }
    const actualIdentity = await this.inspectProcess(existing.pid);
    if (!actualIdentity) {
      return undefined;
    }
    return sameProcessIdentity(actualIdentity, existing) ? undefined : raw;
  }

  private async releaseFile(filePath: string): Promise<void> {
    const raw = await readFile(filePath, 'utf8').catch(() => undefined);
    if (!raw) {
      return;
    }
    const current = parseInstanceRecord(raw);
    if (
      current?.pid === this.record.pid &&
      current.nonce === this.record.nonce &&
      sameProcessIdentity(current, this.record)
    ) {
      await removeIfUnchanged(filePath, raw);
    }
  }
}

export function createAgentRuntimeLockSet(input: {
  readonly paths: Pick<AgentDataPaths, 'profilesDir' | 'runtimeDir'>;
  readonly controlEndpoint: string;
  readonly overrides?: Omit<
    AgentRuntimeLockOptions,
    'instancePath' | 'profileLockPath' | 'controlEndpoint'
  >;
}): AgentRuntimeLockSet {
  return new AgentRuntimeLockSet({
    ...input.overrides,
    instancePath: join(input.paths.runtimeDir, 'instance.json'),
    profileLockPath: join(input.paths.profilesDir, '.cthutool-agent.lock'),
    controlEndpoint: input.controlEndpoint,
  });
}

export async function readInstanceRecord(
  filePath: string,
): Promise<AgentInstanceRecord | undefined> {
  const raw = await readFile(filePath, 'utf8').catch(() => undefined);
  return raw ? parseInstanceRecord(raw) : undefined;
}

function parseInstanceRecord(raw: string): AgentInstanceRecord | undefined {
  try {
    const value = JSON.parse(raw) as Partial<AgentInstanceRecord>;
    if (
      typeof value.pid !== 'number' ||
      !Number.isSafeInteger(value.pid) ||
      value.pid <= 0 ||
      typeof value.protocolVersion !== 'number' ||
      typeof value.nonce !== 'string' ||
      !value.nonce ||
      typeof value.controlEndpoint !== 'string' ||
      !value.controlEndpoint ||
      typeof value.executablePath !== 'string' ||
      !value.executablePath ||
      typeof value.entryPoint !== 'string' ||
      !value.entryPoint ||
      typeof value.startedAt !== 'string'
    ) {
      return undefined;
    }
    return value as AgentInstanceRecord;
  } catch {
    return undefined;
  }
}

function sameProcessIdentity(
  left: AgentProcessIdentity,
  right: AgentProcessIdentity,
): boolean {
  return (
    resolve(left.executablePath) === resolve(right.executablePath) &&
    resolve(left.entryPoint) === resolve(right.entryPoint)
  );
}

function defaultIsProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

async function inspectProcessIdentity(
  pid: number,
): Promise<AgentProcessIdentity | undefined> {
  if (pid === process.pid) {
    return {
      executablePath: resolve(process.execPath),
      entryPoint: resolve(process.argv[1] ?? process.execPath),
    };
  }
  if (process.platform !== 'linux') {
    return undefined;
  }
  try {
    const executablePath = await readlink(`/proc/${pid}/exe`);
    const commandLine = await readFile(`/proc/${pid}/cmdline`, 'utf8');
    const [, entryPoint] = commandLine.split('\0');
    return {
      executablePath: resolve(executablePath),
      entryPoint: resolve(entryPoint || executablePath),
    };
  } catch {
    return undefined;
  }
}

async function removeIfUnchanged(
  filePath: string,
  expected: string,
): Promise<void> {
  const current = await readFile(filePath, 'utf8').catch(() => undefined);
  if (current === expected) {
    await rm(filePath, { force: true });
  }
}

export async function assertUserPrivatePath(path: string): Promise<void> {
  await access(dirname(path), constants.R_OK | constants.W_OK);
}

async function createExclusiveRecord(
  filePath: string,
  record: AgentInstanceRecord,
): Promise<boolean> {
  const temporaryPath = `${filePath}.${record.pid}.${record.nonce}.tmp`;
  const handle = await open(temporaryPath, 'wx', 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporaryPath, filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      return false;
    }
    throw error;
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
