import { afterEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  resolveTrayInstancePath,
  stopTrayOwnedAgent,
} from '../../src/infra/agent-tray-control';

describe('Agent tray control adapter', () => {
  let root: string | undefined;
  let server: Server | undefined;

  afterEach(async () => {
    await new Promise<void>(
      (resolve) => server?.close(() => resolve()) ?? resolve(),
    );
    server = undefined;
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('routes stop through the authenticated tray-owned shutdown operation', async () => {
    root = join(tmpdir(), `cta-${crypto.randomUUID().slice(0, 8)}`);
    const runtimeDir = join(root, 'runtime');
    const endpoint = join(runtimeDir, 'tray.sock');
    const instancePath = resolveTrayInstancePath(root);
    await mkdir(runtimeDir, { mode: 0o700, recursive: true });
    const received: unknown[] = [];
    server = createServer((socket) => {
      socket.setEncoding('utf8');
      socket.once('data', (chunk) => {
        received.push(JSON.parse(String(chunk).trim()));
        socket.end(
          `${JSON.stringify({
            ok: true,
            protocolVersion: 1,
            result: { accepted: true },
          })}\n`,
          () => void rm(instancePath, { force: true }),
        );
      });
    });
    await new Promise<void>((resolve, reject) => {
      server?.once('error', reject);
      server?.listen(endpoint, resolve);
    });
    await writeFile(
      instancePath,
      JSON.stringify({
        protocolVersion: 1,
        pid: process.pid,
        nonce: 'ephemeral-instance-nonce',
        controlEndpoint: endpoint,
        executablePath: process.execPath,
        processStartedAt: 100,
      }),
      { mode: 0o600 },
    );
    await chmod(instancePath, 0o600);

    await expect(stopTrayOwnedAgent({ userDataDir: root })).resolves.toBe(
      'stopped',
    );
    expect(received).toEqual([
      {
        protocolVersion: 1,
        instanceNonce: 'ephemeral-instance-nonce',
        operation: 'shutdown',
      },
    ]);
  });

  test('is idempotent when no tray record exists', async () => {
    root = join(tmpdir(), `cta-${crypto.randomUUID().slice(0, 8)}`);

    await expect(stopTrayOwnedAgent({ userDataDir: root })).resolves.toBe(
      'already-stopped',
    );
  });
});
