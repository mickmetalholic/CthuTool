import { constants } from 'node:fs';
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
} from 'node:fs/promises';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  assertNoLinks,
  privateRead,
  privateWrite,
} from '../../infra/dotfiles/private-store';
import { digest, readBinding } from '../../infra/dotfiles/source';
import {
  checkedRun,
  type DotfilesSystem,
  readOptional,
} from '../../infra/dotfiles/system';
import { assertCompatibleHost, type Catalog } from './model';
export type ConfigInteraction = {
  selectHost: (ids: string[]) => Promise<string | undefined>;
  chooseFiles: (paths: string[]) => Promise<string[]>;
  resolveFile: (input: {
    path: string;
    local: string;
    rendered: string;
    template: boolean;
    candidate: string;
  }) => Promise<'import' | 'repository' | 'defer' | undefined>;
  reviewCandidate: (path: string) => Promise<boolean>;
};
export function chezmoi(
  system: DotfilesSystem,
  source: string,
  host: string,
  args: string[],
) {
  // A data override selects this invocation; persisted binding remains authoritative otherwise.
  return checkedRun(system, 'chezmoi', [
    '--source',
    source,
    '--destination',
    system.home,
    '--override-data',
    JSON.stringify({ local: { host } }),
    ...args,
  ]);
}
export async function renderedTargets(
  system: DotfilesSystem,
  source: string,
  host: string,
) {
  const dump: Record<
    string,
    { type: string; contents?: string; target?: string }
  > = JSON.parse(
    await chezmoi(system, source, host, ['dump', '--format', 'json']),
  );
  return Object.fromEntries(
    Object.entries(dump)
      .filter(([, entry]) => entry.type === 'file' || entry.type === 'symlink')
      .map(([path, entry]) => [
        join(system.home, path),
        entry.contents ?? entry.target ?? '',
      ]),
  );
}
export async function managedTargets(
  system: DotfilesSystem,
  source: string,
  host: string,
): Promise<string[]> {
  return Object.keys(await renderedTargets(system, source, host));
}
async function renderTarget(
  system: DotfilesSystem,
  source: string,
  host: string,
  target: string,
) {
  const rendered = await renderedTargets(system, source, host);
  if (!(target in rendered))
    throw new Error(`Target is not managed for this host: ${target}`);
  return rendered[target];
}
export async function saveBinding(
  system: DotfilesSystem,
  input: {
    source: string;
    host?: string;
    migrateFrom?: string;
    interactive: boolean;
    interaction: ConfigInteraction;
    catalog: Catalog;
  },
) {
  const old = await readBinding(system);
  let host =
    input.host ??
    (old.host && input.catalog.hosts[old.host] ? old.host : undefined);
  if (!host && input.interactive)
    host = await input.interaction.selectHost(
      Object.keys(input.catalog.hosts).filter((id) => {
        try {
          assertCompatibleHost(input.catalog, id, system);
          return true;
        } catch {
          return false;
        }
      }),
    );
  if (!host)
    throw new Error(
      'Missing host. Run chc dotfiles init --host <published-id>.',
    );
  assertCompatibleHost(input.catalog, host, system);
  const source = await realpath(input.source);
  const configFile =
    old.configFile ||
    (
      await checkedRun(system, 'chezmoi', [
        'execute-template',
        '{{ .chezmoi.configFile }}',
      ])
    ).trim();
  const current = await readOptional(configFile);
  if (
    old.source &&
    resolve(old.source) !== source &&
    (current !== undefined || (await directoryExists(old.source)))
  ) {
    if (
      !input.migrateFrom ||
      (await realpath(input.migrateFrom)) !== (await realpath(old.source))
    )
      throw new Error(
        `Existing chezmoi source ${old.source}. Use init --source ${source} --migrate-from ${old.source} --host ${host}.`,
      );
  }
  const format = extname(configFile).toLowerCase();
  const config = current
    ? format === '.json'
      ? JSON.parse(current)
      : format === '.yaml' || format === '.yml'
        ? parseYaml(current)
        : parseToml(current)
    : {};
  const next = {
    ...config,
    sourceDir: source,
    data: { ...config.data, local: { host } },
  };
  const encoded =
    format === '.json'
      ? `${JSON.stringify(next, null, 2)}\n`
      : format === '.yaml' || format === '.yml'
        ? stringifyYaml(next)
        : stringifyToml(next);
  const backup = join(
    stateRoot(system, source),
    'binding',
    `${Date.now()}-${digest(current ?? '').slice(0, 12)}.backup`,
  );
  if (current !== undefined) await privateWrite(backup, current, system);
  // Validate candidate config before replacing existing configuration.
  const candidate = join(
    stateRoot(system, source),
    'binding',
    `candidate${format || '.toml'}`,
  );
  await privateWrite(candidate, encoded, system);
  try {
    const r = await system.run('chezmoi', [
      '--config',
      candidate,
      'dump-config',
      '--format',
      'json',
    ]);
    if (r.code !== 0)
      throw new Error('New chezmoi configuration did not validate');
    await assertNoLinks(configFile, system.home);
    await mkdir(dirname(configFile), { recursive: true, mode: 0o700 });
    const temp = `${configFile}.chc-tmp`;
    await copyFile(candidate, temp, constants.COPYFILE_EXCL);
    try {
      await rename(temp, configFile);
    } finally {
      await rm(temp, { force: true });
    }
  } finally {
    await rm(candidate, { force: true });
  }
  return {
    source,
    host,
    configFile,
    legacyHint:
      old.host && old.host !== host
        ? old.host
        : process.env.DOTFILES_HOST || undefined,
    previousConfigBackup: current === undefined ? undefined : backup,
  };
}
async function directoryExists(path: string) {
  try {
    return (await lstat(path)).isDirectory();
  } catch {
    return false;
  }
}
export const stateRoot = (s: DotfilesSystem, source: string) =>
  join(s.home, '.cthutool/state/dotfiles', digest(source).slice(0, 24));
type Receipt = {
  version: 1;
  files: Record<
    string,
    {
      decision: 'repository' | 'import' | 'defer';
      sourceDigest: string;
      targetDigest: string;
      backup?: string;
    }
  >;
};
async function receipts(s: DotfilesSystem, source: string): Promise<Receipt> {
  const raw = await privateRead(join(stateRoot(s, source), 'receipts.json'), s);
  if (!raw) return { version: 1, files: {} };
  const r = JSON.parse(raw);
  if (r.version !== 1) throw new Error('Unsupported adoption receipt version');
  return r;
}
function validateTarget(path: string, s: DotfilesSystem) {
  const target = resolve(path.replace(/^~(?=\/|\\|$)/, s.home));
  const rel = relative(s.home, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new Error(
      'Select explicit files under home; do not import the home directory',
    );
  const normalized = rel.replaceAll('\\', '/').toLowerCase();
  if (
    (normalized.startsWith('.ssh/') && normalized !== '.ssh/config') ||
    /(^|\/)(\.cthutool|\.aws|\.gnupg|\.kube|\.git|\.gitconfig|\.netrc|\.npmrc|\.env(?:\..*)?|credentials?|secrets?|id_[^/]+)(\/|$)/.test(
      normalized,
    ) ||
    /\.(pem|key|p12|pfx)$/.test(normalized)
  )
    throw new Error(`Sensitive configuration is excluded: ${rel}`);
  return target;
}
async function fileState(path: string) {
  try {
    const info = await lstat(path);
    if (info.isSymbolicLink())
      return { text: await readlink(path), mode: info.mode, link: true };
    if (!info.isFile())
      throw new Error(
        `Only explicit regular files or links can be reviewed: ${path}`,
      );
    return { text: await readFile(path, 'utf8'), mode: info.mode, link: false };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT')
      return { text: undefined, mode: 0, link: false };
    throw e;
  }
}
const stateDigest = (s: Awaited<ReturnType<typeof fileState>>) =>
  digest(JSON.stringify(s));
async function backupTarget(target: string, source: string, s: DotfilesSystem) {
  const state = await fileState(target);
  if (state.text === undefined) return undefined;
  const path = join(
    stateRoot(s, source),
    'backups',
    `${Date.now()}-${digest(target).slice(0, 16)}.json`,
  );
  await privateWrite(path, JSON.stringify({ target, ...state }), s);
  return path;
}
async function sourcePath(
  s: DotfilesSystem,
  source: string,
  host: string,
  target: string,
) {
  const r = await s.run('chezmoi', [
    '--source',
    source,
    '--destination',
    s.home,
    '--override-data',
    JSON.stringify({ local: { host } }),
    'source-path',
    '--',
    target,
  ]);
  const path =
    r.code === 0
      ? r.stdout.trim()
      : join(
          source,
          'dotfiles/home',
          ...relative(s.home, target)
            .split(sep)
            .map((p) => (p.startsWith('.') ? `dot_${p.slice(1)}` : p)),
        );
  const rel = relative(join(source, 'dotfiles/home'), path);
  if (rel.startsWith('..') || isAbsolute(rel) || !rel)
    throw new Error('Source target must remain inside dotfiles/home');
  return path;
}
export async function adoptFiles(
  s: DotfilesSystem,
  source: string,
  host: string,
  paths: string[],
  interactive: boolean,
  interaction: ConfigInteraction,
) {
  if (!paths.length)
    throw new Error('Usage: chc dotfiles config add <home-path...>');
  if (!interactive)
    throw new Error(
      'Unresolved adoption requires interactive review. Run config add in a terminal.',
    );
  const targets = paths.map((p) => validateTarget(p, s));
  const receipt = await receipts(s, source);
  for (const target of targets) {
    // Never follow a parent directory into another checkout or secret location.
    await assertNoLinks(dirname(target), s.home);
    const local = await fileState(target);
    if (local.text === undefined)
      throw new Error(`Adoption target does not exist: ${target}`);
    const path = await sourcePath(s, source, host, target);
    const template = path.endsWith('.tmpl');
    const old = await readOptional(path);
    const rendered =
      old === undefined ? '' : await renderTarget(s, source, host, target);
    const backup = await backupTarget(target, source, s);
    const candidate = join(
      stateRoot(s, source),
      'review',
      `${digest(target)}${template ? '.tmpl' : '.txt'}`,
    );
    await privateWrite(candidate, old ?? local.text, s);
    const decision =
      (await interaction.resolveFile({
        path: target,
        local: local.text,
        rendered,
        template,
        candidate,
      })) ?? 'defer';
    if (decision === 'import') {
      if (relative(s.home, target).replaceAll('\\', '/') === '.ssh/config')
        throw new Error(
          'SSH host configuration remains local; choose repository or defer.',
        );
      if (local.link)
        throw new Error(
          'Importing links requires a reviewed chezmoi symlink source; use repository/defer for this target.',
        );
      if (template) {
        if (!(await interaction.reviewCandidate(candidate)))
          throw new Error('Template review cancelled; home unchanged.');
        const merged = await readFile(candidate, 'utf8');
        if (!merged.includes('{{') && old?.includes('{{'))
          throw new Error(
            'Template variables were removed; refusing a machine-specific replacement.',
          );
        const probe = await s.run('chezmoi', [
          '--source',
          source,
          '--override-data',
          JSON.stringify({ local: { host } }),
          'execute-template',
          merged,
        ]);
        if (probe.code !== 0)
          throw new Error(
            'Merged template did not render; original source preserved',
          );
        await writeHomeSource(path, merged, source);
      } else await writeHomeSource(path, local.text, source);
    }
    const renderedAfter =
      decision === 'import'
        ? await renderTarget(s, source, host, target)
        : rendered;
    receipt.files[target] = {
      decision,
      sourceDigest: digest((await readOptional(path)) ?? renderedAfter),
      targetDigest: stateDigest(local),
      backup,
    };
    await privateWrite(
      join(stateRoot(s, source), 'receipts.json'),
      `${JSON.stringify(receipt, null, 2)}\n`,
      s,
    );
  }
  return {
    reviewed: targets,
    source,
    notice: 'Review dotfiles/home with Git. Home files were not changed.',
  };
}
async function writeHomeSource(path: string, text: string, source: string) {
  const root = await realpath(join(source, 'dotfiles/home'));
  await mkdir(dirname(path), { recursive: true });
  if (
    !(await realpath(dirname(path))).startsWith(`${root}${sep}`) &&
    (await realpath(dirname(path))) !== root
  )
    throw new Error('Source parent escapes home asset tree');
  try {
    if ((await lstat(path)).isSymbolicLink())
      throw new Error('Refusing linked source file');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  const { writeFile } = await import('node:fs/promises');
  await writeFile(path, text);
}
export async function configurationPreflight(
  s: DotfilesSystem,
  source: string,
  host: string,
) {
  const targets = await managedTargets(s, source, host);
  const receipt = await receipts(s, source);
  const status = await chezmoi(s, source, host, [
    'status',
    '--include',
    'files,symlinks',
    '--path-style',
    'absolute',
  ]);
  const locallyChanged = new Set(
    status
      .split('\n')
      .filter((l) => l[0] && l[0] !== ' ')
      .map((l) => l.slice(3)),
  );
  const lastWritten =
    JSON.parse(await chezmoi(s, source, host, ['state', 'dump'])).entryState ??
    {};
  const conflicts: string[] = [];
  for (const target of targets) {
    await assertNoLinks(dirname(target), s.home);
    const local = await fileState(target);
    const rendered = await renderTarget(s, source, host, target);
    if (local.text === undefined) continue;
    if (!local.link && local.text === rendered) continue;
    const r = receipt.files[target];
    if (
      r?.decision === 'defer' ||
      (r &&
        (r.sourceDigest !==
          digest(
            (await readOptional(await sourcePath(s, source, host, target))) ??
              rendered,
          ) ||
          r.targetDigest !== stateDigest(local))) ||
      (!r && (!lastWritten[target] || locallyChanged.has(target)))
    )
      conflicts.push(target);
  }
  return { targets, receipt, conflicts };
}
export async function applyConfiguration(
  s: DotfilesSystem,
  source: string,
  host: string,
) {
  const { targets, receipt, conflicts } = await configurationPreflight(
    s,
    source,
    host,
  );
  if (conflicts.length)
    throw new Error(
      `Reconcile with chc dotfiles config add before applying (no targets written):\n${conflicts.join('\n')}`,
    );
  for (const target of targets) await backupTarget(target, source, s);
  await chezmoi(s, source, host, [
    'apply',
    '--force',
    '--include',
    'files,symlinks,dirs',
  ]);
  // Receipts are onboarding decisions only, not a replacement for chezmoi's normal state.
  for (const target of targets) delete receipt.files[target];
  await privateWrite(
    join(stateRoot(s, source), 'receipts.json'),
    JSON.stringify(receipt),
    s,
  );
  return {
    applied: targets.length,
    source,
    host,
    next: 'Runtime versions remain explicit: mise install',
  };
}
