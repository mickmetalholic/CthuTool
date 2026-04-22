import { describe, expect, test } from 'bun:test';
import { buildConversionSummary } from '../../../../scripts/convert-to-cbz/application/run-conversion-job';
import { conversionFailure } from '../../../../scripts/convert-to-cbz/domain/errors';
import { formatEnglishSummary } from '../../../../scripts/convert-to-cbz/infrastructure/logging/progress-logger';

describe('progress-and-summary', () => {
  test('aggregates success and failure summary', () => {
    const summary = buildConversionSummary(
      3,
      [
        { sourcePath: 'a.pdf', ok: true },
        {
          sourcePath: 'b.pdf',
          ok: false,
          failure: conversionFailure('b.pdf', 'convert', 'boom'),
        },
        { sourcePath: 'c.epub', ok: true },
      ],
      '/tmp/output',
      1200,
    );
    expect(summary.totalFiles).toBe(3);
    expect(summary.successCount).toBe(2);
    expect(summary.failureCount).toBe(1);
  });

  test('summary is scannable within a few screens', () => {
    const summary = buildConversionSummary(
      8,
      [
        { sourcePath: 'a.pdf', ok: true },
        { sourcePath: 'b.pdf', ok: true },
        {
          sourcePath: 'c.pdf',
          ok: false,
          failure: conversionFailure('c.pdf', 'convert', 'boom'),
        },
        { sourcePath: 'd.epub', ok: true },
      ],
      '/tmp/output',
      12_345,
    );

    const lines = formatEnglishSummary({
      totalFiles: summary.totalFiles,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
      failures: summary.failures.map((f) => ({
        sourcePath: f.sourcePath,
        reason: f.reason,
      })),
      outputRoot: summary.outputRoot,
      durationMs: summary.durationMs,
    });

    // <= 3 typical terminal screens (~20-24 lines each)
    expect(lines.length).toBeLessThanOrEqual(60);
    const text = lines.join('\n');
    expect(text).toContain('Total');
    expect(text).toContain('Success');
    expect(text).toContain('Failed');
    expect(text).toContain('Output');
    expect(text).toContain('Time');
  });
});
