import { Notice, type Plugin } from 'obsidian';

const statusProgression: Record<string, string> = {
  again: 'Hard',
  hard: 'Good',
  good: 'Easy',
  easy: 'Complete',
};

const normalizeStatus = (status: unknown): string => {
  if (Array.isArray(status)) {
    return typeof status[0] === 'string' ? status[0].trim().toLowerCase() : '';
  }
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
};

export const registerMarkEasier = (plugin: Plugin): void => {
  plugin.addRibbonIcon('arrow-up-wide-narrow', 'Easier', async () => {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('No active note.');
      return;
    }

    let nextStatus = '';
    await plugin.app.fileManager.processFrontMatter(
      activeFile,
      (frontmatter) => {
        const current = normalizeStatus(frontmatter.status);
        nextStatus = statusProgression[current] ?? '';
        if (nextStatus) {
          frontmatter.status = nextStatus;
        }
      },
    );

    if (!nextStatus) {
      new Notice('Status is not in the easing progression.');
      return;
    }

    new Notice(`Status -> ${nextStatus}`);
  });
};
