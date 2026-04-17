import type { SourceType } from './conversion-types';

export type EpubStrategy = 'extract-first';

export const detectSourceType = (filePath: string): SourceType | undefined => {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.epub')) return 'epub';
  return undefined;
};

export const selectEpubStrategy = (): EpubStrategy => 'extract-first';
