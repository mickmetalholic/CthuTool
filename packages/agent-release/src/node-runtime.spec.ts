import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { afterEach, describe, expect, test } from 'vitest';
import {
  preparePinnedNodeRuntime,
  validateNodeRuntimeLock,
} from './node-runtime';

describe('pinned Node.js runtime', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('downloads by exact URL, verifies digest, and extracts only runtime and license', async () => {
    root = await mkdtemp('/tmp/ct-node-');
    const archive = zipSync({
      'node-v24.14.1-win-x64/LICENSE': Buffer.from('license'),
      'node-v24.14.1-win-x64/node.exe': Buffer.from('node-runtime'),
      'node-v24.14.1-win-x64/unneeded.txt': Buffer.from('omit'),
    });
    const lock = lockFixture(
      createHash('sha256').update(archive).digest('hex'),
    );
    const lockPath = join(root, 'node.lock.json');
    await writeFile(lockPath, JSON.stringify(lock));
    const requests: string[] = [];
    const prepared = await preparePinnedNodeRuntime({
      fetchImpl: (async (url: string | URL | Request) => {
        requests.push(String(url));
        return new Response(Buffer.from(archive));
      }) as typeof fetch,
      lockPath,
      outputDir: join(root, 'runtime'),
      target: 'windows-x64',
    });

    expect(requests).toEqual([
      'https://nodejs.org/dist/v24.14.1/node-v24.14.1-win-x64.zip',
    ]);
    expect(await readFile(prepared.executablePath, 'utf8')).toBe(
      'node-runtime',
    );
    expect(await readFile(prepared.licensePath, 'utf8')).toBe('license');
  });

  test('fails closed on an altered digest or target archive mapping', async () => {
    root = await mkdtemp('/tmp/ct-node-');
    const lock = lockFixture('0'.repeat(64));
    const lockPath = join(root, 'node.lock.json');
    await writeFile(lockPath, JSON.stringify(lock));
    await expect(
      preparePinnedNodeRuntime({
        fetchImpl: (async () => new Response('tampered')) as typeof fetch,
        lockPath,
        outputDir: join(root, 'runtime'),
        target: 'windows-x64',
      }),
    ).rejects.toThrow(/digest/);
    expect(() =>
      validateNodeRuntimeLock({
        ...lock,
        sources: {
          ...lock.sources,
          'windows-x64': lock.sources['darwin-x64'],
        },
      }),
    ).toThrow(/windows-x64/);
  });
});

function lockFixture(windowsDigest: string) {
  return {
    schemaVersion: 1,
    version: '24.14.1',
    sources: {
      'darwin-arm64': {
        archive: 'node-v24.14.1-darwin-arm64.tar.gz',
        url: 'https://nodejs.org/dist/v24.14.1/node-v24.14.1-darwin-arm64.tar.gz',
        sha256: '1'.repeat(64),
      },
      'darwin-x64': {
        archive: 'node-v24.14.1-darwin-x64.tar.gz',
        url: 'https://nodejs.org/dist/v24.14.1/node-v24.14.1-darwin-x64.tar.gz',
        sha256: '2'.repeat(64),
      },
      'windows-x64': {
        archive: 'node-v24.14.1-win-x64.zip',
        url: 'https://nodejs.org/dist/v24.14.1/node-v24.14.1-win-x64.zip',
        sha256: windowsDigest,
      },
    },
  };
}
