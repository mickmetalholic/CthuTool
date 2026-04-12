import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to `apps/cli/src/scripts` for this build. */
export function getBundledScriptsRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '../scripts');
}
