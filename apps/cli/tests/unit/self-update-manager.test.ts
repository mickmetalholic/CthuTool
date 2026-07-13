import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import {
  committedCliBundlePath,
  defaultSelfUpdateRepo,
  getCliInstallationStatus,
  planSelfUpdate,
  runSelfUpdate,
  type SelfUpdateCommandResult,
  type SelfUpdateDeps,
  SelfUpdateError,
  type SelfUpdateEvent,
} from '../../src/domain/self-update-manager';

const currentCommit = '1111111111111111111111111111111111111111';
const targetCommit = '2222222222222222222222222222222222222222';

type FakeOptions = {
  readonly existingCheckout?: boolean;
  readonly currentCommit?: string;
  readonly targetCommit?: string;
  readonly targetKind?: 'branch' | 'tag' | 'raw';
  readonly dirty?: boolean;
  readonly dirtyOnRecheck?: boolean;
  readonly diverged?: boolean;
  readonly bundlePresent?: boolean;
  readonly failCommand?: string;
  readonly failOutput?: string;
  readonly changeCount?: number;
};

function createDeps(options: FakeOptions = {}) {
  const commands: Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly cwd?: string;
  }> = [];
  const events: SelfUpdateEvent[] = [];
  const mkdirs: string[] = [];
  const installDir = '/tmp/cthutool/source/CthuTool';
  let checkoutExists = options.existingCheckout ?? true;
  let head = options.currentCommit ?? currentCommit;
  let ref = 'main';
  let statusCalls = 0;
  const wantedTarget = options.targetCommit ?? targetCommit;
  const targetKind = options.targetKind ?? 'branch';
  const changeCount = options.changeCount ?? 7;

  const deps: SelfUpdateDeps = {
    exists(path) {
      if (path === join(installDir, '.git')) return checkoutExists;
      if (path === join(installDir, committedCliBundlePath)) {
        return options.bundlePresent ?? true;
      }
      return false;
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
      const signature = `${command} ${args.join(' ')}`;
      if (options.failCommand && signature.includes(options.failCommand)) {
        return {
          command,
          args,
          cwd: runOptions.cwd,
          code: 1,
          stdout: '',
          stderr: options.failOutput ?? 'simulated failure',
        };
      }

      let code = 0;
      let stdout = '';
      if (command === 'git' && args[0] === 'status') {
        statusCalls += 1;
        const dirty =
          options.dirty === true ||
          (options.dirtyOnRecheck === true && statusCalls > 1);
        stdout = dirty ? '?? local-change\n' : '';
      } else if (
        command === 'git' &&
        args[0] === 'rev-parse' &&
        args[2] === 'HEAD^{commit}'
      ) {
        stdout = `${head}\n`;
      } else if (
        command === 'git' &&
        args[0] === 'rev-parse' &&
        args[2] === 'FETCH_HEAD^{commit}'
      ) {
        stdout = `${wantedTarget}\n`;
      } else if (
        command === 'git' &&
        args[0] === 'symbolic-ref' &&
        targetKind !== 'tag'
      ) {
        stdout = `${ref}\n`;
      } else if (command === 'git' && args[0] === 'symbolic-ref') {
        code = 1;
      } else if (command === 'git' && args[0] === 'ls-remote') {
        if (targetKind === 'branch') {
          stdout = `${wantedTarget}\trefs/heads/main\n`;
        } else {
          code = 2;
        }
      } else if (command === 'git' && args[0] === 'merge-base') {
        code = options.diverged === true ? 1 : 0;
      } else if (command === 'git' && args[0] === 'rev-list') {
        stdout = `${changeCount}\n`;
      } else if (command === 'git' && args[0] === 'log') {
        stdout = Array.from(
          { length: Math.min(changeCount, 5) },
          (_, index) => `c${index + 1}\tCommit subject ${index + 1}`,
        ).join('\n');
      } else if (command === 'git' && args[0] === 'clone') {
        checkoutExists = true;
        head = wantedTarget;
      } else if (command === 'git' && args[0] === 'checkout') {
        ref = args[1] ?? ref;
        head = wantedTarget;
      } else if (
        command === 'git' &&
        args[0] === 'rev-parse' &&
        args[1] === '--verify' &&
        String(args[2]).startsWith('origin/')
      ) {
        code = targetKind === 'branch' ? 0 : 1;
        stdout = code === 0 ? `${wantedTarget}\n` : '';
      } else if (
        command === 'git' &&
        args[0] === 'remote' &&
        args[1] === 'get-url'
      ) {
        stdout = 'git@github.com:me/CthuTool.git\n';
      } else if (
        command === 'git' &&
        args[0] === 'rev-parse' &&
        args[1] === '--abbrev-ref'
      ) {
        stdout = `${ref}\n`;
      } else if (
        command === 'git' &&
        args[0] === 'rev-parse' &&
        args[1] === '--short'
      ) {
        stdout = `${head.slice(0, 7)}\n`;
      }
      return {
        command,
        args,
        cwd: runOptions.cwd,
        code,
        stdout,
        stderr: '',
      };
    },
    env: {},
    home: () => '/home/tester',
    onEvent: (event) => events.push(event),
  };

  return { commands, deps, events, installDir, mkdirs };
}

function signatures(
  commands: ReadonlyArray<{
    readonly command: string;
    readonly args: readonly string[];
  }>,
) {
  return commands.map(({ command, args }) => `${command} ${args.join(' ')}`);
}

describe('self-update manager', () => {
  test('uses the public GitHub HTTPS repository by default', () => {
    expect(defaultSelfUpdateRepo).toBe(
      'https://github.com/mickmetalholic/CthuTool.git',
    );
  });

  test('classifies an absent managed checkout without running commands', async () => {
    const { commands, deps, installDir } = createDeps({
      existingCheckout: false,
    });

    await expect(planSelfUpdate({ installDir }, deps)).resolves.toMatchObject({
      status: 'install_required',
      installDir,
      phases: ['preflight'],
    });
    expect(commands).toEqual([]);
  });

  test('classifies an equal branch target as already current', async () => {
    const { commands, deps, installDir } = createDeps({
      targetCommit: currentCommit,
    });
    const plan = await planSelfUpdate({ installDir }, deps);

    expect(plan).toMatchObject({
      status: 'up_to_date',
      before: { commit: currentCommit },
      target: { commit: currentCommit },
    });
    expect(signatures(commands)).toContain(
      `git fetch --no-tags ${defaultSelfUpdateRepo} main`,
    );
    expect(signatures(commands)).not.toContain(
      `git remote set-url origin ${defaultSelfUpdateRepo}`,
    );
  });

  test('redacts repository credentials from emitted command events', async () => {
    const { deps, events, installDir } = createDeps({
      targetCommit: currentCommit,
    });
    await planSelfUpdate(
      {
        installDir,
        repo: 'https://update-user:super-secret@example.invalid/repo.git',
      },
      deps,
    );

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('super-secret');
    expect(serialized).toContain('https://***@example.invalid/repo.git');
  });

  test('classifies a branch update and bounds its change summary', async () => {
    const { deps, installDir } = createDeps({ changeCount: 7 });
    const plan = await planSelfUpdate({ installDir }, deps);

    expect(plan).toMatchObject({
      status: 'update_available',
      before: { commit: currentCommit },
      target: { commit: targetCommit },
      changes: { count: 7, omitted: 2 },
    });
    expect(plan.changes?.highlights).toHaveLength(5);
  });

  for (const targetKind of ['tag', 'raw'] as const) {
    test(`supports an available ${targetKind} target without branch fast-forward checks`, async () => {
      const { commands, deps, installDir } = createDeps({ targetKind });
      const plan = await planSelfUpdate(
        { installDir, ref: targetKind === 'tag' ? 'v1.0.0' : targetCommit },
        deps,
      );

      expect(plan.status).toBe('update_available');
      expect(plan.target?.commit).toBe(targetCommit);
      expect(
        signatures(commands).some((value) => value.includes('merge-base')),
      ).toBe(false);
    });
  }

  test('blocks dirty checkout state before any remote operation', async () => {
    const { commands, deps, installDir } = createDeps({ dirty: true });
    const plan = await planSelfUpdate({ installDir }, deps);

    expect(plan).toMatchObject({
      status: 'blocked',
      block: { kind: 'dirty_checkout' },
    });
    expect(signatures(commands)).toEqual([
      'git status --porcelain --untracked-files=normal',
    ]);
  });

  test('blocks a diverged branch without resetting or rebasing it', async () => {
    const { commands, deps, installDir } = createDeps({ diverged: true });
    const plan = await planSelfUpdate({ installDir }, deps);

    expect(plan).toMatchObject({
      status: 'blocked',
      block: { kind: 'diverged_branch' },
    });
    expect(signatures(commands).join('\n')).not.toMatch(
      /reset|rebase|checkout|pull/,
    );
  });

  test('installs from an absent checkout and returns structured phases', async () => {
    const { commands, deps, installDir, mkdirs } = createDeps({
      existingCheckout: false,
    });
    const result = await runSelfUpdate({ installDir }, deps);

    expect(result).toMatchObject({
      status: 'installed',
      after: { commit: targetCommit },
      phases: [
        'preflight',
        'clone',
        'checkout',
        'verify_bundle',
        'install_global',
      ],
      steps: ['clone', 'checkout', 'pull', 'verify-bundle', 'install-global'],
    });
    expect(mkdirs).toEqual(['/tmp/cthutool/source']);
    expect(signatures(commands)).toContain(
      `npm install -g --ignore-scripts ${installDir}`,
    );
  });

  test('applies an available update in stable subprocess order', async () => {
    const { commands, deps, installDir } = createDeps();
    const result = await runSelfUpdate({ installDir }, deps);
    const all = signatures(commands);

    expect(result).toMatchObject({
      status: 'updated',
      before: { commit: currentCommit },
      after: { commit: targetCommit },
    });
    expect(
      all.indexOf('git status --porcelain --untracked-files=normal'),
    ).toBeLessThan(
      all.indexOf(`git remote set-url origin ${defaultSelfUpdateRepo}`),
    );
    expect(
      all.indexOf(`git remote set-url origin ${defaultSelfUpdateRepo}`),
    ).toBeLessThan(all.indexOf('git checkout main'));
    const npmInstall = all.indexOf(
      `npm install -g --ignore-scripts ${installDir}`,
    );
    expect(npmInstall).toBeGreaterThan(all.indexOf('git checkout main'));
    expect(npmInstall).toBeLessThan(
      all.lastIndexOf('git rev-parse --verify HEAD^{commit}'),
    );
  });

  test('skips checkout, bundle verification, and global install when current', async () => {
    const { commands, deps, installDir } = createDeps({
      targetCommit: currentCommit,
    });
    const result = await runSelfUpdate({ installDir }, deps);
    const all = signatures(commands).join('\n');

    expect(result).toMatchObject({ status: 'up_to_date', steps: [] });
    expect(all).not.toMatch(/remote set-url|checkout|npm install/);
  });

  test('rechecks safety and stops before mutation when the checkout changes', async () => {
    const { commands, deps, installDir } = createDeps({ dirtyOnRecheck: true });

    await expect(runSelfUpdate({ installDir }, deps)).rejects.toMatchObject({
      phase: 'preflight',
      summary: expect.stringContaining('changed after preflight'),
    });
    expect(signatures(commands).join('\n')).not.toMatch(
      /remote set-url|checkout|npm install/,
    );
  });

  test('reports bundle and subprocess failures with stable phases and bounded causes', async () => {
    const missing = createDeps({ bundlePresent: false });
    await expect(
      runSelfUpdate({ installDir: missing.installDir }, missing.deps),
    ).rejects.toMatchObject({ phase: 'verify_bundle' });
    expect(signatures(missing.commands).join('\n')).not.toContain(
      'npm install',
    );

    const failed = createDeps({
      failCommand: 'npm install',
      failOutput: Array.from(
        { length: 20 },
        (_, index) => `line ${index}`,
      ).join('\n'),
    });
    try {
      await runSelfUpdate({ installDir: failed.installDir }, failed.deps);
      throw new Error('expected update to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(SelfUpdateError);
      expect(error).toMatchObject({ phase: 'install_global' });
      expect((error as SelfUpdateError).causeText?.split('\n')).toHaveLength(8);
    }
  });

  test('reports installation status from an explicit checkout', async () => {
    const { deps, installDir } = createDeps();

    await expect(
      getCliInstallationStatus({ installDir }, deps),
    ).resolves.toMatchObject({
      version: '0.0.0',
      mode: 'local',
      installDir,
      repo: 'git@github.com:me/CthuTool.git',
      ref: 'main',
      commit: currentCommit.slice(0, 7),
      bundlePath: join(installDir, committedCliBundlePath),
      bundlePresent: true,
    });
  });

  test('reports remote mode for the default managed checkout', async () => {
    const { deps } = createDeps({ existingCheckout: false });
    const installDir = '/home/tester/.cthutool/source/CthuTool';

    await expect(
      getCliInstallationStatus({ installDir }, deps),
    ).resolves.toMatchObject({ mode: 'remote', installDir });
  });
});
