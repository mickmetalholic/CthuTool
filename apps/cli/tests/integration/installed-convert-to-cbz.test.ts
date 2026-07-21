import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = join(cliRoot, '../..');
const buildScript = join(repoRoot, 'scripts', 'build-cli-dist.mjs');

describe('installed convert-to-cbz script', () => {
  test('loads packaged JavaScript under Node without importing TypeScript source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-installed-script-'));
    const distRoot = join(root, 'dist');
    const scriptRoot = join(distRoot, 'scripts', 'convert-to-cbz');
    const inputRoot = join(root, 'input');
    await mkdir(inputRoot, { recursive: true });
    await writeFile(join(root, 'package.json'), '{"type":"module"}\n');

    const build = Bun.spawn(['node', buildScript, distRoot], {
      cwd: repoRoot,
      stderr: 'pipe',
      stdin: 'ignore',
      stdout: 'pipe',
    });
    const [buildOut, buildErr, buildCode] = await Promise.all([
      new Response(build.stdout).text(),
      new Response(build.stderr).text(),
      build.exited,
    ]);
    if (buildCode !== 0) {
      throw new Error(
        `CLI build failed with exit code ${buildCode}\n${buildOut}${buildErr}`,
      );
    }

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
