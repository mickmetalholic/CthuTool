import { describe, expect, test } from 'bun:test';
import {
  normalizeScriptId,
  validateScriptId,
} from '../../src/domain/script-id';

describe('script id', () => {
  test('validateScriptId accepts kebab-case ids', () => {
    expect(validateScriptId('hello-world')._unsafeUnwrap()).toBe('hello-world');
    expect(validateScriptId('a1')._unsafeUnwrap()).toBe('a1');
  });

  test('normalizeScriptId trims whitespace', () => {
    expect(normalizeScriptId('  hello-world  ')).toBe('hello-world');
  });

  test('validateScriptId rejects empty and invalid shapes', () => {
    expect(validateScriptId('').isErr()).toBe(true);
    expect(validateScriptId('   ').isErr()).toBe(true);
    expect(validateScriptId('Hello').isErr()).toBe(true);
    expect(validateScriptId('hello_world').isErr()).toBe(true);
    expect(validateScriptId('-a').isErr()).toBe(true);
    expect(validateScriptId('a-').isErr()).toBe(true);
  });
});
