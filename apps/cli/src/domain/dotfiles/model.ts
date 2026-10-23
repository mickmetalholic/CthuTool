import * as v from 'valibot';

export const MODEL_VERSION = 1;
const text = v.pipe(v.string(), v.minLength(1));
const optionalText = v.optional(text);
const strings = v.optional(v.array(text), []);
const os = v.picklist(['linux', 'darwin', 'windows']);
const owner = v.picklist(['dot', 'system', 'user', 'runtime']);
const kind = v.picklist(['command', 'desktop', 'framework', 'service']);
const check = v.variant('type', [
  v.strictObject({ type: v.literal('command'), command: text, args: strings }),
  v.strictObject({ type: v.literal('path'), path: text }),
  v.strictObject({
    type: v.literal('systemd'),
    unit: text,
    enabled: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  }),
  v.strictObject({
    type: v.literal('kubernetes-api'),
    command: text,
    args: strings,
  }),
  v.strictObject({
    type: v.literal('kubeconfig'),
    path: text,
    owner: text,
    group: text,
    mode: v.pipe(text, v.regex(/^0?[0-7]{3}$/)),
  }),
]);
export const healthSchema = v.pipe(
  v.strictObject({
    mode: v.picklist(['automatic', 'manual']),
    severity: v.picklist(['blocking', 'optional']),
    checks: v.optional(v.array(check), []),
    guidance: optionalText,
  }),
  v.check(
    (h) =>
      h.mode === 'manual'
        ? h.checks.length === 0 && !!h.guidance
        : h.checks.length > 0,
    'automatic health needs checks; manual health needs guidance and no checks',
  ),
);
const artifact = v.strictObject({
  url: v.pipe(text, v.url(), v.startsWith('https://')),
  sha256: v.pipe(text, v.regex(/^[a-fA-F0-9]{64}$/)),
});
const release = v.strictObject({
  version: text,
  destination: text,
  artifacts: v.record(v.picklist(['amd64', 'arm64']), artifact),
});
const kubeconfig = v.strictObject({
  path: text,
  owner: text,
  group: text,
  mode: v.pipe(text, v.regex(/^0?[0-7]{3}$/)),
});
const service = v.strictObject({
  config_path: text,
  kubeconfig,
  fresh_install: v.strictObject({ disable: strings, enable: strings }),
});
export const platformConfigSchema = v.strictObject({
  version: optionalText,
  release: v.optional(release),
  service: v.optional(service),
});
export const platformSchema = v.pipe(
  v.strictObject({
    install: v.picklist([
      'apt',
      'brew',
      'brew-cask',
      'winget',
      'official',
      'fallback',
      'powershell-gallery',
      'system',
    ]),
    owner,
    handler: v.optional(
      v.picklist([
        'docker-engine',
        'k3s',
        'official-release',
        'oh-my-zsh',
        'codex-cli',
        'claude-code',
      ]),
    ),
    package: text,
    guidance: optionalText,
    version: optionalText,
    release: v.optional(release),
    service: v.optional(service),
  }),
  v.check(
    (p) =>
      p.handler !== 'official-release' ||
      (!!p.version &&
        !!p.release &&
        p.version === p.release.version &&
        Object.keys(p.release.artifacts).length > 0),
    'official-release needs matching pinned version and artifacts',
  ),
  v.check(
    (p) =>
      p.handler !== 'k3s' ||
      (!!p.version &&
        !!p.service &&
        p.service.fresh_install.disable.length +
          p.service.fresh_install.enable.length >
          0),
    'k3s needs pinned version and complete service policy',
  ),
  v.check(
    (p) => !p.handler || p.install === 'official',
    'handlers require official method',
  ),
  v.check(
    (p) => p.owner !== 'runtime',
    'package platform cannot have runtime ownership',
  ),
);
const common = {
  homepage: v.pipe(text, v.url()),
  github: v.optional(v.pipe(text, v.regex(/^[\w.-]+\/[\w.-]+$/))),
  kind,
  health: healthSchema,
};
export const softwareSchema = v.strictObject({
  ...common,
  aliases: v.optional(v.record(os, v.array(text)), {}),
  platforms: v.record(os, platformSchema),
});
export const runtimeSchema = v.strictObject({
  ...common,
  runtime: text,
  owner: v.literal('runtime'),
  guidance: text,
});
export const hostSchema = v.strictObject({
  aliases: strings,
  os,
  purpose: optionalText,
  shell: v.picklist(['zsh', 'bash', 'pwsh', 'fish', 'nu', 'none']),
  terminal: v.picklist([
    'ghostty',
    'wezterm',
    'windows-terminal',
    'alacritty',
    'kitty',
    'iterm2',
    'none',
  ]),
  toolsets: strings,
  tools: strings,
  exclude: strings,
});
const key = v.pipe(text, v.regex(/^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$/));
export const catalogSchema = v.strictObject({
  tools: v.record(key, softwareSchema),
  runtime_tools: v.record(key, runtimeSchema),
  toolsets: v.record(key, v.array(key)),
  hosts: v.record(key, hostSchema),
});
export type Catalog = v.InferOutput<typeof catalogSchema>;
export type Software = v.InferOutput<typeof softwareSchema>;
export type RuntimeSoftware = v.InferOutput<typeof runtimeSchema>;
export type Health = v.InferOutput<typeof healthSchema>;
export type Platform = v.InferOutput<typeof platformSchema>;
export type Host = v.InferOutput<typeof hostSchema>;
export type HostOS = Host['os'];
export function validateCatalog(value: unknown): Catalog {
  const result = v.safeParse(catalogSchema, value);
  if (!result.success)
    throw new Error(
      result.issues
        .map(
          (i) =>
            `${i.path?.map((p) => p.key).join('.') ?? 'catalog'}: ${i.message}`,
        )
        .join('\n'),
    );
  const c = result.output;
  for (const [id, tool] of Object.entries({ ...c.tools, ...c.runtime_tools })) {
    for (const check of tool.health.checks)
      if (
        'command' in check &&
        (!/^[a-zA-Z0-9_.+-]+$/.test(check.command) ||
          (check.args.length &&
            /^(?:ba|z|fi|da|k)?sh$|^(?:pwsh|powershell|cmd|python|node|perl|ruby)$/i.test(
              check.command,
            )))
      )
        throw new Error(
          `${id}: health commands cannot execute arbitrary interpreter text`,
        );
  }
  for (const [id, tool] of Object.entries(c.tools))
    for (const [platform, policy] of Object.entries(tool.platforms)) {
      if (
        (policy.install === 'apt' && platform !== 'linux') ||
        (policy.install === 'brew-cask' && platform !== 'darwin') ||
        (['winget', 'powershell-gallery'].includes(policy.install) &&
          platform !== 'windows')
      )
        throw new Error(
          `${id}: ${policy.install} is unsupported on ${platform}`,
        );
    }

  const all = new Set([
    ...Object.keys(c.tools),
    ...Object.keys(c.runtime_tools),
  ]);
  if (
    all.size !==
    Object.keys(c.tools).length + Object.keys(c.runtime_tools).length
  )
    throw new Error('Duplicate package/runtime ID');
  const identities = new Set<string>();
  for (const [id, h] of Object.entries(c.hosts)) {
    for (const name of [id, ...h.aliases]) {
      const k = name.toLowerCase();
      if (identities.has(k))
        throw new Error(`Ambiguous host identity: ${name}`);
      identities.add(k);
    }
    for (const set of h.toolsets)
      if (!c.toolsets[set])
        throw new Error(`host ${id}: unknown toolset ${set}`);
    for (const tool of [...h.tools, ...h.exclude])
      if (!all.has(tool))
        throw new Error(`host ${id}: unknown software ${tool}`);
    for (const tool of h.tools)
      if (c.tools[tool] && !c.tools[tool].platforms[h.os])
        throw new Error(`host ${id}: ${tool} does not support ${h.os}`);
  }
  for (const [set, ids] of Object.entries(c.toolsets))
    for (const id of ids)
      if (!all.has(id))
        throw new Error(`toolset ${set}: unknown software ${id}`);
  return c;
}
export type PlanEntry = {
  id: string;
  classification: 'package' | 'runtime';
  provenance: string;
  software: Software | RuntimeSoftware;
  platform?: Platform;
};
export function resolvePlan(c: Catalog, id: string) {
  const host = c.hosts[id];
  if (!host)
    throw new Error(
      `Unknown or unbound host ${id || '(none)'}. Run chc dotfiles init --host <published-id>.`,
    );
  const entries: PlanEntry[] = [];
  const skipped: { id: string; provenance: string; reason: string }[] = [];
  const seen = new Set(host.exclude);
  const selected = [
    ...host.toolsets.flatMap((s) =>
      c.toolsets[s].map((t) => ({ id: t, provenance: `toolset:${s}` })),
    ),
    ...host.tools.map((t) => ({ id: t, provenance: 'host' })),
  ];
  for (const item of selected) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const software = c.tools[item.id] ?? c.runtime_tools[item.id];
    if (c.runtime_tools[item.id])
      entries.push({ ...item, classification: 'runtime', software });
    else if (c.tools[item.id].platforms[host.os])
      entries.push({
        ...item,
        classification: 'package',
        software,
        platform: c.tools[item.id].platforms[host.os],
      });
    else skipped.push({ ...item, reason: `unsupported on ${host.os}` });
  }
  return {
    host: id,
    os: host.os,
    shell: host.shell,
    terminal: host.terminal,
    toolsets: host.toolsets,
    entries,
    skipped,
  };
}
export function assertCompatibleHost(
  c: Catalog,
  id: string,
  machine: { os: HostOS; wsl: boolean },
) {
  const h = c.hosts[id];
  if (!h)
    throw new Error(
      `Host ${id} is not published. Define/activate it in Notion, review notion pull, publish Git, update this source, then init.`,
    );
  if (
    h.os !== machine.os ||
    (h.purpose?.toLowerCase().includes('wsl') ?? false) !== machine.wsl
  )
    throw new Error(
      `Host ${id} is incompatible with ${machine.os}${machine.wsl ? '/WSL' : ''}`,
    );
  return h;
}
