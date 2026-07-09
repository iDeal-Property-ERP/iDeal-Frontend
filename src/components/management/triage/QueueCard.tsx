'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/libs/utils';

/**
 * A single queue-list card in the triage left rail. Renders the shared selected
 * treatment (a `primary-subtle` wash with a 3px accent inset bar), an optional
 * unread accent dot, and scrolls itself into view when it becomes the keyboard
 * selection. The card body is fully slotted so each queue supplies its own rows.
 * @param props - Selection + unread state, the click handler, and the body slot.
 * @returns The queue card element.
 */
export function QueueCard(props: {
  selected: boolean;
  unread?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { selected } = props;

  useEffect(() => {
    if (selected) {
      ref.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [selected]);

  return (
    <button
      ref={ref}
      type="button"
      aria-current={props.selected}
      onClick={props.onSelect}
      className={cn(
        'relative w-full rounded-[12px] border px-3.5 py-3 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        props.selected
          ? 'border-transparent bg-primary-subtle'
          : 'border-border bg-card hover:border-ring/40',
      )}
    >
      {props.selected ? (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent-brand" />
      ) : null}
      {props.unread ? (
        <span className="absolute top-3.5 right-3.5 size-2 rounded-full bg-accent-brand" />
      ) : null}
      {props.children}
    </button>
  );
}
