import { describe, expect, test } from 'bun:test';
import { permissionFailure } from '../../../../scripts/convert-to-cbz/domain/errors';

describe('permission-error', () => {
  test('returns actionable permission message', () => {
    const failure = permissionFailure('/output/a.cbz', 'write');
    expect(failure.recoverable).toBe(true);
    expect(failure.reason.toLowerCase()).toContain('permission');
  });
});
