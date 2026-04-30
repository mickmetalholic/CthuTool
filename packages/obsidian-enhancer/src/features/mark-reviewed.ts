import dayjs from 'dayjs';
import { Notice, type Plugin } from 'obsidian';

export const registerMarkReviewed = (plugin: Plugin): void => {
  plugin.addRibbonIcon('circle-check-big', 'Done Reviewing', async () => {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('No active note.');
      return;
    }

    await plugin.app.fileManager.processFrontMatter(
      activeFile,
      (frontmatter) => {
        frontmatter['last review'] = dayjs().format('YYYY-MM-DD');
      },
    );

    new Notice('Reviewed.');
  });
};
