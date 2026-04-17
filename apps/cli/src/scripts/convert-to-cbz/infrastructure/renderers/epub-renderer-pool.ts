import pLimit from 'p-limit';

export type EpubRendererPool = {
  renderChapter: (htmlPath: string, order: number) => Promise<string>;
  dispose: () => Promise<void>;
};

export const createEpubRendererPool = (maxPages = 1): EpubRendererPool => {
  const limit = pLimit(Math.max(1, maxPages));
  return {
    renderChapter: (htmlPath, order) =>
      limit(async () => `rendered:${order}:${htmlPath}`),
    async dispose() {
      return;
    },
  };
};
