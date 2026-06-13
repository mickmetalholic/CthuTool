import type { PublicAgentStatus } from '@cthutool/agent-protocol';
import {
  Bot,
  Chrome,
  Circle,
  FileText,
  Home,
  Info,
  Maximize2,
  Minus,
  Palette,
  RefreshCw,
  Save,
  Server,
  Settings,
  TerminalSquare,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentConnectionState } from '../../main/agent-client';
import type { DesktopConfig } from '../../main/config';
import { fetchConnectedAgents } from './agents-api';
import appIcon from './assets/cthudesktop-icon.svg?url';
import { type DesktopApi, getDesktopApi } from './desktop-api';
import './styles.css';

type AppProps = {
  readonly desktopApi?: DesktopApi;
  readonly fetchAgents?: typeof fetchConnectedAgents;
};

type Workspace = 'main' | 'settings';
type MainView = 'home' | 'chrome' | 'agents';
type SettingsView =
  | 'service'
  | 'status'
  | 'diagnostics'
  | 'logs'
  | 'appearance';

const emptyState: AgentConnectionState = {
  status: 'disconnected',
  backendUrl: '',
  agentId: '',
  deviceName: '',
};

const mainNav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chrome', label: 'Chrome', icon: Chrome },
  { id: 'agents', label: 'Agents', icon: Bot },
] as const;

const settingsNav = [
  { id: 'service', label: 'Service', icon: Server },
  { id: 'status', label: 'Status', icon: Info },
  { id: 'diagnostics', label: 'Diagnostics', icon: TerminalSquare },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const;

export function App({
  desktopApi = getDesktopApi(),
  fetchAgents = fetchConnectedAgents,
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  const [appInfo, setAppInfo] = useState({
    version: '0.0.0',
    platform: 'unknown',
    isPackaged: false,
  });

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

  useEffect(() => {
    void refreshAgents();
    const timer = setInterval(() => {
      void refreshAgents();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshAgents]);

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

  const openEnvironmentSettings = () => {
    setWorkspace('settings');
    setSettingsView('service');
  };

  const openClientStatusSettings = () => {
    setWorkspace('settings');
    setSettingsView('status');
  };

  return (
    <main className="desktop-shell">
      <header className="titlebar">
        <div className="titlebar-drag-region">
          <img alt="" className="app-icon" src={appIcon} />
          <div className="app-title">
            <strong>CthuDesktop</strong>
            <span>
              {activeEnvironment?.label ??
                connection.environmentLabel ??
                'Local'}
            </span>
          </div>
        </div>
        <div className={`connection-chip ${connection.status}`}>
          {connection.status === 'connected' ? (
            <Wifi size={14} />
          ) : (
            <WifiOff size={14} />
          )}
          <span>{statusLabel}</span>
        </div>
        <div className="window-controls">
          <button
            aria-label="Minimize"
            className="window-button"
            type="button"
            onClick={() => void desktopApi.windowAction('minimize')}
          >
            <Minus size={14} />
          </button>
          <button
            aria-label="Maximize"
            className="window-button"
            type="button"
            onClick={() => void desktopApi.windowAction('maximize')}
          >
            <Maximize2 size={13} />
          </button>
          <button
            aria-label="Close"
            className="window-button close"
            type="button"
            onClick={() => void desktopApi.windowAction('close')}
          >
            <X size={15} />
          </button>
        </div>
      </header>

      <div
        className={
          workspace === 'settings' ? 'shell-body with-subnav' : 'shell-body'
        }
      >
        <nav className="activity-bar" aria-label="Primary">
          <div className="activity-group">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const selected = workspace === 'main' && mainView === item.id;
              return (
                <button
                  aria-label={item.label}
                  className={
                    selected ? 'activity-button active' : 'activity-button'
                  }
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setWorkspace('main');
                    setMainView(item.id);
                  }}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
          <button
            aria-label="Settings"
            className={
              workspace === 'settings'
                ? 'activity-button active settings-button'
                : 'activity-button settings-button'
            }
            type="button"
            onClick={() => setWorkspace('settings')}
          >
            <Settings size={20} />
          </button>
        </nav>

        {workspace === 'settings' ? (
          <aside className="subnav">
            <div className="subnav-heading">
              <span>Settings</span>
            </div>
            <Submenu
              active={settingsView}
              items={settingsNav.map(({ id, label }) => ({ id, label }))}
              onSelect={(id) => setSettingsView(id as SettingsView)}
            />
          </aside>
        ) : null}

        <section className="workspace">
          {workspace === 'main'
            ? renderMainWorkspace({
                view: mainView,
                agents,
                agentsError,
                refreshAgents,
                connection,
                config,
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
              })}
        </section>
      </div>

      <footer className="statusbar">
        <button
          aria-label="Open environment settings"
          className="statusbar-environment"
          type="button"
          onClick={openEnvironmentSettings}
        >
          <span>{activeEnvironment?.label ?? 'Local'}</span>
          <span>{backendUrl}</span>
          <span>{statusLabel}</span>
        </button>
        <button
          aria-label="Open client status"
          className="statusbar-meta"
          type="button"
          onClick={openClientStatusSettings}
        >
          <span>{appInfo.platform}</span>
          <span>v{appInfo.version}</span>
        </button>
      </footer>
    </main>
  );
}

function Submenu({
  active,
  items,
  onSelect,
}: {
  readonly active: string;
  readonly items: readonly {
    readonly id: string;
    readonly label: string;
    readonly disabled?: boolean;
  }[];
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div className="submenu">
      {items.map((item) => (
        <button
          className={
            active === item.id ? 'submenu-item active' : 'submenu-item'
          }
          disabled={item.disabled}
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
        >
          <span>{item.label}</span>
          {item.disabled ? <small>Later</small> : null}
        </button>
      ))}
    </div>
  );
}

function renderMainWorkspace({
  view,
  agents,
  agentsError,
  refreshAgents,
  connection,
  config,
}: {
  readonly view: MainView;
  readonly agents: readonly PublicAgentStatus[];
  readonly agentsError: string | undefined;
  readonly refreshAgents: () => Promise<void>;
  readonly connection: AgentConnectionState;
  readonly config: DesktopConfig | undefined;
}) {
  if (view === 'chrome') {
    return (
      <WorkspacePanel title="Local Chrome" eyebrow="Capability">
        <div className="placeholder-panel">
          <Chrome size={34} />
          <h2>Local Chrome</h2>
          <p>Unavailable</p>
        </div>
      </WorkspacePanel>
    );
  }

  if (view === 'agents') {
    return (
      <AgentsPanel
        agents={agents}
        agentsError={agentsError}
        refreshAgents={refreshAgents}
      />
    );
  }

  return (
    <WorkspacePanel title="Overview" eyebrow="Main">
      <div className="overview-grid">
        <Metric
          label="Environment"
          value={config?.activeEnvironment.label ?? 'Local'}
        />
        <Metric
          label="Backend"
          value={config?.backendUrl ?? connection.backendUrl}
        />
        <Metric label="Agent" value={config?.agentId ?? connection.agentId} />
        <Metric label="Online Agents" value={String(agents.length)} />
      </div>
      <div className="capability-grid">
        <CapabilityCard title="Agent Console" value="Available" />
        <CapabilityCard title="Local Chrome" value="Later" muted />
        <CapabilityCard title="Task Runs" value="Later" muted />
      </div>
    </WorkspacePanel>
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
  readonly appInfo: {
    readonly version: string;
    readonly platform: string;
    readonly isPackaged: boolean;
  };
}) {
  if (view === 'appearance') {
    return (
      <WorkspacePanel title="Appearance" eyebrow="Settings">
        <div className="settings-form compact">
          <label>
            <span>Mode</span>
            <select
              value={form.appearanceMode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  appearanceMode: event.target.value,
                }))
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <label>
            <span>Color Scheme</span>
            <select value="dracula" disabled>
              <option value="dracula">Dracula</option>
            </select>
          </label>
          <SaveButton onClick={saveConfig} saveState={saveState} />
        </div>
      </WorkspacePanel>
    );
  }

  if (view === 'status') {
    return (
      <WorkspacePanel title="Local Status" eyebrow="Settings">
        <StatusList
          rows={[
            ['Agent ID', config?.agentId ?? connection.agentId],
            ['Device', config?.deviceName ?? connection.deviceName],
            ['Connection', connection.status],
            ['Version', appInfo.version],
            ['Platform', appInfo.platform],
          ]}
        />
      </WorkspacePanel>
    );
  }

  if (view === 'diagnostics') {
    return (
      <WorkspacePanel title="Diagnostics" eyebrow="Settings">
        <StatusList
          rows={[
            ['Backend URL', config?.backendUrl ?? connection.backendUrl],
            [
              'Last Registered',
              connection.lastRegisteredAt ?? 'Not registered',
            ],
            ['Last Error', connection.lastError ?? 'None'],
            ['Packaged', appInfo.isPackaged ? 'yes' : 'no'],
          ]}
        />
      </WorkspacePanel>
    );
  }

  if (view === 'logs') {
    return (
      <WorkspacePanel title="Logs" eyebrow="Settings">
        <div className="log-view">
          <code>{new Date().toISOString()} settings opened</code>
          <code>{connection.status}</code>
        </div>
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
    <section className="workspace-panel">
      <div className="workspace-heading">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </section>
  );
}

function AgentsPanel({
  agents,
  agentsError,
  refreshAgents,
}: {
  readonly agents: readonly PublicAgentStatus[];
  readonly agentsError: string | undefined;
  readonly refreshAgents: () => Promise<void>;
}) {
  return (
    <WorkspacePanel title="Agents" eyebrow="Main">
      <div className="panel-toolbar">
        <p>{agents.length} online</p>
        <button
          type="button"
          className="icon-button"
          aria-label="Refresh agents"
          onClick={() => void refreshAgents()}
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

function Metric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value || 'Unknown'}</strong>
    </div>
  );
}

function CapabilityCard({
  title,
  value,
  muted,
}: {
  readonly title: string;
  readonly value: string;
  readonly muted?: boolean;
}) {
  return (
    <div className={muted ? 'capability-card muted' : 'capability-card'}>
      <Circle size={10} />
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusList({ rows }: { readonly rows: readonly [string, string][] }) {
  return (
    <dl className="status-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SaveButton({
  onClick,
  saveState,
}: {
  readonly onClick: () => Promise<void>;
  readonly saveState: 'idle' | 'saving' | 'saved';
}) {
  return (
    <button
      type="button"
      className="primary-button"
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
    </button>
  );
}
