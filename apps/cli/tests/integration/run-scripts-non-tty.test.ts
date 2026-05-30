import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('scripts command non-interactive', () => {
  test('fails with usage hint when script id missing and stdin is not a TTY', async () => {
    const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'scripts'], {
      cwd: cliRoot,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });
    const err = await new Response(proc.stderr).text();
    const code = await proc.exited;
    expect(code).not.toBe(0);
    expect(err.toLowerCase()).toContain('script id');
  });

  test('prints JSON error when script id is missing in JSON mode', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', '--json'],
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
          'script id is required in non-interactive mode (use: chc scripts <id> or --script <id>)',
      },
    });
    expect(err).toBe('');
  });
});
