import pLimit from 'p-limit';
import type {
  ConversionOptions,
  FailureRecord,
  PageAsset,
  SourceComicFile,
} from '../domain/conversion-types';
import type { Converter } from '../domain/converter';
import { conversionFailure } from '../domain/errors';
import type { ProgressLogger } from '../infrastructure/logging/progress-logger';
import { writeCbzArchive } from '../infrastructure/packagers/cbz-archiver';

export type TaskResult = {
  readonly sourcePath: string;
  readonly ok: boolean;
  readonly pages?: ReadonlyArray<PageAsset>;
  readonly failure?: FailureRecord;
};

const mapByType = (
  converters: ReadonlyArray<Converter>,
): Map<string, Converter> => new Map(converters.map((c) => [c.sourceType, c]));

export const scheduleTasks = async (
  files: ReadonlyArray<SourceComicFile>,
  converters: ReadonlyArray<Converter>,
  options: ConversionOptions,
  logger?: ProgressLogger,
): Promise<ReadonlyArray<TaskResult>> => {
  const index = mapByType(converters);
  const limit = pLimit(Math.max(1, options.fileConcurrency));

  const tasks = files.map((file) =>
    limit(async (): Promise<TaskResult> => {
      logger?.beginFile(file.sourcePath, file.relativePath);
      const converter = index.get(file.sourceType);
      if (!converter) {
        logger?.finishFile(file.sourcePath, true);
        logger?.incrementTotal();
        return {
          sourcePath: file.sourcePath,
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            `No converter for ${file.sourceType}`,
          ),
        };
      }

      try {
        const r = await converter.convert(file, {
          options,
          onProgress: (currentFile, value) => {
            logger?.updateFile(
              currentFile.sourcePath,
              value.current,
              value.total,
              value.message,
            );
          },
        });
        if (r.ok) {
          await writeCbzArchive(file.targetCbzPath, r.pages);
          logger?.finishFile(file.sourcePath, false);
          logger?.incrementTotal();
          return { sourcePath: file.sourcePath, ok: true, pages: r.pages };
        }
        logger?.finishFile(file.sourcePath, true);
        logger?.incrementTotal();
        return { sourcePath: file.sourcePath, ok: false, failure: r.failure };
      } catch (e) {
        logger?.finishFile(file.sourcePath, true);
        logger?.incrementTotal();
        return {
          sourcePath: file.sourcePath,
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            e instanceof Error ? e.message : String(e),
          ),
        };
      }
    }),
  );

  return Promise.all(tasks);
};
