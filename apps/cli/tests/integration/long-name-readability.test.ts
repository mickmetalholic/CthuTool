import { describe, expect, test } from 'bun:test';
import { ok } from 'neverthrow';
import { runGreetingFlow } from '../../src/flow/run-greeting-flow';

describe('long name readability', () => {
  test('renders greeting for long input', async () => {
    const output: string[] = [];
    const longName = 'Alexandria-Cassandra-TheThird';
    await runGreetingFlow({
      write: (t) => output.push(t),
      clear: () => {},
      prompt: async () => ok(longName),
      loading: async () => {},
    });

    expect(output.some((line) => line.includes(`Hello, ${longName}`))).toBe(
      true,
    );
  });
});
