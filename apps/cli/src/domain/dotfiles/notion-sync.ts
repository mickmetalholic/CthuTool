import * as v from 'valibot';
import { stringify } from 'yaml';
import type {
  NotionClient,
  NotionPage,
  NotionProperty,
  NotionSchema,
} from '../../infra/dotfiles/notion-http';
import {
  digest,
  GENERATED_FILES,
  MANIFEST,
  type Manifest,
  parseCatalog,
} from '../../infra/dotfiles/source';
import {
  type Catalog,
  type Host,
  healthSchema,
  platformConfigSchema,
  type RuntimeSoftware,
  type Software,
  validateCatalog,
} from './model';

const groups = ['software', 'toolsets', 'hosts'] as const;
type Group = (typeof groups)[number];
const uuid = (s: string) => s.replaceAll('-', '').toLowerCase();
export const fieldSchema: Record<Group, Record<string, string>> = {
  software: {
    Name: 'title',
    Kind: 'select',
    State: 'select',
    'Software Kind': 'select',
    'Health Config': 'rich_text',
    Homepage: 'url',
    GitHub: 'rich_text',
    Checks: 'rich_text',
    Doctor: 'select',
    Runtime: 'rich_text',
    Guidance: 'rich_text',
    ...Object.fromEntries(
      ['Linux', 'Darwin', 'Windows'].flatMap((p) =>
        [
          ['Install', 'select'],
          ['Package', 'rich_text'],
          ['Guidance', 'rich_text'],
          ['Owner', 'select'],
          ['Handler', 'select'],
          ['Config', 'rich_text'],
        ].map(([field, type]) => [`${p} ${field}`, type]),
      ),
    ),
    ...Object.fromEntries(
      ['Linux', 'Darwin', 'Windows'].map((p) => [`Aliases ${p}`, 'rich_text']),
    ),
  },
  toolsets: { Name: 'title', State: 'select', Software: 'relation' },
  hosts: {
    Name: 'title',
    ID: 'rich_text',
    State: 'select',
    OS: 'select',
    Aliases: 'rich_text',
    Purpose: 'rich_text',
    Shell: 'rich_text',
    Terminal: 'rich_text',
    Toolsets: 'relation',
    Tools: 'relation',
    Exclude: 'relation',
  },
};
export function checkSchema(group: Group, schema: NotionSchema) {
  for (const [field, type] of Object.entries(fieldSchema[group]))
    if (schema.properties?.[field]?.type !== type)
      throw new Error(
        `${group}.${field}: expected Notion ${type} field. See docs/dotfiles/notion-schema.md.`,
      );
}
export function value(page: NotionPage, field: string): string {
  const p = page.properties[field];
  if (!p) return '';
  switch (p.type) {
    case 'title':
    case 'rich_text':
      return (p[p.type] ?? [])
        .map((t) => t.plain_text ?? t.text?.content ?? '')
        .join('');
    case 'select':
      return p.select?.name ?? '';
    case 'status':
      return p.status?.name ?? '';
    case 'url':
      return p.url ?? '';
    default:
      throw new Error(`${page.id}.${field}: unsupported ${p.type}`);
  }
}
const lines = (s: string) =>
  s
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
export function stableList(previous: string[], next: string[]) {
  const members = new Set(next);
  return [
    ...previous.filter((x) => members.delete(x)),
    ...Array.from(members).sort(),
  ];
}
function sortedRecord<T>(previous: Record<string, T>, next: Record<string, T>) {
  return Object.fromEntries(
    stableList(Object.keys(previous), Object.keys(next)).map((k) => [
      k,
      next[k],
    ]),
  );
}
function advanced<T>(
  raw: string,
  schema: v.GenericSchema<unknown, T>,
  where: string,
): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${where}: invalid JSON`);
  }
  const envelope = v.safeParse(
    v.strictObject({ version: v.literal(1), value: schema }),
    parsed,
  );
  if (!envelope.success)
    throw new Error(
      `${where}: ${envelope.issues.map((i) => i.message).join('; ')}`,
    );
  return envelope.output.value;
}
export type ReadNotion = {
  schemas: Record<Group, NotionSchema>;
  pages: Record<Group, NotionPage[]>;
};
export async function readNotion(client: NotionClient): Promise<ReadNotion> {
  const schemas = {} as Record<Group, NotionSchema>;
  const pages = {} as Record<Group, NotionPage[]>;
  // Sequential requests keep source visibility and rate limiting predictable.
  for (const group of groups) {
    const id = client.config.sources[group];
    schemas[group] = await client.metadata(id);
    pages[group] = await client.pages(id);
  }
  return { schemas, pages };
}
export function normalizeNotion(
  read: ReadNotion,
  current: Catalog,
  previous: Manifest,
) {
  const next: Catalog = {
    tools: {},
    runtime_tools: {},
    toolsets: {},
    hosts: {},
  };
  const identities: Manifest['identities'] = {};
  const retired: string[] = [];
  const lookup: Record<Group, Map<string, string>> = {
    software: new Map(),
    toolsets: new Map(),
    hosts: new Map(),
  };
  const allPages = new Set<string>();
  for (const group of groups) {
    checkSchema(group, read.schemas[group]);
    const entries: Record<
      string,
      { key: string; state: 'active' | 'retired' }
    > = {};
    identities[group] = entries;
    const keys = new Set<string>();
    const pages = new Set<string>();
    for (const page of read.pages[group]) {
      const id = uuid(page.id);
      if (!/^[a-f0-9]{32}$/.test(id))
        throw new Error(`${group}: invalid page UUID`);
      const canonicalPage = id.replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-$3-$4-$5',
      );
      if (allPages.has(id))
        throw new Error(`${group}: duplicate page ID ${canonicalPage}`);
      allPages.add(id);
      if (pages.has(id))
        throw new Error(`${group}: duplicate page ID ${page.id}`);
      pages.add(id);
      const state = value(page, 'State');
      if (!['active', 'draft', 'retired'].includes(state))
        throw new Error(`${page.id}: invalid State ${state}`);
      const key = value(page, group === 'hosts' ? 'ID' : 'Name').trim();
      const priorEntry = Object.entries(previous.identities[group] ?? {}).find(
        ([p]) => uuid(p) === id,
      )?.[1];
      if (state === 'draft') {
        if (priorEntry?.state === 'retired')
          entries[canonicalPage] = priorEntry;
        if (priorEntry?.state === 'active')
          throw new Error(
            `${group}:${priorEntry.key} changed from published to draft; retirement must be explicit`,
          );
        continue;
      }
      if (!/^[a-z0-9]+[a-z0-9.-]*$/.test(key))
        throw new Error(`${page.id}: invalid stable key ${key}`);
      if (keys.has(key))
        throw new Error(`${group}: duplicate stable key ${key}`);
      keys.add(key);
      if (
        priorEntry &&
        priorEntry.key !== key &&
        !previous.identityMigrations.some(
          (m) =>
            m.group === group &&
            uuid(m.page) === id &&
            m.from === priorEntry.key &&
            m.to === key,
        )
      )
        throw new Error(
          `${page.id}: identity ${priorEntry.key} -> ${key} needs reviewed identityMigrations`,
        );
      if (state === 'retired') {
        entries[canonicalPage] = { key, state: 'retired' };
        if (priorEntry?.state !== 'retired') retired.push(`${group}:${key}`);
        continue;
      }
      if (priorEntry?.state === 'retired')
        throw new Error(
          `${group}:${key}: retired page cannot reactivate without reviewed migration`,
        );
      entries[canonicalPage] = { key, state: 'active' };
      lookup[group].set(id, key);
    }
    for (const [page, old] of Object.entries(
      previous.identities[group] ?? {},
    )) {
      if (old.state === 'active' && !pages.has(uuid(page)))
        throw new Error(
          `${group}:${old.key} (${page}) disappeared or is not visible; refusing removal`,
        );
      if (old.state === 'retired' && !pages.has(uuid(page)))
        entries[page] = old;
    }
  }
  function relations(
    page: NotionPage,
    field: string,
    group: Group,
    old: string[],
  ) {
    const p: NotionProperty | undefined = page.properties[field];
    if (p?.type !== 'relation' || p.has_more)
      throw new Error(`${page.id}.${field}: incomplete relation`);
    const refs = (p.relation ?? []).map((r) => {
      const id = lookup[group].get(uuid(r.id));
      if (!id)
        throw new Error(
          `${page.id}.${field}: dangling/inactive relation ${r.id}`,
        );
      return id;
    });
    return stableList(old, refs);
  }
  for (const page of read.pages.software) {
    const id = lookup.software.get(uuid(page.id));
    if (!id) continue;
    const classification = value(page, 'Kind');
    const kind = value(page, 'Software Kind');
    const raw = value(page, 'Health Config');
    if (!raw)
      throw new Error(
        `${id}: Health Config is required; legacy exporter is lossy`,
      );
    const health = advanced(raw, healthSchema, `${id}.Health Config`);
    const checks = lines(value(page, 'Checks'));
    const doctor = value(page, 'Doctor');
    const automatic = health.checks
      .filter((c) => c.type === 'command')
      .map((c) => [c.command, ...c.args].join(' '));
    if (
      checks.length &&
      JSON.stringify([...checks].sort()) !==
        JSON.stringify([...automatic].sort())
    )
      throw new Error(`${id}: Checks conflicts with Health Config`);
    const severity = doctor === 'required' ? 'blocking' : doctor;
    if (doctor && doctor !== 'manual' && severity !== health.severity)
      throw new Error(`${id}: Doctor conflicts with Health Config`);
    if (doctor === 'manual' && health.mode !== 'manual')
      throw new Error(`${id}: Doctor conflicts with health mode`);
    const common = {
      homepage: value(page, 'Homepage'),
      ...(value(page, 'GitHub') ? { github: value(page, 'GitHub') } : {}),
      kind,
      health,
    };
    if (classification === 'runtime')
      next.runtime_tools[id] = {
        ...common,
        runtime: value(page, 'Runtime'),
        owner: 'runtime',
        guidance: value(page, 'Guidance'),
      } as RuntimeSoftware;
    else if (classification === 'package') {
      const platforms: Record<string, unknown> = {};
      const aliases: Record<string, string[]> = {};
      for (const [os, prefix] of [
        ['linux', 'Linux'],
        ['darwin', 'Darwin'],
        ['windows', 'Windows'],
      ]) {
        const install = value(page, `${prefix} Install`);
        const fields = [
          'Package',
          'Guidance',
          'Owner',
          'Handler',
          'Config',
        ].map((f) => value(page, `${prefix} ${f}`));
        if (!install) {
          if (fields.some(Boolean))
            throw new Error(`${id}.${prefix}: config without Install`);
          continue;
        }
        const [pkg, guidance, owner, handler, config] = fields;
        platforms[os] = {
          install,
          package: pkg,
          owner,
          ...(guidance ? { guidance } : {}),
          ...(handler ? { handler } : {}),
          ...(config
            ? advanced(config, platformConfigSchema, `${id}.${prefix} Config`)
            : {}),
        };
        const items = lines(value(page, `Aliases ${prefix}`));
        if (items.length)
          aliases[os] = stableList(
            current.tools[id]?.aliases[os as 'linux' | 'darwin' | 'windows'] ??
              [],
            items,
          );
      }
      next.tools[id] = { ...common, aliases, platforms } as Software;
    } else throw new Error(`${id}: invalid Kind ${classification}`);
  }
  for (const page of read.pages.toolsets) {
    const id = lookup.toolsets.get(uuid(page.id));
    if (id)
      next.toolsets[id] = relations(
        page,
        'Software',
        'software',
        current.toolsets[id] ?? [],
      );
  }
  for (const page of read.pages.hosts) {
    const id = lookup.hosts.get(uuid(page.id));
    if (!id) continue;
    const old = current.hosts[id];
    next.hosts[id] = {
      aliases: stableList(old?.aliases ?? [], lines(value(page, 'Aliases'))),
      os: value(page, 'OS'),
      ...(value(page, 'Purpose') ? { purpose: value(page, 'Purpose') } : {}),
      shell: value(page, 'Shell'),
      terminal: value(page, 'Terminal'),
      toolsets: relations(page, 'Toolsets', 'toolsets', old?.toolsets ?? []),
      tools: relations(page, 'Tools', 'software', old?.tools ?? []),
      exclude: relations(page, 'Exclude', 'software', old?.exclude ?? []),
    } as Host;
  }
  // All published stable keys, including those not yet linked to a Notion page, are protected.
  for (const [group, old, now] of [
    [
      'software',
      { ...current.tools, ...current.runtime_tools },
      { ...next.tools, ...next.runtime_tools },
    ],
    ['toolsets', current.toolsets, next.toolsets],
    ['hosts', current.hosts, next.hosts],
  ] as const)
    for (const key of Object.keys(old)) {
      const renamed = previous.identityMigrations.some(
        (m) => m.group === group && m.from === key && m.to in now,
      );
      if (!(key in now) && !renamed && !retired.includes(`${group}:${key}`))
        throw new Error(
          `${group}:${key}: published key disappeared without explicit retirement`,
        );
    }
  const catalog = validateCatalog(next);
  catalog.tools = sortedRecord(current.tools, catalog.tools);
  catalog.runtime_tools = sortedRecord(
    current.runtime_tools,
    catalog.runtime_tools,
  );
  catalog.toolsets = sortedRecord(current.toolsets, catalog.toolsets);
  catalog.hosts = sortedRecord(current.hosts, catalog.hosts);
  return { catalog, identities, retired };
}
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(
          Object.keys(val)
            .sort()
            .map((k) => [k, val[k]]),
        )
      : val,
  );
export function candidateSnapshot(
  normalized: ReturnType<typeof normalizeNotion>,
  previous: Manifest,
  existing: Record<string, string>,
) {
  const docs = [
    { tools: normalized.catalog.tools },
    { runtime_tools: normalized.catalog.runtime_tools },
    { toolsets: normalized.catalog.toolsets },
    { hosts: normalized.catalog.hosts },
  ];
  const old = parseCatalog(existing);
  const oldDocs = [
    { tools: old.tools },
    { runtime_tools: old.runtime_tools },
    { toolsets: old.toolsets },
    { hosts: old.hosts },
  ];
  const files: Record<string, string> = {};
  GENERATED_FILES.forEach((f, i) => {
    const old = JSON.parse(JSON.stringify(oldDocs[i]));
    const next = JSON.parse(JSON.stringify(docs[i]));
    files[f] =
      canonical(old) === canonical(next)
        ? existing[f]
        : stringify(next, { lineWidth: 0 });
  });
  const hasChanges =
    GENERATED_FILES.some((f) => files[f] !== existing[f]) ||
    canonical(normalized.identities) !== canonical(previous.identities) ||
    (previous.alignmentReviewed && previous.generation === 0);
  const manifest: Manifest = {
    ...previous,
    generation: previous.generation + (hasChanges ? 1 : 0),
    identities: normalized.identities,
    files: Object.fromEntries(
      GENERATED_FILES.map((f) => [f, digest(files[f])]),
    ),
  };
  const stableIdentities = Object.fromEntries(
    groups.map((g) => [
      g,
      Object.fromEntries(
        Object.entries(manifest.identities[g]).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
    ]),
  );
  manifest.identities = stableIdentities;
  files[MANIFEST] = `${JSON.stringify(manifest, null, 2)}\n`;
  return {
    files,
    manifest,
    retired: normalized.retired,
    hasChanges,
  };
}
