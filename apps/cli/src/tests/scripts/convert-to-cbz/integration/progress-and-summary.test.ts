import { describe, expect, test } from 'bun:test';
import { buildConversionSummary } from '../../../../scripts/convert-to-cbz/application/run-conversion-job';
import { conversionFailure } from '../../../../scripts/convert-to-cbz/domain/errors';

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
});
