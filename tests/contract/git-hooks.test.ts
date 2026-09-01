import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(__dirname, '..', '..');
const installerPath = join(root, 'scripts', 'install-git-hooks.mjs');

type InstallerModule = {
  readonly installGitHooks: (options: {
    readonly cwd: string;
    readonly env?: NodeJS.ProcessEnv;
    readonly ensure?: (options: {
      readonly cwd: string;
    }) => Promise<{ readonly status: string }>;
    readonly logger?: Pick<Console, 'log'>;
  }) => Promise<{
    readonly status: string;
    readonly reason?: string;
    readonly bootstrap?: string;
  }>;
};

const silentLogger = { log: () => undefined };

async function loadInstaller(): Promise<InstallerModule> {
  return (await import(pathToFileURL(installerPath).href)) as InstallerModule;
}

function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function temporaryDirectory(name: string): string {
  return mkdtempSync(join(tmpdir(), `${name}-`));
}

describe('tracked repository hooks', () => {
  it('configures the shared hook path idempotently and bootstraps checkout state', async () => {
    const { installGitHooks } = await loadInstaller();
    const repository = temporaryDirectory('cthutool-hooks');
    let ensured = 0;
    try {
      git(repository, ['init']);
      const options = {
        cwd: repository,
        env: {},
        ensure: async () => {
          ensured += 1;
          return { status: ensured === 1 ? 'repaired' : 'valid' };
        },
        logger: silentLogger,
      };

      await expect(installGitHooks(options)).resolves.toEqual({
        status: 'configured',
        bootstrap: 'repaired',
      });
      await expect(installGitHooks(options)).resolves.toEqual({
        status: 'already_configured',
        bootstrap: 'valid',
      });
      expect(
        git(repository, [
          'config',
          '--local',
          '--get-all',
          'core.hooksPath',
        ]).split('\n'),
      ).toEqual(['.githooks']);
    } finally {
      rmSync(repository, { force: true, recursive: true });
    }
  });

  it('skips non-Git, CI, and explicitly disabled contexts safely', async () => {
    const { installGitHooks } = await loadInstaller();
    const directory = temporaryDirectory('cthutool-hooks-skip');
    try {
      await expect(
        installGitHooks({ cwd: directory, env: {}, logger: silentLogger }),
      ).resolves.toMatchObject({ reason: 'not_git' });
      await expect(
        installGitHooks({
          cwd: directory,
          env: { CI: '1' },
          logger: silentLogger,
        }),
      ).resolves.toMatchObject({ reason: 'ci' });
      await expect(
        installGitHooks({
          cwd: directory,
          env: { CTHUTOOL_DISABLE_GIT_HOOKS: '1' },
          logger: silentLogger,
        }),
      ).resolves.toMatchObject({ reason: 'disabled' });
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('propagates actionable current-checkout bootstrap failures', async () => {
    const { installGitHooks } = await loadInstaller();
    const repository = temporaryDirectory('cthutool-hooks-failure');
    try {
      git(repository, ['init']);
      await expect(
        installGitHooks({
          cwd: repository,
          env: {},
          logger: silentLogger,
          ensure: async () => {
            throw new Error(
              'AI tooling initialization is incomplete; run pnpm setup:ai-tooling',
            );
          },
        }),
      ).rejects.toThrow(/incomplete.*pnpm setup:ai-tooling/);
      expect(
        git(repository, ['config', '--local', '--get', 'core.hooksPath']),
      ).toBe('.githooks');
    } finally {
      rmSync(repository, { force: true, recursive: true });
    }
  });

  it('tracks exact commit checks and an executable post-checkout hook', () => {
    const preCommit = readFileSync(
      join(root, '.githooks', 'pre-commit'),
      'utf8',
    );
    const commitMessage = readFileSync(
      join(root, '.githooks', 'commit-msg'),
      'utf8',
    );
    const postCheckout = readFileSync(
      join(root, '.githooks', 'post-checkout'),
      'utf8',
    );

    expect(preCommit).toContain('pnpm run precommit:cli-dist');
    expect(preCommit.indexOf('pnpm exec lint-staged')).toBeGreaterThan(
      preCommit.indexOf('pnpm run precommit:cli-dist'),
    );
    expect(commitMessage).toContain('pnpm exec commitlint --edit "$1"');
    expect(postCheckout).toContain('"${3:-0}" != "1"');
    expect(postCheckout).toContain('scripts/ensure-ai-tooling.mjs');
    for (const hook of ['pre-commit', 'commit-msg', 'post-checkout']) {
      expect(statSync(join(root, '.githooks', hook)).mode & 0o111).not.toBe(0);
    }
    expect(existsSync(join(root, '.husky', 'pre-commit'))).toBe(false);
    expect(existsSync(join(root, '.husky', 'commit-msg'))).toBe(false);
  });

  it('keeps generated adapters ignored and the business plugin protected', () => {
    for (const adapter of [
      '.agents/skills/openspec-explore/SKILL.md',
      '.cursor/skills/openspec-explore/SKILL.md',
      '.opencode/skills/openspec-explore/SKILL.md',
    ]) {
      expect(() =>
        execFileSync('git', ['check-ignore', '--no-index', '--quiet', adapter], {
          cwd: root,
        }),
      ).not.toThrow();
    }
    expect(() =>
      execFileSync(
        'git',
        ['check-ignore', '--no-index', '--quiet', '.githooks/post-checkout'],
        { cwd: root },
      ),
    ).toThrow();

    const setup = readFileSync(
      join(root, 'scripts', 'setup-ai-tooling.mjs'),
      'utf8',
    );
    expect(setup).toContain("'codex', 'plugins', 'cthu-codex'");
    expect(setup).toContain('assertNoProtectedPluginChanges');
  });

  it('documents lifecycle exceptions and matching manual recovery commands', () => {
    const docs = readFileSync(join(root, 'docs', 'ai-tooling.md'), 'utf8');
    const codexNotes = readFileSync(join(root, '.codex', 'README.md'), 'utf8');
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      readonly scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.['setup:git-hooks']).toBe(
      'node scripts/install-git-hooks.mjs',
    );
    for (const content of [docs, codexNotes]) {
      expect(content).toContain('pnpm setup:git-hooks');
      expect(content).toContain('git worktree add --no-checkout');
      expect(content).toContain('pnpm setup:ai-tooling');
    }
    expect(docs).toContain('pnpm install --ignore-scripts');
    expect(docs).toContain('CTHUTOOL_DISABLE_GIT_HOOKS=1');
  });

  it('bootstraps a standard linked worktree without node_modules', () => {
    const repository = temporaryDirectory('cthutool-worktree-hook');
    const worktree = temporaryDirectory('cthutool-worktree-target');
    rmSync(worktree, { recursive: true });
    try {
      mkdirSync(join(repository, '.githooks'), { recursive: true });
      mkdirSync(join(repository, 'scripts'), { recursive: true });
      copyFileSync(
        join(root, '.githooks', 'post-checkout'),
        join(repository, '.githooks', 'post-checkout'),
      );
      chmodSync(join(repository, '.githooks', 'post-checkout'), 0o755);
      writeFileSync(
        join(repository, 'scripts', 'ensure-ai-tooling.mjs'),
        [
          "import { writeFileSync } from 'node:fs';",
          "import { resolve } from 'node:path';",
          "writeFileSync(resolve(import.meta.dirname, '..', 'bootstrap-marker'), process.argv.slice(2).join(' '));",
          '',
        ].join('\n'),
      );
      writeFileSync(join(repository, 'README.md'), 'fixture\n');
      git(repository, ['init', '-b', 'main']);
      git(repository, ['config', 'user.name', 'CthuTool Test']);
      git(repository, ['config', 'user.email', 'cthutool@example.invalid']);
      git(repository, ['config', 'core.hooksPath', '.githooks']);
      git(repository, ['add', '.']);
      git(repository, ['commit', '-m', 'fixture']);

      git(repository, ['worktree', 'add', '-b', 'feature', worktree]);

      expect(existsSync(join(worktree, 'node_modules'))).toBe(false);
      expect(readFileSync(join(worktree, 'bootstrap-marker'), 'utf8')).toBe(
        '--post-checkout',
      );
      rmSync(join(repository, 'bootstrap-marker'), { force: true });
      execFileSync(join(repository, '.githooks', 'post-checkout'), [
        'old',
        'new',
        '0',
      ], { cwd: repository });
      expect(existsSync(join(repository, 'bootstrap-marker'))).toBe(false);
    } finally {
      if (existsSync(join(repository, '.git'))) {
        try {
          git(repository, ['worktree', 'remove', '--force', worktree]);
        } catch {}
      }
      rmSync(worktree, { force: true, recursive: true });
      rmSync(repository, { force: true, recursive: true });
    }
  });
});
