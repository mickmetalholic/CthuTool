import { readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  inspectLegacyDesktopMigration,
  resolveLegacyDesktopDataRoot,
} from '@cthutool/agent-data-migration';
import {
  rollbackActiveVersion,
  smokeExtractedAgentBundle,
} from '@cthutool/agent-release';
import type {
  AgentDoctorCheck,
  AgentEnvironmentView,
  AgentLifecycleService,
  AgentLifecycleStatus,
} from '../domain/agent-lifecycle';
import { getCliVersion } from '../domain/self-update-manager';
import { readAgentInstance, requestAgentHealth } from './agent-control';
import {
  type AgentPaths,
  assertInstalledBundleInventory,
  readEnvironmentSelection,
  readInstalledBundle,
  resolveAgentPaths,
  writeEnvironmentSelection,
} from './agent-paths';
import {
  getAutostartStatus,
  setAutostart,
  startInstalledAgent,
} from './agent-platform';
import {
  type AgentReleaseInstallerDependencies,
  installAgentRelease,
} from './agent-release-installer';
import {
  readTrayInstanceRecord,
  requestTrayEnvironmentSwitch,
  requestTrayHealth,
  requestTrayOpen,
  resolveTrayInstancePath,
  stopTrayOwnedAgent,
} from './agent-tray-control';

export type FileSystemAgentLifecycleServiceOptions = {
  readonly paths?: AgentPaths;
  readonly legacyDesktopRoot?: string;
  readonly release?: Omit<AgentReleaseInstallerDependencies, 'cliVersion'> & {
    readonly cliVersion?: string;
  };
  readonly platform?: {
    readonly getAutostartStatus?: typeof getAutostartStatus;
    readonly setAutostart?: typeof setAutostart;
    readonly startInstalledAgent?: typeof startInstalledAgent;
  };
};

export class FileSystemAgentLifecycleService implements AgentLifecycleService {
  readonly paths: AgentPaths;
  private readonly legacyDesktopRoot: string;
  private readonly release: Omit<
    AgentReleaseInstallerDependencies,
    'cliVersion'
  > & {
    readonly cliVersion?: string;
  };
  private readonly platform: Required<
    NonNullable<FileSystemAgentLifecycleServiceOptions['platform']>
  >;

  constructor(options: FileSystemAgentLifecycleServiceOptions = {}) {
    this.paths = options.paths ?? resolveAgentPaths();
    this.legacyDesktopRoot =
      options.legacyDesktopRoot ?? resolveLegacyDesktopDataRoot();
    this.release = { ...options.release };
    this.platform = {
      getAutostartStatus:
        options.platform?.getAutostartStatus ?? getAutostartStatus,
      setAutostart: options.platform?.setAutostart ?? setAutostart,
      startInstalledAgent:
        options.platform?.startInstalledAgent ?? startInstalledAgent,
    };
  }

  async install(
    input: {
      readonly channel?: 'stable' | 'beta';
      readonly version?: string;
    } = {},
  ) {
    if (await this.isRunning()) {
      throw new Error(
        'Stop the running Agent before install, or use chc agent update for coordinated replacement',
      );
    }
    return installAgentRelease({
      paths: this.paths,
      dependencies: {
        ...this.release,
        cliVersion: this.release.cliVersion ?? getCliVersion(),
      },
      ...input,
    });
  }

  async update(input: { readonly channel?: 'stable' | 'beta' } = {}) {
    const wasRunning = await this.isRunning();
    const current = await this.installedVersion();
    const autostart = await this.platform.getAutostartStatus(this.paths);
    if (wasRunning) await this.stop();
    const result = await this.install(input);
    if (autostart.enabled) {
      await this.platform.setAutostart(this.paths, true);
    }
    if (!wasRunning || !result.changed) {
      if (wasRunning) await this.start();
      return result;
    }
    try {
      await this.start();
      return result;
    } catch (error) {
      await stopTrayOwnedAgent({ userDataDir: this.paths.userDataDir }).catch(
        () => undefined,
      );
      await rollbackActiveVersion({
        installRoot: this.paths.installRoot,
        smokeCheck: async (root) => {
          const smokeData = join(this.paths.installRoot, '.rollback-smoke');
          try {
            await (this.release.smoke ?? smokeExtractedAgentBundle)({
              bundleRoot: root,
              userDataDir: smokeData,
            });
          } finally {
            await rm(smokeData, { force: true, recursive: true });
          }
        },
      });
      if (autostart.enabled) {
        await this.platform.setAutostart(this.paths, true);
      }
      await this.start();
      throw new Error(
        `Agent update to ${result.version} failed readiness and rolled back to ${current ?? 'the previous version'}`,
        { cause: error },
      );
    }
  }

  start() {
    return this.platform.startInstalledAgent(this.paths);
  }

  stop() {
    return stopTrayOwnedAgent({ userDataDir: this.paths.userDataDir });
  }

  async restart(): Promise<'restarted'> {
    await this.stop();
    await this.start();
    return 'restarted';
  }

  async status(): Promise<AgentLifecycleStatus> {
    const version = await this.installedVersion();
    const environments = version ? await this.listEnvironments() : [];
    const selected = environments.find((environment) => environment.active);
    const autostart = await this.platform.getAutostartStatus(this.paths);
    let trayState = 'stopped';
    let trayPid: number | undefined;
    let backend: AgentLifecycleStatus['backend'] = { status: 'offline' };
    let browser: AgentLifecycleStatus['browser'] = {
      ready: false,
      status: 'unavailable',
    };
    const tray = await readTrayInstanceRecord(
      resolveTrayInstancePath(this.paths.userDataDir),
    ).catch(() => undefined);
    if (tray) {
      trayPid = tray.pid;
      try {
        trayState = (await requestTrayHealth({ record: tray, timeoutMs: 500 }))
          .state;
      } catch {
        trayState = 'unreachable';
      }
    }
    const agent = await readAgentInstance(this.paths.userDataDir).catch(
      () => undefined,
    );
    if (agent) {
      try {
        const health = await requestAgentHealth(agent, 750);
        backend = {
          status: health.backend.status,
          ...(health.backend.lastError
            ? { lastError: health.backend.lastError }
            : {}),
        };
        browser = {
          ready: health.browser.ready,
          status: health.browser.status,
        };
      } catch {
        /* exact record exists but local control is unavailable */
      }
    }
    return {
      installed: Boolean(version),
      ...(version ? { version } : {}),
      tray: { state: trayState, ...(trayPid ? { pid: trayPid } : {}) },
      ...(selected ? { environment: selected } : {}),
      backend,
      browser,
      autostart,
    };
  }

  async settings(): Promise<'opened'> {
    await this.start();
    const record = await this.requireTray();
    await requestTrayOpen({ record });
    return 'opened';
  }

  async logs(
    input: { readonly lines?: number; readonly follow?: boolean } = {},
  ): Promise<readonly string[]> {
    const count = Math.max(1, Math.min(input.lines ?? 200, 10_000));
    try {
      const raw = await readFile(join(this.paths.logsDir, 'agent.log'), 'utf8');
      return raw.split(/\r?\n/).filter(Boolean).slice(-count);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  async listEnvironments(): Promise<readonly AgentEnvironmentView[]> {
    const { catalog } = await readInstalledBundle(this.paths);
    const selected =
      (await readEnvironmentSelection(this.paths)) ??
      catalog.profiles[0]?.environmentId;
    return catalog.profiles.map((environment) => ({
      id: environment.environmentId,
      label: environment.label,
      active: environment.environmentId === selected,
      webOrigin: environment.webOrigin,
      backendHttpUrl: environment.backendHttpUrl,
    }));
  }

  async getEnvironment(id?: string): Promise<AgentEnvironmentView> {
    const environments = await this.listEnvironments();
    const environment = id
      ? environments.find((candidate) => candidate.id === id)
      : environments.find((candidate) => candidate.active);
    if (!environment)
      throw new Error(
        id
          ? `Unknown Agent environment "${id}"`
          : 'No Agent environment is selected',
      );
    return environment;
  }

  async setEnvironment(id: string) {
    const { catalog } = await readInstalledBundle(this.paths);
    const environment = catalog.profiles.find(
      (candidate) => candidate.environmentId === id,
    );
    if (!environment) throw new Error(`Unknown Agent environment "${id}"`);
    const previous =
      (await readEnvironmentSelection(this.paths)) ??
      catalog.profiles[0]?.environmentId;
    const tray = await readTrayInstanceRecord(
      resolveTrayInstancePath(this.paths.userDataDir),
    ).catch(() => undefined);
    if (tray)
      await requestTrayEnvironmentSwitch({ record: tray, environmentId: id });
    else await writeEnvironmentSelection(this.paths, id);
    return { id, changed: previous !== id };
  }

  async autostart(action: 'enable' | 'disable' | 'status') {
    if (action === 'status')
      return this.platform.getAutostartStatus(this.paths);
    return this.platform.setAutostart(this.paths, action === 'enable');
  }

  async doctor(): Promise<readonly AgentDoctorCheck[]> {
    const checks: AgentDoctorCheck[] = [];
    let installed: Awaited<ReturnType<typeof readInstalledBundle>> | undefined;
    let profileLockPath = join(
      this.paths.userDataDir,
      'browser-profiles',
      '.cthutool-agent.lock',
    );
    try {
      installed = await readInstalledBundle(this.paths);
      await assertInstalledBundleInventory(installed);
      checks.push({
        id: 'install',
        status: 'pass',
        message: `Signed bundle layout and catalog loaded for ${installed.pointer.version}`,
      });
    } catch (error) {
      checks.push({
        id: 'install',
        status: 'fail',
        message:
          error instanceof Error
            ? error.message
            : 'Agent installation is invalid',
      });
    }
    if (installed) {
      const environment = await this.getEnvironment().catch(() => undefined);
      checks.push({
        id: 'environment',
        status: environment ? 'pass' : 'fail',
        message: environment
          ? environment.label
          : 'No valid active environment',
      });
      if (environment) {
        const profile = installed.catalog.profiles.find(
          (candidate) => candidate.environmentId === environment.id,
        );
        if (profile) {
          profileLockPath = join(
            this.paths.userDataDir,
            'environments',
            profile.namespace,
            'browser-profiles',
            '.cthutool-agent.lock',
          );
        }
        checks.push({
          id: 'web-origin',
          status: environment.webOrigin.startsWith('https://')
            ? 'pass'
            : 'fail',
          message: environment.webOrigin,
        });
        checks.push({
          id: 'backend',
          status: environment.backendHttpUrl.startsWith('https://')
            ? 'pass'
            : 'fail',
          message: environment.backendHttpUrl,
        });
      }
      const migration = await inspectLegacyDesktopMigration({
        agentRootDir: this.paths.userDataDir,
        legacyRootDir: this.legacyDesktopRoot,
        environments: installed.catalog.profiles,
        explicitEnvironmentId: await readEnvironmentSelection(this.paths),
      }).catch((error) => ({
        status: 'failed' as const,
        message:
          error instanceof Error
            ? error.message
            : 'Legacy Desktop migration inspection failed',
        retryCommand: 'chc agent doctor',
      }));
      checks.push({
        id: 'legacy-migration',
        status:
          migration.status === 'failed' ||
          migration.status === 'selection-required'
            ? 'fail'
            : migration.status === 'locked' || migration.status === 'ready'
              ? 'warn'
              : 'pass',
        message: `${migration.message}${migration.retryCommand ? ` Next: ${migration.retryCommand}` : ''}`,
      });
    }
    const status = await this.status();
    checks.push({
      id: 'autostart',
      status: status.autostart.supported ? 'pass' : 'warn',
      message: status.autostart.supported
        ? status.autostart.enabled
          ? 'Enabled'
          : 'Disabled'
        : 'Unsupported platform',
    });
    checks.push({
      id: 'local-control',
      status:
        status.tray.state === 'unreachable'
          ? 'fail'
          : status.tray.state === 'stopped'
            ? 'warn'
            : 'pass',
      message: status.tray.state,
    });
    checks.push({
      id: 'browser',
      status: status.browser.ready ? 'pass' : 'warn',
      message: status.browser.status,
    });
    checks.push({
      id: 'profile-locks',
      status: (await exists(profileLockPath)) ? 'warn' : 'pass',
      message: 'Profile lock ownership checked',
    });
    checks.push({
      id: 'logs',
      status: (await exists(join(this.paths.logsDir, 'agent.log')))
        ? 'pass'
        : 'warn',
      message: join(this.paths.logsDir, 'agent.log'),
    });
    return checks;
  }

  async uninstall(
    input: { readonly purge?: boolean; readonly confirmed?: boolean } = {},
  ) {
    if (input.purge && !input.confirmed)
      throw new Error('Purging Agent data requires explicit confirmation');
    await this.stop();
    const autostart = await this.platform.getAutostartStatus(this.paths);
    if (autostart.enabled) await this.platform.setAutostart(this.paths, false);
    const installed = await exists(this.paths.installRoot);
    await rm(this.paths.installRoot, { force: true, recursive: true });
    if (input.purge)
      await rm(this.paths.userDataDir, { force: true, recursive: true });
    return {
      removed: installed,
      purged: input.purge === true,
      ...(input.purge ? {} : { preservedDataDir: this.paths.userDataDir }),
    };
  }

  private async installedVersion(): Promise<string | undefined> {
    try {
      return (await readInstalledBundle(this.paths)).pointer.version;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'CthuTool Agent is not installed'
      )
        return undefined;
      throw error;
    }
  }

  private async isRunning(): Promise<boolean> {
    const record = await readTrayInstanceRecord(
      resolveTrayInstancePath(this.paths.userDataDir),
    ).catch(() => undefined);
    if (!record) return false;
    try {
      await requestTrayHealth({ record, timeoutMs: 500 });
      return true;
    } catch {
      return false;
    }
  }

  private async requireTray() {
    const record = await readTrayInstanceRecord(
      resolveTrayInstancePath(this.paths.userDataDir),
    );
    if (!record) throw new Error('Agent tray is not running');
    return record;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
