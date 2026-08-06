import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  test('returns a versioned secret-free status schema for an isolated host', async () => {
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
        tray: { state: 'stopped' },
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

  test('fails closed with a stable versioned error when no release key is pinned', async () => {
    const root = await isolatedRoot();
    const result = await runCli(
      ['agent', 'install', '--json', '--no-interactive'],
      root,
    );
    expect(result.code).not.toBe(0);
    expect(JSON.parse(result.out)).toEqual({
      schemaVersion: 1,
      ok: false,
      command: 'agent install',
      error: {
        code: 'agent_release_untrusted',
        message:
          'Agent release verification is unavailable because the CLI has no pinned public key',
      },
    });
  });

  test('lists and shows environments without secret-configured state', async () => {
    const root = await isolatedRoot();
    await writeInstalledFixture(root);
    const listed = await runCli(['agent', 'env', 'list', '--json'], root);
    expect(listed.code).toBe(0);
    const listedPayload = JSON.parse(listed.out);
    expect(listedPayload).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'agent env list',
    });
    expect(listedPayload.result).toEqual([
      expect.objectContaining({
        active: true,
        id: 'production',
        label: 'Production',
      }),
    ]);
    expect(JSON.stringify(listedPayload)).not.toMatch(
      /secretConfigured|set-secret|agent-secret/i,
    );

    const human = await runCli(['agent', 'env', 'get'], root);
    expect(human.code).toBe(0);
    expect(human.out).toContain('production');
    expect(human.out).toContain('https://app.example.com');
    expect(human.out).not.toMatch(/secret/i);

    const help = await runCli(['agent', 'env', '--help'], root);
    expect(help.code).toBe(0);
    expect(help.out).not.toContain('set-secret');
  });
});

async function isolatedRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-agent-command-'));
  roots.push(root);
  return root;
}

async function runCli(args: readonly string[], root: string) {
  const processHandle = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: {
      ...process.env,
      CTHUTOOL_AGENT_DATA_DIR: join(root, 'data'),
      CTHUTOOL_AGENT_INSTALL_DIR: join(root, 'install'),
      CTHUTOOL_PINNED_AGENT_RELEASE_PUBLIC_KEY_PEM: '',
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
    join(installRoot, 'active.json'),
    canonicalJson({
      schemaVersion: 1,
      version,
      activatedAt: new Date(0).toISOString(),
    }),
  );
}
