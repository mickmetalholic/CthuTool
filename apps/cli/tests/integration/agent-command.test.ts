import { afterEach, describe, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
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
    expect(result.out).not.toMatch(/ticket|nonce|agent-secret/i);
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

  test('offers only stdin and protected-file secret inputs', async () => {
    const root = await isolatedRoot();
    const result = await runCli(['agent', 'env', 'set-secret', '--help'], root);
    expect(result.code).toBe(0);
    expect(result.out).toContain('--secret-stdin');
    expect(result.out).toContain('--secret-file');
    expect(result.out).not.toMatch(/--secret\s/);
  });

  test('never exposes a stdin-provided secret in human or JSON output', async () => {
    const root = await isolatedRoot();
    await writeInstalledFixture(root);
    const secret = 'integration-secret-value-that-must-stay-private';
    const json = await runCli(
      ['agent', 'env', 'set-secret', 'production', '--secret-stdin', '--json'],
      root,
      secret,
    );
    expect(json.code).toBe(0);
    expect(JSON.parse(json.out)).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'agent env set-secret',
      result: { configured: true, id: 'production' },
    });
    expect(`${json.out}${json.err}`).not.toContain(secret);

    const humanSecret = 'second-secret-value-that-must-remain-private';
    const human = await runCli(
      ['agent', 'env', 'set-secret', 'production', '--secret-stdin'],
      root,
      humanSecret,
    );
    expect(human.code).toBe(0);
    expect(human.out).toContain('Agent secret stored for production');
    expect(`${human.out}${human.err}`).not.toContain(humanSecret);
    const secretPath = join(
      root,
      'data',
      'environments',
      'production',
      'agent-secret',
    );
    expect(await readFile(secretPath, 'utf8')).toBe(`${humanSecret}\n`);
    if (process.platform !== 'win32') {
      expect((await stat(secretPath)).mode & 0o077).toBe(0);
    }
  });
});

async function isolatedRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-agent-command-'));
  roots.push(root);
  return root;
}

async function runCli(args: readonly string[], root: string, stdin?: string) {
  const processHandle = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: {
      ...process.env,
      CTHUTOOL_AGENT_DATA_DIR: join(root, 'data'),
      CTHUTOOL_AGENT_INSTALL_DIR: join(root, 'install'),
      CTHUTOOL_PINNED_AGENT_RELEASE_PUBLIC_KEY_PEM: '',
    },
    stdin: stdin === undefined ? 'ignore' : 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (stdin !== undefined) {
    processHandle.stdin?.write(stdin);
    processHandle.stdin?.end();
  }
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
