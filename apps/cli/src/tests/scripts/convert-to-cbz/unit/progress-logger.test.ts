import { describe, expect, test } from 'bun:test';
import {
  createBarFormatterForTest,
  createProgressLogger,
  formatEnglishSummary,
} from '../../../../scripts/convert-to-cbz/infrastructure/logging/progress-logger';

describe('progress-logger', () => {
  test('flush resolves after queued messages', async () => {
    const logger = createProgressLogger();
    logger.info('hello');
    logger.warn('warn');
    logger.error('error');
    await logger.flush();
    expect(true).toBe(true);
  });

  test('formats english structured summary with emoji', () => {
    const lines = formatEnglishSummary({
      totalFiles: 3,
      successCount: 2,
      failureCount: 1,
      failures: [{ sourcePath: 'a/b.pdf', reason: 'boom' }],
      outputRoot: '/tmp/out',
      durationMs: 1200,
    });
    expect(lines.join('\n')).toContain('convert-to-cbz summary');
    expect(lines.join('\n')).toContain('Total');
    expect(lines.join('\n')).toContain('Success');
    expect(lines.join('\n')).toContain('Failed');
    expect(lines.join('\n')).toContain('Output');
    expect(lines.join('\n')).toContain('Time');
    expect(lines.join('\n')).toContain('❌');
  });

  test('uses multibar.log channel (no stdout) during progress rendering', async () => {
    const writes: string[] = [];
    const logs: string[] = [];

    const originalWrite = process.stdout.write.bind(process.stdout);
    // biome-ignore lint/suspicious/noExplicitAny: monkey patch for test
    (process.stdout as any).write = (chunk: unknown, cb?: unknown) => {
      writes.push(String(chunk));
      if (typeof cb === 'function') (cb as () => void)();
      return true;
    };

    try {
      const logger = createProgressLogger({
        createMultiBar: () => ({
          create: () =>
            ({
              setTotal: () => {},
              update: () => {},
              increment: () => {},
              // biome-ignore lint/suspicious/noExplicitAny: minimal fake bar for test
            }) as unknown as any,
          remove: () => true,
          stop: () => {},
          log: (m: string) => logs.push(m),
        }),
      });

      logger.start(1, 1);
      logger.info('hello');
      await logger.flush();
      expect(logs.join('')).toContain('hello');
      expect(writes.length).toBe(0);
    } finally {
      // biome-ignore lint/suspicious/noExplicitAny: restore monkey patch
      (process.stdout as any).write = originalWrite;
    }
  });

  test('uses distinct colors for global vs file progress bars', () => {
    const fmt = createBarFormatterForTest();
    const totalLine = fmt(
      {},
      { bar: '====', percentage: 50, value: 1, total: 2 },
      { kind: 'total', active: true, label: 'Total' },
    );
    const fileLine = fmt(
      {},
      { bar: '====', percentage: 50, value: 1, total: 2 },
      { kind: 'file', active: true, label: 'a/b.pdf' },
    );
    // picocolors uses ANSI escapes; we assert the output differs and includes escapes.
    expect(totalLine).not.toBe(fileLine);
    expect(totalLine).toContain('\u001b[');
    expect(fileLine).toContain('\u001b[');
  });
});
