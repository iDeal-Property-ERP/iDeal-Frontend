'use client';

import type { ReactNode } from 'react';

type ModuleListCardProps = {
  title: string;
  subtitle?: string;
  /** A status pill / secondary line rendered under the subtitle. */
  meta?: ReactNode;
  /** Leading visual (thumbnail / avatar). */
  leading?: ReactNode;
  /** Right-aligned value (e.g. rent). */
  value?: ReactNode;
  valueSuffix?: string;
  onClick: () => void;
};

/**
 * A uniform mobile list card (≥64px tap target) used by every admin module's
 * mobile workbench — leading visual, title + subtitle + meta on the left, and an
 * optional value on the right.
 * @param props - The card content and tap handler.
 * @returns The list card button.
 */
export function ModuleListCard(props: ModuleListCardProps) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex w-full items-center gap-3 rounded-[16px] border border-border bg-card p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-muted/40"
    >
      {props.leading ? <div className="shrink-0">{props.leading}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-medium text-foreground">{props.title}</span>
        {props.subtitle ? (
          <span className="truncate text-xs text-muted-foreground">{props.subtitle}</span>
        ) : null}
        {props.meta ? <div className="flex items-center gap-2">{props.meta}</div> : null}
      </div>
      {props.value !== undefined ? (
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[15px] font-semibold text-foreground tabular-nums">
            {props.value}
          </span>
          {props.valueSuffix ? (
            <span className="text-xs text-muted-foreground">{props.valueSuffix}</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
