import { describe, expect, test } from 'bun:test';
import { normalizeName, validateName } from '../../src/domain/name-schema';

describe('name-schema', () => {
  test('rejects empty and whitespace-only input', () => {
    expect(validateName('').isErr()).toBe(true);
    expect(validateName('   ').isErr()).toBe(true);
  });

  test('normalizes trimmed name', () => {
    expect(normalizeName('  Bob  ')).toBe('Bob');
    expect(validateName('  Bob  ')._unsafeUnwrap()).toBe('Bob');
  });
});
