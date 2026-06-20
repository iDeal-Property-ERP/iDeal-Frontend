import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/libs/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        // `default` is the project's neutral/gray badge (relied on by libs/badges.ts)
        default: 'bg-muted text-muted-foreground ring-border',
        success: 'bg-success-subtle text-success-subtle-foreground ring-success/20',
        warning: 'bg-warning-subtle text-warning-subtle-foreground ring-warning/20',
        danger: 'bg-danger-subtle text-danger-subtle-foreground ring-danger/20',
        info: 'bg-info-subtle text-info-subtle-foreground ring-info/20',
        primary: 'bg-primary-muted text-primary ring-primary/20',
        // shadcn base variants kept for new usages
        secondary:
          'bg-secondary text-secondary-foreground ring-transparent [a&]:hover:bg-secondary/90',
        destructive: 'bg-destructive text-white ring-transparent [a&]:hover:bg-destructive/90',
        outline: 'bg-transparent text-foreground ring-border',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
