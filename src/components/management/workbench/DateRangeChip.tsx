'use client';

import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/libs/utils';

export type DateRangeValue = { from?: string; to?: string };

/**
 * Converts an ISO date string to a local Date (or undefined when unparseable).
 * @param iso - The ISO date string.
 * @returns The Date, or undefined.
 */
function toDate(iso?: string): Date | undefined {
  if (!iso) {
    return undefined;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Formats a Date as a yyyy-mm-dd string in local time.
 * @param date - The date.
 * @returns The ISO date string.
 */
function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Short label ("Jun 1") for the chip trigger.
 * @param iso - The ISO date string.
 * @returns The short label.
 */
function shortLabel(iso?: string): string {
  const date = toDate(iso);
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}

/**
 * A chip-styled date-range control — a pill trigger opening a Popover with a
 * two-month range Calendar. Matches the Figma Discovery filter toolbar's date
 * pill; shows the selected range inline with a clear (×) button. Used for the
 * Payments due-date range and the Payouts scheduled-date range.
 * @param props - The label, current value, change handler, and labels.
 * @returns The date-range chip.
 */
export function DateRangeChip(props: {
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  clearLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(props.value.from ?? props.value.to);
  const range: DateRange | undefined = props.value.from
    ? { from: toDate(props.value.from), to: toDate(props.value.to) }
    : undefined;

  const triggerLabel = hasValue
    ? `${shortLabel(props.value.from)}${props.value.to ? ` – ${shortLabel(props.value.to)}` : ''}`
    : props.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
            hasValue
              ? 'border-primary-subtle bg-primary-subtle text-primary-subtle-foreground'
              : 'border-border bg-card text-muted-foreground hover:text-foreground',
            props.className,
          )}
        >
          <CalendarDays className="size-4" />
          {triggerLabel}
          {hasValue ? (
            <button
              type="button"
              aria-label={props.clearLabel}
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10"
              onClick={(event) => {
                event.stopPropagation();
                props.onChange({});
              }}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={(next: DateRange | undefined) =>
            props.onChange({
              from: next?.from ? toIso(next.from) : undefined,
              to: next?.to ? toIso(next.to) : undefined,
            })
          }
        />
      </PopoverContent>
    </Popover>
  );
}
