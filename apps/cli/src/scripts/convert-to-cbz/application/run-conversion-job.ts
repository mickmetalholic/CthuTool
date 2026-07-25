import { join } from 'node:path';
import type {
  ConversionOptions,
  ConversionSummary,
  FailureRecord,
  SourceComicFile,
} from '../domain/conversion-types';
import type { Converter } from '../domain/converter';
import { checkPoppler } from '../infrastructure/dependencies/check-poppler';
import {
  createProgressLogger,
  type ProgressLogger,
} from '../infrastructure/logging/progress-logger';
import { scanTargetFiles } from '../infrastructure/scanners/file-scanner';
import type { TaskResult } from './schedule-tasks';
import { scheduleTasks } from './schedule-tasks';

export const buildConversionSummary = (
  totalFiles: number,
  results: ReadonlyArray<TaskResult>,
  outputRoot: string,
  durationMs: number,
): ConversionSummary => {
  const failures: FailureRecord[] = results
    .filter((x) => !x.ok && x.failure !== undefined)
    .map((x) => x.failure as FailureRecord);
  const skippedCount = results.filter((x) => x.status === 'skipped').length;
  const convertedCount = results.filter(
    (x) => x.ok && x.status !== 'skipped',
  ).length;
  const successCount = convertedCount + skippedCount;
  return {
    totalFiles,
    successCount,
    convertedCount,
    skippedCount,
    failureCount: failures.length,
    failures,
    outputRoot,
    durationMs,
  };
};

export const runConversionJob = async (
  options: ConversionOptions,
  converters: ReadonlyArray<Converter>,
  deps?: {
    readonly checkPoppler?: typeof checkPoppler;
    readonly scanTargetFiles?: (
      options: ConversionOptions,
    ) => Promise<ReadonlyArray<SourceComicFile>>;
    readonly scheduleTasks?: typeof scheduleTasks;
    readonly createProgressLogger?: () => ProgressLogger;
  },
): Promise<ConversionSummary> => {
  const checkPopplerImpl = deps?.checkPoppler ?? checkPoppler;
  const scanTargetFilesImpl = deps?.scanTargetFiles ?? scanTargetFiles;
  const scheduleTasksImpl = deps?.scheduleTasks ?? scheduleTasks;
  const createProgressLoggerImpl =
    deps?.createProgressLogger ?? createProgressLogger;

  const startedAt = Date.now();
  const outputRoot = options.output ?? join(options.input, '.output');
  const logger = createProgressLoggerImpl();

  try {
    const files = await scanTargetFilesImpl(options);
    if (files.length === 0) {
      logger.info('No convertible files found.');
      return {
        totalFiles: 0,
        successCount: 0,
        convertedCount: 0,
        skippedCount: 0,
        failureCount: 0,
        failures: [],
        outputRoot,
        durationMs: Date.now() - startedAt,
      };
    }

    if (files.some((file) => file.sourceType === 'pdf')) {
      const dep = await checkPopplerImpl();
      if (dep.isErr()) {
        throw new Error(dep.error.message);
      }
    }

    logger.info(`Discovered ${files.length} target files.`);
    logger.start(files.length, options.fileConcurrency);
    const results = await scheduleTasksImpl(files, converters, options, logger);
    const summary = buildConversionSummary(
      files.length,
      results,
      outputRoot,
      Date.now() - startedAt,
    );
    logger.summary({
      totalFiles: summary.totalFiles,
      successCount: summary.successCount,
      convertedCount: summary.convertedCount,
      skippedCount: summary.skippedCount,
      failureCount: summary.failureCount,
      failures: summary.failures.map((f) => ({
        sourcePath: f.sourcePath,
        reason: f.reason,
      })),
      outputRoot: summary.outputRoot,
      durationMs: summary.durationMs,
    });
    return summary;
  } finally {
    await logger.flush();
    logger.stop();
  }
};
