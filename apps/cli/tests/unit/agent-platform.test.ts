import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type AgentReleaseTarget,
  canonicalJson,
  createBundleLayout,
} from '@cthutool/agent-release';
import type { AgentPaths } from '../../src/infra/agent-paths';
import {
  getAutostartStatus,
  setAutostart,
} from '../../src/infra/agent-platform';

describe('Agent autostart platform fixtures', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  test('idempotently writes and removes a per-user macOS LaunchAgent', async () => {
    const paths = await fixture('darwin-arm64');
    const launchAgentPath = join(paths.userDataDir, 'fixtures', 'agent.plist');
    const options = { launchAgentPath, platform: 'darwin' as const };
    await expect(setAutostart(paths, true, options)).resolves.toEqual({
      enabled: true,
      supported: true,
    });
    const first = await readFile(launchAgentPath, 'utf8');
    await setAutostart(paths, true, options);
    expect(await readFile(launchAgentPath, 'utf8')).toBe(first);
    expect(first).toContain('dev.cthutool.agent');
    expect(first).toContain('--user-data-dir');
    expect(first).toContain(paths.installRoot);
    expect(await getAutostartStatus(paths, options)).toEqual({
      enabled: true,
      supported: true,
    });
    if (process.platform !== 'win32') {
      expect((await stat(launchAgentPath)).mode & 0o077).toBe(0);
    }
    await setAutostart(paths, false, options);
    expect(await getAutostartStatus(paths, options)).toEqual({
      enabled: false,
      supported: true,
    });
  });

  test('uses only the per-user Windows Run key and the active tray path', async () => {
    const paths = await fixture('windows-x64');
    const calls: Array<{
      readonly command: string;
      readonly args: readonly string[];
    }> = [];
    const options = {
      platform: 'win32' as const,
      runProcess: async (command: string, args: readonly string[]) => {
        calls.push({ command, args });
        return 0;
      },
    };
    await setAutostart(paths, true, options);
    await getAutostartStatus(paths, options);
    await setAutostart(paths, false, options);
    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.command === 'reg.exe')).toBe(true);
    expect(calls[0]?.args.join(' ')).toContain(
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    );
    expect(calls[0]?.args.join(' ')).toContain(
      join(
        paths.installRoot,
        'versions',
        '1.2.3',
        'bin',
        'cthutool-agent-tray.exe',
      ),
    );
    expect(calls[2]?.args).toEqual([
      'delete',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      '/v',
      'CthuToolAgent',
      '/f',
    ]);
  });

  test('reports unsupported platforms without mutating install or user data', async () => {
    const paths = await fixture('darwin-arm64');
    await expect(
      setAutostart(paths, true, { platform: 'linux' }),
    ).resolves.toEqual({ enabled: false, supported: false });
  });

  async function fixture(target: AgentReleaseTarget): Promise<AgentPaths> {
    const root = join(
      tmpdir(),
      `cthutool-agent-platform-${crypto.randomUUID()}`,
    );
    roots.push(root);
    const paths: AgentPaths = {
      installRoot: join(root, 'install'),
      logsDir: join(root, 'data', 'logs'),
      runtimeDir: join(root, 'data', 'runtime'),
      userDataDir: join(root, 'data'),
    };
    const versionRoot = join(paths.installRoot, 'versions', '1.2.3');
    await mkdir(join(versionRoot, 'agent'), { recursive: true });
    await writeFile(
      join(versionRoot, 'layout.json'),
      canonicalJson(createBundleLayout(target, '1.2.3')),
    );
    await writeFile(
      join(versionRoot, 'agent', 'environments.json'),
      canonicalJson({
        schemaVersion: 1,
        profiles: [
          {
            environmentId: 'production',
            label: 'Production',
            webOrigin: 'https://app.example.com',
            webAgentUrl: 'https://app.example.com/agent',
            backendHttpUrl: 'https://api.example.com',
            backendAgentWsUrl: 'wss://api.example.com/agent/ws',
            namespace: 'production',
          },
        ],
      }),
    );
    await writeFile(
      join(paths.installRoot, 'active.json'),
      canonicalJson({
        schemaVersion: 1,
        version: '1.2.3',
        activatedAt: new Date(0).toISOString(),
      }),
    );
    return paths;
  }
});
