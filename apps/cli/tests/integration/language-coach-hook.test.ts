import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const hookPath = join(
  repoRoot,
  'codex',
  'plugins',
  'language-coach',
  'scripts',
  'language-coach.mjs',
);

async function runHook(input: unknown) {
  const proc = Bun.spawn(['node', hookPath], {
    cwd: repoRoot,
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (typeof input === 'string') {
    proc.stdin.write(input);
  } else {
    proc.stdin.write(JSON.stringify(input));
  }
  proc.stdin.end();

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, err, parsed: JSON.parse(out) };
}

describe('language coach hook', () => {
  test('injects language coaching for English prose', async () => {
    const result = await runHook({
      user_prompt: 'Can you help me write this?',
    });

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(result.parsed.hookSpecificOutput.hookEventName).toBe(
      'UserPromptSubmit',
    );
    expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
      'Language Coach',
    );
  });

  test('injects language coaching for English-dominant mixed prose', async () => {
    const result = await runHook({
      user_prompt:
        'I want to 修改 this hook because I do not know the right word.',
    });

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
      'Language Coach',
    );
  });

  test('ignores empty invalid and non-English input', async () => {
    await expect(runHook('')).resolves.toMatchObject({ parsed: {} });
    await expect(runHook('{not json')).resolves.toMatchObject({ parsed: {} });
    await expect(
      runHook({ user_prompt: '帮我整理一下' }),
    ).resolves.toMatchObject({
      parsed: {},
    });
    await expect(
      runHook({ user_prompt: '还有个逻辑，我希望这个 hook 只在纯英文时触发' }),
    ).resolves.toMatchObject({
      parsed: {},
    });
    await expect(
      runHook({ user_prompt: 'hook 这个词不应该让中文消息触发' }),
    ).resolves.toMatchObject({
      parsed: {},
    });
  });
});
