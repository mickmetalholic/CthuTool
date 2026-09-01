#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function buildWorkspaceDependencies(
  packageNames,
  {
    env = process.env,
    platform = process.platform,
    run = spawnSync,
  } = {},
) {
  if (packageNames.length === 0) {
    throw new Error('At least one workspace dependency is required.');
  }

  // Turbo already builds workspace dependencies through the task's ^build edge.
  // Rebuilding them inside a running task can make parallel consumers observe a
  // partially-written dist directory.
  if (env.TURBO_HASH) {
    return 0;
  }

  const command =
    platform === 'win32' ? (env.ComSpec ?? env.COMSPEC ?? 'cmd.exe') : 'pnpm';
  const commandPrefix =
    platform === 'win32' ? ['/d', '/s', '/c', 'pnpm'] : [];
  for (const packageName of packageNames) {
    const result = run(
      command,
      [...commandPrefix, '--filter', packageName, 'build'],
      {
        env,
        stdio: 'inherit',
      },
    );
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }

  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = buildWorkspaceDependencies(process.argv.slice(2));
}
