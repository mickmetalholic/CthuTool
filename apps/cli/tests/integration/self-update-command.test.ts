import { describe, expect, test } from 'bun:test';
import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSelfUpdateDeps,
  planSelfUpdate,
  runSelfUpdate,
  type SelfUpdateDeps,
} from '../../src/domain/self-update-manager';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scriptExecutable = Bun.which('script');

async function runProcess(command: string, args: string[], cwd: string) {
  const proc = Bun.spawn([command, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${err || out}`);
  }
  return out.trim();
}

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {},
) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, out, err };
}

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-update-'));
  const source = join(root, 'source');
  const installDir = join(root, 'managed', 'CthuTool');
  const fakeBin = join(root, 'bin');
  const npmLog = join(root, 'npm.log');
  const npmCache = join(root, 'npm-cache');
  await mkdir(join(source, 'apps/cli/dist'), { recursive: true });
  await mkdir(fakeBin, { recursive: true });
  await writeFile(
    join(source, 'package.json'),
    JSON.stringify({ name: 'cthutool', version: '0.0.0' }),
  );
  await writeFile(join(source, 'apps/cli/dist/index.js'), 'first bundle\n');
  const fakeNpm = join(
    fakeBin,
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
  );
  await writeFile(
    fakeNpm,
    process.platform === 'win32'
      ? '@echo off\r\n>> "%FAKE_NPM_LOG%" echo %*\r\nexit /b 0\r\n'
      : [
          '#!/bin/sh',
          'printf \'%s\\n\' "$*" >> "$' + '{FAKE_NPM_LOG:?}"',
          'exit 0',
          '',
        ].join('\n'),
  );
  if (process.platform !== 'win32') await chmod(fakeNpm, 0o755);

  await runProcess('git', ['init', '-b', 'main'], source);
  await runProcess('git', ['config', 'user.name', 'CthuTool Test'], source);
  await runProcess(
    'git',
    ['config', 'user.email', 'cthutool@example.invalid'],
    source,
  );
  await runProcess('git', ['add', '.'], source);
  await runProcess('git', ['commit', '-m', 'Initial CLI bundle'], source);

  const env = {
    PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ''}`,
    FAKE_NPM_LOG: npmLog,
    npm_config_prefix: join(root, 'npm-prefix'),
    npm_config_cache: npmCache,
  };
  const clone = async () => {
    await mkdir(dirname(installDir), { recursive: true });
    await runProcess('git', ['clone', source, installDir], root);
    await runProcess(
      'git',
      ['config', 'user.name', 'CthuTool Test'],
      installDir,
    );
    await runProcess(
      'git',
      ['config', 'user.email', 'cthutool@example.invalid'],
      installDir,
    );
  };
  const advanceSource = async (message: string) => {
    await writeFile(
      join(source, 'apps/cli/dist/index.js'),
      `${message} bundle\n`,
    );
    await runProcess('git', ['add', '.'], source);
    await runProcess('git', ['commit', '-m', message], source);
  };
  const npmInvocations = async () => {
    try {
      return (await readFile(npmLog, 'utf8'))
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
    } catch {
      try {
        return (await readdir(join(npmCache, '_logs'))).filter((name) =>
          name.endsWith('-debug-0.log'),
        );
      } catch {
        return [];
      }
    }
  };
  return {
    root,
    source,
    installDir,
    env,
    clone,
    advanceSource,
    npmInvocations,
    cleanup: () => rm(root, { force: true, recursive: true }),
  };
}

function updateArgs(
  fixture: {
    readonly source: string;
    readonly installDir: string;
  },
  route: readonly string[] = ['update'],
) {
  return [
    ...route,
    '--repo',
    fixture.source,
    '--ref',
    'main',
    '--install-dir',
    fixture.installDir,
  ];
}

function linkedLocalDeps(fixture: {
  readonly root: string;
  readonly installDir: string;
}): SelfUpdateDeps {
  const defaults = createSelfUpdateDeps();
  return {
    ...defaults,
    home: () => fixture.root,
    runtimeRoot: () => fixture.installDir,
    env: {
      ...defaults.env,
      CHC_INSTALL_DIR: undefined,
      CHC_REPO_URL: undefined,
      CHC_REPO: undefined,
      CHC_REF: undefined,
    },
    run: (command, args, options) => {
      if (command === 'npm') {
        throw new Error('A linked local update must not run npm.');
      }
      return defaults.run(command, args, options);
    },
  };
}

describe('self-update command', () => {
  test('checks and fast-forwards its linked local checkout while preserving unrelated untracked files', async () => {
    const fixture = await createFixture();
    try {
      await fixture.clone();
      const before = await runProcess(
        'git',
        ['rev-parse', 'HEAD'],
        fixture.installDir,
      );
      await fixture.advanceSource('Local source update');
      const localNote = join(fixture.installDir, 'local-note.txt');
      await writeFile(localNote, 'preserve me');
      const deps = linkedLocalDeps(fixture);

      const plan = await planSelfUpdate({}, deps);
      expect(plan).toMatchObject({
        status: 'update_available',
        installDir: fixture.installDir,
        before: { commit: before },
      });
      expect(
        await runProcess('git', ['rev-parse', 'HEAD'], fixture.installDir),
      ).toBe(before);

      const result = await runSelfUpdate({}, deps);
      expect(result).toMatchObject({
        status: 'updated',
        after: { commit: expect.any(String) },
      });
      expect(result.phases).not.toContain('install_global');
      expect(await readFile(localNote, 'utf8')).toBe('preserve me');
      expect(
        await runProcess('git', ['rev-parse', 'HEAD'], fixture.installDir),
      ).toBe(await runProcess('git', ['rev-parse', 'HEAD'], fixture.source));
      expect(await fixture.npmInvocations()).toEqual([]);
    } finally {
      await fixture.cleanup();
    }
  });

  test('does not overwrite an untracked path that collides with a local update', async () => {
    const fixture = await createFixture();
    try {
      await fixture.clone();
      const before = await runProcess(
        'git',
        ['rev-parse', 'HEAD'],
        fixture.installDir,
      );
      const collision = join(fixture.installDir, 'incoming.txt');
      await writeFile(collision, 'local copy');
      await writeFile(join(fixture.source, 'incoming.txt'), 'remote copy');
      await fixture.advanceSource('Add incoming file');

      await expect(
        runSelfUpdate({}, linkedLocalDeps(fixture)),
      ).rejects.toMatchObject({
        phase: 'checkout',
      });
      expect(await readFile(collision, 'utf8')).toBe('local copy');
      expect(
        await runProcess('git', ['rev-parse', 'HEAD'], fixture.installDir),
      ).toBe(before);
      expect(await fixture.npmInvocations()).toEqual([]);
    } finally {
      await fixture.cleanup();
    }
  });

  test('accepts environment source overrides as an explicit update target', async () => {
    const fixture = await createFixture();
    try {
      await fixture.clone();
      await fixture.advanceSource('Environment-selected update');

      const result = await runCli(['source', 'update', '--json'], {
        ...fixture.env,
        CHC_INSTALL_DIR: fixture.installDir,
        CHC_REPO_URL: fixture.source,
        CHC_REF: 'main',
      });

      expect(result.code).toBe(0);
      expect(JSON.parse(result.out)).toMatchObject({
        command: 'source update',
        result: {
          status: 'updated',
          installDir: fixture.installDir,
        },
      });
      expect(await fixture.npmInvocations()).toHaveLength(1);
    } finally {
      await fixture.cleanup();
    }
  });

  test('checks a missing installation without cloning or invoking npm', async () => {
    const fixture = await createFixture();
    try {
      for (const [route, command] of [
        [['source', 'update'], 'source update'],
        [['update'], 'update'],
      ] as const) {
        const result = await runCli(
          [...updateArgs(fixture, route), '--check', '--json'],
          fixture.env,
        );

        expect(result.code).toBe(0);
        expect(result.err).toBe('');
        expect(JSON.parse(result.out)).toMatchObject({
          ok: true,
          command,
          result: {
            status: 'install_required',
            phases: ['preflight'],
          },
        });
      }
      expect(await fixture.npmInvocations()).toEqual([]);
      expect(await Bun.file(join(fixture.installDir, '.git')).exists()).toBe(
        false,
      );
    } finally {
      await fixture.cleanup();
    }
  });

  test('installs a missing managed checkout with structured JSON output', async () => {
    const fixture = await createFixture();
    try {
      const result = await runCli(
        [...updateArgs(fixture, ['source', 'update']), '--json'],
        fixture.env,
      );

      expect(result.code).toBe(0);
      expect(result.err).toBe('');
      expect(JSON.parse(result.out)).toMatchObject({
        ok: true,
        command: 'source update',
        result: {
          status: 'installed',
          phases: expect.arrayContaining([
            'clone',
            'checkout',
            'verify_bundle',
            'install_global',
          ]),
        },
      });
      expect(await fixture.npmInvocations()).toHaveLength(1);
    } finally {
      await fixture.cleanup();
    }
  });

  test('applies an available update and relinks an explicitly selected current checkout', async () => {
    const fixture = await createFixture();
    try {
      await fixture.clone();
      await fixture.advanceSource('Friendlier update output');

      const updated = await runCli(
        [...updateArgs(fixture), '--json'],
        fixture.env,
      );
      expect(updated.code).toBe(0);
      expect(JSON.parse(updated.out)).toMatchObject({
        result: {
          status: 'updated',
          before: { commit: expect.any(String) },
          after: { commit: expect.any(String) },
          changes: { count: 1 },
        },
      });
      expect(await fixture.npmInvocations()).toHaveLength(1);
      expect(
        await runProcess('git', ['rev-parse', 'HEAD'], fixture.installDir),
      ).toBe(await runProcess('git', ['rev-parse', 'HEAD'], fixture.source));

      const current = await runCli(
        [...updateArgs(fixture), '--json'],
        fixture.env,
      );
      expect(current.code).toBe(0);
      expect(JSON.parse(current.out)).toMatchObject({
        result: { status: 'installed', steps: ['install-global'] },
      });
      expect(await fixture.npmInvocations()).toHaveLength(2);
    } finally {
      await fixture.cleanup();
    }
  });

  test('blocks dirty and diverged checkouts with actionable JSON errors', async () => {
    const dirty = await createFixture();
    try {
      await dirty.clone();
      await writeFile(join(dirty.installDir, 'local-change.txt'), 'keep me');
      const originalRemote = await runProcess(
        'git',
        ['remote', 'get-url', 'origin'],
        dirty.installDir,
      );
      const result = await runCli(
        [
          ...updateArgs(dirty, ['source', 'update']),
          '--repo',
          join(dirty.root, 'different-remote'),
          '--json',
        ],
        dirty.env,
      );

      expect(result.code).not.toBe(0);
      expect(JSON.parse(result.out)).toMatchObject({
        ok: false,
        error: {
          code: 'update_failed',
          phase: 'preflight',
          message: expect.stringContaining('Update blocked'),
          hint: expect.stringContaining('Commit, stash, or remove'),
        },
      });
      expect(
        await runProcess(
          'git',
          ['remote', 'get-url', 'origin'],
          dirty.installDir,
        ),
      ).toBe(originalRemote);
      expect(await dirty.npmInvocations()).toEqual([]);

      const human = await runCli([...updateArgs(dirty), '--quiet'], dirty.env);
      expect(human.code).not.toBe(0);
      expect(human.out).toBe('');
      expect(human.err).toContain('Update blocked');
      expect(human.err).toContain('Next: Commit, stash, or remove');
    } finally {
      await dirty.cleanup();
    }

    const diverged = await createFixture();
    try {
      await diverged.clone();
      await diverged.advanceSource('Remote update');
      await writeFile(
        join(diverged.installDir, 'apps/cli/dist/index.js'),
        'local update\n',
      );
      await runProcess('git', ['add', '.'], diverged.installDir);
      await runProcess(
        'git',
        ['commit', '-m', 'Independent local update'],
        diverged.installDir,
      );

      const result = await runCli(
        [...updateArgs(diverged), '--check', '--json'],
        diverged.env,
      );
      expect(result.code).not.toBe(0);
      expect(JSON.parse(result.out)).toMatchObject({
        error: {
          code: 'update_failed',
          message: expect.stringContaining('cannot fast-forward'),
        },
      });
      expect(await diverged.npmInvocations()).toEqual([]);
    } finally {
      await diverged.cleanup();
    }
  });

  test('renders stable non-TTY, quiet, and verbose check output', async () => {
    const fixture = await createFixture();
    try {
      await fixture.clone();
      const human = await runCli(
        [...updateArgs(fixture), '--check'],
        fixture.env,
      );
      expect(human.code).toBe(0);
      expect(human.out).toContain('Global relink required');
      expect(human.out).not.toContain('\u001b[');

      const quiet = await runCli(
        [...updateArgs(fixture), '--check', '--quiet'],
        fixture.env,
      );
      expect(quiet).toMatchObject({ code: 0, out: '', err: '' });

      const verbose = await runCli(
        [...updateArgs(fixture), '--check', '--json', '--verbose'],
        fixture.env,
      );
      expect(verbose.code).toBe(0);
      expect(JSON.parse(verbose.out)).toMatchObject({
        result: { status: 'up_to_date' },
      });
      expect(verbose.err).toContain('$ git');
    } finally {
      await fixture.cleanup();
    }
  });

  test.skipIf(process.platform !== 'darwin' || !scriptExecutable)(
    'renders active progress when the command owns a TTY',
    async () => {
      const fixture = await createFixture();
      try {
        await fixture.clone();
        const proc = Bun.spawn(
          [
            scriptExecutable ?? 'script',
            '-q',
            '/dev/null',
            'bun',
            'run',
            'src/index.ts',
            ...updateArgs(fixture),
            '--check',
          ],
          {
            cwd: cliRoot,
            env: { ...process.env, ...fixture.env },
            stdout: 'pipe',
            stderr: 'pipe',
            stdin: 'ignore',
          },
        );
        const out = await new Response(proc.stdout).text();
        const err = await new Response(proc.stderr).text();

        expect(await proc.exited).toBe(0);
        expect(err).toBe('');
        expect(out).toContain('Checking local update state complete');
        expect(out).toContain('Global relink required');
        expect(out).toContain('\u001b[?25l');
      } finally {
        await fixture.cleanup();
      }
    },
  );
});
