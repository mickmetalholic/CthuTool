#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const cliDistPath = 'apps/cli/dist/index.js';

const exactCliDistInputs = new Set([
  'apps/cli/bun.lock',
  'apps/cli/package.json',
  'apps/cli/tsconfig.json',
  'package.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
]);

export function normalizeGitPath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function isCliDistInputPath(path) {
  const normalized = normalizeGitPath(path);
  return (
    normalized.startsWith('apps/cli/src/') ||
    exactCliDistInputs.has(normalized)
  );
}

export function getCliDistInputPaths(paths) {
  return paths.map(normalizeGitPath).filter(isCliDistInputPath);
}

function splitLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`,
    );
  }

  return result.stdout ?? '';
}

export function getStagedPaths({ cwd, commandRunner = runCommand } = {}) {
  return splitLines(
    commandRunner('git', ['diff', '--cached', '--name-only'], {
      cwd,
      capture: true,
    }),
  );
}

export function runPrecommitCliDistRefresh({
  cwd = process.cwd(),
  commandRunner = runCommand,
  stagedPaths,
  logger = console,
} = {}) {
  const effectiveStagedPaths =
    stagedPaths ?? getStagedPaths({ cwd, commandRunner });
  const matchedPaths = getCliDistInputPaths(effectiveStagedPaths);
  if (matchedPaths.length === 0) {
    logger.log('CLI dist refresh: no staged CLI bundle inputs; skipping.');
    return { refreshed: false, matchedPaths };
  }

  logger.log('CLI dist refresh: staged CLI bundle inputs detected:');
  for (const path of matchedPaths) {
    logger.log(`- ${path}`);
  }

  logger.log('CLI dist refresh: building @cthutool/cli...');
  commandRunner('pnpm', ['--filter', '@cthutool/cli', 'build'], { cwd });

  logger.log(`CLI dist refresh: staging ${cliDistPath}...`);
  commandRunner('git', ['add', cliDistPath], { cwd });

  logger.log('CLI dist refresh: verifying committed bundle...');
  commandRunner('pnpm', ['run', 'check:cli-dist'], { cwd });

  return { refreshed: true, matchedPaths };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runPrecommitCliDistRefresh();
  } catch (error) {
    console.error('CLI dist refresh failed.');
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      'Run `pnpm install`, then `pnpm --filter @cthutool/cli build` and `pnpm run check:cli-dist` to diagnose manually.',
    );
    process.exitCode = 1;
  }
}
