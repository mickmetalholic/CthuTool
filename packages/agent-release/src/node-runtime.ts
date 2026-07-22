import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gunzipSync, unzipSync } from 'fflate';
import type { AgentReleaseTarget } from './contracts';

type NodeRuntimeSource = {
  readonly archive: string;
  readonly url: string;
  readonly sha256: string;
};

type NodeRuntimeLock = {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly sources: Readonly<Record<AgentReleaseTarget, NodeRuntimeSource>>;
};

export type PreparedNodeRuntime = {
  readonly version: string;
  readonly executablePath: string;
  readonly licensePath: string;
  readonly sourceSha256: string;
};

export async function preparePinnedNodeRuntime(input: {
  readonly lockPath: string;
  readonly target: AgentReleaseTarget;
  readonly outputDir: string;
  readonly fetchImpl?: typeof fetch;
}): Promise<PreparedNodeRuntime> {
  const lock = validateNodeRuntimeLock(
    JSON.parse(await readFile(input.lockPath, 'utf8')),
  );
  const source = lock.sources[input.target];
  const response = await (input.fetchImpl ?? fetch)(source.url, {
    redirect: 'error',
  });
  if (!response.ok) {
    throw new Error(
      `Pinned Node.js download failed with HTTP ${response.status}`,
    );
  }
  const archive = new Uint8Array(await response.arrayBuffer());
  const digest = createHash('sha256').update(archive).digest('hex');
  if (digest !== source.sha256) {
    throw new Error(
      'Pinned Node.js archive digest does not match the lock file',
    );
  }
  const root = source.archive.replace(/\.(?:tar\.gz|zip)$/, '');
  const entries = source.archive.endsWith('.zip')
    ? unzipEntries(archive)
    : untarEntries(gunzipSync(archive));
  const executableName =
    input.target === 'windows-x64' ? 'node.exe' : 'bin/node';
  const executable = entries.get(`${root}/${executableName}`);
  const license = entries.get(`${root}/LICENSE`);
  if (!executable || !license) {
    throw new Error('Pinned Node.js archive is missing its runtime or LICENSE');
  }
  await mkdir(input.outputDir, { recursive: true });
  const executablePath = join(
    input.outputDir,
    input.target === 'windows-x64' ? 'node.exe' : 'node',
  );
  const licensePath = join(input.outputDir, 'LICENSE');
  await writeFile(executablePath, executable, { mode: 0o755 });
  await chmod(executablePath, 0o755);
  await writeFile(licensePath, license, { mode: 0o644 });
  return {
    version: lock.version,
    executablePath,
    licensePath,
    sourceSha256: digest,
  };
}

export function validateNodeRuntimeLock(input: unknown): NodeRuntimeLock {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Node.js runtime lock must be an object');
  }
  const value = input as Partial<NodeRuntimeLock>;
  if (
    value.schemaVersion !== 1 ||
    typeof value.version !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(value.version) ||
    !value.sources
  ) {
    throw new Error('Node.js runtime lock contract is invalid');
  }
  const targets: AgentReleaseTarget[] = [
    'darwin-arm64',
    'darwin-x64',
    'windows-x64',
  ];
  for (const target of targets) {
    const source = value.sources[target];
    const platformName =
      target === 'windows-x64'
        ? 'win-x64'
        : target.replace('darwin-', 'darwin-');
    const expectedArchive = `node-v${value.version}-${platformName}.${
      target === 'windows-x64' ? 'zip' : 'tar.gz'
    }`;
    if (
      !source ||
      source.archive !== expectedArchive ||
      source.url !==
        `https://nodejs.org/dist/v${value.version}/${source.archive}` ||
      !/^[a-f0-9]{64}$/.test(source.sha256)
    ) {
      throw new Error(`Node.js runtime lock source is invalid for ${target}`);
    }
  }
  return value as NodeRuntimeLock;
}

function unzipEntries(archive: Uint8Array): Map<string, Uint8Array> {
  return new Map(Object.entries(unzipSync(archive)));
}

function untarEntries(archive: Uint8Array): Map<string, Uint8Array> {
  const entries = new Map<string, Uint8Array>();
  for (let offset = 0; offset + 512 <= archive.byteLength; ) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      break;
    }
    const name = readTarString(header.subarray(0, 100));
    const prefix = readTarString(header.subarray(345, 500));
    const path = prefix ? `${prefix}/${name}` : name;
    const sizeText = readTarString(header.subarray(124, 136)).trim();
    const size = Number.parseInt(sizeText || '0', 8);
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error('Pinned Node.js tar archive contains an invalid size');
    }
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;
    if (contentEnd > archive.byteLength) {
      throw new Error('Pinned Node.js tar archive is truncated');
    }
    if (header[156] === 0 || header[156] === 48) {
      entries.set(path, archive.slice(contentStart, contentEnd));
    }
    offset = contentStart + Math.ceil(size / 512) * 512;
  }
  return entries;
}

function readTarString(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return Buffer.from(end >= 0 ? bytes.subarray(0, end) : bytes).toString(
    'utf8',
  );
}
