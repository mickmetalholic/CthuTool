import { describe, expect, mock, test } from 'bun:test';
import { runCommand } from 'citty';
import { createBrowserCommand } from '../../src/command/browser.command';

describe('browser command', () => {
  test('does not expose legacy auth helper commands', () => {
    const command = createBrowserCommand();

    expect(Object.keys(command.subCommands ?? {}).sort()).toEqual([
      'doctor',
      'install',
      'status',
    ]);
  });

  test('runs browser install for chromium by default', async () => {
    const installBrowsers = mock(async () => undefined);
    const command = createBrowserCommand({
      checkBrowsers: mock(async () => ({
        chromiumAvailable: true,
        installCommand: 'chc browser install',
        playwrightAvailable: true,
      })),
      fetchBrowserStatus: mock(async () => ({
        pendingAuthTasks: [],
        profiles: [],
        sites: [],
      })),
      installBrowsers,
    });

    const previousExitCode: NodeJS.Process['exitCode'] = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, {
        rawArgs: ['install'],
      });
      expect(process.exitCode as number | undefined).toBe(0);
    } finally {
      process.exitCode = previousExitCode;
    }

    expect(installBrowsers).toHaveBeenCalledWith({
      browserName: 'chromium',
      withDeps: false,
    });
  });

  test('reports doctor status as json', async () => {
    const command = createBrowserCommand({
      checkBrowsers: mock(async () => ({
        chromiumAvailable: false,
        installCommand: 'chc browser install',
        playwrightAvailable: true,
      })),
      fetchBrowserStatus: mock(async () => ({
        pendingAuthTasks: [],
        profiles: [],
        sites: [],
      })),
      installBrowsers: mock(async () => undefined),
    });

    const previousExitCode: NodeJS.Process['exitCode'] = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, {
        rawArgs: ['doctor', '--json'],
      });
      expect(process.exitCode as number | undefined).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
    }
  });

  test('reports backend browser status as json', async () => {
    const fetchBrowserStatus = mock(async () => ({
      pendingAuthTasks: [{ id: 'agent-1:douban:douban-main' }],
      profiles: [],
      sites: [{ siteId: 'douban' }],
    }));
    const command = createBrowserCommand({
      fetchBrowserStatus,
    });

    const previousExitCode: NodeJS.Process['exitCode'] = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, {
        rawArgs: ['status', '--backend-url', 'http://backend.local', '--json'],
      });
      expect(process.exitCode as number | undefined).toBe(0);
    } finally {
      process.exitCode = previousExitCode;
    }

    expect(fetchBrowserStatus).toHaveBeenCalledWith({
      backendUrl: 'http://backend.local',
    });
  });
});
