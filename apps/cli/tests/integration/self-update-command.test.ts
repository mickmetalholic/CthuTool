import { describe, expect, test } from 'bun:test';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  await mkdir(join(source, 'apps/cli/dist'), { recursive: true });
  await mkdir(fakeBin, { recursive: true });
  await writeFile(
    join(source, 'package.json'),
    JSON.stringify({ name: 'cthutool', version: '0.0.0' }),
  );
  await writeFile(join(source, 'apps/cli/dist/index.js'), 'first bundle\n');
  const fakeNpm = join(fakeBin, 'npm');
  await writeFile(
    fakeNpm,
    [
      '#!/bin/sh',
      'printf \'%s\\n\' "$*" >> "$' + '{FAKE_NPM_LOG:?}"',
      'exit 0',
      '',
    ].join('\n'),
  );
  await chmod(fakeNpm, 0o755);

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
    PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
    FAKE_NPM_LOG: npmLog,
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
      return [];
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

function updateArgs(fixture: {
  readonly source: string;
  readonly installDir: string;
}) {
  return [
    'update',
    '--repo',
    fixture.source,
    '--ref',
    'main',
    '--install-dir',
    fixture.installDir,
  ];
}

describe('self-update command', () => {
  test('checks a missing installation without cloning or invoking npm', async () => {
    const fixture = await createFixture();
    try {
      const result = await runCli(
        [...updateArgs(fixture), '--check', '--json'],
        fixture.env,
      );

      expect(result.code).toBe(0);
      expect(result.err).toBe('');
      expect(JSON.parse(result.out)).toMatchObject({
        ok: true,
        command: 'update',
        result: {
          status: 'install_required',
          phases: ['preflight'],
        },
      });
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
        [...updateArgs(fixture), '--json'],
        fixture.env,
      );

      expect(result.code).toBe(0);
      expect(result.err).toBe('');
      expect(JSON.parse(result.out)).toMatchObject({
        ok: true,
        command: 'update',
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

  test('applies an available update and skips a subsequent no-op reinstall', async () => {
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
        result: { status: 'up_to_date', steps: [] },
      });
      expect(await fixture.npmInvocations()).toHaveLength(1);
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
          ...updateArgs(dirty),
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
      expect(human.out).toContain('chc is already up to date');
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
        expect(out).toContain('chc is already up to date');
        expect(out).toContain('\u001b[?25l');
      } finally {
        await fixture.cleanup();
      }
    },
  );
});
