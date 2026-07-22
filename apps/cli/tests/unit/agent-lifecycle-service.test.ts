import { afterEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalJson, createBundleLayout } from '@cthutool/agent-release';
import { FileSystemAgentLifecycleService } from '../../src/infra/agent-lifecycle-service';
import type { AgentPaths } from '../../src/infra/agent-paths';
import { resolveTrayInstancePath } from '../../src/infra/agent-tray-control';

describe('filesystem Agent lifecycle service', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  test('selects verified environments and stores only protected environment-scoped secrets', async () => {
    const { paths, service } = await createService();
    expect(await service.listEnvironments()).toEqual([
      expect.objectContaining({
        active: true,
        id: 'production',
        secretConfigured: false,
      }),
      expect.objectContaining({
        active: false,
        id: 'staging',
        secretConfigured: false,
      }),
    ]);
    await expect(service.setEnvironment('staging')).resolves.toEqual({
      changed: true,
      id: 'staging',
    });
    const secret = 'environment-specific-secret-value-1234';
    await expect(
      service.setEnvironmentSecret('staging', secret),
    ).resolves.toEqual({ configured: true, id: 'staging' });
    const secretPath = join(
      paths.userDataDir,
      'environments',
      'staging',
      'agent-secret',
    );
    expect(await readFile(secretPath, 'utf8')).toBe(`${secret}\n`);
    expect(
      JSON.stringify(await service.getEnvironment('staging')),
    ).not.toContain(secret);
    if (process.platform !== 'win32')
      expect((await stat(secretPath)).mode & 0o077).toBe(0);
  });

  test('default uninstall preserves mutable data and unconfirmed purge deletes nothing', async () => {
    const first = await createService();
    const profile = join(
      first.paths.userDataDir,
      'environments',
      'production',
      'browser-profiles',
      'site',
    );
    const log = join(first.paths.logsDir, 'agent.log');
    await mkdir(profile, { recursive: true });
    await mkdir(first.paths.logsDir, { recursive: true });
    await writeFile(join(profile, 'state'), 'profile');
    await writeFile(log, 'redacted log');
    await first.service.setEnvironmentSecret(
      'production',
      'production-secret-value-that-is-long-enough',
    );
    await expect(first.service.uninstall()).resolves.toMatchObject({
      purged: false,
      preservedDataDir: first.paths.userDataDir,
    });
    await expect(stat(first.paths.installRoot)).rejects.toThrow();
    expect(await readFile(join(profile, 'state'), 'utf8')).toBe('profile');
    expect(await readFile(log, 'utf8')).toBe('redacted log');

    const second = await createService();
    await second.service.setEnvironmentSecret(
      'production',
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

  test('repoints autostart and rolls a running Agent back after failed update readiness', async () => {
    const { paths, service } = await createService({ autostartEnabled: true });
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
  });

  test('opens settings, switches a running environment, and coordinates tray shutdown over exact local control', async () => {
    const { paths, service } = await createService();
    const endpoint =
      process.platform === 'win32'
        ? `\\\\.\\pipe\\cthutool-cli-lifecycle-${crypto.randomUUID()}`
        : join(tmpdir(), `cta-${crypto.randomUUID().slice(0, 12)}.sock`);
    const instancePath = resolveTrayInstancePath(paths.userDataDir);
    await mkdir(paths.runtimeDir, { recursive: true });
    const operations: Array<{
      readonly operation: string;
      readonly environmentId?: string;
    }> = [];
    const server = createServer((socket) => {
      socket.setEncoding('utf8');
      socket.once('data', (chunk) => {
        const request = JSON.parse(String(chunk).trim()) as {
          readonly operation: string;
          readonly environmentId?: string;
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
      await expect(service.setEnvironment('staging')).resolves.toEqual({
        changed: true,
        id: 'staging',
      });
      await expect(service.stop()).resolves.toBe('stopped');
      expect(operations).toEqual([
        expect.objectContaining({ operation: 'open' }),
        expect.objectContaining({
          environmentId: 'staging',
          operation: 'environment.switch',
        }),
        expect.objectContaining({ operation: 'shutdown' }),
      ]);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (process.platform !== 'win32') {
        await rm(endpoint, { force: true });
      }
    }
  });

  test('doctor reports redacted legacy migration repair guidance', async () => {
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
    const migration = checks.find((check) => check.id === 'legacy-migration');

    expect(migration).toEqual({
      id: 'legacy-migration',
      status: 'fail',
      message:
        'Legacy data cannot be assigned to exactly one trusted environment; select it explicitly before retrying. Next: chc agent env list && chc agent env set <id>',
    });
    expect(JSON.stringify(checks)).not.toContain(
      'legacy-secret-must-never-appear',
    );
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
      },
      release: {
        cliVersion: '1.0.0',
        smoke: async () => ({
          applicationVersion: '1.2.3',
          bridgeEndpoint: 'http://127.0.0.1:1',
          bundledNodePath: '/fixture/node',
          environmentId: 'production',
        }),
      },
    });
    return { legacyDesktopRoot, paths, service };
  }
});

async function writeInstalledFixture(paths: AgentPaths): Promise<void> {
  const version = '1.2.3';
  const root = join(paths.installRoot, 'versions', version);
  const layout = createBundleLayout('darwin-arm64', version);
  const catalog = {
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
      {
        environmentId: 'staging',
        label: 'Staging',
        webOrigin: 'https://staging.example.com',
        webAgentUrl: 'https://staging.example.com/agent',
        backendHttpUrl: 'https://api.staging.example.com',
        backendAgentWsUrl: 'wss://api.staging.example.com/agent/ws',
        namespace: 'staging',
      },
    ],
  };
  await mkdir(join(root, 'agent'), { recursive: true });
  await writeFile(join(root, 'layout.json'), canonicalJson(layout));
  await writeFile(
    join(root, 'agent', 'environments.json'),
    canonicalJson(catalog),
  );
  await writeFile(
    join(paths.installRoot, 'active.json'),
    `${JSON.stringify({ schemaVersion: 1, version, activatedAt: new Date(0).toISOString() })}\n`,
    { mode: 0o600 },
  );
  if (process.platform !== 'win32')
    await chmod(join(paths.installRoot, 'active.json'), 0o600);
}
