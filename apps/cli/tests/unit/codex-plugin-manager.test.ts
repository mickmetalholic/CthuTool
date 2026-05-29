import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildPluginRows,
  discoverCodexPlugins,
  installCodexPlugins,
  readMarketplace,
  syncCodexPluginCache,
} from '../../src/domain/codex-plugin-manager';

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
  return pluginRoot;
}

describe('codex plugin manager', () => {
  test('discovers plugin packages from a plugins directory', async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), 'cthutool-plugins-'));
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');
    await mkdir(join(pluginsRoot, 'not-a-plugin'), { recursive: true });

    const plugins = await discoverCodexPlugins(pluginsRoot);

    expect(plugins.map((p) => p.name)).toEqual(['english-coach']);
    expect(plugins[0]?.displayName).toBe('English Coach');
  });

  test('reports stale install paths and updates selected plugins', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(
      homeRoot,
      'Documents',
      'GitHub',
      'mickmetalholic',
      'CthuTool',
      'packages',
      'codex-plugins',
      'plugins',
    );
    await mkdir(pluginsRoot, { recursive: true });
    await writeCodexPlugin(pluginsRoot, 'english-coach', 'English Coach');
    const marketplacePath = join(
      homeRoot,
      '.agents',
      'plugins',
      'marketplace.json',
    );
    await mkdir(join(homeRoot, '.agents', 'plugins'), { recursive: true });
    await writeFile(
      marketplacePath,
      JSON.stringify({
        name: 'personal',
        interface: { displayName: 'Personal' },
        plugins: [
          {
            name: 'english-coach',
            source: { source: 'local', path: './plugins/english-coach' },
            policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
            category: 'Productivity',
          },
        ],
      }),
      'utf8',
    );

    const plugins = await discoverCodexPlugins(pluginsRoot);
    const before = await readMarketplace(marketplacePath);
    expect(buildPluginRows(plugins, before)[0]?.status).toBe(
      'installed_elsewhere',
    );

    const results = await installCodexPlugins({
      homeRoot,
      marketplacePath,
      plugins,
      selectedNames: ['english-coach'],
    });

    expect(results).toEqual([{ name: 'english-coach', action: 'updated' }]);
    const written = JSON.parse(await readFile(marketplacePath, 'utf8'));
    expect(written.plugins[0].source.path).toBe(
      './Documents/GitHub/mickmetalholic/CthuTool/packages/codex-plugins/plugins/english-coach',
    );
  });

  test('bumps patch version and refreshes Codex plugin cache', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(homeRoot, 'repo', 'plugins');
    await mkdir(pluginsRoot, { recursive: true });
    const pluginRoot = await writeCodexPlugin(
      pluginsRoot,
      'english-coach',
      'English Coach',
    );
    const staleCache = join(
      homeRoot,
      '.codex',
      'plugins',
      'cache',
      'personal',
      'english-coach',
      '0.0.9',
    );
    await mkdir(staleCache, { recursive: true });
    await writeFile(join(staleCache, 'stale.txt'), 'old', 'utf8');

    const result = await syncCodexPluginCache({
      cacheRoot: join(homeRoot, '.codex', 'plugins', 'cache', 'personal'),
      plugin: {
        name: 'english-coach',
        displayName: 'English Coach',
        root: pluginRoot,
        marketplacePath: './repo/plugins/english-coach',
      },
      bumpPatch: true,
    });

    expect(result).toEqual({
      name: 'english-coach',
      version: '0.1.1',
      action: 'synced',
    });
    const manifest = JSON.parse(
      await readFile(join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
    );
    const packageJson = JSON.parse(
      await readFile(join(pluginRoot, 'package.json'), 'utf8'),
    );
    expect(manifest.version).toBe('0.1.1');
    expect(packageJson.version).toBe('0.1.1');
    await expect(stat(staleCache)).rejects.toThrow();
    expect(
      await readFile(
        join(
          homeRoot,
          '.codex',
          'plugins',
          'cache',
          'personal',
          'english-coach',
          '0.1.1',
          'hooks',
          'hooks.json',
        ),
        'utf8',
      ),
    ).toContain('hooks');
  });
});
