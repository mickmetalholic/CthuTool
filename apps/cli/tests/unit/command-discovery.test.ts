import { describe, expect, test } from 'bun:test';
import {
  filterUsageCommandChoices,
  getCommandRegistration,
  getCommandRegistrations,
} from '../../src/command/command-discovery';
import { rootCommand } from '../../src/command/root.command';
import { getCompletionCandidates } from '../../src/domain/completion-candidates';

describe('command discovery registry', () => {
  test('filters hidden usage choices from ANSI-styled help', () => {
    const line =
      '\u001b[36mUSAGE chc codex|version|status|__complete|scripts\u001b[39m';

    expect(
      filterUsageCommandChoices(line, new Set(['version', '__complete'])),
    ).toBe('USAGE chc codex|status|scripts');
  });

  test('root completion candidates match public registrations', async () => {
    const registrations = getCommandRegistrations(rootCommand) ?? [];
    const publicNames = registrations
      .filter((registration) => registration.visibility === 'public')
      .map((registration) => registration.name)
      .sort();

    await expect(
      getCompletionCandidates({ rootCommand, words: [''] }),
    ).resolves.toEqual(publicNames);

    const hiddenNames = registrations
      .filter((registration) => registration.visibility !== 'public')
      .map((registration) => registration.name);
    expect(hiddenNames).toEqual(
      expect.arrayContaining(['__complete', 'version']),
    );
    expect(publicNames).not.toEqual(expect.arrayContaining(hiddenNames));
  });

  test('public command groups declare help for bare invocation', () => {
    const registrations = getCommandRegistrations(rootCommand) ?? [];
    const bareHelpNames = registrations
      .filter(
        (registration) =>
          registration.visibility === 'public' &&
          registration.bareBehavior === 'help',
      )
      .map((registration) => registration.name)
      .sort();

    expect(bareHelpNames).toEqual([
      'agent',
      'codex',
      'completion',
      'obsidian',
      'scripts',
    ]);
  });

  test('nested completion candidates match public child registrations', async () => {
    const completion = getCommandRegistration(rootCommand, 'completion');
    expect(completion).toBeDefined();
    const childNames = (
      getCommandRegistrations(completion?.command ?? rootCommand) ?? []
    )
      .filter((registration) => registration.visibility === 'public')
      .map((registration) => registration.name)
      .sort();

    await expect(
      getCompletionCandidates({
        rootCommand,
        words: ['completion', ''],
      }),
    ).resolves.toEqual(childNames);
  });
});
