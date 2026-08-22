import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = join(cliRoot, '../..');
const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'CthuTool Test',
  GIT_AUTHOR_EMAIL: 'cthutool@example.invalid',
  GIT_COMMITTER_NAME: 'CthuTool Test',
  GIT_COMMITTER_EMAIL: 'cthutool@example.invalid',
};

async function runCli(args: string[]) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: gitEnv,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return {
    out: await new Response(proc.stdout).text(),
    err: await new Response(proc.stderr).text(),
    code: await proc.exited,
  };
}

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
  if (code !== 0) throw new Error(stderr || stdout);
  return stdout.trim();
}

describe('obsidian agents CLI', () => {
  test('configures, refreshes, reports, and synchronizes a profile through JSON', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
    const remote = join(root, 'agents.git');
    await git(root, ['init', '--bare', '--initial-branch=main', remote]);
    const vaultPath = join(root, 'vault');
    const agentsPath = join(vaultPath, '.agents');
    await mkdir(agentsPath, { recursive: true });
    await writeFile(join(agentsPath, 'skills.md'), 'initial\n', 'utf8');
    const dataRoot = join(root, 'chc-data');
    const cacheRoot = join(root, 'cache');

    const setup = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--profile',
      'obsidian-main',
      '--vault',
      vaultPath,
      '--agents-path',
      agentsPath,
      '--remote',
      remote,
      '--branch',
      'main',
      '--data-root',
      dataRoot,
      '--yes',
      '--json',
      '--no-interactive',
    ]);
    expect(setup.code).toBe(0);
    expect(setup.err).toBe('');
    expect(JSON.parse(setup.out)).toMatchObject({
      ok: true,
      command: 'obsidian agents setup',
      result: { status: 'configured', profile: { id: 'obsidian-main' } },
    });

    const status = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--repo-root',
      repoRoot,
      '--cache-root',
      cacheRoot,
      '--refresh',
      '--json',
    ]);
    expect(status.code).toBe(0);
    const statusValue = JSON.parse(status.out);
    expect(statusValue).toMatchObject({
      ok: true,
      command: 'obsidian agents status',
      result: {
        configured: true,
        paths: { vaultExists: true, agentsExists: true },
        git: { isRepository: true, branch: 'main' },
        sync: { refreshed: true, state: 'up_to_date' },
        hook: { source: true, installed: false, ready: false },
      },
    });

    await mkdir(join(agentsPath, 'state'), { recursive: true });
    await writeFile(join(agentsPath, 'state', 'state.json'), '{}\n', 'utf8');
    const sync = await runCli([
      'obsidian',
      'agents',
      'sync',
      '--phase',
      'after',
      '--data-root',
      dataRoot,
      '--json',
      '--no-interactive',
    ]);
    expect(sync.code).toBe(0);
    expect(JSON.parse(sync.out)).toMatchObject({
      ok: true,
      command: 'obsidian agents sync after',
      result: { changed: true, committed: true, pushed: true },
    });

    const peer = join(root, 'peer');
    await git(root, ['clone', remote, peer]);
    expect(
      (await readFile(join(peer, 'state', 'state.json'), 'utf8')).replaceAll(
        '\r\n',
        '\n',
      ),
    ).toBe('{}\n');

    const edited = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--profile',
      'obsidian-main',
      '--vault',
      vaultPath,
      '--remote',
      remote,
      '--data-root',
      dataRoot,
      '--yes',
      '--json',
      '--no-interactive',
    ]);
    expect(edited.code).toBe(0);
    expect(JSON.parse(edited.out).result.status).toBe('configured');
  });

  test('returns a stable setup-required error before any profile exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
    const result = await runCli([
      'obsidian',
      'agents',
      'sync',
      '--phase',
      'before',
      '--data-root',
      join(root, 'chc-data'),
      '--json',
      '--no-interactive',
    ]);

    expect(result.code).not.toBe(0);
    const value = JSON.parse(result.out);
    expect(value).toMatchObject({
      ok: false,
      command: 'obsidian agents sync',
      error: { code: 'obsidian_agents_not_configured' },
    });
  });
});
