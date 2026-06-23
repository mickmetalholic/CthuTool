import {
  Card,
  CardContent,
  cn,
  MetadataList,
  type MetadataListProps,
  MetricTile,
  type MetricTileProps,
  Notice,
  type NoticeProps,
  StatusList,
  type StatusListProps,
} from '@cthutool/ui';
import type * as React from 'react';
import {
  type ObservableDiagnosticsReference,
  type ObservableRuntimeState,
  type ObservableStateKind,
  useObservableRuntimeState,
  useRuntimeCapability,
} from './runtime';

type StatusListObjectRow = Extract<
  StatusListProps['rows'][number],
  { readonly status?: unknown }
>;
type PageStatusKind = NonNullable<StatusListObjectRow['status']>;

export function AppShellFrame({
  activity,
  children,
  className,
  status,
  subnav,
  titlebar,
}: {
  readonly activity?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly status?: React.ReactNode;
  readonly subnav?: React.ReactNode;
  readonly titlebar?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid min-h-screen grid-rows-[auto_minmax(0,1fr)_auto] bg-background text-foreground',
        className,
      )}
      data-slot="app-shell-frame"
    >
      {titlebar ? <header>{titlebar}</header> : null}
      <div className="grid min-h-0 grid-cols-[auto_auto_minmax(0,1fr)]">
        {activity ? <aside>{activity}</aside> : null}
        {subnav ? <aside>{subnav}</aside> : null}
        <main className="min-w-0 overflow-auto">{children}</main>
      </div>
      {status ? <footer>{status}</footer> : null}
    </div>
  );
}

export function PageHeader({
  description,
  eyebrow,
  title,
}: {
  readonly description?: React.ReactNode;
  readonly eyebrow?: string;
  readonly title: string;
}) {
  return (
    <div className="grid min-w-0 gap-1" data-slot="page-header">
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase text-accent">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="min-w-0 break-words text-2xl font-semibold tracking-normal">
        {title}
      </h1>
      {description ? (
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function PageSurface({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <Card className={cn('shadow-none', className)} data-slot="page-surface">
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export function CapabilityGate({
  capability,
  children,
  fallback = null,
}: {
  readonly capability:
    | 'canControlWindow'
    | 'canReadLocalPaths'
    | 'canUseLocalBrowserProfiles';
  readonly children: React.ReactNode;
  readonly fallback?: React.ReactNode;
}) {
  return useRuntimeCapability(capability) ? children : fallback;
}

export function PageToolbar({
  children,
  className,
  end,
  start,
}: React.ComponentProps<'div'> & {
  readonly end?: React.ReactNode;
  readonly start?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-between gap-2',
        className,
      )}
      data-slot="page-toolbar"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {start}
        {children}
      </div>
      {end ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">{end}</div>
      ) : null}
    </div>
  );
}

export function PageFrame({
  atmosphere,
  children,
  className,
  contentClassName,
  description,
  eyebrow,
  title,
  toolbar,
}: React.ComponentProps<'section'> & {
  readonly atmosphere?: React.ReactNode;
  readonly contentClassName?: string;
  readonly description?: React.ReactNode;
  readonly eyebrow?: string;
  readonly title: string;
  readonly toolbar?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'relative isolate grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[color:var(--surface-workspace)]',
        className,
      )}
      data-slot="page-frame"
    >
      {atmosphere ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          data-slot="page-atmosphere"
        >
          {atmosphere}
        </div>
      ) : null}
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
        <PageHeader description={description} eyebrow={eyebrow} title={title} />
        {toolbar ? <div className="min-w-0 shrink-0">{toolbar}</div> : null}
      </header>
      <div
        className={cn(
          'min-h-0 min-w-0 overflow-auto px-6 py-5',
          contentClassName,
        )}
        data-slot="page-frame-content"
      >
        {children}
      </div>
    </section>
  );
}

export function PageNotice(props: NoticeProps) {
  return <Notice {...props} data-slot="page-notice" />;
}

export function MetricSummary({
  className,
  metrics,
  ...props
}: React.ComponentProps<'div'> & {
  readonly metrics: readonly MetricTileProps[];
}) {
  return (
    <div
      className={cn(
        'grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
      data-slot="metric-summary"
      {...props}
    >
      {metrics.map((metric) => (
        <MetricTile {...metric} key={String(metric.label)} />
      ))}
    </div>
  );
}

export function PageMetadataList(props: MetadataListProps) {
  return <MetadataList {...props} data-slot="page-metadata-list" />;
}

export function PageStatusList(props: StatusListProps) {
  return <StatusList {...props} data-slot="page-status-list" />;
}

export type ObservableStatusSummaryProps = React.ComponentProps<'section'> & {
  readonly emptyState?: React.ReactNode;
  readonly state?: ObservableRuntimeState;
};

export function ObservableStatusSummary({
  className,
  emptyState,
  state: stateProp,
  ...props
}: ObservableStatusSummaryProps) {
  const runtimeState = useObservableRuntimeState();
  const state = stateProp ?? runtimeState;

  if (!state) {
    return (
      <section
        className={cn('grid min-w-0 gap-3', className)}
        data-slot="observable-status-summary"
        {...props}
      >
        {emptyState ?? (
          <PageNotice title="Observable state unavailable">
            This runtime has not provided backend, agent, browser, or
            diagnostics status.
          </PageNotice>
        )}
      </section>
    );
  }

  const diagnosticsReferences = state.diagnostics?.references ?? [];

  return (
    <section
      className={cn('grid min-w-0 gap-3', className)}
      data-slot="observable-status-summary"
      {...props}
    >
      <MetricSummary metrics={toObservableMetrics(state)} />
      <PageStatusList rows={toObservableRows(state)} />
      {diagnosticsReferences.length > 0 ? (
        <DiagnosticsReferenceList references={diagnosticsReferences} />
      ) : null}
    </section>
  );
}

export function toObservableMetrics(
  state: ObservableRuntimeState,
): readonly MetricTileProps[] {
  return [
    {
      label: 'Backend',
      meta: state.backend?.url ?? state.backend?.requestId,
      value: observableStatusLabel(state.backend?.status),
    },
    {
      label: 'Agent',
      meta: state.agent?.agentId ?? state.agent?.backendUrl,
      value: observableStatusLabel(state.agent?.status),
    },
    {
      label: 'Browser',
      meta: state.browserRuntime?.diagnostic,
      value: observableStatusLabel(state.browserRuntime?.status),
    },
    {
      label: 'Diagnostics',
      meta: state.diagnostics?.enabled === false ? 'Disabled' : undefined,
      value: observableStatusLabel(state.diagnostics?.status),
    },
  ];
}

export function toObservableRows(
  state: ObservableRuntimeState,
): StatusListProps['rows'] {
  return [
    {
      label: 'Backend',
      status: observableBadgeStatus(state.backend?.status),
      value: summarizeObservableBackend(state),
    },
    {
      label: 'Agent',
      status: observableBadgeStatus(state.agent?.status),
      value: summarizeObservableAgent(state),
    },
    {
      label: 'Browser Runtime',
      status: observableBadgeStatus(state.browserRuntime?.status),
      value: summarizeObservableBrowser(state),
    },
    {
      label: 'Diagnostics',
      status: observableBadgeStatus(state.diagnostics?.status),
      value: summarizeObservableDiagnostics(state),
    },
  ];
}

export function isSafeDiagnosticsHref(href: string): boolean {
  if (href.startsWith('#')) {
    return true;
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return true;
  }

  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function DiagnosticsReferenceList({
  references,
}: {
  readonly references: readonly ObservableDiagnosticsReference[];
}) {
  return (
    <div className="grid min-w-0 gap-2" data-slot="diagnostics-references">
      {references.map((reference) => (
        <div
          className="grid min-w-0 gap-1 rounded-md border border-border bg-[color:var(--surface-subtle)] px-3 py-2 text-sm"
          data-slot="diagnostics-reference"
          key={reference.id}
        >
          <div className="font-medium text-foreground">
            {reference.label ?? `Diagnostics ${reference.id}`}
          </div>
          {reference.summary ? (
            <div className="min-w-0 break-words text-muted-foreground">
              {reference.summary}
            </div>
          ) : null}
          {reference.href && isSafeDiagnosticsHref(reference.href) ? (
            <a
              className="min-w-0 break-words text-accent"
              href={reference.href}
            >
              {reference.id}
            </a>
          ) : (
            <span className="min-w-0 break-words text-muted-foreground">
              {reference.id}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function observableStatusLabel(status: ObservableStateKind | undefined) {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'degraded':
      return 'Degraded';
    case 'unavailable':
      return 'Unavailable';
    case 'unknown':
    case undefined:
      return 'Unknown';
  }
}

function observableBadgeStatus(
  status: ObservableStateKind | undefined,
): PageStatusKind {
  switch (status) {
    case 'ok':
      return 'connected';
    case 'degraded':
      return 'warning';
    case 'unavailable':
      return 'error';
    case 'unknown':
    case undefined:
      return 'neutral';
  }
}

function summarizeObservableBackend(state: ObservableRuntimeState) {
  const backend = state.backend;
  if (!backend) {
    return 'No backend status provided';
  }
  return [
    backend.label,
    backend.url,
    backend.lastError?.message,
    backend.checkedAt ? `checked ${backend.checkedAt}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ');
}

function summarizeObservableAgent(state: ObservableRuntimeState) {
  const agent = state.agent;
  if (!agent) {
    return 'No agent status provided';
  }
  return [
    agent.agentId,
    agent.backendUrl,
    agent.lastError?.message,
    agent.lastSeenAt ? `seen ${agent.lastSeenAt}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ');
}

function summarizeObservableBrowser(state: ObservableRuntimeState) {
  const browser = state.browserRuntime;
  if (!browser) {
    return 'No browser runtime status provided';
  }
  return [
    browser.diagnostic,
    browser.lastError?.message,
    browser.lastSeenAt ? `seen ${browser.lastSeenAt}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ');
}

function summarizeObservableDiagnostics(state: ObservableRuntimeState) {
  const diagnostics = state.diagnostics;
  if (!diagnostics) {
    return 'No diagnostics status provided';
  }
  return [
    diagnostics.enabled ? 'Enabled' : 'Disabled',
    diagnostics.lastError?.message,
    diagnostics.references?.length
      ? `${diagnostics.references.length} reference(s)`
      : undefined,
  ]
    .filter(Boolean)
    .join(' | ');
}
