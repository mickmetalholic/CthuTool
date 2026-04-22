import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ConversionOptions,
  SourceComicFile,
} from '../../domain/conversion-types';
import { mapSourceToOutput } from '../../domain/path-mapping';
import { detectSourceType } from '../../domain/strategy';

const scanRecursively = async (
  root: string,
): Promise<ReadonlyArray<string>> => {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const next = join(root, entry.name);
      if (entry.isDirectory()) {
        return scanRecursively(next);
      }
      return [next];
    }),
  );
  return nested.flat();
};

export const scanTargetFiles = async (
  options: ConversionOptions,
): Promise<ReadonlyArray<SourceComicFile>> => {
  const outputRoot = options.output ?? join(options.input, '.output');
  const allFiles = await scanRecursively(options.input);
  return allFiles
    .map((sourcePath) => ({
      sourcePath,
      sourceType: detectSourceType(sourcePath),
    }))
    .filter(
      (
        row,
      ): row is {
        readonly sourcePath: string;
        readonly sourceType: 'pdf' | 'epub';
      } => row.sourceType !== undefined,
    )
    .map((row) => {
      const mapped = mapSourceToOutput(
        options.input,
        outputRoot,
        row.sourcePath,
      );
      return {
        sourcePath: row.sourcePath,
        sourceType: row.sourceType,
        relativePath: mapped.relativePath,
        targetCbzPath: mapped.targetCbzPath,
      };
    });
};
