'use client';

import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/libs/utils';

type DatePickerProps = {
  // ISO date string `YYYY-MM-DD` or empty.
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  className?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISO(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) {
    return undefined;
  }
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Date picker built on the shadcn Calendar (react-day-picker) inside a Popover.
// Emits a `YYYY-MM-DD` string — the format the API expects.
function DatePicker(props: DatePickerProps) {
  const { value, onChange, placeholder = 'Pick a date', disabled, id, className } = props;
  const selected = parseISO(value);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={props['aria-invalid']}
          className={cn(
            'w-full justify-start font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? formatDisplay(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toISO(date));
              setOpen(false);
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
