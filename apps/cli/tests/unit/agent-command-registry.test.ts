import { describe, expect, test } from 'bun:test';
import { agentCommand } from '../../src/command/agent.command';
import {
  getCommandRegistration,
  getCommandRegistrations,
} from '../../src/command/command-discovery';
import { rootCommand } from '../../src/command/root.command';

describe('public Agent command registry', () => {
  test('statically exposes lifecycle, environment, and autostart commands', () => {
    const names = (getCommandRegistrations(agentCommand) ?? []).map(
      (item) => item.name,
    );
    expect(names).toEqual([
      'install',
      'update',
      'start',
      'stop',
      'restart',
      'status',
      'settings',
      'logs',
      'env',
      'autostart',
      'doctor',
      'uninstall',
    ]);
    const environment = getCommandRegistration(agentCommand, 'env');
    expect(
      (getCommandRegistrations(environment?.command ?? agentCommand) ?? []).map(
        (item) => item.name,
      ),
    ).toEqual(['list', 'get', 'set']);
    const autostart = getCommandRegistration(agentCommand, 'autostart');
    expect(
      (getCommandRegistrations(autostart?.command ?? agentCommand) ?? []).map(
        (item) => item.name,
      ),
    ).toEqual(['enable', 'disable', 'status']);
  });

  test('keeps CLI self-update and Agent update as separate commands', () => {
    expect(getCommandRegistration(agentCommand, 'update')?.command).not.toBe(
      getCommandRegistration(rootCommand, 'update')?.command,
    );
  });
});
