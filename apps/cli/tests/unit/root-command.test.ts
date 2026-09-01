import { describe, expect, test } from 'bun:test';
import {
  getCommandRegistration,
  getCommandRegistrations,
} from '../../src/command/command-discovery';
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

  test('keeps lifecycle aliases executable but discovers them under source', async () => {
    const rootRegistrations = getCommandRegistrations(rootCommand) ?? [];
    const source = getCommandRegistration(rootCommand, 'source');
    const sourceRegistrations = getCommandRegistrations(
      source?.command ?? rootCommand,
    );

    expect(getCommandRegistration(rootCommand, 'status')?.visibility).toBe(
      'compat',
    );
    expect(getCommandRegistration(rootCommand, 'update')?.visibility).toBe(
      'compat',
    );
    expect(rootRegistrations.map((registration) => registration.name)).toEqual(
      expect.arrayContaining(['status', 'update']),
    );
    expect(
      sourceRegistrations
        ?.filter((registration) => registration.visibility === 'public')
        .map((registration) => registration.name),
    ).toEqual(['list', 'status', 'use', 'update', 'register']);
  });
});
