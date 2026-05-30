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

function isEnglishDominantPrompt(prompt) {
  const englishWords = prompt.match(/\b[A-Za-z][A-Za-z'-]*\b/g) ?? [];
  if (englishWords.length === 0) {
    return false;
  }

  const cjkChars = countMatches(
    prompt,
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
  if (prompt.trim() === '' || !isEnglishDominantPrompt(prompt)) {
    writeJson({});
    process.exit(0);
  }

  writeJson({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `Language Coach is active for the user's latest message.

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
    systemMessage: `Language Coach hook failed: ${error instanceof Error ? error.message : String(error)}`,
  });
}
