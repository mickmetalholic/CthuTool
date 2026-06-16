import { describe, expect, test } from 'bun:test';
import { rootCommand } from '../../src/command/root.command';

describe('root command', () => {
  test('does not expose a browser command group', async () => {
    const subCommands = await rootCommand.subCommands;

    expect(Object.keys(subCommands ?? {})).not.toContain('browser');
  });
});
