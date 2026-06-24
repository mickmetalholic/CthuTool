import type { PublicAgentStatus } from '@cthutool/agent-protocol';
import {
  AppRuntimeProvider,
  type BrowserProfileActionInput,
  BrowserProfileActions,
  type HostActions,
  LocalStatusPage,
  PageFrame,
  PageStatusList,
} from '@cthutool/app-shell';
import { Button } from '@cthutool/ui';
import {
  Activity,
  Bot,
  Chrome,
  FileText,
  Home,
  Info,
  Palette,
  RefreshCw,
  Save,
  Server,
} from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import appIcon from '../../../build/icon.png';
import type { AgentConnectionState } from '../../main/agent-client';
import type { DesktopConfig } from '../../main/config';
import {
  type BrowserStatus,
  fetchBrowserStatus as fetchBrowserStatusFromBackend,
  fetchConnectedAgents,
} from './agents-api';
import {
  type DesktopApi,
  type DesktopAppInfo,
  getDesktopApi,
} from './desktop-api';
import { createDesktopRuntimeAdapter } from './desktop-runtime';
import {
  buildDesktopTasks,
  countActionableTasks,
  type LocalPendingAuthTask,
} from './desktop-tasks';
import {
  ActivityBar,
  DesktopStatusBar,
  DesktopTitlebar,
  SettingsSubnav,
  type ShellNavItem,
  StartupIntro,
} from './shell-components';
import './styles.css';

type AppProps = {
  readonly desktopApi?: DesktopApi;
  readonly fetchAgents?: typeof fetchConnectedAgents;
  readonly fetchBrowserStatus?: typeof fetchBrowserStatusFromBackend;
};

type Workspace = 'main' | 'settings';
type MainView = 'home' | 'browser' | 'agents';
type SettingsView =
  | 'service'
  | 'local-runtime'
  | 'diagnostics'
  | 'logs'
  | 'appearance';
type BrowserProfileActionName = 'openLogin' | 'verifyProfile' | 'clearProfile';
type BrowserActionState = {
  readonly action?: BrowserProfileActionName;
  readonly message?: string;
  readonly status: 'idle' | 'running' | 'success' | 'error';
  readonly targetKey?: string;
};
type BrowserSite = BrowserStatus['sites'][number];
type BrowserProfile = BrowserStatus['profiles'][number];
type BrowserPendingAuth =
  | BrowserStatus['pendingAuthTasks'][number]
  | LocalPendingAuthTask;
type BrowserAttentionItem = {
  readonly key: string;
  readonly profileName: string;
  readonly reason: string;
  readonly siteId: string;
  readonly siteName: string;
  readonly source: string;
  readonly status?: string;
};
type BrowserProfileRow = {
  readonly actionState?: BrowserActionState;
  readonly key: string;
  readonly pendingTask?: BrowserPendingAuth;
  readonly profile?: BrowserProfile;
  readonly site: BrowserSite;
  readonly source: 'backend' | 'local';
  readonly statusLabel: string;
};
type BrowserHostDisplayModel = {
  readonly attentionItems: readonly BrowserAttentionItem[];
  readonly localOnlyRows: readonly BrowserProfileRow[];
  readonly profileRows: readonly BrowserProfileRow[];
  readonly runtimeKind: string;
  readonly runtimeMessage: string;
  readonly runtimeReady: boolean;
  readonly runtimeStatus: string;
};

const emptyState: AgentConnectionState = {
  status: 'disconnected',
  backendUrl: '',
  agentId: '',
  deviceName: '',
};

const mainNav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'browser', label: 'Browser Host', icon: Chrome },
  { id: 'agents', label: 'Agents', icon: Bot },
] as const;

const settingsNav = [
  { id: 'service', label: 'Service Connection', icon: Server },
  { id: 'local-runtime', label: 'Local Runtime', icon: Activity },
  { id: 'diagnostics', label: 'Diagnostics', icon: Info },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const;

export function App({
  desktopApi = getDesktopApi(),
  fetchAgents = fetchConnectedAgents,
  fetchBrowserStatus = fetchBrowserStatusFromBackend,
}: AppProps) {
  const [workspace, setWorkspace] = useState<Workspace>('main');
  const [mainView, setMainView] = useState<MainView>('home');
  const [settingsView, setSettingsView] = useState<SettingsView>('service');
  const [config, setConfig] = useState<DesktopConfig | undefined>();
  const [form, setForm] = useState({
    backendUrl: '',
    deviceName: '',
    connectionEnabled: true,
    activeEnvironmentId: '',
    appearanceMode: 'dark',
  });
  const [connection, setConnection] =
    useState<AgentConnectionState>(emptyState);
  const [agents, setAgents] = useState<PublicAgentStatus[]>([]);
  const [agentsError, setAgentsError] = useState<string | undefined>();
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({
    pendingAuthTasks: [],
    profiles: [],
    sites: [],
  });
  const [browserStatusError, setBrowserStatusError] = useState<
    string | undefined
  >();
  const [browserStatusLoading, setBrowserStatusLoading] = useState(false);
  const [localPendingAuthTasks, setLocalPendingAuthTasks] = useState<
    LocalPendingAuthTask[]
  >([]);
  const [browserActionState, setBrowserActionState] =
    useState<BrowserActionState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  const [appInfo, setAppInfo] = useState<DesktopAppInfo>({
    browserProfilesDir: '',
    browserRuntime: {
      message: 'Browser runtime has not been initialized',
      preferredKind: 'host-chrome',
      status: 'pending',
    },
    configPath: '',
    userDataDir: '',
    version: '0.0.0',
    platform: 'unknown',
    isPackaged: false,
  });
  const runtime = useMemo(
    () => createDesktopRuntimeAdapter(desktopApi),
    [desktopApi],
  );

  useEffect(() => {
    let mounted = true;
    void desktopApi.getConfig().then((nextConfig) => {
      if (!mounted) return;
      setConfig(nextConfig);
      setForm({
        backendUrl: nextConfig.backendUrl,
        deviceName: nextConfig.deviceName,
        connectionEnabled: nextConfig.connectionEnabled,
        activeEnvironmentId: nextConfig.activeEnvironmentId,
        appearanceMode: nextConfig.appearance.mode,
      });
    });
    void desktopApi.getAppInfo().then((info) => {
      if (mounted) setAppInfo(info);
    });
    void desktopApi.getConnectionState().then((state) => {
      if (mounted && state) setConnection(state);
    });
    const unsubscribe = desktopApi.onConnectionStateChange((state) => {
      setConnection(state);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [desktopApi]);

  useEffect(() => {
    document.documentElement.dataset.theme =
      config?.appearance.colorScheme ?? 'dracula';
    document.documentElement.dataset.mode =
      config?.appearance.mode ?? form.appearanceMode;
  }, [
    config?.appearance.colorScheme,
    config?.appearance.mode,
    form.appearanceMode,
  ]);

  const activeEnvironment = useMemo(
    () =>
      config?.environmentProfiles.find(
        (profile) => profile.id === form.activeEnvironmentId,
      ) ?? config?.activeEnvironment,
    [config, form.activeEnvironmentId],
  );
  const backendUrl = form.backendUrl || activeEnvironment?.backendUrl || '';

  const refreshAgents = useCallback(async () => {
    if (!backendUrl) return;
    try {
      setAgentsError(undefined);
      setAgents(await fetchAgents(backendUrl));
    } catch (error) {
      setAgentsError(
        error instanceof Error ? error.message : 'Agent list failed',
      );
    }
  }, [backendUrl, fetchAgents]);

  const refreshBrowserStatus = useCallback(async () => {
    if (!backendUrl) return;
    setBrowserStatusLoading(true);
    try {
      setBrowserStatusError(undefined);
      setBrowserStatus(await fetchBrowserStatus(backendUrl));
    } catch (error) {
      setBrowserStatusError(
        error instanceof Error ? error.message : 'Browser status failed',
      );
    } finally {
      setBrowserStatusLoading(false);
    }
  }, [backendUrl, fetchBrowserStatus]);

  const refreshLocalPendingAuthTasks = useCallback(async () => {
    setLocalPendingAuthTasks(await desktopApi.getLocalPendingAuthTasks());
  }, [desktopApi]);

  const runBrowserSiteAction = useCallback(
    async (action: BrowserProfileActionName, site: BrowserSite) => {
      const targetKey = browserSiteKey(site);
      setBrowserActionState({
        action,
        message: `${browserActionVerb(action)} ${site.displayName}`,
        status: 'running',
        targetKey,
      });
      const input = {
        loginUrl: site.loginUrl,
        profileName: site.profileName,
        siteId: site.siteId,
        verifyUrl: site.verifyUrl,
      };
      try {
        const runAction = resolveBrowserAction(runtime.actions, action);
        const result = await runAction(input);
        assertBrowserActionResult(result);
        setBrowserActionState({
          action,
          message:
            getBrowserResultWarning(result) ??
            `${browserActionDone(action)} ${site.displayName}`,
          status: 'success',
          targetKey,
        });
      } catch (error) {
        setBrowserActionState({
          action,
          message:
            error instanceof Error
              ? error.message
              : `${browserActionVerb(action)} failed`,
          status: 'error',
          targetKey,
        });
      }
      await refreshLocalPendingAuthTasks();
      await refreshBrowserStatus();
    },
    [refreshBrowserStatus, refreshLocalPendingAuthTasks, runtime.actions],
  );

  useEffect(() => {
    void refreshAgents();
    void refreshBrowserStatus();
    void refreshLocalPendingAuthTasks();
    const timer = setInterval(() => {
      void refreshAgents();
      void refreshBrowserStatus();
      void refreshLocalPendingAuthTasks();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshAgents, refreshBrowserStatus, refreshLocalPendingAuthTasks]);

  const saveConfig = async () => {
    setSaveState('saving');
    const next = await desktopApi.saveConfig({
      backendUrl: form.backendUrl,
      deviceName: form.deviceName,
      connectionEnabled: form.connectionEnabled,
      activeEnvironmentId: form.activeEnvironmentId,
      appearance: {
        mode:
          form.appearanceMode === 'system' ||
          form.appearanceMode === 'light' ||
          form.appearanceMode === 'dark'
            ? form.appearanceMode
            : 'dark',
        colorScheme: 'dracula',
      },
    });
    setConfig(next);
    setForm((current) => ({
      ...current,
      backendUrl: next.backendUrl,
      activeEnvironmentId: next.activeEnvironmentId,
      appearanceMode: next.appearance.mode,
    }));
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1200);
  };

  const selectEnvironment = (environmentId: string) => {
    const environment = config?.environmentProfiles.find(
      (profile) => profile.id === environmentId,
    );
    setForm((current) => ({
      ...current,
      activeEnvironmentId: environmentId,
      backendUrl: environment?.backendUrl ?? current.backendUrl,
    }));
  };

  const statusLabel = useMemo(() => {
    switch (connection.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'reconnecting':
        return 'Reconnecting';
      case 'disabled':
        return 'Disabled';
      default:
        return 'Disconnected';
    }
  }, [connection.status]);
  const desktopTasks = useMemo(
    () =>
      buildDesktopTasks({
        browserStatus,
        localPendingAuthTasks,
      }),
    [browserStatus, localPendingAuthTasks],
  );
  const openConnectionSettings = () => {
    setWorkspace('settings');
    setSettingsView('service');
  };
  const openClientStatusSettings = () => {
    setWorkspace('settings');
    setSettingsView('local-runtime');
  };

  return (
    <AppRuntimeProvider runtime={runtime}>
      <main className="desktop-shell">
        <StartupIntro appIcon={appIcon} />
        <DesktopTitlebar
          appIcon={appIcon}
          onWindowAction={(action) =>
            void runtime.actions.windowAction?.(action)
          }
        />

        <div
          className={
            workspace === 'settings' ? 'shell-body with-subnav' : 'shell-body'
          }
        >
          <ActivityBar
            items={mainNav.map(
              (item): ShellNavItem => ({
                ...item,
                badgeCount: 0,
              }),
            )}
            selectedId={workspace === 'main' ? mainView : ''}
            settingsActive={workspace === 'settings'}
            onSelectMain={(id) => {
              setWorkspace('main');
              setMainView(id as MainView);
            }}
            onSelectSettings={() => setWorkspace('settings')}
          />

          {workspace === 'settings' ? (
            <SettingsSubnav
              active={settingsView}
              items={settingsNav.map(({ id, label }) => ({ id, label }))}
              onSelect={(id) => setSettingsView(id as SettingsView)}
            />
          ) : null}

          <section className="workspace">
            {workspace === 'main'
              ? renderMainWorkspace({
                  view: mainView,
                  agents,
                  agentsError,
                  browserStatus,
                  browserStatusError,
                  browserStatusLoading,
                  browserActionState,
                  localPendingAuthTasks,
                  desktopTasks,
                  refreshAgents,
                  refreshBrowserStatus,
                  runBrowserSiteAction,
                  config,
                  connection,
                  appInfo,
                  statusLabel,
                  onOpenBrowserHost: () => setMainView('browser'),
                })
              : renderSettingsWorkspace({
                  view: settingsView,
                  config,
                  form,
                  setForm,
                  selectEnvironment,
                  saveConfig,
                  saveState,
                  connection,
                  appInfo,
                  activeEnvironmentLabel: activeEnvironment?.label ?? 'Local',
                })}
          </section>
        </div>

        <DesktopStatusBar
          backendUrl={backendUrl}
          connectionStatus={connection.status}
          environmentLabel={activeEnvironment?.label ?? 'Local'}
          platform={appInfo.platform}
          statusLabel={statusLabel}
          version={appInfo.version}
          onOpenClientStatus={openClientStatusSettings}
          onOpenConnectionStatus={openConnectionSettings}
        />
      </main>
    </AppRuntimeProvider>
  );
}

function renderMainWorkspace({
  view,
  agents,
  agentsError,
  browserStatus,
  browserStatusError,
  browserStatusLoading,
  browserActionState,
  localPendingAuthTasks,
  desktopTasks,
  refreshAgents,
  refreshBrowserStatus,
  runBrowserSiteAction,
  config,
  connection,
  appInfo,
  statusLabel,
  onOpenBrowserHost,
}: {
  readonly view: MainView;
  readonly agents: readonly PublicAgentStatus[];
  readonly agentsError: string | undefined;
  readonly browserStatus: BrowserStatus;
  readonly browserStatusError: string | undefined;
  readonly browserStatusLoading: boolean;
  readonly browserActionState: BrowserActionState;
  readonly localPendingAuthTasks: readonly LocalPendingAuthTask[];
  readonly desktopTasks: ReturnType<typeof buildDesktopTasks>;
  readonly refreshAgents: () => Promise<void>;
  readonly refreshBrowserStatus: () => Promise<void>;
  readonly runBrowserSiteAction: (
    action: BrowserProfileActionName,
    site: BrowserSite,
  ) => Promise<void>;
  readonly config: DesktopConfig | undefined;
  readonly connection: AgentConnectionState;
  readonly appInfo: DesktopAppInfo;
  readonly statusLabel: string;
  readonly onOpenBrowserHost: () => void;
}) {
  if (view === 'browser') {
    return (
      <WorkspacePanel title="Browser Host" eyebrow="Local Capability">
        <BrowserHostPanel
          appInfo={appInfo}
          browserStatus={browserStatus}
          browserStatusError={browserStatusError}
          browserStatusLoading={browserStatusLoading}
          browserActionState={browserActionState}
          localPendingAuthTasks={localPendingAuthTasks}
          runBrowserSiteAction={runBrowserSiteAction}
        />
      </WorkspacePanel>
    );
  }

  if (view === 'agents') {
    return (
      <AgentsPanel
        agents={agents}
        agentsError={agentsError}
        refreshAgents={refreshAgents}
        refreshBrowserStatus={refreshBrowserStatus}
      />
    );
  }

  return (
    <WorkspacePanel title="Home" eyebrow="Local Readiness">
      <HomeReadinessPanel
        agents={agents}
        appInfo={appInfo}
        attentionCount={countActionableTasks(desktopTasks)}
        browserStatus={browserStatus}
        config={config}
        connection={connection}
        statusLabel={statusLabel}
        onOpenBrowserHost={onOpenBrowserHost}
      />
    </WorkspacePanel>
  );
}

function HomeReadinessPanel({
  agents,
  appInfo,
  attentionCount,
  browserStatus,
  config,
  connection,
  statusLabel,
  onOpenBrowserHost,
}: {
  readonly agents: readonly PublicAgentStatus[];
  readonly appInfo: DesktopAppInfo;
  readonly attentionCount: number;
  readonly browserStatus: BrowserStatus;
  readonly config: DesktopConfig | undefined;
  readonly connection: AgentConnectionState;
  readonly statusLabel: string;
  readonly onOpenBrowserHost: () => void;
}) {
  const browserRuntime = appInfo.browserRuntime;
  const browserReady = browserRuntime?.status === 'ready';
  const localAgentOnline = connection.status === 'connected';
  return (
    <div className="home-readiness">
      <section className="readiness-hero" aria-label="Local readiness summary">
        <div>
          <span>Current Host</span>
          <h2>
            {config?.deviceName ?? connection.deviceName ?? 'CthuDesktop'}
          </h2>
          <p>
            {config?.activeEnvironment.label ??
              connection.environmentLabel ??
              'Local'}{' '}
            environment is {statusLabel.toLowerCase()}.
          </p>
        </div>
        <strong className={localAgentOnline ? 'ready' : 'attention'}>
          {localAgentOnline ? 'Ready' : statusLabel}
        </strong>
      </section>

      <section className="readiness-grid" aria-label="Readiness details">
        <div className="metric compact">
          <span>Backend</span>
          <strong>{statusLabel}</strong>
        </div>
        <div className="metric compact">
          <span>Local Agent</span>
          <strong>
            {config?.connectionEnabled === false ? 'Disabled' : 'Enabled'}
          </strong>
        </div>
        <div className="metric compact">
          <span>Browser Runtime</span>
          <strong>{browserRuntime?.status ?? 'pending'}</strong>
        </div>
        <div className="metric compact">
          <span>Online Agents</span>
          <strong>{agents.length}</strong>
        </div>
        <div className="metric compact">
          <span>Managed Profiles</span>
          <strong>{browserStatus.profiles.length}</strong>
        </div>
        <div className="metric compact">
          <span>Browser Attention</span>
          <strong>{attentionCount}</strong>
        </div>
      </section>

      <section
        className={
          attentionCount > 0
            ? 'browser-attention-panel attention'
            : 'browser-attention-panel'
        }
        aria-label="Browser attention"
      >
        <div>
          <h2>
            {attentionCount > 0
              ? 'Browser auth needs attention'
              : 'Browser host is clear'}
          </h2>
          <p>
            {attentionCount > 0
              ? `${attentionCount} browser auth item${
                  attentionCount === 1 ? '' : 's'
                } need login or verification.`
              : browserReady
                ? 'Host browser runtime is ready and no auth attention is pending.'
                : (browserRuntime?.message ??
                  'Browser runtime has not reported readiness yet.')}
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={onOpenBrowserHost}
        >
          Open Browser Host
        </button>
      </section>
    </div>
  );
}

function countPendingBrowserAuthItems({
  browserStatus,
  localPendingAuthTasks,
}: {
  readonly browserStatus: BrowserStatus;
  readonly localPendingAuthTasks: readonly LocalPendingAuthTask[];
}): number {
  const keys = new Set<string>();
  for (const task of [
    ...browserStatus.pendingAuthTasks,
    ...localPendingAuthTasks,
  ]) {
    if ('status' in task && !['open', 'in_progress'].includes(task.status)) {
      continue;
    }
    keys.add(`${task.siteId}:${task.profileName}`);
  }
  return keys.size;
}

function browserRuntimeLabel(appInfo: DesktopAppInfo): string {
  const runtime = appInfo.browserRuntime;
  if (!runtime) return 'Unknown';
  return runtime.activeKind ?? runtime.preferredKind;
}

function browserRuntimeMessage(appInfo: DesktopAppInfo): string {
  return appInfo.browserRuntime?.message ?? 'Browser runtime is not available';
}

function BrowserHostPanel({
  appInfo,
  browserStatus,
  browserStatusError,
  browserStatusLoading,
  browserActionState,
  localPendingAuthTasks,
  runBrowserSiteAction,
}: {
  readonly appInfo: DesktopAppInfo;
  readonly browserStatus: BrowserStatus;
  readonly browserStatusError: string | undefined;
  readonly browserStatusLoading: boolean;
  readonly browserActionState: BrowserActionState;
  readonly localPendingAuthTasks: readonly LocalPendingAuthTask[];
  readonly runBrowserSiteAction: (
    action: BrowserProfileActionName,
    site: BrowserSite,
  ) => Promise<void>;
}) {
  const model = buildBrowserHostDisplayModel({
    appInfo,
    browserActionState,
    browserStatus,
    localPendingAuthTasks,
  });
  return (
    <div className="browser-host">
      <section className="browser-runtime-panel" aria-label="Browser runtime">
        <div>
          <span>Browser runtime</span>
          <h2>Host browser runtime</h2>
          <p>{model.runtimeMessage}</p>
        </div>
        <strong className={model.runtimeReady ? 'ready' : 'attention'}>
          {model.runtimeStatus}
        </strong>
      </section>

      <section
        className="browser-host-summary"
        aria-label="Browser host summary"
      >
        <div className="metric compact">
          <span>Runtime</span>
          <strong>{model.runtimeKind}</strong>
        </div>
        <div className="metric compact">
          <span>Managed Sites</span>
          <strong>{browserStatus.sites.length}</strong>
        </div>
        <div className="metric compact">
          <span>Managed Profiles</span>
          <strong>{browserStatus.profiles.length}</strong>
        </div>
        <div className="metric compact">
          <span>Pending Auth</span>
          <strong>{model.attentionItems.length}</strong>
        </div>
      </section>

      {browserStatusError ? (
        <p className="error-text browser-host-notice">{browserStatusError}</p>
      ) : null}
      {browserStatusLoading ? (
        <p className="browser-action-message running browser-host-notice">
          Loading browser status
        </p>
      ) : null}

      <BrowserAttentionPanel items={model.attentionItems} />
      <BrowserManagedProfilesPanel
        rows={[...model.profileRows, ...model.localOnlyRows]}
        runBrowserSiteAction={runBrowserSiteAction}
      />
    </div>
  );
}

function renderSettingsWorkspace({
  view,
  config,
  form,
  setForm,
  selectEnvironment,
  saveConfig,
  saveState,
  connection,
  appInfo,
  activeEnvironmentLabel,
}: {
  readonly view: SettingsView;
  readonly config: DesktopConfig | undefined;
  readonly form: {
    readonly backendUrl: string;
    readonly deviceName: string;
    readonly connectionEnabled: boolean;
    readonly activeEnvironmentId: string;
    readonly appearanceMode: string;
  };
  readonly setForm: Dispatch<
    SetStateAction<{
      backendUrl: string;
      deviceName: string;
      connectionEnabled: boolean;
      activeEnvironmentId: string;
      appearanceMode: string;
    }>
  >;
  readonly selectEnvironment: (environmentId: string) => void;
  readonly saveConfig: () => Promise<void>;
  readonly saveState: 'idle' | 'saving' | 'saved';
  readonly connection: AgentConnectionState;
  readonly appInfo: DesktopAppInfo;
  readonly activeEnvironmentLabel: string;
}) {
  const configuredBackendUrl = config?.backendUrl ?? connection.backendUrl;
  const browserRuntimeKind =
    appInfo.browserRuntime?.activeKind ??
    appInfo.browserRuntime?.preferredKind ??
    'Unknown';
  const browserRuntimeStatus = appInfo.browserRuntime?.status ?? 'unknown';
  const browserRuntimeDetail =
    appInfo.browserRuntime?.message ?? 'Not available';

  if (view === 'local-runtime') {
    return (
      <WorkspacePanel title="Local Runtime" eyebrow="Settings">
        <LocalStatusPage
          rows={[
            ['Agent ID', config?.agentId ?? connection.agentId],
            ['Device', config?.deviceName ?? connection.deviceName],
            ['Browser Runtime', browserRuntimeKind],
            ['Runtime Status', browserRuntimeStatus],
            ['Version', appInfo.version],
            ['Platform', appInfo.platform],
            ['Packaged', appInfo.isPackaged ? 'yes' : 'no'],
          ]}
          localRows={[
            ['User Data', localPathValue(appInfo.userDataDir)],
            ['Browser Profiles', localPathValue(appInfo.browserProfilesDir)],
            ['Config File', localPathValue(appInfo.configPath)],
          ]}
        />
      </WorkspacePanel>
    );
  }

  if (view === 'diagnostics') {
    return (
      <WorkspacePanel title="Diagnostics" eyebrow="Settings">
        <LocalStatusPage
          rows={[
            ['Environment', activeEnvironmentLabel],
            ['Backend URL', configuredBackendUrl],
            ['Connection', connection.status],
            ['Agent ID', config?.agentId ?? connection.agentId],
            [
              'Last Registered',
              connection.lastRegisteredAt ?? 'Not registered',
            ],
            ['Last Error', connection.lastError ?? 'None'],
            ['Browser Runtime', browserRuntimeKind],
            ['Runtime Status', browserRuntimeStatus],
            ['Runtime Detail', browserRuntimeDetail],
          ]}
          localRows={[
            ['User Data', localPathValue(appInfo.userDataDir)],
            ['Browser Profiles', localPathValue(appInfo.browserProfilesDir)],
            ['Config File', localPathValue(appInfo.configPath)],
          ]}
        />
      </WorkspacePanel>
    );
  }

  if (view === 'logs') {
    return (
      <WorkspacePanel title="Logs" eyebrow="Settings">
        <div className="log-view">
          <h2>Log viewing is not connected yet</h2>
          <p>
            This settings section is reserved for future local or server-backed
            log inspection. No log stream is currently wired in CthuDesktop.
          </p>
        </div>
      </WorkspacePanel>
    );
  }

  if (view === 'appearance') {
    return (
      <WorkspacePanel title="Appearance" eyebrow="Settings">
        <div className="log-view">
          <h2>Fixed theme system</h2>
          <p>
            CthuDesktop is currently using the Dracula token system. Theme
            switching controls are not available in this settings phase.
          </p>
        </div>
        <PageStatusList
          rows={[
            ['Mode', config?.appearance.mode ?? form.appearanceMode],
            ['Color Scheme', config?.appearance.colorScheme ?? 'dracula'],
            ['Theme Controls', 'Not connected in this release'],
          ]}
        />
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel title="Service Connection" eyebrow="Settings">
      <div className="settings-form">
        <label>
          <span>Environment</span>
          <select
            value={form.activeEnvironmentId}
            onChange={(event) => selectEnvironment(event.target.value)}
          >
            {config?.environmentProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Backend URL</span>
          <input
            value={form.backendUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                backendUrl: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span>Display Name</span>
          <input
            value={form.deviceName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deviceName: event.target.value,
              }))
            }
          />
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.connectionEnabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                connectionEnabled: event.target.checked,
              }))
            }
          />
          <span>Local Agent Enabled</span>
        </label>
        <SaveButton onClick={saveConfig} saveState={saveState} />
      </div>
    </WorkspacePanel>
  );
}

function WorkspacePanel({
  eyebrow,
  title,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <PageFrame
      atmosphere={
        <>
          <span className="workspace-atmosphere-grid" />
          <span className="workspace-atmosphere-glow cyan" />
          <span className="workspace-atmosphere-glow violet" />
        </>
      }
      className="workspace-panel"
      eyebrow={eyebrow}
      title={title}
    >
      {children}
    </PageFrame>
  );
}

function AgentsPanel({
  agents,
  agentsError,
  refreshAgents,
  refreshBrowserStatus,
}: {
  readonly agents: readonly PublicAgentStatus[];
  readonly agentsError: string | undefined;
  readonly refreshAgents: () => Promise<void>;
  readonly refreshBrowserStatus: () => Promise<void>;
}) {
  return (
    <WorkspacePanel title="Agents" eyebrow="Main">
      <div className="panel-toolbar">
        <p>{agents.length} online</p>
        <button
          type="button"
          className="icon-button"
          aria-label="Refresh agents"
          onClick={() => {
            void refreshAgents();
            void refreshBrowserStatus();
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {agentsError ? <p className="error-text">{agentsError}</p> : null}
      <table className="agent-table">
        <thead>
          <tr className="agent-row header">
            <th scope="col">Device</th>
            <th scope="col">Platform</th>
            <th scope="col">Capabilities</th>
            <th scope="col">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr className="agent-row" key={agent.agentId}>
              <td>
                <strong>{agent.deviceName}</strong>
                <small>{agent.agentId}</small>
              </td>
              <td>{agent.platform}</td>
              <td>
                {agent.capabilities.length > 0
                  ? agent.capabilities.join(', ')
                  : 'None'}
              </td>
              <td>{agent.lastSeenAt}</td>
            </tr>
          ))}
          {agents.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan={4}>
                No connected agents
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </WorkspacePanel>
  );
}

function BrowserAttentionPanel({
  items,
}: {
  readonly items: readonly BrowserAttentionItem[];
}) {
  const hasAttention = items.length > 0;
  return (
    <section
      className={
        hasAttention
          ? 'browser-attention-section attention'
          : 'browser-attention-section'
      }
      aria-label="Browser auth attention"
    >
      <div className="browser-section-header">
        <div>
          <span>Browser auth attention</span>
          <h2>
            {hasAttention
              ? 'Authentication needs action'
              : 'No browser-auth attention'}
          </h2>
        </div>
        <strong>{items.length}</strong>
      </div>
      {hasAttention ? (
        <div className="browser-attention-list">
          {items.map((item) => (
            <div className="browser-attention-item" key={item.key}>
              <div>
                <strong>{item.siteName}</strong>
                <small>{item.profileName}</small>
              </div>
              <div className="site-profile-summary">
                <span>Pending {item.reason}</span>
                <span>{item.source}</span>
                {item.status ? <span>{item.status}</span> : null}
              </div>
              <small>Next actions: Open, Verify, Clear</small>
            </div>
          ))}
        </div>
      ) : (
        <p>All browser-auth profiles are clear for this host.</p>
      )}
    </section>
  );
}

function BrowserManagedProfilesPanel({
  rows,
  runBrowserSiteAction,
}: {
  readonly rows: readonly BrowserProfileRow[];
  readonly runBrowserSiteAction: (
    action: BrowserProfileActionName,
    site: BrowserSite,
  ) => Promise<void>;
}) {
  return (
    <section className="browser-profile-panel" aria-label="Managed profiles">
      <div className="browser-section-header">
        <div>
          <span>Managed profiles</span>
          <h2>Site profiles</h2>
        </div>
        <strong>{rows.length}</strong>
      </div>
      {rows.length > 0 ? (
        <div className="browser-profile-list">
          {rows.map((row) => (
            <BrowserManagedProfileRow
              key={row.key}
              row={row}
              runBrowserSiteAction={runBrowserSiteAction}
            />
          ))}
        </div>
      ) : (
        <p>No managed browser profiles are available yet.</p>
      )}
    </section>
  );
}

function BrowserManagedProfileRow({
  row,
  runBrowserSiteAction,
}: {
  readonly row: BrowserProfileRow;
  readonly runBrowserSiteAction: (
    action: BrowserProfileActionName,
    site: BrowserSite,
  ) => Promise<void>;
}) {
  const actionDisabled =
    row.site.authPolicy !== 'required' || row.actionState?.status === 'running';
  return (
    <div className="browser-profile-row">
      <div className="browser-profile-main">
        <strong>{row.site.displayName}</strong>
        <small>{row.site.profileName ?? 'anonymous'}</small>
        <div className="site-profile-summary">
          {row.profile?.displayName ? (
            <span>{row.profile.displayName}</span>
          ) : null}
          {row.profile?.externalUserId ? (
            <span>ID {row.profile.externalUserId}</span>
          ) : null}
          {row.profile?.verifiedAt ? (
            <span>{formatTimestamp(row.profile.verifiedAt)}</span>
          ) : null}
          {row.pendingTask ? (
            <span>Pending {row.pendingTask.reason}</span>
          ) : null}
          {row.source === 'local' ? <span>Local fallback</span> : null}
        </div>
        {row.actionState?.message && row.actionState.status !== 'idle' ? (
          <p className={`browser-row-feedback ${row.actionState.status}`}>
            {row.actionState.message}
          </p>
        ) : (
          <p className="browser-row-feedback idle">
            {row.site.authPolicy === 'required'
              ? 'Actions available: Open, Verify, Clear'
              : 'Anonymous access'}
          </p>
        )}
      </div>
      <span className="browser-profile-state">{row.statusLabel}</span>
      <BrowserProfileActions
        disabled={actionDisabled}
        onClear={() => void runBrowserSiteAction('clearProfile', row.site)}
        onOpen={() => void runBrowserSiteAction('openLogin', row.site)}
        onVerify={() => void runBrowserSiteAction('verifyProfile', row.site)}
      />
    </div>
  );
}

function buildBrowserHostDisplayModel({
  appInfo,
  browserActionState,
  browserStatus,
  localPendingAuthTasks,
}: {
  readonly appInfo: DesktopAppInfo;
  readonly browserActionState: BrowserActionState;
  readonly browserStatus: BrowserStatus;
  readonly localPendingAuthTasks: readonly LocalPendingAuthTask[];
}): BrowserHostDisplayModel {
  const profileRows = browserStatus.sites.map((site): BrowserProfileRow => {
    const profile = findSiteProfile(browserStatus, site);
    const pendingTask = findSitePendingAuthTask(
      browserStatus,
      localPendingAuthTasks,
      site,
    );
    const key = browserSiteKey(site);
    return {
      actionState:
        browserActionState.targetKey === key ? browserActionState : undefined,
      key,
      pendingTask,
      profile,
      site,
      source: 'backend',
      statusLabel:
        profile?.status ?? (pendingTask ? 'attention' : site.authPolicy),
    };
  });
  const localOnlyRows = getLocalOnlyAuthTasks(
    browserStatus,
    localPendingAuthTasks,
  ).map((task): BrowserProfileRow => {
    const site = siteFromLocalPendingAuthTask(task);
    const key = browserSiteKey(site);
    return {
      actionState:
        browserActionState.targetKey === key ? browserActionState : undefined,
      key,
      pendingTask: task,
      site,
      source: 'local',
      statusLabel: task.status,
    };
  });

  return {
    attentionItems: buildBrowserAttentionItems({
      browserStatus,
      localPendingAuthTasks,
    }),
    localOnlyRows,
    profileRows,
    runtimeKind: browserRuntimeLabel(appInfo),
    runtimeMessage: browserRuntimeMessage(appInfo),
    runtimeReady: appInfo.browserRuntime?.status === 'ready',
    runtimeStatus: appInfo.browserRuntime?.status ?? 'pending',
  };
}

function findSiteProfile(
  browserStatus: BrowserStatus,
  site: BrowserSite,
): BrowserProfile | undefined {
  return browserStatus.profiles.find(
    (profile) =>
      profile.siteId === site.siteId &&
      (!site.profileName || profile.profileName === site.profileName),
  );
}

function findSitePendingAuthTask(
  browserStatus: BrowserStatus,
  localPendingAuthTasks: readonly LocalPendingAuthTask[],
  site: BrowserSite,
): BrowserPendingAuth | undefined {
  return [...browserStatus.pendingAuthTasks, ...localPendingAuthTasks].find(
    (task) =>
      task.siteId === site.siteId &&
      (!site.profileName || task.profileName === site.profileName) &&
      (!('status' in task) ||
        task.status === 'open' ||
        task.status === 'in_progress'),
  );
}

function buildBrowserAttentionItems({
  browserStatus,
  localPendingAuthTasks,
}: {
  readonly browserStatus: BrowserStatus;
  readonly localPendingAuthTasks: readonly LocalPendingAuthTask[];
}): BrowserAttentionItem[] {
  const siteNames = new Map(
    browserStatus.sites.map((site) => [site.siteId, site.displayName]),
  );
  const items = new Map<string, BrowserAttentionItem>();
  for (const task of browserStatus.pendingAuthTasks) {
    const key = browserTaskKey(task);
    items.set(key, {
      key,
      profileName: task.profileName,
      reason: task.reason,
      siteId: task.siteId,
      siteName: siteNames.get(task.siteId) ?? task.siteId,
      source: 'backend',
    });
  }
  for (const task of localPendingAuthTasks.filter(
    isActiveLocalPendingAuthTask,
  )) {
    const key = browserTaskKey(task);
    const existing = items.get(key);
    items.set(key, {
      key,
      profileName: task.profileName,
      reason: existing?.reason ?? task.reason,
      siteId: task.siteId,
      siteName: existing?.siteName ?? siteNames.get(task.siteId) ?? task.siteId,
      source: existing ? `${existing.source} + ${task.source}` : task.source,
      status: task.status,
    });
  }
  return [...items.values()];
}

function getLocalOnlyAuthTasks(
  browserStatus: BrowserStatus,
  localPendingAuthTasks: readonly LocalPendingAuthTask[],
): LocalPendingAuthTask[] {
  return localPendingAuthTasks.filter(
    (task) =>
      isActiveLocalPendingAuthTask(task) &&
      !browserStatus.sites.some(
        (site) =>
          site.siteId === task.siteId &&
          (!site.profileName || site.profileName === task.profileName),
      ),
  );
}

function isActiveLocalPendingAuthTask(task: LocalPendingAuthTask): boolean {
  return task.status === 'open' || task.status === 'in_progress';
}

function siteFromLocalPendingAuthTask(task: LocalPendingAuthTask): BrowserSite {
  return {
    allowedOrigins: [],
    authPolicy: 'required',
    displayName: task.siteId,
    loginUrl: task.loginUrl,
    profileName: task.profileName,
    siteId: task.siteId,
    verifyUrl: task.verifyUrl,
  };
}

function browserSiteKey(site: BrowserSite): string {
  return `${site.siteId}:${site.profileName ?? 'anonymous'}`;
}

function browserTaskKey(task: BrowserPendingAuth): string {
  return `${task.siteId}:${task.profileName}`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function resolveBrowserAction(
  actions: HostActions,
  action: BrowserProfileActionName,
): (input: BrowserProfileActionInput) => Promise<unknown> {
  const actionMethod =
    action === 'openLogin'
      ? actions.openBrowserLogin
      : action === 'verifyProfile'
        ? actions.verifyBrowserProfile
        : actions.clearBrowserProfile;

  if (typeof actionMethod !== 'function') {
    throw new Error(
      'Browser actions are not available in this CthuDesktop window. Restart the desktop app so the updated preload API is loaded.',
    );
  }

  return actionMethod;
}

function getBrowserResultWarning(result: unknown): string | undefined {
  if (
    !result ||
    typeof result !== 'object' ||
    !('type' in result) ||
    result.type !== 'browser.result' ||
    !('payload' in result) ||
    !result.payload ||
    typeof result.payload !== 'object'
  ) {
    return undefined;
  }
  const payload = result.payload as {
    readonly detection?: { readonly kind?: string; readonly reason?: string };
  };
  if (payload.detection?.kind !== 'blocked') {
    return undefined;
  }
  return payload.detection.reason
    ? `Login window opened, but navigation failed: ${payload.detection.reason}`
    : 'Login window opened, but navigation failed.';
}

function assertBrowserActionResult(result: unknown): void {
  if (
    result &&
    typeof result === 'object' &&
    'type' in result &&
    result.type === 'browser.error'
  ) {
    const payload =
      'payload' in result &&
      result.payload &&
      typeof result.payload === 'object'
        ? result.payload
        : undefined;
    const message =
      payload && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Browser action failed';
    throw new Error(message);
  }
}

function browserActionVerb(action: BrowserProfileActionName): string {
  if (action === 'openLogin') return 'Opening';
  if (action === 'verifyProfile') return 'Verifying';
  return 'Clearing';
}

function browserActionDone(action: BrowserProfileActionName): string {
  if (action === 'openLogin') return 'Login window opened for';
  if (action === 'verifyProfile') return 'Verified';
  return 'Cleared';
}

function localPathValue(value: string): string {
  return value || 'Restart CthuDesktop to load path info';
}

function SaveButton({
  onClick,
  saveState,
}: {
  readonly onClick: () => Promise<void>;
  readonly saveState: 'idle' | 'saving' | 'saved';
}) {
  return (
    <Button
      type="button"
      className="primary-button"
      variant="default"
      onClick={() => void onClick()}
    >
      <Save size={16} />
      <span>
        {saveState === 'saving'
          ? 'Saving'
          : saveState === 'saved'
            ? 'Saved'
            : 'Save'}
      </span>
    </Button>
  );
}
