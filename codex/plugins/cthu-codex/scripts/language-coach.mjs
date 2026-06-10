function writeJson(value) {
  process.stdout.write(JSON.stringify(value));
}

function extractPrompt(input) {
  if (!input || typeof input !== 'object') {
    return '';
  }

  for (const name of ['user_prompt', 'prompt', 'message']) {
    const value = input[name];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }

  return '';
}

function countMatches(prompt, pattern) {
  return [...prompt.matchAll(pattern)].length;
}

function cleanPrompt(prompt) {
  return prompt
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/^\s*[!/]/.test(line))
    .join('\n')
    .trim();
}

function extractUserIntent(prompt) {
  const trimmed = prompt.trim();
  if (trimmed === '') {
    return '';
  }

  const segments = trimmed
    .split(/(?<=[.!?。！？])\s+|\n{2,}/u)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length < 2) {
    return trimmed;
  }

  const tail = segments.at(-1);
  const body = segments.slice(0, -1).join(' ');
  if (
    tail.length > 0 &&
    tail.length <= 120 &&
    body.length >= 80 &&
    body.length >= tail.length * 3
  ) {
    return tail;
  }

  return trimmed;
}

function isCodeLikeToken(token) {
  return (
    token.includes('_') ||
    /\d/.test(token) ||
    /[a-z][A-Z]/.test(token) ||
    /^[A-Z0-9]{2,}$/.test(token)
  );
}

function isEnglishProsePrompt(prompt) {
  const intent = extractUserIntent(cleanPrompt(prompt));
  if (intent === '') {
    return false;
  }

  const englishWords = intent.match(/\b[A-Za-z][A-Za-z'-]*\b/g) ?? [];
  if (englishWords.length < 3) {
    return false;
  }

  if (englishWords.every(isCodeLikeToken)) {
    return false;
  }

  const cjkChars = countMatches(
    intent,
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu,
  );
  if (cjkChars === 0) {
    return true;
  }

  const englishChars = englishWords.join('').length;
  return englishWords.length >= 4 && englishChars > cjkChars;
}

try {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    raw += chunk;
  }

  if (raw.trim() === '') {
    writeJson({});
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    writeJson({});
    process.exit(0);
  }

  const prompt = extractPrompt(input);
  if (prompt.trim() === '' || !isEnglishProsePrompt(prompt)) {
    writeJson({});
    process.exit(0);
  }

  writeJson({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `CthuCodex language coach is active for the user's latest message.

Before doing any requested task, first review the user's English prose if the latest message is written entirely in English, or is mostly English with a few non-English placeholder words. Check grammar, naturalness, tone, and idiomatic usage. The best version should be a natural native-like rewrite of the user's intended meaning, not a minimal grammar correction. If the original sentence sounds Chinglish or structurally unnatural, rewrite it freely and do not preserve the original structure.

Do not output the English check in intermediate progress updates. In the final answer, start with the English check as a fenced text block, then continue with the actual reply below it. Do not add any prose before the block. Use this format at the top of the final answer:

~~~text
Best version: <best natural version, or "Already natural" if no change is needed>
Notes: <brief key corrections or one optional polish note>
~~~

<actual reply>

Do not correct source code, commands, logs, file paths, config keys, quoted text, or names unless the user explicitly asks. If the latest message is mostly not English prose, skip the English check silently.`,
    },
  });
} catch (error) {
  writeJson({
    systemMessage: `CthuCodex language coach hook failed: ${error instanceof Error ? error.message : String(error)}`,
  });
}
