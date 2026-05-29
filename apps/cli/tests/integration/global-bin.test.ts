import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = join(cliRoot, '../..');

async function run(
  command: string,
  args: string[],
  cwd: string,
  silent = true,
) {
  const proc = Bun.spawn([command, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  expect(code).toBe(0);
  if (silent) {
    expect({ err, out }).toMatchObject({ err: '', out: '' });
  }
}

async function writeCodexPlugin(root: string, name: string) {
  const pluginRoot = join(root, name);
  await mkdir(join(pluginRoot, '.codex-plugin'), { recursive: true });
  await writeFile(
    join(pluginRoot, '.codex-plugin', 'plugin.json'),
    JSON.stringify({
      name,
      version: '0.1.0',
      interface: { displayName: name },
    }),
    'utf8',
  );
}

describe('global bin', () => {
  beforeAll(async () => {
    await run('bun', ['run', 'build'], cliRoot, false);
  });

  test('root package exposes node-backed chc', async () => {
    const rootPackage = JSON.parse(
      await readFile(join(repoRoot, 'package.json'), 'utf8'),
    );
    const cliPackage = JSON.parse(
      await readFile(join(cliRoot, 'package.json'), 'utf8'),
    );

    expect(rootPackage.bin).toEqual({
      chc: 'apps/cli/bin/chc.mjs',
    });
    expect(cliPackage.bin).toBeUndefined();
    expect(rootPackage.files).toContain('apps/cli/dist/index.js');
    expect(cliPackage.files).toBeUndefined();
    expect(rootPackage.scripts.prepare).toBe('husky');
    expect(rootPackage.scripts.prepack).toBe(
      'pnpm --filter @cthutool/cli build',
    );
    expect(rootPackage.scripts.start).toBeUndefined();
    expect(cliPackage.scripts.prepare).toBeUndefined();
    expect(cliPackage.scripts.prepack).toBeUndefined();
    expect(cliPackage.scripts.build).toBe(
      'bun build src/index.ts --outdir dist --target node',
    );
    expect(cliPackage.scripts.dev).toBe(
      'bun build src/index.ts --outdir dist --target node --watch',
    );
    expect(cliPackage.scripts.start).toBeUndefined();
    expect(
      await readFile(join(cliRoot, 'bin', 'chc.mjs'), 'utf8'),
    ).not.toContain('bun');
  });

  test('bin shim forwards arguments to the CLI', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-bin-home-'));
    const pluginsRoot = join(
      homeRoot,
      'repo',
      'packages',
      'codex-plugins',
      'plugins',
    );
    const marketplacePath = join(
      homeRoot,
      '.agents',
      'plugins',
      'marketplace.json',
    );
    await mkdir(pluginsRoot, { recursive: true });
    await writeCodexPlugin(pluginsRoot, 'english-coach');

    const proc = Bun.spawn(
      [
        'node',
        'bin/chc.mjs',
        'codex',
        'plugins',
        '--plugins-root',
        pluginsRoot,
        '--marketplace',
        marketplacePath,
        '--home',
        homeRoot,
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

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(JSON.parse(out)).toMatchObject({
      ok: true,
      command: 'codex plugins',
      plugins: [{ name: 'english-coach' }],
    });
  });
});
