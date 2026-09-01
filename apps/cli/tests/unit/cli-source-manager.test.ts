import { describe, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createWorktreeSourceId } from '../../src/domain/cli-source-id';
import {
  type CliSourceCommandResult,
  CliSourceError,
  type CliSourceManagerDeps,
  createCliSourceManagerDeps,
  discoverCliSources,
  getCliSourceRegistryPath,
  getCliSourceSwitchLockPath,
  parseGitWorktreeList,
  registerCliSource,
  switchCliSource,
} from '../../src/domain/cli-source-manager';
import { committedCliBundlePath } from '../../src/domain/self-update-manager';

async function runProcess(
  command: string,
  args: readonly string[],
  cwd?: string,
): Promise<CliSourceCommandResult> {
  const proc = Bun.spawn([command, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, stdout, stderr };
}

async function runGit(cwd: string, args: readonly string[]) {
  return runProcess('git', ['-C', cwd, ...args]);
}

async function runGitChecked(cwd: string, args: readonly string[]) {
  const result = await runGit(cwd, args);
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

type SourceFixture = {
  readonly root: string;
  readonly home: string;
  readonly main: string;
  readonly linked: string;
  readonly managed: string;
  readonly deps: (
    overrides?: Partial<CliSourceManagerDeps>,
  ) => CliSourceManagerDeps;
  readonly cloneManaged: () => Promise<void>;
  readonly cleanup: () => Promise<void>;
};

async function createFixture(): Promise<SourceFixture> {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'cthutool-source-')),
  );
  const home = join(root, 'home');
  const main = join(root, 'main');
  const linked = join(root, 'linked');
  const managed = join(home, '.cthutool', 'source', 'CthuTool');
  await mkdir(join(main, dirname(committedCliBundlePath)), {
    recursive: true,
  });
  await writeFile(
    join(main, 'package.json'),
    `${JSON.stringify({ name: 'cthutool', version: '0.0.0' })}\n`,
  );
  await writeFile(join(main, committedCliBundlePath), 'bundle\n');
  await runGitChecked(root, ['init', '-b', 'main', main]);
  await runGitChecked(main, ['config', 'user.name', 'CthuTool Test']);
  await runGitChecked(main, [
    'config',
    'user.email',
    'cthutool@example.invalid',
  ]);
  await runGitChecked(main, ['add', '.']);
  await runGitChecked(main, ['commit', '-m', 'Initial CLI bundle']);
  await runGitChecked(main, ['worktree', 'add', '--detach', linked]);

  let installedTarget = main;
  const deps = (
    overrides: Partial<CliSourceManagerDeps> = {},
  ): CliSourceManagerDeps =>
    createCliSourceManagerDeps({
      home: () => home,
      cwd: () => main,
      runtimeRoot: () => main,
      runGit,
      async relinkGlobal(target) {
        installedTarget = target;
      },
      async resolveGlobalPackageTarget() {
        return installedTarget;
      },
      async bootstrapManaged() {
        throw new Error('unexpected bootstrap');
      },
      ...overrides,
    });

  return {
    root,
    home,
    main,
    linked,
    managed,
    deps,
    async cloneManaged() {
      await mkdir(dirname(managed), { recursive: true });
      await runGitChecked(root, ['clone', main, managed]);
    },
    cleanup: () => rm(root, { force: true, recursive: true }),
  };
}

describe('CLI source manager', () => {
  test('parses branch, detached, locked, and prunable worktree records', () => {
    expect(
      parseGitWorktreeList(
        [
          'worktree /repo/main',
          'HEAD 1111111111111111111111111111111111111111',
          'branch refs/heads/main',
          '',
          'worktree /repo/linked with spaces',
          'HEAD 2222222222222222222222222222222222222222',
          'detached',
          'locked reason',
          'prunable reason',
          '',
        ].join('\n'),
      ),
    ).toEqual([
      {
        path: '/repo/main',
        head: '1111111111111111111111111111111111111111',
        branch: 'main',
        detached: false,
        locked: false,
        prunable: false,
      },
      {
        path: '/repo/linked with spaces',
        head: '2222222222222222222222222222222222222222',
        branch: undefined,
        detached: true,
        locked: true,
        prunable: true,
      },
    ]);
  });

  test('discovers main, linked worktree, and missing managed source', async () => {
    const fixture = await createFixture();
    try {
      const inventory = await discoverCliSources(
        fixture.deps({ runtimeRoot: () => fixture.linked }),
      );

      expect(inventory.active).toMatchObject({
        id: createWorktreeSourceId(fixture.linked),
        kind: 'worktree',
        mode: 'local',
        active: true,
        available: true,
        detached: true,
      });
      expect(inventory.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'local', kind: 'main' }),
          expect.objectContaining({
            id: createWorktreeSourceId(fixture.linked),
            kind: 'worktree',
          }),
          expect.objectContaining({
            id: 'remote',
            kind: 'managed',
            available: false,
          }),
        ]),
      );
    } finally {
      await fixture.cleanup();
    }
  });

  test('uses a registered main checkout to discover worktrees from managed mode', async () => {
    const fixture = await createFixture();
    try {
      await fixture.cloneManaged();
      await registerCliSource(fixture.linked, fixture.deps());
      const inventory = await discoverCliSources(
        fixture.deps({
          cwd: () => fixture.root,
          runtimeRoot: () => fixture.managed,
        }),
      );

      expect(inventory.active).toMatchObject({
        id: 'remote',
        kind: 'managed',
      });
      expect(inventory.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'local', path: fixture.main }),
          expect.objectContaining({
            id: createWorktreeSourceId(fixture.linked),
          }),
        ]),
      );
      expect(
        JSON.parse(
          await readFile(getCliSourceRegistryPath(fixture.home), 'utf8'),
        ),
      ).toMatchObject({
        version: 1,
        mainRoot: fixture.main,
      });
    } finally {
      await fixture.cleanup();
    }
  });

  test('reports a stale registered development checkout without scanning', async () => {
    const fixture = await createFixture();
    try {
      await fixture.cloneManaged();
      await registerCliSource(fixture.main, fixture.deps());
      await writeFile(
        getCliSourceRegistryPath(fixture.home),
        `${JSON.stringify({
          version: 1,
          mainRoot: join(fixture.root, 'missing'),
          commonDir: join(fixture.root, 'missing', '.git'),
        })}\n`,
      );

      const inventory = await discoverCliSources(
        fixture.deps({
          cwd: () => fixture.root,
          runtimeRoot: () => fixture.managed,
        }),
      );

      expect(inventory.candidates).toContainEqual(
        expect.objectContaining({
          id: 'local',
          available: false,
          path: join(fixture.root, 'missing'),
        }),
      );
      expect(inventory.warnings.join('\n')).toContain(
        'Registered development checkout is unavailable',
      );
    } finally {
      await fixture.cleanup();
    }
  });

  test('switches to a dirty linked worktree without running a Git mutation', async () => {
    const fixture = await createFixture();
    const gitCalls: string[] = [];
    let relinked: string | undefined;
    try {
      await writeFile(join(fixture.linked, 'dirty.txt'), 'dirty\n');
      const deps = fixture.deps({
        async runGit(cwd, args) {
          gitCalls.push(args.join(' '));
          return runGit(cwd, args);
        },
        async relinkGlobal(target) {
          relinked = target;
        },
        async resolveGlobalPackageTarget() {
          return relinked;
        },
      });

      const result = await switchCliSource(
        createWorktreeSourceId(fixture.linked),
        {},
        deps,
      );

      expect(result).toMatchObject({
        status: 'switched',
        selected: { kind: 'worktree', dirty: true },
      });
      expect(relinked).toBe(fixture.linked);
      expect(
        gitCalls.some((call) =>
          /fetch|checkout|pull|merge|reset|stash/.test(call),
        ),
      ).toBe(false);
      expect(
        await runGitChecked(fixture.linked, ['status', '--porcelain']),
      ).toContain('dirty.txt');
    } finally {
      await fixture.cleanup();
    }
  });

  test('blocks a worktree with a missing bundle before relinking', async () => {
    const fixture = await createFixture();
    let relinked = false;
    try {
      await rm(join(fixture.linked, committedCliBundlePath));
      const deps = fixture.deps({
        async relinkGlobal() {
          relinked = true;
        },
      });

      await expect(
        switchCliSource(createWorktreeSourceId(fixture.linked), {}, deps),
      ).rejects.toMatchObject({ code: 'source_unavailable' });
      expect(relinked).toBe(false);
    } finally {
      await fixture.cleanup();
    }
  });

  test('relinks an existing dirty managed checkout without bootstrapping it', async () => {
    const fixture = await createFixture();
    let relinked: string | undefined;
    let bootstrapped = false;
    try {
      await fixture.cloneManaged();
      await writeFile(join(fixture.managed, 'managed-dirty.txt'), 'dirty\n');
      const deps = fixture.deps({
        async relinkGlobal(target) {
          relinked = target;
        },
        async resolveGlobalPackageTarget() {
          return relinked;
        },
        async bootstrapManaged() {
          bootstrapped = true;
        },
      });

      const result = await switchCliSource('remote', {}, deps);

      expect(result).toMatchObject({
        status: 'switched',
        selected: { kind: 'managed', dirty: true },
      });
      expect(relinked).toBe(fixture.managed);
      expect(bootstrapped).toBe(false);
    } finally {
      await fixture.cleanup();
    }
  });

  test('requires explicit bootstrap for a missing managed source', async () => {
    const fixture = await createFixture();
    try {
      await expect(
        switchCliSource('remote', {}, fixture.deps()),
      ).rejects.toMatchObject({ code: 'source_unavailable' });
    } finally {
      await fixture.cleanup();
    }
  });

  test('rejects registering the managed checkout as the development source', async () => {
    const fixture = await createFixture();
    try {
      await fixture.cloneManaged();

      await expect(
        registerCliSource(fixture.managed, fixture.deps()),
      ).rejects.toMatchObject({ code: 'source_invalid' });
    } finally {
      await fixture.cleanup();
    }
  });

  test('rejects a Git checkout whose root package is not CthuTool', async () => {
    const fixture = await createFixture();
    const other = join(fixture.root, 'other');
    try {
      await mkdir(other);
      await writeFile(
        join(other, 'package.json'),
        `${JSON.stringify({ name: 'another-package' })}\n`,
      );
      await runGitChecked(fixture.root, ['init', '-b', 'main', other]);

      await expect(
        registerCliSource(other, fixture.deps()),
      ).rejects.toMatchObject({ code: 'source_invalid' });
    } finally {
      await fixture.cleanup();
    }
  });

  test('bootstraps a missing managed source under the switch lock', async () => {
    const fixture = await createFixture();
    let installed: string | undefined;
    try {
      const deps = fixture.deps({
        async bootstrapManaged(target) {
          await mkdir(dirname(target), { recursive: true });
          await runGitChecked(fixture.root, ['clone', fixture.main, target]);
          installed = target;
        },
        async resolveGlobalPackageTarget() {
          return installed;
        },
      });

      const result = await switchCliSource('remote', { bootstrap: true }, deps);

      expect(result).toMatchObject({
        status: 'bootstrapped',
        selected: { kind: 'managed', available: true },
      });
      expect(installed).toBe(fixture.managed);
    } finally {
      await fixture.cleanup();
    }
  });

  test('fails with source_busy when another switch owns the lock', async () => {
    const fixture = await createFixture();
    let clock = 0;
    try {
      await mkdir(getCliSourceSwitchLockPath(fixture.home), {
        recursive: true,
      });
      const deps = fixture.deps({
        now: () => clock,
        async sleep(milliseconds) {
          clock += milliseconds;
        },
      });

      await expect(
        switchCliSource(createWorktreeSourceId(fixture.linked), {}, deps),
      ).rejects.toMatchObject({ code: 'source_busy' });
    } finally {
      await fixture.cleanup();
    }
  });

  test('fails when npm postcondition does not point at the selected source', async () => {
    const fixture = await createFixture();
    try {
      const deps = fixture.deps({
        async resolveGlobalPackageTarget() {
          return fixture.main;
        },
      });

      await expect(
        switchCliSource(createWorktreeSourceId(fixture.linked), {}, deps),
      ).rejects.toBeInstanceOf(CliSourceError);
      await expect(
        switchCliSource(createWorktreeSourceId(fixture.linked), {}, deps),
      ).rejects.toMatchObject({ code: 'source_switch_failed' });
    } finally {
      await fixture.cleanup();
    }
  });

  test('reports a bounded source switch failure when npm relinking fails', async () => {
    const fixture = await createFixture();
    try {
      const deps = fixture.deps({
        async relinkGlobal() {
          throw new Error('npm permission denied');
        },
      });

      await expect(
        switchCliSource(createWorktreeSourceId(fixture.linked), {}, deps),
      ).rejects.toMatchObject({
        code: 'source_switch_failed',
        causeText: 'npm permission denied',
      });
    } finally {
      await fixture.cleanup();
    }
  });
});
