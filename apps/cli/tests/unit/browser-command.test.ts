import { describe, expect, mock, test } from 'bun:test';
import { runCommand } from 'citty';
import {
  type BrowserDoctorResult,
  createBrowserCommand,
} from '../../src/command/browser.command';

describe('browser command', () => {
  test('reports host Chrome as the desktop browser runtime', async () => {
    const command = createBrowserCommand({
      checkBrowsers: mock(async () =>
        doctorResult({
          hostChromeAvailable: true,
        }),
      ),
      fetchBrowserStatus: mock(async () => emptyStatus()),
    });

    const previousExitCode = process.exitCode;
    process.exitCode = undefined;
    try {
      const output = await captureStdout(() =>
        runCommand(command, { rawArgs: ['doctor', '--json'] }),
      );
      expect(process.exitCode as number | undefined).toBe(0);
      expect(JSON.parse(output)).toEqual({
        ok: true,
        command: 'browser doctor',
        result: doctorResult(),
      });
    } finally {
      process.exitCode = previousExitCode;
    }
  });

  test('fails doctor when host Chrome is unavailable', async () => {
    const command = createBrowserCommand({
      checkBrowsers: mock(async () =>
        doctorResult({
          hostChromeAvailable: false,
          hostChromeError: 'Chrome channel missing',
          ok: false,
          warnings: ['Host Google Chrome is unavailable.'],
        }),
      ),
      fetchBrowserStatus: mock(async () => emptyStatus()),
    });

    const previousExitCode = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, { rawArgs: ['doctor'] });
      expect(process.exitCode as number | undefined).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
    }
  });

  test('reads backend status without checking local browser runtime', async () => {
    const checkBrowsers = mock(async () => doctorResult());
    const fetchBrowserStatus = mock(async () => ({
      pendingAuthTasks: [{ id: 'task-1' }],
      profiles: [{ id: 'profile-1' }],
      sites: [{ id: 'douban' }],
    }));
    const command = createBrowserCommand({
      checkBrowsers,
      fetchBrowserStatus,
    });

    await runCommand(command, { rawArgs: ['status'] });

    expect(fetchBrowserStatus).toHaveBeenCalledWith({
      backendUrl: 'http://localhost:3000',
    });
    expect(checkBrowsers).not.toHaveBeenCalled();
  });
});

function doctorResult(
  overrides: Partial<BrowserDoctorResult> = {},
): BrowserDoctorResult {
  return {
    ...doctorResultBase(),
    ...overrides,
  };
}

function doctorResultBase(): BrowserDoctorResult {
  return {
    hostChromeAvailable: true,
    ok: true,
    playwrightAvailable: true,
    preferredRuntime: 'host-chrome',
    warnings: [],
  };
}

function emptyStatus() {
  return {
    pendingAuthTasks: [],
    profiles: [],
    sites: [],
  };
}

async function captureStdout(
  callback: () => Promise<unknown>,
): Promise<string> {
  let output = '';
  const originalWrite = process.stdout.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  try {
    await callback();
  } finally {
    process.stdout.write = originalWrite;
  }
  return output.trim();
}
