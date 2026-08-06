import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  readlink,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const LEGACY_DESKTOP_MIGRATION_VERSION = 1;

const MARKER_NAME = '.legacy-desktop-migration-v1.json';
const LOCK_NAME = '.legacy-desktop-migration-v1.lock';
const PROFILE_LOCK_NAME = '.cthutool-agent.lock';
const STATUS_PATH = join('migration', 'legacy-desktop-status.json');

export type MigrationEnvironment = {
  readonly environmentId: string;
  readonly backendHttpUrl: string;
  readonly namespace: string;
  /** Runtime catalogs must explicitly identify development-only profiles. */
  readonly trust?: 'release' | 'custom-development';
};

export type LegacyDesktopMigrationInput = {
  readonly agentRootDir: string;
  readonly legacyRootDir: string;
  readonly environments: readonly MigrationEnvironment[];
  readonly explicitEnvironmentId?: string;
  readonly hooks?: {
    /** Test seam for modelling an interrupted migration before commit. */
    readonly afterStaging?: () => Promise<void> | void;
  };
};

export function resolveLegacyDesktopDataRoot(
  options: {
    readonly platform?: NodeJS.Platform;
    readonly homeDir?: string;
    readonly env?: Readonly<Record<string, string | undefined>>;
  } = {},
): string {
  const platform = options.platform ?? process.platform;
  const home = resolve(options.homeDir ?? homedir());
  const environment = options.env ?? process.env;
  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'CthuDesktop');
  }
  if (platform === 'win32') {
    return join(
      environment.APPDATA ?? join(home, 'AppData', 'Roaming'),
      'CthuDesktop',
    );
  }
  return join(
    environment.XDG_CONFIG_HOME ?? join(home, '.config'),
    'CthuDesktop',
  );
}

export type LegacyDesktopMigrationReason =
  | 'legacy-data-absent'
  | 'exact-backend-match'
  | 'explicit-environment-selection'
  | 'legacy-backend-ambiguous'
  | 'legacy-backend-missing'
  | 'legacy-backend-unmatched'
  | 'explicit-environment-untrusted-or-unknown'
  | 'migration-complete'
  | 'migration-already-complete'
  | 'migration-active-lock'
  | 'migration-failed';

export type LegacyDesktopMigrationStatus =
  | 'absent'
  | 'selection-required'
  | 'ready'
  | 'migrated'
  | 'already-migrated'
  | 'locked'
  | 'failed';

export type LegacyDesktopMigrationReport = {
  readonly schemaVersion: 1;
  readonly status: LegacyDesktopMigrationStatus;
  readonly reason: LegacyDesktopMigrationReason;
  readonly message: string;
  readonly environmentId?: string;
  readonly copiedProfileFiles: number;
  readonly configApplied: boolean;
  readonly retryCommand?: string;
};

type LegacyDesktopConfig = {
  readonly backendUrl?: unknown;
  readonly activeEnvironmentId?: unknown;
  readonly activeEnvironment?: { readonly backendUrl?: unknown };
  readonly environmentProfiles?: readonly {
    readonly id?: unknown;
    readonly backendUrl?: unknown;
  }[];
  readonly deviceName?: unknown;
  readonly connectionEnabled?: unknown;
  readonly browserRuntime?: {
    readonly executablePath?: unknown;
  };
};

type MigrationPlan = LegacyDesktopMigrationReport & {
  readonly legacyConfig?: LegacyDesktopConfig;
  readonly legacyProfilesDir?: string;
  readonly target?: MigrationEnvironment;
  readonly targetRootDir?: string;
};

type TreeEntry =
  | {
      readonly kind: 'file';
      readonly path: string;
      readonly sha256: string;
      readonly mode: number;
    }
  | {
      readonly kind: 'symlink';
      readonly path: string;
      readonly targetPath: string;
    };

type MigrationMarker = {
  readonly schemaVersion: 1;
  readonly environmentId: string;
  readonly legacyRootDir: string;
  readonly sourceProfileDigest: string;
  readonly sourceProfileFiles: number;
  readonly configApplied: boolean;
  readonly completedAt: string;
};

export async function inspectLegacyDesktopMigration(
  input: LegacyDesktopMigrationInput,
): Promise<LegacyDesktopMigrationReport> {
  return publicReport(await createMigrationPlan(input));
}

export async function readLegacyDesktopMigrationStatus(
  agentRootDir: string,
): Promise<LegacyDesktopMigrationReport | undefined> {
  try {
    return parseReport(
      JSON.parse(await readFile(join(agentRootDir, STATUS_PATH), 'utf8')),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    return undefined;
  }
}

export async function migrateLegacyDesktopData(
  input: LegacyDesktopMigrationInput,
): Promise<LegacyDesktopMigrationReport> {
  const plan = await createMigrationPlan(input);
  if (plan.status !== 'ready' || !plan.target || !plan.targetRootDir) {
    const report = publicReport(plan);
    await persistReport(input.agentRootDir, report);
    return report;
  }

  await mkdir(plan.targetRootDir, { mode: 0o700, recursive: true });
  const profileLockPath = join(
    plan.targetRootDir,
    'browser-profiles',
    PROFILE_LOCK_NAME,
  );
  if (await isActiveLock(profileLockPath)) {
    return persistAndReturn(
      input.agentRootDir,
      report({
        status: 'locked',
        reason: 'migration-active-lock',
        message:
          'Legacy data migration is blocked by an active Agent profile lock; stop the Agent and retry.',
        environmentId: plan.target.environmentId,
        retryCommand: 'chc agent stop && chc agent start',
      }),
    );
  }

  const lockPath = join(plan.targetRootDir, LOCK_NAME);
  const lock = await acquireMigrationLock(lockPath);
  if (!lock) {
    return persistAndReturn(
      input.agentRootDir,
      report({
        status: 'locked',
        reason: 'migration-active-lock',
        message:
          'Another legacy data migration owns the environment lock; retry after it finishes.',
        environmentId: plan.target.environmentId,
        retryCommand: 'chc agent doctor',
      }),
    );
  }

  const stagingRoot = join(
    plan.targetRootDir,
    `.legacy-desktop-staging-${randomUUID()}`,
  );
  try {
    await mkdir(stagingRoot, { mode: 0o700, recursive: false });
    const sourceEntries = plan.legacyProfilesDir
      ? await collectTree(plan.legacyProfilesDir)
      : [];
    const stagedProfiles = join(stagingRoot, 'browser-profiles');
    await copyTreeEntries(
      plan.legacyProfilesDir,
      stagedProfiles,
      sourceEntries,
    );
    await assertTreeMatches(stagedProfiles, sourceEntries);

    const transformedConfig = transformLegacyConfig(plan.legacyConfig);
    const stagedConfigPath = join(stagingRoot, 'config.json');
    if (transformedConfig) {
      await writePrivateJson(stagedConfigPath, transformedConfig);
    }
    await input.hooks?.afterStaging?.();

    const targetProfiles = join(plan.targetRootDir, 'browser-profiles');
    await assertDestinationCompatible(targetProfiles, sourceEntries);
    await copyTreeEntries(stagedProfiles, targetProfiles, sourceEntries);
    await assertTreeContains(targetProfiles, sourceEntries);
    const sourceAfterCommit = plan.legacyProfilesDir
      ? await collectTree(plan.legacyProfilesDir)
      : [];
    if (treeDigest(sourceAfterCommit) !== treeDigest(sourceEntries)) {
      throw new Error('Legacy browser profiles changed during migration');
    }

    let configApplied = false;
    const targetConfigPath = join(plan.targetRootDir, 'config.json');
    if (transformedConfig && !(await pathExists(targetConfigPath))) {
      await copyFile(
        stagedConfigPath,
        targetConfigPath,
        constants.COPYFILE_EXCL,
      );
      await chmodPrivate(targetConfigPath);
      configApplied = true;
    }

    const marker: MigrationMarker = {
      schemaVersion: LEGACY_DESKTOP_MIGRATION_VERSION,
      environmentId: plan.target.environmentId,
      legacyRootDir: resolve(input.legacyRootDir),
      sourceProfileDigest: treeDigest(sourceEntries),
      sourceProfileFiles: sourceEntries.filter((entry) => entry.kind === 'file')
        .length,
      configApplied,
      completedAt: new Date().toISOString(),
    };
    await writePrivateJson(join(plan.targetRootDir, MARKER_NAME), marker);
    return persistAndReturn(
      input.agentRootDir,
      report({
        status: 'migrated',
        reason: 'migration-complete',
        message:
          'Legacy Desktop settings and browser profiles were copied without changing the originals.',
        environmentId: plan.target.environmentId,
        copiedProfileFiles: marker.sourceProfileFiles,
        configApplied,
      }),
    );
  } catch (error) {
    return persistAndReturn(
      input.agentRootDir,
      report({
        status: 'failed',
        reason: 'migration-failed',
        message: safeErrorMessage(error),
        environmentId: plan.target.environmentId,
        retryCommand: 'chc agent doctor',
      }),
    );
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
    await lock.close().catch(() => undefined);
    await rm(lockPath, { force: true });
  }
}

export function legacyDesktopMigrationMarkerPath(
  agentRootDir: string,
  environment: Pick<MigrationEnvironment, 'namespace'>,
): string {
  return join(agentRootDir, 'environments', environment.namespace, MARKER_NAME);
}

async function createMigrationPlan(
  input: LegacyDesktopMigrationInput,
): Promise<MigrationPlan> {
  const legacyRootDir = resolve(input.legacyRootDir);
  const configPath = join(legacyRootDir, 'config.json');
  const profilesDir = join(legacyRootDir, 'browser-profiles');
  const [hasConfig, hasProfiles] = await Promise.all([
    pathExists(configPath),
    directoryHasEntries(profilesDir),
  ]);
  if (!hasConfig && !hasProfiles) {
    return report({
      status: 'absent',
      reason: 'legacy-data-absent',
      message: 'No legacy Electron Desktop settings or profiles were found.',
    });
  }

  let legacyConfig: LegacyDesktopConfig | undefined;
  if (hasConfig) {
    try {
      const parsed = JSON.parse(await readFile(configPath, 'utf8')) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Legacy Desktop config is not a JSON object');
      }
      legacyConfig = parsed as LegacyDesktopConfig;
    } catch (error) {
      return report({
        status: 'failed',
        reason: 'migration-failed',
        message: safeErrorMessage(error),
        retryCommand: 'chc agent doctor',
      });
    }
  }

  const trusted = input.environments.filter(isTrustedMigrationEnvironment);
  const legacyBackend = legacyBackendUrl(legacyConfig);
  const exactMatches = legacyBackend
    ? trusted.filter(
        (environment) =>
          comparableUrl(environment.backendHttpUrl) ===
          comparableUrl(legacyBackend),
      )
    : [];
  let target: MigrationEnvironment | undefined;
  let selectionReason: LegacyDesktopMigrationReason;
  if (exactMatches.length === 1) {
    target = exactMatches[0];
    selectionReason = 'exact-backend-match';
  } else if (input.explicitEnvironmentId) {
    target = trusted.find(
      (environment) =>
        environment.environmentId === input.explicitEnvironmentId,
    );
    if (!target) {
      return report({
        status: 'selection-required',
        reason: 'explicit-environment-untrusted-or-unknown',
        message:
          'The explicitly selected environment is not present in the trusted release catalog.',
        retryCommand: 'chc agent env list && chc agent env set <id>',
      });
    }
    selectionReason = 'explicit-environment-selection';
  } else {
    const reason: LegacyDesktopMigrationReason = !legacyBackend
      ? 'legacy-backend-missing'
      : exactMatches.length > 1
        ? 'legacy-backend-ambiguous'
        : 'legacy-backend-unmatched';
    return report({
      status: 'selection-required',
      reason,
      message:
        'Legacy data cannot be assigned to exactly one trusted environment; select it explicitly before retrying.',
      retryCommand: 'chc agent env list && chc agent env set <id>',
    });
  }

  const targetRootDir = join(
    resolve(input.agentRootDir),
    'environments',
    target.namespace,
  );
  let marker: MigrationMarker | undefined;
  try {
    marker = await readMarker(join(targetRootDir, MARKER_NAME));
  } catch (error) {
    return report({
      status: 'failed',
      reason: 'migration-failed',
      message: safeErrorMessage(error),
      environmentId: target.environmentId,
      retryCommand: 'chc agent doctor',
    });
  }
  if (marker) {
    if (
      marker.environmentId !== target.environmentId ||
      marker.legacyRootDir !== legacyRootDir
    ) {
      return report({
        status: 'failed',
        reason: 'migration-failed',
        message:
          'The environment migration marker belongs to a different legacy root or environment.',
        environmentId: target.environmentId,
        retryCommand: 'chc agent doctor',
      });
    }
    return {
      ...report({
        status: 'already-migrated',
        reason: 'migration-already-complete',
        message:
          'Legacy Desktop data was already migrated; the original data remains available for rollback.',
        environmentId: target.environmentId,
        copiedProfileFiles: marker.sourceProfileFiles,
        configApplied: marker.configApplied,
      }),
      legacyConfig,
      legacyProfilesDir: hasProfiles ? profilesDir : undefined,
      target,
      targetRootDir,
    };
  }

  return {
    ...report({
      status: 'ready',
      reason: selectionReason,
      message: 'Legacy Desktop data is ready for non-destructive migration.',
      environmentId: target.environmentId,
    }),
    legacyConfig,
    legacyProfilesDir: hasProfiles ? profilesDir : undefined,
    target,
    targetRootDir,
  };
}

function legacyBackendUrl(config: LegacyDesktopConfig | undefined) {
  const activeId = text(config?.activeEnvironmentId);
  const activeProfile = config?.environmentProfiles?.find(
    (profile) => text(profile.id) === activeId,
  );
  return (
    text(activeProfile?.backendUrl) ??
    text(config?.activeEnvironment?.backendUrl) ??
    text(config?.backendUrl)
  );
}

function transformLegacyConfig(
  config: LegacyDesktopConfig | undefined,
): Record<string, unknown> | undefined {
  if (!config) return undefined;
  const deviceName = text(config.deviceName);
  const browserExecutablePath = text(config.browserRuntime?.executablePath);
  const connectionEnabled =
    typeof config.connectionEnabled === 'boolean'
      ? config.connectionEnabled
      : undefined;
  const transformed = {
    ...(deviceName ? { deviceName } : {}),
    ...(connectionEnabled === undefined ? {} : { connectionEnabled }),
    ...(browserExecutablePath ? { browserExecutablePath } : {}),
  };
  return Object.keys(transformed).length > 0 ? transformed : undefined;
}

function comparableUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    if (url.username || url.password || url.search || url.hash)
      return undefined;
    return url.href.replace(/\/+$/, '');
  } catch {
    return undefined;
  }
}

function isTrustedMigrationEnvironment(
  environment: MigrationEnvironment,
): boolean {
  if (
    environment.trust === 'custom-development' ||
    !/^[a-z][a-z0-9-]{0,63}$/.test(environment.environmentId) ||
    !/^[a-z][a-z0-9_-]{0,63}$/.test(environment.namespace)
  ) {
    return false;
  }
  const backend = comparableUrl(environment.backendHttpUrl);
  return Boolean(backend && new URL(backend).protocol === 'https:');
}

async function collectTree(root: string): Promise<TreeEntry[]> {
  if (!(await pathExists(root))) return [];
  const output: TreeEntry[] = [];
  await walkTree(resolve(root), resolve(root), output);
  return output.sort((left, right) => left.path.localeCompare(right.path));
}

async function walkTree(
  root: string,
  directory: string,
  output: TreeEntry[],
): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === PROFILE_LOCK_NAME) continue;
    const absolutePath = join(directory, entry.name);
    const relativePath = portablePath(relative(root, absolutePath));
    if (entry.isDirectory()) {
      await walkTree(root, absolutePath, output);
    } else if (entry.isFile()) {
      const metadata = await stat(absolutePath);
      output.push({
        kind: 'file',
        path: relativePath,
        sha256: await sha256File(absolutePath),
        mode: metadata.mode & 0o777,
      });
    } else if (entry.isSymbolicLink()) {
      const rawTarget = await readlink(absolutePath);
      const resolvedTarget = resolve(dirname(absolutePath), rawTarget);
      assertInside(root, resolvedTarget);
      output.push({
        kind: 'symlink',
        path: relativePath,
        targetPath: portablePath(relative(root, resolvedTarget)),
      });
    } else {
      throw new Error(`Unsupported legacy profile entry: ${relativePath}`);
    }
  }
}

async function copyTreeEntries(
  sourceRoot: string | undefined,
  destinationRoot: string,
  entries: readonly TreeEntry[],
): Promise<void> {
  if (!sourceRoot || entries.length === 0) return;
  await mkdir(destinationRoot, { mode: 0o700, recursive: true });
  for (const entry of entries) {
    const source = joinPortable(sourceRoot, entry.path);
    const destination = joinPortable(destinationRoot, entry.path);
    await mkdir(dirname(destination), { mode: 0o700, recursive: true });
    if (await pathExists(destination)) continue;
    if (entry.kind === 'file') {
      await copyFile(source, destination, constants.COPYFILE_EXCL);
      if (process.platform !== 'win32') await chmod(destination, entry.mode);
    } else {
      const target = joinPortable(destinationRoot, entry.targetPath);
      const linkTarget = relative(dirname(destination), target) || '.';
      await symlink(linkTarget, destination);
    }
  }
}

async function assertDestinationCompatible(
  destinationRoot: string,
  entries: readonly TreeEntry[],
): Promise<void> {
  for (const entry of entries) {
    const destination = joinPortable(destinationRoot, entry.path);
    if (!(await pathExists(destination))) continue;
    if (entry.kind === 'file') {
      const metadata = await lstat(destination);
      if (
        !metadata.isFile() ||
        (await sha256File(destination)) !== entry.sha256
      ) {
        throw new Error(`Agent profile destination conflicts at ${entry.path}`);
      }
    } else {
      const metadata = await lstat(destination);
      if (!metadata.isSymbolicLink()) {
        throw new Error(`Agent profile destination conflicts at ${entry.path}`);
      }
      const actual = resolve(dirname(destination), await readlink(destination));
      const expected = joinPortable(destinationRoot, entry.targetPath);
      if (actual !== expected) {
        throw new Error(`Agent profile destination conflicts at ${entry.path}`);
      }
    }
  }
}

async function assertTreeMatches(
  root: string,
  expected: readonly TreeEntry[],
): Promise<void> {
  const actual = await collectTree(root);
  if (treeDigest(actual) !== treeDigest(expected)) {
    throw new Error('Staged legacy browser profile validation failed');
  }
}

async function assertTreeContains(
  root: string,
  expected: readonly TreeEntry[],
): Promise<void> {
  await assertDestinationCompatible(root, expected);
}

function treeDigest(entries: readonly TreeEntry[]): string {
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  await new Promise<void>((resolvePromise, reject) => {
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.once('end', resolvePromise);
    stream.once('error', reject);
  });
  return hash.digest('hex');
}

async function readMarker(path: string): Promise<MigrationMarker | undefined> {
  try {
    const input = JSON.parse(await readFile(path, 'utf8')) as MigrationMarker;
    if (
      input?.schemaVersion !== LEGACY_DESKTOP_MIGRATION_VERSION ||
      typeof input.environmentId !== 'string' ||
      typeof input.legacyRootDir !== 'string' ||
      typeof input.sourceProfileDigest !== 'string' ||
      typeof input.sourceProfileFiles !== 'number' ||
      typeof input.configApplied !== 'boolean'
    ) {
      throw new Error('Legacy migration marker is invalid');
    }
    return input;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function persistReport(
  agentRootDir: string,
  value: LegacyDesktopMigrationReport,
): Promise<void> {
  await writePrivateJson(join(agentRootDir, STATUS_PATH), value);
}

async function persistAndReturn(
  agentRootDir: string,
  value: LegacyDesktopMigrationReport,
): Promise<LegacyDesktopMigrationReport> {
  await persistReport(agentRootDir, value);
  return value;
}

async function writePrivateJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { mode: 0o700, recursive: true });
  const temporary = `${path}.tmp-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmodPrivate(temporary);
  await rename(temporary, path);
}

async function chmodPrivate(path: string): Promise<void> {
  if (process.platform !== 'win32') await chmod(path, 0o600);
}

async function directoryHasEntries(path: string): Promise<boolean> {
  try {
    return (await readdir(path)).some((name) => name !== PROFILE_LOCK_NAME);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function acquireMigrationLock(
  path: string,
): Promise<Awaited<ReturnType<typeof open>> | undefined> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const handle = await open(path, 'wx', 0o600);
      await handle.writeFile(
        `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
      );
      return handle;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const raw = await readFile(path, 'utf8').catch(() => undefined);
      if (raw === undefined) continue;
      const pid = lockPid(raw);
      if (pid && isProcessAlive(pid)) return undefined;
      if (!pid && (await isRecentFile(path))) return undefined;
      await removeIfUnchanged(path, raw);
    }
  }
  throw new Error('Unable to acquire the legacy data migration lock');
}

async function isActiveLock(path: string): Promise<boolean> {
  const raw = await readFile(path, 'utf8').catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  });
  if (raw === undefined) return false;
  const pid = lockPid(raw);
  if (pid && isProcessAlive(pid)) return true;
  await removeIfUnchanged(path, raw);
  return false;
}

async function removeIfUnchanged(
  path: string,
  expected: string,
): Promise<void> {
  const current = await readFile(path, 'utf8').catch(() => undefined);
  if (current === expected) await rm(path, { force: true });
}

function lockPid(raw: string): number | undefined {
  try {
    const value = JSON.parse(raw) as { readonly pid?: unknown };
    return typeof value.pid === 'number' &&
      Number.isSafeInteger(value.pid) &&
      value.pid > 0
      ? value.pid
      : undefined;
  } catch {
    return undefined;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

async function isRecentFile(path: string): Promise<boolean> {
  try {
    return Date.now() - (await stat(path)).mtimeMs < 60_000;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function report(
  input: Pick<LegacyDesktopMigrationReport, 'status' | 'reason' | 'message'> &
    Partial<
      Pick<
        LegacyDesktopMigrationReport,
        | 'environmentId'
        | 'copiedProfileFiles'
        | 'configApplied'
        | 'retryCommand'
      >
    >,
): MigrationPlan {
  return {
    schemaVersion: LEGACY_DESKTOP_MIGRATION_VERSION,
    status: input.status,
    reason: input.reason,
    message: input.message,
    copiedProfileFiles: input.copiedProfileFiles ?? 0,
    configApplied: input.configApplied ?? false,
    ...(input.environmentId ? { environmentId: input.environmentId } : {}),
    ...(input.retryCommand ? { retryCommand: input.retryCommand } : {}),
  };
}

function publicReport(plan: MigrationPlan): LegacyDesktopMigrationReport {
  return {
    schemaVersion: plan.schemaVersion,
    status: plan.status,
    reason: plan.reason,
    message: plan.message,
    copiedProfileFiles: plan.copiedProfileFiles,
    configApplied: plan.configApplied,
    ...(plan.environmentId ? { environmentId: plan.environmentId } : {}),
    ...(plan.retryCommand ? { retryCommand: plan.retryCommand } : {}),
  };
}

function parseReport(input: unknown): LegacyDesktopMigrationReport | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const value = input as LegacyDesktopMigrationReport;
  return value.schemaVersion === LEGACY_DESKTOP_MIGRATION_VERSION &&
    typeof value.status === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.message === 'string'
    ? value
    : undefined;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Migration failed';
  return message
    .replace(/(secret|token|password)\s*[=:]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 500);
}

function text(input: unknown): string | undefined {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined;
}

function joinPortable(root: string, path: string): string {
  const segments = path.split('/').filter(Boolean);
  const output = resolve(root, ...segments);
  assertInside(resolve(root), output);
  return output;
}

function portablePath(path: string): string {
  return path.split(sep).join('/');
}

function assertInside(root: string, path: string): void {
  const child = relative(resolve(root), resolve(path));
  if (child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new Error('Legacy profile entry escapes its profile root');
  }
}
