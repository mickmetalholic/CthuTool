import type * as React from 'react';
import { cn } from '../lib/utils';
import { StatusBadge } from './status-badge';

type StatusKind = NonNullable<
  React.ComponentProps<typeof StatusBadge>['status']
>;

type StatusListRow =
  | [label: React.ReactNode, value: React.ReactNode]
  | {
      label: React.ReactNode;
      status?: StatusKind;
      value: React.ReactNode;
    };

type StatusListProps = React.ComponentProps<'div'> & {
  rows: StatusListRow[];
};

function getRowParts(row: StatusListRow) {
  if (Array.isArray(row)) {
    return { label: row[0], status: undefined, value: row[1] };
  }

  return row;
}

function StatusList({ className, rows, ...props }: StatusListProps) {
  return (
    <div
      className={cn('grid min-w-0 gap-2', className)}
      data-slot="status-list"
      {...props}
    >
      {rows.map((row) => {
        const { label, status, value } = getRowParts(row);

        return (
          <div
            className="grid min-w-0 gap-2 rounded-md border border-border bg-[color:var(--surface-subtle)] px-3 py-2 text-sm sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)]"
            data-slot="status-list-row"
            key={`${String(label)}:${String(value)}`}
          >
            <div className="min-w-0 break-words text-muted-foreground">
              {label}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 break-words text-foreground">
              {status ? (
                <StatusBadge status={status}>{String(status)}</StatusBadge>
              ) : null}
              <span className="min-w-0 break-words">{value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { StatusListProps, StatusListRow };
export { StatusList };
