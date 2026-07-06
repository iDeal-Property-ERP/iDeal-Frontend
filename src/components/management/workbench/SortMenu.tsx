'use client';

import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/libs/utils';

export type SortOption = { value: string; label: string };

/**
 * The results sort menu — "Sort: Newest" style trigger with a checked-selection
 * dropdown. Sits in the toolbar's right cluster.
 * @param props - Options, current value, change handler, and the "Sort" label.
 * @returns The sort menu element.
 */
export function SortMenu(props: {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const current = props.options.find((option) => option.value === props.value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            props.className,
          )}
        >
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">{props.label}:</span>
          <span className="whitespace-nowrap">{current?.label}</span>
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
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
