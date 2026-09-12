import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const installerPath = join(root, 'scripts', 'install-git-hooks.mjs');

function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function temporaryDirectory(name: string): string {
  return mkdtempSync(join(tmpdir(), `${name}-`));
}

function copyInstaller(directory: string): string {
  mkdirSync(join(directory, 'scripts'), { recursive: true });
  const copy = join(directory, 'scripts', 'install-git-hooks.mjs');
  copyFileSync(installerPath, copy);
  return copy;
}

function runInstaller(directory: string, env: NodeJS.ProcessEnv = {}): string {
  return execFileSync(process.execPath, [join(directory, 'scripts', 'install-git-hooks.mjs')], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

describe('tracked repository hooks', () => {
  it('configures the shared hook path idempotently', () => {
    const repository = temporaryDirectory('cthutool-hooks');
    try {
      git(repository, ['init']);
      copyInstaller(repository);

      expect(runInstaller(repository)).toContain('Configured core.hooksPath=.githooks.');
      expect(runInstaller(repository)).toContain('core.hooksPath is already .githooks.');
      expect(git(repository, ['config', '--local', '--get', 'core.hooksPath'])).toBe('.githooks');
    } finally {
      rmSync(repository, { force: true, recursive: true });
    }
  });

  it('skips non-Git, CI, and explicitly disabled contexts', () => {
    const directory = temporaryDirectory('cthutool-hooks-skip');
    try {
      copyInstaller(directory);
      expect(runInstaller(directory)).toContain('skipped outside a Git worktree');
      expect(runInstaller(directory, { CI: '1' })).toContain('skipped in CI');
      expect(runInstaller(directory, { CTHUTOOL_DISABLE_GIT_HOOKS: '1' })).toContain('installation skipped');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('keeps the prepare script available to the backend image install layer', () => {
    const dockerfile = readFileSync(join(root, 'apps', 'backend', 'Dockerfile'), 'utf8');
    const scriptsCopy = 'COPY scripts/install-git-hooks.mjs scripts/';
    const dependencyInstall = 'RUN CTHUTOOL_DISABLE_GIT_HOOKS=1 pnpm install --frozen-lockfile';
    const directory = temporaryDirectory('cthutool-hooks-image');

    expect(dockerfile).toContain(scriptsCopy);
    expect(dockerfile.indexOf(scriptsCopy)).toBeLessThan(dockerfile.indexOf(dependencyInstall));

    try {
      copyInstaller(directory);
      expect(runInstaller(directory, { CI: '1' })).toContain('skipped in CI');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('tracks commit checks without a checkout bootstrap', () => {
    const preCommit = readFileSync(join(root, '.githooks', 'pre-commit'), 'utf8');
    const commitMessage = readFileSync(join(root, '.githooks', 'commit-msg'), 'utf8');

    expect(preCommit).toContain('pnpm run precommit:cli-dist');
    expect(preCommit.indexOf('pnpm exec lint-staged')).toBeGreaterThan(preCommit.indexOf('pnpm run precommit:cli-dist'));
    expect(commitMessage).toContain('pnpm exec commitlint --edit "$1"');
    for (const hook of ['pre-commit', 'commit-msg']) {
      expect(git(root, ['ls-files', '--stage', `.githooks/${hook}`])).toMatch(/^100755 /);
    }
    expect(existsSync(join(root, '.githooks', 'post-checkout'))).toBe(false);
  });

  it('keeps the six core Skills in both committed discovery roots', () => {
    for (const skill of [
      'openspec-explore',
      'openspec-propose',
      'openspec-apply-change',
      'openspec-update-change',
      'openspec-sync-specs',
      'openspec-archive-change',
    ]) {
      for (const rootName of ['.agents', '.zcode']) {
        const path = join(root, rootName, 'skills', skill, 'SKILL.md');
        expect(existsSync(path)).toBe(true);
        const content = readFileSync(path, 'utf8');
        expect(content).toMatch(new RegExp(`^name: ${skill}$`, 'm'));
        expect(content).toMatch(/^description: .+$/m);
        expect(content).toContain('generatedBy: "1.13.0"');
      }
    }
    expect(existsSync(join(root, 'scripts', 'setup-ai-tooling.mjs'))).toBe(false);
    expect(existsSync(join(root, 'scripts', 'ensure-ai-tooling.mjs'))).toBe(false);
  });

  it('documents direct regeneration and separate hook installation', () => {
    const docs = readFileSync(join(root, 'docs', 'ai-tooling.md'), 'utf8');
    const codexNotes = readFileSync(join(root, '.codex', 'README.md'), 'utf8');
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      readonly scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.['setup:git-hooks']).toBe('node scripts/install-git-hooks.mjs');
    expect(pkg.scripts?.['setup:ai-tooling']).toBeUndefined();
    expect(docs).toContain("openspec init --tools 'codex,agents,zcode'");
    expect(docs).toContain('pnpm setup:git-hooks');
    expect(codexNotes).toContain('pnpm setup:git-hooks');
  });
});
