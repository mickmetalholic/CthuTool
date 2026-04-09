import { describe, expect, test } from 'bun:test';
import { err, ok } from 'neverthrow';
import { runGreetingFlow } from '../../src/flow/run-greeting-flow';

describe('empty input retry', () => {
  test('reprompts after invalid input and then succeeds', async () => {
    const output: string[] = [];
    let calls = 0;
    const code = await runGreetingFlow({
      write: (t) => output.push(t),
      clear: () => output.push('[clear]'),
      prompt: async () => {
        calls += 1;
        if (calls === 1) {
          return err({ type: 'invalid' as const, message: '姓名不能为空' });
        }
        return ok('Bob');
      },
      loading: async () => {},
    });

    expect(code).toBe(0);
    expect(calls).toBe(2);
    expect(output.some((line) => line.includes('姓名不能为空'))).toBe(true);
    expect(output.some((line) => line.includes('Hello, Bob'))).toBe(true);
  });
});
