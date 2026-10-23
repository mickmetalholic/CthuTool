import type { Catalog } from '../../../src/domain/dotfiles/model';
import type { ReadNotion } from '../../../src/domain/dotfiles/notion-sync';
import { fieldSchema } from '../../../src/domain/dotfiles/notion-sync';
import type {
  NotionPage,
  NotionProperty,
} from '../../../src/infra/dotfiles/notion-http';
import type { Manifest } from '../../../src/infra/dotfiles/source';

const rich = (text: string, type = 'rich_text'): NotionProperty => ({
  id: 'p',
  type,
  [type]: [
    { text: { content: text.slice(0, 11) } },
    { text: { content: text.slice(11) } },
  ],
});
export function notionFixture(c: Catalog, original: Manifest) {
  const ids = {
    software: new Map<string, string>(),
    toolsets: new Map<string, string>(),
    hosts: new Map<string, string>(),
  };
  let n = 1;
  for (const [g, keys] of [
    ['software', Object.keys({ ...c.tools, ...c.runtime_tools })],
    ['toolsets', Object.keys(c.toolsets)],
    ['hosts', Object.keys(c.hosts)],
  ] as const)
    for (const k of keys)
      ids[g].set(k, `00000000-0000-0000-0000-${String(n++).padStart(12, '0')}`);
  const pages: ReadNotion['pages'] = { software: [], toolsets: [], hosts: [] };
  function page(
    group: keyof typeof ids,
    key: string,
    values: Record<string, string>,
    rels: Record<string, { group: keyof typeof ids; keys: string[] }> = {},
  ): NotionPage {
    const properties: Record<string, NotionProperty> = {};
    for (const [field, type] of Object.entries(fieldSchema[group])) {
      const text = values[field] ?? '';
      properties[field] =
        type === 'select'
          ? { id: field, type, select: text ? { name: text } : null }
          : type === 'url'
            ? { id: field, type, url: text || null }
            : type === 'relation'
              ? {
                  id: field,
                  type,
                  relation: (rels[field]?.keys ?? []).map((k) => ({
                    id: ids[rels[field].group].get(k) as string,
                  })),
                  has_more: false,
                }
              : rich(text, type);
    }
    const result = { id: ids[group].get(key) as string, properties };
    pages[group].push(result);
    return result;
  }
  for (const [id, t] of Object.entries({ ...c.tools, ...c.runtime_tools })) {
    const values: Record<string, string> = {
      Name: id,
      State: 'active',
      Kind: 'platforms' in t ? 'package' : 'runtime',
      'Software Kind': t.kind,
      Homepage: t.homepage,
      GitHub: t.github ?? '',
      'Health Config': JSON.stringify({ version: 1, value: t.health }),
    };
    if ('platforms' in t) {
      for (const [os, p] of Object.entries(t.platforms)) {
        const prefix =
          os === 'linux' ? 'Linux' : os === 'darwin' ? 'Darwin' : 'Windows';
        Object.assign(values, {
          [`${prefix} Install`]: p.install,
          [`${prefix} Owner`]: p.owner,
          [`${prefix} Handler`]: p.handler ?? '',
          [`${prefix} Package`]: p.package,
          [`${prefix} Guidance`]: p.guidance ?? '',
          [`${prefix} Config`]: JSON.stringify({
            version: 1,
            value: {
              ...(p.version ? { version: p.version } : {}),
              ...(p.release ? { release: p.release } : {}),
              ...(p.service ? { service: p.service } : {}),
            },
          }),
          [`Aliases ${prefix}`]: (
            t.aliases[os as 'linux' | 'darwin' | 'windows'] ?? []
          ).join('\n'),
        });
      }
    } else Object.assign(values, { Runtime: t.runtime, Guidance: t.guidance });
    page('software', id, values);
  }
  for (const [id, members] of Object.entries(c.toolsets))
    page(
      'toolsets',
      id,
      { Name: id, State: 'active' },
      { Software: { group: 'software', keys: members } },
    );
  for (const [id, h] of Object.entries(c.hosts))
    page(
      'hosts',
      id,
      {
        Name: id,
        ID: id,
        State: 'active',
        OS: h.os,
        Purpose: h.purpose ?? '',
        Shell: h.shell,
        Terminal: h.terminal,
        Aliases: h.aliases.join('\n'),
      },
      {
        Toolsets: { group: 'toolsets', keys: h.toolsets },
        Tools: { group: 'software', keys: h.tools },
        Exclude: { group: 'software', keys: h.exclude },
      },
    );
  const manifest: Manifest = {
    ...original,
    alignmentReviewed: true,
    identities: Object.fromEntries(
      Object.entries(ids).map(([g, map]) => [
        g,
        Object.fromEntries(
          [...map].map(([key, id]) => [id, { key, state: 'active' }]),
        ),
      ]),
    ),
  };
  const schemas = Object.fromEntries(
    Object.entries(fieldSchema).map(([g, fields]) => [
      g,
      {
        properties: Object.fromEntries(
          Object.entries(fields).map(([k, type]) => [k, { type }]),
        ),
      },
    ]),
  ) as ReadNotion['schemas'];
  return { read: { pages, schemas }, manifest, ids };
}
