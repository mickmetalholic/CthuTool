import { afterEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalJson, createBundleLayout } from '@cthutool/agent-release';
import { FileSystemAgentLifecycleService } from '../../src/infra/agent-lifecycle-service';
import type { AgentPaths } from '../../src/infra/agent-paths';
import { resolveSelfUseConfigPath } from '../../src/infra/agent-self-use';
import { resolveTrayInstancePath } from '../../src/infra/agent-tray-control';

describe('filesystem Agent lifecycle service', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  test('reports SetupRequired until Origin is configured', async () => {
    const { paths, service } = await createService();
    const status = await service.status();
    expect(status.setup).toMatchObject({
      configured: false,
      required: true,
      remediation: 'Run: chc agent settings',
    });
    expect(status.tray.state).toBe('SetupRequired');
    expect(JSON.stringify(status)).not.toMatch(/ticket|bearer|agent-secret/i);

    await writeSelfUseConfig(paths, 'https://app.example.com');
    const configured = await service.status();
    expect(configured.setup).toMatchObject({
      configured: true,
      required: false,
      deploymentOrigin: 'https://app.example.com',
    });
    expect(configured.endpoints).toEqual({
      webOrigin: 'https://app.example.com',
      webAgentUrl: 'https://app.example.com/agent',
      backendHttpUrl: 'https://app.example.com',
      backendAgentWsUrl: 'wss://app.example.com/ws/agents',
    });
    expect(configured.environment).toMatchObject({
      id: 'self-use',
      webOrigin: 'https://app.example.com',
    });
    expect(JSON.stringify(configured)).not.toMatch(
      /secretConfigured|agent-secret/i,
    );
  });

  test('default uninstall preserves Origin, legacy files, profiles, and logs', async () => {
    const first = await createService();
    await writeSelfUseConfig(first.paths, 'https://app.example.com');
    await writeLegacyAgentSecret(
      first.paths,
      'production-secret-value-that-is-long-enough',
    );
    const profile = join(
      first.paths.userDataDir,
      'environments',
      'self-use',
      'browser-profiles',
      'site',
    );
    const log = join(first.paths.logsDir, 'agent.log');
    await mkdir(profile, { recursive: true });
    await mkdir(first.paths.logsDir, { recursive: true });
    await mkdir(first.paths.userDataDir, { recursive: true });
    await writeFile(join(profile, 'state'), 'profile');
    await writeFile(log, 'redacted log');
    await expect(first.service.uninstall()).resolves.toMatchObject({
      purged: false,
      preservedDataDir: first.paths.userDataDir,
    });
    await expect(stat(first.paths.installRoot)).rejects.toThrow();
    expect(
      await readFile(resolveSelfUseConfigPath(first.paths), 'utf8'),
    ).toContain('https://app.example.com');
    expect(await readFile(legacyAgentSecretPath(first.paths), 'utf8')).toBe(
      'production-secret-value-that-is-long-enough\n',
    );
    expect(await readFile(join(profile, 'state'), 'utf8')).toBe('profile');
    expect(await readFile(log, 'utf8')).toBe('redacted log');

    const second = await createService();
    await writeSelfUseConfig(second.paths, 'https://app.example.com');
    await writeLegacyAgentSecret(
      second.paths,
      'another-production-secret-value-long-enough',
    );
    await expect(
      second.service.uninstall({ purge: true, confirmed: false }),
    ).rejects.toThrow(/explicit confirmation/i);
    expect((await stat(second.paths.installRoot)).isDirectory()).toBe(true);
    expect((await stat(second.paths.userDataDir)).isDirectory()).toBe(true);
    await expect(
      second.service.uninstall({ purge: true, confirmed: true }),
    ).resolves.toMatchObject({ purged: true });
    await expect(stat(second.paths.userDataDir)).rejects.toThrow();
  });

  test('update rollback preserves mutable self-use configuration', async () => {
    const { paths, service } = await createService({ autostartEnabled: true });
    await writeSelfUseConfig(paths, 'https://keep.example.com');
    await writeLegacyAgentSecret(
      paths,
      'keep-this-secret-across-update-rollback',
    );
    const profile = join(
      paths.userDataDir,
      'environments',
      'self-use',
      'browser-profiles',
      'site',
    );
    await mkdir(profile, { recursive: true });
    await writeFile(join(profile, 'state'), 'preserved');
    let startAttempts = 0;
    let autostartWrites = 0;
    const mutable = service as unknown as {
      install: () => Promise<{
        readonly changed: boolean;
        readonly previousVersion: string;
        readonly version: string;
      }>;
      isRunning: () => Promise<boolean>;
      start: () => Promise<'started'>;
      stop: () => Promise<'stopped'>;
    };
    mutable.isRunning = async () => true;
    mutable.stop = async () => 'stopped';
    mutable.start = async () => {
      startAttempts += 1;
      if (startAttempts === 1) throw new Error('new Agent failed readiness');
      return 'started';
    };
    mutable.install = async () => {
      await writeFile(
        join(paths.installRoot, 'previous.json'),
        `${JSON.stringify({ schemaVersion: 1, version: '1.2.3', activatedAt: new Date(0).toISOString() })}\n`,
      );
      await writeFile(
        join(paths.installRoot, 'active.json'),
        `${JSON.stringify({ schemaVersion: 1, version: '2.0.0', activatedAt: new Date(1).toISOString() })}\n`,
      );
      return { changed: true, previousVersion: '1.2.3', version: '2.0.0' };
    };
    const platform = (
      service as unknown as {
        readonly platform: {
          setAutostart: (
            paths: AgentPaths,
            enabled: boolean,
          ) => Promise<{
            readonly enabled: boolean;
            readonly supported: boolean;
          }>;
        };
      }
    ).platform;
    platform.setAutostart = async (_paths, enabled) => {
      autostartWrites += 1;
      return { enabled, supported: true };
    };

    await expect(service.update()).rejects.toThrow(/rolled back to 1\.2\.3/i);
    expect(startAttempts).toBe(2);
    expect(autostartWrites).toBe(2);
    expect(
      JSON.parse(
        await readFile(join(paths.installRoot, 'active.json'), 'utf8'),
      ),
    ).toMatchObject({ version: '1.2.3' });
    expect(await readFile(resolveSelfUseConfigPath(paths), 'utf8')).toContain(
      'https://keep.example.com',
    );
    expect(await readFile(legacyAgentSecretPath(paths), 'utf8')).toBe(
      'keep-this-secret-across-update-rollback\n',
    );
    expect(await readFile(join(profile, 'state'), 'utf8')).toBe('preserved');
  });

  test('opens native settings through settings.open after starting the tray', async () => {
    const { paths, service } = await createService();
    const platform = (
      service as unknown as {
        readonly platform: {
          startInstalledAgent: () => Promise<never>;
          startInstalledTray: () => Promise<'started'>;
        };
      }
    ).platform;
    let trayStarts = 0;
    platform.startInstalledAgent = async () => {
      throw new Error('settings must not start the Node Agent directly');
    };
    platform.startInstalledTray = async () => {
      trayStarts += 1;
      return 'started';
    };
    const endpoint =
      process.platform === 'win32'
        ? `\\\\.\\pipe\\cthutool-cli-lifecycle-${crypto.randomUUID()}`
        : join(tmpdir(), `cta-${crypto.randomUUID().slice(0, 12)}.sock`);
    const instancePath = resolveTrayInstancePath(paths.userDataDir);
    await mkdir(paths.runtimeDir, { recursive: true });
    const operations: Array<{
      readonly operation: string;
    }> = [];
    const server = createServer((socket) => {
      socket.setEncoding('utf8');
      socket.once('data', (chunk) => {
        const request = JSON.parse(String(chunk).trim()) as {
          readonly operation: string;
        };
        operations.push(request);
        socket.end(
          `${JSON.stringify({ ok: true, protocolVersion: 1, result: { accepted: true } })}\n`,
          () => {
            if (request.operation === 'shutdown') {
              void rm(instancePath, { force: true });
            }
          },
        );
      });
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(endpoint, resolve);
    });
    await writeFile(
      instancePath,
      JSON.stringify({
        protocolVersion: 1,
        pid: process.pid,
        nonce: 'lifecycle-test-instance-nonce',
        controlEndpoint: endpoint,
        executablePath: process.execPath,
        processStartedAt: 100,
      }),
      { mode: 0o600 },
    );
    try {
      await expect(service.settings()).resolves.toBe('opened');
      expect(trayStarts).toBe(1);
      await expect(service.stop()).resolves.toBe('stopped');
      expect(operations).toEqual([
        expect.objectContaining({ operation: 'settings.open' }),
        expect.objectContaining({ operation: 'shutdown' }),
      ]);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (process.platform !== 'win32') {
        await rm(endpoint, { force: true });
      }
    }
  });

  test('doctor reports SetupRequired remediation without leaking secrets', async () => {
    const { paths, service } = await createService();
    await writeLegacyAgentSecret(paths, 'doctor-secret-must-never-appear-here');
    const checks = await service.doctor();
    const configuration = checks.find((check) => check.id === 'configuration');
    expect(configuration).toMatchObject({
      id: 'configuration',
      status: 'fail',
      message: expect.stringContaining('chc agent settings'),
    });
    expect(JSON.stringify(checks)).not.toContain(
      'doctor-secret-must-never-appear-here',
    );
    expect(JSON.stringify(checks)).not.toMatch(/ticket|bearer/i);
  });

  test('doctor never advertises catalog env remediation and redacts legacy secrets', async () => {
    const { legacyDesktopRoot, service } = await createService();
    await mkdir(legacyDesktopRoot, { recursive: true });
    await writeFile(
      join(legacyDesktopRoot, 'config.json'),
      JSON.stringify({
        backendUrl: 'https://retired.example.com',
        agentSecret: 'legacy-secret-must-never-appear',
      }),
    );

    const checks = await service.doctor();
    expect(JSON.stringify(checks)).not.toMatch(/chc agent env /);
    expect(JSON.stringify(checks)).not.toContain(
      'legacy-secret-must-never-appear',
    );
    const configuration = checks.find((check) => check.id === 'configuration');
    expect(configuration?.message ?? '').toContain('chc agent settings');
  });

  async function createService(
    options: { readonly autostartEnabled?: boolean } = {},
  ) {
    const root = join(
      tmpdir(),
      `cthutool-agent-service-${crypto.randomUUID()}`,
    );
    roots.push(root);
    const paths: AgentPaths = {
      installRoot: join(root, 'install'),
      userDataDir: join(root, 'data'),
      runtimeDir: join(root, 'data', 'runtime'),
      logsDir: join(root, 'data', 'logs'),
    };
    const legacyDesktopRoot = join(root, 'legacy-desktop');
    await writeInstalledFixture(paths);
    const service = new FileSystemAgentLifecycleService({
      legacyDesktopRoot,
      paths,
      platform: {
        getAutostartStatus: async () => ({
          enabled: options.autostartEnabled === true,
          supported: true,
        }),
        setAutostart: async (_paths, enabled) => ({ enabled, supported: true }),
        startInstalledAgent: async () => 'started',
        startInstalledTray: async () => 'started',
      },
      release: {
        cliVersion: '1.0.0',
        smoke: async () => ({
          applicationVersion: '1.2.3',
          bridgeEndpoint: 'http://127.0.0.1:1',
          bundledNodePath: '/fixture/node',
          environmentId: 'self-use',
          setupRequiredVerified: true,
        }),
      },
    });
    return { legacyDesktopRoot, paths, service };
  }
});

async function writeSelfUseConfig(
  paths: AgentPaths,
  deploymentOrigin: string,
): Promise<void> {
  await mkdir(paths.userDataDir, { recursive: true });
  await writeFile(
    resolveSelfUseConfigPath(paths),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        agentId: 'agent-test',
        deploymentOrigin,
        deviceName: 'test-device',
        connectionEnabled: true,
        browserRuntime: { kind: 'host-chrome' },
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
}

function legacyAgentSecretPath(paths: AgentPaths): string {
  return join(paths.userDataDir, 'environments', 'self-use', 'agent-secret');
}

async function writeLegacyAgentSecret(
  paths: AgentPaths,
  secret: string,
): Promise<void> {
  const secretPath = legacyAgentSecretPath(paths);
  await mkdir(join(secretPath, '..'), { recursive: true });
  await writeFile(secretPath, `${secret}\n`, { mode: 0o600 });
  if (process.platform !== 'win32') await chmod(secretPath, 0o600);
}

async function writeInstalledFixture(paths: AgentPaths): Promise<void> {
  const version = '1.2.3';
  const root = join(paths.installRoot, 'versions', version);
  const layout = createBundleLayout('darwin-arm64', version);
  await mkdir(join(root, 'agent'), { recursive: true });
  await writeFile(join(root, 'layout.json'), canonicalJson(layout));
  await writeFile(
    join(paths.installRoot, 'active.json'),
    `${JSON.stringify({ schemaVersion: 1, version, activatedAt: new Date(0).toISOString() })}\n`,
    { mode: 0o600 },
  );
  if (process.platform !== 'win32')
    await chmod(join(paths.installRoot, 'active.json'), 0o600);
}
