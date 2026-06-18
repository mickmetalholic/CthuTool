#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function repoRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

const RULE_DESCRIPTIONS = {
  'body-leading-blank': 'Separate body from subject with a blank line',
  'body-max-line-length': (value) => `Body lines must be at most ${value} characters`,
  'footer-leading-blank': 'Separate footer from body with a blank line',
  'footer-max-line-length': (value) => `Footer lines must be at most ${value} characters`,
  'header-max-length': (value) => `Header must be at most ${value} characters`,
  'header-trim': 'Header must not have leading or trailing whitespace',
  'scope-case': (value) => `Scope must use ${value}`,
  'subject-case': (value) => `Subject must not use: ${value.join(', ')}`,
  'subject-empty': 'Subject is required',
  'subject-full-stop': (value) => `Subject must not end with "${value}"`,
  'type-case': (value) => `Type must use ${value}`,
  'type-empty': 'Type is required',
  'type-enum': (value) => `Allowed types: ${value.join(', ')}`,
  'no-cjk-in-commit':
    'Subject, body, and footer must be English only (CJK U+4E00–U+9FFF is not allowed)',
};

function describeRule(name, rule) {
  const [level, when, ...rest] = rule;
  if (level === 0) {
    return null;
  }

  const severity = level === 2 ? 'error' : 'warning';
  const value = rest.length <= 1 ? rest[0] : rest;
  const describe = RULE_DESCRIPTIONS[name];

  let text;
  if (typeof describe === 'function') {
    text = describe(value);
  } else if (describe) {
    text = describe;
  } else {
    text = `${when} ${JSON.stringify(value)}`;
  }

  return { name, severity, text };
}

function extractIgnores(configSource) {
  const ignores = [];

  for (const match of configSource.matchAll(/startsWith\((['"])(.*?)\1\)/g)) {
    ignores.push(`Message starts with ${JSON.stringify(match[2])}`);
  }

  for (const match of configSource.matchAll(/\/(\^[^/]+)\/\.test/g)) {
    ignores.push(`Message matches /${match[1]}/`);
  }

  return ignores;
}

function loadResolvedConfig(root) {
  const output = execFileSync('pnpm', ['exec', 'commitlint', '--print-config', 'json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return JSON.parse(output.trim());
}

function printRules() {
  const root = repoRoot();
  const config = loadResolvedConfig(root);
  const configSource = readFileSync(join(root, 'commitlint.config.cjs'), 'utf8');
  const ignores = extractIgnores(configSource);

  const lines = ['# Commit message rules', ''];

  if (config.extends?.length) {
    lines.push(`Extends: ${config.extends.join(', ')}`, '');
  }

  lines.push('## Enforced rules', '');

  const rules = Object.entries(config.rules ?? {})
    .map(([name, rule]) => describeRule(name, rule))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const rule of rules) {
    lines.push(`- [${rule.severity}] ${rule.text}`);
  }

  if (ignores.length > 0) {
    lines.push('', '## Exempt messages (not rewritten to Conventional Commits)', '');
    for (const ignore of ignores) {
      lines.push(`- ${ignore}`);
    }
  }

  lines.push(
    '',
    '## Format',
    '',
    'Use Conventional Commits: `type(scope): subject`',
    'Scope is optional. Write subject, body, and footer in English imperative mood.',
    'For breaking changes, add an English `BREAKING CHANGE:` footer.',
  );

  process.stdout.write(`${lines.join('\n')}\n`);
}

function validateMessage(message) {
  const root = repoRoot();

  try {
    execFileSync('pnpm', ['exec', 'commitlint'], {
      cwd: root,
      input: message,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    process.stdout.write('OK\n');
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim();
    process.stderr.write(output ? `${output}\n` : `${String(error)}\n`);
    process.exit(error.status ?? 1);
  }
}

const [command, ...args] = process.argv.slice(2);

if (command === 'validate') {
  const message = args.join(' ');
  if (!message) {
    process.stderr.write('Usage: print-rules.mjs validate "<commit message>"\n');
    process.exit(1);
  }
  validateMessage(message);
} else {
  printRules();
}
