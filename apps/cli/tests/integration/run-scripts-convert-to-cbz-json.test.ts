import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('scripts convert-to-cbz JSON mode', () => {
  test('runs without prompting and prints a JSON summary when input is provided', async () => {
    const inputRoot = await mkdtemp(join(tmpdir(), 'cthutool-empty-input-'));
    await mkdir(inputRoot, { recursive: true });

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
        'scripts',
        'convert-to-cbz',
        '--input',
        inputRoot,
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
    const parsed = JSON.parse(out);

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(parsed.ok).toBe(true);
    expect(parsed.command).toBe('scripts');
    expect(parsed.script).toBe('convert-to-cbz');
    expect(parsed.summary.totalFiles).toBe(0);
    expect(parsed.summary.outputRoot).toBe(join(inputRoot, '.output'));
  });

  test('fails without prompting when input is missing non-interactively', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', 'convert-to-cbz', '--json'],
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

    expect(code).not.toBe(0);
    expect(JSON.parse(out)).toEqual({
      ok: false,
      error: {
        code: 'missing_required_argument',
        message:
          'input is required in non-interactive mode (use: --input <dir>)',
      },
    });
    expect(err).toBe('');
  });
});
