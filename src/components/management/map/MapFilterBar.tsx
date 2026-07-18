'use client';

import { FilterChip } from '@/components/management/workbench/FilterChip';
import type { FilterOption } from '@/components/management/workbench/FilterChip';
import { SearchField } from '@/components/management/workbench/SearchField';

export type MapFilterChip = {
  id: string;
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
};

/**
 * The portfolio-map toolbar — a search field plus Status/District/Rooms/Price
 * filter chips, per the Figma map header. Filtering re-fetches the map rows.
 * @param props - The search state, the chip filters, and translated labels.
 * @returns The map filter bar element.
 */
export function MapFilterBar(props: {
  search: { value: string; onChange: (value: string) => void };
  chips: MapFilterChip[];
  labels: { searchPlaceholder: string; searchAria: string; clear: string };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <SearchField
        value={props.search.value}
        onChange={(v) => props.search.onChange(v)}
        placeholder={props.labels.searchPlaceholder}
        ariaLabel={props.labels.searchAria}
        clearLabel={props.labels.clear}
        className="w-full sm:w-64"
      />
      {props.chips.map((chip) => (
        <FilterChip
          key={chip.id}
          label={chip.label}
          value={chip.value}
          options={chip.options}
          onChange={(v) => chip.onChange(v)}
          clearLabel={props.labels.clear}
        />
      ))}
    </div>
  );
}
