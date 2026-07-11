'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/libs/utils';

export type FilterOption = { value: string; label: string };

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
  /** The currently selected value, or null when the group is unset. */
  value: string | null;
  /** Toggles a value; passing null clears the group. */
  onChange: (value: string | null) => void;
};

/**
 * The mobile filter bottom-sheet (Figma "M · Filters") — a grabber sheet with a
 * title + Reset, one horizontally-scrollable chip row per filter group (single
 * select; tapping the active chip clears it), and a Cancel / "Show N results"
 * footer. Entity-agnostic: the caller supplies the groups (Status, District,
 * Sort, …) bound to its own query state, so the same sheet serves every mobile
 * workbench.
 * @param props - Open state, the filter groups, footer labels, and handlers.
 * @returns The mobile filter sheet.
 */
export function MobileFilterSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  resetLabel: string;
  cancelLabel: string;
  applyLabel: string;
  onReset: () => void;
  groups: FilterGroup[];
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85svh] gap-0 rounded-t-[20px] px-4 pt-3 pb-4">
        <span className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border" />
        <SheetHeader className="flex-row items-center justify-between gap-3 p-0 text-left">
          <SheetTitle className="font-display text-[22px] font-bold tracking-[-0.3px]">
            {props.title}
          </SheetTitle>
          <button
            type="button"
            onClick={props.onReset}
            className="text-sm font-medium text-accent-brand"
          >
            {props.resetLabel}
          </button>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-5">
          {props.groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {group.label}
              </span>
              <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
                {group.options.map((option) => {
                  const active = group.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => group.onChange(active ? null : option.value)}
                      className={cn(
                        'flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        active
                          ? 'border-transparent bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground',
                      )}
                    >
                      {active ? <Check className="size-4" /> : null}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-border pt-3.5">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={() => props.onOpenChange(false)}
          >
            {props.cancelLabel}
          </Button>
          <Button className="h-12 flex-[2]" onClick={() => props.onOpenChange(false)}>
            {props.applyLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
