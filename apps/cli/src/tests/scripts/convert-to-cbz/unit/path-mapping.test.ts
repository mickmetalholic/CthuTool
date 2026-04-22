import { describe, expect, test } from 'bun:test';
import {
  mapSourceToOutput,
  toArchiveName,
} from '../../../../scripts/convert-to-cbz/domain/path-mapping';

describe('path-mapping', () => {
  test('builds cbz target path with same relative dir', () => {
    const mapped = mapSourceToOutput(
      '/input',
      '/output',
      '/input/a/b/book.pdf',
    );
    expect(mapped.targetCbzPath.replaceAll('\\', '/')).toBe(
      '/output/a/b/book.cbz',
    );
  });

  test('builds zero-padded archive names', () => {
    expect(toArchiveName(1, 'jpg')).toBe('0001.jpg');
  });
});
