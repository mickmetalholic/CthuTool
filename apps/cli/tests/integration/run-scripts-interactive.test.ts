import { describe, expect, test } from 'bun:test';
import { runCommand } from 'citty';
import { createScriptsCommand } from '../../src/command/run-scripts.command';

describe('scripts command interactive selection', () => {
  test('uses pickScriptId when multiple scripts and no explicit id', async () => {
    const cmd = createScriptsCommand({
      isInteractive: () => true,
      pickScriptId: async (rows) => {
        expect(rows.length).toBeGreaterThanOrEqual(2);
        return 'second-script';
      },
    });
    const logs: string[] = [];
    const errLogs: string[] = [];
    const origLog = console.log;
    const origErr = console.error;
    console.log = (...a: unknown[]) => {
      logs.push(a.map(String).join(' '));
      origLog(...a);
    };
    console.error = (...a: unknown[]) => {
      errLogs.push(a.map(String).join(' '));
      origErr(...a);
    };
    try {
      await runCommand(cmd, { rawArgs: [] });
    } finally {
      console.log = origLog;
      console.error = origErr;
    }
    expect(logs.some((l) => l.includes('second-script'))).toBe(true);
    expect(process.exitCode === 1).toBe(false);
  });
});
