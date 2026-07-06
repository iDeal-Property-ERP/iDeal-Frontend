'use client';

import { cn } from '@/libs/utils';

export type SavedView = {
  id: string;
  label: string;
  count?: number;
};

/**
 * Saved-view tabs — underline tabs with count pills that switch the workbench's
 * primary filter (e.g. All / Rented / Vacant). Replaces hunting through a status
 * dropdown for the common case. The active tab shows a 2px primary underline and
 * a primary-subtle count pill; selection never relies on color alone (label +
 * underline + pill weight).
 * @param props - The views, the active view id, and a change handler.
 * @returns The saved-view tab row.
 */
export function SavedViewTabs(props: {
  views: SavedView[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Saved views"
      className="flex items-center gap-6 overflow-x-auto border-b border-border"
    >
      {props.views.map((view) => {
        const isActive = view.id === props.active;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => props.onChange(view.id)}
            className={cn(
              'relative -mb-px flex shrink-0 items-center gap-2 rounded-t-sm pb-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {view.label}
            {typeof view.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-primary-subtle text-primary-subtle-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {view.count}
              </span>
            ) : null}
            {isActive ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
