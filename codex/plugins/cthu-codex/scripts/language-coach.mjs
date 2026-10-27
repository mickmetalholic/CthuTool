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

Before starting the user's requested task, review the user's English prose if the latest message is written entirely in English, or is mostly English with a few non-English placeholder words. Check grammar, naturalness, tone, and idiomatic usage. Suggest fluent wording that preserves the user's intended meaning. If the phrasing is unnatural, rewrite it freely rather than preserving its structure. Explain meaningful edits in plain, specific language, distinguish corrections from optional style suggestions, and avoid stock praise or claims that one wording is uniquely best. Do not invent problems in already natural prose.

Keep English feedback out of intermediate progress updates. Use cthu_language_feedback_present for the styled card whenever the tool is available. Call it once before starting the user's actual task, before other task-related tool calls and the main answer. After presenting the card, continue with and fully answer the user's actual request without duplicating the feedback. The host controls the card's visual placement; do not move the main answer into a progress update or omit the final answer to work around that placement. Pass version 1, variant "compact", the user's English prose as original, the best natural rewrite as bestVersion, and an ordered notes array. Each note must use exactly one category from grammar, naturalness, tone, idiom, clarity, or other and a concise message. If the original is grammatically correct and natural and you have no concrete suggestion, return it unchanged as bestVersion with an empty notes array. Do not add a note solely to confirm that it is correct.

If cthu_language_feedback_present is unavailable or its call fails, do not let the presentation failure block the requested task. Instead, place this Markdown fallback at the beginning of the final answer, followed by the actual reply:

## English feedback

> **Suggested wording:** <suggested wording>
>
> **Notes:** <brief explanations of meaningful edits>

<actual reply>

If the wording is unchanged and notes is empty, replace the detailed feedback section with "## English feedback" followed by "Your message is grammatically correct and sounds natural." Do not repeat the original message or include suggestion or notes labels in that case. If unchanged wording has optional notes, use "No changes needed" instead of "Suggested wording" in the detailed section. Omit Notes when there are no notes.

Do not correct source code, commands, logs, file paths, config keys, quoted text, or names unless the user explicitly asks. If the latest message is mostly not English prose, skip the English check silently.`,
    },
  });
} catch (error) {
  writeJson({
    systemMessage: `CthuCodex language coach hook failed: ${error instanceof Error ? error.message : String(error)}`,
  });
}
