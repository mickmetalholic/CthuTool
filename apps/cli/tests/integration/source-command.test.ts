import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = join(cliRoot, '../..');
const ESC = String.fromCharCode(27);
const ansiPattern = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

function stripAnsi(value: string): string {
  return value.replace(ansiPattern, '');
}

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {},
) {
  const proc = Bun.spawn([process.execPath, 'run', 'src/index.ts', ...args], {
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

describe('source command', () => {
  test('prints the registered source operations for a bare group', async () => {
    const bare = await runCli(['source']);
    const explicit = await runCli(['source', '--help']);

    expect(bare).toEqual(explicit);
    expect(bare.code).toBe(0);
    expect(bare.err).toBe('');
    for (const operation of ['list', 'status', 'use', 'update', 'register']) {
      expect(bare.out).toContain(operation);
    }
    expect(bare.out).not.toContain('current');
  });

  test('lists the active source and worktree candidates as one JSON value', async () => {
    const result = await runCli(['source', 'list', '--json']);

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out)).toMatchObject({
      ok: true,
      command: 'source list',
      active: {
        mode: 'local',
        kind: expect.stringMatching(/main|worktree/),
        active: true,
      },
      candidates: expect.arrayContaining([
        expect.objectContaining({ id: 'local', kind: 'main' }),
        expect.objectContaining({ id: 'remote', kind: 'managed' }),
      ]),
    });
  });

  test('renders a human catalog and suppresses it in quiet mode', async () => {
    const human = await runCli(['source', 'list']);
    const quiet = await runCli(['source', 'list', '--quiet']);
    const output = stripAnsi(human.out);

    expect(human.code).toBe(0);
    expect(output).toContain('CthuTool sources');
    expect(output).toMatch(/●\s+\S+.*active/);
    expect(output).toMatch(/(main|worktree) ·/);
    expect(output).toContain('~/');
    expect(quiet).toMatchObject({ code: 0, out: '', err: '' });
  });

  test('rejects the removed current operation and bootstrap option', async () => {
    const current = await runCli(['source', 'current']);
    const bootstrap = await runCli(['source', 'use', 'remote', '--bootstrap']);

    expect(current.code).not.toBe(0);
    expect(`${current.out}\n${current.err}`).toContain('current');
    expect(bootstrap.code).not.toBe(0);
    expect(`${bootstrap.out}\n${bootstrap.err}`).toContain('bootstrap');
  });

  test('keeps source inventory separate from canonical lifecycle status', async () => {
    const list = await runCli(['source', 'list', '--json']);
    const result = await runCli([
      'source',
      'status',
      '--install-dir',
      repoRoot,
      '--json',
    ]);

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    const output = JSON.parse(result.out) as {
      readonly status: {
        readonly sourceKind: string;
        readonly sourceId: string;
      };
    };
    expect(output).toMatchObject({
      ok: true,
      command: 'source status',
      status: {
        mode: 'local',
        installDir: repoRoot,
      },
    });
    expect(output).not.toHaveProperty('candidates');
    expect(JSON.parse(list.out)).toHaveProperty('candidates');
    expect(['main', 'worktree']).toContain(output.status.sourceKind);
    if (output.status.sourceKind === 'main') {
      expect(output.status.sourceId).toBe('local');
    } else {
      expect(output.status.sourceId).toMatch(/^worktree:/);
    }
  });

  test('preserves legacy status JSON and canonical human, quiet, and error behavior', async () => {
    const canonical = await runCli(['source', 'status', '--json']);
    const legacy = await runCli(['status', '--json']);
    const human = await runCli(['source', 'status']);
    const quiet = await runCli(['source', 'status', '--quiet']);
    const failure = await runCli(
      ['source', 'status', '--install-dir', repoRoot, '--json'],
      { PATH: '' },
    );

    expect(canonical.code).toBe(0);
    expect(legacy.code).toBe(0);
    expect(JSON.parse(canonical.out)).toMatchObject({
      ok: true,
      command: 'source status',
    });
    expect(JSON.parse(legacy.out)).toMatchObject({
      ok: true,
      command: 'status',
      status: JSON.parse(canonical.out).status,
    });
    expect(human.code).toBe(0);
    expect(human.out).toContain('CthuTool');
    expect(human.out).not.toContain('CthuTool sources');
    expect(quiet).toMatchObject({ code: 0, out: '', err: '' });
    expect(failure.code).not.toBe(0);
    expect(JSON.parse(failure.out)).toMatchObject({
      ok: false,
      error: { code: 'update_failed' },
    });
  });

  test('requires explicit use and register arguments without a TTY', async () => {
    const use = await runCli(['source', 'use', '--json']);
    const register = await runCli(['source', 'register', '--json']);

    expect(use.code).not.toBe(0);
    expect(JSON.parse(use.out)).toMatchObject({
      ok: false,
      error: { code: 'missing_required_argument' },
    });
    expect(register.code).not.toBe(0);
    expect(JSON.parse(register.out)).toMatchObject({
      ok: false,
      error: { code: 'missing_required_argument' },
    });
  });

  test('returns a stable JSON error for an unknown source selector', async () => {
    const result = await runCli([
      'source',
      'use',
      'worktree:does-not-exist',
      '--json',
    ]);

    expect(result.code).not.toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({
      ok: false,
      error: { code: 'source_unavailable' },
    });
  });
});
