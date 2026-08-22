import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  configureGitRemote,
  readGitSnapshot,
} from '../../src/domain/obsidian-agents-git';
import {
  ObsidianAgentsLockError,
  withObsidianAgentsLock,
} from '../../src/domain/obsidian-agents-lock';
import {
  applyObsidianAgentsSetup,
  createObsidianAgentsSetupPlan,
  synchronizeObsidianAgents,
} from '../../src/domain/obsidian-agents-service';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'CthuTool Test',
  GIT_AUTHOR_EMAIL: 'cthutool@example.invalid',
  GIT_COMMITTER_NAME: 'CthuTool Test',
  GIT_COMMITTER_EMAIL: 'cthutool@example.invalid',
};

async function git(cwd: string, args: readonly string[]): Promise<string> {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    env: gitEnv,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${stderr || stdout}`);
  }
  return stdout.trim();
}

async function createBareRemote(root: string): Promise<string> {
  const remote = join(root, 'agents.git');
  await git(root, ['init', '--bare', '--initial-branch=main', remote]);
  return remote;
}

async function createProfileFixture() {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-sync-'));
  const remote = await createBareRemote(root);
  const vaultPath = join(root, 'vault');
  const agentsPath = join(vaultPath, '.agents');
  await mkdir(agentsPath, { recursive: true });
  await writeFile(join(agentsPath, 'skills.md'), '# shared skills\n', 'utf8');
  const paths = createObsidianAgentsDataPaths({
    dataRoot: join(root, 'chc-data'),
  });
  return { root, remote, vaultPath, agentsPath, paths };
}

async function bootstrapFixture() {
  const fixture = await createProfileFixture();
  const plan = await createObsidianAgentsSetupPlan(fixture.paths, {
    id: 'obsidian-main',
    vaultPath: fixture.vaultPath,
    agentsPath: fixture.agentsPath,
    remote: fixture.remote,
    branch: 'main',
  });
  const setup = await applyObsidianAgentsSetup(fixture.paths, plan);
  const profile = setup.profile;
  return { ...fixture, profile };
}

describe('Obsidian agents Git synchronization', () => {
  test('bootstraps local .agents files and publishes one after-phase commit', async () => {
    const fixture = await bootstrapFixture();

    expect(fixture.profile.agentsPath).toBe(fixture.agentsPath);
    expect((await readGitSnapshot(fixture.agentsPath)).remote).toBe(
      fixture.remote,
    );

    await mkdir(join(fixture.agentsPath, 'state'), { recursive: true });
    await writeFile(
      join(fixture.agentsPath, 'state', 'last-run.json'),
      '{"ok":true}\n',
      'utf8',
    );
    const result = await synchronizeObsidianAgents({
      paths: fixture.paths,
      profile: fixture.profile,
      phase: 'after',
    });

    expect(result).toMatchObject({
      phase: 'after',
      changed: true,
      committed: true,
      pushed: true,
    });
    const peer = join(fixture.root, 'peer');
    await git(fixture.root, ['clone', fixture.remote, peer]);
    expect(
      (await readFile(join(peer, 'state', 'last-run.json'), 'utf8')).replaceAll(
        '\r\n',
        '\n',
      ),
    ).toBe('{"ok":true}\n');
  });

  test('fast-forwards clean local agents from remote before Skill work', async () => {
    const fixture = await bootstrapFixture();
    const peer = join(fixture.root, 'peer');
    await git(fixture.root, ['clone', fixture.remote, peer]);
    await mkdir(join(peer, 'skills'), { recursive: true });
    await writeFile(join(peer, 'skills', 'remote.md'), 'remote\n', 'utf8');
    await git(peer, ['add', '--all']);
    await git(peer, ['commit', '-m', 'peer update']);
    await git(peer, ['push', 'origin', 'HEAD:main']);

    const result = await synchronizeObsidianAgents({
      paths: fixture.paths,
      profile: fixture.profile,
      phase: 'before',
    });

    expect(result).toMatchObject({ phase: 'before', pushed: false });
    expect(
      (
        await readFile(join(fixture.agentsPath, 'skills', 'remote.md'), 'utf8')
      ).replaceAll('\r\n', '\n'),
    ).toBe('remote\n');
  });

  test('clones a populated private remote into an absent agents path', async () => {
    const source = await bootstrapFixture();
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-clone-'));
    const vaultPath = join(root, 'vault');
    const agentsPath = join(vaultPath, '.agents');
    await mkdir(vaultPath, { recursive: true });
    const paths = createObsidianAgentsDataPaths({
      dataRoot: join(root, 'chc-data'),
    });

    const plan = await createObsidianAgentsSetupPlan(paths, {
      id: 'obsidian-main',
      vaultPath,
      agentsPath,
      remote: source.remote,
      branch: 'main',
    });
    expect(plan.agentsExists).toBe(false);
    expect(plan.actions.join('\n')).toContain('clone');
    const setup = await applyObsidianAgentsSetup(paths, plan);

    expect(setup.profile.agentsPath).toBe(agentsPath);
    expect(
      (await readFile(join(agentsPath, 'skills.md'), 'utf8')).replaceAll(
        '\r\n',
        '\n',
      ),
    ).toBe('# shared skills\n');
  });

  test('blocks divergent histories without discarding the local commit', async () => {
    const fixture = await bootstrapFixture();
    await writeFile(join(fixture.agentsPath, 'local.md'), 'local\n', 'utf8');
    await git(fixture.agentsPath, ['add', '--all']);
    await git(fixture.agentsPath, ['commit', '-m', 'local update']);
    const localHead = await git(fixture.agentsPath, ['rev-parse', 'HEAD']);

    const peer = join(fixture.root, 'peer');
    await git(fixture.root, ['clone', fixture.remote, peer]);
    await writeFile(join(peer, 'remote.md'), 'remote\n', 'utf8');
    await git(peer, ['add', '--all']);
    await git(peer, ['commit', '-m', 'remote update']);
    await git(peer, ['push', 'origin', 'HEAD:main']);

    await expect(
      synchronizeObsidianAgents({
        paths: fixture.paths,
        profile: fixture.profile,
        phase: 'before',
      }),
    ).rejects.toThrow(/diverged/);
    expect(await git(fixture.agentsPath, ['rev-parse', 'HEAD'])).toBe(
      localHead,
    );
    expect(await readFile(join(fixture.agentsPath, 'local.md'), 'utf8')).toBe(
      'local\n',
    );
  });

  test('keeps a local commit when the after-phase push fails', async () => {
    const fixture = await bootstrapFixture();
    await configureGitRemote(
      fixture.agentsPath,
      join(fixture.root, 'missing-remote.git'),
    );
    await writeFile(join(fixture.agentsPath, 'recovery.md'), 'keep\n', 'utf8');

    await expect(
      synchronizeObsidianAgents({
        paths: fixture.paths,
        profile: fixture.profile,
        phase: 'after',
      }),
    ).rejects.toThrow();
    expect(
      await readFile(join(fixture.agentsPath, 'recovery.md'), 'utf8'),
    ).toBe('keep\n');
    expect((await readGitSnapshot(fixture.agentsPath)).worktree).toEqual([]);
  });

  test('rejects overlapping synchronization for the same profile', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-lock-'));
    const paths = createObsidianAgentsDataPaths({ dataRoot: root });
    let entered!: () => void;
    let release!: () => void;
    const enteredPromise = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const releasePromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = withObsidianAgentsLock(paths, 'obsidian-main', async () => {
      entered();
      await releasePromise;
    });
    await enteredPromise;
    await expect(
      withObsidianAgentsLock(paths, 'obsidian-main', async () => undefined, {
        waitMs: 20,
      }),
    ).rejects.toBeInstanceOf(ObsidianAgentsLockError);
    release();
    await first;
  });
});
