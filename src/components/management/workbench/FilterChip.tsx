'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/libs/utils';

export type FilterOption = { value: string; label: string };

/**
 * A single-select filter chip per the States-page spec: a bordered pill showing
 * the filter name, or — when a value is selected — a primary-subtle pill showing
 * the chosen value with a clear (×) affordance in its menu. The open menu marks
 * the selected row with a check.
 * @param props - Label, current value, options, and change handler plus labels.
 * @returns The filter chip element.
 */
export function FilterChip(props: {
  label: string;
  value?: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  clearLabel: string;
  className?: string;
}) {
  const selected = props.options.find((option) => option.value === props.value);
  const isActive = Boolean(selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={props.label}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-sm font-medium whitespace-nowrap transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isActive
              ? 'border-transparent bg-primary-subtle text-primary-subtle-foreground'
              : 'border-border bg-card text-foreground hover:bg-muted/60',
            props.className,
          )}
        >
          {isActive ? selected?.label : props.label}
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
        {isActive ? (
          <>
            <DropdownMenuItem onSelect={() => props.onChange(null)}>
              <X className="size-4" />
              {props.clearLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {props.options.map((option) => {
          const active = option.value === props.value;
          return (
            <DropdownMenuItem key={option.value} onSelect={() => props.onChange(option.value)}>
              <span className={cn('flex-1', active && 'font-medium text-foreground')}>
                {option.label}
              </span>
              {active ? <Check className="size-4 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
