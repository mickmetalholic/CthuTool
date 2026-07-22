import { randomUUID } from 'node:crypto';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { AgentReleaseTarget } from './contracts';
import { validateBundleInventory } from './layout';

export type ActiveVersionPointer = {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly activatedAt: string;
};

export async function stageVersion(input: {
  readonly installRoot: string;
  readonly extractedRoot: string;
  readonly version: string;
  readonly target: AgentReleaseTarget;
}): Promise<string> {
  assertVersion(input.version);
  const versionsRoot = join(input.installRoot, 'versions');
  const versionRoot = join(versionsRoot, input.version);
  const stagingRoot = join(
    versionsRoot,
    `.${input.version}.staging-${randomUUID()}`,
  );
  await mkdir(versionsRoot, { recursive: true });
  if (await pathExists(versionRoot)) {
    validateBundleInventory(input.target, await listRelativeFiles(versionRoot));
    return versionRoot;
  }
  try {
    await cp(input.extractedRoot, stagingRoot, {
      errorOnExist: true,
      force: false,
      recursive: true,
    });
    validateBundleInventory(input.target, await listRelativeFiles(stagingRoot));
    try {
      await rename(stagingRoot, versionRoot);
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== 'EEXIST' &&
        (error as NodeJS.ErrnoException).code !== 'ENOTEMPTY'
      ) {
        throw error;
      }
      await rm(stagingRoot, { force: true, recursive: true });
      validateBundleInventory(
        input.target,
        await listRelativeFiles(versionRoot),
      );
    }
    return versionRoot;
  } catch (error) {
    await rm(stagingRoot, { force: true, recursive: true });
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function activateVersion(input: {
  readonly installRoot: string;
  readonly version: string;
  readonly smokeCheck: (versionRoot: string) => Promise<void>;
  readonly now?: () => Date;
}): Promise<ActiveVersionPointer> {
  assertVersion(input.version);
  const versionRoot = join(input.installRoot, 'versions', input.version);
  const activePath = join(input.installRoot, 'active.json');
  const previous = await readActiveVersion(input.installRoot);
  await input.smokeCheck(versionRoot);
  const pointer: ActiveVersionPointer = {
    schemaVersion: 1,
    version: input.version,
    activatedAt: (input.now ?? (() => new Date()))().toISOString(),
  };
  await atomicWrite(activePath, pointer);
  if (previous && previous.version !== pointer.version) {
    await atomicWrite(join(input.installRoot, 'previous.json'), previous);
  }
  return pointer;
}

export async function rollbackActiveVersion(input: {
  readonly installRoot: string;
  readonly smokeCheck: (versionRoot: string) => Promise<void>;
}): Promise<ActiveVersionPointer> {
  const previousPath = join(input.installRoot, 'previous.json');
  const previous = parsePointer(
    JSON.parse(await readFile(previousPath, 'utf8')),
  );
  await input.smokeCheck(join(input.installRoot, 'versions', previous.version));
  await atomicWrite(join(input.installRoot, 'active.json'), previous);
  return previous;
}

export async function readActiveVersion(
  installRoot: string,
): Promise<ActiveVersionPointer | undefined> {
  try {
    return parsePointer(
      JSON.parse(await readFile(join(installRoot, 'active.json'), 'utf8')),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

function parsePointer(input: unknown): ActiveVersionPointer {
  if (
    !input ||
    typeof input !== 'object' ||
    (input as Partial<ActiveVersionPointer>).schemaVersion !== 1 ||
    typeof (input as Partial<ActiveVersionPointer>).version !== 'string' ||
    typeof (input as Partial<ActiveVersionPointer>).activatedAt !== 'string'
  ) {
    throw new Error('Active Agent version pointer is invalid');
  }
  const pointer = input as ActiveVersionPointer;
  assertVersion(pointer.version);
  return pointer;
}

async function atomicWrite(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporary, path);
}

async function listRelativeFiles(
  root: string,
  directory = root,
): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await listRelativeFiles(root, path)));
    } else if (entry.isFile()) {
      output.push(path.slice(root.length + 1).replaceAll('\\', '/'));
    }
  }
  return output;
}

function assertVersion(version: string): void {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Agent version directory name is invalid');
  }
}
