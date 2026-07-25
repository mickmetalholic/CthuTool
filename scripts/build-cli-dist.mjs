import { spawn, spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  readdir,
  rm,
  stat,
} from 'node:fs/promises';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const bunVersion = process.env.BUN_VERSION ?? '1.3.11';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cliRoot = join(repoRoot, 'apps', 'cli');
const sourceScriptsRoot = join(cliRoot, 'src', 'scripts');
const outputRoot = resolve(
  process.argv[2] ?? join(cliRoot, 'dist'),
);

if (outputRoot === parse(outputRoot).root) {
  throw new Error(`Refusing unsafe CLI output directory: ${outputRoot}`);
}

const fileExists = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};

const localBun = spawnSync('bun', ['--version'], {
  encoding: 'utf8',
});
const bunCommand =
  localBun.status === 0 && localBun.stdout.trim() === bunVersion
    ? { args: [], command: 'bun' }
    : {
        args: ['dlx', `bun@${bunVersion}`],
        command: 'pnpm',
      };

const runBun = async (args) => {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      bunCommand.command,
      [...bunCommand.args, ...args],
      {
        cwd: cliRoot,
        stdio: 'inherit',
      },
    );
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Bun build failed with exit code ${code ?? 1}`));
      }
    });
  });
};

const buildArgs = [
  '--target',
  'node',
  '--define',
  'process.env.NODE_ENV="production"',
];

await mkdir(outputRoot, { recursive: true });
await runBun([
  'build',
  'src/index.ts',
  '--outdir',
  outputRoot,
  ...buildArgs,
]);

const outputScriptsRoot = join(outputRoot, 'scripts');
if (dirname(outputScriptsRoot) !== outputRoot) {
  throw new Error(`Refusing unsafe script output directory: ${outputScriptsRoot}`);
}
await rm(outputScriptsRoot, { force: true, recursive: true });
await mkdir(outputScriptsRoot, { recursive: true });

const sourceDirectories = (await readdir(sourceScriptsRoot, {
  withFileTypes: true,
}))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

for (const scriptId of sourceDirectories) {
  const sourceRoot = join(sourceScriptsRoot, scriptId);
  const entryPath = join(sourceRoot, 'index.ts');
  const manifestPath = join(sourceRoot, 'script.json');
  const [hasEntry, hasManifest] = await Promise.all([
    fileExists(entryPath),
    fileExists(manifestPath),
  ]);
  if (hasEntry !== hasManifest) {
    throw new Error(
      `Bundled script ${scriptId} must provide both index.ts and script.json`,
    );
  }
  if (!hasEntry) continue;

  const scriptOutputRoot = join(outputScriptsRoot, scriptId);
  await mkdir(scriptOutputRoot, { recursive: true });
  await runBun([
    'build',
    entryPath,
    '--outfile',
    join(scriptOutputRoot, 'index.js'),
    ...buildArgs,
  ]);
  await copyFile(manifestPath, join(scriptOutputRoot, 'script.json'));
}
