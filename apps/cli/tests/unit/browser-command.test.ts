import { describe, expect, mock, test } from 'bun:test';
import { runCommand } from 'citty';
import { createBrowserCommand } from '../../src/command/browser.command';

describe('browser command', () => {
  test('runs auth login with parsed profile and output directory', async () => {
    const runLogin = mock(async () => ({
      metaPath: 'out/douban/meta.json',
      profilePath: 'out/douban',
      storageStatePath: 'out/douban/storage-state.json',
    }));
    const command = createBrowserCommand({
      checkBrowsers: mock(async () => ({
        chromiumAvailable: true,
        installCommand: 'chc browser install',
        playwrightAvailable: true,
      })),
      installBrowsers: mock(async () => undefined),
      runLogin,
      runVerify: mock(async () => ({
        profileName: 'douban',
        user: { id: '123456789', nickname: '阿圆' },
      })),
    });

    const previousExitCode: NodeJS.Process['exitCode'] = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, {
        rawArgs: [
          'auth',
          'login',
          'douban',
          '--out',
          'out',
          '--login-url',
          'https://accounts.douban.com/passport/login',
          '--verify-url',
          'https://movie.douban.com/',
        ],
      });
    } finally {
      process.exitCode = previousExitCode;
    }

    expect(runLogin).toHaveBeenCalledWith({
      allowedOrigins: [
        'https://accounts.douban.com',
        'https://movie.douban.com',
        'https://www.douban.com',
      ],
      loginUrl: 'https://accounts.douban.com/passport/login',
      outputRoot: 'out',
      profileName: 'douban',
      verifyUrl: 'https://movie.douban.com/',
    });
  });

  test('fails when login URL cannot be resolved', async () => {
    const runLogin = mock(async () => ({
      metaPath: '',
      profilePath: '',
      storageStatePath: '',
    }));
    const command = createBrowserCommand({ runLogin });

    const previousExitCode: NodeJS.Process['exitCode'] = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, {
        rawArgs: ['auth', 'login', 'unknown', '--out', 'out'],
      });
      expect(process.exitCode as number | undefined).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
    }
    expect(runLogin).not.toHaveBeenCalled();
  });

  test('runs auth verify with minimal user identity output', async () => {
    const runVerify = mock(async () => ({
      profileName: 'douban',
      user: { id: '123456789', nickname: '阿圆' },
    }));
    const command = createBrowserCommand({
      runLogin: mock(async () => ({
        metaPath: '',
        profilePath: '',
        storageStatePath: '',
      })),
      runVerify,
    });

    const previousExitCode: NodeJS.Process['exitCode'] = process.exitCode;
    process.exitCode = undefined;
    try {
      await runCommand(command, {
        rawArgs: [
          'auth',
          'verify',
          'douban',
          '--out',
          'out',
          '--headed',
          '--json',
        ],
      });
      expect(process.exitCode as number | undefined).toBe(0);
    } finally {
      process.exitCode = previousExitCode;
    }

    expect(runVerify).toHaveBeenCalledWith({
      authRoot: 'out',
      headed: true,
      profileName: 'douban',
      verifyUrl: 'https://www.douban.com/mine/',
    });
  });

  test('runs browser install for chromium by default', async () => {
    const installBrowsers = mock(async () => undefined);
    const command = createBrowserCommand({
      checkBrowsers: mock(async () => ({
        chromiumAvailable: true,
        installCommand: 'chc browser install',
        playwrightAvailable: true,
      })),
      installBrowsers,
      runLogin: mock(async () => ({
        metaPath: '',
        profilePath: '',
        storageStatePath: '',
      })),
      runVerify: mock(async () => ({
        profileName: 'douban',
        user: { id: '123456789', nickname: '阿圆' },
      })),
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
      installBrowsers: mock(async () => undefined),
      runLogin: mock(async () => ({
        metaPath: '',
        profilePath: '',
        storageStatePath: '',
      })),
      runVerify: mock(async () => ({
        profileName: 'douban',
        user: { id: '123456789', nickname: '阿圆' },
      })),
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
});
