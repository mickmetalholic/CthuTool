import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { ObsidianAgentsDataPaths } from '../infra/obsidian-agents-paths';

const DEFAULT_WAIT_MS = 5_000;
const RETRY_MS = 100;
const STALE_AFTER_MS = 10 * 60_000;

export class ObsidianAgentsLockError extends Error {
  readonly code = 'busy' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ObsidianAgentsLockError';
  }
}

export async function withObsidianAgentsLock<T>(
  paths: ObsidianAgentsDataPaths,
  profileId: string,
  action: () => Promise<T>,
  options: { readonly waitMs?: number } = {},
): Promise<T> {
  const lockPath = join(paths.locksRoot, `${profileId}.lock`);
  const token = randomUUID();
  const deadline = Date.now() + (options.waitMs ?? DEFAULT_WAIT_MS);
  let acquired = false;

  await mkdir(paths.locksRoot, { recursive: true });
  while (!acquired) {
    try {
      const handle = await open(lockPath, 'wx');
      await handle.writeFile(
        JSON.stringify({
          token,
          profileId,
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
        }),
        'utf8',
      );
      await handle.close();
      acquired = true;
    } catch (error) {
      if (!isAlreadyExistsError(error)) throw error;
      if (await removeStaleLock(lockPath)) continue;
      if (Date.now() >= deadline) {
        throw new ObsidianAgentsLockError(
          `Obsidian agents profile "${profileId}" is busy; another synchronization is still running.`,
        );
      }
      await delay(RETRY_MS);
    }
  }

  try {
    return await action();
  } finally {
    await releaseLock(lockPath, token);
  }
}

async function removeStaleLock(lockPath: string): Promise<boolean> {
  try {
    const metadata = await stat(lockPath);
    if (Date.now() - metadata.mtimeMs < STALE_AFTER_MS) return false;
    await unlink(lockPath);
    return true;
  } catch (error) {
    return isMissingFileError(error);
  }
}

async function releaseLock(lockPath: string, token: string): Promise<void> {
  try {
    const value = JSON.parse(await readFile(lockPath, 'utf8')) as {
      token?: unknown;
    };
    if (value.token === token) await unlink(lockPath);
  } catch (error) {
    if (!isMissingFileError(error)) return;
  }
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'EEXIST'
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
