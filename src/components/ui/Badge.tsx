'use client';

import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/libs/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground ring-border',
        success: 'bg-success-subtle text-success-subtle-foreground ring-success/20',
        warning: 'bg-warning-subtle text-warning-subtle-foreground ring-warning/20',
        danger: 'bg-danger-subtle text-danger-subtle-foreground ring-danger/20',
        info: 'bg-info-subtle text-info-subtle-foreground ring-info/20',
        primary: 'bg-primary-muted text-primary ring-primary/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

/**
 * Status or label badge with semantic color variants.
 * @param props - Span HTML attributes plus variant.
 * @returns Badge span element.
 */
export function Badge(props: BadgeProps) {
  const { className, variant, ...rest } = props;
  return <span {...rest} className={cn(badgeVariants({ variant }), className)} />;
}
