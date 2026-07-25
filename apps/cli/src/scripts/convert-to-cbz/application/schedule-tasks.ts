import { access } from 'node:fs/promises';
import pLimit from 'p-limit';
import type {
  ConversionOptions,
  ConversionWorkspace,
  FailureRecord,
  PageAsset,
  SourceComicFile,
} from '../domain/conversion-types';
import type { Converter } from '../domain/converter';
import { conversionFailure } from '../domain/errors';
import type { ProgressLogger } from '../infrastructure/logging/progress-logger';
import {
  OutputExistsError,
  writeCbzArchive,
} from '../infrastructure/packagers/cbz-archiver';
import { createTemporaryWorkspace } from '../infrastructure/workspace/temporary-workspace';

export type TaskResult = {
  readonly sourcePath: string;
  readonly ok: boolean;
  readonly status?: 'converted' | 'skipped' | 'failed';
  readonly pages?: ReadonlyArray<PageAsset>;
  readonly failure?: FailureRecord;
  readonly cleanupWarning?: string;
};

type ScheduleDependencies = {
  readonly createWorkspace?: () => Promise<ConversionWorkspace>;
  readonly pathExists?: (path: string) => Promise<boolean>;
  readonly writeCbzArchive?: typeof writeCbzArchive;
};

const defaultPathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const mapByType = (
  converters: ReadonlyArray<Converter>,
): Map<string, Converter> =>
  new Map(converters.map((converter) => [converter.sourceType, converter]));

const boundedMessage = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(0, 300);

export const scheduleTasks = async (
  files: ReadonlyArray<SourceComicFile>,
  converters: ReadonlyArray<Converter>,
  options: ConversionOptions,
  logger?: ProgressLogger,
  deps?: ScheduleDependencies,
): Promise<ReadonlyArray<TaskResult>> => {
  const convertersByType = mapByType(converters);
  const limit = pLimit(Math.max(1, options.fileConcurrency));
  const createWorkspaceImpl = deps?.createWorkspace ?? createTemporaryWorkspace;
  const pathExistsImpl = deps?.pathExists ?? defaultPathExists;
  const writeCbzArchiveImpl = deps?.writeCbzArchive ?? writeCbzArchive;

  const tasks = files.map((file) =>
    limit(async (): Promise<TaskResult> => {
      logger?.beginFile(file.sourcePath, file.relativePath);
      const finish = (failed: boolean) => {
        logger?.finishFile(file.sourcePath, failed);
        logger?.incrementTotal();
      };

      const converter = convertersByType.get(file.sourceType);
      if (!converter) {
        finish(true);
        return {
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            `No converter for ${file.sourceType}`,
          ),
          ok: false,
          sourcePath: file.sourcePath,
          status: 'failed',
        };
      }

      if (
        options.overwrite !== true &&
        (await pathExistsImpl(file.targetCbzPath))
      ) {
        finish(false);
        return {
          ok: true,
          sourcePath: file.sourcePath,
          status: 'skipped',
        };
      }

      let workspace: ConversionWorkspace | undefined;
      let stage: 'convert' | 'archive' = 'convert';
      let result: TaskResult | undefined;
      try {
        workspace = await createWorkspaceImpl();
        const converted = await converter.convert(file, {
          options,
          workspace,
          onProgress: (currentFile, value) => {
            logger?.updateFile(
              currentFile.sourcePath,
              value.current,
              value.total,
              value.message,
            );
          },
        });
        if (!converted.ok) {
          finish(true);
          result = {
            failure: converted.failure,
            ok: false,
            sourcePath: file.sourcePath,
            status: 'failed',
          };
        } else {
          stage = 'archive';
          await writeCbzArchiveImpl(file.targetCbzPath, converted.pages, {
            overwrite: options.overwrite,
          });
          finish(false);
          result = {
            ok: true,
            pages: converted.pages,
            sourcePath: file.sourcePath,
            status: 'converted',
          };
        }
      } catch (error) {
        if (error instanceof OutputExistsError && options.overwrite !== true) {
          finish(false);
          result = {
            ok: true,
            sourcePath: file.sourcePath,
            status: 'skipped',
          };
        } else {
          finish(true);
          result = {
            failure: conversionFailure(
              file.sourcePath,
              stage,
              boundedMessage(error),
            ),
            ok: false,
            sourcePath: file.sourcePath,
            status: 'failed',
          };
        }
      } finally {
        if (workspace) {
          try {
            await workspace.dispose();
          } catch (error) {
            const cleanupWarning = boundedMessage(error);
            logger?.warn(
              `Cleanup failed for ${file.relativePath}: ${cleanupWarning}`,
            );
            if (result !== undefined) {
              result = { ...result, cleanupWarning };
            }
          }
        }
      }
      return (
        result ?? {
          failure: conversionFailure(
            file.sourcePath,
            stage,
            'Conversion ended without a result',
          ),
          ok: false,
          sourcePath: file.sourcePath,
          status: 'failed',
        }
      );
    }),
  );

  return Promise.all(tasks);
};
