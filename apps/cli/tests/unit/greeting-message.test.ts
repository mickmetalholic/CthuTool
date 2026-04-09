import { describe, expect, test } from 'bun:test';
import { buildGreetingMessage } from '../../src/domain/greeting-message';

describe('buildGreetingMessage', () => {
  test('formats hello message', () => {
    expect(buildGreetingMessage('Alice')).toBe('Hello, Alice');
  });
});
