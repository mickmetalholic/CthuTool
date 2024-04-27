import { getBrowser } from '../utils';
import { getUrl } from './utils';
import { Chapter, Config } from './types';

export async function getChapterList({ id, chapterBlackList = [], chapterWhiteList = [] }: Config): Promise<Chapter[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.goto(getUrl(id));

  const rawData = await page.$$eval('#chapterList > ul > li > a', list =>
    list
      .map(item => {
        const matchRes = item.getAttribute('href')?.match(/\/(\d+)\.html/);
        if (!matchRes) {
          return null;
        }
        return {
          chapterId: matchRes[1],
          chapterTitle: item.textContent,
        };
      })
  );

  await page.close();

  return rawData
    .filter(item => (
      item &&
      !chapterBlackList.includes(item.chapterId) &&
      (chapterWhiteList.length === 0 || chapterBlackList.includes(item.chapterId))
    )) as Chapter[];
}
