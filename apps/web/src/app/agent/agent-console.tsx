'use client';

import type { AgentBridgeResourceSnapshot } from '@cthutool/agent-bridge-protocol';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  type AgentBridgeBootstrapState,
  AgentBridgeClientError,
  AgentBridgeFetchClient,
  classifyAgentBridgeError,
  consumeAgentBridgeFragment,
  queryLocalNetworkPermission,
} from '@/lib/agent-bridge-client';

type BrowserChallengePrompt = {
  readonly kind: string;
  readonly siteId: string;
  readonly profileName?: string;
  readonly loginUrl?: string;
  readonly message?: string;
};

export function AgentConsole({
  deploymentEnvironment,
}: {
  readonly deploymentEnvironment: string;
}) {
  const [state, setState] = useState<AgentBridgeBootstrapState>(
    'permission-required',
  );
  const [resources, setResources] = useState<AgentBridgeResourceSnapshot>();
  const [busyAction, setBusyAction] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [challenge, setChallenge] = useState<BrowserChallengePrompt>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const clientRef = useRef<AgentBridgeFetchClient | undefined>(undefined);
  const stopPollingRef = useRef<() => void>(() => undefined);

  const applySnapshot = useCallback((snapshot: AgentBridgeResourceSnapshot) => {
    setResources(snapshot);
    setLastUpdatedAt(new Date().toISOString());
    setState(
      snapshot.agent.backendStatus === 'connected'
        ? 'ready'
        : 'backend-offline',
    );
  }, []);

  const connect = useCallback(async () => {
    setState('permission-required');
    setNotice(undefined);
    try {
      const fragment = consumeAgentBridgeFragment({
        clear: () =>
          history.replaceState(
            null,
            '',
            `${location.pathname}${location.search}`,
          ),
        deploymentEnvironment,
        hash: location.hash,
      });
      if (!fragment) {
        setState('not-running');
        return;
      }
      const permission = await queryLocalNetworkPermission();
      if (permission === 'denied') {
        setState('permission-denied');
        return;
      }
      const client = new AgentBridgeFetchClient(fragment.endpoint);
      clientRef.current = client;
      await client.connect(fragment);
      const snapshot = await client.getResources();
      applySnapshot(snapshot);
      stopPollingRef.current();
      stopPollingRef.current = client.startPolling(applySnapshot, {
        onError: (error) => {
          void queryLocalNetworkPermission().then((nextPermission) =>
            setState(classifyAgentBridgeError(error, nextPermission)),
          );
        },
      });
    } catch (error) {
      setState(
        classifyAgentBridgeError(error, await queryLocalNetworkPermission()),
      );
    }
  }, [applySnapshot, deploymentEnvironment]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        void connect();
      }
    });
    return () => {
      cancelled = true;
      stopPollingRef.current();
      clientRef.current?.disconnect();
    };
  }, [connect]);

  const runAction = async (
    action: string,
    task: (client: AgentBridgeFetchClient) => Promise<unknown>,
  ) => {
    const client = clientRef.current;
    if (!client) {
      setState('stale-session');
      return;
    }
    setBusyAction(action);
    setNotice(undefined);
    setChallenge(undefined);
    try {
      const result = await task(client);
      const nextChallenge = extractBrowserChallenge(result);
      if (nextChallenge) {
        setChallenge(nextChallenge);
        setNotice(
          nextChallenge.message ?? `浏览器需要处理 ${nextChallenge.kind}`,
        );
      } else {
        setNotice(formatActionResult(result));
      }
      applySnapshot(await client.getResources());
    } catch (error) {
      if (
        error instanceof AgentBridgeClientError &&
        (error.code === 'INVALID_REQUEST' ||
          error.code === 'BROWSER_COMMAND_REJECTED' ||
          error.code === 'CONFIRMATION_REQUIRED' ||
          error.code === 'PROFILE_LOCKED' ||
          error.code === 'LIFECYCLE_UNAVAILABLE')
      ) {
        setNotice(error.message);
        return;
      }
      setState(
        classifyAgentBridgeError(error, await queryLocalNetworkPermission()),
      );
    } finally {
      setBusyAction(undefined);
    }
  };

  return (
    <main className="agent-shell">
      <header className="agent-hero">
        <div>
          <p className="eyebrow">CthuTool · Local Agent</p>
          <h1>本机能力，仍然使用部署好的 Web 界面</h1>
          <p className="hero-copy">
            当前页面只通过浏览器 Fetch 访问本机随机端口的 JSON
            bridge；页面不会保存本机 token，也不会扫描其他端口。
          </p>
        </div>
        <StateBadge state={state} />
      </header>

      {state !== 'ready' && state !== 'backend-offline' ? (
        <BootstrapPanel state={state} onRetry={connect} />
      ) : null}

      {challenge ? (
        <ChallengePanel
          busy={busyAction === 'browser-challenge'}
          challenge={challenge}
          onDismiss={() => setChallenge(undefined)}
          onOpenLogin={() => {
            if (
              !window.confirm('将在本机受控 Chrome 中打开登录页面，是否继续？')
            ) {
              return;
            }
            void runAction('browser-challenge', (client) =>
              client.rpc('browser.command', {
                id: crypto.randomUUID(),
                jsonrpc: '2.0',
                method: 'browser.openLogin',
                params: {
                  authPolicy: 'required',
                  ...(challenge.loginUrl
                    ? { loginUrl: challenge.loginUrl }
                    : {}),
                  ...(challenge.profileName
                    ? { profileName: challenge.profileName }
                    : {}),
                  siteId: challenge.siteId,
                },
              }),
            );
          }}
        />
      ) : null}

      {notice && !challenge ? <p className="action-notice">{notice}</p> : null}

      {resources && lastUpdatedAt ? (
        <p className="polling-indicator">
          Fetch polling · 最近更新{' '}
          <time dateTime={lastUpdatedAt}>
            {new Date(lastUpdatedAt).toLocaleTimeString()}
          </time>
        </p>
      ) : null}

      {resources ? (
        <div className="agent-grid" aria-busy={Boolean(busyAction)}>
          <EnvironmentCard resources={resources} />
          <RuntimeCard resources={resources} />
          <SettingsCard
            busy={busyAction === 'settings'}
            resources={resources}
            onSave={(patch) =>
              runAction('settings', (client) =>
                client.rpc('settings.update', patch),
              )
            }
          />
          <ProfilesCard
            busy={busyAction === 'profile'}
            resources={resources}
            onDelete={(siteId, profileName) => {
              if (
                window.confirm(
                  `确认删除 ${siteId} / ${profileName} 的本机登录资料？此操作不可撤销。`,
                )
              ) {
                void runAction('profile', (client) =>
                  client.rpc('profile.delete', {
                    confirm: true,
                    profileName,
                    siteId,
                  }),
                );
              }
            }}
          />
          <BrowserCard
            busy={busyAction === 'browser'}
            onRun={(request) =>
              runAction('browser', (client) =>
                client.rpc('browser.command', request),
              )
            }
          />
          <DiagnosticsCard resources={resources} />
          <LifecycleCard
            busy={busyAction === 'lifecycle'}
            onQuit={() => {
              if (window.confirm('确认退出本机 Agent？托盘也会一起退出。')) {
                void runAction('lifecycle', (client) =>
                  client.rpc('lifecycle.action', { action: 'agent.quit' }),
                );
              }
            }}
          />
        </div>
      ) : null}

      <p className="sr-status" role="status" aria-live="polite">
        {notice ?? stateDescription(state)}
      </p>
    </main>
  );
}

function ChallengePanel({
  busy,
  challenge,
  onDismiss,
  onOpenLogin,
}: {
  readonly busy: boolean;
  readonly challenge: BrowserChallengePrompt;
  readonly onDismiss: () => void;
  readonly onOpenLogin: () => void;
}) {
  return (
    <section className="challenge-panel" aria-labelledby="challenge-title">
      <div>
        <p className="eyebrow">Browser challenge</p>
        <h2 id="challenge-title">需要在本机 Chrome 中继续</h2>
        <p>
          {challenge.message ??
            `${challenge.siteId} 请求 ${challenge.kind}，完成后页面会继续轮询状态。`}
        </p>
      </div>
      <div className="button-row">
        <button
          className="primary-button"
          disabled={busy}
          type="button"
          onClick={onOpenLogin}
        >
          {busy ? '正在打开…' : '打开登录页面'}
        </button>
        <button className="secondary-button" type="button" onClick={onDismiss}>
          稍后处理
        </button>
      </div>
    </section>
  );
}

function StateBadge({ state }: { readonly state: AgentBridgeBootstrapState }) {
  return (
    <span className={`state-badge state-${state}`}>
      <span aria-hidden="true" className="status-dot" />
      {stateLabel(state)}
    </span>
  );
}

function BootstrapPanel({
  state,
  onRetry,
}: {
  readonly state: AgentBridgeBootstrapState;
  readonly onRetry: () => Promise<void>;
}) {
  return (
    <section className="bootstrap-panel" aria-labelledby="bootstrap-title">
      <p className="eyebrow">连接本机 Agent</p>
      <h2 id="bootstrap-title">{stateLabel(state)}</h2>
      <p>{stateDescription(state)}</p>
      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          onClick={() => void onRetry()}
        >
          重新连接
        </button>
        <a className="secondary-button" href="/agent/help">
          查看权限修复方法
        </a>
        {state === 'version-incompatible' ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              void navigator.clipboard?.writeText('chc agent update')
            }
          >
            复制更新命令：chc agent update
          </button>
        ) : null}
      </div>
    </section>
  );
}

function EnvironmentCard({
  resources,
}: {
  readonly resources: AgentBridgeResourceSnapshot;
}) {
  return (
    <section className="agent-card card-wide">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Environment</p>
          <h2>{resources.environment.label}</h2>
        </div>
        <span className="mono-pill">{resources.environment.id}</span>
      </div>
      <dl className="fact-grid">
        <Fact label="Web Origin" value={resources.environment.webOrigin} />
        <Fact label="Backend" value={resources.environment.backendHttpUrl} />
        <Fact label="Agent" value={resources.agent.deviceName} />
        <Fact label="Backend status" value={resources.agent.backendStatus} />
        <Fact label="Process" value={resources.agent.processState} />
      </dl>
      <p className="card-note">
        Origin 只读。修改连接目标请使用本机原生 Agent Settings（托盘 → Agent
        Settings，或 <code>chc agent settings</code>）。Web
        页面不能更改这个信任边界。
      </p>
    </section>
  );
}

function RuntimeCard({
  resources,
}: {
  readonly resources: AgentBridgeResourceSnapshot;
}) {
  return (
    <section className="agent-card">
      <p className="eyebrow">Chrome runtime</p>
      <h2>
        {resources.browser.ready ? '浏览器能力可用' : '需要处理 Chrome 配置'}
      </h2>
      <p className="card-note">{resources.browser.message}</p>
      <dl className="stacked-facts">
        <Fact label="Runtime" value={resources.browser.status} />
        <Fact
          label="Executable"
          value={
            resources.browser.executablePathConfigured
              ? 'custom'
              : 'auto-discovery'
          }
        />
        <Fact
          label="Autostart"
          value={
            resources.autostart.supported
              ? resources.autostart.enabled
                ? 'enabled'
                : 'disabled'
              : 'adapter unavailable'
          }
        />
      </dl>
    </section>
  );
}

function SettingsCard({
  resources,
  busy,
  onSave,
}: {
  readonly resources: AgentBridgeResourceSnapshot;
  readonly busy: boolean;
  readonly onSave: (patch: {
    readonly deviceName: string;
    readonly connectionEnabled: boolean;
    readonly browserExecutablePath: string;
  }) => void;
}) {
  const deviceNameId = useId();
  const executableId = useId();
  const connectionId = useId();
  return (
    <section className="agent-card">
      <p className="eyebrow">Local settings</p>
      <h2>运行设置</h2>
      <form
        className="settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave({
            browserExecutablePath: String(
              data.get('browserExecutablePath') ?? '',
            ),
            connectionEnabled: data.get('connectionEnabled') === 'on',
            deviceName: String(data.get('deviceName') ?? ''),
          });
        }}
      >
        <label htmlFor={deviceNameId}>设备名称</label>
        <input
          defaultValue={resources.agent.deviceName}
          id={deviceNameId}
          maxLength={128}
          name="deviceName"
          required
        />
        <label htmlFor={executableId}>Chrome 可执行文件（可选）</label>
        <input
          defaultValue={resources.browser.executablePath ?? ''}
          id={executableId}
          name="browserExecutablePath"
        />
        <label className="check-row" htmlFor={connectionId}>
          <input
            defaultChecked={resources.agent.backendStatus !== 'disabled'}
            id={connectionId}
            name="connectionEnabled"
            type="checkbox"
          />
          连接当前环境 backend
        </label>
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? '正在应用…' : '保存设置'}
        </button>
        <p className="card-note">
          本表单只保存设备名、Chrome 路径和连接开关。Origin 请在原生 Agent
          Settings 中配置。
        </p>
      </form>
    </section>
  );
}

function ProfilesCard({
  resources,
  busy,
  onDelete,
}: {
  readonly resources: AgentBridgeResourceSnapshot;
  readonly busy: boolean;
  readonly onDelete: (siteId: string, profileName: string) => void;
}) {
  return (
    <section className="agent-card card-wide">
      <p className="eyebrow">Environment profiles</p>
      <h2>浏览器登录资料</h2>
      {resources.profiles.length ? (
        <ul className="profile-list">
          {resources.profiles.map((profile) => (
            <li key={`${profile.siteId}:${profile.profileName}`}>
              <div>
                <strong>{profile.displayName ?? profile.profileName}</strong>
                <span>
                  {profile.siteId} · {profile.status}
                </span>
              </div>
              <button
                className="danger-button"
                disabled={busy}
                type="button"
                onClick={() => onDelete(profile.siteId, profile.profileName)}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">当前环境还没有保存浏览器登录资料。</p>
      )}
    </section>
  );
}

function BrowserCard({
  busy,
  onRun,
}: {
  readonly busy: boolean;
  readonly onRun: (request: unknown) => void;
}) {
  const urlId = useId();
  return (
    <section className="agent-card card-wide">
      <p className="eyebrow">Controlled browser</p>
      <h2>受控页面采集</h2>
      <form
        className="browser-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onRun({
            id: crypto.randomUUID(),
            jsonrpc: '2.0',
            method: 'browser.capturePage',
            params: {
              authPolicy: 'anonymous',
              includeText: true,
              siteId: 'manual',
              url: String(data.get('url') ?? ''),
            },
          });
        }}
      >
        <label htmlFor={urlId}>页面 URL</label>
        <div className="inline-field">
          <input
            id={urlId}
            name="url"
            placeholder="https://example.com"
            required
            type="url"
          />
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? '执行中…' : '运行'}
          </button>
        </div>
      </form>
      <p className="card-note">
        仅支持 allowlist 中的结构化命令，不支持页面脚本或任意代码执行。
      </p>
    </section>
  );
}

function DiagnosticsCard({
  resources,
}: {
  readonly resources: AgentBridgeResourceSnapshot;
}) {
  return (
    <section className="agent-card card-wide">
      <p className="eyebrow">Diagnostics</p>
      <h2>最近事件</h2>
      <ol className="diagnostic-list">
        {resources.diagnostics.slice(0, 8).map((event) => (
          <li key={`${event.timestamp}:${event.event}`}>
            <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
            <span>{event.event}</span>
            <p>{event.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LifecycleCard({
  busy,
  onQuit,
}: {
  readonly busy: boolean;
  readonly onQuit: () => void;
}) {
  return (
    <section className="agent-card danger-zone">
      <p className="eyebrow">Lifecycle</p>
      <h2>退出 Agent</h2>
      <p className="card-note">
        退出会同时关闭本机 Agent 和托盘。重新启动请使用 CLI 或系统应用入口。
      </p>
      <button
        className="danger-button"
        disabled={busy}
        type="button"
        onClick={onQuit}
      >
        {busy ? '正在退出…' : '退出本机 Agent'}
      </button>
    </section>
  );
}

function Fact({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatActionResult(result: unknown): string {
  if (!result || typeof result !== 'object') {
    return '操作已完成';
  }
  if ('effect' in result && typeof result.effect === 'string') {
    return `设置已保存（${result.effect}）`;
  }
  return '操作已完成';
}

function extractBrowserChallenge(
  result: unknown,
): BrowserChallengePrompt | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  const error = (result as { readonly error?: unknown }).error;
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const data = (error as { readonly data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const challenge = (data as { readonly challenge?: unknown }).challenge;
  if (!challenge || typeof challenge !== 'object') {
    return undefined;
  }
  const candidate = challenge as Record<string, unknown>;
  if (
    typeof candidate.kind !== 'string' ||
    typeof candidate.siteId !== 'string'
  ) {
    return undefined;
  }
  return {
    kind: candidate.kind,
    siteId: candidate.siteId,
    ...(typeof candidate.profileName === 'string'
      ? { profileName: candidate.profileName }
      : {}),
    ...(typeof candidate.loginUrl === 'string'
      ? { loginUrl: candidate.loginUrl }
      : {}),
    ...(typeof candidate.message === 'string'
      ? { message: candidate.message }
      : {}),
  };
}

function stateLabel(state: AgentBridgeBootstrapState): string {
  return {
    'backend-offline': 'Backend 离线',
    'environment-mismatch': '环境不匹配',
    'not-running': '未检测到启动信息',
    'origin-mismatch': '页面来源不匹配',
    'permission-denied': '本地网络权限被阻止',
    'permission-required': '正在请求本地网络权限',
    ready: '本机 Agent 已连接',
    'stale-session': '本机会话已失效',
    'ticket-expired': '启动票据已过期',
    'version-incompatible': '需要更新 Agent',
  }[state];
}

function stateDescription(state: AgentBridgeBootstrapState): string {
  return {
    'backend-offline':
      '本机能力可用，但当前环境 backend 暂时离线。Agent 会继续重连。',
    'environment-mismatch':
      '请在托盘中选择与当前 Web 部署相同的环境，再重新打开设置。',
    'not-running':
      '请从 CthuTool 托盘或 chc agent settings 打开本页面；页面不会扫描 localhost。',
    'origin-mismatch': '当前页面不是 Agent 为此环境信任的精确 Web Origin。',
    'permission-denied':
      '浏览器没有允许该页面访问 loopback。请在站点权限中允许“本地网络访问”，然后重试。',
    'permission-required':
      '浏览器可能显示本地网络访问提示。允许后才能读取本机 Agent 状态。',
    ready: '本机 Agent bridge 已连接。',
    'stale-session': '短期会话已经失效。请从托盘重新打开设置以获取一次性票据。',
    'ticket-expired': '一次性启动票据已使用或过期。请从托盘重新打开设置。',
    'version-incompatible':
      'Web 与本机 bridge 协议不兼容，请更新 CthuTool Agent/CLI。',
  }[state];
}
