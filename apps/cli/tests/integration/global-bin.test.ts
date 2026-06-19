import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile } from 'node:fs/promises';
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
    expect(rootPackage.files).toContain('apps/cli/dist/index.js');
    expect(cliPackage.files).toBeUndefined();
    expect(rootPackage.scripts.prepare).toBe('husky');
    expect(rootPackage.scripts.prepack).toBe(
      'pnpm --filter @cthutool/cli build',
    );
    expect(rootPackage.scripts.start).toBeUndefined();
    expect(cliPackage.scripts.prepare).toBeUndefined();
    expect(cliPackage.scripts.prepack).toBeUndefined();
    expect(cliPackage.scripts.build).toBe(
      'bun build src/index.ts --outdir dist --target node',
    );
    expect(cliPackage.scripts.dev).toBe(
      'bun build src/index.ts --outdir dist --target node --watch',
    );
    expect(cliPackage.scripts.start).toBeUndefined();
    expect(
      await readFile(join(cliRoot, 'bin', 'chc.mjs'), 'utf8'),
    ).not.toContain('bun');
  });

  test('bin shim forwards arguments to the CLI', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-bin-home-'));
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-bin-repo-'));

    const proc = Bun.spawn(
      [
        'node',
        'bin/chc.mjs',
        'codex',
        'status',
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
      command: 'codex status',
    });
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
          'script id is required in non-interactive mode (use: chc scripts <id> or --script <id>)',
      },
    });
  });

  test('omitted command groups print native help without an error', async () => {
    for (const [args, explicitHelpArgs] of [
      [[], ['--help']],
      [['codex'], ['codex', '--help']],
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
          '\n  codex    Manage reproducible Codex configuration.',
        );
        expect(plain).toContain(
          '\n  scripts  Discover and run bundled scripts under apps/cli/src/scripts/<id>/ (script.json + index.ts).',
        );
        expect(plain).not.toContain('\n    codex');
      } else if (args[0] === 'codex') {
        expect(out).toContain('COMMANDS');
        expect(plain).toContain(
          '\n  status   Summarize local-versus-repository Codex config state.',
        );
        expect(plain).toContain(
          '\n  apply    Restore repository Codex config locally.',
        );
        expect(plain).toContain(
          '\n  install  Install repository-owned Codex skills and plugins locally.',
        );
        expect(plain).not.toContain('\n   apply');
      } else if (args[0] === 'scripts') {
        expect(plain).toContain('chc scripts [OPTIONS] [ID]');
        expect(plain).toContain(
          'Discover and run bundled scripts under apps/cli/src/scripts/<id>/ (script.json + index.ts).',
        );
        expect(plain).toContain('Examples:');
      } else {
        expect(plain).toContain('chc completion [OPTIONS] <SHELL>');
        expect(plain).toContain(
          'Shell to generate completion for (powershell or zsh), or action to manage persistent completion',
        );
      }
    }
  });
});
