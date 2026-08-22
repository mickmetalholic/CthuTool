import { spawn } from 'node:child_process';

function writeJson(value) {
  process.stdout.write(JSON.stringify(value));
}

function extractPrompt(input) {
  if (!input || typeof input !== 'object') return '';
  for (const name of ['user_prompt', 'prompt', 'message']) {
    const value = input[name];
    if (value !== undefined && value !== null) return String(value);
  }
  return '';
}

function isExplicitSkillPrompt(prompt) {
  return /(^|\s)\$[A-Za-z0-9][A-Za-z0-9_-]*/u.test(prompt);
}

function hookFailure(phase, message) {
  if (phase === 'before') {
    return { decision: 'block', reason: message };
  }
  return { continue: false, stopReason: message };
}

async function readStdin() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  if (raw.trim() === '') return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Hook input must be a JSON object.');
    }
    return value;
  } catch (error) {
    throw new Error(
      `Obsidian agents Hook received malformed JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function runCli(phase) {
  const command = process.env.CTHUTOOL_CLI ?? (process.platform === 'win32' ? 'chc.cmd' : 'chc');
  const args = [
    'obsidian',
    'agents',
    'sync',
    '--phase',
    phase,
    '--json',
    '--no-interactive',
  ];
  const useWindowsCommandShim =
    process.platform === 'win32' && /\.(?:cmd|bat)$/iu.test(command);
  const spawnCommand = useWindowsCommandShim
    ? process.env.ComSpec ?? 'cmd.exe'
    : command;
  const spawnArgs = useWindowsCommandShim
    ? ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')]
    : args;
  return new Promise((resolve, reject) => {
    const child = spawn(spawnCommand, spawnArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      let parsed;
      try {
        parsed = stdout.trim() ? JSON.parse(stdout) : undefined;
      } catch {
        parsed = undefined;
      }
      if (code === 0 && parsed?.ok === true) {
        resolve(parsed);
        return;
      }
      const message =
        parsed?.error?.message ||
        stderr.trim() ||
        `chc obsidian agents sync exited with code ${code ?? 1}.`;
      const error = new Error(message);
      error.code = parsed?.error?.code;
      reject(error);
    });
  });
}

function quoteWindowsArg(value) {
  if (!/[\s"&^<>|]/u.test(value)) return value;
  return `"${value.replaceAll('"', '\\"')}"`;
}

try {
  const phase = process.argv.includes('--phase')
    ? process.argv[process.argv.indexOf('--phase') + 1]
    : undefined;
  if (phase !== 'before' && phase !== 'after') {
    writeJson(hookFailure('after', 'Obsidian agents Hook phase must be before or after.'));
    process.exit(0);
  }

  const input = await readStdin();
  if (phase === 'before' && !isExplicitSkillPrompt(extractPrompt(input))) {
    writeJson({});
    process.exit(0);
  }

  await runCli(phase);
  writeJson({});
} catch (error) {
  const phase = process.argv.includes('--phase')
    ? process.argv[process.argv.indexOf('--phase') + 1]
    : 'after';
  if (phase === 'after' && error?.code === 'obsidian_agents_not_configured') {
    writeJson({});
    process.exit(0);
  }
  writeJson(
    hookFailure(
      phase,
      `Obsidian agents synchronization failed: ${error instanceof Error ? error.message : String(error)}`,
    ),
  );
}
