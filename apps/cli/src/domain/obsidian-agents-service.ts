import {
  lstat,
  mkdir,
  readlink,
  realpath,
  stat,
  symlink,
  unlink,
} from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
} from 'node:path';
import type { ObsidianAgentsDataPaths } from '../infra/obsidian-agents-paths';
import {
  canonicalizeObsidianAgentsProfile,
  canonicalVaultPath,
  createEmptyObsidianAgentsConfig,
  normalizeObsidianAgentsProfile,
  type ObsidianAgentsProfile,
  type ObsidianAgentsProfileInput,
  readObsidianAgentsConfig,
  selectObsidianAgentsProfile,
  upsertObsidianAgentsProfile,
  writeObsidianAgentsConfig,
} from './obsidian-agents-config';

export type ObsidianAgentsErrorCode =
  | 'not_configured'
  | 'invalid_configuration'
  | 'setup_required'
  | 'conflict'
  | 'filesystem_failed';

export class ObsidianAgentsServiceError extends Error {
  readonly code: ObsidianAgentsErrorCode;
  readonly exitCode = 1;

  constructor(
    code: ObsidianAgentsErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ObsidianAgentsServiceError';
    this.code = code;
  }
}

export type ObsidianAgentsSetupInput = ObsidianAgentsProfileInput;

export type ObsidianAgentsPathKind =
  | 'absent'
  | 'directory'
  | 'link'
  | 'broken_link'
  | 'file'
  | 'other';

export type ObsidianAgentsLinkType = 'junction' | 'symbolic_link';

export type ObsidianAgentsPathState = {
  readonly path: string;
  readonly kind: ObsidianAgentsPathKind;
  readonly linkType?: ObsidianAgentsLinkType;
  readonly target?: string;
  readonly resolvedTarget?: string;
};

export type ObsidianAgentsLinkStatus =
  | 'correct'
  | 'missing'
  | 'broken'
  | 'mismatched'
  | 'not_link'
  | 'unsupported';

export type ObsidianAgentsTopology = {
  readonly source: ObsidianAgentsPathState;
  readonly agents: ObsidianAgentsPathState;
  readonly linkStatus: ObsidianAgentsLinkStatus;
  readonly expectedTarget: string;
};

export type ObsidianAgentsSetupTransition =
  | 'create'
  | 'link_existing_source'
  | 'repair_link'
  | 'reuse';

export type ObsidianAgentsSetupPlan = {
  readonly vault: ObsidianAgentsProfile;
  readonly platform: NodeJS.Platform;
  readonly transition: ObsidianAgentsSetupTransition;
  readonly topology: ObsidianAgentsTopology;
  readonly actions: readonly string[];
  readonly requiresConfirmation: boolean;
};

export type ObsidianAgentsSetupResult = {
  readonly vault: ObsidianAgentsProfile;
  readonly transition: ObsidianAgentsSetupTransition;
  readonly actions: readonly string[];
  readonly link: {
    readonly status: ObsidianAgentsLinkStatus;
    readonly type?: ObsidianAgentsLinkType;
    readonly target?: string;
    readonly resolvedTarget?: string;
  };
};

export type ObsidianAgentsStatus = {
  readonly configured: boolean;
  readonly healthy: boolean;
  readonly vaultPath: string;
  readonly sourcePath: string;
  readonly agentsPath: string;
  readonly paths: {
    readonly vaultExists: boolean;
    readonly sourceExists: boolean;
    readonly sourceInsideVault: boolean;
    readonly agentsExists: boolean;
    readonly skillsExists: boolean;
    readonly stateExists: boolean;
  };
  readonly source: ObsidianAgentsPathState;
  readonly link: {
    readonly status: ObsidianAgentsLinkStatus;
    readonly kind: ObsidianAgentsPathKind;
    readonly type?: ObsidianAgentsLinkType;
    readonly target?: string;
    readonly resolvedTarget?: string;
    readonly expectedTarget?: string;
  };
  readonly issues: readonly string[];
};

export type ObsidianAgentsStatusReport = {
  readonly summary: {
    readonly total: number;
    readonly healthy: number;
    readonly needsAttention: number;
  };
  readonly vaults: readonly ObsidianAgentsStatus[];
};

export async function createObsidianAgentsSetupPlan(
  _paths: ObsidianAgentsDataPaths,
  input: ObsidianAgentsSetupInput,
  options: { readonly platform?: NodeJS.Platform } = {},
): Promise<ObsidianAgentsSetupPlan> {
  const profile = await canonicalizeObsidianAgentsProfile(input);
  const platform = options.platform ?? process.platform;
  if (!(await isDirectory(profile.vaultPath))) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `Obsidian vault does not exist or is not a directory: ${profile.vaultPath}`,
    );
  }
  if (!(await isCanonicalSourceInsideVault(profile))) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `The visible source must resolve to a directory inside the Obsidian vault: ${profile.sourcePath}`,
    );
  }

  const topology = await inspectObsidianAgentsTopology(profile, { platform });
  if (
    topology.source.kind !== 'absent' &&
    topology.source.kind !== 'directory'
  ) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `The visible source path must be a real directory, not ${topology.source.kind}: ${profile.sourcePath}`,
    );
  }
  await assertContentDirectory(profile.sourcePath, 'skills');
  await assertContentDirectory(profile.sourcePath, 'state');

  let transition: ObsidianAgentsSetupTransition;
  const actions: string[] = [];
  switch (topology.agents.kind) {
    case 'absent':
      transition =
        topology.source.kind === 'absent' ? 'create' : 'link_existing_source';
      actions.push(
        topology.source.kind === 'absent'
          ? `create visible source ${profile.sourcePath}`
          : `preserve visible source ${profile.sourcePath}`,
        `ensure ${join(profile.sourcePath, 'skills')} and ${join(profile.sourcePath, 'state')}`,
        `create ${getObsidianAgentsLinkType(platform)} ${profile.agentsPath} -> ${profile.sourcePath}`,
      );
      break;
    case 'directory':
      throw new ObsidianAgentsServiceError(
        'conflict',
        `A real directory occupies ${profile.agentsPath}. Relocate it manually before rerunning setup; automatic directory migration is not supported.`,
      );
    case 'link':
      if (topology.linkStatus === 'correct') {
        transition = 'reuse';
        actions.push(`validate existing link ${profile.agentsPath}`);
        if (
          (await inspectObsidianAgentsPath(join(profile.sourcePath, 'skills')))
            .kind !== 'directory'
        ) {
          actions.push(`create ${join(profile.sourcePath, 'skills')}`);
        }
        if (
          (await inspectObsidianAgentsPath(join(profile.sourcePath, 'state')))
            .kind !== 'directory'
        ) {
          actions.push(`create ${join(profile.sourcePath, 'state')}`);
        }
      } else {
        transition = 'repair_link';
        actions.push(
          `replace only link ${profile.agentsPath} (current target: ${topology.agents.resolvedTarget ?? topology.agents.target ?? 'unavailable'})`,
          `preserve the old link target`,
          `ensure ${profile.sourcePath} with skills/ and state/`,
          `create ${getObsidianAgentsLinkType(platform)} ${profile.agentsPath} -> ${profile.sourcePath}`,
        );
      }
      break;
    case 'broken_link':
      transition = 'repair_link';
      actions.push(
        `replace broken link ${profile.agentsPath}`,
        `ensure ${profile.sourcePath} with skills/ and state/`,
        `create ${getObsidianAgentsLinkType(platform)} ${profile.agentsPath} -> ${profile.sourcePath}`,
      );
      break;
    case 'file':
    case 'other':
      throw new ObsidianAgentsServiceError(
        'invalid_configuration',
        `The compatibility path is an unsupported ${topology.agents.kind}: ${profile.agentsPath}`,
      );
  }

  const requiresConfirmation =
    transition !== 'reuse' ||
    actions.some((action) => action.startsWith('create '));
  return {
    vault: profile,
    platform,
    transition,
    topology,
    actions,
    requiresConfirmation,
  };
}

export async function applyObsidianAgentsSetup(
  paths: ObsidianAgentsDataPaths,
  plan: ObsidianAgentsSetupPlan,
): Promise<ObsidianAgentsSetupResult> {
  const current = await createObsidianAgentsSetupPlan(paths, plan.vault, {
    platform: plan.platform,
  });
  if (
    current.transition !== plan.transition ||
    !sameSetupTopology(current.topology, plan.topology)
  ) {
    throw new ObsidianAgentsServiceError(
      'conflict',
      `Obsidian agents topology changed after preview. Run setup again before modifying ${plan.vault.vaultPath}.`,
    );
  }

  try {
    switch (plan.transition) {
      case 'create':
      case 'link_existing_source':
        await ensureSourceDirectories(plan.vault.sourcePath);
        await createObsidianAgentsDirectoryLink(
          plan.vault.agentsPath,
          plan.vault.sourcePath,
          { platform: plan.platform },
        );
        break;
      case 'repair_link':
        await ensureSourceDirectories(plan.vault.sourcePath);
        await unlink(plan.vault.agentsPath);
        await createObsidianAgentsDirectoryLink(
          plan.vault.agentsPath,
          plan.vault.sourcePath,
          { platform: plan.platform },
        );
        break;
      case 'reuse':
        await ensureSourceDirectories(plan.vault.sourcePath);
        break;
    }

    const topology = await inspectObsidianAgentsTopology(plan.vault, {
      platform: plan.platform,
    });
    if (topology.linkStatus !== 'correct') {
      throw new Error(
        `Created compatibility link did not resolve to ${plan.vault.sourcePath}.`,
      );
    }

    const existing =
      (await readObsidianAgentsConfig(paths)) ??
      createEmptyObsidianAgentsConfig();
    await writeObsidianAgentsConfig(
      paths,
      upsertObsidianAgentsProfile(existing, plan.vault),
    );

    return {
      vault: plan.vault,
      transition: plan.transition,
      actions: plan.actions,
      link: {
        status: topology.linkStatus,
        type: topology.agents.linkType,
        target: topology.agents.target,
        resolvedTarget: topology.agents.resolvedTarget,
      },
    };
  } catch (error) {
    if (error instanceof ObsidianAgentsServiceError) throw error;
    const state = await describeCurrentState(plan.vault, plan.platform);
    throw new ObsidianAgentsServiceError(
      'filesystem_failed',
      `Unable to apply Obsidian agents topology. ${state}`,
      { cause: error },
    );
  }
}

export async function inspectObsidianAgentsStatus(options: {
  readonly paths: ObsidianAgentsDataPaths;
  readonly vaultPath?: string;
  readonly platform?: NodeJS.Platform;
}): Promise<ObsidianAgentsStatusReport> {
  const config = await readObsidianAgentsConfig(options.paths);
  const selectedPath = options.vaultPath
    ? await canonicalVaultPath(options.vaultPath)
    : undefined;
  const selected =
    selectedPath && config
      ? selectObsidianAgentsProfile(config, selectedPath)
      : undefined;
  const vaults = selectedPath
    ? [
        selected
          ? await inspectVaultStatus(selected, options.platform)
          : createMissingStatus(selectedPath),
      ]
    : await Promise.all(
        (config?.vaults ?? []).map((vault) =>
          inspectVaultStatus(vault, options.platform),
        ),
      );
  const healthy = vaults.filter((vault) => vault.healthy).length;
  return {
    summary: {
      total: vaults.length,
      healthy,
      needsAttention: vaults.length - healthy,
    },
    vaults,
  };
}

async function inspectVaultStatus(
  profile: ObsidianAgentsProfile,
  platform: NodeJS.Platform = process.platform,
): Promise<ObsidianAgentsStatus> {
  const topology = await inspectObsidianAgentsTopology(profile, { platform });
  const vaultExists = await isDirectory(profile.vaultPath);
  const sourceInsideVault =
    vaultExists && (await isCanonicalSourceInsideVault(profile));
  const sourceExists = topology.source.kind === 'directory';
  const skillsExists = sourceExists
    ? (await inspectObsidianAgentsPath(join(profile.sourcePath, 'skills')))
        .kind === 'directory'
    : false;
  const stateExists = sourceExists
    ? (await inspectObsidianAgentsPath(join(profile.sourcePath, 'state')))
        .kind === 'directory'
    : false;
  const issues: string[] = [];
  if (!vaultExists)
    issues.push(
      `Vault directory is missing: ${profile.vaultPath}. Restore it or set up its new location.`,
    );
  if (!sourceExists)
    issues.push(
      `Visible source is missing or is not a real directory: ${profile.sourcePath}.`,
    );
  if (vaultExists && !sourceInsideVault)
    issues.push(
      `Visible source resolves outside the vault: ${profile.sourcePath}. Choose a source inside the vault.`,
    );
  if (topology.linkStatus === 'not_link') {
    issues.push(
      `A real directory occupies ${profile.agentsPath}. Relocate it manually before rerunning setup.`,
    );
  } else if (topology.linkStatus === 'unsupported') {
    issues.push(
      `An unsupported ${topology.agents.kind} occupies ${profile.agentsPath}. Relocate it manually before rerunning setup.`,
    );
  } else if (topology.linkStatus === 'mismatched') {
    issues.push(
      `Link target mismatch: ${topology.agents.resolvedTarget ?? topology.agents.target ?? 'unavailable'}; expected ${profile.sourcePath}.`,
    );
  } else if (topology.linkStatus !== 'correct') {
    issues.push(`The .agents link is ${topology.linkStatus}.`);
  }
  if (!skillsExists)
    issues.push('The visible source is missing a real skills/ directory.');
  if (!stateExists)
    issues.push('The visible source is missing a real state/ directory.');

  return {
    configured: true,
    healthy:
      vaultExists &&
      sourceExists &&
      sourceInsideVault &&
      topology.linkStatus === 'correct' &&
      skillsExists &&
      stateExists,
    ...profile,
    paths: {
      vaultExists,
      sourceExists,
      sourceInsideVault,
      agentsExists: topology.agents.kind !== 'absent',
      skillsExists,
      stateExists,
    },
    source: topology.source,
    link: {
      status: topology.linkStatus,
      kind: topology.agents.kind,
      type: topology.agents.linkType,
      target: topology.agents.target,
      resolvedTarget: topology.agents.resolvedTarget,
      expectedTarget: topology.expectedTarget,
    },
    issues,
  };
}

export async function inspectObsidianAgentsTopology(
  profile: ObsidianAgentsProfile,
  options: { readonly platform?: NodeJS.Platform } = {},
): Promise<ObsidianAgentsTopology> {
  const platform = options.platform ?? process.platform;
  const [source, agents] = await Promise.all([
    inspectObsidianAgentsPath(profile.sourcePath, platform),
    inspectObsidianAgentsPath(profile.agentsPath, platform),
  ]);
  let linkStatus: ObsidianAgentsLinkStatus;
  if (agents.kind === 'absent') {
    linkStatus = 'missing';
  } else if (agents.kind === 'broken_link') {
    linkStatus = 'broken';
  } else if (agents.kind === 'link') {
    linkStatus =
      source.kind === 'directory' &&
      agents.resolvedTarget !== undefined &&
      (await sameCanonicalPath(
        agents.resolvedTarget,
        profile.sourcePath,
        platform,
      ))
        ? 'correct'
        : 'mismatched';
  } else if (agents.kind === 'directory') {
    linkStatus = 'not_link';
  } else {
    linkStatus = 'unsupported';
  }
  return {
    source,
    agents,
    linkStatus,
    expectedTarget: profile.sourcePath,
  };
}

export async function inspectObsidianAgentsPath(
  path: string,
  platform: NodeJS.Platform = process.platform,
): Promise<ObsidianAgentsPathState> {
  let details: Awaited<ReturnType<typeof lstat>>;
  try {
    details = await lstat(path);
  } catch (error) {
    if (isMissingFileError(error)) return { path, kind: 'absent' };
    throw error;
  }

  if (details.isSymbolicLink()) {
    const rawTarget = await readlink(path);
    const target = resolve(dirname(path), rawTarget);
    try {
      const resolvedTarget = await realpath(path);
      return {
        path,
        kind: 'link',
        linkType: getObsidianAgentsLinkType(platform),
        target,
        resolvedTarget,
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return {
          path,
          kind: 'broken_link',
          linkType: getObsidianAgentsLinkType(platform),
          target,
        };
      }
      throw error;
    }
  }
  if (details.isDirectory()) {
    return {
      path,
      kind: 'directory',
    };
  }
  if (details.isFile()) return { path, kind: 'file' };
  return { path, kind: 'other' };
}

export function getObsidianAgentsLinkType(
  platform: NodeJS.Platform = process.platform,
): ObsidianAgentsLinkType {
  return platform === 'win32' ? 'junction' : 'symbolic_link';
}

export async function createObsidianAgentsDirectoryLink(
  linkPath: string,
  sourcePath: string,
  options: { readonly platform?: NodeJS.Platform } = {},
): Promise<void> {
  const platform = options.platform ?? process.platform;
  if (!(await isDirectory(sourcePath))) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `Cannot create the .agents link because its source is not a directory: ${sourcePath}`,
    );
  }
  await symlink(
    sourcePath,
    linkPath,
    platform === 'win32' ? 'junction' : 'dir',
  );
  const state = await inspectObsidianAgentsPath(linkPath, platform);
  if (
    state.kind !== 'link' ||
    !state.resolvedTarget ||
    !(await sameCanonicalPath(state.resolvedTarget, sourcePath, platform))
  ) {
    throw new ObsidianAgentsServiceError(
      'filesystem_failed',
      `The .agents link does not resolve to its configured source: ${linkPath}`,
    );
  }
}

export async function sameCanonicalPath(
  left: string,
  right: string,
  platform: NodeJS.Platform = process.platform,
): Promise<boolean> {
  const [leftCanonical, rightCanonical] = await Promise.all([
    canonicalPath(left),
    canonicalPath(right),
  ]);
  return (
    normalizeComparablePath(leftCanonical, platform) ===
    normalizeComparablePath(rightCanonical, platform)
  );
}

function createMissingStatus(vaultPath: string): ObsidianAgentsStatus {
  const vault = normalizeObsidianAgentsProfile({ vaultPath });
  return {
    ...vault,
    configured: false,
    healthy: false,
    paths: {
      vaultExists: false,
      sourceExists: false,
      sourceInsideVault: false,
      agentsExists: false,
      skillsExists: false,
      stateExists: false,
    },
    source: { path: vault.sourcePath, kind: 'absent' },
    link: { status: 'missing', kind: 'absent' },
    issues: ['This vault is not configured. Run setup for this vault.'],
  };
}

async function ensureSourceDirectories(sourcePath: string): Promise<void> {
  await mkdir(join(sourcePath, 'skills'), { recursive: true });
  await mkdir(join(sourcePath, 'state'), { recursive: true });
}

async function assertContentDirectory(
  sourcePath: string,
  name: 'skills' | 'state',
): Promise<void> {
  const state = await inspectObsidianAgentsPath(join(sourcePath, name));
  if (state.kind !== 'absent' && state.kind !== 'directory') {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `The visible source ${name}/ path is not a real directory: ${state.path}`,
    );
  }
}

async function describeCurrentState(
  profile: ObsidianAgentsProfile,
  platform: NodeJS.Platform,
): Promise<string> {
  try {
    const topology = await inspectObsidianAgentsTopology(profile, { platform });
    return `Current state: source=${topology.source.kind} at ${profile.sourcePath}; .agents=${topology.agents.kind} at ${profile.agentsPath}.`;
  } catch {
    return `Inspect ${profile.sourcePath} and ${profile.agentsPath} before retrying setup.`;
  }
}

async function canonicalPath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    if (isMissingFileError(error)) return resolve(path);
    throw error;
  }
}

async function canonicalDestinationPath(path: string): Promise<string> {
  const missingSegments: string[] = [];
  let current = resolve(path);
  while (true) {
    try {
      const existing = await realpath(current);
      return resolve(existing, ...missingSegments.reverse());
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
      const parent = dirname(current);
      if (parent === current) return resolve(path);
      missingSegments.push(basename(current));
      current = parent;
    }
  }
}

async function isCanonicalSourceInsideVault(
  profile: ObsidianAgentsProfile,
): Promise<boolean> {
  const [vaultCanonical, sourceCanonical] = await Promise.all([
    canonicalPath(profile.vaultPath),
    canonicalDestinationPath(profile.sourcePath),
  ]);
  const sourceRelative = relative(vaultCanonical, sourceCanonical);
  return (
    sourceRelative.length > 0 &&
    sourceRelative !== '..' &&
    !sourceRelative.startsWith(`..${sep}`) &&
    !isAbsolute(sourceRelative)
  );
}

function sameSetupTopology(
  left: ObsidianAgentsTopology,
  right: ObsidianAgentsTopology,
): boolean {
  return (
    left.linkStatus === right.linkStatus &&
    samePathState(left.source, right.source) &&
    samePathState(left.agents, right.agents)
  );
}

function samePathState(
  left: ObsidianAgentsPathState,
  right: ObsidianAgentsPathState,
): boolean {
  return (
    left.path === right.path &&
    left.kind === right.kind &&
    left.linkType === right.linkType &&
    left.target === right.target &&
    left.resolvedTarget === right.resolvedTarget
  );
}

function normalizeComparablePath(
  value: string,
  platform: NodeJS.Platform,
): string {
  let comparable = value;
  if (platform === 'win32') {
    if (comparable.startsWith('\\\\?\\UNC\\')) {
      comparable = `\\\\${comparable.slice(8)}`;
    } else if (comparable.startsWith('\\\\?\\')) {
      comparable = comparable.slice(4);
    }
  }
  comparable = normalize(comparable).replace(/[\\/]+$/u, '');
  return platform === 'win32' ? comparable.toLowerCase() : comparable;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if (isMissingFileError(error)) return false;
    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
