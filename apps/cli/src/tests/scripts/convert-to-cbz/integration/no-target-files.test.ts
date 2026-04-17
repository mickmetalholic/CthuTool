import { describe, expect, test } from 'bun:test';
import { okAsync } from 'neverthrow';
import { runConversionJob } from '../../../../scripts/convert-to-cbz/application/run-conversion-job';
import type { ProgressLogger } from '../../../../scripts/convert-to-cbz/infrastructure/logging/progress-logger';

describe('no-target-files', () => {
  test('returns early with zero summary when scanner finds nothing', async () => {
    const logs: string[] = [];
    const fakeLogger: ProgressLogger = {
      start: () => undefined,
      beginFile: () => undefined,
      updateFile: () => undefined,
      finishFile: () => undefined,
      info: (m) => logs.push(m),
      success: (m) => logs.push(m),
      warn: (m) => logs.push(m),
      error: (m) => logs.push(m),
      incrementTotal: () => undefined,
      flush: async () => undefined,
      stop: () => undefined,
    };

    const summary = await runConversionJob(
      {
        input: '/tmp/empty',
        imageFormat: 'jpg',
        imageQuality: 90,
        dpi: 200,
        fileConcurrency: 2,
        epubRenderConcurrency: 1,
      },
      [],
      {
        checkPoppler: () => okAsync(true),
        scanTargetFiles: async () => [],
        createProgressLogger: () => fakeLogger,
      },
    );

    expect(summary.totalFiles).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(logs.some((x) => x.includes('No convertible files'))).toBe(true);
  });
});
