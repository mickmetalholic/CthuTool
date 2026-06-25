import { beforeEach, describe, expect, it, vi } from 'vitest';
import { obsidianMock } from './obsidian.mock';

const execMock = vi.hoisted(() =>
  vi.fn((_command: string, callback?: (error?: Error) => void) => {
    callback?.();
    return {} as never;
  }),
);

vi.mock('node:child_process', () => ({
  exec: execMock,
}));

import { registerAutoMove } from '../src/features/auto-move';
import { registerMarkEasier } from '../src/features/mark-easier';
import { registerMarkReviewed } from '../src/features/mark-reviewed';
import { registerOpenInEudic } from '../src/features/open-in-eudic';
import { ObsidianEnhancerSettingTab } from '../src/setting-tab';

type RibbonHandler = () => Promise<void> | void;

type FakePlugin = ReturnType<typeof createPlugin>;

function createPlugin(
  options: {
    readonly activeFile?: { basename: string; name: string; path: string };
    readonly folders?: readonly { path: string }[];
    readonly frontmatter?: Record<string, unknown>;
  } = {},
) {
  const handlers = new Map<string, RibbonHandler>();
  const activeFile = options.activeFile ?? {
    basename: 'word',
    name: 'word.md',
    path: 'Inbox/word.md',
  };

  const plugin = {
    addRibbonIcon: vi.fn(
      (_icon: string, title: string, callback: RibbonHandler) => {
        handlers.set(title, callback);
      },
    ),
    app: {
      fileManager: {
        processFrontMatter: vi.fn(
          async (
            _file: unknown,
            callback: (frontmatter: Record<string, unknown>) => void,
          ) => {
            callback(options.frontmatter ?? {});
          },
        ),
        renameFile: vi.fn(async () => undefined),
      },
      metadataCache: {
        getFileCache: vi.fn(() => ({ frontmatter: options.frontmatter ?? {} })),
      },
      vault: {
        getAllFolders: vi.fn(
          () =>
            options.folders ?? [
              { path: 'Japanese Vocabulary/N5 Words' },
              { path: 'config/Japanese Vocabulary' },
              { path: 'attachments' },
            ],
        ),
      },
      workspace: {
        getActiveFile: vi.fn(() =>
          options.activeFile === null ? null : activeFile,
        ),
      },
    },
    handlers,
  };

  return plugin;
}

async function runRibbon(plugin: FakePlugin, title: string): Promise<void> {
  const handler = plugin.handlers.get(title);
  if (!handler) {
    throw new Error(`Missing ribbon handler: ${title}`);
  }
  await handler();
}

describe('obsidian enhancer adapter boundaries', () => {
  beforeEach(() => {
    obsidianMock.notices.length = 0;
    obsidianMock.settings.length = 0;
    obsidianMock.parseFrontMatterTags.mockReset();
    execMock.mockClear();
  });

  it('moves the active file to the deepest matching allowed folder', async () => {
    const plugin = createPlugin();
    obsidianMock.parseFrontMatterTags.mockReturnValue([
      '#Japanese Vocabulary/N5 Words',
    ]);

    registerAutoMove(plugin as never, () => new Set(['config']));
    await runRibbon(plugin, 'Auto Move');

    expect(plugin.app.fileManager.renameFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'word.md' }),
      'Japanese Vocabulary/N5 Words/word.md',
    );
    expect(obsidianMock.notices).toContain(
      'Moved to Japanese Vocabulary/N5 Words',
    );
  });

  it('falls back to excluded roots only when no allowed folder matches', async () => {
    const plugin = createPlugin({
      folders: [{ path: 'config/Japanese Vocabulary' }],
    });
    obsidianMock.parseFrontMatterTags.mockReturnValue([
      '#config/Japanese Vocabulary',
    ]);

    registerAutoMove(plugin as never, () => new Set(['config']));
    await runRibbon(plugin, 'Auto Move');

    expect(plugin.app.fileManager.renameFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'word.md' }),
      'config/Japanese Vocabulary/word.md',
    );
  });

  it('reports missing active file and missing tags without moving', async () => {
    const noFilePlugin = createPlugin({ activeFile: null });

    registerAutoMove(noFilePlugin as never, () => new Set());
    await runRibbon(noFilePlugin, 'Auto Move');

    expect(obsidianMock.notices).toContain('No active note.');

    obsidianMock.notices.length = 0;
    const noTagsPlugin = createPlugin();
    obsidianMock.parseFrontMatterTags.mockReturnValue([]);

    registerAutoMove(noTagsPlugin as never, () => new Set());
    await runRibbon(noTagsPlugin, 'Auto Move');

    expect(noTagsPlugin.app.fileManager.renameFile).not.toHaveBeenCalled();
    expect(obsidianMock.notices).toContain('No tags found in frontmatter.');
  });

  it('advances review status through the easing progression', async () => {
    const frontmatter = { status: [' hard '] };
    const plugin = createPlugin({ frontmatter });

    registerMarkEasier(plugin as never);
    await runRibbon(plugin, 'Easier');

    expect(frontmatter.status).toBe('Good');
    expect(obsidianMock.notices).toContain('Status -> Good');
  });

  it('reports unsupported review status without changing frontmatter', async () => {
    const frontmatter = { status: 'complete' };
    const plugin = createPlugin({ frontmatter });

    registerMarkEasier(plugin as never);
    await runRibbon(plugin, 'Easier');

    expect(frontmatter.status).toBe('complete');
    expect(obsidianMock.notices).toContain(
      'Status is not in the easing progression.',
    );
  });

  it('marks the active file as reviewed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-25T12:00:00.000Z'));
    const frontmatter: Record<string, unknown> = {};
    const plugin = createPlugin({ frontmatter });

    registerMarkReviewed(plugin as never);
    await runRibbon(plugin, 'Done Reviewing');

    expect(frontmatter['last review']).toBe('2026-06-25');
    expect(obsidianMock.notices).toContain('Reviewed.');
    vi.useRealTimers();
  });

  it('opens Eudic only for notes with the configured vocabulary tag', async () => {
    const plugin = createPlugin({
      activeFile: {
        basename: 'serendipity',
        name: 'serendipity.md',
        path: 'serendipity.md',
      },
    });
    obsidianMock.parseFrontMatterTags.mockReturnValue(['#Vocabulary/Core']);

    registerOpenInEudic(plugin as never, () => ' vocabulary / core ');
    await runRibbon(plugin, 'Open in Eudic');

    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining('eudic://dict/serendipity'),
      expect.any(Function),
    );
  });

  it('reports missing vocabulary tag without opening Eudic', async () => {
    const plugin = createPlugin();
    obsidianMock.parseFrontMatterTags.mockReturnValue(['#reading']);

    registerOpenInEudic(plugin as never, () => 'vocabulary');
    await runRibbon(plugin, 'Open in Eudic');

    expect(execMock).not.toHaveBeenCalled();
    expect(obsidianMock.notices).toContain('Missing tag: #vocabulary');
  });

  it('wires setting tab changes to plugin settings and saveSettings', async () => {
    const plugin = {
      saveSettings: vi.fn(async () => undefined),
      settings: {
        excludedRootsCsv: 'config,Notes',
        vocabularyTag: 'vocabulary',
      },
    };
    const containerEl = { empty: vi.fn() };
    const tab = new ObsidianEnhancerSettingTab({} as never, plugin as never);

    Object.defineProperty(tab, 'containerEl', {
      configurable: true,
      value: containerEl,
    });
    tab.display();

    expect(containerEl.empty).toHaveBeenCalled();
    expect(obsidianMock.settings.map((setting) => setting.name)).toEqual([
      'Vocabulary Tag',
      'Excluded Root Folders',
    ]);

    await obsidianMock.settings[0].text?.triggerChange?.('  words  ');
    await obsidianMock.settings[1].text?.triggerChange?.('archive, assets');

    expect(plugin.settings.vocabularyTag).toBe('words');
    expect(plugin.settings.excludedRootsCsv).toBe('archive, assets');
    expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
  });
});
