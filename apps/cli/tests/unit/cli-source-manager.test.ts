import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
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
  type CliSourceCandidate,
  type CliSourceCommandResult,
  CliSourceError,
  type CliSourceManagerDeps,
  createCliSourceManagerDeps,
  discoverCliSources,
  getCliManagedSourceState,
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

function requiredManagedCandidate(candidates: readonly CliSourceCandidate[]) {
  const candidate = candidates.find((item) => item.kind === 'managed');
  if (!candidate) throw new Error('Expected a managed source candidate.');
  return candidate;
}

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
      expect(
        getCliManagedSourceState(
          requiredManagedCandidate(inventory.candidates),
        ),
      ).toBe('absent');
    } finally {
      await fixture.cleanup();
    }
  });

  test('source discovery never creates or rewrites the registry', async () => {
    const fixture = await createFixture();
    const registryPath = getCliSourceRegistryPath(fixture.home);
    try {
      await discoverCliSources(fixture.deps());
      expect(existsSync(registryPath)).toBe(false);
      await registerCliSource(fixture.main, fixture.deps());
      const saved = await readFile(registryPath, 'utf8');
      await discoverCliSources(fixture.deps());
      expect(await readFile(registryPath, 'utf8')).toBe(saved);
    } finally {
      await fixture.cleanup();
    }
  });

  test.each([
    'dot',
    'main path',
    'worktree path',
    'worktree id',
  ])('automatically remembers the owning main checkout after selecting %s', async (selection) => {
    const fixture = await createFixture();
    const registryPath = getCliSourceRegistryPath(fixture.home);
    try {
      await fixture.cloneManaged();
      let installed = fixture.managed;
      const deps = fixture.deps({
        runtimeRoot: () => fixture.managed,
        cwd: () =>
          selection === 'dot' || selection === 'worktree id'
            ? fixture.linked
            : fixture.root,
        async relinkGlobal(target) {
          expect(existsSync(registryPath)).toBe(false);
          installed = target;
        },
        async resolveGlobalPackageTarget() {
          expect(existsSync(registryPath)).toBe(false);
          return installed;
        },
      });
      const selector =
        selection === 'dot'
          ? '.'
          : selection === 'main path'
            ? fixture.main
            : selection === 'worktree path'
              ? fixture.linked
              : createWorktreeSourceId(fixture.linked);
      const result = await switchCliSource(selector, deps);

      expect(result.status).toBe('switched');
      expect(installed).toBe(
        selection === 'main path' ? fixture.main : fixture.linked,
      );
      expect(JSON.parse(await readFile(registryPath, 'utf8'))).toEqual({
        version: 1,
        mainRoot: fixture.main,
        commonDir: join(fixture.main, '.git'),
      });
    } finally {
      await fixture.cleanup();
    }
  });

  test.each([
    'main',
    'worktree',
  ])('remembers an already-active %s selection without relinking', async (kind) => {
    const fixture = await createFixture();
    const active = kind === 'main' ? fixture.main : fixture.linked;
    try {
      const result = await switchCliSource(
        '.',
        fixture.deps({
          cwd: () => active,
          runtimeRoot: () => active,
          async relinkGlobal() {
            throw new Error('Already-active selection must not relink');
          },
        }),
      );
      expect(result.status).toBe('already_active');
      expect(
        JSON.parse(
          await readFile(getCliSourceRegistryPath(fixture.home), 'utf8'),
        ),
      ).toMatchObject({ mainRoot: fixture.main });
    } finally {
      await fixture.cleanup();
    }
  });

  test('can return to local from managed mode after leaving a linked worktree', async () => {
    const fixture = await createFixture();
    try {
      await fixture.cloneManaged();
      await switchCliSource(
        'remote',
        fixture.deps({ runtimeRoot: () => fixture.linked }),
      );
      const result = await switchCliSource(
        'local',
        fixture.deps({
          runtimeRoot: () => fixture.managed,
          cwd: () => fixture.root,
        }),
      );
      expect(result).toMatchObject({
        status: 'switched',
        previous: { kind: 'managed' },
        selected: { kind: 'main', path: fixture.main },
      });
    } finally {
      await fixture.cleanup();
    }
  });

  test.each([
    'local npm',
    'local verification',
    'remote npm',
    'remote verification',
    'bootstrap',
    'bootstrap verification',
    'busy',
    'validation',
  ])('preserves a previously saved development anchor on %s failure', async (failure) => {
    const fixture = await createFixture();
    const registryPath = getCliSourceRegistryPath(fixture.home);
    try {
      const savedCheckout = join(fixture.root, 'saved');
      await runGitChecked(fixture.root, ['clone', fixture.main, savedCheckout]);
      await registerCliSource(savedCheckout, fixture.deps());
      const saved = await readFile(registryPath, 'utf8');
      if (failure.startsWith('remote')) await fixture.cloneManaged();
      if (failure === 'validation') {
        await rm(join(fixture.linked, committedCliBundlePath));
      }
      let clock = 0;
      if (failure === 'busy') {
        await mkdir(getCliSourceSwitchLockPath(fixture.home), {
          recursive: true,
        });
      }
      const deps = fixture.deps({
        async relinkGlobal() {
          if (failure.endsWith('npm')) throw new Error('npm failed');
        },
        async resolveGlobalPackageTarget() {
          return fixture.main;
        },
        async bootstrapManaged() {
          if (failure === 'bootstrap') throw new Error('network failed');
          await fixture.cloneManaged();
        },
        now: () => clock,
        async sleep(milliseconds) {
          clock += milliseconds;
        },
      });
      await expect(
        switchCliSource(
          failure.startsWith('remote') ||
            failure.startsWith('bootstrap') ||
            failure === 'busy'
            ? 'remote'
            : fixture.linked,
          deps,
        ),
      ).rejects.toBeInstanceOf(CliSourceError);
      expect(await readFile(registryPath, 'utf8')).toBe(saved);
    } finally {
      await fixture.cleanup();
    }
  });

  test('classifies managed paths without parsing human failure reasons', async () => {
    const fixture = await createFixture();
    const inspect = async () => {
      const inventory = await discoverCliSources(fixture.deps());
      return requiredManagedCandidate(inventory.candidates);
    };
    try {
      expect(getCliManagedSourceState(await inspect())).toBe('absent');

      await mkdir(fixture.managed, { recursive: true });
      expect(getCliManagedSourceState(await inspect())).toBe('invalid');

      await rm(fixture.managed, { recursive: true });
      await fixture.cloneManaged();
      expect(getCliManagedSourceState(await inspect())).toBe('ready');

      await rm(join(fixture.managed, committedCliBundlePath));
      expect(getCliManagedSourceState(await inspect())).toBe('invalid');
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
      expect(inventory.warnings.join('\n')).toContain('chc source use <path>');
      expect(inventory.warnings.join('\n')).not.toContain('source register');
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
        switchCliSource(createWorktreeSourceId(fixture.linked), deps),
      ).rejects.toMatchObject({ code: 'source_unavailable' });
      expect(relinked).toBe(false);
      expect(existsSync(getCliSourceRegistryPath(fixture.home))).toBe(false);
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

      const result = await switchCliSource('remote', deps);

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

  test('fails closed for an existing invalid managed path', async () => {
    const fixture = await createFixture();
    const gitCalls: string[] = [];
    let bootstrapped = false;
    let relinked = false;
    try {
      await mkdir(fixture.managed, { recursive: true });
      await writeFile(join(fixture.managed, 'keep.txt'), 'keep\n');
      const deps = fixture.deps({
        async runGit(cwd, args) {
          gitCalls.push(args.join(' '));
          return runGit(cwd, args);
        },
        async bootstrapManaged() {
          bootstrapped = true;
        },
        async relinkGlobal() {
          relinked = true;
        },
      });

      await expect(switchCliSource('remote', deps)).rejects.toMatchObject({
        code: 'source_unavailable',
      });
      expect(bootstrapped).toBe(false);
      expect(relinked).toBe(false);
      expect(existsSync(getCliSourceRegistryPath(fixture.home))).toBe(false);
      expect(await readFile(join(fixture.managed, 'keep.txt'), 'utf8')).toBe(
        'keep\n',
      );
      expect(
        gitCalls.some((call) =>
          /fetch|checkout|pull|merge|reset|stash|clean/.test(call),
        ),
      ).toBe(false);
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
          expect(existsSync(getCliSourceSwitchLockPath(fixture.home))).toBe(
            true,
          );
          await mkdir(dirname(target), { recursive: true });
          await runGitChecked(fixture.root, ['clone', fixture.main, target]);
          installed = target;
        },
        async resolveGlobalPackageTarget() {
          return installed;
        },
      });

      const result = await switchCliSource('remote', deps);

      expect(result).toMatchObject({
        status: 'bootstrapped',
        selected: { kind: 'managed', available: true },
      });
      expect(installed).toBe(fixture.managed);
      expect(
        JSON.parse(
          await readFile(getCliSourceRegistryPath(fixture.home), 'utf8'),
        ),
      ).toMatchObject({ mainRoot: fixture.main });
    } finally {
      await fixture.cleanup();
    }
  });

  test('keeps the prior global source active when automatic provisioning fails', async () => {
    const fixture = await createFixture();
    let relinked = false;
    try {
      const deps = fixture.deps({
        async bootstrapManaged() {
          throw new Error('network unavailable');
        },
        async relinkGlobal() {
          relinked = true;
        },
      });

      await expect(switchCliSource('remote', deps)).rejects.toMatchObject({
        code: 'source_switch_failed',
        causeText: 'network unavailable',
      });
      expect(relinked).toBe(false);
      expect((await discoverCliSources(deps)).active.path).toBe(fixture.main);
      expect(existsSync(getCliSourceRegistryPath(fixture.home))).toBe(false);
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
        switchCliSource(createWorktreeSourceId(fixture.linked), deps),
      ).rejects.toMatchObject({ code: 'source_busy' });
      expect(existsSync(getCliSourceRegistryPath(fixture.home))).toBe(false);
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
        switchCliSource(createWorktreeSourceId(fixture.linked), deps),
      ).rejects.toBeInstanceOf(CliSourceError);
      await expect(
        switchCliSource(createWorktreeSourceId(fixture.linked), deps),
      ).rejects.toMatchObject({ code: 'source_switch_failed' });
      expect(existsSync(getCliSourceRegistryPath(fixture.home))).toBe(false);
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
        switchCliSource(createWorktreeSourceId(fixture.linked), deps),
      ).rejects.toMatchObject({
        code: 'source_switch_failed',
        causeText: 'npm permission denied',
      });
      expect(existsSync(getCliSourceRegistryPath(fixture.home))).toBe(false);
    } finally {
      await fixture.cleanup();
    }
  });
});
