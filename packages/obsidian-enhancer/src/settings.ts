export interface EnhancerSettings {
  vocabularyTag: string;
  excludedRootsCsv: string;
}

export const DEFAULT_SETTINGS: EnhancerSettings = {
  vocabularyTag: 'vocabulary',
  excludedRootsCsv: 'config,Notes,attachments'
};

export const parseExcludedRoots = (csv: string): Set<string> => {
  const values = csv
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set(values);
};
