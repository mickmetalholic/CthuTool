import { describe, expect, test } from 'bun:test';
import { parseConversionOptions } from '../../../../scripts/convert-to-cbz/domain/option-schema';

describe('option-schema', () => {
  test('rejects out-of-range quality', () => {
    const parsed = parseConversionOptions({
      input: '/tmp/in',
      quality: 101,
    });
    expect(parsed.isErr()).toBe(true);
  });

  test('rejects out-of-range dpi', () => {
    const parsed = parseConversionOptions({
      input: '/tmp/in',
      dpi: 601,
    });
    expect(parsed.isErr()).toBe(true);
  });

  test('rejects invalid concurrency', () => {
    const parsed = parseConversionOptions({
      input: '/tmp/in',
      concurrency: 0,
    });
    expect(parsed.isErr()).toBe(true);
  });

  test('defaults to safe conflict handling and accepts explicit overwrite', () => {
    const safe = parseConversionOptions({ input: '/tmp/in' });
    const overwrite = parseConversionOptions({
      input: '/tmp/in',
      overwrite: true,
    });

    expect(safe.isOk() && safe.value.overwrite).toBe(false);
    expect(overwrite.isOk() && overwrite.value.overwrite).toBe(true);
  });
});
