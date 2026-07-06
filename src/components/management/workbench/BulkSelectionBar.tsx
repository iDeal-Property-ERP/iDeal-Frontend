'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

/**
 * The floating bulk-action bar — a navy pill centered over the workbench, raised
 * clear of the pagination row. It slides up when the first row is selected and
 * carries the selection count, caller-supplied actions, and a clear (×) button.
 * Entity-agnostic: the caller passes the actions (e.g. Change status, Export).
 * @param props - Whether it's open, the count label, action slot, and clear
 *   handler/label.
 * @returns The bulk selection bar (or null when nothing is selected).
 */
export function BulkSelectionBar(props: {
  open: boolean;
  countLabel: string;
  actions: ReactNode;
  onClear: () => void;
  clearLabel: string;
}) {
  if (!props.open) {
    return null;
  }
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center px-4',
        'lg:left-[252px]',
      )}
    >
      <output className="pointer-events-auto flex h-12 items-center gap-1 rounded-full bg-primary pr-1.5 pl-4 text-primary-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
        <span className="text-sm font-medium whitespace-nowrap tabular-nums">
          {props.countLabel}
        </span>
        <span className="mx-1 h-5 w-px bg-primary-foreground/25" />
        <div className="flex items-center gap-0.5">{props.actions}</div>
        <span className="mx-0.5 h-5 w-px bg-primary-foreground/25" />
        <button
          type="button"
          aria-label={props.clearLabel}
          onClick={props.onClear}
          className="flex size-9 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </output>
    </div>
  );
}
