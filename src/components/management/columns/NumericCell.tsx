import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

/**
 * A right-aligned, tabular-figures numeric cell for money and counts, so digits
 * line up cleanly down a column.
 * @param props - The value, an optional muted tone, and class.
 * @returns The numeric cell element.
 */
export function NumericCell(props: { children: ReactNode; muted?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'block text-right text-sm tabular-nums',
        props.muted ? 'text-muted-foreground' : 'text-foreground',
        props.className,
      )}
    >
      {props.children}
    </span>
  );
}
