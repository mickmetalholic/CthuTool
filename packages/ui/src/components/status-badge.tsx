import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../lib/utils';

const statusBadgeVariants = cva(
  'inline-flex min-w-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium leading-5 transition-colors before:size-1.5 before:shrink-0 before:rounded-full',
  {
    defaultVariants: {
      status: 'neutral',
    },
    variants: {
      status: {
        connected:
          'border-[color:var(--status-connected-border)] bg-[color:var(--status-connected-bg)] text-[color:var(--status-connected-fg)] before:bg-[color:var(--status-connected-dot)]',
        disabled:
          'border-[color:var(--status-disabled-border)] bg-[color:var(--status-disabled-bg)] text-[color:var(--status-disabled-fg)] before:bg-[color:var(--status-disabled-dot)]',
        error:
          'border-[color:var(--status-error-border)] bg-[color:var(--status-error-bg)] text-[color:var(--status-error-fg)] before:bg-[color:var(--status-error-dot)]',
        neutral:
          'border-[color:var(--status-neutral-border)] bg-[color:var(--status-neutral-bg)] text-[color:var(--status-neutral-fg)] before:bg-[color:var(--status-neutral-dot)]',
        pending:
          'border-[color:var(--status-pending-border)] bg-[color:var(--status-pending-bg)] text-[color:var(--status-pending-fg)] before:bg-[color:var(--status-pending-dot)]',
        running:
          'border-[color:var(--status-running-border)] bg-[color:var(--status-running-bg)] text-[color:var(--status-running-fg)] before:bg-[color:var(--status-running-dot)]',
        success:
          'border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success-fg)] before:bg-[color:var(--status-success-dot)]',
        warning:
          'border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] text-[color:var(--status-warning-fg)] before:bg-[color:var(--status-warning-dot)]',
      },
    },
  },
);

function StatusBadge({
  className,
  status,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span
      className={cn(statusBadgeVariants({ className, status }))}
      data-slot="status-badge"
      data-status={status}
      {...props}
    />
  );
}

export { StatusBadge, statusBadgeVariants };
