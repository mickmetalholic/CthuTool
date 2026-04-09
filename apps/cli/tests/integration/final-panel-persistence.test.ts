import { describe, expect, test } from 'bun:test';
import { ok } from 'neverthrow';
import { runGreetingFlow } from '../../src/flow/run-greeting-flow';

describe('final panel persistence', () => {
  test('keeps panel visible together with final greeting', async () => {
    const output: string[] = [];
    await runGreetingFlow({
      write: (t) => output.push(t),
      clear: () => {},
      prompt: async () => ok('Casey'),
      loading: async () => {},
    });

    const panelIndexes = output
      .map((line: string, index: number) =>
        line.includes('CthuTool CLI Demo') ? index : -1,
      )
      .filter((index: number) => index >= 0);
    const greetingIndexes = output
      .map((line: string, index: number) =>
        line.includes('Hello, Casey') ? index : -1,
      )
      .filter((index: number) => index >= 0);
    const lastPanelIndex = panelIndexes[panelIndexes.length - 1] ?? -1;
    const greetingIndex = greetingIndexes[greetingIndexes.length - 1] ?? -1;
    expect(lastPanelIndex).toBeGreaterThan(-1);
    expect(greetingIndex).toBeGreaterThan(lastPanelIndex);
  });
});
