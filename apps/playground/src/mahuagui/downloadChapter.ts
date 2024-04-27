import { extname, resolve } from 'path';
import fs from 'fs-extra';
import { getBrowser } from '../utils';
import { getUrl } from './utils';
import { Chapter, Config } from './types';

async function _getTotalPageNumber({ id }: Config, { chapterId }: Chapter) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  const chapterUrl = getUrl(id, chapterId);

  await page.goto(chapterUrl);

  const totalPage = await page.$eval('body > div.main-bar > span', ele => {
    const matchRes = ele.textContent?.match(/^1\/(\d+)P$/);
    if (matchRes) {
      return Number(matchRes[1]);
    } else {
      return null;
    }
  });

  await page.close();

  if (!totalPage) {
    throw new Error('Failed to get the total page number.');
  }

  return totalPage;
}

async function _downloadPage(config: Config, chapter: Chapter, pageNum: number, retryTimes = 0) {
  const { id, title, folderPath } = config;
  const { chapterId, chapterTitle } = chapter;

  const chapterPath = resolve(folderPath, title, chapterTitle);
  fs.ensureDir(chapterPath);
  const filePath = resolve(chapterPath, `${pageNum}.webp`);
  if (fs.existsSync(filePath)) {
    console.log(`File ${filePath} alreadly exists, skipping...`);
    return;
  }

  const browser = await getBrowser();
  const page = await browser.newPage();
  const p = page.goto(getUrl(id, chapterId, pageNum));

  try {
    const response = await page.waitForResponse(res => {
      const matchRes = res.url().split('?');
      const url = matchRes?.[0];
      const query = matchRes?.[1];
      return Boolean(query) && '.webp' === extname(url);
    });
    const buffer = await response.buffer();
    await fs.writeFile(filePath, buffer.toString('base64'), 'base64');
    p.then(() => page.close());
  } catch (e) {
    await page.close();

    if (retryTimes < 10) {
      console.warn(`Failed to download image ${pageNum}, retry: ${retryTimes + 1}`);
      await _downloadPage(config, chapter, pageNum, retryTimes + 1);
    } else {
      throw new Error(`Failed to download image ${pageNum}: ${e}`);
    }
  }
}

export async function downloadChapter(config: Config, chapter: Chapter) {
  const totalPageNumber = await _getTotalPageNumber(config, chapter);
  console.log(`Total: ${totalPageNumber} pages...`);

  const all = new Set();
  const running = new Set();
  for (let i = 1; i <= totalPageNumber; i++) {
    if (running.size >= 2) {
      await Promise.race([...running]);
    }
    const p = _downloadPage(config, chapter, i);
    p.then(() => running.delete(p));
    running.add(p);
    all.add(p);
  }

  await Promise.all([...all]);
}
