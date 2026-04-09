import { describe, expect, test } from 'bun:test';
import { ok } from 'neverthrow';
import { runGreetingFlow } from '../../src/flow/run-greeting-flow';

describe('greeting happy path', () => {
  test('runs panel -> loading -> greeting output', async () => {
    const output: string[] = [];
    const code = await runGreetingFlow({
      write: (t) => output.push(t),
      clear: () => output.push('[clear]'),
      prompt: async () => ok('Alice'),
      loading: async () => {},
    });

    expect(code).toBe(0);
    expect(output[0]).toContain('CthuTool CLI Demo');
    expect(output).toContain('[clear]');
    expect(output.some((line) => line.includes('Hello, Alice'))).toBe(true);
  });
});
