import { spawn } from 'node:child_process';
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expectedRoot = join(repoRoot, 'apps', 'cli', 'dist');
const buildScript = join(repoRoot, 'scripts', 'build-cli-dist.mjs');
const actualRoot = await mkdtemp(join(tmpdir(), 'cthutool-cli-dist-'));
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const runCommand = async (command, args, failureLabel) => {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${failureLabel} failed with exit code ${code ?? 1}`));
      }
    });
  });
};

const listFiles = async (root) => {
  const files = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        files.push(relative(root, path).replaceAll('\\', '/'));
      }
    }
  };
  await visit(root);
  return files.sort((left, right) => left.localeCompare(right));
};

try {
  if (!(await stat(join(expectedRoot, 'index.js'))).isFile()) {
    throw new Error(`Missing committed CLI bundle: ${expectedRoot}`);
  }
  await runCommand(
    pnpmCommand,
    ['--filter', '@cthutool/cli', 'run', 'build:deps'],
    'CLI dependency build',
  );
  await runCommand(
    process.execPath,
    [buildScript, actualRoot],
    'CLI rebuild',
  );

  const [expectedFiles, actualFiles] = await Promise.all([
    listFiles(expectedRoot),
    listFiles(actualRoot),
  ]);
  if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles)) {
    throw new Error(
      `Committed CLI bundle file set is stale: ${expectedRoot}`,
    );
  }
  for (const relativePath of expectedFiles) {
    const [expected, actual] = await Promise.all([
      readFile(join(expectedRoot, relativePath)),
      readFile(join(actualRoot, relativePath)),
    ]);
    if (!expected.equals(actual)) {
      throw new Error(
        `Committed CLI bundle is stale: ${join(expectedRoot, relativePath)}`,
      );
    }
  }
  process.stdout.write(`CLI bundle is current: ${expectedRoot}\n`);
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.stderr.write('Run: pnpm --filter @cthutool/cli build\n');
  process.exitCode = 1;
} finally {
  await rm(actualRoot, { force: true, recursive: true });
}
