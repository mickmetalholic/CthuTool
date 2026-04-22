import { describe, expect, test } from 'bun:test';
import {
  assignProgressSlot,
  createProgressSlots,
  releaseProgressSlot,
  sanitizeRelativeDisplayName,
} from '../../../../scripts/convert-to-cbz/infrastructure/logging/progress-view-model';

describe('progress-view-model', () => {
  test('assigns and reuses slots', () => {
    const base = createProgressSlots(2);
    const withA = assignProgressSlot(base, 'a', 'A');
    const withAB = assignProgressSlot(withA, 'b', 'B');
    expect(withAB.filter((x) => x.taskId !== null).length).toBe(2);

    const releasedA = releaseProgressSlot(withAB, 'a');
    const reused = assignProgressSlot(releasedA, 'c', 'C');
    const ids = reused.map((x) => x.taskId);
    expect(ids.includes('c')).toBe(true);
  });

  test('sanitizes absolute paths to non-absolute labels', () => {
    expect(sanitizeRelativeDisplayName('nested/book.pdf')).toBe(
      'nested/book.pdf',
    );
    expect(sanitizeRelativeDisplayName('C:\\Users\\me\\books\\a.pdf')).toBe(
      'books/a.pdf',
    );
    expect(sanitizeRelativeDisplayName('/home/me/books/a.pdf')).toBe(
      'books/a.pdf',
    );
  });
});
