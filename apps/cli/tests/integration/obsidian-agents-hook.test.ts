import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncCodexPluginCache } from '../../src/domain/codex-plugin-manager';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const hookPath = join(
  repoRoot,
  'codex',
  'plugins',
  'cthu-codex',
  'scripts',
  'obsidian-agents-sync.mjs',
);

async function createFakeCli(root: string) {
  const marker = join(root, 'calls.log');
  const scriptPath = join(root, 'fake-cli.mjs');
  await writeFile(
    scriptPath,
    `import { appendFile } from 'node:fs/promises';
const marker = ${JSON.stringify(marker)};
const args = process.argv.slice(2);
await appendFile(marker, args.join(' ') + '\\n');
if (process.env.FAKE_CLI_FAIL === '1') {
  process.stderr.write('fake sync failed');
  process.exit(2);
}
if (process.env.FAKE_CLI_MISSING === '1') {
  process.stdout.write(JSON.stringify({ ok: false, error: { code: 'obsidian_agents_not_configured', message: 'run setup' } }));
  process.exit(1);
}
const phaseIndex = args.indexOf('--phase');
process.stdout.write(JSON.stringify({ ok: true, result: { phase: args[phaseIndex + 1] } }));
`,
    'utf8',
  );
  const commandPath = join(root, 'fake-chc.cmd');
  await writeFile(
    commandPath,
    `@echo off\r\n@"${process.execPath}" "${scriptPath}" %*\r\n`,
    'utf8',
  );
  return { commandPath, marker };
}

async function runHook(
  hookArgs: string[],
  input: unknown,
  env: NodeJS.ProcessEnv = {},
) {
  const proc = Bun.spawn(['node', hookPath, ...hookArgs], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  proc.stdin.write(typeof input === 'string' ? input : JSON.stringify(input));
  proc.stdin.end();
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, err, parsed: JSON.parse(out) };
}

describe('Obsidian agents Hook adapter', () => {
  test('only runs before sync for explicit Skill requests and runs after sync once', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-hook-'));
    const fake = await createFakeCli(root);
    const ordinary = await runHook(
      ['--phase', 'before'],
      { user_prompt: '帮我整理一下' },
      { CTHUTOOL_CLI: fake.commandPath },
    );
    expect(ordinary).toEqual({ code: 0, err: '', parsed: {} });
    await expect(readFile(fake.marker, 'utf8')).rejects.toThrow();

    const explicit = await runHook(
      ['--phase', 'before'],
      { user_prompt: '请调用 $my-skill 完成任务' },
      { CTHUTOOL_CLI: fake.commandPath },
    );
    expect(explicit).toEqual({ code: 0, err: '', parsed: {} });

    const after = await runHook(
      ['--phase', 'after'],
      {},
      { CTHUTOOL_CLI: fake.commandPath },
    );
    expect(after).toEqual({ code: 0, err: '', parsed: {} });
    const calls = await readFile(fake.marker, 'utf8');
    expect(calls).toContain('--phase before');
    expect(calls).toContain('--phase after');
  });

  test('returns structured blocking results for malformed input and CLI failures', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-hook-'));
    const fake = await createFakeCli(root);
    const malformed = await runHook(['--phase', 'before'], '{not json', {
      CTHUTOOL_CLI: fake.commandPath,
    });
    expect(malformed.code).toBe(0);
    expect(malformed.parsed.decision).toBe('block');
    expect(malformed.parsed.reason).toContain('malformed JSON');

    const failed = await runHook(
      ['--phase', 'before'],
      { user_prompt: '$my-skill' },
      { CTHUTOOL_CLI: fake.commandPath, FAKE_CLI_FAIL: '1' },
    );
    expect(failed.code).toBe(0);
    expect(failed.parsed.decision).toBe('block');
    expect(failed.parsed.reason).toContain('fake sync failed');

    const missingBefore = await runHook(
      ['--phase', 'before'],
      { user_prompt: '$my-skill' },
      { CTHUTOOL_CLI: fake.commandPath, FAKE_CLI_MISSING: '1' },
    );
    expect(missingBefore.parsed.decision).toBe('block');
    expect(missingBefore.parsed.reason).toContain('run setup');

    const missingAfter = await runHook(
      ['--phase', 'after'],
      {},
      { CTHUTOOL_CLI: fake.commandPath, FAKE_CLI_MISSING: '1' },
    );
    expect(missingAfter).toEqual({ code: 0, err: '', parsed: {} });
  });

  test('preserves the language coach hook and exposes both sync phases in the plugin definition', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-plugin-cache-'));
    const manifest = JSON.parse(
      await readFile(
        join(
          repoRoot,
          'codex',
          'plugins',
          'cthu-codex',
          '.codex-plugin',
          'plugin.json',
        ),
        'utf8',
      ),
    ) as { version: string };
    await syncCodexPluginCache({
      cacheRoot: join(root, 'cache'),
      plugin: {
        name: 'cthu-codex',
        displayName: 'CthuCodex',
        root: join(repoRoot, 'codex', 'plugins', 'cthu-codex'),
        marketplacePath: './codex/plugins/cthu-codex',
      },
    });
    const cachedHooks = await readFile(
      join(
        root,
        'cache',
        'cthu-codex',
        manifest.version,
        'hooks',
        'hooks.json',
      ),
      'utf8',
    );
    expect(cachedHooks).not.toContain('<PLUGIN_ROOT>');
    expect(cachedHooks).toContain('language-coach.mjs');
    expect(cachedHooks).toContain('obsidian-agents-sync.mjs');

    const raw = await readFile(
      join(repoRoot, 'codex', 'plugins', 'cthu-codex', 'hooks', 'hooks.json'),
      'utf8',
    );
    const hooks = JSON.parse(raw) as {
      hooks: {
        UserPromptSubmit: Array<{ hooks: Array<{ command?: string }> }>;
        Stop: Array<{ hooks: Array<{ command?: string }> }>;
      };
    };
    const userPromptCommands = hooks.hooks.UserPromptSubmit.flatMap((group) =>
      group.hooks.map((hook) => hook.command ?? ''),
    );
    const stopCommands = hooks.hooks.Stop.flatMap((group) =>
      group.hooks.map((hook) => hook.command ?? ''),
    );
    expect(userPromptCommands.join('\n')).toContain('language-coach.mjs');
    expect(userPromptCommands.join('\n')).toContain('obsidian-agents-sync.mjs');
    expect(userPromptCommands.join('\n')).toContain('<PLUGIN_ROOT>');
    expect(stopCommands.join('\n')).toContain('--phase after');
  });
});
