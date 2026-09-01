import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = join(cliRoot, '../..');
const ESC = String.fromCharCode(27);
const ansiPattern = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

function stripAnsi(value: string): string {
  return value.replace(ansiPattern, '');
}

async function run(
  command: string,
  args: string[],
  cwd: string,
  silent = true,
) {
  const proc = Bun.spawn([command, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  expect(code).toBe(0);
  if (silent) {
    expect({ err, out }).toMatchObject({ err: '', out: '' });
  }
}

describe('global bin', () => {
  beforeAll(async () => {
    await run('bun', ['run', 'build'], cliRoot, false);
  });

  test('root package exposes node-backed chc', async () => {
    const rootPackage = JSON.parse(
      await readFile(join(repoRoot, 'package.json'), 'utf8'),
    );
    const cliPackage = JSON.parse(
      await readFile(join(cliRoot, 'package.json'), 'utf8'),
    );

    expect(rootPackage.bin).toEqual({
      chc: 'apps/cli/bin/chc.mjs',
    });
    expect(cliPackage.bin).toBeUndefined();
    expect(rootPackage.files).toContain('apps/cli/dist');
    expect(cliPackage.files).toBeUndefined();
    expect(rootPackage.scripts.prepare).toBe('husky');
    expect(rootPackage.scripts.prepack).toBe(
      'pnpm --filter @cthutool/cli build',
    );
    expect(rootPackage.scripts['check:cli-dist']).toBe(
      'node scripts/check-cli-dist.mjs',
    );
    expect(rootPackage.scripts.start).toBeUndefined();
    expect(cliPackage.scripts.prepare).toBeUndefined();
    expect(cliPackage.scripts.prepack).toBeUndefined();
    expect(cliPackage.scripts.build).toBe(
      'pnpm run build:deps && node ../../scripts/build-cli-dist.mjs',
    );
    expect(cliPackage.scripts.dev).toBe(
      'bun build src/index.ts --outdir dist --target node --watch',
    );
    expect(cliPackage.scripts.start).toBeUndefined();
    expect(
      await readFile(join(cliRoot, 'bin', 'chc.mjs'), 'utf8'),
    ).not.toContain('bun');
    if (process.platform !== 'win32') {
      expect(
        (await stat(join(cliRoot, 'bin', 'chc.mjs'))).mode & 0o111,
      ).not.toBe(0);
    }
  });

  test('bin shim forwards arguments to the CLI', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-bin-home-'));
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-bin-repo-'));

    const proc = Bun.spawn(
      [
        'node',
        'bin/chc.mjs',
        'codex',
        'skills',
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
        '--json',
      ],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );

    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    const code = await proc.exited;

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(JSON.parse(out)).toMatchObject({
      ok: true,
      command: 'codex skills',
    });
  });

  test('bin shim prints version and installation status', async () => {
    const rootPackage = JSON.parse(
      await readFile(join(repoRoot, 'package.json'), 'utf8'),
    );
    for (const args of [['version'], ['--version']] as const) {
      const proc = Bun.spawn(['node', 'bin/chc.mjs', ...args], {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      });
      const out = await new Response(proc.stdout).text();
      const err = await new Response(proc.stderr).text();
      const code = await proc.exited;

      expect(code).toBe(0);
      expect(err).toBe('');
      expect(out).toBe(`chc ${rootPackage.version}\n`);
    }

    const versionJson = Bun.spawn(
      ['node', 'bin/chc.mjs', 'version', '--json'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const versionJsonOut = await new Response(versionJson.stdout).text();
    const versionJsonErr = await new Response(versionJson.stderr).text();
    const versionJsonCode = await versionJson.exited;

    expect(versionJsonCode).toBe(0);
    expect(versionJsonErr).toBe('');
    expect(JSON.parse(versionJsonOut)).toEqual({
      ok: true,
      command: 'version',
      version: rootPackage.version,
    });

    const installDir = await mkdtemp(join(tmpdir(), 'cthutool-status-'));
    const status = Bun.spawn(
      ['node', 'bin/chc.mjs', 'status', '--install-dir', installDir, '--json'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const statusOut = await new Response(status.stdout).text();
    const statusErr = await new Response(status.stderr).text();
    const statusCode = await status.exited;

    expect(statusCode).toBe(0);
    expect(statusErr).toBe('');
    const parsedStatus = JSON.parse(statusOut);
    expect(parsedStatus).toMatchObject({
      ok: true,
      command: 'status',
      status: {
        version: rootPackage.version,
        mode: 'local',
        installDir,
        bundlePresent: false,
      },
    });
    expect(parsedStatus.status).not.toHaveProperty('commitTime');
    expect(parsedStatus.status).not.toHaveProperty('commitMessage');

    const detectedStatus = Bun.spawn(
      ['node', 'bin/chc.mjs', 'status', '--json'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const detectedStatusOut = await new Response(detectedStatus.stdout).text();
    const detectedStatusErr = await new Response(detectedStatus.stderr).text();
    const detectedStatusCode = await detectedStatus.exited;

    expect(detectedStatusCode).toBe(0);
    expect(detectedStatusErr).toBe('');
    const parsedDetectedStatus = JSON.parse(detectedStatusOut);
    expect(parsedDetectedStatus).toMatchObject({
      ok: true,
      command: 'status',
      status: {
        mode: 'local',
        installDir: repoRoot,
        commitTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
        ),
        commitMessage: expect.any(String),
        bundlePresent: true,
      },
    });

    const humanStatus = Bun.spawn(['node', 'bin/chc.mjs', 'status'], {
      cwd: cliRoot,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });
    const humanStatusOut = await new Response(humanStatus.stdout).text();
    const humanStatusErr = await new Response(humanStatus.stderr).text();
    const humanStatusCode = await humanStatus.exited;

    expect(humanStatusCode).toBe(0);
    expect(humanStatusErr).toBe('');
    expect(humanStatusOut).toContain('◆ CthuTool');
    expect(humanStatusOut).toContain('├─ Source');
    expect(humanStatusOut).toContain('Message');
    expect(humanStatusOut).toContain('└─ Installation');
    expect(humanStatusOut).not.toContain(ESC);

    const managedHome = await mkdtemp(join(tmpdir(), 'cthutool-status-home-'));
    const managedInstallDir = join(
      managedHome,
      '.cthutool',
      'source',
      'CthuTool',
    );
    const remoteStatus = Bun.spawn(
      [
        'node',
        'bin/chc.mjs',
        'status',
        '--install-dir',
        managedInstallDir,
        '--json',
      ],
      {
        cwd: cliRoot,
        env: { ...process.env, HOME: managedHome, USERPROFILE: managedHome },
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const remoteStatusOut = await new Response(remoteStatus.stdout).text();
    const remoteStatusErr = await new Response(remoteStatus.stderr).text();
    const remoteStatusCode = await remoteStatus.exited;
    const parsedRemoteStatus = JSON.parse(remoteStatusOut);

    expect(remoteStatusCode).toBe(0);
    expect(remoteStatusErr).toBe('');
    expect(parsedRemoteStatus).toMatchObject({
      ok: true,
      command: 'status',
      status: {
        mode: 'remote',
        installDir: managedInstallDir,
      },
    });
    expect(parsedRemoteStatus.status).not.toHaveProperty('commitTime');
    expect(parsedRemoteStatus.status).not.toHaveProperty('commitMessage');
  });

  test('bin shim discovers bundled scripts from the source scripts directory', async () => {
    const proc = Bun.spawn(['node', 'bin/chc.mjs', 'scripts', '--json'], {
      cwd: cliRoot,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });

    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    const code = await proc.exited;

    expect(code).not.toBe(0);
    expect(err).toBe('');
    expect(JSON.parse(out)).toEqual({
      ok: false,
      error: {
        code: 'missing_required_argument',
        message:
          'script id is required in non-interactive mode (use: chc scripts run <id>, chc scripts <id>, or --script <id>)',
      },
    });
  });

  test('omitted command groups print native help without an error', async () => {
    for (const [args, explicitHelpArgs] of [
      [[], ['--help']],
      [['agent'], ['agent', '--help']],
      [['codex'], ['codex', '--help']],
      [['opencode'], ['opencode', '--help']],
      [['scripts'], ['scripts', '--help']],
      [['completion'], ['completion', '--help']],
    ] as const) {
      const proc = Bun.spawn(['node', 'bin/chc.mjs', ...args], {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      });

      const out = await new Response(proc.stdout).text();
      const err = await new Response(proc.stderr).text();
      const code = await proc.exited;
      const explicit = Bun.spawn(['node', 'bin/chc.mjs', ...explicitHelpArgs], {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      });
      const explicitOut = await new Response(explicit.stdout).text();
      const explicitErr = await new Response(explicit.stderr).text();
      const explicitCode = await explicit.exited;

      expect(code).toBe(0);
      expect(explicitCode).toBe(0);
      expect(err).toBe('');
      expect(explicitErr).toBe('');
      expect(out).toBe(explicitOut);
      expect(out).toContain('USAGE');
      const plain = stripAnsi(out);
      if (args.length === 0) {
        expect(out).toContain('COMMANDS');
        expect(plain).toContain(
          '\n  codex       Manage Codex skills and repository plugins.',
        );
        expect(plain).toContain(
          '\n  scripts     Discover, list, and run bundled scripts under apps/cli/src/scripts/<id>/.',
        );
        expect(plain).not.toContain('\n  self-update');
        expect(plain).toContain(
          '\n  update      Update the global chc command from the CthuTool Git repository.',
        );
        expect(plain).not.toContain('version');
        expect(plain).not.toContain('__complete');
        expect(plain).toContain(
          '\n  status      Show chc CLI installation status.',
        );
        expect(plain).not.toContain('\n    codex');
      } else if (args[0] === 'opencode') {
        expect(plain).toContain(
          '\n  skills  Expose repository plugin skills to OpenCode.',
        );
        expect(plain).toContain(
          '\n  mcp     Sync repository plugin MCP servers to OpenCode.',
        );
      } else if (args[0] === 'agent') {
        expect(out).toContain('COMMANDS');
        expect(plain).toContain('install');
        expect(plain).toContain('settings');
        expect(plain).toContain('autostart');
        expect(plain).toContain('uninstall');
      } else if (args[0] === 'codex') {
        expect(out).toContain('COMMANDS');
        expect(plain).toContain(
          '\n  skills   Reconcile manifest-tracked and eligible local GitHub skills.',
        );
        expect(plain).toContain(
          '\n  install  Install repository-owned Codex plugins locally.',
        );
        expect(plain).not.toContain('\n  status');
        expect(plain).not.toContain('\n  export');
        expect(plain).not.toContain('\n  apply');
      } else if (args[0] === 'scripts') {
        expect(plain).toContain('COMMANDS');
        expect(plain).toContain(
          'Discover, list, and run bundled scripts under apps/cli/src/scripts/<id>/.',
        );
        expect(plain).toContain('list');
        expect(plain).toContain('run');
        expect(plain).toContain('AVAILABLE SCRIPTS');
        expect(plain).toContain('convert-to-cbz');
      } else {
        expect(plain).toContain('COMMANDS');
        expect(plain).toContain('powershell');
        expect(plain).toContain('zsh');
        expect(plain).toContain('enable');
        expect(plain).toContain('disable');
        expect(plain).toContain('status');
      }
    }
  });
});
