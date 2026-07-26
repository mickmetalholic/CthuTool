import { describe, expect, test } from 'bun:test';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('installed convert-to-cbz script', () => {
  test('loads packaged JavaScript under Node without importing TypeScript source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-installed-script-'));
    const distRoot = join(root, 'dist');
    const scriptRoot = join(distRoot, 'scripts', 'convert-to-cbz');
    const inputRoot = join(root, 'input');
    await mkdir(scriptRoot, { recursive: true });
    await mkdir(inputRoot, { recursive: true });
    await writeFile(join(root, 'package.json'), '{"type":"module"}\n');

    const cliBuild = await Bun.build({
      define: { 'process.env.NODE_ENV': '"production"' },
      entrypoints: [join(cliRoot, 'src', 'index.ts')],
      outdir: distRoot,
      target: 'node',
    });
    const scriptBuild = await Bun.build({
      define: { 'process.env.NODE_ENV': '"production"' },
      entrypoints: [
        join(cliRoot, 'src', 'scripts', 'convert-to-cbz', 'index.ts'),
      ],
      outdir: scriptRoot,
      target: 'node',
    });
    expect(cliBuild.success).toBe(true);
    expect(scriptBuild.success).toBe(true);
    await copyFile(
      join(cliRoot, 'src', 'scripts', 'convert-to-cbz', 'script.json'),
      join(scriptRoot, 'script.json'),
    );

    const packagedEntry = await readFile(join(scriptRoot, 'index.js'), 'utf8');
    expect(packagedEntry).not.toMatch(/from\s+["'][^"']+\.ts["']/);
    expect(packagedEntry).not.toMatch(/import\(["'][^"']+\.ts["']\)/);

    const proc = Bun.spawn(
      [
        'node',
        join(distRoot, 'index.js'),
        'scripts',
        'run',
        'convert-to-cbz',
        '--input',
        inputRoot,
        '--json',
      ],
      {
        cwd: root,
        stderr: 'pipe',
        stdin: 'ignore',
        stdout: 'pipe',
      },
    );
    const [out, err, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(JSON.parse(out)).toMatchObject({
      ok: true,
      script: 'convert-to-cbz',
      summary: {
        convertedCount: 0,
        failureCount: 0,
        skippedCount: 0,
        totalFiles: 0,
      },
    });
  }, 30_000);
});
