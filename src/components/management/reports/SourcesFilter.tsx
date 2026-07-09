'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type SourceOption = { value: string; label: string };

/**
 * The P&L "Sources" multi-select — a single chip ("Sources · All" / "· N") that
 * opens a checkbox list of revenue/expense streams to include, per the Figma
 * design. Include/exclude drives the `sources` query param; at least one source
 * stays selected.
 * @param props - The options, the selected values, the change handler, labels.
 * @returns The sources filter chip element.
 */
export function SourcesFilter(props: {
  options: SourceOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  labels: { title: string; all: string; count: (n: number) => string };
}) {
  const allSelected = props.selected.length === props.options.length;
  const summary = allSelected ? props.labels.all : props.labels.count(props.selected.length);

  const toggle = (value: string) => {
    const has = props.selected.includes(value);
    if (has && props.selected.length === 1) {
      return; // keep at least one source selected
    }
    props.onChange(has ? props.selected.filter((s) => s !== value) : [...props.selected, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {props.labels.title} · {summary}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        {props.options.map((option) => {
          const checked = props.selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2.5">
                <Checkbox checked={checked} tabIndex={-1} aria-hidden />
                {option.label}
              </span>
              {checked ? <Check className="size-4 text-primary" /> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
