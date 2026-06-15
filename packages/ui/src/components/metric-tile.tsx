import type * as React from 'react';
import { cn } from '../lib/utils';

type MetricTileProps = React.ComponentProps<'article'> & {
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
};

function MetricTile({
  className,
  label,
  meta,
  value,
  ...props
}: MetricTileProps) {
  return (
    <article
      className={cn(
        'min-w-0 rounded-md border border-border bg-[color:var(--surface-panel)] p-4 shadow-[var(--shadow-panel)]',
        className,
      )}
      data-slot="metric-tile"
      {...props}
    >
      <div className="truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 min-w-0 break-words text-2xl font-semibold leading-none text-foreground">
        {value}
      </div>
      {meta ? (
        <div className="mt-2 min-w-0 break-words text-xs text-muted-foreground">
          {meta}
        </div>
      ) : null}
    </article>
  );
}

export type { MetricTileProps };
export { MetricTile };
