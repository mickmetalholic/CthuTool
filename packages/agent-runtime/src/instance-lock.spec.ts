import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  AgentInstanceAlreadyRunningError,
  AgentRuntimeLockSet,
  readInstanceRecord,
} from './instance-lock';

describe('AgentRuntimeLockSet', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  async function createPaths() {
    root = await mkdtemp(join(tmpdir(), 'cthutool-agent-lock-'));
    return {
      instancePath: join(root, 'runtime', 'instance.json'),
      profileLockPath: join(root, 'profiles', '.lock'),
    };
  }

  test('acquires and releases both user-scoped ownership records', async () => {
    const paths = await createPaths();
    const locks = new AgentRuntimeLockSet({
      ...paths,
      controlEndpoint: join(root ?? '', 'control.sock'),
      processIdentity: {
        executablePath: '/usr/bin/node',
        entryPoint: '/opt/cthutool/agent.js',
      },
      pid: 123,
      randomNonce: () => 'nonce-1',
    });

    await locks.acquire();

    await expect(readInstanceRecord(paths.instancePath)).resolves.toMatchObject(
      {
        pid: 123,
        nonce: 'nonce-1',
      },
    );
    await expect(
      readInstanceRecord(paths.profileLockPath),
    ).resolves.toMatchObject({
      pid: 123,
      nonce: 'nonce-1',
    });
    await locks.release();
    await expect(readFile(paths.instancePath, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('rejects a live owner with a valid control handshake', async () => {
    const paths = await createPaths();
    const first = new AgentRuntimeLockSet({
      ...paths,
      controlEndpoint: '/tmp/agent-control.sock',
      processIdentity: {
        executablePath: '/usr/bin/node',
        entryPoint: '/opt/cthutool/agent.js',
      },
      pid: 123,
      randomNonce: () => 'owner-nonce',
    });
    await first.acquire();
    const second = new AgentRuntimeLockSet({
      ...paths,
      controlEndpoint: '/tmp/other-control.sock',
      isProcessAlive: () => true,
      probeControl: async () => true,
      randomNonce: () => 'other-nonce',
    });

    await expect(second.acquire()).rejects.toBeInstanceOf(
      AgentInstanceAlreadyRunningError,
    );
    await first.release();
  });

  test('recovers a dead or PID-reused stale record', async () => {
    const paths = await createPaths();
    await mkdir(join(root ?? '', 'runtime'), { recursive: true });
    await writeFile(
      paths.instancePath,
      JSON.stringify({
        protocolVersion: 1,
        pid: 999,
        nonce: 'stale',
        controlEndpoint: '/tmp/stale.sock',
        executablePath: '/old/node',
        entryPoint: '/old/agent.js',
        startedAt: '2026-07-21T00:00:00.000Z',
      }),
    );
    const locks = new AgentRuntimeLockSet({
      ...paths,
      controlEndpoint: '/tmp/new.sock',
      isProcessAlive: () => true,
      inspectProcess: async () => ({
        executablePath: '/other/node',
        entryPoint: '/other/program.js',
      }),
      processIdentity: {
        executablePath: '/usr/bin/node',
        entryPoint: '/opt/cthutool/agent.js',
      },
      pid: 321,
      randomNonce: () => 'fresh',
    });

    await locks.acquire();

    await expect(readInstanceRecord(paths.instancePath)).resolves.toMatchObject(
      {
        pid: 321,
        nonce: 'fresh',
      },
    );
    await locks.release();
  });

  test('does not remove an ownership record replaced by another process', async () => {
    const paths = await createPaths();
    const locks = new AgentRuntimeLockSet({
      ...paths,
      controlEndpoint: '/tmp/agent.sock',
      processIdentity: {
        executablePath: '/usr/bin/node',
        entryPoint: '/opt/cthutool/agent.js',
      },
      pid: 123,
      randomNonce: () => 'ours',
    });
    await locks.acquire();
    await writeFile(
      paths.instancePath,
      JSON.stringify({ ...locks.record, nonce: 'replacement' }),
    );

    await locks.release();

    await expect(readFile(paths.instancePath, 'utf8')).resolves.toContain(
      'replacement',
    );
  });
});
