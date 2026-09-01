import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, createBundleLayout } from '@cthutool/agent-release';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe('Agent CLI command contract', () => {
  test('returns a versioned secret-free SetupRequired status schema', async () => {
    const root = await isolatedRoot();
    const result = await runCli(['agent', 'status', '--json'], root);
    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out)).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'agent status',
      result: {
        installed: false,
        tray: { state: 'SetupRequired' },
        setup: {
          required: true,
          configured: false,
          remediation: 'Run: chc agent settings',
        },
        backend: { status: 'offline' },
        browser: { ready: false, status: 'unavailable' },
        autostart: {
          supported:
            process.platform === 'darwin' || process.platform === 'win32',
        },
      },
    });
    expect(result.out).not.toMatch(
      /ticket|nonce|agent-secret|secretConfigured/i,
    );
  });

  test('rejects removed channel selection and unavailable latest releases', async () => {
    const root = await isolatedRoot();
    const channel = await runCli(
      ['agent', 'install', '--channel', 'stable', '--json', '--no-interactive'],
      root,
    );
    expect(channel.code).not.toBe(0);
    expect(JSON.parse(channel.out)).toEqual({
      schemaVersion: 1,
      ok: false,
      command: 'agent install',
      error: {
        code: 'invalid_option',
        message:
          'Self-use mode has one latest release; --channel is no longer supported',
      },
    });
    const install = await runCli(
      ['agent', 'install', '--json', '--no-interactive'],
      root,
      {
        CTHUTOOL_AGENT_RELEASE_MANIFEST_URL:
          'https://127.0.0.1:1/manifest.json',
      },
    );
    expect(install.code).not.toBe(0);
    expect(JSON.parse(install.out).ok).toBe(false);
    expect(JSON.parse(install.out).error.message).toMatch(
      /latest agent release is unavailable|HTTP|download failed|supports macOS arm64\/x64 and Windows x64 only/i,
    );
  });

  test('redirects deprecated catalog env commands to native settings', async () => {
    const root = await isolatedRoot();
    const result = await runCli(['agent', 'env', '--json'], root);
    expect(result.code).not.toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({
      ok: false,
      command: 'agent env',
      error: {
        code: 'agent_environment_invalid',
        message: expect.stringContaining('chc agent settings'),
      },
    });
    expect(result.out).not.toMatch(/catalog|environment id|set-secret/i);
  });

  test('help no longer advertises catalog environment selection', async () => {
    const root = await isolatedRoot();
    const result = await runCli(['agent', '--help'], root);
    expect(result.code).toBe(0);
    expect(result.out).toContain('settings');
    expect(result.out).not.toMatch(/\benv list\b|\bset-secret\b/);
  });

  test('status JSON omits secret state and ignores a legacy secret file', async () => {
    const root = await isolatedRoot();
    await writeInstalledFixture(root);
    const secret = 'integration-secret-value-that-must-stay-private';
    await mkdir(join(root, 'data', 'environments', 'self-use'), {
      recursive: true,
    });
    await writeFile(
      join(root, 'data', 'config.json'),
      JSON.stringify({
        schemaVersion: 1,
        agentId: 'agent-integration',
        deploymentOrigin: 'https://app.example.com',
        deviceName: 'integration',
        connectionEnabled: true,
        browserRuntime: { kind: 'host-chrome' },
      }),
    );
    await writeFile(
      join(root, 'data', 'environments', 'self-use', 'agent-secret'),
      `${secret}\n`,
    );
    const status = await runCli(['agent', 'status', '--json'], root);
    expect(status.code).toBe(0);
    expect(JSON.parse(status.out)).toMatchObject({
      ok: true,
      result: {
        installed: true,
        setup: {
          configured: true,
          required: false,
          deploymentOrigin: 'https://app.example.com',
        },
      },
    });
    expect(`${status.out}${status.err}`).not.toContain(secret);
    expect(`${status.out}${status.err}`).not.toMatch(
      /secretConfigured|agent-secret/i,
    );
    expect(
      await readFile(
        join(root, 'data', 'environments', 'self-use', 'agent-secret'),
        'utf8',
      ),
    ).toBe(`${secret}\n`);
  });
});

async function isolatedRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-agent-command-'));
  roots.push(root);
  return root;
}

async function runCli(
  args: readonly string[],
  root: string,
  env: Readonly<Record<string, string>> = {},
) {
  const processHandle = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: {
      ...process.env,
      ...env,
      CTHUTOOL_AGENT_DATA_DIR: join(root, 'data'),
      CTHUTOOL_AGENT_INSTALL_DIR: join(root, 'install'),
    },
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [out, err, code] = await Promise.all([
    new Response(processHandle.stdout).text(),
    new Response(processHandle.stderr).text(),
    processHandle.exited,
  ]);
  return { code, err, out };
}

async function writeInstalledFixture(root: string): Promise<void> {
  const version = '1.2.3';
  const installRoot = join(root, 'install');
  const versionRoot = join(installRoot, 'versions', version);
  const layout = createBundleLayout('darwin-arm64', version);
  await mkdir(join(versionRoot, 'agent'), { recursive: true });
  await writeFile(join(versionRoot, 'layout.json'), canonicalJson(layout));
  await writeFile(
    join(installRoot, 'active.json'),
    canonicalJson({
      schemaVersion: 1,
      version,
      activatedAt: new Date(0).toISOString(),
    }),
  );
}
