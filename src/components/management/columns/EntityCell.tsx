import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

/**
 * The primary entity cell for workbench tables: a thumbnail beside a bold name
 * and a muted secondary line (e.g. address). Truncates gracefully in narrow
 * columns. Reused by every list screen's first column.
 * @param props - Thumbnail node, name, optional secondary line, and class.
 * @returns The entity cell element.
 */
export function EntityCell(props: {
  thumbnail?: ReactNode;
  name: string;
  secondary?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', props.className)}>
      {props.thumbnail}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{props.name}</div>
        {props.secondary ? (
          <div className="truncate text-xs text-muted-foreground">{props.secondary}</div>
        ) : null}
      </div>
    </div>
  );
}
