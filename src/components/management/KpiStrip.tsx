'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/libs/utils';

type DeltaTone = 'success' | 'danger' | 'muted';

export type KpiItem = {
  id: string;
  /** Overline label, e.g. "Occupancy rate". */
  label: string;
  /** The big numeric value, e.g. "87%" or "$64,200". */
  value: string;
  icon: LucideIcon;
  /** Delta chip text, e.g. "+4.2%". */
  delta?: string;
  deltaDirection?: 'up' | 'down';
  /** Semantic tone of the delta (a fall in vacancy cost is still "good"). */
  deltaTone?: DeltaTone;
  /** Sublabel after the delta, e.g. "vs last month". */
  sublabel?: string;
  /** When set, the whole card becomes a filter shortcut button. */
  onClick?: () => void;
  active?: boolean;
};

const deltaToneClass: Record<DeltaTone, string> = {
  success: 'text-success',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
};

/**
 * A single KPI card: overline label + icon badge, a large numeric value, and an
 * optional delta chip with a directional arrow. Becomes a clickable filter
 * shortcut when `onClick` is provided.
 * @param props - The KPI item to render.
 * @returns The KPI card element.
 */
export function KpiCard(props: KpiItem) {
  const Icon = props.icon;
  const Arrow = props.deltaDirection === 'down' ? ArrowDownRight : ArrowUpRight;
  const tone = props.deltaTone ?? 'success';

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {props.label}
        </span>
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary-subtle text-primary-subtle-foreground">
          <Icon className="size-[17px]" strokeWidth={1.75} />
        </span>
      </div>
      <p className="font-display text-[40px] leading-[44px] font-extrabold tracking-[-0.4px] text-foreground tabular-nums">
        {props.value}
      </p>
      {props.delta || props.sublabel ? (
        <div className="flex items-center gap-1.5 text-sm">
          {props.delta ? (
            <span className={cn('flex items-center gap-0.5 font-medium', deltaToneClass[tone])}>
              <Arrow className="size-3.5" strokeWidth={2} />
              {props.delta}
            </span>
          ) : null}
          {props.sublabel ? <span className="text-muted-foreground">{props.sublabel}</span> : null}
        </div>
      ) : null}
    </>
  );

  const base =
    'flex flex-1 flex-col gap-3 rounded-[16px] border bg-card p-5 text-left shadow-sm transition-colors';

  if (props.onClick) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        aria-pressed={props.active}
        className={cn(
          base,
          'outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          props.active ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border',
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={cn(base, 'border-border')}>{body}</div>;
}

/**
 * A row of up to four KPI cards with the Figma 16px gap; wraps to a 2×2 grid on
 * tablet and a horizontal snap-scroll on mobile.
 * @param props - The KPI items to render.
 * @returns The KPI strip element.
 */
export function KpiStrip(props: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:flex lg:flex-row">
      {props.items.map((item) => (
        <KpiCard key={item.id} {...item} />
      ))}
    </div>
  );
}
