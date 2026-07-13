#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cliRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const entrypoint = join(cliRoot, 'dist', 'index.js');

if (!existsSync(entrypoint)) {
  process.stderr.write(
    'Failed to start chc. Missing apps/cli/dist/index.js; run pnpm --filter @cthutool/cli build first.\n',
  );
  process.exitCode = 1;
} else {
  await import(pathToFileURL(entrypoint).href);
}
