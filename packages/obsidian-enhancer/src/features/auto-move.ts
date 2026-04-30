import { Notice, type Plugin, parseFrontMatterTags } from 'obsidian';
import {
  normalizeFolderSegment,
  normalizeTag,
  toTagSegments,
} from '../utils/tags';

interface FolderMatchEntry {
  path: string;
  tagSegments: string[];
}

const toCandidateFolders = (
  plugin: Plugin,
  excludedRoots: Set<string>,
): FolderMatchEntry[] => {
  return plugin.app.vault
    .getAllFolders()
    .filter((folder) => {
      const [first = ''] = folder.path.split('/');
      return !excludedRoots.has(first.toLowerCase());
    })
    .map((folder) => ({
      path: folder.path,
      tagSegments: folder.path
        .split('/')
        .map(normalizeFolderSegment)
        .filter(Boolean),
    }))
    .sort((a, b) => b.tagSegments.length - a.tagSegments.length);
};

const isPrefixMatch = (
  tagSegments: string[],
  folderSegments: string[],
): boolean => {
  if (folderSegments.length > tagSegments.length) {
    return false;
  }

  for (let index = 0; index < folderSegments.length; index += 1) {
    if (folderSegments[index] !== tagSegments[index]) {
      return false;
    }
  }

  return true;
};

const findMatchedFolder = (
  tagSegments: string[],
  folders: FolderMatchEntry[],
): FolderMatchEntry | undefined =>
  folders.find((entry) => isPrefixMatch(tagSegments, entry.tagSegments));

export const registerAutoMove = (
  plugin: Plugin,
  getExcludedRoots: () => Set<string>,
): void => {
  plugin.addRibbonIcon('arrow-left-right', 'Auto Move', async () => {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('No active note.');
      return;
    }

    const fileCache = plugin.app.metadataCache.getFileCache(activeFile);
    const tags = parseFrontMatterTags(fileCache?.frontmatter) ?? [];
    const normalizedTags = tags.map((tag) => normalizeTag(tag));

    if (normalizedTags.length === 0) {
      new Notice('No tags found in frontmatter.');
      return;
    }

    const excludedRoots = getExcludedRoots();
    const filteredFolders = toCandidateFolders(plugin, excludedRoots);
    const allFolders =
      excludedRoots.size > 0
        ? toCandidateFolders(plugin, new Set<string>())
        : filteredFolders;

    for (const tag of normalizedTags) {
      const tagSegments = toTagSegments(tag);
      const targetFolder =
        findMatchedFolder(tagSegments, filteredFolders) ??
        findMatchedFolder(tagSegments, allFolders);

      if (!targetFolder) {
        continue;
      }

      const targetPath = `${targetFolder.path}/${activeFile.name}`;
      if (targetPath === activeFile.path) {
        new Notice('File is already in the expected folder.');
        return;
      }

      try {
        await plugin.app.fileManager.renameFile(activeFile, targetPath);
        new Notice(`Moved to ${targetFolder.path}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`Failed to move file: ${message}`);
      }
      return;
    }

    new Notice('No folder matches frontmatter tags.');
  });
};
