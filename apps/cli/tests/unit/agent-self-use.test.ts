import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AgentPaths } from '../../src/infra/agent-paths';
import {
  nativeSetupEntryPoint,
  readSelfUseSetupSnapshot,
  resolveSelfUseConfigPath,
} from '../../src/infra/agent-self-use';

describe('agent self-use CLI helpers', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  test('reports migration notice for preserved multi-environment data', async () => {
    const paths = await createPaths();
    await mkdir(join(paths.userDataDir, 'environments', 'production'), {
      recursive: true,
    });
    await mkdir(join(paths.userDataDir, 'environments', 'staging'), {
      recursive: true,
    });
    const snapshot = readSelfUseSetupSnapshot(paths);
    expect(snapshot.setupRequired).toBe(true);
    expect(snapshot.migrationNotice).toMatch(/Multiple legacy environments/i);
    expect(snapshot.preservedEnvironmentNamespaces).toEqual([
      'production',
      'staging',
    ]);
  });

  test('resolves platform setup entry points', () => {
    expect(nativeSetupEntryPoint('darwin-arm64')).toBe(
      'bin/cthutool-agent-setup',
    );
    expect(nativeSetupEntryPoint('windows-x64')).toBe(
      'bin/cthutool-agent-setup.exe',
    );
  });

  test('ignores legacy secret material in the setup snapshot', async () => {
    const paths = await createPaths();
    const secret = 'snapshot-secret-must-stay-off-the-wire';
    await writeFile(
      resolveSelfUseConfigPath(paths),
      JSON.stringify({
        schemaVersion: 1,
        agentId: 'agent-1',
        deploymentOrigin: 'https://app.example.com',
        deviceName: 'device',
        connectionEnabled: true,
        browserRuntime: { kind: 'host-chrome' },
      }),
    );
    const legacySecretPath = join(
      paths.userDataDir,
      'environments',
      'self-use',
      'agent-secret',
    );
    await mkdir(join(legacySecretPath, '..'), {
      recursive: true,
    });
    await writeFile(legacySecretPath, `${secret}\n`);
    const snapshot = readSelfUseSetupSnapshot(paths);
    expect(snapshot.configured).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain(secret);
  });

  async function createPaths(): Promise<AgentPaths> {
    const root = join(tmpdir(), `cthutool-self-use-${crypto.randomUUID()}`);
    roots.push(root);
    const paths: AgentPaths = {
      installRoot: join(root, 'install'),
      userDataDir: join(root, 'data'),
      runtimeDir: join(root, 'data', 'runtime'),
      logsDir: join(root, 'data', 'logs'),
    };
    await mkdir(paths.userDataDir, { recursive: true });
    return paths;
  }
});
