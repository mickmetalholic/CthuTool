import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[]) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, out, err };
}

function lines(value: string): string[] {
  return value.trim().length === 0 ? [] : value.trim().split(/\r?\n/).sort();
}

describe('shell completion command', () => {
  test('prints PowerShell and zsh adapter scripts', async () => {
    const powershell = await runCli(['completion', 'powershell']);
    const zsh = await runCli(['completion', 'zsh']);

    expect(powershell.code).toBe(0);
    expect(powershell.err).toBe('');
    expect(powershell.out).toContain('Register-ArgumentCompleter');
    expect(powershell.out).toContain('chc __complete');
    expect(powershell.out).toContain('$completionText');
    expect(powershell.out).toContain('__cthutool_empty_completion_word__');

    expect(zsh.code).toBe(0);
    expect(zsh.err).toBe('');
    expect(zsh.out).toContain('#compdef chc');
    expect(zsh.out).toContain('compdef _chc_completion chc');
    expect(zsh.out).toContain('chc __complete');
  });

  test('rejects unsupported shell names clearly', async () => {
    const result = await runCli(['completion', 'fish']);

    expect(result.code).not.toBe(0);
    expect(result.out).toBe('');
    expect(result.err).toContain('unsupported shell: fish');
  });

  test('completes commands, flags, and bundled script ids', async () => {
    await expect(runCli(['__complete', ''])).resolves.toMatchObject({
      code: 0,
      err: '',
      out: expect.any(String),
    });

    expect(lines((await runCli(['__complete', ''])).out)).toEqual([
      'browser',
      'codex',
      'completion',
      'scripts',
    ]);
    expect(lines((await runCli(['__complete', 'co'])).out)).toEqual([
      'codex',
      'completion',
    ]);
    expect(lines((await runCli(['__complete', 'browser', ''])).out)).toEqual([
      'doctor',
      'install',
      'status',
    ]);
    expect(
      lines(
        (
          await runCli([
            '__complete',
            'browser',
            '__cthutool_empty_completion_word__',
          ])
        ).out,
      ),
    ).toEqual(['doctor', 'install', 'status']);
    expect(lines((await runCli(['__complete', 'browser'])).out)).toEqual([
      'browser',
    ]);
    expect(
      lines((await runCli(['__complete', 'browser', 'install', '--'])).out),
    ).toContain('--with-deps');
    expect(
      lines((await runCli(['__complete', 'browser', 'doctor', '--'])).out),
    ).toContain('--json');
    expect(
      lines((await runCli(['__complete', 'browser', 'status', '--'])).out),
    ).toContain('--backend-url');
    expect(lines((await runCli(['__complete', 'codex', ''])).out)).toEqual([
      'apply',
      'export',
      'install',
      'status',
    ]);
    expect(lines((await runCli(['__complete', 'completion', ''])).out)).toEqual(
      ['powershell', 'zsh'],
    );
    expect(
      lines((await runCli(['__complete', 'codex', 'status', '--'])).out),
    ).toContain('--json');
    expect(
      lines((await runCli(['__complete', 'codex', 'status', '--'])).out),
    ).toContain('--repo-root');
    expect(
      lines(
        (await runCli(['__complete', 'codex', 'status', '--json', '--'])).out,
      ),
    ).not.toContain('--json');
    expect(lines((await runCli(['__complete', 'scripts', ''])).out)).toContain(
      'convert-to-cbz',
    );
    expect(
      lines((await runCli(['__complete', 'scripts', '--script', ''])).out),
    ).toContain('convert-to-cbz');
  });
});
