import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import {
  defaultSelfUpdateRepo,
  runSelfUpdate,
  type SelfUpdateCommandResult,
  type SelfUpdateDeps,
  type SelfUpdateStep,
} from '../../src/domain/self-update-manager';

function createDeps(options: {
  readonly existingCheckout: boolean;
  readonly remoteRefExists?: boolean;
}) {
  const commands: Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly cwd?: string;
  }> = [];
  const steps: SelfUpdateStep[] = [];
  const mkdirs: string[] = [];
  const installDir = '/tmp/cthutool/source/CthuTool';

  const deps: SelfUpdateDeps = {
    exists(path) {
      return path === join(installDir, '.git') && options.existingCheckout;
    },
    async mkdir(path) {
      mkdirs.push(path);
    },
    async run(
      command,
      args,
      runOptions = {},
    ): Promise<SelfUpdateCommandResult> {
      commands.push({ command, args, cwd: runOptions.cwd });
      const isRemoteRefCheck =
        command === 'git' && args[0] === 'rev-parse' && args[1] === '--verify';
      return {
        command,
        args,
        cwd: runOptions.cwd,
        code: isRemoteRefCheck && options.remoteRefExists === false ? 1 : 0,
        stdout: '',
        stderr: '',
      };
    },
    env: {},
    home: () => '/home/tester',
    onStep: (step) => {
      steps.push(step);
    },
  };

  return { commands, deps, installDir, mkdirs, steps };
}

describe('self-update manager', () => {
  test('uses the public GitHub HTTPS repository by default', () => {
    expect(defaultSelfUpdateRepo).toBe(
      'https://github.com/mickmetalholic/CthuTool.git',
    );
  });

  test('clones, builds, and installs the CLI when no checkout exists', async () => {
    const { commands, deps, installDir, mkdirs, steps } = createDeps({
      existingCheckout: false,
    });

    const result = await runSelfUpdate(
      {
        repo: 'git@github.com:me/CthuTool.git',
        ref: 'main',
        installDir,
      },
      deps,
    );

    expect(result).toMatchObject({
      repo: 'git@github.com:me/CthuTool.git',
      ref: 'main',
      installDir,
    });
    expect(steps).toEqual([
      'clone',
      'checkout',
      'pull',
      'install-dependencies',
      'build',
      'install-global',
    ]);
    expect(mkdirs).toEqual(['/tmp/cthutool/source']);
    expect(commands).toEqual([
      {
        command: 'git',
        args: ['clone', 'git@github.com:me/CthuTool.git', installDir],
        cwd: undefined,
      },
      {
        command: 'git',
        args: ['checkout', 'main'],
        cwd: installDir,
      },
      {
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/main'],
        cwd: installDir,
      },
      {
        command: 'git',
        args: ['pull', '--ff-only', 'origin', 'main'],
        cwd: installDir,
      },
      {
        command: 'pnpm',
        args: ['install', '--frozen-lockfile'],
        cwd: installDir,
      },
      {
        command: 'pnpm',
        args: ['--filter', '@cthutool/cli', 'build'],
        cwd: installDir,
      },
      {
        command: 'npm',
        args: ['install', '-g', installDir],
        cwd: undefined,
      },
    ]);
  });

  test('fetches an existing checkout and skips pull for tags', async () => {
    const { commands, deps, installDir, steps } = createDeps({
      existingCheckout: true,
      remoteRefExists: false,
    });

    await runSelfUpdate(
      {
        repo: 'git@github.com:me/CthuTool.git',
        ref: 'v0.1.0',
        installDir,
      },
      deps,
    );

    expect(steps).toEqual([
      'fetch',
      'checkout',
      'install-dependencies',
      'build',
      'install-global',
    ]);
    expect(commands.slice(0, 4)).toEqual([
      {
        command: 'git',
        args: ['remote', 'set-url', 'origin', 'git@github.com:me/CthuTool.git'],
        cwd: installDir,
      },
      {
        command: 'git',
        args: ['fetch', '--tags', 'origin'],
        cwd: installDir,
      },
      {
        command: 'git',
        args: ['checkout', 'v0.1.0'],
        cwd: installDir,
      },
      {
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/v0.1.0'],
        cwd: installDir,
      },
    ]);
    expect(commands).not.toContainEqual({
      command: 'git',
      args: ['pull', '--ff-only', 'origin', 'v0.1.0'],
      cwd: installDir,
    });
  });
});
