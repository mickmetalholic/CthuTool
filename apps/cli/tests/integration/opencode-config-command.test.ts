import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[]) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  return {
    out: await new Response(proc.stdout).text(),
    err: await new Response(proc.stderr).text(),
    code: await proc.exited,
  };
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8');
}

describe('opencode command boundary', () => {
  test('exposes skills and mcp without reserving install for OpenCode', async () => {
    const result = await runCli(['opencode']);

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(result.out).toContain('skills');
    expect(result.out).toContain('mcp');
    expect(result.out).not.toContain('install');
  });

  test('maps repository plugin skills and MCP to one OpenCode config', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-opencode-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-opencode-home-'));
    const pluginRoot = join(repoRoot, 'codex', 'plugins', 'shared-plugin');
    const skillRoot = join(pluginRoot, 'skills', 'shared-skill');
    const openCodeRoot = join(homeRoot, '.config', 'opencode');
    await mkdir(openCodeRoot, { recursive: true });
    await writeFile(
      join(openCodeRoot, 'opencode.jsonc'),
      '{\n  // Keep unrelated OpenCode configuration.\n  "agent": { "kept": true },\n  "mcp": {\n    "existing": { "type": "remote", "url": "https://example.test" }\n  }\n}\n',
      'utf8',
    );

    await writeJson(join(pluginRoot, '.codex-plugin', 'plugin.json'), {
      name: 'shared-plugin',
      version: '0.1.0',
      interface: { displayName: 'Shared plugin' },
      skills: './skills/',
      mcpServers: './.mcp.json',
    });
    await mkdir(skillRoot, { recursive: true });
    await writeFile(
      join(skillRoot, 'SKILL.md'),
      '---\nname: shared-skill\ndescription: Shared test skill.\n---\n\nUse it.\n',
      'utf8',
    );
    await writeJson(join(pluginRoot, '.mcp.json'), {
      mcpServers: {
        shared: {
          command: 'node',
          args: ['./scripts/server.mjs'],
          env: { SHARED_MODE: 'test' },
          tool_timeout_sec: 60,
        },
      },
    });

    const skills = await runCli([
      'opencode',
      'skills',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);
    expect(skills.code).toBe(0);
    expect(skills.err).toBe('');
    expect(JSON.parse(skills.out)).toMatchObject({
      ok: true,
      command: 'opencode skills',
      result: {
        changed: true,
        configPath: join(openCodeRoot, 'opencode.jsonc'),
        plugins: [
          { name: 'shared-plugin', paths: [join(pluginRoot, 'skills')] },
        ],
      },
    });

    const mcp = await runCli([
      'opencode',
      'mcp',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);
    expect(mcp.code).toBe(0);
    expect(mcp.err).toBe('');
    expect(JSON.parse(mcp.out)).toMatchObject({
      ok: true,
      command: 'opencode mcp',
      result: {
        changed: true,
        configPath: join(openCodeRoot, 'opencode.jsonc'),
        servers: [{ name: 'shared', plugin: 'shared-plugin' }],
      },
    });

    const configPath = join(openCodeRoot, 'opencode.jsonc');
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      agent: { kept: boolean };
      skills: { paths: string[] };
      mcp: Record<string, Record<string, unknown>>;
    };
    expect(config.agent).toEqual({ kept: true });
    expect(config.skills.paths).toEqual([join(pluginRoot, 'skills')]);
    expect(config.mcp.existing).toEqual({
      type: 'remote',
      url: 'https://example.test',
    });
    expect(config.mcp.shared).toEqual({
      type: 'local',
      command: ['node', './scripts/server.mjs'],
      environment: { SHARED_MODE: 'test' },
      cwd: pluginRoot,
      timeout: 60000,
      enabled: true,
    });
  });
});
