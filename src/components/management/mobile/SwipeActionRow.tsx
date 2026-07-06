'use client';

import { CheckCircle2, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { cn } from '@/libs/utils';

const ACTION_WIDTH = 152; // two 76px action buttons revealed on swipe-left

/**
 * A swipeable list row (Figma "Swipe left on a row → quick actions"). Dragging
 * left reveals a success "Paid" action and an accent "Remind" action behind the
 * card; releasing past a threshold snaps them open, tapping the card or an action
 * closes it. Falls back to a plain row for non-touch interaction — the same
 * actions are always reachable from selection mode + the record panel.
 * @param props - Row content, the paid/remind handlers, and their labels.
 * @returns The swipeable row.
 */
export function SwipeActionRow(props: {
  children: ReactNode;
  onPaid: () => void;
  onRemind: () => void;
  paidLabel: string;
  remindLabel: string;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const onTouchStart = (event: React.TouchEvent) => {
    startX.current = event.touches[0]?.clientX ?? null;
    dragging.current = true;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!dragging.current || startX.current === null) {
      return;
    }
    const delta = (event.touches[0]?.clientX ?? 0) - startX.current;
    // Only track leftward drags; clamp to the actions width.
    setOffset(Math.max(-ACTION_WIDTH, Math.min(0, delta)));
  };

  const onTouchEnd = () => {
    dragging.current = false;
    setOffset((current) => (current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0));
  };

  const close = () => setOffset(0);

  return (
    <div className={cn('relative overflow-hidden rounded-[14px]', props.className)}>
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          onClick={() => {
            props.onPaid();
            close();
          }}
          className="flex w-[76px] flex-col items-center justify-center gap-1 bg-success text-xs font-medium text-white"
        >
          <CheckCircle2 className="size-5" />
          {props.paidLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            props.onRemind();
            close();
          }}
          className="flex w-[76px] flex-col items-center justify-center gap-1 bg-accent-brand text-xs font-medium text-white"
        >
          <Send className="size-5" />
          {props.remindLabel}
        </button>
      </div>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className="relative touch-pan-y transition-transform"
      >
        {props.children}
      </div>
    </div>
  );
}
