import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../lib/utils';

const noticeVariants = cva(
  'rounded-md border px-4 py-3 text-sm shadow-[var(--shadow-panel)]',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'border-border bg-[color:var(--surface-panel)] text-foreground',
        error:
          'border-[color:var(--status-error-border)] bg-[color:var(--status-error-bg)] text-[color:var(--status-error-fg)]',
        success:
          'border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success-fg)]',
        warning:
          'border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] text-[color:var(--status-warning-fg)]',
      },
    },
  },
);

type NoticeProps = React.ComponentProps<'section'> &
  VariantProps<typeof noticeVariants> & {
    title?: React.ReactNode;
  };

function Notice({
  children,
  className,
  title,
  variant,
  ...props
}: NoticeProps) {
  return (
    <section
      className={cn(noticeVariants({ className, variant }))}
      data-slot="notice"
      data-variant={variant}
      {...props}
    >
      {title ? <div className="mb-1 font-medium">{title}</div> : null}
      <div className="text-current/85">{children}</div>
    </section>
  );
}

type EmptyStateProps = React.ComponentProps<'section'> & {
  title: React.ReactNode;
};

function EmptyState({ children, className, title, ...props }: EmptyStateProps) {
  return (
    <section
      className={cn(
        'flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-border bg-[color:var(--surface-subtle)] px-5 py-8 text-center',
        className,
      )}
      data-slot="empty-state"
      {...props}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children ? (
        <div className="mt-1 max-w-md text-sm text-muted-foreground">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export type { EmptyStateProps, NoticeProps };
export { EmptyState, Notice, noticeVariants };
