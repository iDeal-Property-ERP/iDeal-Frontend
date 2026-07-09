'use client';

import { CheckCircle2, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { cn } from '@/libs/utils';

const BUTTON_WIDTH = 76;

export type SwipeActionTone = 'success' | 'accent' | 'warning' | 'danger' | 'info';

export type SwipeAction = {
  label: string;
  icon: LucideIcon;
  tone: SwipeActionTone;
  onAction: () => void;
};

const TONE_BG: Record<SwipeActionTone, string> = {
  success: 'bg-success',
  accent: 'bg-accent-brand',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

type SwipeActionRowProps = {
  children: ReactNode;
  className?: string;
  /** Explicit quick-actions (revealed on swipe-left). */
  actions?: SwipeAction[];
  // --- Back-compat: the Payments/Maintenance/Services Paid+Remind pair ---
  onPaid?: () => void;
  onRemind?: () => void;
  paidLabel?: string;
  remindLabel?: string;
};

/**
 * A swipeable list row (Figma "Swipe left on a row → quick actions"). Dragging
 * left reveals up to a few tone-colored quick actions behind the card; releasing
 * past a threshold snaps them open, tapping the card or an action closes it. The
 * same actions are always reachable from selection mode + the record panel.
 * Pass `actions` for arbitrary quick actions, or the legacy `onPaid`/`onRemind`
 * pair.
 * @param props - Row content plus either an `actions` array or the paid/remind pair.
 * @returns The swipeable row.
 */
export function SwipeActionRow(props: SwipeActionRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const fallback: SwipeAction[] = [];
  if (props.onPaid) {
    fallback.push({
      label: props.paidLabel ?? '',
      icon: CheckCircle2,
      tone: 'success',
      onAction: props.onPaid,
    });
  }
  if (props.onRemind) {
    fallback.push({
      label: props.remindLabel ?? '',
      icon: Send,
      tone: 'accent',
      onAction: props.onRemind,
    });
  }
  const actions: SwipeAction[] = props.actions ?? fallback;

  const actionsWidth = actions.length * BUTTON_WIDTH;

  const onTouchStart = (event: React.TouchEvent) => {
    startX.current = event.touches[0]?.clientX ?? null;
    dragging.current = true;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!dragging.current || startX.current === null) {
      return;
    }
    const delta = (event.touches[0]?.clientX ?? 0) - startX.current;
    setOffset(Math.max(-actionsWidth, Math.min(0, delta)));
  };

  const onTouchEnd = () => {
    dragging.current = false;
    setOffset((current) => (current < -actionsWidth / 2 ? -actionsWidth : 0));
  };

  const close = () => setOffset(0);

  return (
    <div className={cn('relative overflow-hidden rounded-[14px]', props.className)}>
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                action.onAction();
                close();
              }}
              className={cn(
                'flex w-[76px] flex-col items-center justify-center gap-1 text-xs font-medium text-white',
                TONE_BG[action.tone],
              )}
            >
              <Icon className="size-5" />
              {action.label}
            </button>
          );
        })}
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
