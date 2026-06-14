import { Badge, cn } from '@cthutool/ui';
import * as React from 'react';
import { CapabilityGate } from './shell';

export type OverviewMetric = {
  readonly label: string;
  readonly value: string;
};

export type OverviewCapability = {
  readonly muted?: boolean;
  readonly title: string;
  readonly value: string;
};

export function OverviewPage({
  capabilities,
  metrics,
}: {
  readonly capabilities: readonly OverviewCapability[];
  readonly metrics: readonly OverviewMetric[];
}) {
  return (
    <>
      <div className="overview-grid">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value || 'Unknown'}</strong>
          </div>
        ))}
      </div>
      <div className="capability-grid">
        {capabilities.map((capability) => (
          <div
            className={cn(
              'capability-card',
              capability.muted ? 'muted' : undefined,
            )}
            key={capability.title}
          >
            <span className="capability-dot" aria-hidden="true" />
            <span>{capability.title}</span>
            <strong>{capability.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

export type StatusRow = readonly [label: string, value: string];

export function LocalStatusPage({
  localRows,
  rows,
}: {
  readonly localRows?: readonly StatusRow[];
  readonly rows: readonly StatusRow[];
}) {
  return (
    <dl className="status-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
      {localRows && localRows.length > 0 ? (
        <CapabilityGate
          capability="canReadLocalPaths"
          fallback={
            <div>
              <dt>Local Paths</dt>
              <dd>
                <Badge variant="outline">Unavailable in this runtime</Badge>
              </dd>
            </div>
          }
        >
          {localRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </CapabilityGate>
      ) : null}
    </dl>
  );
}
