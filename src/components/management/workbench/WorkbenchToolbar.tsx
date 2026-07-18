'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/libs/utils';
import { FilterChip } from './FilterChip';
import type { FilterOption } from './FilterChip';
import { SearchField } from './SearchField';
import { SortMenu } from './SortMenu';
import type { SortOption } from './SortMenu';

export type ChipFilter = {
  id: string;
  label: string;
  /** Placeholder for the "any" option in the collapsed panel, e.g. "All districts". */
  anyLabel: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
};

export type ColumnToggle = { id: string; label: string; visible: boolean; disabled?: boolean };

type ToolbarLabels = {
  filters: string;
  clearAll: string;
  filtersTitle: string;
  done: string;
  columns: string;
  sort: string;
  search: { placeholder: string; aria: string; clear: string };
};

/**
 * The filter controls shared between the desktop popover and the mobile bottom
 * sheet: one select per chip filter plus the sort select.
 * @param props - Chip filters, sort config, labels, and a close callback.
 * @returns The filter panel body.
 */
function FilterPanel(props: {
  filters: ChipFilter[];
  sort: { value: string; options: SortOption[]; onChange: (value: string) => void };
  labels: ToolbarLabels;
  extraPanel?: ReactNode;
  onClearAll: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground">{props.labels.filtersTitle}</p>
      {props.extraPanel}
      {props.filters.map((filter) => (
        <div key={filter.id} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
          <Select
            value={filter.value ?? '__all'}
            onValueChange={(next) => filter.onChange(next === '__all' ? null : next)}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{filter.anyLabel}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{props.labels.sort}</span>
        <Select value={props.sort.value} onValueChange={(v) => props.sort.onChange(v)}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.sort.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={props.onClearAll}>
          {props.labels.clearAll}
        </Button>
        <Button size="sm" onClick={props.onClose}>
          {props.labels.done}
        </Button>
      </div>
    </div>
  );
}

/**
 * The workbench toolbar: search + inline filter chips + a responsive Filters
 * entry (popover on desktop, bottom sheet on mobile) on the left; sort and
 * column-visibility controls on the right. Sticky within the workbench so it
 * stays reachable while the table scrolls. Entity-agnostic — every list screen
 * feeds it its own chip/sort/column definitions.
 * @param props - Search, chip filters, sort, columns, labels, and active count.
 * @returns The toolbar element.
 */
export function WorkbenchToolbar(props: {
  search: { value: string; onChange: (value: string) => void };
  filters: ChipFilter[];
  sort: { value: string; options: SortOption[]; onChange: (value: string) => void };
  columns?: { options: ColumnToggle[]; onToggle: (id: string) => void };
  /** Extra inline control after the chips on desktop (e.g. a date-range chip). */
  extra?: ReactNode;
  /** The same control's collapsed form inside the mobile/popover filter panel. */
  extraPanel?: ReactNode;
  labels: ToolbarLabels;
  activeFilterCount: number;
  onClearAll: () => void;
}) {
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtersButtonBody: ReactNode = (
    <>
      <SlidersHorizontal className="size-4" />
      {props.labels.filters}
      {props.activeFilterCount > 0 ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary-subtle-foreground tabular-nums">
          {props.activeFilterCount}
        </span>
      ) : null}
    </>
  );
  const filtersButtonClass = 'h-9 gap-2 rounded-[10px] px-3 shadow-none';

  const panel = (
    <FilterPanel
      filters={props.filters}
      sort={props.sort}
      labels={props.labels}
      extraPanel={props.extraPanel}
      onClearAll={() => {
        props.onClearAll();
        setFiltersOpen(false);
      }}
      onClose={() => setFiltersOpen(false)}
    />
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <SearchField
          value={props.search.value}
          onChange={(v) => props.search.onChange(v)}
          placeholder={props.labels.search.placeholder}
          ariaLabel={props.labels.search.aria}
          clearLabel={props.labels.search.clear}
          className="w-full sm:w-[280px]"
        />
        <div className="hidden items-center gap-2.5 lg:flex">
          {props.filters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              value={filter.value}
              options={filter.options}
              onChange={(v) => filter.onChange(v)}
              clearLabel={props.labels.clearAll}
            />
          ))}
          {props.extra}
        </div>

        {isMobile ? (
          <>
            <Button
              variant="outline"
              className={filtersButtonClass}
              aria-label={props.labels.filters}
              onClick={() => setFiltersOpen(true)}
            >
              {filtersButtonBody}
            </Button>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetContent side="bottom" className="gap-0 px-4 pt-8 pb-6">
                {panel}
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={filtersButtonClass}
                aria-label={props.labels.filters}
              >
                {filtersButtonBody}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              {panel}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <SortMenu
          options={props.sort.options}
          value={props.sort.value}
          onChange={(v) => props.sort.onChange(v)}
          label={props.labels.sort}
        />
        {props.columns ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={props.labels.columns}
                className={cn('size-9 rounded-[10px] shadow-none')}
              >
                <SlidersHorizontal className="size-4 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{props.labels.columns}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {props.columns.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.id}
                  checked={option.visible}
                  disabled={option.disabled}
                  onSelect={(event) => {
                    event.preventDefault();
                    props.columns?.onToggle(option.id);
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
