'use client';

import type { ReactNode } from 'react';

/**
 * The sticky bottom action bar for the mobile Payments selection mode (Figma
 * "N selected · $sum" + primary/secondary actions). Fixed to the bottom of the
 * viewport above the tab bar; only rendered while in selection mode with rows
 * chosen.
 * @param props - Open state, the count/sum label, actions, and cancel control.
 * @returns The mobile bulk bar, or null when closed.
 */
export function MobileBulkBar(props: {
  open: boolean;
  summary: string;
  cancelLabel: string;
  onCancel: () => void;
  actions: ReactNode;
}) {
  if (!props.open) {
    return null;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-8px_24px_-12px_rgba(11,18,32,0.25)] lg:hidden">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground tabular-nums">{props.summary}</span>
        <button
          type="button"
          onClick={props.onCancel}
          className="text-sm font-medium text-muted-foreground"
        >
          {props.cancelLabel}
        </button>
      </div>
      <div className="flex items-center gap-2.5">{props.actions}</div>
    </div>
  );
}
