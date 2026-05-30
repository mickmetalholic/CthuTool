import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to `apps/cli/src/scripts` for this build. */
export function getBundledScriptsRoot(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(moduleDir, '../scripts'),
    join(moduleDir, '../src/scripts'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}
