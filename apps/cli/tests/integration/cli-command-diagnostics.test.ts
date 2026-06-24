import { describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, out, err };
}

function parseDiagnostics(stderr: string): Array<Record<string, unknown>> {
  return stderr
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('{'))
    .map((line) => JSON.parse(line));
}

describe('CLI command diagnostics coverage', () => {
  test('emits lifecycle diagnostics for a successful top-level command', async () => {
    const result = await runCli(['completion', 'zsh'], {
      CHC_CLI_DIAGNOSTICS: '1',
    });

    expect(result.code).toBe(0);
    expect(result.out).toContain('#compdef chc');
    const diagnostics = parseDiagnostics(result.err);
    expect(diagnostics.map((event) => event.event)).toEqual([
      'cli.command_started',
      'cli.command_completed',
    ]);
    expect(diagnostics[1]).toEqual(
      expect.objectContaining({
        command: 'completion',
        exitCode: 0,
      }),
    );
  });

  test('emits failure diagnostics for a deliberate command error', async () => {
    const result = await runCli(['completion', 'fish'], {
      CHC_CLI_DIAGNOSTICS: '1',
    });

    expect(result.code).not.toBe(0);
    expect(result.out).toBe('');
    expect(result.err).toContain('unsupported shell: fish');
    const diagnostics = parseDiagnostics(result.err);
    expect(diagnostics.map((event) => event.event)).toEqual([
      'cli.command_started',
      'cli.command_failed',
    ]);
    expect(diagnostics[1]).toEqual(
      expect.objectContaining({
        command: 'completion',
        errorCode: 'invalid_option',
        exitCode: 1,
      }),
    );
  });

  test('keeps JSON stdout parseable while codex command diagnostics use stderr', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));

    const result = await runCli(
      [
        'codex',
        'status',
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
        '--json',
      ],
      { CHC_CLI_DIAGNOSTICS: '1' },
    );

    expect(result.code).toBe(0);
    expect(JSON.parse(result.out).command).toBe('codex status');
    const diagnostics = parseDiagnostics(result.err);
    expect(diagnostics.map((event) => event.event)).toEqual([
      'cli.command_started',
      'cli.command_completed',
    ]);
    expect(diagnostics[1]).toEqual(
      expect.objectContaining({
        command: 'codex',
        subcommand: 'status',
        exitCode: 0,
      }),
    );
  });

  test('does not emit diagnostics for the internal completion protocol command', async () => {
    const result = await runCli(['__complete', 'co'], {
      CHC_CLI_DIAGNOSTICS: '1',
    });

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(result.out).toContain('codex');
    expect(result.out).toContain('completion');
  });

  test('emits failure diagnostics before rethrowing unexpected command failures', async () => {
    const repoRootFile = join(
      await mkdtemp(join(tmpdir(), 'cthutool-repo-file-parent-')),
      'repo-file',
    );
    await writeFile(repoRootFile, 'not a directory');

    const result = await runCli(
      ['codex', 'export', '--repo-root', repoRootFile, '--json'],
      { CHC_CLI_DIAGNOSTICS: '1' },
    );

    expect(result.code).not.toBe(0);
    const diagnostics = parseDiagnostics(result.err);
    expect(diagnostics.map((event) => event.event)).toContain(
      'cli.command_failed',
    );
    expect(diagnostics.at(-1)).toEqual(
      expect.objectContaining({
        command: 'codex',
        subcommand: 'export',
        errorCode: 'invalid_option',
        exitCode: 1,
      }),
    );
  });
});
