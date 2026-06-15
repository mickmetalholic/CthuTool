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
import { useRuntimeCapability } from './runtime';

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
