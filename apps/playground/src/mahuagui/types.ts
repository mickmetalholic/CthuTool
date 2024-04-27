export interface Config {
  id: string;
  title: string;
  folderPath: string;
  chapterWhiteList?: string[];
  chapterBlackList?: string[];
}

export interface Chapter {
  chapterId: string;
  chapterTitle: string;
}
