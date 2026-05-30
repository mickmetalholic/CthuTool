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

function hasEnglishWords(prompt) {
  return /\b[A-Za-z][A-Za-z'-]*\b/.test(prompt);
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
  if (prompt.trim() === '' || !hasEnglishWords(prompt)) {
    writeJson({});
    process.exit(0);
  }

  writeJson({
    systemMessage: `Language Coach is active for the user's latest message.

Before doing any requested task, first review the user's English prose if the latest message contains English intended as natural language. Check grammar, naturalness, tone, and idiomatic usage. Provide:

English check:
Best version: <best natural version, or "Already natural" if no change is needed>
Notes: <brief key corrections or one optional polish note>

Then continue with the actual request.

Do not correct source code, commands, logs, file paths, config keys, quoted text, or names unless the user explicitly asks. If the latest message is mostly not English prose, skip the English check silently.`,
  });
} catch (error) {
  writeJson({
    systemMessage: `Language Coach hook failed: ${error instanceof Error ? error.message : String(error)}`,
  });
}
