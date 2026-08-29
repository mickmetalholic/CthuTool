import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncCodexPluginCache } from '../../src/domain/codex-plugin-manager';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const pluginRoot = join(repoRoot, 'codex', 'plugins', 'cthu-codex');

describe('CthuCodex hooks after Obsidian agents simplification', () => {
  test('removes Obsidian sync hooks while preserving language coaching', async () => {
    const raw = await readFile(join(pluginRoot, 'hooks', 'hooks.json'), 'utf8');
    const hooks = JSON.parse(raw) as {
      hooks: Record<string, Array<{ hooks: Array<{ command?: string }> }>>;
    };
    const commands = Object.values(hooks.hooks)
      .flat()
      .flatMap((group) => group.hooks)
      .map((hook) => hook.command ?? '')
      .join('\n');

    expect(Object.keys(hooks.hooks)).toEqual(['UserPromptSubmit']);
    expect(commands).toContain('language-coach.mjs');
    expect(commands).not.toContain('obsidian-agents-sync.mjs');
    expect(raw).not.toContain('Stop');
    expect(
      await Bun.file(
        join(pluginRoot, 'scripts', 'obsidian-agents-sync.mjs'),
      ).exists(),
    ).toBe(false);
  });

  test('keeps the unrelated hook valid when synchronizing the plugin cache', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-plugin-cache-'));
    const manifest = JSON.parse(
      await readFile(join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
    ) as { version: string };

    await syncCodexPluginCache({
      cacheRoot: join(root, 'cache'),
      plugin: {
        name: 'cthu-codex',
        displayName: 'CthuCodex',
        root: pluginRoot,
        marketplacePath: './codex/plugins/cthu-codex',
      },
    });

    const cachedHooks = await readFile(
      join(
        root,
        'cache',
        'cthu-codex',
        manifest.version,
        'hooks',
        'hooks.json',
      ),
      'utf8',
    );
    expect(cachedHooks).not.toContain('<PLUGIN_ROOT>');
    expect(cachedHooks).toContain('language-coach.mjs');
    expect(cachedHooks).not.toContain('obsidian-agents-sync.mjs');
  });
});
