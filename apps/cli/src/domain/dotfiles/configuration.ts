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
};
export function chezmoi(
  system: DotfilesSystem,
  source: string,
  host: string,
  args: string[],
  options?: Parameters<DotfilesSystem['run']>[2],
) {
  // A data override selects this invocation; persisted binding remains authoritative otherwise.
  return checkedRun(
    system,
    'chezmoi',
    [
      '--source',
      source,
      '--destination',
      system.home,
      '--override-data',
      JSON.stringify({ local: { host } }),
      '--force=false',
      '--interactive=false',
      '--no-pager',
      ...(!options?.terminal ? ['--no-tty'] : []),
      ...args,
    ],
    options,
  );
}
export async function managedTargets(
  system: DotfilesSystem,
  source: string,
  host: string,
): Promise<string[]> {
  return (
    await chezmoi(system, source, host, [
      'managed',
      '--include',
      'files,symlinks',
      '--path-style',
      'absolute',
      '--nul-path-separator',
    ])
  )
    .split('\0')
    .filter(Boolean);
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
function validateTarget(path: string, s: DotfilesSystem) {
  const target = resolve(path.replace(/^~(?=\/|\\|$)/, s.home));
  const rel = relative(s.home, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new Error(
      'Select explicit files under home; do not import the home directory',
    );
  const normalized = rel.replaceAll('\\', '/').toLowerCase();
  if (
    normalized.startsWith('.ssh/') ||
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
// Let chezmoi own source path attributes, templates, conflict state and merge tools.
export async function adoptFiles(
  s: DotfilesSystem,
  source: string,
  host: string,
  paths: string[],
  interactive: boolean,
) {
  if (!paths.length)
    throw new Error('Usage: chc dotfiles config add <home-path...>');
  const targets = [...new Set(paths.map((p) => validateTarget(p, s)))];
  const managed = new Set(await managedTargets(s, source, host));
  const operations: { target: string; command: 'add' | 'merge' }[] = [];
  for (const target of targets) {
    await assertNoLinks(dirname(target), s.home);
    const local = await fileState(target);
    if (local.text === undefined)
      throw new Error(`Adoption target does not exist: ${target}`);
    if (local.link) throw new Error(`Select a regular home file: ${target}`);
    let template = false;
    if (managed.has(target)) {
      const path = (
        await chezmoi(s, source, host, ['source-path', '--', target])
      ).trim();
      const root = await realpath(join(source, 'dotfiles/home'));
      await assertNoLinks(path, root);
      template = path.endsWith('.tmpl');
    }
    if (template && !interactive)
      throw new Error(
        `Template reconciliation requires an interactive terminal: ${target}. Run config add without --json or --no-interactive to open the configured chezmoi merge tool.`,
      );
    operations.push({ target, command: template ? 'merge' : 'add' });
  }
  const config = JSON.parse(
    await chezmoi(s, source, host, ['dump-config', '--format', 'json']),
  );
  if (config.git?.autoadd || config.git?.autocommit || config.git?.autopush)
    throw new Error(
      'Disable chezmoi git.autoAdd, git.autoCommit and git.autoPush before config add; source changes must remain available for Git review.',
    );
  const backups = await Promise.all(
    targets.map((target) => backupTarget(target, source, s)),
  );
  for (const operation of operations) {
    await chezmoi(
      s,
      source,
      host,
      [
        operation.command,
        ...(operation.command === 'add'
          ? ['--recursive=false', '--secrets=error']
          : []),
        '--',
        operation.target,
      ],
      { terminal: operation.command === 'merge' },
    );
  }
  return {
    reviewed: targets,
    source,
    operations,
    backups,
    notice:
      'chezmoi updated source files. Review dotfiles/home with Git, then run config diff/apply. No configuration was applied by chc.',
  };
}
export async function applyConfiguration(
  s: DotfilesSystem,
  source: string,
  host: string,
  interactive = false,
) {
  const args = ['--less-interactive', '--include', 'files,symlinks,dirs'];
  if (!interactive) {
    try {
      await chezmoi(s, source, host, [
        '--error-on-conflict',
        'apply',
        '--dry-run',
        ...args,
      ]);
    } catch (error) {
      throw new Error(
        `chezmoi preflight failed; no home files applied. Resolve local differences with config add or run config apply in a terminal for native diff/overwrite/skip prompts. ${error instanceof Error ? error.message : ''}`,
      );
    }
  }
  const targets = await managedTargets(s, source, host);
  // Only backup policy remains in chc; chezmoi decides whether each file conflicts.
  for (const target of targets) {
    await assertNoLinks(dirname(target), s.home);
    await backupTarget(target, source, s);
  }
  await chezmoi(
    s,
    source,
    host,
    [`--error-on-conflict=${!interactive}`, 'apply', ...args],
    { terminal: interactive },
  );
  return {
    completed: true,
    interactive,
    source,
    host,
    next: 'Runtime versions remain explicit: mise install',
  };
}
