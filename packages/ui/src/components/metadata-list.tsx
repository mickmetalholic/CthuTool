import type * as React from 'react';
import { cn } from '../lib/utils';

type MetadataRow =
  | [label: React.ReactNode, value: React.ReactNode]
  | { label: React.ReactNode; value: React.ReactNode };

type MetadataListProps = React.ComponentProps<'dl'> & {
  rows: MetadataRow[];
};

function getRowParts(row: MetadataRow) {
  return Array.isArray(row) ? { label: row[0], value: row[1] } : row;
}

function MetadataList({ className, rows, ...props }: MetadataListProps) {
  return (
    <dl
      className={cn('grid min-w-0 gap-2 text-sm', className)}
      data-slot="metadata-list"
      {...props}
    >
      {rows.map((row) => {
        const { label, value } = getRowParts(row);

        return (
          <div
            className="grid min-w-0 gap-1 rounded-md border border-border bg-[color:var(--surface-subtle)] px-3 py-2 sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)]"
            data-slot="metadata-row"
            key={`${String(label)}:${String(value)}`}
          >
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </dt>
            <dd className="min-w-0 break-words text-foreground">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export type { MetadataListProps, MetadataRow };
export { MetadataList };
