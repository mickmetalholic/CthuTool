#!/usr/bin/env node
/**
 * Idempotent AI tooling setup and check for CthuTool.
 *
 * - Ensures OpenSpec core adapters for agents/codex, cursor, and opencode
 * - Links (default) or copies project skills from skills/ into agent skill trees
 * - Never modifies codex/plugins/cthu-codex
 */

import { spawn } from 'node:child_process';
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_OPENSPEC = '1.8.0';
const REQUIRED_OPENSPEC_PROFILE = 'core';
const REQUIRED_OPENSPEC_DELIVERY = 'skills';
const OPENSPEC_TOOLS = 'agents,codex,cursor,opencode';
const CORE_SKILLS = [
  'openspec-explore',
  'openspec-propose',
  'openspec-apply-change',
  'openspec-update-change',
  'openspec-sync-specs',
  'openspec-archive-change',
];
const BASELINE_SKILLS = ['repo-orientation', 'project-verify', 'review-diff'];
const AGENT_SKILL_ROOTS = [
  join(repoRoot, '.agents', 'skills'),
  join(repoRoot, '.cursor', 'skills'),
  join(repoRoot, '.opencode', 'skills'),
];
const PROTECTED_PLUGIN = join(repoRoot, 'codex', 'plugins', 'cthu-codex');
const CONFIG_PATH = join(repoRoot, 'openspec', 'config.yaml');
const SKILLS_SOURCE = join(repoRoot, 'skills');
const LEGACY_OPENSPEC_NAMES = [
  'openspec-continue-change',
  'openspec-ff-change',
  'openspec-new-change',
  'openspec-verify-change',
];

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const copyMode = args.has('--copy');

const run = (command, commandArgs, options = {}) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repoRoot,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      shell: process.platform === 'win32',
      ...options.spawn,
    });
    let stdout = '';
    let stderr = '';
    if (options.capture) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr, code });
      } else {
        const error = new Error(
          `${command} ${commandArgs.join(' ')} failed with exit code ${code ?? 1}`,
        );
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });
  });

const pathExists = async (path) => {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
};

const parseVersion = (value) =>
  value
    .trim()
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);

const versionAtLeast = (actual, required) => {
  const a = parseVersion(actual);
  const r = parseVersion(required);
  for (let i = 0; i < Math.max(a.length, r.length); i += 1) {
    const left = a[i] ?? 0;
    const right = r[i] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
};

const ensureOpenspecVersion = async () => {
  const { stdout } = await run('openspec', ['--version'], { capture: true });
  const version = stdout.trim();
  if (!versionAtLeast(version, REQUIRED_OPENSPEC)) {
    throw new Error(
      `OpenSpec ${REQUIRED_OPENSPEC}+ required; found ${version}. Install with: npm install -g @fission-ai/openspec@${REQUIRED_OPENSPEC}`,
    );
  }
  return version;
};

const getOpenspecConfigIssues = async () => {
  try {
    const { stdout } = await run('openspec', ['config', 'list', '--json'], {
      capture: true,
    });
    const config = JSON.parse(stdout);
    const issues = [];
    const profile = config.profile ?? 'core';
    const delivery = config.delivery ?? 'both';
    if (profile !== REQUIRED_OPENSPEC_PROFILE) {
      issues.push(
        `OpenSpec profile must be ${REQUIRED_OPENSPEC_PROFILE}; found ${profile}. Run: openspec config profile ${REQUIRED_OPENSPEC_PROFILE}`,
      );
    }
    if (delivery !== REQUIRED_OPENSPEC_DELIVERY) {
      issues.push(
        `OpenSpec delivery must be ${REQUIRED_OPENSPEC_DELIVERY}; found ${delivery}. Run: openspec config set delivery ${REQUIRED_OPENSPEC_DELIVERY}`,
      );
    }
    return issues;
  } catch (error) {
    return [`Unable to read OpenSpec global configuration: ${error.message}`];
  }
};

const listDirs = async (root) => {
  if (!(await pathExists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => entry.name);
};

const validateSkillEntry = async (skillName, root) => {
  const entry = join(root, skillName);
  const label = relative(repoRoot, entry);
  try {
    const entryStats = await lstat(entry);
    if (!entryStats.isDirectory() && !entryStats.isSymbolicLink()) {
      return `Skill entry is not a directory or symlink: ${label}`;
    }
    const resolvedEntry = await realpath(entry);
    const resolvedStats = await lstat(resolvedEntry);
    if (!resolvedStats.isDirectory()) {
      return `Skill entry target is not a directory: ${label}`;
    }
    const content = await readFile(join(resolvedEntry, 'SKILL.md'), 'utf8');
    if (!content.trim()) {
      return `Skill entry has an empty SKILL.md: ${label}`;
    }
    const declaredName = content.match(/^name:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1];
    if (declaredName !== skillName) {
      return `Skill entry SKILL.md declares ${declaredName ?? '(no name)'} instead of ${skillName}: ${label}`;
    }
    return null;
  } catch (error) {
    return `Invalid skill entry ${label}: ${error.message}`;
  }
};

const linkOrCopySkill = async (skillName, targetRoot) => {
  const source = join(SKILLS_SOURCE, skillName);
  const target = join(targetRoot, skillName);
  if (!(await pathExists(source))) {
    throw new Error(`Missing canonical skill source: ${relative(repoRoot, source)}`);
  }
  await mkdir(targetRoot, { recursive: true });
  if (await pathExists(target)) {
    await rm(target, { recursive: true, force: true });
  }
  if (copyMode) {
    await cp(source, target, { recursive: true });
  } else {
    await symlink(source, target, 'dir');
  }
};

const installBaselineSkills = async () => {
  for (const root of AGENT_SKILL_ROOTS) {
    for (const skill of BASELINE_SKILLS) {
      await linkOrCopySkill(skill, root);
    }
  }
};

const removeLegacyOpenSpecCopies = async () => {
  const legacyRoots = [
    join(repoRoot, '.codex', 'skills'),
    join(repoRoot, '.claude', 'skills'),
    join(repoRoot, '.cursor', 'skills'),
    join(repoRoot, '.agents', 'skills'),
    join(repoRoot, '.opencode', 'skills'),
  ];
  for (const root of legacyRoots) {
    for (const name of LEGACY_OPENSPEC_NAMES) {
      const path = join(root, name);
      if (await pathExists(path)) {
        await rm(path, { recursive: true, force: true });
      }
    }
  }
};

const regenerateOpenSpec = async () => {
  const configBackup = await readFile(CONFIG_PATH, 'utf8');
  try {
    await run('openspec', [
      'init',
      '--tools',
      OPENSPEC_TOOLS,
      '--profile',
      'core',
      '--force',
      '--no-animation',
    ]);
  } finally {
    await writeFile(CONFIG_PATH, configBackup, 'utf8');
  }
  await run('openspec', ['update', '--force']);
  await writeFile(CONFIG_PATH, configBackup, 'utf8');
};

const assertNoProtectedPluginChanges = async () => {
  const { stdout } = await run(
    'git',
    ['status', '--porcelain', '--', 'codex/plugins/cthu-codex'],
    { capture: true },
  );
  if (stdout.trim()) {
    throw new Error(
      `Protected plugin has local changes; setup must not modify it:\n${stdout}`,
    );
  }
};

const collectIssues = async () => {
  const issues = [];
  try {
    await ensureOpenspecVersion();
  } catch (error) {
    issues.push(error.message);
  }
  issues.push(...(await getOpenspecConfigIssues()));

  for (const root of AGENT_SKILL_ROOTS) {
    const label = relative(repoRoot, root);
    const names = await listDirs(root);
    for (const skill of CORE_SKILLS) {
      if (!names.includes(skill)) {
        issues.push(`Missing OpenSpec skill ${skill} under ${label}`);
      } else {
        const skillIssue = await validateSkillEntry(skill, root);
        if (skillIssue) issues.push(skillIssue);
      }
    }
    for (const skill of BASELINE_SKILLS) {
      if (!names.includes(skill)) {
        issues.push(`Missing baseline skill ${skill} under ${label}`);
      } else {
        const skillIssue = await validateSkillEntry(skill, root);
        if (skillIssue) issues.push(skillIssue);
      }
    }
    for (const name of LEGACY_OPENSPEC_NAMES) {
      if (names.includes(name)) {
        issues.push(`Obsolete OpenSpec skill under ${label}/${name}; use the core workflow set instead`);
      }
    }
  }

  const banned = [
    join(repoRoot, '.codex', 'skills', 'ui-ux-pro-max'),
    join(repoRoot, '.cursor', 'skills', 'ui-ux-pro-max'),
    join(repoRoot, '.claude', 'skills', 'ui-ux-pro-max'),
    join(repoRoot, 'reasonix.toml'),
  ];
  for (const path of banned) {
    if (await pathExists(path)) {
      issues.push(`Stale path should be removed: ${relative(repoRoot, path)}`);
    }
  }

  for (const root of [
    join(repoRoot, '.codex', 'skills'),
    join(repoRoot, '.claude', 'skills'),
  ]) {
    for (const name of [...CORE_SKILLS, ...LEGACY_OPENSPEC_NAMES]) {
      if (await pathExists(join(root, name))) {
        issues.push(
          `Obsolete OpenSpec copy under ${relative(repoRoot, root)}/${name}; use shared/native generated surfaces instead`,
        );
      }
    }
  }

  if (!(await pathExists(PROTECTED_PLUGIN))) {
    issues.push('Expected business plugin directory codex/plugins/cthu-codex is missing');
  }

  return issues;
};

const main = async () => {
  process.chdir(repoRoot);
  const version = await ensureOpenspecVersion();
  const configIssues = await getOpenspecConfigIssues();

  if (!checkOnly && configIssues.length) {
    console.error('AI tooling setup blocked by OpenSpec configuration:');
    for (const issue of configIssues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  if (!checkOnly) {
    console.log(`OpenSpec ${version}; regenerating adapters for ${OPENSPEC_TOOLS}`);
    await regenerateOpenSpec();
    await removeLegacyOpenSpecCopies();
    await installBaselineSkills();
    await assertNoProtectedPluginChanges();
    console.log(
      copyMode
        ? 'Baseline skills copied into agent skill trees.'
        : 'Baseline skills symlinked into agent skill trees.',
    );
  }

  const issues = await collectIssues();
  if (issues.length) {
    console.error('AI tooling check failed:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    checkOnly
      ? 'AI tooling check passed.'
      : 'AI tooling setup complete and verified.',
  );
};

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
