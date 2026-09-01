import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
  options: {
    packageJson?: boolean;
    hookCommand?: string;
    mcpServers?: Record<string, unknown>;
  } = {},
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
      ...(options.mcpServers ? { mcpServers: './.mcp.json' } : {}),
    }),
    'utf8',
  );
  if (options.mcpServers) {
    await writeFile(
      join(pluginRoot, '.mcp.json'),
      JSON.stringify({ mcpServers: options.mcpServers }),
      'utf8',
    );
  }
  if (options.packageJson === true) {
    await writeFile(
      join(pluginRoot, 'package.json'),
      JSON.stringify({
        name: `@codex-plugins/${name}`,
        private: true,
        version: '0.1.0',
      }),
      'utf8',
    );
  }
  await mkdir(join(pluginRoot, 'hooks'), { recursive: true });
  await writeFile(
    join(pluginRoot, 'hooks', 'hooks.json'),
    JSON.stringify({
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command',
                command:
                  options.hookCommand ??
                  'node "<PLUGIN_ROOT>/scripts/language-coach.mjs"',
                timeout: 5,
              },
            ],
          },
        ],
      },
    }),
    'utf8',
  );
  return pluginRoot;
}

describe('codex plugin manager', () => {
  test('discovers plain plugin directories from a plugins directory', async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), 'cthutool-plugins-'));
    await writeCodexPlugin(pluginsRoot, 'cthu-codex', 'CthuCodex');
    await mkdir(join(pluginsRoot, 'not-a-plugin'), { recursive: true });

    const plugins = await discoverCodexPlugins(pluginsRoot);

    expect(plugins.map((p) => p.name)).toEqual(['cthu-codex']);
    expect(plugins[0]?.displayName).toBe('CthuCodex');
  });

  test('reports stale install paths and updates selected plugins', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(
      homeRoot,
      'Documents',
      'GitHub',
      'mickmetalholic',
      'CthuTool',
      'codex',
      'plugins',
    );
    await mkdir(pluginsRoot, { recursive: true });
    await writeCodexPlugin(pluginsRoot, 'cthu-codex', 'CthuCodex');
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
            name: 'cthu-codex',
            source: { source: 'local', path: './plugins/cthu-codex' },
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
      configPath: join(homeRoot, '.codex', 'config.toml'),
      marketplacePath,
      plugins,
      selectedNames: ['cthu-codex'],
    });

    expect(results).toEqual([{ name: 'cthu-codex', action: 'updated' }]);
    const written = JSON.parse(await readFile(marketplacePath, 'utf8'));
    expect(written.plugins[0].source.path).toBe(
      './Documents/GitHub/mickmetalholic/CthuTool/codex/plugins/cthu-codex',
    );
    expect(
      await readFile(join(homeRoot, '.codex', 'config.toml'), 'utf8'),
    ).toContain('[plugins."cthu-codex@personal"]\nenabled = true');
  });

  test('bumps manifest patch version and refreshes normalized Codex plugin cache', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(homeRoot, 'repo', 'codex', 'plugins');
    await mkdir(pluginsRoot, { recursive: true });
    const pluginRoot = await writeCodexPlugin(
      pluginsRoot,
      'cthu-codex',
      'CthuCodex',
    );
    const staleCache = join(
      homeRoot,
      '.codex',
      'plugins',
      'cache',
      'personal',
      'cthu-codex',
      '0.0.9',
    );
    await mkdir(staleCache, { recursive: true });
    await writeFile(join(staleCache, 'stale.txt'), 'old', 'utf8');

    const result = await syncCodexPluginCache({
      cacheRoot: join(homeRoot, '.codex', 'plugins', 'cache', 'personal'),
      plugin: {
        name: 'cthu-codex',
        displayName: 'CthuCodex',
        root: pluginRoot,
        marketplacePath: './repo/codex/plugins/cthu-codex',
      },
      bumpPatch: true,
    });

    expect(result).toEqual({
      name: 'cthu-codex',
      version: '0.1.1',
      action: 'synced',
    });
    const manifest = JSON.parse(
      await readFile(join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
    );
    expect(manifest.version).toBe('0.1.1');
    await expect(stat(staleCache)).rejects.toThrow();
    const syncedHooks = await readFile(
      join(
        homeRoot,
        '.codex',
        'plugins',
        'cache',
        'personal',
        'cthu-codex',
        '0.1.1',
        'hooks',
        'hooks.json',
      ),
      'utf8',
    );
    expect(syncedHooks).toContain('node');
    expect(syncedHooks).toContain('scripts/language-coach.mjs');
    expect(syncedHooks).toContain(pluginRoot.replaceAll('\\', '/'));
    expect(syncedHooks).not.toContain('<PLUGIN_ROOT>');
    expect(syncedHooks).not.toContain('pwsh.exe');
    expect(syncedHooks).not.toContain('packages/codex-plugins');
  });

  test('preserves bundled MCP server metadata during install and cache sync', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(homeRoot, 'repo', 'codex', 'plugins');
    await mkdir(pluginsRoot, { recursive: true });
    const pluginRoot = await writeCodexPlugin(
      pluginsRoot,
      'cthu-codex',
      'CthuCodex',
      {
        mcpServers: {
          anki: {
            command: 'node',
            args: ['./scripts/anki-mcp-server.mjs'],
          },
          'language-feedback': {
            command: 'node',
            args: ['./scripts/language-feedback-mcp-server.mjs'],
          },
        },
      },
    );
    await mkdir(join(pluginRoot, 'scripts'), { recursive: true });
    await writeFile(
      join(pluginRoot, 'scripts', 'language-feedback-mcp-server.mjs'),
      'export const resourceUri = "ui://cthu-language-feedback/v1.html";\n',
      'utf8',
    );
    await mkdir(join(pluginRoot, 'ui', 'language-feedback'), {
      recursive: true,
    });
    await writeFile(
      join(pluginRoot, 'ui', 'language-feedback', 'v1.html'),
      '<!doctype html><title>English polish</title>',
      'utf8',
    );
    const marketplacePath = join(
      homeRoot,
      '.agents',
      'plugins',
      'marketplace.json',
    );

    await installCodexPlugins({
      homeRoot,
      configPath: join(homeRoot, '.codex', 'config.toml'),
      marketplacePath,
      plugins: [
        {
          name: 'cthu-codex',
          displayName: 'CthuCodex',
          root: pluginRoot,
          marketplacePath: './repo/codex/plugins/cthu-codex',
        },
      ],
      selectedNames: ['cthu-codex'],
    });

    const marketplace = JSON.parse(await readFile(marketplacePath, 'utf8'));
    expect(marketplace.plugins[0].source.path).toBe(
      './repo/codex/plugins/cthu-codex',
    );
    const sourceManifest = JSON.parse(
      await readFile(join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
    );
    expect(sourceManifest.mcpServers).toBe('./.mcp.json');
    const sourceMcpConfig = JSON.parse(
      await readFile(join(pluginRoot, '.mcp.json'), 'utf8'),
    );
    expect(sourceMcpConfig.mcpServers.anki.command).toBe('node');
    expect(sourceMcpConfig.mcpServers['language-feedback'].args).toEqual([
      './scripts/language-feedback-mcp-server.mjs',
    ]);

    await syncCodexPluginCache({
      cacheRoot: join(homeRoot, '.codex', 'plugins', 'cache', 'personal'),
      plugin: {
        name: 'cthu-codex',
        displayName: 'CthuCodex',
        root: pluginRoot,
        marketplacePath: './repo/codex/plugins/cthu-codex',
      },
    });

    const cachedManifest = JSON.parse(
      await readFile(
        join(
          homeRoot,
          '.codex',
          'plugins',
          'cache',
          'personal',
          'cthu-codex',
          '0.1.0',
          '.codex-plugin',
          'plugin.json',
        ),
        'utf8',
      ),
    );
    expect(cachedManifest.mcpServers).toBe('./.mcp.json');
    const cachedMcpConfig = JSON.parse(
      await readFile(
        join(
          homeRoot,
          '.codex',
          'plugins',
          'cache',
          'personal',
          'cthu-codex',
          '0.1.0',
          '.mcp.json',
        ),
        'utf8',
      ),
    );
    const cachedPluginRoot = join(
      homeRoot,
      '.codex',
      'plugins',
      'cache',
      'personal',
      'cthu-codex',
      '0.1.0',
    );
    expect(cachedMcpConfig.mcpServers.anki).toEqual({
      command: 'node',
      args: ['./scripts/anki-mcp-server.mjs'],
      cwd: resolve(cachedPluginRoot).replaceAll('\\', '/'),
    });
    expect(cachedMcpConfig.mcpServers['language-feedback']).toEqual({
      command: 'node',
      args: ['./scripts/language-feedback-mcp-server.mjs'],
      cwd: resolve(cachedPluginRoot).replaceAll('\\', '/'),
    });
    expect(
      await readFile(
        join(cachedPluginRoot, 'scripts', 'language-feedback-mcp-server.mjs'),
        'utf8',
      ),
    ).toContain('ui://cthu-language-feedback/v1.html');
    expect(
      await readFile(
        join(cachedPluginRoot, 'ui', 'language-feedback', 'v1.html'),
        'utf8',
      ),
    ).toContain('English polish');
  });
});
