import { describe, expect, test } from 'bun:test';
import { canTransition, nextState } from '../../src/domain/run-state';

describe('run-state', () => {
  test('supports required flow order', () => {
    expect(canTransition('welcome', 'prompt')).toBe(true);
    expect(canTransition('prompt', 'loading')).toBe(true);
    expect(canTransition('loading', 'result')).toBe(true);
  });

  test('blocks invalid transition', () => {
    expect(() => nextState('welcome', 'result')).toThrow();
  });
});
