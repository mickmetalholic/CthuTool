import { dirname, join, parse, relative } from 'node:path';

export const normalizeExt = (filePath: string): string =>
  parse(filePath).ext.toLowerCase();

export const toArchiveName = (index: number, ext: string): string =>
  `${String(index).padStart(4, '0')}.${ext}`;

export const mapSourceToOutput = (
  inputRoot: string,
  outputRoot: string,
  sourcePath: string,
): { readonly relativePath: string; readonly targetCbzPath: string } => {
  const rel = relative(inputRoot, sourcePath);
  const p = parse(rel);
  const targetCbzPath = join(outputRoot, dirname(rel), `${p.name}.cbz`);
  return { relativePath: rel, targetCbzPath };
};
