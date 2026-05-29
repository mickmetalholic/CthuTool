import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function writeCodexPlugin(
  root: string,
  name: string,
  displayName: string,
) {
  const pluginRoot = join(root, name);
  await mkdir(join(pluginRoot, '.codex-plugin'), { recursive: true });
  await writeFile(
    join(pluginRoot, '.codex-plugin', 'plugin.json'),
    JSON.stringify({
      name,
      version: '0.1.0',
      description: `${displayName} plugin`,
      author: { name: 'Test' },
      interface: {
        displayName,
        shortDescription: 'Test plugin',
        longDescription: 'Test plugin',
        developerName: 'Test',
        category: 'Productivity',
        capabilities: ['Hooks'],
        defaultPrompt: ['Test prompt'],
      },
    }),
    'utf8',
  );
  await writeFile(
    join(pluginRoot, 'package.json'),
    JSON.stringify({
      name: `@codex-plugins/${name}`,
      private: true,
      version: '0.1.0',
    }),
    'utf8',
  );
  await mkdir(join(pluginRoot, 'hooks'), { recursive: true });
  await writeFile(
    join(pluginRoot, 'hooks', 'hooks.json'),
    JSON.stringify({ hooks: {} }),
    'utf8',
  );
}

describe('codex plugins command', () => {
  test('prints plugin status as JSON with no selection', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-home-'));
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
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
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
    const parsed = JSON.parse(out);

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(parsed.ok).toBe(true);
    expect(parsed.command).toBe('codex plugins');
    expect(parsed.results).toEqual([]);
    expect(parsed.plugins[0]).toMatchObject({
      name: 'english-coach',
      displayName: 'English Coach',
      status: 'not_installed',
      targetPath: './repo/packages/codex-plugins/plugins/english-coach',
    });
  });

  test('installs an explicitly selected plugin non-interactively', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-home-'));
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
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
        'codex',
        'plugins',
        '--plugins-root',
        pluginsRoot,
        '--marketplace',
        marketplacePath,
        '--home',
        homeRoot,
        '--plugin',
        'english-coach',
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
    expect(out).toContain('English Coach');
    expect(out).toContain('english-coach: installed');
    expect(err).toBe('');

    const marketplace = JSON.parse(await readFile(marketplacePath, 'utf8'));
    expect(marketplace.plugins[0].name).toBe('english-coach');
    expect(marketplace.plugins[0].source.path).toBe(
      './repo/packages/codex-plugins/plugins/english-coach',
    );
  });

  test('installs an explicitly selected plugin as JSON', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-home-'));
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
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
        'codex',
        'plugins',
        '--plugins-root',
        pluginsRoot,
        '--marketplace',
        marketplacePath,
        '--home',
        homeRoot,
        '--plugin',
        'english-coach',
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
      results: [{ name: 'english-coach', action: 'installed' }],
    });
  });

  test('bumps patch version and refreshes cache for selected plugins', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-home-'));
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
    const cacheRoot = join(homeRoot, '.codex', 'plugins', 'cache', 'personal');
    await mkdir(pluginsRoot, { recursive: true });
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
        'codex',
        'plugins',
        '--plugins-root',
        pluginsRoot,
        '--marketplace',
        marketplacePath,
        '--home',
        homeRoot,
        '--cache-root',
        cacheRoot,
        '--plugin',
        'english-coach',
        '--bump-patch',
        '--sync-cache',
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
    expect(out).toContain('english-coach: synced cache 0.1.1');
    expect(err).toBe('');

    const manifest = JSON.parse(
      await readFile(
        join(pluginsRoot, 'english-coach', '.codex-plugin', 'plugin.json'),
        'utf8',
      ),
    );
    const packageJson = JSON.parse(
      await readFile(
        join(pluginsRoot, 'english-coach', 'package.json'),
        'utf8',
      ),
    );
    expect(manifest.version).toBe('0.1.1');
    expect(packageJson.version).toBe('0.1.1');
    expect(
      await readFile(
        join(cacheRoot, 'english-coach', '0.1.1', 'hooks', 'hooks.json'),
        'utf8',
      ),
    ).toContain('hooks');
  });

  test('includes cache sync result in JSON', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-home-'));
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
    const cacheRoot = join(homeRoot, '.codex', 'plugins', 'cache', 'personal');
    await mkdir(pluginsRoot, { recursive: true });
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
        'codex',
        'plugins',
        '--plugins-root',
        pluginsRoot,
        '--marketplace',
        marketplacePath,
        '--home',
        homeRoot,
        '--cache-root',
        cacheRoot,
        '--plugin',
        'english-coach',
        '--bump-patch',
        '--sync-cache',
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
    expect(parsed.results).toContainEqual({
      name: 'english-coach',
      action: 'synced',
      version: '0.1.1',
    });
  });

  test('prints JSON error for unknown plugin selection', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-home-'));
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
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');

    const proc = Bun.spawn(
      [
        'bun',
        'run',
        'src/index.ts',
        'codex',
        'plugins',
        '--plugins-root',
        pluginsRoot,
        '--marketplace',
        marketplacePath,
        '--home',
        homeRoot,
        '--plugin',
        'missing-plugin',
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

    expect(code).not.toBe(0);
    expect(JSON.parse(out)).toEqual({
      ok: false,
      error: {
        code: 'unknown_selection',
        message: 'unknown Codex plugin: missing-plugin',
      },
    });
    expect(err).toBe('');
  });

  test('top-level codex-plugins is not registered', async () => {
    const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'codex-plugins'], {
      cwd: cliRoot,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });

    const code = await proc.exited;

    expect(code).not.toBe(0);
  });
});
