import { describe, expect, test } from 'bun:test';
import {
  conversionFailure,
  fatalFailure,
  permissionFailure,
} from '../../../../scripts/convert-to-cbz/domain/errors';

describe('errors', () => {
  test('maps recoverable and unrecoverable failures', () => {
    const recoverable = conversionFailure('a.pdf', 'convert', 'bad file');
    const denied = permissionFailure('b.pdf', 'write');
    const fatal = fatalFailure('c.pdf', 'read', 'dependency missing');

    expect(recoverable.recoverable).toBe(true);
    expect(denied.recoverable).toBe(true);
    expect(fatal.recoverable).toBe(false);
  });
});
