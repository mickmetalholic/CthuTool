import { cleanUp } from '../utils';
import { Config } from './types';
import { getChapterList } from './getChapterList';
import { downloadChapter } from './downloadChapter';

export async function download(config: Config) {
  const failedChapters = [];

  console.log(`Start to download comic ${config.title}(${config.id})...\n`);

  const chapters = await getChapterList(config);
  console.log(`Total: ${chapters.length} chapters...`);

  for (const chapter of chapters) {
    console.log(`Start to download chapter ${chapter.chapterTitle}...`);
    try {
      await downloadChapter(config, chapter);
      console.log(`Download chapter ${chapter.chapterTitle} successfully!\n`);
    } catch (e) {
      console.log(`Failed to download chapter ${chapter.chapterTitle}: ${e}`);
      failedChapters.push(chapter);
    }
  }

  console.log(`Download comic ${config.id} successfully!`);
  if (failedChapters.length > 0) {
    console.log(`Some chapter(s) is/are downloaded failed:`);
    for (const chapter of failedChapters) {
      console.log(`  ${chapter.chapterTitle}(${chapter.chapterId})`);
    }
  }

  cleanUp();
}
