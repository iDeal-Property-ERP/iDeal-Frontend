'use client';

import { cn } from '@/libs/utils';

export type RecordTab = { id: string; label: string };

/**
 * The record-panel tab bar — underline tabs (Overview / Payments / …) with a 2px
 * primary underline on the active tab, matching the workbench's tab treatment at
 * panel scale.
 * @param props - The tabs, the active tab id, and a change handler.
 * @returns The tab bar element.
 */
export function RecordPanelTabs(props: {
  tabs: RecordTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="w-full border-b border-border">
      <div role="tablist" aria-label="Record sections" className="flex gap-5 overflow-x-auto">
        {props.tabs.map((tab) => {
          const isActive = tab.id === props.active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => props.onChange(tab.id)}
              className={cn(
                'relative -mb-px shrink-0 rounded-t-sm pb-2 text-sm font-medium whitespace-nowrap transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
