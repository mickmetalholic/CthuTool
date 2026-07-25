#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const target = process.argv[2];
const targets = {
  'backend-image': {
    workspacePackage: '@cthutool/backend',
    extraPaths: [
      '.github/workflows/backend.yml',
      'k8s/**',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig.json',
    ],
  },
  'desktop-artifacts': {
    workspacePackage: '@cthutool/desktop',
    extraPaths: [
      '.github/workflows/desktop.yml',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      'turbo.json',
    ],
  },
  'cli-dist': {
    workspacePackage: '@cthutool/cli',
    extraPaths: [
      '.github/workflows/cli.yml',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'scripts/build-cli-dist.sh',
      'scripts/build-cli-dist.mjs',
      'scripts/check-cli-dist.sh',
      'scripts/check-cli-dist.mjs',
      'scripts/run-bun.sh',
      'tsconfig.json',
    ],
  },
};

if (!target || !targets[target]) {
  console.error(
    `Usage: node scripts/ci/affected-workflow.mjs ${Object.keys(targets).join('|')}`,
  );
  process.exit(2);
}

const changedFiles = getChangedFiles();
const watchedPaths = getWatchedPaths(targets[target]);
const changed = changedFiles.some((file) =>
  watchedPaths.some((pattern) => matchesPattern(file, pattern)),
);

console.log(`target=${target}`);
console.log(`changed=${changed}`);
console.log(`watched_paths=${watchedPaths.join(',')}`);
if (changedFiles.length > 0) {
  console.log(`changed_files=${changedFiles.join(',')}`);
}

if (process.env.GITHUB_OUTPUT) {
  appendOutput('changed', String(changed));
}

function getChangedFiles() {
  if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    return ['package.json'];
  }

  if (process.env.CI_CHANGED_FILES) {
    return process.env.CI_CHANGED_FILES.split(/[\n,]/)
      .map((file) => normalizePath(file.trim()))
      .filter(Boolean);
  }

  const event = readGitHubEvent();
  if (event?.pull_request?.base?.sha) {
    return gitChangedFiles([`${event.pull_request.base.sha}...HEAD`]);
  }
  if (event?.before && !/^0+$/.test(event.before)) {
    return gitChangedFiles([event.before, 'HEAD']);
  }

  const baseRef = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : 'origin/main';
  return gitChangedFiles([`${baseRef}...HEAD`]);
}

function readGitHubEvent() {
  if (!process.env.GITHUB_EVENT_PATH || !existsSync(process.env.GITHUB_EVENT_PATH)) {
    return undefined;
  }
  return JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
}

function gitChangedFiles(args) {
  const output = execFileSync('git', ['diff', '--name-only', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((file) => normalizePath(file.trim()))
    .filter(Boolean);
}

function getWatchedPaths(config) {
  const paths = new Set(config.extraPaths);
  if (config.workspacePackage) {
    for (const packageDir of collectWorkspacePackageDirs(config.workspacePackage)) {
      paths.add(`${packageDir}/**`);
    }
  }
  return [...paths].sort();
}

function collectWorkspacePackageDirs(rootPackageName) {
  const packages = readWorkspacePackages();
  const seen = new Set();
  const visit = (packageName) => {
    const workspacePackage = packages.get(packageName);
    if (!workspacePackage || seen.has(workspacePackage.dir)) {
      return;
    }
    seen.add(workspacePackage.dir);
    for (const dependencyName of workspacePackage.workspaceDependencies) {
      visit(dependencyName);
    }
  };
  visit(rootPackageName);
  return [...seen].sort();
}

function readWorkspacePackages() {
  const packages = new Map();
  for (const area of ['apps', 'packages']) {
    const areaDir = join(repoRoot, area);
    for (const entry of readdirSync(areaDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const packageJsonPath = join(areaDir, entry.name, 'package.json');
      if (!existsSync(packageJsonPath)) {
        continue;
      }
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      packages.set(packageJson.name, {
        dir: normalizePath(relative(repoRoot, dirname(packageJsonPath))),
        workspaceDependencies: workspaceDependencies(packageJson),
      });
    }
  }
  return packages;
}

function workspaceDependencies(packageJson) {
  return [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.peerDependencies,
    packageJson.optionalDependencies,
  ].flatMap((dependencies) =>
    Object.entries(dependencies ?? {})
      .filter(([, version]) => String(version).startsWith('workspace:'))
      .map(([name]) => name),
  );
}

function matchesPattern(file, pattern) {
  const normalizedFile = normalizePath(file);
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern === '__workflow_dispatch__') {
    return true;
  }
  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }
  return normalizedFile === normalizedPattern;
}

function normalizePath(file) {
  return file.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

function appendOutput(name, value) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
