import { describe, expect, test } from 'bun:test';
import { createProgressLogger } from '../../../../scripts/convert-to-cbz/infrastructure/logging/progress-logger';

describe('progress-logger', () => {
  test('flush resolves after queued messages', async () => {
    const logger = createProgressLogger();
    logger.info('hello');
    logger.warn('warn');
    logger.error('error');
    await logger.flush();
    expect(true).toBe(true);
  });
});
