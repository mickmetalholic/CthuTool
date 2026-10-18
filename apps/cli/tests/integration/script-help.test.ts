import { describe, expect, test } from 'bun:test';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

const entrypoint = fileURLToPath(
  new URL('../../src/index.ts', import.meta.url),
);

async function runHelp(args: string[]) {
  const cwd = await mkdtemp(join(tmpdir(), 'chc-script-help-'));
  try {
    const proc = Bun.spawn([process.execPath, 'run', entrypoint, ...args], {
      cwd,
      env: { ...process.env, PATH: '', FORCE_COLOR: '0' },
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [out, err, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(await readdir(cwd)).toEqual([]);
    return {
      out: stripVTControlCharacters(out),
      err: stripVTControlCharacters(err),
      code,
    };
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

describe('selected script help', () => {
  test('documents conversion without input, Poppler, prompts, or output writes', async () => {
    const result = await runHelp([
      'scripts',
      'run',
      'convert-to-cbz',
      '--help',
    ]);
    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    for (const flag of [
      '--input',
      '--output',
      '--overwrite',
      '--format',
      '--quality',
      '--dpi',
      '--concurrency',
      '--epubConcurrency',
    ]) {
      expect(result.out).toContain(flag);
    }
    expect(result.out).toContain('default: <input>/.output');
    expect(result.out).toContain('default: jpg');
    expect(result.out).toContain('default: 90');
    expect(result.out).toContain('default: 200');
    expect(result.out).toContain('no separate EPUB limit');
    expect(result.out).toContain('pdfinfo, pdfimages, and pdftoppm');
    expect(result.out).toContain('EXAMPLES');
  });

  test('uses the same target help for compatibility selectors', async () => {
    const canonical = await runHelp([
      'scripts',
      'run',
      'convert-to-cbz',
      '--help',
    ]);
    for (const args of [
      ['scripts', 'convert-to-cbz', '--help'],
      ['scripts', '--script', 'convert-to-cbz', '--help'],
      ['scripts', '--script=convert-to-cbz', '-h'],
    ]) {
      expect(await runHelp(args)).toEqual(canonical);
    }
  });

  test('keeps generic help for scripts without optional metadata', async () => {
    const result = await runHelp(['scripts', 'run', 'hello-world', '--help']);
    expect(result.code).toBe(0);
    expect(result.out).toContain('USAGE scripts run');
    expect(result.out).not.toContain('Hello from bundled script');
    expect(result.out).not.toContain('SCRIPT OPTIONS');
  });

  test('explains an unknown help target without invoking a script', async () => {
    const result = await runHelp([
      'scripts',
      'run',
      'unknown-script',
      '--help',
    ]);
    expect(result.out).toContain('Unknown bundled script: unknown-script');
    expect(result.out).toContain('chc scripts list');
    expect(result.err).toBe('');
  });
});
