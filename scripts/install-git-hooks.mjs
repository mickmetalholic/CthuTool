#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ensureAiTooling } from './ensure-ai-tooling.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(scriptPath), '..');
const trackedHooksPath = '.githooks';

function enabled(value) {
  return Boolean(value) && value !== '0' && value !== 'false';
}

export const runGitHookCommand = (
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

export async function installGitHooks({
  cwd = repoRoot,
  env = process.env,
  runner = runGitHookCommand,
  ensure = ensureAiTooling,
  logger = console,
} = {}) {
  if (enabled(env.CTHUTOOL_DISABLE_GIT_HOOKS)) {
    logger.log(
      'Repository hook installation skipped (CTHUTOOL_DISABLE_GIT_HOOKS is set).',
    );
    return { status: 'skipped', reason: 'disabled' };
  }
  if (enabled(env.CI)) {
    logger.log('Repository hook installation skipped in CI.');
    return { status: 'skipped', reason: 'ci' };
  }

  const git = (args) => runner('git', args, { cwd, env });
  const worktree = await git(['rev-parse', '--is-inside-work-tree']);
  if (worktree.code !== 0 || worktree.stdout.trim() !== 'true') {
    logger.log('Repository hook installation skipped outside a Git worktree.');
    return { status: 'skipped', reason: 'not_git' };
  }

  const current = await git([
    'config',
    '--local',
    '--get',
    'core.hooksPath',
  ]);
  let status = 'already_configured';
  if (current.code !== 0 || current.stdout.trim() !== trackedHooksPath) {
    const configured = await git([
      'config',
      '--local',
      'core.hooksPath',
      trackedHooksPath,
    ]);
    if (configured.code !== 0) {
      throw new Error(
        `Unable to configure core.hooksPath=${trackedHooksPath}: ${configured.stderr.trim() || configured.stdout.trim()}`,
      );
    }
    status = 'configured';
    logger.log(`Configured core.hooksPath=${trackedHooksPath}.`);
  } else {
    logger.log(`core.hooksPath is already ${trackedHooksPath}.`);
  }

  const bootstrap = await ensure({ cwd, env, logger });
  return { status, bootstrap: bootstrap.status };
}

async function main() {
  try {
    await installGitHooks();
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
