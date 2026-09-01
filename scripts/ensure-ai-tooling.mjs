#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(scriptPath), '..');
const setupScript = resolve(repoRoot, 'scripts', 'setup-ai-tooling.mjs');

const recovery = [
  'Install OpenSpec: npm install -g @fission-ai/openspec@1.8.0',
  'Configure it: openspec config profile core && openspec config set delivery skills',
  'Repair this checkout: pnpm setup:ai-tooling',
].join('\n');

export class AiToolingBootstrapError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AiToolingBootstrapError';
    this.code = code;
  }
}

export const runAiToolingCommand = (
  command,
  args,
  { cwd = repoRoot, env = process.env } = {},
) =>
  new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      resolvePromise({ code: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });

function commandDetail(result) {
  return [result.stderr.trim(), result.stdout.trim()]
    .filter(Boolean)
    .join('\n');
}

function incompleteMessage(summary, result, postCheckout) {
  return [
    `AI tooling initialization is incomplete: ${summary}`,
    commandDetail(result),
    postCheckout
      ? 'Checkout files already exist because post-checkout runs after Git populates the worktree.'
      : undefined,
    recovery,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function ensureAiTooling({
  cwd = repoRoot,
  env = process.env,
  runner = runAiToolingCommand,
  logger = console,
  postCheckout = false,
} = {}) {
  const invoke = (args) => runner(process.execPath, [setupScript, ...args], {
    cwd,
    env,
  });

  const initialCheck = await invoke(['--check']);
  if (initialCheck.code === 0) {
    logger.log('AI tooling is already initialized.');
    return { status: 'valid' };
  }

  const prerequisites = await invoke(['--check-prerequisites']);
  if (prerequisites.code !== 0) {
    throw new AiToolingBootstrapError(
      'prerequisite_failed',
      incompleteMessage(
        'the OpenSpec prerequisite is unavailable or misconfigured.',
        prerequisites,
        postCheckout,
      ),
    );
  }

  logger.log('AI tooling is missing or stale; repairing generated adapters...');
  const setup = await invoke([]);
  if (setup.code !== 0) {
    throw new AiToolingBootstrapError(
      'setup_failed',
      incompleteMessage('adapter setup failed.', setup, postCheckout),
    );
  }

  const finalCheck = await invoke(['--check']);
  if (finalCheck.code !== 0) {
    throw new AiToolingBootstrapError(
      'verification_failed',
      incompleteMessage(
        'adapter verification still fails after setup.',
        finalCheck,
        postCheckout,
      ),
    );
  }

  logger.log('AI tooling initialization complete.');
  return { status: 'repaired' };
}

async function main() {
  try {
    await ensureAiTooling({
      postCheckout: process.argv.slice(2).includes('--post-checkout'),
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
