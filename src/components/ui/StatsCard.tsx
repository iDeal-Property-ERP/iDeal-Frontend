'use client';

import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/libs/utils';

const valueVariants = cva('mt-1 text-2xl font-semibold tracking-tight', {
  variants: {
    variant: {
      default: 'text-foreground',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
    },
  },
  defaultVariants: { variant: 'default' },
});

type StatsCardProps = VariantProps<typeof valueVariants> & {
  title: string;
  value: string | number;
  subtitle?: string;
};

/**
 * KPI card displaying a metric with optional semantic coloring.
 * @param props - Title, value, optional subtitle and variant.
 * @returns Stats card element.
 */
export function StatsCard(props: StatsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent>
        <dt className="truncate text-sm font-medium text-muted-foreground">{props.title}</dt>
        <dd className={cn(valueVariants({ variant: props.variant }))}>{props.value}</dd>
        {props.subtitle && <dd className="mt-1 text-sm text-muted-foreground">{props.subtitle}</dd>}
      </CardContent>
    </Card>
  );
}
