import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse as parseYaml } from 'yaml';

const supportDirs = new Set([
  'references',
  'scripts',
  'assets',
  'templates',
  'agents',
  'examples',
]);
const metadataDirs = new Set([
  '_org',
  'node_modules',
  '__pycache__',
  'venv',
  'env',
]);
const hash = (data) => createHash('sha256').update(data).digest('hex');
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const inside = (root, path) => {
  const rel = relative(root, path);
  return (
    rel !== '' &&
    rel !== '..' &&
    !rel.startsWith(`..${sep}`) &&
    !isAbsolute(rel)
  );
};
const pathKey = (path) =>
  process.platform === 'win32' ? path.toLowerCase() : path;
const samePath = (left, right) =>
  pathKey(resolve(left)) === pathKey(resolve(right));

function assertRegularPath(path, directory = false) {
  const full = resolve(path);
  let current = full;
  for (;;) {
    const info = lstatSync(current);
    if (info.isSymbolicLink()) throw new Error('symbolic-link');
    if (current === full && !(directory ? info.isDirectory() : info.isFile())) {
      throw new Error('non-regular-path');
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return full;
}

function textFile(path) {
  assertRegularPath(path);
  return readFileSync(path, 'utf8').replace(/^\uFEFF/u, '');
}

function optionalText(path, warnings, label) {
  try {
    return textFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') warnings.push(`${label}: ${error.message}`);
    return null;
  }
}

function jsonFile(path, warnings, label, fallback = null) {
  const text = optionalText(path, warnings, label);
  if (text === null) return fallback;
  try {
    const value = JSON.parse(text);
    if (!object(value)) throw new Error('expected-object');
    return value;
  } catch {
    warnings.push(`${label}: invalid JSON object`);
    return fallback;
  }
}

function readProtectedNames(home, warnings) {
  const names = new Set();
  const sources = [
    [join(home, 'hermes-agent/agent/skill_utils.py'), 'ESSENTIAL_SKILLS'],
    [
      join(home, 'hermes-agent/tools/skill_usage.py'),
      'PROTECTED_BUILTIN_SKILLS',
    ],
  ];
  for (const [path, variable] of sources) {
    const text = optionalText(path, warnings, variable);
    const assignment = text?.match(
      new RegExp(`^${variable}(?:[^=\\n]*)=\\s*([\\s\\S]*)`, 'm'),
    )?.[1];
    if (!assignment) {
      warnings.push(`${variable}: unavailable protected inventory`);
      continue;
    }
    const literal = assignment.match(
      /^(?:frozenset\(\s*(\{[\s\S]*?\})?\s*\)|set\(\s*\)|(\{[\s\S]*?\}))[^\S\r\n]*(?:#[^\n]*)?(?:\r?\n|$)/u,
    );
    const body = (literal?.[1] ?? literal?.[2] ?? '{}')
      .slice(1, -1)
      .replace(/#[^\n]*/gu, '');
    if (
      !literal ||
      !/^\s*(?:(?:'[a-z0-9-]+'|"[a-z0-9-]+")\s*(?:,\s*(?:'[a-z0-9-]+'|"[a-z0-9-]+")\s*)*,?)?\s*$/u.test(
        body,
      )
    ) {
      warnings.push(`${variable}: unsupported protected inventory`);
      continue;
    }
    for (const match of body.matchAll(/['"]([a-z0-9-]+)['"]/gu))
      names.add(match[1]);
  }
  return names;
}

function readHistory(root, warnings) {
  const text = optionalText(
    join(root, '.curator_ledger.jsonl'),
    warnings,
    'ledger',
  );
  const entries = [];
  let complete = text !== null;
  if (text !== null) {
    for (const [index, line] of text.split(/\r?\n/u).entries()) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line);
        if (
          !object(row) ||
          typeof row.skill !== 'string' ||
          typeof row.action !== 'string'
        ) {
          throw new Error('invalid event');
        }
        entries.push(row);
      } catch {
        complete = false;
        warnings.push(`ledger: invalid event at line ${index + 1}`);
      }
    }
  }
  return { entries, complete };
}

function collectFiles(root) {
  const files = [];
  const digest = createHash('sha256');
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name, 'en'),
    )) {
      const path = join(directory, entry.name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) throw new Error('symbolic-link in package');
      if (info.isDirectory()) {
        if (
          metadataDirs.has(entry.name) ||
          ['.git', '.venv'].includes(entry.name)
        ) {
          throw new Error('unreviewed transient directory in package');
        }
        visit(path);
      } else if (info.isFile()) {
        const data = readFileSync(path);
        const after = lstatSync(path);
        if (info.size !== after.size || info.mtimeMs !== after.mtimeMs)
          throw new Error('source changed while scanning');
        if (
          /(?:^|\/)(?:\.env|auth\.json|credentials\.json|id_rsa)$/u.test(
            relative(root, path).replaceAll(sep, '/'),
          ) ||
          /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|ghp_|github_pat_)[A-Za-z0-9_]{20,}/u.test(
            data.toString('utf8'),
          )
        ) {
          throw new Error('credential-like package content');
        }
        const rel = relative(root, path).replaceAll(sep, '/');
        const mode = (info.mode & 0o777).toString(8);
        digest
          .update(`${rel}\0${mode}\0${data.length}\0`)
          .update(data)
          .update('\0');
        files.push({ path: rel, bytes: data.length, mode, sha256: hash(data) });
      } else {
        throw new Error('special file in package');
      }
    }
  }
  visit(root);
  return { files, fingerprint: `sha256:${digest.digest('hex')}` };
}

function provenance(candidate, history, usage) {
  const hints = {
    createdBy: usage?.created_by ?? null,
    createdAt: usage?.created_at ?? null,
  };
  const fallback = (reason) => ({
    classification: 'source-uncertain',
    reason,
    hints,
    evidence: null,
  });
  if (!history.complete)
    return fallback('creation-history-unavailable-or-incomplete');
  const rows = history.entries.filter(
    (entry) => entry.skill === candidate.name,
  );
  const matchesPath = (item) =>
    object(item) &&
    typeof item.path === 'string' &&
    isAbsolute(item.path) &&
    !item.path.split(/[\\/]/u).includes('..') &&
    samePath(item.path, join(candidate.path, 'SKILL.md'));
  let creation = null;
  let latestHash = null;
  for (const entry of rows) {
    const before = Array.isArray(entry.before) ? entry.before : [];
    const after = Array.isArray(entry.after) ? entry.after : [];
    const snapshot = after.find(matchesPath);
    if (entry.action === 'create' && snapshot) {
      if (
        typeof entry.id !== 'string' ||
        !entry.id ||
        typeof entry.ts !== 'string' ||
        !Number.isFinite(Date.parse(entry.ts)) ||
        !['agent', 'user', 'curator'].includes(entry.actor) ||
        !Array.isArray(entry.before) ||
        before.length ||
        !/^[a-f0-9]{64}$/u.test(snapshot.sha256 ?? '')
      ) {
        creation = null;
        latestHash = null;
        continue;
      }
      creation = entry;
      latestHash = snapshot.sha256;
    } else if (creation && (snapshot || before.some(matchesPath))) {
      if (
        ['delete', 'purge', 'archive', 'rollback', 'restored'].includes(
          entry.action,
        ) ||
        !snapshot
      ) {
        creation = null;
        latestHash = null;
      } else {
        const previous = before.find(matchesPath);
        if (
          !previous ||
          previous.sha256 !== latestHash ||
          !/^[a-f0-9]{64}$/u.test(snapshot.sha256 ?? '')
        )
          creation = null;
        latestHash = snapshot.sha256;
      }
    }
  }
  if (!creation) return fallback('no-matching-native-create-event');
  const currentHash = candidate.files.find(
    (entry) => entry.path === 'SKILL.md',
  )?.sha256;
  if (latestHash !== currentHash)
    return fallback('current-content-not-covered-by-ledger');
  return {
    classification: 'recorded-local-creation',
    reason: 'native-create-event',
    hints,
    evidence: {
      ledgerEntryId: creation.id,
      actor: creation.actor,
      timestamp: creation.ts,
      sourceRelativePath: candidate.sourceRelativePath,
    },
  };
}

export function scanHermesSkills({
  hermesHome = process.env.HERMES_HOME || join(homedir(), '.hermes'),
} = {}) {
  const home = resolve(hermesHome);
  const root = join(home, 'skills');
  const warnings = [];
  const report = { root, candidates: [], excluded: [], warnings };
  try {
    assertRegularPath(root, true);
  } catch (error) {
    warnings.push(`skill-root: ${error.message}`);
    return report;
  }
  const ownershipWarnings = [];
  const manifestText = optionalText(
    join(root, '.bundled_manifest'),
    ownershipWarnings,
    'bundled inventory',
  );
  if (manifestText === null)
    ownershipWarnings.push('bundled inventory: unavailable');
  const bundled = new Set();
  for (const line of (manifestText ?? '').split(/\r?\n/u).filter(Boolean)) {
    const entry = line.match(/^([a-z0-9-]+):[a-f0-9]{32}(?:[a-f0-9]{32})?$/u);
    if (entry) bundled.add(entry[1]);
    else ownershipWarnings.push('bundled inventory: unsupported entry');
  }
  const hub = jsonFile(
    join(root, '.hub/lock.json'),
    ownershipWarnings,
    'Hub inventory',
  );
  if (!object(hub?.installed))
    ownershipWarnings.push('Hub inventory: unavailable or invalid');
  const hubNames = new Set(Object.keys(hub?.installed ?? {}));
  const hubPaths = [];
  for (const entry of Object.values(hub?.installed ?? {})) {
    const path =
      typeof entry?.install_path === 'string'
        ? entry.install_path.replaceAll('\\', '/')
        : '';
    if (
      !path ||
      path.split('/').some((part) => !part || part === '.' || part === '..') ||
      /^[A-Za-z]:/u.test(path)
    ) {
      ownershipWarnings.push('Hub inventory: invalid install path');
    } else hubPaths.push(path);
  }
  const protectedNames = readProtectedNames(home, ownershipWarnings);
  let config = {};
  const configText = optionalText(
    join(home, 'config.yaml'),
    ownershipWarnings,
    'Hermes config',
  );
  if (configText !== null) {
    try {
      config = parseYaml(configText);
      if (!object(config)) throw new Error('invalid config');
    } catch {
      ownershipWarnings.push('Hermes config: invalid YAML object');
      config = {};
    }
  }
  const external = config.skills?.external_dirs ?? [];
  if (
    !(typeof external === 'string' || Array.isArray(external)) ||
    (Array.isArray(external) &&
      external.some((path) => typeof path !== 'string'))
  ) {
    ownershipWarnings.push(
      'Hermes config: unsupported external directory inventory',
    );
  }
  const externalDirs = (Array.isArray(external) ? external : [external])
    .filter((path) => typeof path === 'string' && path.trim())
    .map((path) => {
      let expanded = path
        .trim()
        .replace(
          /\$\{([^}]+)\}|\$(\w+)/gu,
          (match, braced, bare) => process.env[braced ?? bare] ?? match,
        );
      if (process.platform === 'win32')
        expanded = expanded.replace(
          /%([^%]+)%/gu,
          (match, name) => process.env[name] ?? match,
        );
      return resolve(home, expanded.replace(/^~(?=$|[\\/])/u, homedir()));
    })
    .filter((path) => !samePath(root, path));
  const usage = jsonFile(join(root, '.usage.json'), warnings, 'usage', {});
  const history = readHistory(root, warnings);
  warnings.push(...ownershipWarnings);
  const exclude = (path, reason, name) =>
    report.excluded.push({
      path,
      sourceRelativePath: relative(root, path).replaceAll(sep, '/'),
      name: name ?? null,
      reason,
    });

  function visit(directory) {
    let children;
    try {
      children = readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      warnings.push(`directory ${relative(root, directory)}: ${error.message}`);
      return;
    }
    for (const entry of children.sort((a, b) =>
      a.name.localeCompare(b.name, 'en'),
    )) {
      const path = join(directory, entry.name);
      const rel = relative(root, path).replaceAll(sep, '/');
      let info;
      try {
        info = lstatSync(path);
      } catch (error) {
        exclude(path, error.code);
        continue;
      }
      if (info.isSymbolicLink()) {
        exclude(path, 'symbolic-link');
        continue;
      }
      if (!info.isDirectory()) continue;
      if (
        entry.name.startsWith('.') ||
        metadataDirs.has(entry.name) ||
        supportDirs.has(entry.name) ||
        ['archive', 'archives', 'backup', 'backups', 'cache'].includes(
          entry.name,
        )
      )
        continue;
      if (!inside(root, path)) {
        exclude(path, 'outside-skill-root');
        continue;
      }
      if (
        externalDirs.some(
          (externalRoot) =>
            samePath(externalRoot, path) || inside(externalRoot, path),
        )
      ) {
        exclude(path, 'external-owned');
        continue;
      }
      if (
        hubPaths.some(
          (hubPath) =>
            pathKey(rel) === pathKey(hubPath) ||
            pathKey(rel).startsWith(`${pathKey(hubPath)}/`),
        )
      ) {
        exclude(path, 'hub-managed');
        continue;
      }
      let content;
      try {
        content = textFile(join(path, 'SKILL.md'));
      } catch (error) {
        if (error.code === 'ENOENT') {
          visit(path);
          continue;
        }
        exclude(path, error.message);
        continue;
      }
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u);
      let meta;
      try {
        meta = match ? parseYaml(match[1]) : null;
      } catch {
        meta = null;
      }
      if (
        !object(meta) ||
        !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(meta.name ?? '') ||
        typeof meta.description !== 'string' ||
        !meta.description.trim()
      ) {
        exclude(path, 'invalid-skill-frontmatter');
        continue;
      }
      const usageRecord = usage[meta.name] ?? usage[rel];
      const record = object(usageRecord) ? usageRecord : {};
      if (
        bundled.has(meta.name) ||
        bundled.has(entry.name) ||
        bundled.has(rel)
      ) {
        exclude(path, 'bundled', meta.name);
        continue;
      }
      if (hubNames.has(meta.name) || record.created_by === 'installed') {
        exclude(path, 'hub-or-installed', meta.name);
        continue;
      }
      if (protectedNames.has(meta.name)) {
        exclude(path, 'protected', meta.name);
        continue;
      }
      const optoutWarnings = [];
      const legacy = jsonFile(
        join(path, '.hermes-evolution.json'),
        optoutWarnings,
        'legacy marker',
      );
      const policies = [meta, meta.metadata, meta.metadata?.hermes, legacy];
      if (
        policies.some(
          (value) => value?.sync === false || value?.absorb === false,
        )
      ) {
        exclude(path, 'opted-out', meta.name);
        continue;
      }
      if (ownershipWarnings.length) {
        exclude(path, 'ownership-inventory-unavailable', meta.name);
        continue;
      }
      try {
        const candidate = {
          name: meta.name,
          path,
          sourceRelativePath: rel,
          description: meta.description,
          ...collectFiles(path),
          warnings: optoutWarnings,
        };
        for (const file of candidate.files.filter((file) =>
          file.path.endsWith('.md'),
        )) {
          const body = textFile(join(path, file.path));
          for (const link of body.matchAll(/\]\(([^)]+)\)/gu)) {
            const ref = link[1].split('#')[0];
            if (!ref || /^[a-z][a-z0-9+.-]*:/iu.test(ref)) continue;
            const target = resolve(dirname(join(path, file.path)), ref);
            if (!inside(path, target)) throw new Error('escaping-reference');
            assertRegularPath(target);
          }
        }
        candidate.provenance = provenance(candidate, history, record);
        if (legacy)
          candidate.warnings.push('legacy Evolution marker is an origin claim');
        candidate.action =
          candidate.provenance.classification === 'recorded-local-creation'
            ? 'Skip / Promote'
            : 'Skip / Confirm local source + Promote';
        report.candidates.push(candidate);
      } catch (error) {
        exclude(path, error.message, meta.name);
      }
    }
  }
  visit(root);
  const names = new Map();
  for (const candidate of report.candidates)
    names.set(candidate.name, (names.get(candidate.name) ?? 0) + 1);
  for (const candidate of report.candidates) {
    if (names.get(candidate.name) > 1)
      candidate.warnings.push(
        'duplicate Skill name; resolve target collision by exact path',
      );
  }
  return report;
}

if (
  process.argv[1] &&
  samePath(fileURLToPath(import.meta.url), process.argv[1])
) {
  try {
    const { values } = parseArgs({
      options: { 'hermes-home': { type: 'string' }, help: { type: 'boolean' } },
    });
    if (values.help)
      process.stdout.write(
        'Read-only Hermes inventory: node scan-hermes-skills.mjs [--hermes-home <path>]\n',
      );
    else
      process.stdout.write(
        `${JSON.stringify(scanHermesSkills({ hermesHome: values['hermes-home'] }), null, 2)}\n`,
      );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
