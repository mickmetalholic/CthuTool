import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-sm',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-border text-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
      },
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ className, variant }))}
      data-slot="badge"
      data-variant={variant}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
