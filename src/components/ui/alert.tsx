import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/libs/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-foreground',
        success: 'border-success/30 bg-success-subtle text-success-subtle-foreground',
        warning: 'border-warning/30 bg-warning-subtle text-warning-subtle-foreground',
        danger: 'border-danger/30 bg-danger-subtle text-danger-subtle-foreground',
        info: 'border-info/30 bg-info-subtle text-info-subtle-foreground',
        // shadcn alias
        destructive: 'border-danger/30 bg-danger-subtle text-danger-subtle-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      role="alert"
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mb-1 font-medium tracking-tight', className)}
      data-slot="alert-title"
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      data-slot="alert-description"
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
