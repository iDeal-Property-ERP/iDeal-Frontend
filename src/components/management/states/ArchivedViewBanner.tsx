'use client';

import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';

/**
 * Inline banner shown while viewing an archived record — an archive icon, a
 * "this record is archived" message, and a Restore action. Renders above the
 * record content, never as a blocking dialog.
 * @param props - The banner message, restore label/handler, and extra classes.
 * @returns The archived-view banner element.
 */
export function ArchivedViewBanner(props: {
  message: string;
  restoreLabel: string;
  onRestore: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[12px] border border-warning/30 bg-warning-subtle px-4 py-3',
        props.className,
      )}
    >
      <Archive className="size-5 shrink-0 text-warning-subtle-foreground" strokeWidth={1.75} />
      <p className="flex-1 text-sm font-medium text-warning-subtle-foreground">{props.message}</p>
      <Button variant="outline" size="sm" onClick={props.onRestore} className="shrink-0 bg-card">
        {props.restoreLabel}
      </Button>
    </div>
  );
}
