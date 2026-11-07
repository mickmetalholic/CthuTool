import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { stringify } from 'yaml';
import { digest } from '../../infra/dotfiles/source';
import { checkedRun, type DotfilesSystem } from '../../infra/dotfiles/system';
import type { Health, PlanEntry } from './model';
export type HealthResult = {
  type: string;
  status: 'ok' | 'missing' | 'manual';
  detail: string;
};
export const matchesVersion = (output: string, desired: string) =>
  (output.match(/v?\d+\.\d+\.\d+(?:[+-][\w.-]+)?/g) ?? []).some(
    (v) => v.replace(/^v/, '') === desired.replace(/^v/, ''),
  );
const expand = (path: string, s: DotfilesSystem) =>
  path.replace(/^~(?=\/|\\|$)/, s.home).replace(/^\$HOME(?=\/|\\|$)/, s.home);
export async function healthChecks(
  health: Health,
  system: DotfilesSystem,
  aliases: string[] = [],
): Promise<HealthResult[]> {
  if (health.mode === 'manual')
    return [
      {
        type: 'manual',
        status: 'manual',
        detail: health.guidance ?? 'Manual verification required',
      },
    ];
  const results: HealthResult[] = [];
  for (const check of health.checks) {
    let ok = false;
    let detail = '';
    try {
      switch (check.type) {
        case 'command': {
          const command = (await system.which(check.command))
            ? check.command
            : (
                await Promise.all(
                  aliases.map(async (a) =>
                    (await system.which(a)) ? a : undefined,
                  ),
                )
              ).find(Boolean);
          ok = !!command;
          detail = [check.command, ...check.args].join(' ');
          if (command && check.args.length)
            ok = (await system.run(command, check.args)).code === 0;
          break;
        }
        case 'path':
          await (system.files?.access ?? access)(expand(check.path, system));
          ok = true;
          detail = check.path;
          break;
        case 'systemd': {
          ok = true;
          detail = check.unit;
          if (check.enabled !== undefined)
            ok =
              ok &&
              ((
                await system.run('systemctl', [
                  'is-enabled',
                  '--quiet',
                  check.unit,
                ])
              ).code ===
                0) ===
                check.enabled;
          if (check.active !== undefined)
            ok =
              ok &&
              ((
                await system.run('systemctl', [
                  'is-active',
                  '--quiet',
                  check.unit,
                ])
              ).code ===
                0) ===
                check.active;
          break;
        }
        case 'kubernetes-api':
          ok = (await system.run(check.command, check.args)).code === 0;
          detail = [check.command, ...check.args].join(' ');
          break;
        case 'kubeconfig': {
          detail = check.path;
          const path = expand(check.path, system);
          const st = await (system.files?.stat ?? lstat)(path);
          const uid = Number(
            (await checkedRun(system, 'id', ['-u', check.owner])).trim(),
          );
          const gid = Number(
            (await checkedRun(system, 'getent', ['group', check.group])).split(
              ':',
            )[2],
          );
          const membership = (await checkedRun(system, 'id', ['-Gn']))
            .trim()
            .split(/\s+/);
          ok =
            st.isFile() &&
            (st.mode & 0o777) === Number.parseInt(check.mode, 8) &&
            st.uid === uid &&
            st.gid === gid &&
            membership.includes(check.group);
          if (ok) await (system.files?.access ?? access)(path, 4);
          break;
        }
      }
    } catch {
      ok = false;
      detail =
        detail ||
        ('path' in check
          ? check.path
          : 'command' in check
            ? check.command
            : 'unit' in check
              ? check.unit
              : 'Health check failed');
    }
    results.push({ type: check.type, status: ok ? 'ok' : 'missing', detail });
  }
  return results;
}
export async function diagnose(entries: PlanEntry[], system: DotfilesSystem) {
  const results = [];
  for (const e of entries) {
    const aliases =
      'aliases' in e.software ? (e.software.aliases[system.os] ?? []) : [];
    const checks = await healthChecks(e.software.health, system, aliases);
    if (e.platform?.version) {
      const check = e.software.health.checks.find((c) => c.type === 'command');
      if (check?.type === 'command') {
        try {
          const r = await system.run(
            check.command,
            e.platform.handler === 'k3s' ? ['--version'] : ['version'],
          );
          checks.push({
            type: 'version',
            status:
              r.code === 0 && matchesVersion(r.stdout, e.platform.version)
                ? 'ok'
                : 'missing',
            detail: `desired ${e.platform.version}`,
          });
        } catch {
          checks.push({
            type: 'version',
            status: 'missing',
            detail: `desired ${e.platform.version}`,
          });
        }
      }
    }
    results.push({
      id: e.id,
      classification: e.classification,
      severity: e.software.health.severity,
      checks,
      guidance:
        e.platform?.guidance ??
        ('guidance' in e.software
          ? e.software.guidance
          : e.software.health.guidance),
    });
  }
  const gitIdentity: Record<string, string> = {};
  for (const field of ['name', 'email']) {
    try {
      const r = await system.run('git', ['config', '--get', `user.${field}`]);
      gitIdentity[field] = r.code === 0 ? r.stdout.trim() : '';
    } catch {
      gitIdentity[field] = '';
    }
  }
  const prerequisites = [];
  for (const command of ['git', 'chezmoi', 'mise'])
    prerequisites.push({ command, available: !!(await system.which(command)) });
  return {
    results,
    gitIdentity,
    prerequisites,
    blockingFailures: results.filter(
      (r) =>
        r.severity === 'blocking' &&
        r.checks.some((c) => c.status === 'missing'),
    ).length,
  };
}
async function available(e: PlanEntry, s: DotfilesSystem) {
  const primary = e.software.health.checks.find(
    (c) => c.type === 'command' || c.type === 'path',
  );
  if (!primary) return false;
  if (primary.type === 'path') {
    try {
      await access(expand(primary.path, s));
      return true;
    } catch {
      return false;
    }
  }
  if (primary.type !== 'command') return false;
  for (const name of [
    primary.command,
    ...('aliases' in e.software ? (e.software.aliases[s.os] ?? []) : []),
  ])
    if (await s.which(name)) return true;
  return false;
}
async function trustedInstaller(
  s: DotfilesSystem,
  url: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
) {
  const temp = await mkdtemp(join(tmpdir(), 'chc-installer-'));
  try {
    const response = await s.fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error('Official installer download failed');
    const path = join(temp, 'install.sh');
    await writeFile(path, new Uint8Array(await response.arrayBuffer()), {
      mode: 0o600,
    });
    await checkedRun(s, args[0], args.slice(1).concat(path), {
      env: { ...(s.environment ?? process.env), ...env, HOME: s.home },
    });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
async function ensureCommandAlias(e: PlanEntry, s: DotfilesSystem) {
  if (!('aliases' in e.software)) return;
  const aliases = e.software.aliases[s.os] ?? [];
  const primary = e.software.health.checks.find((c) => c.type === 'command');
  if (
    primary?.type !== 'command' ||
    !aliases.length ||
    (await s.which(primary.command))
  )
    return;
  for (const alias of aliases) {
    const binary = await s.which(alias);
    if (!binary) continue;
    const target = join(s.home, '.local/bin', primary.command);
    try {
      const info = await lstat(target);
      if (
        info.isSymbolicLink() &&
        resolve(dirname(target), await readlink(target)) === resolve(binary)
      )
        return;
      throw new Error(
        `Compatibility target already exists; preserve and review ${target}`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await mkdir(dirname(target), { recursive: true });
    await symlink(resolve(binary), target);
    return;
  }
}
export async function installEntry(e: PlanEntry, s: DotfilesSystem) {
  const p = e.platform;
  if (e.classification === 'runtime' || !p || p.owner !== 'dot')
    return {
      id: e.id,
      status: 'external',
      detail:
        p?.guidance ?? 'Managed by runtime owner; run mise install separately.',
    };
  const present = await available(e, s);
  if (p.handler === 'k3s') return installK3s(e, s, present);
  if (p.handler === 'official-release') return installRelease(e, s, present);
  if (present) {
    await ensureCommandAlias(e, s);
    return { id: e.id, status: 'available' };
  }
  if (p.install === 'fallback' || p.install === 'system')
    return {
      id: e.id,
      status: 'manual',
      detail:
        p.guidance ?? 'Install through the declared external/system owner.',
    };
  if (p.handler) {
    switch (p.handler) {
      case 'docker-engine':
        await trustedInstaller(s, 'https://get.docker.com', ['sudo', 'sh']);
        break;
      case 'oh-my-zsh':
        await trustedInstaller(
          s,
          'https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh',
          ['sh'],
          { ...process.env, CHSH: 'no', RUNZSH: 'no', KEEP_ZSHRC: 'yes' },
        );
        break;
      case 'codex-cli':
        await trustedInstaller(
          s,
          'https://chatgpt.com/codex/install.sh',
          ['sh'],
          { ...process.env, CODEX_NON_INTERACTIVE: '1' },
        );
        break;
      case 'claude-code':
        await trustedInstaller(s, 'https://claude.ai/install.sh', ['bash']);
        break;
    }
    return { id: e.id, status: 'installed', handler: p.handler };
  }
  const pkg = p.package;
  const invocation: Record<string, [string, string[]]> = {
    apt: ['sudo', ['apt-get', 'install', '-y', '--', pkg]],
    brew: ['brew', ['install', '--formula', '--', pkg]],
    'brew-cask': ['brew', ['install', '--cask', '--', pkg]],
    winget: [
      'winget',
      [
        'install',
        '--exact',
        '--id',
        pkg,
        '--accept-source-agreements',
        '--accept-package-agreements',
        '--disable-interactivity',
      ],
    ],
    'powershell-gallery': [
      'pwsh',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        "$ErrorActionPreference='Stop';Install-Module -Name $env:CTHU_MODULE -Scope CurrentUser -Force",
      ],
    ],
  };
  const command = invocation[p.install];
  if (!command)
    return {
      id: e.id,
      status: 'manual',
      detail: p.guidance ?? 'Unsupported automatic install method',
    };
  await checkedRun(
    s,
    command[0],
    command[1],
    p.install === 'powershell-gallery'
      ? { env: { ...process.env, CTHU_MODULE: pkg } }
      : undefined,
  );
  await ensureCommandAlias(e, s);
  // Preserve the public command names of distro compatibility packages.
  return { id: e.id, status: 'installed', method: p.install };
}
async function installRelease(
  e: PlanEntry,
  s: DotfilesSystem,
  present: boolean,
) {
  const p = e.platform;
  const release = p?.release;
  if (!release) throw new Error('Missing release metadata');
  const command = e.software.health.checks.find((c) => c.type === 'command');
  if (command?.type !== 'command')
    throw new Error('Release requires command health');
  if (present) {
    const version = await s.run(command.command, ['version']);
    if (version.code !== 0 || !matchesVersion(version.stdout, release.version))
      return {
        id: e.id,
        status: 'manual',
        detail: `Installed release differs or is unverified; reconcile ${release.version} manually.`,
      };
    return { id: e.id, status: 'available' };
  }
  const arch =
    s.arch === 'x64' ? 'amd64' : s.arch === 'arm64' ? 'arm64' : s.arch;
  const artifact = release.artifacts[arch as 'amd64' | 'arm64'];
  if (!artifact) throw new Error(`No release for ${arch}`);
  const temp = await mkdtemp(join(tmpdir(), 'chc-release-'));
  try {
    const response = await s.fetch(artifact.url, {
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error('Release download failed');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (digest(bytes) !== artifact.sha256.toLowerCase())
      throw new Error(`Release checksum mismatch: ${e.id}/${arch}`);
    const archive = join(temp, 'release.tar.gz');
    await writeFile(archive, bytes);
    if (!/^[\w.-]+$/.test(command.command))
      throw new Error('Unsafe release executable name');
    await checkedRun(s, 'tar', [
      '-xzf',
      archive,
      '-C',
      temp,
      '--',
      command.command,
    ]);
    const binary = join(temp, command.command);
    if (!(await lstat(binary)).isFile())
      throw new Error('Release executable is not a regular file');
    await checkedRun(s, 'sudo', [
      'install',
      '-m',
      '0755',
      binary,
      release.destination,
    ]);
    return { id: e.id, status: 'installed', version: release.version, arch };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
async function installK3s(e: PlanEntry, s: DotfilesSystem, present: boolean) {
  const p = e.platform;
  if (!p?.service || !p.version) throw new Error('Incomplete k3s policy');
  const { service, version } = p;
  const kube = service.kubeconfig;
  if (present) {
    const result = await s.run('k3s', ['--version']);
    return {
      id: e.id,
      status:
        result.code === 0 && matchesVersion(result.stdout, version)
          ? 'available'
          : 'manual',
      detail: `Existing cluster preserved. Desired ${version}; inspect service/component policy manually before changing it.`,
    };
  }
  for (const path of ['/var/lib/rancher/k3s', service.config_path, kube.path]) {
    try {
      await (s.files?.stat ?? lstat)(path);
      throw new Error(
        `Existing cluster material at ${path}; refusing fresh install`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const distro = s.files
    ? await s.files.readText('/etc/os-release')
    : await readFile('/etc/os-release', 'utf8');
  if (!/^ID=(?:"?)(ubuntu|debian)(?:"?)$/m.test(distro))
    throw new Error('Automatic k3s fresh install supports Debian/Ubuntu only');
  const temp = await mkdtemp(join(tmpdir(), 'chc-k3s-'));
  try {
    await checkedRun(s, 'sudo', ['groupadd', '--force', kube.group]);
    const config = join(temp, 'config.yaml');
    await writeFile(
      config,
      stringify({
        'write-kubeconfig': kube.path,
        'write-kubeconfig-mode': kube.mode,
        'write-kubeconfig-group': kube.group,
        disable: service.fresh_install.disable,
        ...(service.fresh_install.enable.length
          ? { enable: service.fresh_install.enable }
          : {}),
      }),
      { mode: 0o600 },
    );
    await checkedRun(s, 'sudo', [
      'install',
      '-D',
      '-m',
      '0600',
      config,
      service.config_path,
    ]);
    await trustedInstaller(s, 'https://get.k3s.io', [
      'sudo',
      'env',
      `INSTALL_K3S_VERSION=${version}`,
      'sh',
    ]);
    await checkedRun(s, 'sudo', [
      'systemctl',
      'enable',
      '--now',
      'k3s.service',
    ]);
    const checks = await healthChecks(e.software.health, s);
    return {
      id: e.id,
      status: checks.every((c) => c.status === 'ok')
        ? 'installed'
        : 'attention',
      checks,
      detail:
        'New group membership may require a new login. No workloads or GitOps were installed.',
    };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
