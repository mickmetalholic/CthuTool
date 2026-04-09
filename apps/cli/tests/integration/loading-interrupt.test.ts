import { describe, expect, test } from 'bun:test';
import { ok } from 'neverthrow';
import { runGreetingFlow } from '../../src/flow/run-greeting-flow';

describe('loading interrupt', () => {
  test('returns cancelled code and no success message', async () => {
    const output: string[] = [];
    const code = await runGreetingFlow({
      write: (t) => output.push(t),
      clear: () => {},
      prompt: async () => ok('Dora'),
      loading: async () => {
        throw new Error('interrupt');
      },
    });

    expect(code).toBe(130);
    expect(output.some((line) => line.includes('Hello, Dora'))).toBe(false);
  });
});
