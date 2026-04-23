import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { Notice, parseFrontMatterTags, type Plugin } from 'obsidian';
import { normalizeTag } from '../utils/tags';

const createOpenCommand = (deeplink: string): string => {
  const escaped = deeplink.replaceAll('"', '\\"');
  return platform() === 'win32' ? `start "" "${escaped}"` : `open "${escaped}"`;
};

export const registerOpenInEudic = (
  plugin: Plugin,
  getVocabularyTag: () => string
): void => {
  plugin.addRibbonIcon('book-a', 'Open in Eudic', () => {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('No active note.');
      return;
    }

    const fileCache = plugin.app.metadataCache.getFileCache(activeFile);
    const tags = parseFrontMatterTags(fileCache?.frontmatter) ?? [];
    const vocabularyTag = normalizeTag(getVocabularyTag());
    const hasVocabularyTag = tags.some((tag) => normalizeTag(tag) === vocabularyTag);

    if (!hasVocabularyTag) {
      new Notice(`Missing tag: #${vocabularyTag}`);
      return;
    }

    exec(createOpenCommand(`eudic://dict/${activeFile.basename}`), (error) => {
      if (error) {
        new Notice(`Failed to open Eudic: ${error.message}`);
      }
    });
  });
};
