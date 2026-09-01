import { describe, expect, test } from 'bun:test';
import { rootCommand } from '../../src/command/root.command';

describe('root command', () => {
  test('does not expose a browser command group', async () => {
    const subCommands = await rootCommand.subCommands;

    expect(Object.keys(subCommands ?? {})).not.toContain('browser');
  });

  test('keeps Codex command groups after OpenCode removal', async () => {
    const subCommands = await rootCommand.subCommands;

    expect(Object.keys(subCommands ?? {})).toEqual(
      expect.arrayContaining(['codex']),
    );
    expect(Object.keys(subCommands ?? {})).not.toContain('opencode');
  });

  test('exposes the CLI source command group', async () => {
    const subCommands = await rootCommand.subCommands;

    expect(Object.keys(subCommands ?? {})).toContain('source');
  });
});
