import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import {
  committedCliBundlePath,
  defaultSelfUpdateRepo,
  getCliInstallationStatus,
  planSelfUpdate,
  resolveSelfUpdateSource,
  runSelfUpdate,
  type SelfUpdateCommandResult,
  type SelfUpdateDeps,
  SelfUpdateError,
  type SelfUpdateEvent,
} from '../../src/domain/self-update-manager';

const currentCommit = '1111111111111111111111111111111111111111';
const targetCommit = '2222222222222222222222222222222222222222';
const currentCommitTime = '2026-09-01T12:08:45+08:00';
const currentCommitMessage = 'feat(cli): modernize status output';

type FakeOptions = {
  readonly installDir?: string;
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
  readonly runtimeRoot?: string;
  readonly home?: string;
  readonly repo?: string;
  readonly ref?: string;
  readonly exactTags?: readonly string[];
  readonly targetBundlePresent?: boolean;
  readonly env?: Record<string, string | undefined>;
  readonly advanceTargetOnApply?: string;
  readonly commitMetadata?: string | null;
};

function createDeps(options: FakeOptions = {}) {
  const commands: Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly cwd?: string;
  }> = [];
  const events: SelfUpdateEvent[] = [];
  const mkdirs: string[] = [];
  const installDir = options.installDir ?? '/tmp/cthutool/source/CthuTool';
  const runtimeRoot = options.runtimeRoot ?? '/tmp/runtime/CthuTool';
  let checkoutExists = options.existingCheckout ?? true;
  let head = options.currentCommit ?? currentCommit;
  let ref = 'main';
  let statusCalls = 0;
  let remoteTarget = options.targetCommit ?? targetCommit;
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
      } else if (command === 'git' && args[0] === 'cat-file') {
        code = options.targetBundlePresent === false ? 1 : 0;
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
        stdout = `${remoteTarget}\n`;
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
          stdout = `${remoteTarget}\trefs/heads/main\n`;
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
      } else if (command === 'git' && args[0] === 'show') {
        if (options.commitMetadata === null) {
          code = 1;
        } else {
          stdout = `${options.commitMetadata ?? `${currentCommitTime}\0${currentCommitMessage}`}\n`;
        }
      } else if (command === 'git' && args[0] === 'clone') {
        checkoutExists = true;
        head = remoteTarget;
      } else if (
        command === 'git' &&
        args[0] === 'fetch' &&
        args[1] === '--tags' &&
        options.advanceTargetOnApply
      ) {
        remoteTarget = options.advanceTargetOnApply;
      } else if (command === 'git' && args[0] === 'checkout') {
        if (args[1] === '--detach') {
          ref = 'HEAD';
          head = args[2] ?? head;
        } else {
          ref = args[1] ?? ref;
        }
      } else if (command === 'git' && args[0] === 'merge') {
        head = args[2] ?? head;
      } else if (command === 'git' && args[0] === 'pull') {
        head = remoteTarget;
      } else if (
        command === 'git' &&
        args[0] === 'rev-parse' &&
        args[1] === '--verify' &&
        String(args[2]).startsWith('origin/')
      ) {
        code = targetKind === 'branch' ? 0 : 1;
        stdout = code === 0 ? `${remoteTarget}\n` : '';
      } else if (
        command === 'git' &&
        args[0] === 'remote' &&
        args[1] === 'get-url'
      ) {
        stdout = `${options.repo ?? defaultSelfUpdateRepo}\n`;
      } else if (command === 'git' && args[0] === 'tag') {
        stdout = `${(options.exactTags ?? []).join('\n')}\n`;
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
    env: options.env ?? {},
    home: () => options.home ?? '/home/tester',
    runtimeRoot: () => runtimeRoot,
    onEvent: (event) => events.push(event),
  };

  return { commands, deps, events, installDir, mkdirs, runtimeRoot };
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

  test('resolves the running managed checkout and its installed origin and branch by default', async () => {
    const installDir = '/home/tester/.cthutool/source/CthuTool';
    const repo = 'https://example.invalid/fork/CthuTool.git';
    const { deps } = createDeps({ installDir, runtimeRoot: installDir, repo });

    await expect(resolveSelfUpdateSource({}, deps)).resolves.toMatchObject({
      installDir,
      runtimeRoot: installDir,
      explicitInstallDir: false,
      mode: 'remote',
      repo,
      ref: 'main',
    });
  });

  test('preserves deterministic exact tags and detached commits', async () => {
    const installDir = '/home/tester/.cthutool/source/CthuTool';
    const tagged = createDeps({
      installDir,
      runtimeRoot: installDir,
      targetKind: 'tag',
      exactTags: ['v2.0.0', 'v1.0.0'],
    });
    await expect(
      resolveSelfUpdateSource({}, tagged.deps),
    ).resolves.toMatchObject({ ref: 'v1.0.0' });

    const detached = createDeps({
      installDir,
      runtimeRoot: installDir,
      targetKind: 'tag',
    });
    await expect(
      resolveSelfUpdateSource({}, detached.deps),
    ).resolves.toMatchObject({ ref: currentCommit });
  });

  test('applies explicit directory, repository, and ref precedence', async () => {
    const { deps, installDir } = createDeps({
      env: {
        CHC_INSTALL_DIR: '/env/CthuTool',
        CHC_REPO_URL: 'https://example.invalid/env.git',
        CHC_REF: 'env-ref',
      },
    });

    await expect(
      resolveSelfUpdateSource(
        {
          installDir,
          repo: 'https://example.invalid/cli.git',
          ref: 'cli-ref',
        },
        deps,
      ),
    ).resolves.toMatchObject({
      installDir,
      repo: 'https://example.invalid/cli.git',
      ref: 'cli-ref',
      explicitInstallDir: true,
    });
  });

  test('uses official defaults for an explicitly selected absent checkout', async () => {
    const { deps, installDir } = createDeps({ existingCheckout: false });

    await expect(
      resolveSelfUpdateSource({ installDir }, deps),
    ).resolves.toMatchObject({
      installDir,
      repo: defaultSelfUpdateRepo,
      ref: 'main',
      explicitInstallDir: true,
    });
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

  test('blocks a default local-linked source before remote or mutating commands', async () => {
    const installDir = '/worktrees/local/CthuTool';
    const { commands, deps } = createDeps({
      installDir,
      runtimeRoot: installDir,
    });

    const plan = await planSelfUpdate({}, deps);

    expect(plan).toMatchObject({
      status: 'blocked',
      installDir,
      block: {
        kind: 'local_linked_source',
        message: expect.stringContaining(installDir),
        hint: expect.stringContaining('CHC_INSTALL_MODE=remote'),
      },
    });
    expect(signatures(commands).join('\n')).not.toMatch(
      /fetch|checkout|merge|pull|npm/,
    );
  });

  test('allows an explicit local install directory to use the updater', async () => {
    const installDir = '/worktrees/local/CthuTool';
    const { deps } = createDeps({ installDir, runtimeRoot: installDir });

    await expect(planSelfUpdate({ installDir }, deps)).resolves.toMatchObject({
      status: 'update_available',
      installDir,
    });
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
        repo: 'https://update-user:super@secret@example.invalid/repo.git',
      },
      deps,
    );

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('super@secret');
    expect(serialized).toContain('https://***@example.invalid/repo.git');
  });

  test('redacts repository credentials from command failures and event output', async () => {
    const secret = 'super-secret';
    const repo = `https://update-user:${secret}@example.invalid/repo.git`;
    const { deps, events, installDir } = createDeps({
      failCommand: 'git fetch',
      failOutput: `fatal: unable to access '${repo}'`,
    });

    let caught: unknown;
    try {
      await planSelfUpdate({ installDir, repo }, deps);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(SelfUpdateError);
    expect(JSON.stringify(caught)).not.toContain(secret);
    expect((caught as Error).message).not.toContain(secret);
    expect(JSON.stringify(events)).not.toContain(secret);
    expect((caught as Error).message).toContain('https://***@example.invalid');
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
    const all = signatures(commands);
    expect(all.at(-1)).toBe('git status --porcelain --untracked-files=normal');
    expect(all.join('\n')).not.toMatch(/fetch|checkout|merge|pull|npm/);
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

  test('blocks a target without the committed bundle before checkout', async () => {
    const { commands, deps, installDir } = createDeps({
      targetBundlePresent: false,
    });

    const plan = await planSelfUpdate({ installDir }, deps);

    expect(plan).toMatchObject({
      status: 'blocked',
      block: { kind: 'missing_target_bundle' },
    });
    expect(signatures(commands).join('\n')).not.toMatch(
      /remote set-url|checkout|merge|npm install/,
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
    expect(all).toContain(`git merge --ff-only ${targetCommit}`);
    expect(all).not.toContain('git pull --ff-only origin main');
    const npmInstall = all.indexOf(
      `npm install -g --ignore-scripts ${installDir}`,
    );
    expect(npmInstall).toBeGreaterThan(all.indexOf('git checkout main'));
    expect(npmInstall).toBeLessThan(
      all.lastIndexOf('git rev-parse --verify HEAD^{commit}'),
    );
  });

  test('applies the planned commit when the remote advances during apply', async () => {
    const laterCommit = '3333333333333333333333333333333333333333';
    const { commands, deps, installDir } = createDeps({
      advanceTargetOnApply: laterCommit,
    });

    const result = await runSelfUpdate({ installDir }, deps);

    expect(result).toMatchObject({
      status: 'updated',
      target: { commit: targetCommit },
      after: { commit: targetCommit },
    });
    expect(signatures(commands)).toContain(
      `git merge --ff-only ${targetCommit}`,
    );
    expect(signatures(commands)).not.toContain(
      `git merge --ff-only ${laterCommit}`,
    );
  });

  test('skips checkout, bundle verification, and global install when current', async () => {
    const installDir = '/tmp/cthutool/source/CthuTool';
    const { commands, deps } = createDeps({
      installDir,
      runtimeRoot: installDir,
      targetCommit: currentCommit,
    });
    const result = await runSelfUpdate({ installDir }, deps);
    const all = signatures(commands).join('\n');

    expect(result).toMatchObject({ status: 'up_to_date', steps: [] });
    expect(all).not.toMatch(/remote set-url|checkout|npm install/);
  });

  test('relinks an explicitly selected current checkout when it differs from the runtime source', async () => {
    const { commands, deps, installDir } = createDeps({
      targetCommit: currentCommit,
    });

    const result = await runSelfUpdate({ installDir }, deps);

    expect(result).toMatchObject({
      status: 'installed',
      steps: ['install-global'],
      before: { commit: currentCommit },
      after: { commit: currentCommit },
    });
    expect(signatures(commands)).toContain(
      `npm install -g --ignore-scripts ${installDir}`,
    );
    expect(signatures(commands).join('\n')).not.toMatch(/checkout|merge|pull/);
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
    const repo = 'git@github.com:me/CthuTool.git';
    const { deps, installDir } = createDeps({ repo });

    await expect(
      getCliInstallationStatus({ installDir }, deps),
    ).resolves.toMatchObject({
      version: '0.0.0',
      mode: 'local',
      installDir,
      repo,
      ref: 'main',
      commit: currentCommit.slice(0, 7),
      commitTime: currentCommitTime,
      commitMessage: currentCommitMessage,
      bundlePath: join(installDir, committedCliBundlePath),
      bundlePresent: true,
    });
  });

  test('bounds and sanitizes malformed local commit metadata', async () => {
    const unsafeMessage = `  feat(cli): alert\u0007  ${'x'.repeat(140)}  `;
    const { deps, installDir } = createDeps({
      commitMetadata: `not-an-iso-date\0${unsafeMessage}`,
    });

    const status = await getCliInstallationStatus({ installDir }, deps);

    expect(status.commitTime).toBeUndefined();
    expect(status.commitMessage).not.toContain('\u0007');
    expect(status.commitMessage).not.toMatch(/\s{2,}/);
    expect(Array.from(status.commitMessage ?? '')).toHaveLength(120);
    expect(status.commitMessage).toEndWith('…');
  });

  test('keeps local status successful when commit metadata is unavailable', async () => {
    const { commands, deps, installDir } = createDeps({
      commitMetadata: null,
    });

    const status = await getCliInstallationStatus({ installDir }, deps);

    expect(status).toMatchObject({
      mode: 'local',
      commit: currentCommit.slice(0, 7),
    });
    expect(status.commitTime).toBeUndefined();
    expect(status.commitMessage).toBeUndefined();
    expect(signatures(commands)).toContain(
      'git show -s --format=%cI%x00%s HEAD',
    );
  });

  test('reports remote mode for the default managed checkout', async () => {
    const installDir = '/home/tester/.cthutool/source/CthuTool';
    const { commands, deps } = createDeps({ installDir });

    const status = await getCliInstallationStatus({ installDir }, deps);

    expect(status).toMatchObject({ mode: 'remote', installDir });
    expect(status.commitTime).toBeUndefined();
    expect(status.commitMessage).toBeUndefined();
    expect(signatures(commands).join('\n')).not.toContain('git show');
  });
});
