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
  readInstalledBundle,
  resolveAgentPaths,
} from './agent-paths';
import {
  getAutostartStatus,
  setAutostart,
  startInstalledAgent,
  startInstalledTray,
} from './agent-platform';
import {
  type AgentReleaseInstallerDependencies,
  installAgentRelease,
} from './agent-release-installer';
import {
  readSelfUseSetupSnapshot,
  SELF_USE_ENVIRONMENT_ID,
  SELF_USE_NAMESPACE,
  SETTINGS_REMEDIATION,
} from './agent-self-use';
import {
  readTrayInstanceRecord,
  requestTrayHealth,
  requestTraySettingsOpen,
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
    readonly startInstalledTray?: typeof startInstalledTray;
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
      startInstalledTray:
        options.platform?.startInstalledTray ?? startInstalledTray,
    };
  }

  async install() {
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
    });
  }

  async update() {
    const wasRunning = await this.isRunning();
    const current = await this.installedVersion();
    const autostart = await this.platform.getAutostartStatus(this.paths);
    if (wasRunning) await this.stop();
    const result = await this.install();
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
    const setupSnapshot = readSelfUseSetupSnapshot(this.paths);
    const environment = toEnvironmentView(setupSnapshot);
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
        const health = await requestTrayHealth({
          record: tray,
          timeoutMs: 500,
        });
        trayState = health.state;
        if (health.setupRequired === true) {
          trayState = 'SetupRequired';
        }
      } catch {
        trayState = 'unreachable';
      }
    }
    if (setupSnapshot.setupRequired && trayState === 'stopped') {
      trayState = 'SetupRequired';
    }
    const agent = await readAgentInstance(this.paths.userDataDir).catch(
      () => undefined,
    );
    if (agent && !setupSnapshot.setupRequired) {
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
    const setup: AgentLifecycleStatus['setup'] = {
      required: setupSnapshot.setupRequired,
      configured: setupSnapshot.configured,
      ...(setupSnapshot.deploymentOrigin
        ? { deploymentOrigin: setupSnapshot.deploymentOrigin }
        : {}),
      ...(setupSnapshot.setupRequired
        ? { remediation: SETTINGS_REMEDIATION }
        : {}),
      ...(setupSnapshot.migrationNotice
        ? { migrationNotice: setupSnapshot.migrationNotice }
        : {}),
    };
    return {
      installed: Boolean(version),
      ...(version ? { version } : {}),
      tray: { state: trayState, ...(trayPid ? { pid: trayPid } : {}) },
      setup,
      ...(environment ? { environment } : {}),
      ...(setupSnapshot.endpoints
        ? {
            endpoints: {
              webOrigin: setupSnapshot.endpoints.webOrigin,
              webAgentUrl: setupSnapshot.endpoints.webAgentUrl,
              backendHttpUrl: setupSnapshot.endpoints.backendHttpUrl,
              backendAgentWsUrl: setupSnapshot.endpoints.backendAgentWsUrl,
            },
          }
        : {}),
      backend,
      browser,
      autostart,
    };
  }

  async settings(): Promise<'opened'> {
    await this.platform.startInstalledTray(this.paths);
    const record = await this.requireTray();
    await requestTraySettingsOpen({ record });
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

  async autostart(action: 'enable' | 'disable' | 'status') {
    if (action === 'status')
      return this.platform.getAutostartStatus(this.paths);
    return this.platform.setAutostart(this.paths, action === 'enable');
  }

  async doctor(): Promise<readonly AgentDoctorCheck[]> {
    const checks: AgentDoctorCheck[] = [];
    let installed: Awaited<ReturnType<typeof readInstalledBundle>> | undefined;
    const profileLockPath = join(
      this.paths.userDataDir,
      'environments',
      SELF_USE_NAMESPACE,
      'browser-profiles',
      '.cthutool-agent.lock',
    );
    try {
      installed = await readInstalledBundle(this.paths);
      await assertInstalledBundleInventory(installed);
      checks.push({
        id: 'install',
        status: 'pass',
        message: `Verified self-use bundle layout loaded for ${installed.pointer.version}`,
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
      const setupPath = join(
        installed.root,
        ...installed.layout.entryPoints.setup.split('/'),
      );
      const setupPresent = await pathExists(setupPath);
      checks.push({
        id: 'native-setup',
        status: setupPresent ? 'pass' : 'warn',
        message: setupPresent
          ? `Native setup executable present at ${installed.layout.entryPoints.setup}`
          : `Native setup executable not found at ${installed.layout.entryPoints.setup}; package a cthutool-agent-setup binary in the release archive`,
      });
    }
    const setup = readSelfUseSetupSnapshot(this.paths);
    checks.push({
      id: 'configuration',
      status: setup.configured ? 'pass' : 'fail',
      message: setup.configured
        ? 'Self-use deployment Origin configured'
        : `SetupRequired; ${SETTINGS_REMEDIATION}`,
    });
    if (setup.migrationNotice) {
      checks.push({
        id: 'migration',
        status: setup.configured ? 'warn' : 'fail',
        message: `${setup.migrationNotice} Next: ${SETTINGS_REMEDIATION}`,
      });
    }
    if (setup.endpoints) {
      checks.push({
        id: 'web-origin',
        status: setup.endpoints.webOrigin.startsWith('https://')
          ? 'pass'
          : setup.endpoints.webOrigin.startsWith('http://localhost')
            ? 'warn'
            : 'fail',
        message: setup.endpoints.webOrigin,
      });
      checks.push({
        id: 'backend',
        status: setup.endpoints.backendHttpUrl.startsWith('https://')
          ? 'pass'
          : setup.endpoints.backendHttpUrl.startsWith('http://localhost')
            ? 'warn'
            : 'fail',
        message: setup.endpoints.backendHttpUrl,
      });
    }
    if (installed) {
      const migration = await inspectLegacyDesktopMigration({
        agentRootDir: this.paths.userDataDir,
        legacyRootDir: this.legacyDesktopRoot,
        environments: [
          {
            environmentId: SELF_USE_ENVIRONMENT_ID,
            backendHttpUrl:
              setup.endpoints?.backendHttpUrl ?? 'https://example.invalid',
            namespace: SELF_USE_NAMESPACE,
          },
        ],
        explicitEnvironmentId: SELF_USE_ENVIRONMENT_ID,
      }).catch((error) => ({
        status: 'failed' as const,
        message:
          error instanceof Error
            ? error.message
            : 'Legacy Desktop migration inspection failed',
        retryCommand: SETTINGS_REMEDIATION,
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
        message: `${migration.message}${
          migration.retryCommand
            ? ` Next: ${String(migration.retryCommand).replace(
                /chc agent env list && chc agent env set <id>/g,
                SETTINGS_REMEDIATION,
              )}`
            : ''
        }`,
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
      status: (await pathExists(profileLockPath)) ? 'warn' : 'pass',
      message: 'Profile lock ownership checked',
    });
    checks.push({
      id: 'logs',
      status: (await pathExists(join(this.paths.logsDir, 'agent.log')))
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
    const installed = await pathExists(this.paths.installRoot);
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

function toEnvironmentView(
  setup: ReturnType<typeof readSelfUseSetupSnapshot>,
): AgentEnvironmentView | undefined {
  if (!setup.endpoints) return undefined;
  return {
    id: setup.endpoints.environmentId,
    label: setup.endpoints.label,
    active: true,
    webOrigin: setup.endpoints.webOrigin,
    backendHttpUrl: setup.endpoints.backendHttpUrl,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
