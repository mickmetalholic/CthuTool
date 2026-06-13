import type { PublicAgentStatus } from '@cthutool/agent-protocol';
import { RefreshCw, Save, Server, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentConnectionState } from '../../main/agent-client';
import type { DesktopConfig } from '../../main/config';
import { fetchConnectedAgents } from './agents-api';
import { type DesktopApi, getDesktopApi } from './desktop-api';
import './styles.css';

type AppProps = {
  readonly desktopApi?: DesktopApi;
  readonly fetchAgents?: typeof fetchConnectedAgents;
};

const emptyState: AgentConnectionState = {
  status: 'disconnected',
  backendUrl: '',
  agentId: '',
  deviceName: '',
};

export function App({
  desktopApi = getDesktopApi(),
  fetchAgents = fetchConnectedAgents,
}: AppProps) {
  const [config, setConfig] = useState<DesktopConfig | undefined>();
  const [form, setForm] = useState({
    backendUrl: '',
    deviceName: '',
  });
  const [connection, setConnection] =
    useState<AgentConnectionState>(emptyState);
  const [agents, setAgents] = useState<PublicAgentStatus[]>([]);
  const [agentsError, setAgentsError] = useState<string | undefined>();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

  useEffect(() => {
    let mounted = true;
    void desktopApi.getConfig().then((nextConfig) => {
      if (!mounted) return;
      setConfig(nextConfig);
      setForm({
        backendUrl: nextConfig.backendUrl,
        deviceName: nextConfig.deviceName,
      });
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

  const backendUrl =
    form.backendUrl || config?.backendUrl || connection.backendUrl;

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
    const next = await desktopApi.saveConfig(form);
    setConfig(next);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1200);
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

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">CthuTool Desktop</p>
          <h1>Agent Console</h1>
        </div>
        <div className={`connection-pill ${connection.status}`}>
          {connection.status === 'connected' ? (
            <Wifi size={18} />
          ) : (
            <WifiOff size={18} />
          )}
          <span>{statusLabel}</span>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <Server size={20} />
            <h2>This Device</h2>
          </div>
          <div className="settings-form">
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
            <button
              type="button"
              className="primary-button"
              onClick={saveConfig}
            >
              <Save size={17} />
              <span>
                {saveState === 'saving'
                  ? 'Saving'
                  : saveState === 'saved'
                    ? 'Saved'
                    : 'Save'}
              </span>
            </button>
          </div>
          <dl className="status-list">
            <div>
              <dt>Agent ID</dt>
              <dd>{config?.agentId ?? connection.agentId}</dd>
            </div>
            <div>
              <dt>Last Registered</dt>
              <dd>{connection.lastRegisteredAt ?? 'Not registered'}</dd>
            </div>
            {connection.lastError ? (
              <div>
                <dt>Last Error</dt>
                <dd>{connection.lastError}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="panel agents-panel">
          <div className="panel-heading with-action">
            <div>
              <div className="panel-title-line">
                <Server size={20} />
                <h2>Connected Agents</h2>
              </div>
              <p>{agents.length} online</p>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Refresh agents"
              onClick={() => void refreshAgents()}
            >
              <RefreshCw size={18} />
            </button>
          </div>
          {agentsError ? <p className="error-text">{agentsError}</p> : null}
          <div className="agent-table-frame">
            <table className="agent-table">
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Platform</th>
                  <th scope="col">Capabilities</th>
                  <th scope="col">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.agentId}>
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
          </div>
        </section>
      </section>
    </main>
  );
}
