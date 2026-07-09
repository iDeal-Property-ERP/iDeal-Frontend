import type { LucideIcon } from 'lucide-react';
import { cn } from '@/libs/utils';

/**
 * A KPI metric tile for the P&L report — an overline label with an optional
 * icon chip, a large numeric value, and a caption (trend or share line). Matches
 * the Figma P&L summary tiles.
 * @param props - The label, value, caption, optional icon, and caption tone.
 * @returns The metric tile element.
 */
export function MetricTile(props: {
  label: string;
  value: string;
  caption?: string;
  icon?: LucideIcon;
  captionTone?: 'muted' | 'success';
}) {
  const Icon = props.icon;
  return (
    <div className="flex flex-col gap-2 rounded-[16px] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {props.label}
        </span>
        {Icon ? (
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-primary-subtle text-primary-subtle-foreground">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <span className="font-display text-[32px] leading-none font-bold text-foreground tabular-nums">
        {props.value}
      </span>
      {props.caption ? (
        <span
          className={cn(
            'text-sm',
            props.captionTone === 'success' ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {props.caption}
        </span>
      ) : null}
    </div>
  );
}
