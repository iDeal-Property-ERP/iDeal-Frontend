'use client';

import { cn } from '@/libs/utils';

export type MethodOption = { value: string; label: string };

/**
 * A segmented control for choosing a payment/payout method — the muted track +
 * lifted `card` thumb treatment from the Figma Record-payment dialog and the
 * mobile Mark-paid sheet. Selection changes fill + thumb (never colour alone),
 * every segment is a ≥44px touch target, and the active one carries a soft
 * shadow. Entity-agnostic: callers pass their own method options.
 * @param props - The options, the selected value, and the change handler.
 * @returns The segmented method picker.
 */
export function MethodSegmented(props: {
  options: MethodOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', props.className)}>
      {props.label ? (
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {props.label}
        </span>
      ) : null}
      <div
        role="radiogroup"
        aria-label={props.label}
        className="flex gap-1 rounded-[12px] border border-border bg-muted p-1"
      >
        {props.options.map((option) => {
          const active = option.value === props.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={props.label ?? 'segmented'}
                value={option.value}
                checked={active}
                onChange={() => props.onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
