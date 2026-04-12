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
});
