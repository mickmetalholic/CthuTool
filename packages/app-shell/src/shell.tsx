import { Card, CardContent, cn } from '@cthutool/ui';
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
  eyebrow,
  title,
}: {
  readonly eyebrow?: string;
  readonly title: string;
}) {
  return (
    <div className="grid gap-1" data-slot="page-header">
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase text-accent">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
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
  return useRuntimeCapability(capability) ? <>{children}</> : <>{fallback}</>;
}
