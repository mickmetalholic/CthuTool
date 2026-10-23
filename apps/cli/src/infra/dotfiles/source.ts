import { createHash } from 'node:crypto';
import { constants, existsSync } from 'node:fs';
import { access, readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';
import * as v from 'valibot';
import { parse } from 'yaml';
import {
  type Catalog,
  MODEL_VERSION,
  validateCatalog,
} from '../../domain/dotfiles/model';
import { checkedRun, type DotfilesSystem, readOptional } from './system';
export const GENERATED_FILES = [
  'dotfiles/data/packages.yaml',
  'dotfiles/data/runtime-tools.yaml',
  'dotfiles/data/toolsets.yaml',
  'dotfiles/home/.chezmoidata/hosts.yaml',
] as const;
export const MANIFEST = 'dotfiles/notion/manifest.json';
export const TRANSACTION = 'dotfiles/notion/.transaction';
export type Identity = { key: string; state: 'active' | 'retired' };
export type Manifest = {
  version: 1;
  modelVersion: 1;
  generation: number;
  alignmentReviewed: boolean;
  baseline?: string;
  identities: Record<string, Record<string, Identity>>;
  identityMigrations: {
    group: string;
    page: string;
    from: string;
    to: string;
  }[];
  files: Record<string, string>;
};
export type Sources = {
  version: 1;
  apiVersion: string;
  sources: { software: string; toolsets: string; hosts: string };
};
export const digest = (s: string | Uint8Array) =>
  createHash('sha256').update(s).digest('hex');
export function installedSource() {
  let p = dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (
      existsSync(join(p, 'package.json')) &&
      existsSync(join(p, '.chezmoiroot'))
    )
      return p;
    const parent = dirname(p);
    if (parent === p) throw new Error('Installed dotfiles assets missing');
    p = parent;
  }
}
export type Binding = { source?: string; host?: string; configFile?: string };
export async function readBinding(system: DotfilesSystem): Promise<Binding> {
  const environment = system.environment ?? process.env;
  const directory = join(
    environment.XDG_CONFIG_HOME ?? join(system.home, '.config'),
    'chezmoi',
  );
  let config: Record<string, unknown> = {};
  let configFile: string | undefined;
  const native = !!(await system.which('chezmoi'));
  if (native) {
    // chezmoi owns config discovery and format handling while it is available.
    config = JSON.parse(
      await checkedRun(system, 'chezmoi', ['dump-config', '--format', 'json']),
    );
    configFile =
      (
        await checkedRun(system, 'chezmoi', [
          'execute-template',
          '{{ .chezmoi.configFile }}',
        ])
      ).trim() || undefined;
  } else {
    // Offline plan/validate still work before tooling is installed. Read only; never write a fallback binding.
    for (const extension of ['toml', 'yaml', 'yml', 'json']) {
      const path = join(directory, `chezmoi.${extension}`);
      const content = await readOptional(path);
      if (content === undefined) continue;
      if (configFile)
        throw new Error(
          'Multiple chezmoi configuration files found; install chezmoi to resolve the authoritative configuration.',
        );
      configFile = path;
      try {
        config =
          extension === 'toml'
            ? parseToml(content)
            : extension === 'json'
              ? JSON.parse(content)
              : parse(content);
      } catch {
        throw new Error(`Cannot parse chezmoi configuration: ${path}`);
      }
    }
  }
  const data = config.data as { local?: { host?: unknown } } | undefined;
  const host =
    typeof data?.local?.host === 'string' && data.local.host
      ? data.local.host
      : undefined;
  const defaultSource = join(
    environment.XDG_DATA_HOME ?? join(system.home, '.local/share'),
    'chezmoi',
  );
  const candidate =
    typeof config.sourceDir === 'string'
      ? config.sourceDir
      : join(
          environment.XDG_DATA_HOME ?? join(system.home, '.local/share'),
          'chezmoi',
        );
  const source = candidate.replace(/^~(?=\/|\\|$)/, system.home);
  const configured =
    !!host ||
    (native
      ? source !== defaultSource
      : typeof config.sourceDir === 'string' && !!config.sourceDir) ||
    existsSync(source);
  if (configured && !isAbsolute(source))
    throw new Error(
      'chezmoi sourceDir must be absolute; use init with an explicit --source path.',
    );
  return { source: configured ? source : undefined, host, configFile };
}
export async function resolveSource(system: DotfilesSystem, explicit?: string) {
  const binding = explicit ? {} : await readBinding(system);
  const source = await realpath(
    explicit
      ? resolve(explicit.replace(/^~(?=\/|\\|$)/, system.home))
      : (binding.source ?? installedSource()),
  );
  if (
    (await readOptional(join(source, '.chezmoiroot')))?.trim() !==
    'dotfiles/home'
  )
    throw new Error(
      `Invalid dotfiles source: ${source}. Rebind with chc dotfiles init --source <checkout>.`,
    );
  return { source, binding };
}
export async function assertNoTransaction(source: string) {
  if (existsSync(join(source, TRANSACTION)))
    throw new Error(
      `Interrupted Notion publication at ${join(source, TRANSACTION)}. Retry chc dotfiles notion pull --source ${source} before using this generation.`,
    );
}
export async function readSources(source: string): Promise<Sources> {
  const s = JSON.parse(
    await readFile(join(source, 'dotfiles/notion/sources.json'), 'utf8'),
  );
  if (
    Object.keys(s).sort().join() !== 'apiVersion,sources,version' ||
    Object.keys(s.sources ?? {})
      .sort()
      .join() !== 'hosts,software,toolsets' ||
    new Set(Object.values(s.sources ?? {})).size !== 3 ||
    s.version !== 1 ||
    s.apiVersion !== '2026-03-11' ||
    !['software', 'toolsets', 'hosts'].every((g) =>
      /^[a-f0-9-]{36}$/.test(s.sources?.[g]),
    )
  )
    throw new Error('Unsupported Notion sources configuration');
  return s;
}
export function validateManifest(input: unknown): Manifest {
  const stable = v.pipe(v.string(), v.regex(/^[a-z0-9]+[a-z0-9.-]*$/));
  const pageId = v.pipe(
    v.string(),
    v.regex(/^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/),
  );
  const entries = v.record(
    pageId,
    v.strictObject({ key: stable, state: v.picklist(['active', 'retired']) }),
  );
  const parsed = v.safeParse(
    v.strictObject({
      version: v.literal(1),
      modelVersion: v.literal(MODEL_VERSION),
      generation: v.pipe(v.number(), v.integer(), v.minValue(0)),
      alignmentReviewed: v.boolean(),
      baseline: v.optional(v.pipe(v.string(), v.regex(/^[a-f0-9]{40}$/))),
      identities: v.strictObject({
        software: entries,
        toolsets: entries,
        hosts: entries,
      }),
      identityMigrations: v.array(
        v.strictObject({
          group: v.picklist(['software', 'toolsets', 'hosts']),
          page: pageId,
          from: stable,
          to: stable,
        }),
      ),
      files: v.record(
        v.string(),
        v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
      ),
    }),
    input,
  );
  if (!parsed.success)
    throw new Error(
      `Unsupported or invalid dotfiles manifest/schema: ${parsed.issues.map((i) => i.message).join('; ')}`,
    );
  const m = parsed.output;
  const pages = new Set<string>();
  for (const entries of Object.values(m.identities) as Record<
    string,
    Identity
  >[]) {
    const keys = new Set<string>();
    for (const [page, identity] of Object.entries(entries)) {
      const id = page.toLowerCase();
      if (pages.has(id) || keys.has(identity.key))
        throw new Error('Duplicate manifest identity');
      pages.add(id);
      keys.add(identity.key);
    }
  }
  for (const migration of m.identityMigrations)
    if (
      !Object.keys(m.identities[migration.group] ?? {}).some(
        (p) => p.toLowerCase() === migration.page.toLowerCase(),
      ) ||
      migration.from === migration.to
    )
      throw new Error('Invalid manifest identity migration');

  if (
    Object.keys(m.files ?? {})
      .sort()
      .join() !== [...GENERATED_FILES].sort().join()
  )
    throw new Error('Manifest generated-file inventory mismatch');
  return m;
}
export async function readManifest(source: string): Promise<Manifest> {
  return validateManifest(
    JSON.parse(await readFile(join(source, MANIFEST), 'utf8')),
  );
}
export function parseCatalog(files: Record<string, string>): Catalog {
  const docs = GENERATED_FILES.map((f) =>
    parse(files[f], { uniqueKeys: true }),
  );
  for (const [i, key] of [
    'tools',
    'runtime_tools',
    'toolsets',
    'hosts',
  ].entries())
    if (
      !docs[i] ||
      Object.keys(docs[i]).length !== 1 ||
      Object.keys(docs[i])[0] !== key
    )
      throw new Error(
        `Unknown or missing document fields: ${GENERATED_FILES[i]}`,
      );
  return validateCatalog({ ...docs[0], ...docs[1], ...docs[2], ...docs[3] });
}
export async function loadSnapshot(source: string) {
  await assertNoTransaction(source);
  const manifestText = await readFile(join(source, MANIFEST), 'utf8');
  const manifest = validateManifest(JSON.parse(manifestText));
  const files: Record<string, string> = {};
  for (const f of GENERATED_FILES) {
    files[f] = await readFile(join(source, f), 'utf8');
    if (digest(files[f]) !== manifest.files[f])
      throw new Error(
        `Snapshot digest mismatch: ${f}. Restore a complete generation or review notion pull.`,
      );
  }
  const catalog = parseCatalog(files);
  validateSnapshotReferences(catalog, manifest);
  await assertNoTransaction(source);
  if ((await readFile(join(source, MANIFEST), 'utf8')) !== manifestText)
    throw new Error(
      'Snapshot changed during read; retry against a complete generation.',
    );
  return { catalog, manifest, files, manifestText };
}
export function validateSnapshotReferences(
  catalog: Catalog,
  manifest: Manifest,
) {
  if (manifest.generation > 0)
    for (const [group, keys] of Object.entries({
      software: Object.keys({ ...catalog.tools, ...catalog.runtime_tools }),
      toolsets: Object.keys(catalog.toolsets),
      hosts: Object.keys(catalog.hosts),
    })) {
      const active = Object.entries(manifest.identities[group])
        .filter(([, identity]) => identity.state === 'active')
        .map(
          ([page, identity]) =>
            manifest.identityMigrations.find(
              (m) =>
                m.group === group &&
                m.page.toLowerCase() === page.toLowerCase() &&
                m.from === identity.key,
            )?.to ?? identity.key,
        );
      if (
        keys.length !== active.length ||
        keys.some((key) => !active.includes(key))
      )
        throw new Error(
          `Published ${group} references do not match reviewed manifest identities`,
        );
    }
}
export async function writableSource(source: string, system: DotfilesSystem) {
  const root = (
    await checkedRun(system, 'git', ['rev-parse', '--show-toplevel'], {
      cwd: source,
    })
  ).trim();
  if ((await realpath(root)) !== (await realpath(source)))
    throw new Error(
      'Notion pull requires the root of a writable CthuTool Git checkout',
    );
  if (
    JSON.parse(await readFile(join(source, 'package.json'), 'utf8')).name !==
    'cthutool'
  )
    throw new Error('Not a CthuTool checkout');
  await access(join(source, 'dotfiles/notion'), constants.W_OK);
  for (const f of [...GENERATED_FILES, MANIFEST])
    await access(join(source, f), constants.W_OK);
  // Never follow generated-file symlinks outside the checkout.
  for (const f of [...GENERATED_FILES, MANIFEST])
    if ((await realpath(join(source, f))) !== join(source, f))
      throw new Error(`Linked generated file is not writable: ${f}`);
}
