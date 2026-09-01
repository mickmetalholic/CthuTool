import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const hookPath = join(
  repoRoot,
  'codex',
  'plugins',
  'cthu-codex',
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

async function expectSilent(input: unknown) {
  const result = await runHook(input);

  expect(result.code).toBe(0);
  expect(result.err).toBe('');
  expect(result.parsed).toEqual({});
}

async function expectCoaching(input: unknown) {
  const result = await runHook(input);

  expect(result.code).toBe(0);
  expect(result.err).toBe('');
  expect(result.parsed.hookSpecificOutput.hookEventName).toBe(
    'UserPromptSubmit',
  );
  expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
    'CthuCodex language coach',
  );
  expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
    'cthu_language_feedback_present',
  );
  expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
    'version 1, variant "compact"',
  );
  expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
    "continue with and fully answer the user's actual request",
  );
  expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
    '## English polish',
  );
  expect(result.parsed.hookSpecificOutput.additionalContext).toContain(
    'unavailable or its call fails',
  );
}

const longChinesePaste =
  '一个初级程序员，部署一个 spring boot，和一个 go web 服务，' +
  '遇到奇奇怪怪的问题的概率，go 要少 80%。特别是在 k8s 环境下。' +
  'k8s 已经是事实上的微服务的基础设施的背景下，我觉得是 k8s ' +
  '带动了 go 语言的流行。';

describe('language coach hook', () => {
  test('injects language coaching for English prose', async () => {
    await expectCoaching({
      user_prompt: 'Can you help me write this?',
    });
  });

  test('keeps progressive UI and Markdown fallback instructions together', async () => {
    const result = await runHook({
      user_prompt: 'Please make these corrections easier to notice.',
    });
    const context = result.parsed.hookSpecificOutput.additionalContext;

    expect(context).toContain('original');
    expect(context).toContain('bestVersion');
    expect(context).toContain('ordered notes array');
    expect(context).toContain(
      'grammar, naturalness, tone, idiom, clarity, or other',
    );
    expect(context).toContain('do not let the presentation failure block');
    expect(context.indexOf('cthu_language_feedback_present')).toBeLessThan(
      context.indexOf('## English polish'),
    );
  });

  test('injects language coaching for English-dominant mixed prose', async () => {
    await expectCoaching({
      user_prompt:
        'I want to 修改 this hook because I do not know the right word.',
    });
  });

  test('injects language coaching for imperative English prose', async () => {
    await expectCoaching({
      user_prompt: 'write two MDs, one english, one chinese',
    });
  });

  test('injects language coaching for prose mixed with identifiers', async () => {
    await expectCoaching({
      user_prompt: 'Please explain how useState and useEffect work together.',
    });
  });

  test('ignores empty invalid and non-English input', async () => {
    await expectSilent('');
    await expectSilent('{not json');
    await expectSilent({});
    await expectSilent({ user_prompt: '帮我整理一下' });
    await expectSilent({
      user_prompt: '还有个逻辑，我希望这个 hook 只在纯英文时触发',
    });
    await expectSilent({
      user_prompt: 'hook 这个词不应该让中文消息触发',
    });
    await expectSilent({ user_prompt: 'ok' });
  });

  test('ignores command code and identifier-only prompts', async () => {
    await expectSilent({ user_prompt: '/help me with the docs please' });
    await expectSilent({ user_prompt: '!ls -la\nhello' });
    await expectSilent({
      user_prompt: '```\nthe quick brown fox jumps over the lazy dog\n```',
    });
    await expectSilent({ user_prompt: 'Please check `this english text`' });
    await expectSilent({ user_prompt: 'useState useEffect useMemo' });
    await expectSilent({ user_prompt: 'HTTP_REQUEST MAX_CONN BUFFER_SIZE' });
    await expectSilent({ user_prompt: 'react18 svelte5 nuxt3' });
  });

  test('uses short English tail after long pasted context', async () => {
    await expectCoaching({
      user_prompt: `${longChinesePaste} what does this mean please`,
    });
  });

  test('ignores trivial tail after long pasted context', async () => {
    await expectSilent({ user_prompt: `${longChinesePaste} ok` });
  });

  test('evaluates balanced multi-sentence prose as a whole', async () => {
    await expectCoaching({
      user_prompt: 'First sentence is here. Second one is also here.',
    });
  });
});
