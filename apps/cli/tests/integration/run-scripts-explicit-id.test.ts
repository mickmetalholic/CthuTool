import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('scripts command explicit id', () => {
  test('runs hello-world with --script and prints expected line', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', '--script', 'hello-world'],
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
    expect(out).toContain('Hello from bundled script: hello-world');
    expect(err).not.toContain('unknown script id');
  });

  test('runs hello-world with positional id', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', 'hello-world'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const out = await new Response(proc.stdout).text();
    const code = await proc.exited;
    expect(code).toBe(0);
    expect(out).toContain('Hello from bundled script: hello-world');
  });

  test('runs hello-world through the canonical run operation', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', 'run', 'hello-world'],
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
    expect(out).toContain('Hello from bundled script: hello-world');
  });
});
