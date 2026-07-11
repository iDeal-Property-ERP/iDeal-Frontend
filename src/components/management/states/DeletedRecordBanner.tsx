'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';

/**
 * Danger-toned inline banner shown after a record is deleted — a trash icon,
 * a "this record was deleted" message, an optional undo-window countdown
 * caption, and a Restore action wired to the caller's undo handler.
 * @param props - The banner message, restore label/handler, an optional
 *   countdown caption, and extra classes.
 * @returns The deleted-record banner element.
 */
export function DeletedRecordBanner(props: {
  message: string;
  restoreLabel: string;
  onRestore: () => void;
  /** Undo-window caption, e.g. "Permanent in 25s". */
  countdownLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[12px] border border-danger/30 bg-danger-subtle px-4 py-3',
        props.className,
      )}
    >
      <Trash2 className="size-5 shrink-0 text-danger" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-medium text-danger-subtle-foreground">{props.message}</p>
        {props.countdownLabel ? (
          <p className="text-xs text-danger-subtle-foreground/80">{props.countdownLabel}</p>
        ) : null}
      </div>
      <Button variant="outline" size="sm" onClick={props.onRestore} className="shrink-0 bg-card">
        {props.restoreLabel}
      </Button>
    </div>
  );
}
