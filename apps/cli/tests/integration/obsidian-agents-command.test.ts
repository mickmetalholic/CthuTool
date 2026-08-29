import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readdir, rm, stat, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createObsidianAgentsDirectoryLink } from '../../src/domain/obsidian-agents-service';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[]) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: process.env,
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

describe('obsidian agents CLI', () => {
  test('configures and reports the vault-local Agents topology through JSON', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
    const vaultPath = join(root, 'vault');
    const sourcePath = join(vaultPath, 'Agents');
    const agentsPath = join(vaultPath, '.agents');
    const dataRoot = join(root, 'chc-data');
    await mkdir(vaultPath, { recursive: true });

    const setup = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--profile',
      'obsidian-main',
      '--vault',
      vaultPath,
      '--source-path',
      sourcePath,
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
      result: {
        status: 'configured',
        profile: {
          id: 'obsidian-main',
          vaultPath,
          sourcePath,
          agentsPath,
        },
        link: { status: 'correct' },
      },
    });

    expect((await stat(join(sourcePath, 'skills'))).isDirectory()).toBe(true);
    expect((await stat(join(agentsPath, 'state'))).isDirectory()).toBe(true);

    const status = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--json',
      '--no-interactive',
    ]);
    expect(status.code).toBe(0);
    expect(status.err).toBe('');
    expect(JSON.parse(status.out)).toMatchObject({
      ok: true,
      command: 'obsidian agents status',
      result: {
        configured: true,
        healthy: true,
        paths: {
          vaultExists: true,
          sourceExists: true,
          agentsExists: true,
          skillsExists: true,
          stateExists: true,
        },
        link: { status: 'correct' },
        consistency: { provider: 'obsidian_sync', model: 'eventual' },
      },
    });

    const humanStatus = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--no-interactive',
    ]);
    expect(humanStatus.code).toBe(0);
    expect(humanStatus.out).toContain('.agents: OK correct');
    expect(humanStatus.out).toContain('consistency: obsidian_sync (eventual)');

    const repeated = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--data-root',
      dataRoot,
      '--json',
      '--no-interactive',
    ]);
    expect(repeated.code).toBe(0);
    expect(JSON.parse(repeated.out)).toMatchObject({
      ok: true,
      result: { status: 'configured', transition: 'reuse' },
    });
  });

  test('status is read-only and guides setup when no profile exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
    const dataRoot = join(root, 'chc-data');
    const result = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--json',
      '--no-interactive',
    ]);

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out)).toMatchObject({
      ok: true,
      result: { configured: false, healthy: false },
    });
    expect(
      await Bun.file(join(dataRoot, 'obsidian-agents.json')).exists(),
    ).toBe(false);

    const human = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--no-interactive',
    ]);
    expect(human.code).toBe(0);
    expect(human.out).toContain('configuration: missing');
    expect(human.out).toContain('chc obsidian agents setup');
  });

  test('reports mismatched, broken, and legacy-Git topologies without mutation', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
    const vaultPath = join(root, 'vault');
    const sourcePath = join(vaultPath, 'Agents');
    const agentsPath = join(vaultPath, '.agents');
    const oldTarget = join(vaultPath, 'OldAgent');
    const dataRoot = join(root, 'chc-data');
    await mkdir(vaultPath, { recursive: true });
    const setup = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--vault',
      vaultPath,
      '--data-root',
      dataRoot,
      '--yes',
      '--json',
      '--no-interactive',
    ]);
    expect(setup.code).toBe(0);

    await mkdir(join(sourcePath, '.git'), { recursive: true });
    await unlink(agentsPath);
    await mkdir(oldTarget);
    await createObsidianAgentsDirectoryLink(agentsPath, oldTarget);
    const mismatched = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--no-interactive',
    ]);
    expect(mismatched.code).toBe(0);
    expect(mismatched.out).toContain('.agents: FAIL mismatched');
    expect(mismatched.out).toContain('legacy Git metadata: present');

    await rm(oldTarget, { recursive: true });
    const before = await readdir(vaultPath);
    const broken = await runCli([
      'obsidian',
      'agents',
      'status',
      '--data-root',
      dataRoot,
      '--json',
      '--no-interactive',
    ]);
    const after = await readdir(vaultPath);
    expect(broken.code).toBe(0);
    expect(JSON.parse(broken.out)).toMatchObject({
      ok: true,
      result: {
        healthy: false,
        link: { status: 'broken' },
        legacy: { gitMetadata: true },
      },
    });
    expect(after).toEqual(before);
  });

  test('requires a vault non-interactively and rejects sources outside it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
    const dataRoot = join(root, 'chc-data');
    const missing = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--data-root',
      dataRoot,
      '--json',
      '--no-interactive',
    ]);
    expect(missing.code).not.toBe(0);
    expect(JSON.parse(missing.out)).toMatchObject({
      ok: false,
      error: { code: 'missing_required_argument' },
    });

    const vaultPath = join(root, 'vault');
    await mkdir(vaultPath, { recursive: true });
    const invalid = await runCli([
      'obsidian',
      'agents',
      'setup',
      '--vault',
      vaultPath,
      '--source-path',
      join(root, 'outside'),
      '--data-root',
      dataRoot,
      '--yes',
      '--json',
      '--no-interactive',
    ]);
    expect(invalid.code).not.toBe(0);
    expect(JSON.parse(invalid.out)).toMatchObject({
      ok: false,
      error: { code: 'obsidian_agents_invalid_configuration' },
    });
  });

  test('exposes only setup and status operations', async () => {
    const result = await runCli(['obsidian', 'agents', 'sync']);

    expect(result.code).not.toBe(0);
    expect(result.out).toContain('COMMANDS');
    expect(result.out).toContain('setup');
    expect(result.out).toContain('status');
    expect(result.err).toContain('Unknown command `sync`');
  });
});
